"use client";

import { useRef } from "react";

import { describeRating } from "@/components/book/star-rating";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { spineHeight, spinePalette, spineWidth } from "@/lib/books/spine";
import type { Book } from "@/lib/books/types";
import { gsap, prefersReducedMotion, useGSAP } from "@/lib/motion";

interface BookSpineProps {
  book: Book;
  /** True while this book is open in the detail view, so it stays off the shelf. */
  pulled: boolean;
  tabIndex: number;
  onOpen: (book: Book, origin: DOMRect) => void;
  onFocus: () => void;
  buttonRef: (element: HTMLButtonElement | null) => void;
}

function surname(author: string) {
  return author.trim().split(/\s+/).pop() ?? author;
}

export function BookSpine({ book, pulled, tabIndex, onOpen, onFocus, buttonRef }: BookSpineProps) {
  const visual = useRef<HTMLSpanElement>(null);
  const wasPulled = useRef(false);
  const { background: color, ink } = spinePalette(book);

  // Slides the book back into its slot when the detail view closes.
  useGSAP(
    () => {
      if (pulled || !wasPulled.current) {
        wasPulled.current = pulled;
        return;
      }
      wasPulled.current = false;
      if (prefersReducedMotion()) {
        gsap.set(visual.current, { clearProps: "all" });
        return;
      }
      gsap.to(visual.current, {
        y: 0,
        rotation: 0,
        autoAlpha: 1,
        duration: 0.5,
        ease: "back.out(1.4)",
        clearProps: "transform",
      });
    },
    { dependencies: [pulled] },
  );

  const open = () => {
    const element = visual.current!;
    const origin = element.getBoundingClientRect();
    if (prefersReducedMotion()) {
      onOpen(book, origin);
      return;
    }
    // Tip the top of the book toward you, lift it out, and hand off to the cover.
    gsap
      .timeline()
      .to(element, { rotation: -7, y: -10, transformOrigin: "100% 100%", duration: 0.16, ease: "power2.out" })
      .to(element, { y: -36, autoAlpha: 0.12, duration: 0.3, ease: "power2.in" })
      .add(() => onOpen(book, element.getBoundingClientRect()), 0.14);
  };

  const label = `${book.title} by ${book.author}. ${describeRating(book.rating)}.`;

  return (
    <li
      data-flip-id={book.id}
      className="flex flex-none snap-start items-end"
      style={{ width: spineWidth(book.pages), height: "var(--row)" }}
    >
      <Tooltip delayDuration={500}>
        <TooltipTrigger asChild>
          <button
            ref={buttonRef}
            type="button"
            tabIndex={tabIndex}
            aria-label={label}
            onClick={open}
            onFocus={onFocus}
            style={{ height: `${spineHeight(book.title)}%` }}
            className="group/spine relative w-full rounded-t-[3px] rounded-b-[2px] outline-none transition-transform duration-200 ease-out focus-visible:outline-solid focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-marigold motion-safe:hover:-translate-y-2 motion-safe:focus-visible:-translate-y-2"
          >
            <span
              ref={visual}
              data-spine-visual
              className="absolute inset-0 flex flex-col items-center overflow-hidden rounded-[inherit] px-0.5 pt-3 pb-2.5 shadow-[inset_0_-1px_0_rgb(0_0_0/0.25),2px_0_3px_-1px_rgb(0_0_0/0.35)] will-change-transform"
              style={{
                backgroundColor: color,
                color: ink,
                backgroundImage:
                  "linear-gradient(90deg, rgb(0 0 0/0.22), rgb(255 255 255/0.14) 16%, rgb(255 255 255/0) 42%, rgb(0 0 0/0.14))",
              }}
            >
              {/* Foil bands near the head and tail, like a cloth binding */}
              <span aria-hidden className="absolute inset-x-1 top-1.5 h-[3px] border-y border-current opacity-30" />
              <span aria-hidden className="absolute inset-x-1 bottom-1 h-[3px] border-y border-current opacity-30" />
              <span
                aria-hidden
                className="spine-text min-h-0 flex-1 overflow-hidden font-serif text-[13px] leading-none text-ellipsis whitespace-nowrap"
              >
                {book.title}
              </span>
              <span aria-hidden className="spine-text mt-2 text-[10px] leading-none font-medium whitespace-nowrap">
                {surname(book.author)}
              </span>
            </span>
          </button>
        </TooltipTrigger>
        <TooltipContent side="top">
          {book.title}
          <span className="opacity-70"> by {book.author}</span>
        </TooltipContent>
      </Tooltip>
    </li>
  );
}
