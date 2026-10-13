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

const PAPER_INK = "#FBF8EE";
const DARK_INK = "#23343B";

function channels(hex: string) {
  return [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
}

function luminance(hex: string) {
  const [r, g, b] = channels(hex).map((value) => {
    const c = value / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrast(a: string, b: string) {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

function darken(hex: string, amount: number) {
  return `#${channels(hex)
    .map((c) => Math.round(c * (1 - amount)).toString(16).padStart(2, "0"))
    .join("")}`;
}

/**
 * The spine's cloth color and lettering color, guaranteed to reach 4.5:1.
 * Mid-tone covers (where neither ink reads well) are darkened a little at a
 * time until paper-white lettering passes.
 */
export function spinePalette(book: Pick<Book, "title" | "spineColor">) {
  let background = spineColor(book);
  if (contrast(background, DARK_INK) >= 4.5 && contrast(background, DARK_INK) > contrast(background, PAPER_INK)) {
    return { background, ink: DARK_INK };
  }
  while (contrast(background, PAPER_INK) < 4.5) background = darken(background, 0.06);
  return { background, ink: PAPER_INK };
}
