import type { Book } from "./types";

export interface MonthlyCount {
  month: string;
  books: number;
}

export interface ReadingStats {
  year: number;
  booksThisYear: number;
  pagesThisYear: number;
  favoriteGenre?: string;
  monthly: MonthlyCount[];
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export function getReadingStats(books: Book[], today = new Date()): ReadingStats {
  const year = today.getFullYear();
  const finished = books.filter((b) => b.status === "read" && b.finishedAt);
  const thisYear = finished.filter((b) => b.finishedAt!.startsWith(`${year}-`));

  const monthly = MONTHS.map((month) => ({ month, books: 0 }));
  for (const book of thisYear) {
    monthly[Number(book.finishedAt!.slice(5, 7)) - 1].books += 1;
  }

  return {
    year,
    booksThisYear: thisYear.length,
    pagesThisYear: thisYear.reduce((sum, b) => sum + (b.pages ?? 0), 0),
    favoriteGenre: favoriteGenre(finished),
    monthly,
  };
}

/** Most-read genre across all finished books, with ties going to the higher average rating. */
function favoriteGenre(finished: Book[]) {
  const tally = new Map<string, { count: number; rating: number }>();
  for (const book of finished) {
    if (!book.genre) continue;
    const entry = tally.get(book.genre) ?? { count: 0, rating: 0 };
    entry.count += 1;
    entry.rating += book.rating ?? 0;
    tally.set(book.genre, entry);
  }
  let best: string | undefined;
  let bestScore = -1;
  for (const [genre, { count, rating }] of tally) {
    const score = count * 100 + rating / count;
    if (score > bestScore) {
      best = genre;
      bestScore = score;
    }
  }
  return best;
}
