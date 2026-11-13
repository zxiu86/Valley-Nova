import { Injectable, PLATFORM_ID, computed, inject, signal } from '@angular/core';
import { DOCUMENT, isPlatformBrowser } from '@angular/common';

export type SiteTheme = 'light' | 'dark';

const THEME_STORAGE_KEY = 'mtx_site_theme';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly document = inject(DOCUMENT);

  readonly theme = signal<SiteTheme>('dark');
  readonly isDark = computed(() => this.theme() === 'dark');

  // Lightweight GPU-composited Paper Reveal theme transition
  readonly isPaperRevealActive = signal<boolean>(false);
  readonly paperRevealPeeling = signal<boolean>(false);
  readonly paperRevealOutgoingBg = signal<string>('#131315');
  readonly paperRevealEdgeColor = signal<string>('rgba(233, 195, 73, 0.24)');
  readonly paperRevealDirection = signal<'to-light' | 'to-dark'>('to-light');

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

  toggleThemeWithPaperReveal(): void {
    if (this.isPaperRevealActive()) return;

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
    const outgoingBg = currentTheme === 'dark' ? '#131315' : '#F7F7FA';
    const edgeColor =
      currentTheme === 'dark' ? 'rgba(233, 195, 73, 0.26)' : 'rgba(158, 27, 66, 0.2)';

    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
    if (this.rafInnerId !== null) {
      cancelAnimationFrame(this.rafInnerId);
      this.rafInnerId = null;
    }

    this.paperRevealOutgoingBg.set(outgoingBg);
    this.paperRevealEdgeColor.set(edgeColor);
    this.paperRevealDirection.set(nextTheme === 'light' ? 'to-light' : 'to-dark');
    this.paperRevealPeeling.set(false);
    this.isPaperRevealActive.set(true);

    // Paint single paper sheet matching outgoing theme, swap theme underneath, then smoothly peel away
    this.rafId = requestAnimationFrame(() => {
      this.applyThemeToDom(nextTheme);
      if (Math.abs(window.scrollY - savedScrollY) > 1) {
        window.scrollTo({ top: savedScrollY, behavior: 'instant' as ScrollBehavior });
      }

      this.rafInnerId = requestAnimationFrame(() => {
        this.paperRevealPeeling.set(true);
      });
    });

    if (this.transitionTimer) {
      clearTimeout(this.transitionTimer);
    }
    this.transitionTimer = setTimeout(() => {
      this.isPaperRevealActive.set(false);
      this.paperRevealPeeling.set(false);
      this.transitionTimer = null;
    }, 480);
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
