import { Skeleton } from "@/components/ui/skeleton";
import { SHELF_STATUSES } from "@/lib/books/types";

import { BookcaseFrame } from "./bookcase";

/** Empty shelves with faint spine outlines while the library loads. */
export function BookcaseSkeleton() {
  return (
    <div aria-busy="true" aria-label="Loading your bookshelf">
      <BookcaseFrame>
        {SHELF_STATUSES.map((status) => (
          <div key={status}>
            <div className="flex h-[calc(9rem+0.75rem)] items-end gap-[3px] px-3 sm:h-52 sm:px-5">
              {[34, 48, 30, 56, 40].map((width, i) => (
                <Skeleton
                  key={i}
                  className="rounded-t-[3px] rounded-b-none bg-white/10"
                  style={{ width, height: `${78 + ((i * 7) % 18)}%` }}
                />
              ))}
            </div>
            <div className="h-6 bg-gradient-to-b from-oak-light via-oak to-oak-deep" />
          </div>
        ))}
      </BookcaseFrame>
    </div>
  );
}
