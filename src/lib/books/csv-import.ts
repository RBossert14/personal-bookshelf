import { guessGenre } from "@/lib/open-library";

import type { Book, BookInput, ShelfStatus } from "./types";

export type CsvSource = "Goodreads" | "StoryGraph";

export interface CsvImport {
  source: CsvSource;
  books: Book[];
  /** Did-not-finish books, which have no shelf here. */
  skippedUnfinished: number;
}

/** RFC 4180 CSV: quoted fields can hold commas, newlines and doubled quotes. */
export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let quoted = false;
  const input = text.replace(/^﻿/, "");

  for (let i = 0; i < input.length; i++) {
    const char = input[i];
    if (quoted) {
      if (char === '"' && input[i + 1] === '"') {
        field += '"';
        i++;
      } else if (char === '"') {
        quoted = false;
      } else {
        field += char;
      }
    } else if (char === '"') {
      quoted = true;
    } else if (char === ",") {
      row.push(field);
      field = "";
    } else if (char === "\n" || char === "\r") {
      if (char === "\r" && input[i + 1] === "\n") i++;
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else {
      field += char;
    }
  }
  if (field || row.length) {
    row.push(field);
    rows.push(row);
  }
  return rows.filter((r) => r.some((cell) => cell.trim()));
}

type Row = Record<string, string>;

function toRecords(rows: string[][]): Row[] {
  const [header, ...body] = rows;
  return body.map((cells) => Object.fromEntries(header.map((name, i) => [name.trim(), cells[i]?.trim() ?? ""])));
}

/** "2021/03/14" or "2021-03-14" to a calendar day. */
function toDay(value: string | undefined) {
  const match = value?.match(/(\d{4})[/-](\d{1,2})[/-](\d{1,2})/);
  return match ? `${match[1]}-${match[2].padStart(2, "0")}-${match[3].padStart(2, "0")}` : undefined;
}

function toNumber(value: string | undefined) {
  const n = Number(value);
  return value && Number.isFinite(n) && n > 0 ? n : undefined;
}

/** Ratings here are half stars; StoryGraph allows quarter stars. */
function toRating(value: string | undefined) {
  const n = toNumber(value);
  return n ? Math.min(5, Math.max(0.5, Math.round(n * 2) / 2)) : undefined;
}

/** Goodreads wraps ISBNs as ="0439023483" to stop spreadsheets mangling them. */
function coverFromIsbn(...values: (string | undefined)[]) {
  for (const value of values) {
    const isbn = value?.replace(/[^0-9X]/gi, "");
    if (isbn && (isbn.length === 10 || isbn.length === 13)) {
      // default=false makes Open Library 404 when it has no cover, so the cloth cover shows instead.
      return `https://covers.openlibrary.org/b/isbn/${isbn}-L.jpg?default=false`;
    }
  }
  return undefined;
}

/** Reviews can contain HTML line breaks and tags. */
function toNotes(...values: (string | undefined)[]) {
  const text = values
    .map((v) => v?.replace(/<br\s*\/?>/gi, "\n").replace(/<[^>]+>/g, "").trim())
    .filter(Boolean)
    .join("\n\n");
  return text || undefined;
}

