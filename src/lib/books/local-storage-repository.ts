import type { BookRepository } from "./repository";
import { SEED_BOOKS } from "./seed";
import type { Book, BookInput, BookPatch } from "./types";

const STORAGE_KEY = "bookshelf:v1:books";

function read(): Book[] {
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (raw === null) {
    write(SEED_BOOKS);
    return SEED_BOOKS;
  }
  try {
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as Book[]) : [];
  } catch {
    return [];
  }
}

function write(books: Book[]) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(books));
}

function now() {
  return new Date().toISOString();
}

export function createLocalStorageRepository(): BookRepository {
  return {
    async list() {
      return read();
    },

    async create(input: BookInput) {
      const book: Book = {
        ...input,
        id: crypto.randomUUID(),
        createdAt: now(),
        updatedAt: now(),
      };
      write([...read(), book]);
      return book;
    },

    async update(id: string, patch: BookPatch) {
      const books = read();
      const index = books.findIndex((b) => b.id === id);
      if (index === -1) throw new Error(`No book with id ${id}`);
      const updated: Book = { ...books[index], ...patch, updatedAt: now() };
      books[index] = updated;
      write(books);
      return updated;
    },

    async remove(id: string) {
      write(read().filter((b) => b.id !== id));
    },

    async replaceAll(books: Book[]) {
      write(books);
      return books;
    },
  };
}
