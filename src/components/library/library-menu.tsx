"use client";

import { DownloadIcon, EllipsisIcon, UploadIcon } from "lucide-react";
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
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { exportLibrary, parseLibraryFile } from "@/lib/books/backup";
import type { Book } from "@/lib/books/types";
import { captureShelfLayout } from "@/lib/motion";

import { useLibrary } from "./library-provider";

/** Backup and restore, so a localStorage library can survive a cleared browser. */
export function LibraryMenu() {
  const { books, replaceLibrary } = useLibrary();
  const fileInput = useRef<HTMLInputElement>(null);
  const [pendingImport, setPendingImport] = useState<Book[] | null>(null);

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
          <Button variant="outline" size="icon" aria-label="Library backup">
            <EllipsisIcon aria-hidden />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem disabled={!books?.length} onSelect={() => books && exportLibrary(books)}>
            <DownloadIcon aria-hidden />
            Export library
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => fileInput.current?.click()}>
            <UploadIcon aria-hidden />
            Import library
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <input
        ref={fileInput}
        type="file"
        accept="application/json,.json"
        className="sr-only"
        tabIndex={-1}
        aria-hidden
        onChange={(e) => onFile(e.target.files?.[0])}
      />

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
