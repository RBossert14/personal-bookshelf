import { toCalendarDay } from "@/lib/dates";

import type { BookPatch, ShelfStatus } from "./types";

/**
 * Moving a book between shelves fills in the obvious date for you: starting a
 * book records today as the start date, finishing it records today as the end.
 */
export function shelvePatch(
  status: ShelfStatus,
  book: { startedAt?: string; finishedAt?: string },
  today = new Date(),
): BookPatch {
  const day = toCalendarDay(today);
  if (status === "reading") return { status, startedAt: book.startedAt ?? day, finishedAt: undefined };
  if (status === "read") return { status, startedAt: book.startedAt, finishedAt: book.finishedAt ?? day };
  return { status };
}
