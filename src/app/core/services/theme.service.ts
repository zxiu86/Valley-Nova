import { Injectable, PLATFORM_ID, computed, inject, signal } from '@angular/core';
import { DOCUMENT, isPlatformBrowser } from '@angular/common';

export type SiteTheme = 'light' | 'dark';

const THEME_STORAGE_KEY = 'mtx_site_theme';

interface ViewTransitionLike {
  ready: Promise<void>;
  finished: Promise<void>;
}

type DocumentWithViewTransition = Document & {
  startViewTransition?: (updateCallback: () => void) => ViewTransitionLike;
};

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly document = inject(DOCUMENT);

  readonly theme = signal<SiteTheme>('dark');
  readonly isDark = computed(() => this.theme() === 'dark');

  // Smooth GPU-composited theme transition state
  readonly isPaperRevealActive = signal<boolean>(false);
  readonly paperRevealPeeling = signal<boolean>(false);
  readonly paperRevealOutgoingBg = signal<string>('#131315');
  readonly paperRevealEdgeColor = signal<string>('rgba(233, 195, 73, 0.24)');
  readonly paperRevealDirection = signal<'to-light' | 'to-dark'>('to-light');
  readonly usingViewTransition = signal<boolean>(false);
  readonly revealOriginX = signal<number>(0);
  readonly revealOriginY = signal<number>(48);
  readonly revealEndRadius = signal<number>(1200);

  private transitionTimer: ReturnType<typeof setTimeout> | null = null;
  private rafId: number | null = null;
  private rafInnerId: number | null = null;
  private lastPointerX: number | null = null;
  private lastPointerY: number | null = null;
  private pointerListenerAttached = false;

  init(): void {
    if (!isPlatformBrowser(this.platformId)) return;

    this.attachPointerOriginTracker();

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

    this.clearTimers();

    const { x, y, radius } = this.resolveOrigin();
    this.revealOriginX.set(x);
    this.revealOriginY.set(y);
    this.revealEndRadius.set(radius);

    const outgoingBg = currentTheme === 'dark' ? '#131315' : '#F7F7FA';
    const edgeColor =
      nextTheme === 'light' ? 'rgba(233, 195, 73, 0.28)' : 'rgba(158, 27, 66, 0.24)';

    this.paperRevealOutgoingBg.set(outgoingBg);
    this.paperRevealEdgeColor.set(edgeColor);
    this.paperRevealDirection.set(nextTheme === 'light' ? 'to-light' : 'to-dark');
    this.paperRevealPeeling.set(false);
    this.isPaperRevealActive.set(true);

    const doc = this.document as DocumentWithViewTransition;
    const root = this.document.documentElement;
    const savedScrollY = window.scrollY;

    // Preferred path: Native View Transitions API — zero blank-screen flash, true GPU snapshot radial reveal
    if (typeof doc.startViewTransition === 'function') {
      this.usingViewTransition.set(true);
      root.classList.add('theme-instant-swap');

      try {
        const transition = doc.startViewTransition(() => {
          this.applyThemeToDom(nextTheme);
          if (Math.abs(window.scrollY - savedScrollY) > 1) {
            window.scrollTo({ top: savedScrollY, behavior: 'instant' as ScrollBehavior });
          }
        });

        transition.ready
          .then(() => {
            this.paperRevealPeeling.set(true);
            try {
              root.animate(
                {
                  clipPath: [
                    `circle(0px at ${x}px ${y}px)`,
                    `circle(${radius}px at ${x}px ${y}px)`,
                  ],
                  opacity: [0.92, 1],
                },
                {
                  duration: 540,
                  easing: 'cubic-bezier(0.22, 1, 0.36, 1)',
                  pseudoElement: '::view-transition-new(root)',
                }
              );
            } catch {
              // Ignore pseudo-element animation fallback errors
            }
          })
          .catch(() => {
            // View transition skipped; state already updated cleanly
          });

        transition.finished
          .catch(() => {
            // Ignore cancellation
          })
          .finally(() => {
            this.finishReveal(root);
          });

        this.transitionTimer = setTimeout(() => {
          this.finishReveal(root);
        }, 640);
        return;
      } catch {
        root.classList.remove('theme-instant-swap');
        this.usingViewTransition.set(false);
      }
    }

    // Fallback path: Synchronized surface color interpolation + delicate non-blocking radial aura
    this.usingViewTransition.set(false);
    root.classList.add('theme-transitioning');

    this.rafId = requestAnimationFrame(() => {
      this.applyThemeToDom(nextTheme);
      if (Math.abs(window.scrollY - savedScrollY) > 1) {
        window.scrollTo({ top: savedScrollY, behavior: 'instant' as ScrollBehavior });
      }

      this.rafInnerId = requestAnimationFrame(() => {
        this.paperRevealPeeling.set(true);
      });
    });

    this.transitionTimer = setTimeout(() => {
      this.finishReveal(root);
    }, 460);
  }

  private finishReveal(root: HTMLElement): void {
    this.clearTimers();
    root.classList.remove('theme-instant-swap');
    root.classList.remove('theme-transitioning');
    this.isPaperRevealActive.set(false);
    this.paperRevealPeeling.set(false);
    this.usingViewTransition.set(false);
  }

  private clearTimers(): void {
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
    if (this.rafInnerId !== null) {
      cancelAnimationFrame(this.rafInnerId);
      this.rafInnerId = null;
    }
    if (this.transitionTimer !== null) {
      clearTimeout(this.transitionTimer);
      this.transitionTimer = null;
    }
  }

  private attachPointerOriginTracker(): void {
    if (this.pointerListenerAttached) return;
    this.pointerListenerAttached = true;

    this.document.addEventListener(
      'pointerdown',
      (ev: PointerEvent) => {
        if (Number.isFinite(ev.clientX) && Number.isFinite(ev.clientY)) {
          this.lastPointerX = ev.clientX;
          this.lastPointerY = ev.clientY;
        }
      },
      { passive: true, capture: true }
    );
  }

  private resolveOrigin(): { x: number; y: number; radius: number } {
    const vw = typeof window !== 'undefined' ? window.innerWidth || 1280 : 1280;
    const vh = typeof window !== 'undefined' ? window.innerHeight || 800 : 800;

    let x = this.lastPointerX;
    let y = this.lastPointerY;

    const activeEl = this.document.activeElement as HTMLElement | null;
    if (activeEl && typeof activeEl.getBoundingClientRect === 'function') {
      const rect = activeEl.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        x = rect.left + rect.width / 2;
        y = rect.top + rect.height / 2;
      }
    }

    if (x === null || y === null) {
      const isRtl = this.document.documentElement.dir === 'rtl';
      x = isRtl ? 72 : Math.max(vw - 72, 48);
      y = 48;
    }

    const radius = Math.hypot(Math.max(x, vw - x), Math.max(y, vh - y));
    return { x, y, radius };
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
