"use client";

import { useId, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { readingProgress } from "@/lib/books/progress";
import type { Book } from "@/lib/books/types";

interface ReadingProgressProps {
  book: Book;
  onChange: (page: number | undefined) => void;
  onFinish: () => void;
}

/** Where you are in a book on the "Currently reading" shelf. Saves when you leave the field or press Enter. */
export function ReadingProgressInput({ book, onChange, onFinish }: ReadingProgressProps) {
  const id = useId();
  const saved = book.currentPage?.toString() ?? "";
  const [draft, setDraft] = useState(saved);
  // Follow saves made elsewhere, like the edit form.
  const [lastSaved, setLastSaved] = useState(saved);
  if (saved !== lastSaved) {
    setLastSaved(saved);
    setDraft(saved);
  }

  const progress = readingProgress(book);
  const atEnd = !!book.pages && progress?.page === book.pages;

  const commit = () => {
    const text = draft.trim();
    if (!text) {
      if (book.currentPage !== undefined) onChange(undefined);
      return;
    }
    const page = Number(text);
    if (!Number.isInteger(page) || page < 0) {
      setDraft(saved);
      return;
    }
    const clamped = book.pages ? Math.min(page, book.pages) : page;
    setDraft(String(clamped));
    if (clamped !== book.currentPage) onChange(clamped);
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-baseline justify-between gap-2">
        <h3 className="text-sm font-medium">Progress</h3>
        {progress?.percent !== undefined && (
          <span className="text-sm text-muted-foreground tabular-nums">{progress.percent}% read</span>
        )}
      </div>
      {book.pages && (
        <Progress
          value={progress?.percent ?? 0}
          aria-label={`${book.title} progress`}
          className="bg-oak-light/30"
          indicatorClassName="bg-sage"
        />
      )}
      <div className="flex items-center gap-2 text-sm">
        <label htmlFor={`${id}-page`} className="text-muted-foreground">
          Page
        </label>
        <Input
          id={`${id}-page`}
          inputMode="numeric"
          className="w-20 tabular-nums"
          value={draft}
          placeholder="0"
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              commit();
            }
          }}
        />
        {book.pages && <span className="text-muted-foreground tabular-nums">of {book.pages}</span>}
      </div>
      {atEnd && (
        <p className="text-sm text-muted-foreground">
          That&apos;s the last page.{" "}
          <Button variant="link" className="h-auto p-0 text-foreground underline" onClick={onFinish}>
            Move it to Read
          </Button>
        </p>
      )}
    </div>
  );
}
