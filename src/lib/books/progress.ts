import type { Book } from "./types";

export interface ReadingProgress {
  page: number;
  /** Undefined when the book's page count isn't known. */
  pages?: number;
  /** 0 to 100, or undefined when the page count isn't known. */
  percent?: number;
}

/** How far through a book you are. Only books on the "Currently reading" shelf have progress. */
export function readingProgress(book: Pick<Book, "status" | "currentPage" | "pages">): ReadingProgress | null {
  if (book.status !== "reading" || book.currentPage === undefined) return null;
  const page = book.currentPage;
  if (!book.pages) return { page };
  return { page, pages: book.pages, percent: Math.min(100, Math.round((page / book.pages) * 100)) };
}
