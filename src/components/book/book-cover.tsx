"use client";

import { forwardRef, useState } from "react";

import { spinePalette } from "@/lib/books/spine";
import type { Book } from "@/lib/books/types";
import { cn } from "@/lib/utils";

type CoverBook = Pick<Book, "title" | "author" | "coverUrl" | "spineColor">;

/**
 * A 2:3 cover. While the image loads, or if there isn't one, it shows a plain
 * cloth cover in the book's spine color with the title set on it.
 */
export const BookCover = forwardRef<HTMLDivElement, { book: CoverBook; className?: string }>(
  function BookCover({ book, className }, ref) {
    const [status, setStatus] = useState<"loading" | "loaded" | "failed">("loading");
    const { background, ink } = spinePalette(book);
    const showImage = book.coverUrl && status !== "failed";

    return (
      <div
        ref={ref}
        className={cn(
          "relative aspect-[2/3] overflow-hidden rounded-[3px_6px_6px_3px] shadow-[0_1px_2px_rgb(35_52_59/0.25),0_12px_28px_-8px_rgb(35_52_59/0.45)]",
          className,
        )}
        style={{ backgroundColor: background, color: ink }}
      >
        {status !== "loaded" && (
          <div className="absolute inset-0 flex flex-col justify-between p-3 text-left">
            <span className="font-serif text-base leading-tight text-balance">{book.title}</span>
            <span className="text-xs">{book.author}</span>
          </div>
        )}
        {showImage && (
          // Covers come from Open Library's CDN, which next/image would need to proxy.
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={book.coverUrl}
            alt={`Cover of ${book.title} by ${book.author}`}
            crossOrigin="anonymous"
            onLoad={() => setStatus("loaded")}
            onError={() => setStatus("failed")}
            className={cn(
              "absolute inset-0 size-full object-cover transition-opacity duration-300",
              status === "loaded" ? "opacity-100" : "opacity-0",
            )}
          />
        )}
        {/* Hinge crease near the spine edge */}
        <span
          aria-hidden
          className="pointer-events-none absolute inset-y-0 left-[6%] w-px bg-gradient-to-b from-white/25 via-black/15 to-white/20"
        />
      </div>
    );
  },
);
