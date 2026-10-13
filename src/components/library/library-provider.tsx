"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";

import { extractCoverColor } from "@/lib/cover-color";
import { createLocalStorageRepository } from "@/lib/books/local-storage-repository";
import type { BookRepository } from "@/lib/books/repository";
import type { Book, BookInput, BookPatch } from "@/lib/books/types";

interface LibraryContextValue {
  /** Null until the repository has loaded. */
  books: Book[] | null;
  addBook(input: BookInput): Promise<Book>;
  updateBook(id: string, patch: BookPatch): Promise<Book>;
  removeBook(id: string): Promise<void>;
  replaceLibrary(books: Book[]): Promise<void>;
}

const LibraryContext = createContext<LibraryContextValue | null>(null);

export function LibraryProvider({
  children,
  repository: injected,
}: {
  children: React.ReactNode;
  repository?: BookRepository;
}) {
  const [repository] = useState(() => injected ?? createLocalStorageRepository());
  const [books, setBooks] = useState<Book[] | null>(null);

  useEffect(() => {
    repository.list().then(setBooks);
  }, [repository]);

  const updateBook = useCallback(
    async (id: string, patch: BookPatch) => {
      const updated = await repository.update(id, patch);
      setBooks((current) => current?.map((b) => (b.id === id ? updated : b)) ?? null);
      return updated;
    },
    [repository],
  );

  // Fill in spine colors from covers in the background, all at once. Each
  // cover is only tried once per session, so unreadable covers aren't retried.
  const attemptedCovers = useRef(new Set<string>());
  const missingKey = useMemo(
    () =>
      (books ?? [])
        .filter((b) => b.coverUrl && !b.spineColor)
        .map((b) => `${b.id}|${b.coverUrl}`)
        .join(" "),
    [books],
  );

  useEffect(() => {
    for (const entry of missingKey.split(" ").filter(Boolean)) {
      if (attemptedCovers.current.has(entry)) continue;
      attemptedCovers.current.add(entry);
      const [id, url] = entry.split("|");
      extractCoverColor(url).then((color) => {
        if (color) void updateBook(id, { spineColor: color });
      });
    }
  }, [missingKey, updateBook]);

  const value = useMemo<LibraryContextValue>(
    () => ({
      books,
      updateBook,
      async addBook(input) {
        const book = await repository.create(input);
        setBooks((current) => [...(current ?? []), book]);
        return book;
      },
      async removeBook(id) {
        await repository.remove(id);
        setBooks((current) => current?.filter((b) => b.id !== id) ?? null);
      },
      async replaceLibrary(next) {
        setBooks(await repository.replaceAll(next));
      },
    }),
    [books, repository, updateBook],
  );

  return <LibraryContext.Provider value={value}>{children}</LibraryContext.Provider>;
}

export function useLibrary() {
  const context = useContext(LibraryContext);
  if (!context) throw new Error("useLibrary must be used inside <LibraryProvider>");
  return context;
}
