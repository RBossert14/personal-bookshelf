import { format, parseISO } from "date-fns";

/** Book dates are stored as plain calendar days (yyyy-mm-dd), never as timestamps. */
export function toCalendarDay(date: Date) {
  return format(date, "yyyy-MM-dd");
}

export function fromCalendarDay(day: string) {
  return parseISO(day);
}

export function formatDay(day: string) {
  return format(parseISO(day), "MMM d, yyyy");
}
