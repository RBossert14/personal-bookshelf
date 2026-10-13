/**
 * Pulls a spine-friendly color out of a cover image. Covers from Open Library
 * are served with CORS headers, so the canvas stays readable.
 */
export async function extractCoverColor(url: string): Promise<string | undefined> {
  const image = await loadImage(url).catch(() => undefined);
  if (!image) return undefined;

  const size = 32;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const context = canvas.getContext("2d", { willReadFrequently: true });
  if (!context) return undefined;

  try {
    context.drawImage(image, 0, 0, size, size);
    const { data } = context.getImageData(0, 0, size, size);
    return pickColor(data);
  } catch {
    return undefined; // tainted canvas
  }
}

function loadImage(url: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.crossOrigin = "anonymous";
    image.onload = () => resolve(image);
    image.onerror = reject;
    image.src = url;
  });
}

/**
 * Buckets pixels by hue and returns the average of the most vivid, populous bucket.
 * Near-white and near-black pixels (paper margins, title text) are ignored.
 */
function pickColor(data: Uint8ClampedArray) {
  const buckets = new Map<number, { r: number; g: number; b: number; weight: number }>();

  for (let i = 0; i < data.length; i += 4) {
    const [r, g, b] = [data[i], data[i + 1], data[i + 2]];
    const [h, s, l] = rgbToHsl(r, g, b);
    if (l < 0.08 || l > 0.92) continue;
    const key = Math.round(h * 12) % 12;
    const weight = 0.25 + s;
    const bucket = buckets.get(key) ?? { r: 0, g: 0, b: 0, weight: 0 };
    bucket.r += r * weight;
    bucket.g += g * weight;
    bucket.b += b * weight;
    bucket.weight += weight;
    buckets.set(key, bucket);
  }

  let best: { r: number; g: number; b: number; weight: number } | undefined;
  for (const bucket of buckets.values()) {
    if (!best || bucket.weight > best.weight) best = bucket;
  }
  if (!best) return undefined;

  const [h, s, l] = rgbToHsl(best.r / best.weight, best.g / best.weight, best.b / best.weight);
  // A black-and-white cover has no hue worth keeping; let the palette choose.
  if (s < 0.1) return undefined;
  // Keep spines rich and readable: no pastels, no pure black.
  return hslToHex(h, Math.min(Math.max(s, 0.28), 0.62), Math.min(Math.max(l, 0.26), 0.56));
}

function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  if (max === min) return [0, 0, l];
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h: number;
  if (max === r) h = (g - b) / d + (g < b ? 6 : 0);
  else if (max === g) h = (b - r) / d + 2;
  else h = (r - g) / d + 4;
  return [h / 6, s, l];
}

function hslToHex(h: number, s: number, l: number) {
  const f = (n: number) => {
    const k = (n + h * 12) % 12;
    const a = s * Math.min(l, 1 - l);
    const c = l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1));
    return Math.round(c * 255)
      .toString(16)
      .padStart(2, "0");
  };
  return `#${f(0)}${f(8)}${f(4)}`.toUpperCase();
}
