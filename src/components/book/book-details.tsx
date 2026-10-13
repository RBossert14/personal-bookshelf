"use client";

import { PencilIcon } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SHELF_LABELS, SHELF_STATUSES, type Book, type ShelfStatus } from "@/lib/books/types";
import { formatDay } from "@/lib/dates";

import { DeleteBookButton } from "./delete-book-button";
import { StarRatingInput } from "./star-rating";

interface BookDetailsProps {
  book: Book;
  onMove: (status: ShelfStatus) => void;
  onRate: (rating: number | undefined) => void;
  onEdit: () => void;
  onDelete: () => void;
}

/** Everything below the cover and title in the detail view. */
export function BookDetails({ book, onMove, onRate, onEdit, onDelete }: BookDetailsProps) {
  const facts = [book.year && `First published ${book.year}`, book.pages && `${book.pages} pages`].filter(Boolean);

  return (
    <div className="flex flex-col gap-5">
      {(book.genre || facts.length > 0) && (
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-sm text-muted-foreground">
          {book.genre && <Badge variant="secondary">{book.genre}</Badge>}
          {facts.map((fact) => (
            <span key={fact as string}>{fact}</span>
          ))}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <span id={`shelf-label-${book.id}`} className="text-sm font-medium">
            Shelf
          </span>
          <Select value={book.status} onValueChange={(value) => onMove(value as ShelfStatus)}>
            <SelectTrigger aria-labelledby={`shelf-label-${book.id}`} className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SHELF_STATUSES.map((status) => (
                <SelectItem key={status} value={status}>
                  {SHELF_LABELS[status]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {book.status !== "want" && (
          <div className="flex flex-col gap-1.5">
            <span id={`rating-label-${book.id}`} className="text-sm font-medium">
              My rating
            </span>
            <StarRatingInput aria-labelledby={`rating-label-${book.id}`} value={book.rating} onChange={onRate} />
          </div>
        )}
      </div>

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

      <div className="flex flex-col gap-1.5">
        <h3 className="text-sm font-medium">My notes</h3>
        {book.notes ? (
          <p className="rounded-md border border-border/70 bg-paper px-4 py-3 font-serif text-[0.95rem] leading-relaxed text-pretty break-words whitespace-pre-line">
            {book.notes}
          </p>
        ) : (
          <p className="text-sm text-muted-foreground">
            No notes yet.{" "}
            <button type="button" onClick={onEdit} className="font-medium text-foreground underline underline-offset-4">
              Add a note
            </button>
          </p>
        )}
      </div>

      <div className="flex justify-between gap-2 border-t pt-4">
        <DeleteBookButton title={book.title} onConfirm={onDelete} />
        <Button variant="outline" onClick={onEdit}>
          <PencilIcon aria-hidden />
          Edit details
        </Button>
      </div>
    </div>
  );
}
