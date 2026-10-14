"use client";

import { CheckIcon, CopyIcon, ExternalLinkIcon } from "lucide-react";
import { useEffect, useId, useState } from "react";
import { toast } from "sonner";

import { ResponsiveDialog } from "@/components/book/responsive-dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { encodeShelf } from "@/lib/books/share";
import type { Book } from "@/lib/books/types";

const NAME_KEY = "bookshelf:v1:share-name";

function savedName() {
  try {
    return window.localStorage.getItem(NAME_KEY) ?? "";
  } catch {
    return "";
  }
}

interface ShareShelfDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  books: Book[];
}

/** Makes a read-only /shelf link holding a snapshot of the library. */
export function ShareShelfDialog({ open, onOpenChange, books }: ShareShelfDialogProps) {
  const id = useId();
  const [name, setName] = useState(savedName);
  const [includeNotes, setIncludeNotes] = useState(false);
  const [link, setLink] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!open) return;
    let current = true;
    encodeShelf(books, { name, includeNotes }).then((fragment) => {
      if (current) setLink(`${window.location.origin}/shelf#${fragment}`);
    });
    return () => {
      current = false;
    };
  }, [open, books, name, includeNotes]);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Couldn't copy. Select the link and copy it yourself.");
    }
  };

  return (
    <ResponsiveDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Share your shelf"
      description="Anyone with the link can see your bookcase, but can't change it."
    >
      <div className="flex flex-col gap-5">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor={`${id}-name`}>Your name</Label>
          <Input
            id={`${id}-name`}
            value={name}
            placeholder="Optional"
            autoComplete="given-name"
            onChange={(e) => {
              setName(e.target.value);
              try {
                window.localStorage.setItem(NAME_KEY, e.target.value);
              } catch {
                // Not remembered next time; the link still works.
              }
            }}
          />
          <p className="text-sm text-muted-foreground">
            The page title becomes &ldquo;{name.trim() ? `${name.trim()}’s bookshelf` : "A shared bookshelf"}&rdquo;.
          </p>
        </div>

        <div className="flex items-start gap-2">
          <Checkbox
            id={`${id}-notes`}
            checked={includeNotes}
            onCheckedChange={(checked) => setIncludeNotes(checked === true)}
            className="mt-0.5"
          />
          <div className="flex flex-col gap-0.5">
            <Label htmlFor={`${id}-notes`}>Include my notes</Label>
            <p className="text-sm text-muted-foreground">Left out unless you tick this, since notes can be personal.</p>
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor={`${id}-link`}>Link</Label>
          <div className="flex gap-2">
            <Input
              id={`${id}-link`}
              readOnly
              value={link}
              onFocus={(e) => e.currentTarget.select()}
              className="font-mono text-xs"
            />
            <Button onClick={copy} disabled={!link} className="min-w-24">
              {copied ? <CheckIcon aria-hidden /> : <CopyIcon aria-hidden />}
              {copied ? "Copied" : "Copy"}
            </Button>
          </div>
          <span role="status" className="sr-only">
            {copied ? "Link copied" : ""}
          </span>
          <p className="text-sm text-muted-foreground">
            The link is a snapshot of {books.length} {books.length === 1 ? "book" : "books"}. Books you add or change
            later won&apos;t show up until you share a new link.
          </p>
        </div>

        <div className="flex justify-end border-t pt-4">
          <Button asChild variant="outline" disabled={!link}>
            <a href={link || undefined} target="_blank" rel="noreferrer">
              <ExternalLinkIcon aria-hidden />
              Preview
            </a>
          </Button>
        </div>
      </div>
    </ResponsiveDialog>
  );
}
