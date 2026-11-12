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

  // Mosaic Transition Orchestration
  readonly isMosaicActive = signal<boolean>(false);
  readonly mosaicDispersing = signal<boolean>(false);
  readonly mosaicRows = signal<number>(8);
  readonly mosaicCols = signal<number>(14);
  readonly mosaicTiles = signal<MosaicTile[]>([]);

  private transitionTimer: ReturnType<typeof setTimeout> | null = null;
  private rafId: number | null = null;

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

    // Preserve exact scroll position across transition
    const savedScrollY = window.scrollY;

    const width = window.innerWidth;
    const cols = width < 640 ? 7 : width < 1024 ? 11 : 15;
    const rows = width < 640 ? 11 : width < 1024 ? 8 : 9;

    const outgoingPalette =
      currentTheme === 'dark'
        ? ['#131315', '#17161a', '#1c1b1d', '#19171c', '#201f22']
        : ['#F7F7FA', '#FFFFFF', '#F0EFF5', '#F4F2F8', '#ECEAF2'];

    const outgoingBorder =
      currentTheme === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(33, 29, 43, 0.07)';

    const tiles: MosaicTile[] = [];
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const idx = r * cols + c;
        // Smooth sequential diagonal wave across screen (right-to-left aware in RTL + top-to-bottom)
        const waveStep = (cols - 1 - c) * 0.55 + r * 0.65;
        const delayMs = Math.round(waveStep * 20);
        const shade = outgoingPalette[(r * 3 + c * 5) % outgoingPalette.length];
        const rotateDeg = ((r + c) % 2 === 0 ? 1 : -1) * (4 + ((r * c) % 5));
        const disperseX = (c / Math.max(1, cols - 1) - 0.5) * 28;
        const disperseY = (r / Math.max(1, rows - 1) - 0.5) * 24 - 8;

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

    this.mosaicRows.set(rows);
    this.mosaicCols.set(cols);
    this.mosaicTiles.set(tiles);
    this.mosaicDispersing.set(false);
    this.isMosaicActive.set(true);

    // Wait 1 paint frame so the solid outgoing mosaic covers the viewport smoothly before DOM theme switches
    this.rafId = requestAnimationFrame(() => {
      this.applyThemeToDom(nextTheme);
      window.scrollTo({ top: savedScrollY, behavior: 'instant' as ScrollBehavior });

      this.rafId = requestAnimationFrame(() => {
        this.mosaicDispersing.set(true);
      });
    });

    const maxDelay = Math.max(...tiles.map((t) => t.delayMs), 0);
    const totalDurationMs = maxDelay + 420;

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