/** "Catching Fire (The Hunger Games, #2)" reads better on a spine as "Catching Fire". */
function stripSeries(title: string) {
  return title.replace(/\s*\([^()]*#\s*\d+(\.\d+)?\)\s*$/, "").trim() || title;
}

function isUnfinished(shelf: string) {
  return /did-?not-?finish|dnf|abandon/i.test(shelf);
}

/** Shelf names and tags are often hyphenated ("science-fiction"), so match both spellings. */
function genreFromLabels(labels: string) {
  const names = labels.split(/[,;]/).map((label) => label.trim()).filter(Boolean);
  return guessGenre(names.flatMap((name) => [name, name.replace(/-/g, " ")]));
}

type Mapped = Omit<BookInput, "status"> & { status: ShelfStatus | "unfinished"; addedAt?: string };

function fromGoodreads(row: Row): Mapped {
  const shelf = row["Exclusive Shelf"];
  const status = shelf === "read" ? "read" : shelf === "currently-reading" ? "reading" : isUnfinished(shelf) ? "unfinished" : "want";
  return {
    title: stripSeries(row["Title"]),
    author: row["Author"],
    status,
    year: toNumber(row["Original Publication Year"]) ?? toNumber(row["Year Published"]),
    pages: toNumber(row["Number of Pages"]),
    genre: genreFromLabels(row["Bookshelves"] ?? ""),
    coverUrl: coverFromIsbn(row["ISBN13"], row["ISBN"]),
    rating: status === "want" ? undefined : toRating(row["My Rating"]),
    notes: toNotes(row["Private Notes"], row["My Review"]),
    finishedAt: status === "read" ? toDay(row["Date Read"]) : undefined,
    addedAt: toDay(row["Date Added"]),
  };
}

function fromStoryGraph(row: Row): Mapped {
  const readStatus = row["Read Status"];
  const status =
    readStatus === "read"
      ? "read"
      : readStatus === "currently-reading" || readStatus === "paused"
        ? "reading"
        : isUnfinished(readStatus)
          ? "unfinished"
          : "want";
  // "Dates Read" lists each read as "start-end"; the latest read is last.
  const lastRead = row["Dates Read"]?.split(",").pop();
  return {
    title: row["Title"],
    author: row["Authors"]?.split(",")[0].trim() ?? "",
    status,
    genre: genreFromLabels(row["Tags"] ?? ""),
    coverUrl: coverFromIsbn(row["ISBN/UID"]),
    rating: status === "want" ? undefined : toRating(row["Star Rating"]),
    notes: toNotes(row["Review"]),
    startedAt: status === "want" ? undefined : toDay(lastRead),
    finishedAt: status === "read" ? toDay(row["Last Date Read"]) : undefined,
    addedAt: toDay(row["Date Added"]),
  };
}

function detectSource(header: string[]): CsvSource | null {
  if (header.includes("Exclusive Shelf") && header.includes("Book Id")) return "Goodreads";
  if (header.includes("Read Status") && header.includes("Star Rating")) return "StoryGraph";
  return null;
}

const HINT = "Choose the CSV export from Goodreads (My Books → Import and export) or StoryGraph (Manage account → Export).";

/** Reads a Goodreads or StoryGraph export. Throws with a readable message. */
export async function parseCsvExport(file: File, now = new Date()): Promise<CsvImport> {
  const rows = parseCsv(await file.text());
  const source = rows.length ? detectSource(rows[0].map((h) => h.trim())) : null;
  if (!source) throw new Error(`That doesn't look like a Goodreads or StoryGraph export. ${HINT}`);

  const mapped = toRecords(rows)
    .map(source === "Goodreads" ? fromGoodreads : fromStoryGraph)
    .filter((b) => b.title && b.author);
  const finished = mapped.filter((b): b is Mapped & { status: ShelfStatus } => b.status !== "unfinished");
  if (finished.length === 0) throw new Error(`No books found in that file. ${HINT}`);

  const stamp = now.toISOString();
  const books = finished.map(({ addedAt, ...input }): Book => {
    const created = addedAt ? `${addedAt}T12:00:00.000Z` : stamp;
    return { ...input, id: crypto.randomUUID(), createdAt: created, updatedAt: stamp };
  });
  return { source, books, skippedUnfinished: mapped.length - finished.length };
}

function bookKey(book: Pick<Book, "title" | "author">) {
  return `${book.title}|${book.author}`.toLowerCase().replace(/[^a-z0-9|]/g, "");
}

/** Splits imported books into new ones and ones already on the shelves (same title and author). */
export function splitDuplicates(existing: Book[], incoming: Book[]) {
  const seen = new Set(existing.map(bookKey));
  const fresh: Book[] = [];
  let duplicates = 0;
  for (const book of incoming) {
    const key = bookKey(book);
    if (seen.has(key)) {
      duplicates++;
    } else {
      seen.add(key);
      fresh.push(book);
    }
  }
  return { fresh, duplicates };
}
