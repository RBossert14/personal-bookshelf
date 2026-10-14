export interface OpenLibraryResult {
  key: string;
  title: string;
  author?: string;
  year?: number;
  pages?: number;
  coverUrl?: string;
  genre?: string;
}

interface SearchDoc {
  key: string;
  title: string;
  author_name?: string[];
  first_publish_year?: number;
  number_of_pages_median?: number;
  cover_i?: number;
  subject?: string[];
}

const FIELDS = "key,title,author_name,first_publish_year,number_of_pages_median,cover_i,subject";

export async function searchOpenLibrary(query: string, signal?: AbortSignal): Promise<OpenLibraryResult[]> {
  const url = `https://openlibrary.org/search.json?q=${encodeURIComponent(query)}&limit=8&fields=${FIELDS}`;
  const response = await fetch(url, { signal });
  if (!response.ok) throw new Error(`Open Library returned ${response.status}`);
  const { docs } = (await response.json()) as { docs: SearchDoc[] };

  return docs.map((doc) => ({
    key: doc.key,
    title: doc.title,
    author: doc.author_name?.[0],
    year: doc.first_publish_year,
    pages: doc.number_of_pages_median,
    coverUrl: doc.cover_i ? `https://covers.openlibrary.org/b/id/${doc.cover_i}-L.jpg` : undefined,
    genre: guessGenre(doc.subject ?? []),
  }));
}

/** Open Library subjects are free-form, so map the common ones onto a short genre list. */
const GENRE_KEYWORDS: [genre: string, keywords: string[]][] = [
  ["Science Fiction", ["science fiction", "science-fiction", "sci-fi"]],
  ["Fantasy", ["fantasy", "magic", "dragons"]],
  ["Mystery", ["mystery", "detective", "crime"]],
  ["Thriller", ["thriller", "suspense"]],
  ["Horror", ["horror", "ghost"]],
  ["Romance", ["romance", "love stories"]],
  ["Historical Fiction", ["historical fiction"]],
  ["Biography", ["biography", "autobiography", "memoir"]],
  ["Nature Writing", ["nature", "ecology", "botany"]],
  ["History", ["history"]],
  ["Poetry", ["poetry", "poems"]],
  ["Self-help", ["self-help", "self-actualization"]],
  ["Literary Fiction", ["literary fiction", "literature", "booker"]],
];

/** Maps free-form subjects, shelf names or tags onto the short genre list. Also used by CSV import. */
export function guessGenre(subjects: string[]) {
  const haystack = subjects.slice(0, 25).join(" | ").toLowerCase();
  for (const [genre, keywords] of GENRE_KEYWORDS) {
    if (keywords.some((k) => haystack.includes(k))) return genre;
  }
  return haystack.includes("fiction") ? "Fiction" : undefined;
}
