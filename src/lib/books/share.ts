import { SHELF_STATUSES, type Book } from "./types";

/**
 * A shared shelf is a snapshot packed into the link's #fragment. Browsers never
 * send the fragment to the server, so the books aren't stored anywhere but the link.
 */
export interface SharedShelf {
  name?: string;
  sharedAt: string;
  books: Book[];
}

/** Short keys keep links short. Only what a friend would see is included. */
interface PackedBook {
  t: string;
  a: string;
  s: number;
  y?: number;
  p?: number;
  cp?: number;
  g?: string;
  c?: string;
  k?: string;
  r?: number;
  n?: string;
  st?: string;
  f?: string;
}

interface Packed {
  v: 1;
  n?: string;
  d: string;
  b: PackedBook[];
}

function pack(books: Book[], name: string | undefined, includeNotes: boolean, now: Date): Packed {
  return {
    v: 1,
    n: name?.trim() || undefined,
    d: now.toISOString().slice(0, 10),
    b: books.map((book) => ({
      t: book.title,
      a: book.author,
      s: SHELF_STATUSES.indexOf(book.status),
      y: book.year,
      p: book.pages,
      cp: book.currentPage,
      g: book.genre,
      c: book.coverUrl,
      k: book.spineColor,
      r: book.rating,
      n: includeNotes ? book.notes : undefined,
      st: book.startedAt,
      f: book.finishedAt,
    })),
  };
}

function unpack(packed: Packed): SharedShelf {
  const stamp = `${packed.d}T00:00:00.000Z`;
  return {
    name: packed.n,
    sharedAt: packed.d,
    books: packed.b.map((b, i) => ({
      id: `shared-${i}`,
      title: b.t,
      author: b.a,
      status: SHELF_STATUSES[b.s] ?? "want",
      year: b.y,
      pages: b.p,
      currentPage: b.cp,
      genre: b.g,
      coverUrl: b.c,
      spineColor: b.k,
      rating: b.r,
      notes: b.n,
      startedAt: b.st,
      finishedAt: b.f,
      createdAt: stamp,
      updatedAt: stamp,
    })),
  };
}

async function transform(bytes: Uint8Array<ArrayBuffer>, stream: CompressionStream | DecompressionStream) {
  const output = new Blob([bytes]).stream().pipeThrough(stream);
  return new Uint8Array(await new Response(output).arrayBuffer());
}

function toBase64Url(bytes: Uint8Array) {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromBase64Url(text: string) {
  const binary = atob(text.replace(/-/g, "+").replace(/_/g, "/"));
  return Uint8Array.from(binary, (char) => char.charCodeAt(0));
}

/** Packs the shelf into the text that goes after `#` in a /shelf link. */
export async function encodeShelf(
  books: Book[],
  { name, includeNotes = false, now = new Date() }: { name?: string; includeNotes?: boolean; now?: Date } = {},
) {
  const json = JSON.stringify(pack(books, name, includeNotes, now));
  return toBase64Url(await transform(new TextEncoder().encode(json), new CompressionStream("deflate-raw")));
}

/** Reads a /shelf link's fragment. Throws if the link is cut short or isn't a shelf. */
export async function decodeShelf(fragment: string): Promise<SharedShelf> {
  const bytes = await transform(fromBase64Url(fragment.replace(/^#/, "")), new DecompressionStream("deflate-raw"));
  const packed = JSON.parse(new TextDecoder().decode(bytes)) as Packed;
  if (packed?.v !== 1 || !Array.isArray(packed.b)) throw new Error("Not a shared shelf");
  return unpack(packed);
}
