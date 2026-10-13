# My bookshelf

A personal, interactive bookshelf. Books stand as spines on honey-oak shelves in a sunlit cottage reading room. Click one and it tips off the shelf and opens into its cover, with your rating, notes and reading dates.

## Features

- **A real bookcase.** Shelves for Currently reading, Read and Want to read. Spine width follows page count, and spine color is pulled from the cover image.
- **Pull-out detail view.** GSAP tips the spine off the shelf and grows the cover out of it (FLIP). It becomes a bottom sheet on phones.
- **Add books from Open Library.** Type a title and pick a result: the cover, author, year, page count and a best-guess genre are filled in for you. You can also add books by hand.
- **Search, filter, sort.** Filter by genre, author and minimum rating, and sort by title, author (by surname), date finished or rating. Shelves animate to their new order.
- **Reading stats.** Books and pages finished this year, your favorite genre, and a monthly chart with a table view.
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
  app/                    layout, global styles and theme tokens
  components/
    bookcase/             Bookcase, Shelf, BookSpine, window light, skeleton
    book/                 detail dialog, form, cover, star rating, date picker
    add-book/             Open Library search and add flow
    toolbar/              search, filters, sort
    stats/                stats panel and chart
    library/              app shell, data provider, backup menu
    ui/                   shadcn/ui components
  hooks/                  media queries, in-view reveal
  lib/
    books/                types, repository, seed data, query/sort, stats, spine math
    open-library.ts       Open Library search client
    cover-color.ts        cover → spine color extraction
    motion.ts             GSAP setup and shelf FLIP helpers
```

## Swapping localStorage for a database

The UI only talks to the `BookRepository` interface in [`src/lib/books/repository.ts`](src/lib/books/repository.ts). To move to a backend, implement that interface (for example, against an API route or Supabase), then pass it to the provider:

```tsx
<LibraryProvider repository={createApiRepository()}>
  <BookshelfApp />
</LibraryProvider>
```

No component changes are needed.
