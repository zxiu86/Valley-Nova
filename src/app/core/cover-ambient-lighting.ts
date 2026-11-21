export interface AmbientRgb {
  r: number;
  g: number;
  b: number;
}

export interface AdaptiveAmbientPalette {
  auraPrimary: string;
  auraSecondary: string;
  auraTertiary: string;
  edgeLeft: string;
  edgeRight: string;
  borderTint: string;
  shadowTint: string;
  surfaceTint: string;
  isFallback: boolean;
}

interface HslColor {
  h: number;
  s: number;
  l: number;
}

interface BucketAccumulator {
  sumR: number;
  sumG: number;
  sumB: number;
  weight: number;
}

export function rgbToHsl(r: number, g: number, b: number): HslColor {
  const rn = r / 255;
  const gn = g / 255;
  const bn = b / 255;
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const l = (max + min) / 2;

  if (max === min) {
    return { h: 0, s: 0, l };
  }

  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h = 0;

  if (max === rn) {
    h = (gn - bn) / d + (gn < bn ? 6 : 0);
  } else if (max === gn) {
    h = (bn - rn) / d + 2;
  } else {
    h = (rn - gn) / d + 4;
  }

  h *= 60;
  return { h, s, l };
}

export function hslToRgb(h: number, s: number, l: number): AmbientRgb {
  if (s === 0) {
    const v = Math.round(l * 255);
    return { r: v, g: v, b: v };
  }

  const hue2rgb = (p: number, q: number, t: number): number => {
    let tt = t;
    if (tt < 0) tt += 1;
    if (tt > 1) tt -= 1;
    if (tt < 1 / 6) return p + (q - p) * 6 * tt;
    if (tt < 1 / 2) return q;
    if (tt < 2 / 3) return p + (q - p) * (2 / 3 - tt) * 6;
    return p;
  };

  const hn = ((h % 360) + 360) % 360 / 360;
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;

  return {
    r: Math.round(hue2rgb(p, q, hn + 1 / 3) * 255),
    g: Math.round(hue2rgb(p, q, hn) * 255),
    b: Math.round(hue2rgb(p, q, hn - 1 / 3) * 255),
  };
}

function circularHueDistance(h1: number, h2: number): number {
  const diff = Math.abs(h1 - h2);
  return Math.min(diff, 360 - diff);
}

/**
 * Extracts 2 to 4 vibrant, distinct RGB colors from sampled pixel data,
 * filtering out pure black, pure white, low-saturation grays, and near-duplicates.
 */
export function extractDominantColorsFromPixels(
  data: Uint8ClampedArray,
  maxColors = 4
): AmbientRgb[] {
  const buckets = new Map<number, BucketAccumulator>();

  for (let i = 0; i < data.length; i += 4) {
    const a = data[i + 3];
    if (a < 140) continue;

    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const { h, s, l } = rgbToHsl(r, g, b);

    // Filter out pure black, pure white, and washed-out/achromatic grays
    if (l < 0.11 || l > 0.89 || s < 0.17) continue;

    // 18 hue bins (20 deg each) × 2 luminance bands (mid-dark vs mid-bright)
    const hueBin = Math.floor((((h % 360) + 360) % 360) / 20);
    const lumBand = l >= 0.52 ? 1 : 0;
    const key = hueBin * 2 + lumBand;

    // Prioritize higher saturation and pleasant mid-range lightness
    const vibrancyWeight = (0.4 + s * 1.4) * (1 - Math.abs(l - 0.5) * 0.75);
    const existing = buckets.get(key);
    if (existing) {
      existing.sumR += r * vibrancyWeight;
      existing.sumG += g * vibrancyWeight;
      existing.sumB += b * vibrancyWeight;
      existing.weight += vibrancyWeight;
    } else {
      buckets.set(key, {
        sumR: r * vibrancyWeight,
        sumG: g * vibrancyWeight,
        sumB: b * vibrancyWeight,
        weight: vibrancyWeight,
      });
    }
  }

  if (buckets.size === 0) return [];

  const candidates = Array.from(buckets.values())
    .sort((a, b) => b.weight - a.weight)
    .map((bkt) => {
      const r = Math.round(bkt.sumR / bkt.weight);
      const g = Math.round(bkt.sumG / bkt.weight);
      const b = Math.round(bkt.sumB / bkt.weight);
      return { rgb: { r, g, b }, hsl: rgbToHsl(r, g, b) };
    });

  const selected: { rgb: AmbientRgb; hsl: HslColor }[] = [];
  for (const cand of candidates) {
    const isTooSimilar = selected.some(
      (picked) =>
        circularHueDistance(picked.hsl.h, cand.hsl.h) < 30 &&
        Math.abs(picked.hsl.l - cand.hsl.l) < 0.22
    );
    if (!isTooSimilar) {
      selected.push(cand);
    }
    if (selected.length >= maxColors) break;
  }

  // Ensure at least 2 distinct colors when the cover is largely monochromatic
  if (selected.length === 1) {
    const base = selected[0].hsl;
    const complementaryShift = hslToRgb(
      (base.h + 36) % 360,
      Math.max(0.32, Math.min(0.82, base.s * 0.9)),
      Math.max(0.28, Math.min(0.72, base.l > 0.5 ? base.l - 0.16 : base.l + 0.16))
    );
    selected.push({
      rgb: complementaryShift,
      hsl: rgbToHsl(complementaryShift.r, complementaryShift.g, complementaryShift.b),
    });
  }

  return selected.map((item) => item.rgb);
}

