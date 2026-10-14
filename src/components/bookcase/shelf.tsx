"use client";

import { useRef, useState } from "react";

import type { Book, ShelfStatus } from "@/lib/books/types";
import { cn } from "@/lib/utils";

import { BookSpine } from "./book-spine";

interface ShelfProps {
  id: string;
  status: ShelfStatus;
  label: string;
  books: Book[];
  pulledId: string | null;
  emptyText: string;
  /** Rendered on the right of the shelf board, opposite the label. */
  action?: React.ReactNode;
  onOpen: (book: Book, origin: DOMRect) => void;
}

/**
 * One shelf of the bookcase. Books use a roving tab stop: Tab lands on one
 * book per shelf, and the arrow keys, Home and End move along it.
 */
export function Shelf({ id, status, label, books, pulledId, emptyText, action, onOpen }: ShelfProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const buttons = useRef<(HTMLButtonElement | null)[]>([]);
  const current = Math.min(activeIndex, Math.max(books.length - 1, 0));

  const focusBook = (index: number) => {
    const next = (index + books.length) % books.length;
    setActiveIndex(next);
    const button = buttons.current[next];
    button?.focus();
    button?.scrollIntoView({ block: "nearest", inline: "nearest" });
  };

  const onKeyDown = (event: React.KeyboardEvent) => {
    const moves: Record<string, number> = {
      ArrowRight: current + 1,
      ArrowLeft: current - 1,
      Home: 0,
      End: books.length - 1,
    };
    if (event.key in moves && books.length) {
      event.preventDefault();
      focusBook(moves[event.key]);
    }
  };

  const headingId = `${id}-heading`;

  return (
    <section
      aria-labelledby={headingId}
      data-shelf={status}
      // Lit up while a spine is dragged over it; see use-shelf-drag.ts.
      className="relative transition-colors duration-150 data-[drop-target=true]:bg-[color-mix(in_oklab,var(--sunlight)_16%,transparent)]"
    >
      <div className="relative">
        {books.length === 0 ? (
          <p className="flex h-[calc(9rem+0.75rem)] items-end px-4 pb-4 text-sm sm:px-6 text-oak-light italic sm:h-52">{emptyText}</p>
        ) : (
          <ul
            aria-labelledby={headingId}
            onKeyDown={onKeyDown}
            className={cn(
              // Mobile: one row that scrolls sideways. Desktop: rows wrap, and every
              // row but the last sits on its own thin board, drawn by the background.
              "scrollbar-none flex snap-x snap-mandatory items-end gap-x-[3px] overflow-x-auto px-3 pt-3 [--row:9rem] sm:px-5",
              "sm:flex-wrap sm:gap-y-[14px] sm:overflow-visible sm:pt-0 sm:[--row:13rem]",
              "sm:bg-[linear-gradient(to_bottom,transparent_var(--row),var(--oak-deep)_var(--row),var(--oak)_calc(var(--row)+3px),var(--oak-light)_calc(var(--row)+14px))]",
              "sm:bg-[length:100%_calc(var(--row)+14px)] sm:bg-repeat-y",
            )}
          >
            {books.map((book, index) => (
              <BookSpine
                key={book.id}
                book={book}
                pulled={pulledId === book.id}
                tabIndex={index === current ? 0 : -1}
                onOpen={onOpen}
                onFocus={() => setActiveIndex(index)}
                buttonRef={(element) => {
                  buttons.current[index] = element;
                }}
              />
            ))}
          </ul>
        )}
      </div>

      {/* The shelf board, with its label plate on the front edge */}
      <div className="relative h-6 bg-gradient-to-b from-oak-light via-oak to-oak-deep shadow-[0_6px_10px_-4px_rgb(40_22_8/0.55)]">
        <h2
          id={headingId}
          className="absolute top-1/2 left-4 -translate-y-1/2 rounded-[3px] bg-sage px-2.5 py-0.5 text-xs font-medium text-paper shadow-[inset_0_1px_0_rgb(255_255_255/0.2),0_1px_1px_rgb(0_0_0/0.3)] sm:left-6"
        >
          {label}
          <span className="ml-1.5 tabular-nums">{books.length}</span>
        </h2>
        {action && <div className="absolute top-1/2 right-4 -translate-y-1/2 sm:right-6">{action}</div>}
      </div>
    </section>
  );
}
