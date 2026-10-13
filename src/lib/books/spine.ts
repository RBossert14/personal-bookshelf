import type { Book } from "./types";

/** Spine colors drawn from the cottage palette, used when a cover has no usable color. */
const FALLBACK_SPINES = [
  "#5E7456", // sage
  "#B8475A", // rosehip
  "#23343B", // bottle ink
  "#C98A2B", // marigold, deepened for spine contrast
  "#8A5A2B", // oak grain
  "#4F6D8A", // dusk blue
  "#6B4A63", // plum
  "#6F7D3A", // moss
];

function hash(text: string) {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function spineColor(book: Pick<Book, "title" | "spineColor">) {
  return book.spineColor ?? FALLBACK_SPINES[hash(book.title) % FALLBACK_SPINES.length];
}

/** Thin paperbacks get narrow spines, doorstoppers get wide ones. */
export function spineWidth(pages = 300) {
  const clamped = Math.min(Math.max(pages, 80), 900);
  return Math.round(26 + ((clamped - 80) / (900 - 80)) * 38);
}

/** Small height variation so the shelf doesn't look machine-cut. Returns a percentage. */
export function spineHeight(title: string) {
  return 82 + (hash(title) % 17);
}

function luminance(hex: string) {
  const [r, g, b] = [1, 3, 5].map((i) => {
    const c = parseInt(hex.slice(i, i + 2), 16) / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** Picks paper-white or ink lettering, whichever reads better on the spine. */
export function spineInk(background: string) {
  return luminance(background) > 0.32 ? "#23343B" : "#FBF8EE";
}
