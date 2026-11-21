import { describe, it, expect } from 'vitest';
import {
  buildAdaptiveAmbientPalette,
  extractCoverAmbientColors,
  extractDominantColorsFromPixels,
  hslToRgb,
  rgbToHsl,
} from './cover-ambient-lighting';

function createPixels(entries: [number, number, number, number?][]): Uint8ClampedArray {
  const arr = new Uint8ClampedArray(entries.length * 4);
  entries.forEach(([r, g, b, a = 255], idx) => {
    arr[idx * 4] = r;
    arr[idx * 4 + 1] = g;
    arr[idx * 4 + 2] = b;
    arr[idx * 4 + 3] = a;
  });
  return arr;
}

describe('cover-ambient-lighting (Adaptive Ambient Glow Engine)', () => {
  it('round-trips saturated RGB colors through HSL accurately', () => {
    const hsl = rgbToHsl(180, 48, 92);
    const back = hslToRgb(hsl.h, hsl.s, hsl.l);
    expect(Math.abs(back.r - 180)).toBeLessThanOrEqual(2);
    expect(Math.abs(back.g - 48)).toBeLessThanOrEqual(2);
    expect(Math.abs(back.b - 92)).toBeLessThanOrEqual(2);
  });

  it('filters out pure black, pure white, and low-saturation grays while retaining dominant saturated hues', () => {
    const pixels = createPixels([
      // Black / near-black noise
      [0, 0, 0],
      [8, 8, 10],
      // White / near-white highlights
      [255, 255, 255],
      [248, 248, 250],
      // Desaturated gray
      [120, 122, 124],
      // Transparent pixel
      [255, 0, 0, 10],
      // Rich crimson & warm amber pixels
      [190, 38, 72],
      [194, 42, 74],
      [216, 158, 36],
      [34, 152, 126],
    ]);

    const colors = extractDominantColorsFromPixels(pixels, 4);
    expect(colors.length).toBeGreaterThanOrEqual(2);
    expect(colors.length).toBeLessThanOrEqual(4);

    for (const c of colors) {
      const { s, l } = rgbToHsl(c.r, c.g, c.b);
      expect(s).toBeGreaterThan(0.15);
      expect(l).toBeGreaterThan(0.1);
      expect(l).toBeLessThan(0.9);
    }
  });

  it('returns empty array when pixels are exclusively monochrome black/white/gray', () => {
    const monochrome = createPixels([
      [0, 0, 0],
      [255, 255, 255],
      [140, 140, 140],
      [90, 92, 91],
    ]);

    expect(extractDominantColorsFromPixels(monochrome)).toEqual([]);
  });

  it('produces at least 2 distinct colors when cover has a single saturated hue', () => {
    const monoBlue = createPixels([
      [28, 98, 204],
      [32, 104, 210],
      [30, 100, 206],
    ]);

    const colors = extractDominantColorsFromPixels(monoBlue, 4);
    expect(colors.length).toBe(2);
    expect(colors[0]).not.toEqual(colors[1]);
  });

  it('calibrates theme-appropriate dark & light palettes and graceful fallbacks', () => {
    const fallbackDark = buildAdaptiveAmbientPalette([], true);
    expect(fallbackDark.isFallback).toBe(true);
    expect(fallbackDark.auraPrimary).toContain('rgba(');

    const extractedDark = buildAdaptiveAmbientPalette(
      [
        { r: 210, g: 55, b: 85 },
        { r: 225, g: 185, b: 58 },
      ],
      true
    );
    const extractedLight = buildAdaptiveAmbientPalette(
      [
        { r: 210, g: 55, b: 85 },
        { r: 225, g: 185, b: 58 },
      ],
      false
    );

    expect(extractedDark.isFallback).toBe(false);
    expect(extractedLight.isFallback).toBe(false);
    expect(extractedDark.auraPrimary).not.toBe(extractedLight.auraPrimary);
  });

  it('resolves cleanly to [] for empty cover URL or non-browser SSR environment', async () => {
    await expect(extractCoverAmbientColors('')).resolves.toEqual([]);
    await expect(extractCoverAmbientColors(null)).resolves.toEqual([]);
  });
});