function calibrateColorForTheme(color: AmbientRgb, isDark: boolean): AmbientRgb {
  const { h, s, l } = rgbToHsl(color.r, color.g, color.b);
  const tunedSat = Math.max(0.34, Math.min(0.86, s * 1.08));
  const tunedLum = isDark
    ? Math.max(0.42, Math.min(0.66, l))
    : Math.max(0.36, Math.min(0.58, l));
  return hslToRgb(h, tunedSat, tunedLum);
}

function rgba(c: AmbientRgb, alpha: number): string {
  return `rgba(${c.r}, ${c.g}, ${c.b}, ${alpha})`;
}

export function buildAdaptiveAmbientPalette(
  colors: AmbientRgb[] | null | undefined,
  isDark: boolean
): AdaptiveAmbientPalette {
  const isFallback = !colors || colors.length === 0;
  const fallbackColors: AmbientRgb[] = isDark
    ? [
        { r: 214, g: 64, b: 102 },
        { r: 233, g: 195, b: 73 },
        { r: 136, g: 19, b: 55 },
      ]
    : [
        { r: 158, g: 27, b: 66 },
        { r: 181, g: 135, b: 13 },
        { r: 13, g: 122, b: 90 },
      ];

  const source = isFallback ? fallbackColors : colors;
  const c1 = calibrateColorForTheme(source[0], isDark);
  const c2 = calibrateColorForTheme(source[1] || source[0], isDark);
  const c3 = calibrateColorForTheme(source[2] || source[1] || source[0], isDark);
  const c4 = calibrateColorForTheme(source[3] || source[2] || source[0], isDark);

  return {
    auraPrimary: rgba(c1, isDark ? 0.34 : 0.24),
    auraSecondary: rgba(c2, isDark ? 0.28 : 0.2),
    auraTertiary: rgba(c3, isDark ? 0.22 : 0.16),
    edgeLeft: rgba(c1, isDark ? 0.24 : 0.16),
    edgeRight: rgba(c4, isDark ? 0.22 : 0.15),
    borderTint: rgba(c2, isDark ? 0.34 : 0.26),
    shadowTint: rgba(c1, isDark ? 0.38 : 0.18),
    surfaceTint: rgba(c3, isDark ? 0.12 : 0.08),
    isFallback,
  };
}

const extractedPaletteCache = new Map<string, AmbientRgb[]>();
const inFlightExtractions = new Map<string, Promise<AmbientRgb[]>>();

export function getCachedRawAmbientColors(coverUrl: string): AmbientRgb[] | undefined {
  return extractedPaletteCache.get(coverUrl);
}

/**
 * Samples dominant cover colors asynchronously using an offscreen canvas.
 * Memoizes per URL and gracefully falls back to [] on CORS, SSR, or decode failures.
 */
export async function extractCoverAmbientColors(coverUrl?: string | null): Promise<AmbientRgb[]> {
  if (!coverUrl || typeof window === 'undefined' || typeof document === 'undefined') {
    return [];
  }
  const cleanUrl = coverUrl.trim();
  if (!cleanUrl) return [];

  const cached = extractedPaletteCache.get(cleanUrl);
  if (cached) return cached;

  const inflight = inFlightExtractions.get(cleanUrl);
  if (inflight) return inflight;

  const task = new Promise<AmbientRgb[]>((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.decoding = 'async';

    let settled = false;
    const finish = (colors: AmbientRgb[]) => {
      if (settled) return;
      settled = true;
      inFlightExtractions.delete(cleanUrl);
      if (colors.length > 0) {
        extractedPaletteCache.set(cleanUrl, colors);
      }
      resolve(colors);
    };

    const timer = setTimeout(() => finish([]), 4500);

    img.onload = () => {
      clearTimeout(timer);
      try {
        const size = 40;
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        if (!ctx) {
          finish([]);
          return;
        }
        ctx.drawImage(img, 0, 0, size, size);
        const imageData = ctx.getImageData(0, 0, size, size);
        const extracted = extractDominantColorsFromPixels(imageData.data, 4);
        finish(extracted);
      } catch {
        // SecurityError when remote CDN omits CORS headers — clean theme fallback handles it
        finish([]);
      }
    };

    img.onerror = () => {
      clearTimeout(timer);
      finish([]);
    };

    img.src = cleanUrl;
  });

  inFlightExtractions.set(cleanUrl, task);
  return task;
}
