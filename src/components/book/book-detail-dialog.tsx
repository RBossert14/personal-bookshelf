"use client";

import { useRef, useState } from "react";
import { toast } from "sonner";

import { useLibrary } from "@/components/library/library-provider";
import { shelvePatch } from "@/lib/books/shelving";
import { SHELF_LABELS, type Book, type ShelfStatus } from "@/lib/books/types";
import { captureShelfLayout, gsap, prefersReducedMotion, useGSAP } from "@/lib/motion";

import { BookCover } from "./book-cover";
import { BookDetails } from "./book-details";
import { BookForm, toFormValues } from "./book-form";
import { ResponsiveDialog } from "./responsive-dialog";

interface BookDetailDialogProps {
  book: Book | null;
  /** Where the spine was when it was pulled, so the cover can grow out of it. */
  origin: DOMRect | null;
  genres: string[];
  onClose: () => void;
}

export function BookDetailDialog({ book, origin, genres, onClose }: BookDetailDialogProps) {
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
      {shown && <DetailBody key={shown.id} book={shown} genres={genres} onClose={onClose} />}
    </ResponsiveDialog>
  );
}

/** The cover, grown out of the spine that was pulled. Also used by the shared shelf's read-only view. */
export function AnimatedCover({ book, origin }: { book: Book; origin: DOMRect | null }) {
  const cover = useRef<HTMLDivElement>(null);

  // FLIP from the spine's rectangle to the cover's resting place.
  useGSAP(() => {
    const element = cover.current;
    if (!element || !origin || prefersReducedMotion()) return;
    const target = element.getBoundingClientRect();
    if (!target.width) return;
    gsap.from(element, {
      x: origin.left - target.left,
      y: origin.top - target.top,
      scaleX: origin.width / target.width,
      scaleY: origin.height / target.height,
      rotationY: -50,
      transformPerspective: 900,
      transformOrigin: "0% 0%",
      duration: 0.6,
      ease: "power3.out",
      clearProps: "transform",
    });
  });

  return <BookCover ref={cover} book={book} className="w-24 flex-none sm:w-32" />;
}

function DetailBody({ book, genres, onClose }: { book: Book; genres: string[]; onClose: () => void }) {
  const { updateBook, removeBook } = useLibrary();
  const [editing, setEditing] = useState(false);

  const move = async (status: ShelfStatus) => {
    captureShelfLayout();
    await updateBook(book.id, shelvePatch(status, book));
    toast.success(`Moved to ${SHELF_LABELS[status]}`);
  };

  if (editing) {
    return (
      <BookForm
        initial={toFormValues(book)}
        genres={genres}
        submitLabel="Save changes"
        onCancel={() => setEditing(false)}
        onSubmit={async (input) => {
          captureShelfLayout();
          await updateBook(book.id, input);
          setEditing(false);
          toast.success("Changes saved");
        }}
      />
    );
  }

  return (
    <BookDetails
      book={book}
      onMove={move}
      onRate={(rating) => updateBook(book.id, { rating })}
      onProgress={(currentPage) => updateBook(book.id, { currentPage })}
      onEdit={() => setEditing(true)}
      onDelete={async () => {
        onClose();
        captureShelfLayout();
        await removeBook(book.id);
        toast.success(`Removed ${book.title}`);
      }}
    />
  );
}
