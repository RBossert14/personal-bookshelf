"use client";

import { useState } from "react";

import { AnimatedCover } from "@/components/book/book-detail-dialog";
import { ResponsiveDialog } from "@/components/book/responsive-dialog";
import { StarRatingDisplay } from "@/components/book/star-rating";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { readingProgress } from "@/lib/books/progress";
import { SHELF_LABELS, type Book } from "@/lib/books/types";
import { formatDay } from "@/lib/dates";

interface SharedBookDialogProps {
  book: Book | null;
  origin: DOMRect | null;
  onClose: () => void;
}

/** The detail view on a shared shelf: everything a friend can see, nothing they can change. */
export function SharedBookDialog({ book, origin, onClose }: SharedBookDialogProps) {
  // Keep showing the last book while the dialog animates closed.
  const [lastBook, setLastBook] = useState(book);
  if (book && book !== lastBook) setLastBook(book);
  const shown = book ?? lastBook;

  return (
    <ResponsiveDialog
      open={!!book}
      onOpenChange={(open) => !open && onClose()}
      title={shown?.title}
      description={shown && [`by ${shown.author}`, shown.year].filter(Boolean).join(", ")}
      returnFocus={() =>
        shown && document.querySelector<HTMLElement>(`[data-flip-id="${CSS.escape(shown.id)}"] button`)
      }
      aside={shown && <AnimatedCover key={shown.id} book={shown} origin={origin} />}
    >
      {shown && <SharedBookBody book={shown} />}
    </ResponsiveDialog>
  );
}

function SharedBookBody({ book }: { book: Book }) {
  const progress = readingProgress(book);
  const facts = [SHELF_LABELS[book.status], book.pages && `${book.pages} pages`].filter(Boolean);

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-sm text-muted-foreground">
        {book.genre && <Badge variant="secondary">{book.genre}</Badge>}
        {facts.map((fact) => (
          <span key={fact as string}>{fact}</span>
        ))}
      </div>

      {book.status !== "want" && book.rating !== undefined && (
        <div className="flex items-center gap-2 text-sm">
          <StarRatingDisplay value={book.rating} />
          <span className="text-muted-foreground tabular-nums">{book.rating} / 5</span>
        </div>
      )}

      {progress?.percent !== undefined && (
        <div className="flex flex-col gap-2">
          <div className="flex items-baseline justify-between text-sm">
            <span className="font-medium">Progress</span>
            <span className="text-muted-foreground tabular-nums">
              Page {progress.page} of {progress.pages}, {progress.percent}%
            </span>
          </div>
          <Progress
            value={progress.percent}
            aria-label={`${book.title} progress`}
            className="bg-oak-light/30"
            indicatorClassName="bg-sage"
          />
        </div>
      )}

      {(book.startedAt || book.finishedAt) && (
        <dl className="grid grid-cols-2 gap-4 text-sm">
          {book.startedAt && (
            <div>
              <dt className="text-muted-foreground">Started</dt>
              <dd className="font-medium">{formatDay(book.startedAt)}</dd>
            </div>
          )}
          {book.finishedAt && (
            <div>
              <dt className="text-muted-foreground">Finished</dt>
              <dd className="font-medium">{formatDay(book.finishedAt)}</dd>
            </div>
          )}
        </dl>
      )}

      {book.notes && (
        <div className="flex flex-col gap-1.5">
          <h3 className="text-sm font-medium">Notes</h3>
          <p className="rounded-md border border-border/70 bg-paper px-4 py-3 font-serif text-[0.95rem] leading-relaxed text-pretty break-words whitespace-pre-line">
            {book.notes}
          </p>
        </div>
      )}
    </div>
  );
}
