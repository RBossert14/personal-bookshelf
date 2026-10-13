import { SHELF_STATUSES, type Book } from "./types";

export function exportLibrary(books: Book[]) {
  const payload = JSON.stringify({ version: 1, exportedAt: new Date().toISOString(), books }, null, 2);
  const url = URL.createObjectURL(new Blob([payload], { type: "application/json" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = `bookshelf-${new Date().toISOString().slice(0, 10)}.json`;
  link.click();
  URL.revokeObjectURL(url);
}

function isBook(value: unknown): value is Book {
  if (typeof value !== "object" || value === null) return false;
  const b = value as Record<string, unknown>;
  return (
    typeof b.id === "string" &&
    typeof b.title === "string" &&
    typeof b.author === "string" &&
    SHELF_STATUSES.includes(b.status as Book["status"])
  );
}

/** Accepts either an export file or a bare array of books. Throws with a readable message. */
export async function parseLibraryFile(file: File): Promise<Book[]> {
  let data: unknown;
  try {
    data = JSON.parse(await file.text());
  } catch {
    throw new Error("Couldn't read that file. Choose a .json file exported from this bookshelf.");
  }
  const list = Array.isArray(data) ? data : (data as { books?: unknown })?.books;
  const hint = "Choose a .json file exported from this bookshelf.";
  if (!Array.isArray(list)) throw new Error(`No books found in that file. ${hint}`);
  const books = list.filter(isBook);
  if (books.length === 0) throw new Error(`No books found in that file. ${hint}`);
  return books;
}
