import { BookshelfApp } from "@/components/library/bookshelf-app";
import { LibraryProvider } from "@/components/library/library-provider";

export default function Home() {
  return (
    <LibraryProvider>
      <BookshelfApp />
    </LibraryProvider>
  );
}
