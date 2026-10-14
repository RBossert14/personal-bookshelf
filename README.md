# My bookshelf

A personal, interactive bookshelf. Books stand as spines on honey-oak shelves in a sunlit cottage reading room. Click one and it tips off the shelf and opens into its cover, with your rating, notes and reading dates.

## Features

- **A real bookcase.** Shelves for Currently reading, Read and Want to read. Spine width follows page count, and spine color is pulled from the cover image.
- **Pull-out detail view.** GSAP tips the spine off the shelf and grows the cover out of it (FLIP). It becomes a bottom sheet on phones.
- **Drag between shelves.** Drag a spine onto another shelf to move it, and the other books slide to close the gap. Moving a book fills in the start or finish date. On touch screens, press and hold to pick a book up.
- **Add books from Open Library.** Type a title and pick a result: the cover, author, year, page count and a best-guess genre are filled in for you. You can also add books by hand.
- **Reading progress.** Track the page you're on for books you're reading. A ribbon on the spine fills as you go, and reaching the last page offers to move the book to Read.
- **Pick my next read.** A button on the Want to read shelf runs a finger along the spines and pulls one out at random.
- **Search, filter, sort.** Filter by genre, author and minimum rating, with a book count beside each option. Sort by title, author (by surname), date finished, rating, or spine color for a rainbow shelf. Shelves animate to their new order.
- **Reading stats and a yearly goal.** Books and pages finished this year, your favorite genre, and a monthly chart with a table view. Set a goal for the year to see your progress and whether you're ahead of or behind pace.
- **Evening mode.** A dark theme where moonlight comes through the window and a reading lamp warms the shelves. It follows your system setting until you choose one.
- **Share a read-only shelf.** Make a link that shows friends your bookcase, stats and book details. It's a snapshot packed into the link (see below), and notes are left out unless you include them.
- **Import from Goodreads or StoryGraph.** Load either site's CSV export. Books are added to your shelves with ratings, dates, notes and covers looked up by ISBN. Books you already have are skipped.
- **Backup.** Export the library to JSON and import it again.
- **Accessible.** Each shelf is one Tab stop, and the arrow keys, Home and End move between books. Focus rings are visible, focus returns to the book when the detail view closes, and spine lettering is guaranteed 4.5:1 contrast. All motion respects `prefers-reduced-motion`.

## Tech

Next.js 16 (App Router) · TypeScript · Tailwind CSS 4 · shadcn/ui (Radix) · GSAP + Flip · Recharts

## Getting started

```bash
npm install
npm run dev
```

Open http://localhost:3000. On first visit the shelves are seeded with ten sample books.

## Project structure

```
src/
  app/                    layout, global styles and theme tokens; shelf/ is the shared-link page
  components/
    bookcase/             Bookcase, Shelf, BookSpine, window light, skeleton
    book/                 detail dialog, form, cover, star rating, date picker
    add-book/             Open Library search and add flow
    toolbar/              search, filters, sort
    stats/                stats panel, chart, reading goal
    library/              app shell, data provider, menu (backup, import, share), theme toggle
    shared/               the read-only view behind a share link
    ui/                   shadcn/ui components
  hooks/                  media queries, in-view reveal
  lib/
    books/                types, repository, seed data, query/sort, stats, spine math,
                          reading goal and progress, CSV import, share-link encoding
    open-library.ts       Open Library search client
    cover-color.ts        cover → spine color extraction
    motion.ts             GSAP setup and shelf FLIP helpers
```

## Where data lives

Everything is stored in the browser's localStorage: the books, your yearly goals and your name for share links. Nothing is sent to a server. Use **Export library** in the menu to keep a backup. Goals aren't included in the backup.

Share links hold a compressed copy of the shelf after the `#` in the URL (see [`src/lib/books/share.ts`](src/lib/books/share.ts)). Browsers don't send that part to the server, so the shelf isn't stored anywhere except the link. Each book adds roughly 100 characters to the link. A link is a snapshot, so share a new one after your shelves change.

## Swapping localStorage for a database

The UI only talks to the `BookRepository` interface in [`src/lib/books/repository.ts`](src/lib/books/repository.ts). To move to a backend, implement that interface (for example, against an API route or Supabase), then pass it to the provider:

```tsx
<LibraryProvider repository={createApiRepository()}>
  <BookshelfApp />
</LibraryProvider>
```

No component changes are needed.
