"use client";

import { useState } from "react";
import { toast } from "sonner";

import { BookForm, toFormValues, type BookFormValues } from "@/components/book/book-form";
import { ResponsiveDialog } from "@/components/book/responsive-dialog";
import { useLibrary } from "@/components/library/library-provider";
import { Button } from "@/components/ui/button";
import { SHELF_LABELS } from "@/lib/books/types";
import { captureShelfLayout } from "@/lib/motion";

import { OpenLibrarySearch } from "./open-library-search";

interface AddBookDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  genres: string[];
}

export function AddBookDialog({ open, onOpenChange, genres }: AddBookDialogProps) {
  const { addBook } = useLibrary();
  const [draft, setDraft] = useState<BookFormValues | null>(null);

  const close = () => {
    onOpenChange(false);
    setDraft(null);
  };

  return (
    <ResponsiveDialog
      open={open}
      onOpenChange={(next) => (next ? onOpenChange(true) : close())}
      title={draft ? "Check the details" : "Add a book"}
      description={
        !draft
          ? "Search Open Library by title, then pick the right book."
          : draft.openLibraryKey
            ? "Filled in from Open Library. Change anything that's off."
            : "Only the title and author are required."
      }
    >
      {draft ? (
        <BookForm
          initial={draft}
          genres={genres}
          submitLabel="Add to shelf"
          cancelLabel="Back to search"
          onCancel={() => setDraft(null)}
          onSubmit={async (input) => {
            captureShelfLayout();
            await addBook(input);
            toast.success(`Added ${input.title} to ${SHELF_LABELS[input.status]}`);
            close();
          }}
        />
      ) : (
        <div className="flex flex-col gap-3">
          <OpenLibrarySearch
            onPick={(result) =>
              setDraft(
                toFormValues({
                  title: result.title,
                  author: result.author,
                  year: result.year,
                  pages: result.pages,
                  genre: result.genre,
                  coverUrl: result.coverUrl,
                  openLibraryKey: result.key,
                  status: "want",
                }),
              )
            }
          />
          <p className="text-sm text-muted-foreground">
            Can&apos;t find it?{" "}
            <Button variant="link" className="h-auto p-0 text-foreground underline" onClick={() => setDraft(toFormValues({}))}>
              Add it by hand
            </Button>
          </p>
        </div>
      )}
    </ResponsiveDialog>
  );
}
