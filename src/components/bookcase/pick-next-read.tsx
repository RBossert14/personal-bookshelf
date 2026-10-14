"use client";

import { DicesIcon } from "lucide-react";
import { useRef, useState } from "react";

import type { Book } from "@/lib/books/types";
import { gsap, prefersReducedMotion } from "@/lib/motion";

function spineButton(id: string) {
  return document.querySelector<HTMLButtonElement>(`[data-flip-id="${CSS.escape(id)}"] button`);
}

/**
 * Picks a random book off the "Want to read" shelf. A finger runs along the shelf,
 * nudging a few spines, then the chosen book is pulled out like any other.
 */
export function PickNextRead({ books }: { books: Book[] }) {
  const last = useRef<string | null>(null);
  const [picking, setPicking] = useState(false);

  const pick = () => {
    // Don't land on the same book twice in a row when there's a choice.
    const pool = books.length > 1 ? books.filter((b) => b.id !== last.current) : books;
    const chosen = pool[Math.floor(Math.random() * pool.length)];
    last.current = chosen.id;
    const target = spineButton(chosen.id);
    if (!target) return;
    target.scrollIntoView({ block: "nearest", inline: "nearest", behavior: "smooth" });

    if (prefersReducedMotion() || books.length < 3) {
      target.click();
      return;
    }

    // Run left to right along the shelf and stop on the chosen book.
    const end = books.findIndex((b) => b.id === chosen.id);
    const start = Math.max(0, end - 5);
    const visuals = books
      .slice(start, end)
      .map((b) => spineButton(b.id)?.querySelector("[data-spine-visual]"))
      .filter(Boolean);

    setPicking(true);
    gsap
      .timeline({
        onComplete: () => {
          setPicking(false);
          target.click();
        },
      })
      .to(visuals, { y: -8, duration: 0.09, ease: "power1.out", yoyo: true, repeat: 1, stagger: 0.08 })
      .to({}, { duration: 0.05 });
  };

  return (
    <button
      type="button"
      onClick={pick}
      disabled={picking}
      className="flex items-center gap-1.5 rounded-[3px] bg-paper/90 px-2.5 py-0.5 text-xs font-medium text-ink shadow-[inset_0_1px_0_rgb(255_255_255/0.3),0_1px_1px_rgb(0_0_0/0.3)] transition-colors outline-none hover:bg-paper focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-marigold disabled:opacity-80"
    >
      <DicesIcon aria-hidden className="size-3.5" />
      Pick my next read
    </button>
  );
}
