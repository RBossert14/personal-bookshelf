"use client";

import { useLayoutEffect, useRef } from "react";

import { SHELF_LABELS, SHELF_STATUSES, type Book, type ShelfStatus } from "@/lib/books/types";
import { Flip, gsap, prefersReducedMotion, takeShelfLayout, useGSAP } from "@/lib/motion";

import { PickNextRead } from "./pick-next-read";
import { Shelf } from "./shelf";
import { useShelfDrag } from "./use-shelf-drag";
import { WindowLight } from "./window-light";

const EMPTY_TEXT: Record<ShelfStatus, string> = {
  reading: "Nothing on the go right now.",
  read: "Finished books will rest here.",
  want: "Room for whatever's next.",
};

interface BookcaseProps {
  shelves: Record<ShelfStatus, Book[]>;
  pulledId: string | null;
  filtered: boolean;
  onOpen: (book: Book, origin: DOMRect) => void;
  /** Called when a spine is dragged onto another shelf. Leave out for a read-only bookcase. */
  onMove?: (book: Book, status: ShelfStatus) => void;
}

export function BookcaseFrame({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-t-md rounded-b-sm bg-gradient-to-b from-oak-light to-oak p-2.5 shadow-[0_24px_40px_-24px_rgb(58_34_14/0.6)] sm:p-3.5">
      <div className="relative overflow-hidden rounded-[3px] bg-gradient-to-b from-backboard to-backboard-deep shadow-[inset_0_10px_18px_-6px_rgb(0_0_0/0.45),inset_8px_0_14px_-8px_rgb(0_0_0/0.4),inset_-8px_0_14px_-8px_rgb(0_0_0/0.4)]">
        <WindowLight />
        <div className="relative flex flex-col gap-0">{children}</div>
      </div>
    </div>
  );
}

export function Bookcase({ shelves, pulledId, filtered, onOpen, onMove }: BookcaseProps) {
  const root = useRef<HTMLDivElement>(null);

  const readOnly = !onMove;
  useShelfDrag(
    root,
    (bookId, status) => {
      const book = SHELF_STATUSES.flatMap((s) => shelves[s]).find((b) => b.id === bookId);
      if (book) onMove?.(book, status);
    },
    !readOnly,
  );

  // One entrance: books are set down on their shelves, left to right.
  useGSAP(
    () => {
      if (prefersReducedMotion()) return;
      gsap.from("[data-spine-visual]", {
        y: -18,
        autoAlpha: 0,
        duration: 0.5,
        ease: "power2.out",
        stagger: { each: 0.03, from: "start" },
        delay: 0.1,
      });
    },
    { scope: root },
  );

  // Sorting, filtering and moving books animate from where the spines were.
  const layoutKey = SHELF_STATUSES.map((s) => shelves[s].map((b) => b.id).join()).join("|");
  useLayoutEffect(() => {
    const state = takeShelfLayout();
    if (!state || !root.current) return;
    Flip.from(state, {
      targets: root.current.querySelectorAll("[data-flip-id]"),
      // Move spines with transforms only. Without this Flip tweens inline width/height,
      // which overrides the spines' `height: var(--row)` and collapses every shelf mid-animation.
      scale: true,
      duration: 0.5,
      ease: "power2.inOut",
      stagger: 0.01,
      onEnter: (elements) => gsap.fromTo(elements, { autoAlpha: 0, y: -12 }, { autoAlpha: 1, y: 0, duration: 0.35 }),
    });
  }, [layoutKey]);

  return (
    <div ref={root}>
      <BookcaseFrame>
        {SHELF_STATUSES.map((status) => (
          <Shelf
            key={status}
            id={`shelf-${status}`}
            status={status}
            label={SHELF_LABELS[status]}
            books={shelves[status]}
            pulledId={pulledId}
            emptyText={filtered ? "No matches on this shelf." : EMPTY_TEXT[status]}
            action={!readOnly && status === "want" && shelves.want.length > 0 && <PickNextRead books={shelves.want} />}
            onOpen={onOpen}
          />
        ))}
      </BookcaseFrame>
    </div>
  );
}
