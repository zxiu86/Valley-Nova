import { Injectable, PLATFORM_ID, computed, inject, signal } from '@angular/core';
import { DOCUMENT, isPlatformBrowser } from '@angular/common';

export type SiteTheme = 'light' | 'dark';

export interface MosaicTile {
  id: number;
  row: number;
  col: number;
  delayMs: number;
  bgColor: string;
  borderColor: string;
  rotateDeg: number;
  disperseX: number;
  disperseY: number;
}

const THEME_STORAGE_KEY = 'mtx_site_theme';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly document = inject(DOCUMENT);

  readonly theme = signal<SiteTheme>('dark');
  readonly isDark = computed(() => this.theme() === 'dark');

  // Mosaic Transition Orchestration (12 GPU-composited tiles)
  readonly isMosaicActive = signal<boolean>(false);
  readonly mosaicDispersing = signal<boolean>(false);
  readonly mosaicRows = signal<number>(3);
  readonly mosaicCols = signal<number>(4);
  readonly mosaicTiles = signal<MosaicTile[]>([]);

  private transitionTimer: ReturnType<typeof setTimeout> | null = null;
  private rafId: number | null = null;
  private rafInnerId: number | null = null;

  init(): void {
    if (!isPlatformBrowser(this.platformId)) return;

    let initial: SiteTheme = 'dark';
    try {
      const saved = localStorage.getItem(THEME_STORAGE_KEY);
      if (saved === 'light' || saved === 'dark') {
        initial = saved;
      }
    } catch {
      initial = 'dark';
    }

    this.applyThemeToDom(initial);
  }

  setTheme(next: SiteTheme): void {
    this.applyThemeToDom(next);
  }

  toggleThemeWithMosaic(): void {
    if (this.isMosaicActive()) return;

    const currentTheme = this.theme();
    const nextTheme: SiteTheme = currentTheme === 'dark' ? 'light' : 'dark';

    if (!isPlatformBrowser(this.platformId)) {
      this.applyThemeToDom(nextTheme);
      return;
    }

    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (prefersReducedMotion) {
      this.applyThemeToDom(nextTheme);
      return;
    }

    const savedScrollY = window.scrollY;
    const width = window.innerWidth;
    // Strictly 12 tiles across all viewports (3x4 on narrow mobile, 4x3 on tablet/desktop)
    const cols = width < 640 ? 3 : 4;
    const rows = width < 640 ? 4 : 3;

    const outgoingPalette =
      currentTheme === 'dark'
        ? ['#131315', '#17161a', '#1b1a1e', '#151418']
        : ['#F7F7FA', '#FFFFFF', '#F0EFF5', '#ECEAF2'];

    const outgoingBorder =
      currentTheme === 'dark' ? 'rgba(255, 255, 255, 0.04)' : 'rgba(33, 29, 43, 0.05)';

    const tiles: MosaicTile[] = [];
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const idx = r * cols + c;
        // Smooth diagonal wave from top-right (RTL origin) to bottom-left
        const waveStep = (cols - 1 - c) * 0.7 + r * 0.8;
        const delayMs = Math.round(waveStep * 26);
        const shade = outgoingPalette[(r * 3 + c * 5) % outgoingPalette.length];
        const rotateDeg = ((r + c) % 2 === 0 ? 1 : -1) * (2.5 + ((r + c) % 3));
        const disperseX = Math.round((c / Math.max(1, cols - 1) - 0.5) * 28);
        const disperseY = Math.round((r / Math.max(1, rows - 1) - 0.5) * 22 - 8);

        tiles.push({
          id: idx,
          row: r,
          col: c,
          delayMs,
          bgColor: shade,
          borderColor: outgoingBorder,
          rotateDeg,
          disperseX,
          disperseY,
        });
      }
    }

    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
    if (this.rafInnerId !== null) {
      cancelAnimationFrame(this.rafInnerId);
      this.rafInnerId = null;
    }

    this.mosaicRows.set(rows);
    this.mosaicCols.set(cols);
    this.mosaicTiles.set(tiles);
    this.mosaicDispersing.set(false);
    this.isMosaicActive.set(true);

    // Paint the 12 solid tiles first, switch theme offscreen beneath them, then smoothly disperse
    this.rafId = requestAnimationFrame(() => {
      this.applyThemeToDom(nextTheme);
      if (Math.abs(window.scrollY - savedScrollY) > 1) {
        window.scrollTo({ top: savedScrollY, behavior: 'instant' as ScrollBehavior });
      }

      this.rafInnerId = requestAnimationFrame(() => {
        this.mosaicDispersing.set(true);
      });
    });

    const maxDelay = Math.max(...tiles.map((t) => t.delayMs), 0);
    const totalDurationMs = maxDelay + 360;

    if (this.transitionTimer) {
      clearTimeout(this.transitionTimer);
    }
    this.transitionTimer = setTimeout(() => {
      this.isMosaicActive.set(false);
      this.mosaicDispersing.set(false);
      this.mosaicTiles.set([]);
      this.transitionTimer = null;
    }, totalDurationMs);
  }

  private applyThemeToDom(next: SiteTheme): void {
    this.theme.set(next);
    if (!isPlatformBrowser(this.platformId)) return;

    const root = this.document.documentElement;
    if (next === 'dark') {
      root.classList.add('dark');
      root.classList.remove('light');
      root.style.colorScheme = 'dark';
    } else {
      root.classList.remove('dark');
      root.classList.add('light');
      root.style.colorScheme = 'light';
    }

    try {
      localStorage.setItem(THEME_STORAGE_KEY, next);
    } catch {
      // Ignore storage quota errors
    }
  }
}
