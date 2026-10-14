import type { Book } from "./types";

/**
 * Genres are free text, so "science fiction" and "Science Fiction" would show up
 * as two genres. Every genre is stored with each word capitalized: "Science Fiction".
 * Only first letters change, so acronyms like "LGBTQ" survive.
 */
export function formatGenre(genre: string) {
  return genre
    .trim()
    .split(/\s+/)
    .map((word) => word.charAt(0).toLocaleUpperCase() + word.slice(1))
    .join(" ");
}

export function withFormattedGenre<T extends Pick<Book, "genre">>(book: T): T {
  if (!book.genre) return book;
  const genre = formatGenre(book.genre);
  return genre === book.genre ? book : { ...book, genre };
}
