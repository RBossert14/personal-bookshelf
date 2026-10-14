import type { Metadata } from "next";

import { SharedShelfView } from "@/components/shared/shared-shelf-view";

export const metadata: Metadata = {
  title: "A shared bookshelf",
  description: "A snapshot of someone's bookshelf: what they're reading, what they've read, and what's next.",
  // Each link holds one person's books; keep them out of search results.
  robots: { index: false, follow: false },
};

/** The books live in the link's #fragment, so everything is read in the browser. */
export default function SharedShelfPage() {
  return <SharedShelfView />;
}
