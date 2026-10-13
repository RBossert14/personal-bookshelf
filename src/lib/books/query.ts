import type { Book } from "./types";

export const SORT_OPTIONS = {
  title: "Title",
  author: "Author",
  finished: "Date finished",
  rating: "Rating",
} as const;

export type SortKey = keyof typeof SORT_OPTIONS;

export interface LibraryFilters {
  search: string;
  genres: string[];
  authors: string[];
  /** 0 means any rating. */
  minRating: number;
}

export const EMPTY_FILTERS: LibraryFilters = {
  search: "",
  genres: [],
  authors: [],
  minRating: 0,
};

export function countActiveFilters(filters: LibraryFilters) {
  return filters.genres.length + filters.authors.length + (filters.minRating > 0 ? 1 : 0);
}

export function filterBooks(books: Book[], filters: LibraryFilters) {
  const needle = filters.search.trim().toLowerCase();
  return books.filter((book) => {
    if (needle && !`${book.title} ${book.author}`.toLowerCase().includes(needle)) return false;
    if (filters.genres.length && !filters.genres.includes(book.genre ?? "")) return false;
    if (filters.authors.length && !filters.authors.includes(book.author)) return false;
    if (filters.minRating > 0 && (book.rating ?? 0) < filters.minRating) return false;
    return true;
  });
}

const collator = new Intl.Collator(undefined, { sensitivity: "base", numeric: true });

/** Sorts by author surname, so "J.R.R. Tolkien" files under T like on a real shelf. */
function surname(author: string) {
  const parts = author.trim().split(/\s+/);
  return parts[parts.length - 1] ?? author;
}

function stripArticle(title: string) {
  return title.replace(/^(the|a|an)\s+/i, "");
}

export function sortBooks(books: Book[], key: SortKey) {
  const sorted = [...books];
  switch (key) {
    case "title":
      return sorted.sort((a, b) => collator.compare(stripArticle(a.title), stripArticle(b.title)));
    case "author":
      return sorted.sort(
        (a, b) => collator.compare(surname(a.author), surname(b.author)) || collator.compare(a.title, b.title),
      );
    case "finished":
      // Most recent first; unfinished books keep their place at the end.
      return sorted.sort((a, b) => (b.finishedAt ?? "").localeCompare(a.finishedAt ?? ""));
    case "rating":
      return sorted.sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));
  }
}

export function uniqueValues(books: Book[], pick: (book: Book) => string | undefined) {
  const values = new Set<string>();
  for (const book of books) {
    const value = pick(book);
    if (value) values.add(value);
  }
  return [...values].sort(collator.compare);
}
