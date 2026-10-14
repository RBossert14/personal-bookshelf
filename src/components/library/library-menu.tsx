"use client";

import { DownloadIcon, EllipsisIcon, FileSpreadsheetIcon, Share2Icon, UploadIcon } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { exportLibrary, parseLibraryFile } from "@/lib/books/backup";
import { parseCsvExport, splitDuplicates, type CsvSource } from "@/lib/books/csv-import";
import { SHELF_LABELS, SHELF_STATUSES, type Book } from "@/lib/books/types";
import { captureShelfLayout } from "@/lib/motion";

import { useLibrary } from "./library-provider";
import { ShareShelfDialog } from "./share-shelf-dialog";

interface PendingCsv {
  source: CsvSource;
  fresh: Book[];
  duplicates: number;
  skippedUnfinished: number;
}

function plural(count: number, word: string) {
  return `${count} ${count === 1 ? word : `${word}s`}`;
}

/**
 * Backup and restore, so a localStorage library can survive a cleared browser,
 * plus importing a Goodreads or StoryGraph export on top of what's here.
 */
export function LibraryMenu() {
  const { books, replaceLibrary } = useLibrary();
  const fileInput = useRef<HTMLInputElement>(null);
  const csvInput = useRef<HTMLInputElement>(null);
  const [pendingImport, setPendingImport] = useState<Book[] | null>(null);
  const [pendingCsv, setPendingCsv] = useState<PendingCsv | null>(null);
  const [sharing, setSharing] = useState(false);

  const onCsv = async (file: File | undefined) => {
    if (!file) return;
    try {
      const { source, books: incoming, skippedUnfinished } = await parseCsvExport(file);
      const { fresh, duplicates } = splitDuplicates(books ?? [], incoming);
      if (fresh.length === 0) {
        toast.info(`All ${plural(incoming.length, "book")} from ${source} are already on your shelves.`);
      } else {
        setPendingCsv({ source, fresh, duplicates, skippedUnfinished });
      }
    } catch (error) {
      toast.error((error as Error).message);
    } finally {
      if (csvInput.current) csvInput.current.value = "";
    }
  };

  const onFile = async (file: File | undefined) => {
    if (!file) return;
    try {
      setPendingImport(await parseLibraryFile(file));
    } catch (error) {
      toast.error((error as Error).message);
    } finally {
      if (fileInput.current) fileInput.current.value = "";
    }
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="icon" aria-label="Library menu">
            <EllipsisIcon aria-hidden />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem disabled={!books?.length} onSelect={() => setSharing(true)}>
            <Share2Icon aria-hidden />
            Share my shelf
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem disabled={!books?.length} onSelect={() => books && exportLibrary(books)}>
            <DownloadIcon aria-hidden />
            Export library
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => fileInput.current?.click()}>
            <UploadIcon aria-hidden />
            Import library
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onSelect={() => csvInput.current?.click()}>
            <FileSpreadsheetIcon aria-hidden />
            Import from Goodreads or StoryGraph
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <ShareShelfDialog open={sharing} onOpenChange={setSharing} books={books ?? []} />

      <input
        ref={fileInput}
        type="file"
        accept="application/json,.json"
        className="sr-only"
        tabIndex={-1}
        aria-hidden
        onChange={(e) => onFile(e.target.files?.[0])}
      />
      <input
        ref={csvInput}
        type="file"
        accept="text/csv,.csv"
        className="sr-only"
        tabIndex={-1}
        aria-hidden
        onChange={(e) => onCsv(e.target.files?.[0])}
      />

      <AlertDialog open={!!pendingCsv} onOpenChange={(open) => !open && setPendingCsv(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Add {plural(pendingCsv?.fresh.length ?? 0, "book")} from {pendingCsv?.source}?</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="flex flex-col gap-3">
                <ul className="flex flex-col gap-1">
                  {SHELF_STATUSES.map((status) => {
                    const count = pendingCsv?.fresh.filter((b) => b.status === status).length ?? 0;
                    return (
                      count > 0 && (
                        <li key={status}>
                          <span className="font-medium text-foreground tabular-nums">{count}</span> on {SHELF_LABELS[status]}
                        </li>
                      )
                    );
                  })}
                </ul>
                {(!!pendingCsv?.duplicates || !!pendingCsv?.skippedUnfinished) && (
                  <p>
                    {[
                      pendingCsv.duplicates > 0 &&
                        `${plural(pendingCsv.duplicates, "book")} already on your shelves will be skipped.`,
                      pendingCsv.skippedUnfinished > 0 &&
                        `${plural(pendingCsv.skippedUnfinished, "did-not-finish book")} will be left out, since there's no shelf for them here.`,
                    ]
                      .filter(Boolean)
                      .join(" ")}
                  </p>
                )}
                <p>Your current books stay as they are. Covers are looked up on Open Library by ISBN.</p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                if (!pendingCsv) return;
                captureShelfLayout();
                await replaceLibrary([...(books ?? []), ...pendingCsv.fresh]);
                toast.success(`Added ${plural(pendingCsv.fresh.length, "book")} from ${pendingCsv.source}`);
              }}
            >
              Add to shelves
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!pendingImport} onOpenChange={(open) => !open && setPendingImport(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Replace your library?</AlertDialogTitle>
            <AlertDialogDescription>
              The file has {pendingImport?.length} books. Importing replaces the {books?.length ?? 0} books on your
              shelves now. Export first if you want to keep them.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                if (!pendingImport) return;
                captureShelfLayout();
                await replaceLibrary(pendingImport);
                toast.success(`Imported ${pendingImport.length} books`);
              }}
            >
              Replace library
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
