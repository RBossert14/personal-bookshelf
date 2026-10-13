"use client";

import { BookPlusIcon, PlusIcon } from "lucide-react";
import { useMemo, useRef, useState } from "react";

import { AddBookDialog } from "@/components/add-book/add-book-dialog";
import { BookDetailDialog } from "@/components/book/book-detail-dialog";
import { Bookcase } from "@/components/bookcase/bookcase";
import { BookcaseSkeleton } from "@/components/bookcase/bookcase-skeleton";
import { StatsPanel } from "@/components/stats/stats-panel";
import { LibraryToolbar } from "@/components/toolbar/library-toolbar";
import { Button } from "@/components/ui/button";
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import {
  countActiveFilters,
  EMPTY_FILTERS,
  filterBooks,
  sortBooks,
  uniqueValues,
  type LibraryFilters,
  type SortKey,
} from "@/lib/books/query";
import { getReadingStats } from "@/lib/books/stats";
import { SHELF_STATUSES, type Book, type ShelfStatus } from "@/lib/books/types";
import { captureShelfLayout } from "@/lib/motion";

import { useLibrary } from "./library-provider";
import { LibraryMenu } from "./library-menu";

export function BookshelfApp() {
  const { books } = useLibrary();
  const [filters, setFilters] = useState<LibraryFilters>(EMPTY_FILTERS);
  const [sort, setSort] = useState<SortKey>("author");
  const [selected, setSelected] = useState<{ id: string; origin: DOMRect | null } | null>(null);
  const [adding, setAdding] = useState(false);
  const addOpener = useRef<HTMLElement | null>(null);

  const startAdding = () => {
    addOpener.current = document.activeElement as HTMLElement | null;
    setAdding(true);
  };

  const library = useMemo(() => books ?? [], [books]);
  const genres = useMemo(() => uniqueValues(library, (b) => b.genre), [library]);
  const authors = useMemo(() => uniqueValues(library, (b) => b.author), [library]);
  // Stats depend on today's date, so they're only computed once the library has loaded in the browser.
  const stats = useMemo(() => (books ? getReadingStats(books) : null), [books]);

  const visible = useMemo(() => sortBooks(filterBooks(library, filters), sort), [library, filters, sort]);
  const shelves = useMemo(() => {
    const grouped = Object.fromEntries(SHELF_STATUSES.map((s) => [s, [] as Book[]])) as Record<ShelfStatus, Book[]>;
    for (const book of visible) grouped[book.status].push(book);
    return grouped;
  }, [visible]);

  const isFiltering = filters.search.trim() !== "" || countActiveFilters(filters) > 0;
  const selectedBook = library.find((b) => b.id === selected?.id) ?? null;

  const changeFilters = (next: LibraryFilters) => {
    captureShelfLayout();
    setFilters(next);
  };
  const changeSort = (next: SortKey) => {
    captureShelfLayout();
    setSort(next);
  };

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-8 sm:gap-8 sm:px-6 sm:py-12">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="font-serif text-4xl tracking-[-0.01em] sm:text-5xl">My bookshelf</h1>
          <p className="text-muted-foreground" aria-live="polite">
            {stats
              ? `${library.length} ${library.length === 1 ? "book" : "books"} on the shelves, ${stats.booksThisYear} finished so far this year.`
              : "Taking the books down from the attic…"}
          </p>
        </div>
        <div className="flex gap-2">
          <LibraryMenu />
          <Button onClick={startAdding}>
            <PlusIcon aria-hidden />
            Add book
          </Button>
        </div>
      </header>

      <main className="flex flex-col gap-6 sm:gap-8">
        <LibraryToolbar
          filters={filters}
          onFiltersChange={changeFilters}
          sort={sort}
          onSortChange={changeSort}
          genres={genres}
          authors={authors}
        />

        <div role="status" className="empty:hidden -mt-2 text-sm">
          {isFiltering && visible.length === 0 && library.length > 0 && (
            <>
              {filters.search.trim() ? `No books match “${filters.search.trim()}”. ` : "No books match these filters. "}
              <button
                type="button"
                className="font-medium underline underline-offset-4"
                onClick={() => changeFilters(EMPTY_FILTERS)}
              >
                Clear search and filters
              </button>
            </>
          )}
        </div>

        {!books ? (
          <BookcaseSkeleton />
        ) : library.length === 0 ? (
          <Empty className="border bg-paper py-12">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <BookPlusIcon />
              </EmptyMedia>
              <EmptyTitle className="font-serif text-xl font-normal">Your shelves are empty</EmptyTitle>
              <EmptyDescription>
                Add the book you&apos;re reading now, or import a backup from the menu.
              </EmptyDescription>
            </EmptyHeader>
            <EmptyContent>
              <Button onClick={startAdding}>
                <PlusIcon aria-hidden />
                Add book
              </Button>
            </EmptyContent>
          </Empty>
        ) : (
          <Bookcase
            shelves={shelves}
            pulledId={selected?.id ?? null}
            filtered={isFiltering}
            onOpen={(book, origin) => setSelected({ id: book.id, origin })}
          />
        )}

        {stats && library.length > 0 && <StatsPanel stats={stats} />}
      </main>

      <BookDetailDialog
        book={selectedBook}
        origin={selected?.origin ?? null}
        genres={genres}
        onClose={() => setSelected(null)}
      />
      <AddBookDialog open={adding} onOpenChange={setAdding} genres={genres} returnFocus={() => addOpener.current} />
    </div>
  );
}
