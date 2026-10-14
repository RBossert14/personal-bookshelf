export const SHELF_STATUSES = ["reading", "read", "want"] as const;

export type ShelfStatus = (typeof SHELF_STATUSES)[number];

export const SHELF_LABELS: Record<ShelfStatus, string> = {
  reading: "Currently reading",
  read: "Read",
  want: "Want to read",
};

export interface Book {
  id: string;
  title: string;
  author: string;
  status: ShelfStatus;
  year?: number;
  pages?: number;
  /** The page you're on, while the book is on the "Currently reading" shelf. */
  currentPage?: number;
  genre?: string;
  coverUrl?: string;
  /** Hex color pulled from the cover. Falls back to a palette color when missing. */
  spineColor?: string;
  /** 0.5 to 5 in half steps. Undefined means unrated. */
  rating?: number;
  notes?: string;
  /** ISO calendar dates (yyyy-mm-dd). */
  startedAt?: string;
  finishedAt?: string;
  openLibraryKey?: string;
  createdAt: string;
  updatedAt: string;
}

export type BookInput = Omit<Book, "id" | "createdAt" | "updatedAt">;

export type BookPatch = Partial<BookInput>;
