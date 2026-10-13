import type { Book, BookInput, BookPatch } from "./types";

/**
 * Everything the UI needs from storage. The app only talks to this interface,
 * so a database-backed implementation can replace localStorage without UI changes.
 */
export interface BookRepository {
  list(): Promise<Book[]>;
  create(input: BookInput): Promise<Book>;
  update(id: string, patch: BookPatch): Promise<Book>;
  remove(id: string): Promise<void>;
  /** Replaces the whole library. Used by JSON import. */
  replaceAll(books: Book[]): Promise<Book[]>;
}
