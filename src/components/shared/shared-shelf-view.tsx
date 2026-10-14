"use client";

import { LinkIcon } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { Bookcase } from "@/components/bookcase/bookcase";
import { BookcaseSkeleton } from "@/components/bookcase/bookcase-skeleton";
import { ThemeToggle } from "@/components/library/theme-toggle";
import { StatsPanel } from "@/components/stats/stats-panel";
import { LibraryToolbar } from "@/components/toolbar/library-toolbar";
import { Button } from "@/components/ui/button";
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import {
  countActiveFilters,
  countValues,
  EMPTY_FILTERS,
  filterBooks,
  sortBooks,
  type LibraryFilters,
  type SortKey,
} from "@/lib/books/query";
import { decodeShelf, type SharedShelf } from "@/lib/books/share";
import { getReadingStats } from "@/lib/books/stats";
import { SHELF_STATUSES, type Book, type ShelfStatus } from "@/lib/books/types";
import { formatDay } from "@/lib/dates";
import { captureShelfLayout } from "@/lib/motion";

import { SharedBookDialog } from "./shared-book-dialog";

type State = { status: "loading" } | { status: "invalid" } | { status: "ready"; shelf: SharedShelf };

function possessive(name: string) {
  return name.endsWith("s") ? `${name}’` : `${name}’s`;
}

/** A read-only bookcase built from the link's #fragment. */
export function SharedShelfView() {
  const [state, setState] = useState<State>({ status: "loading" });

  useEffect(() => {
    const load = () =>
      decodeShelf(window.location.hash).then(
        (shelf) => setState({ status: "ready", shelf }),
        () => setState({ status: "invalid" }),
      );
    load();
    window.addEventListener("hashchange", load);
    return () => window.removeEventListener("hashchange", load);
  }, []);

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-8 sm:gap-8 sm:px-6 sm:py-12">
      {state.status === "ready" ? (
        <SharedShelfContent shelf={state.shelf} />
      ) : (
        <>
          <header className="flex flex-wrap items-end justify-between gap-4">
            <h1 className="font-serif text-4xl tracking-[-0.01em] sm:text-5xl">A shared bookshelf</h1>
            <ThemeToggle />
          </header>
          {state.status === "loading" ? (
            <BookcaseSkeleton />
          ) : (
            <Empty className="border bg-paper py-12">
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <LinkIcon />
                </EmptyMedia>
                <EmptyTitle className="font-serif text-xl font-normal">This shelf link looks incomplete</EmptyTitle>
                <EmptyDescription>
                  The books are packed into the link itself, so it needs to arrive in one piece. Ask for the link
                  again, and copy all of it.
                </EmptyDescription>
              </EmptyHeader>
              <EmptyContent>
                <Button asChild variant="outline">
                  <Link href="/">Start your own bookshelf</Link>
                </Button>
              </EmptyContent>
            </Empty>
          )}
        </>
      )}
    </div>
  );
}

function SharedShelfContent({ shelf }: { shelf: SharedShelf }) {
  const { books } = shelf;
  const [filters, setFilters] = useState<LibraryFilters>(EMPTY_FILTERS);
  const [sort, setSort] = useState<SortKey>("author");
  const [selected, setSelected] = useState<{ id: string; origin: DOMRect | null } | null>(null);

  const genres = useMemo(() => countValues(books, (b) => b.genre), [books]);
  const authors = useMemo(() => countValues(books, (b) => b.author), [books]);
  const stats = useMemo(() => getReadingStats(books), [books]);
  const visible = useMemo(() => sortBooks(filterBooks(books, filters), sort), [books, filters, sort]);
  const shelves = useMemo(() => {
    const grouped = Object.fromEntries(SHELF_STATUSES.map((s) => [s, [] as Book[]])) as Record<ShelfStatus, Book[]>;
    for (const book of visible) grouped[book.status].push(book);
    return grouped;
  }, [visible]);

  const owner = shelf.name ? possessive(shelf.name) : null;
  const isFiltering = filters.search.trim() !== "" || countActiveFilters(filters) > 0;

  return (
    <>
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="font-serif text-4xl tracking-[-0.01em] sm:text-5xl">
            {owner ? `${owner} bookshelf` : "A shared bookshelf"}
          </h1>
          <p className="text-pretty text-muted-foreground">
            {books.length} {books.length === 1 ? "book" : "books"}, as of {formatDay(shelf.sharedAt)}.
          </p>
        </div>
        <div className="flex gap-2">
          <ThemeToggle />
          <Button asChild variant="outline">
            <Link href="/">Start your own</Link>
          </Button>
        </div>
      </header>

      <main className="flex flex-col gap-6 sm:gap-8">
        <LibraryToolbar
          filters={filters}
          onFiltersChange={(next) => {
            captureShelfLayout();
            setFilters(next);
          }}
          sort={sort}
          onSortChange={(next) => {
            captureShelfLayout();
            setSort(next);
          }}
          genres={genres}
          authors={authors}
        />
        <Bookcase
          shelves={shelves}
          pulledId={selected?.id ?? null}
          filtered={isFiltering}
          onOpen={(book, origin) => setSelected({ id: book.id, origin })}
        />
        <StatsPanel
          stats={stats}
          title={owner ? `${owner} reading in ${stats.year}` : `Reading in ${stats.year}`}
          showGoal={false}
        />
      </main>

      <SharedBookDialog
        book={books.find((b) => b.id === selected?.id) ?? null}
        origin={selected?.origin ?? null}
        onClose={() => setSelected(null)}
      />
    </>
  );
}
