import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import { Injectable, PLATFORM_ID, computed, inject, signal } from '@angular/core';
import { SiteLanguage } from '../models/library.models';
import {
  GENRE_DISPLAY_MAP_EN,
  ORIGIN_LANGUAGE_EN_MAP,
  TAG_EN_MAP,
  TRANSLATIONS,
} from '../i18n/translations';
import { setFirebaseAuthLanguage } from '../mtx-firebase';

export const LANG_STORAGE_KEY = 'mtx_site_lang';

export function detectDeviceLanguage(nav?: {
  language?: string;
  languages?: readonly string[];
}): SiteLanguage {
  const candidates: string[] = [];
  if (nav?.languages && Array.isArray(nav.languages)) {
    for (const l of nav.languages) {
      if (typeof l === 'string' && l.trim()) candidates.push(l.trim().toLowerCase());
    }
  }
  if (nav?.language && typeof nav.language === 'string') {
    candidates.push(nav.language.trim().toLowerCase());
  }

  for (const code of candidates) {
    if (code.startsWith('ar')) return 'ar';
    if (code.startsWith('en')) return 'en';
  }
  return 'ar';
}

@Injectable({ providedIn: 'root' })
export class I18nService {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly document = inject(DOCUMENT);
  private initialized = false;

  readonly lang = signal<SiteLanguage>('ar');
  readonly dir = computed<'rtl' | 'ltr'>(() => (this.lang() === 'ar' ? 'rtl' : 'ltr'));
  readonly isRtl = computed<boolean>(() => this.lang() === 'ar');
  readonly copy = computed(() => TRANSLATIONS[this.lang()]);

  init(): void {
    if (this.initialized) return;
    this.initialized = true;

    let initial: SiteLanguage = 'ar';
    if (isPlatformBrowser(this.platformId)) {
      try {
        const saved = localStorage.getItem(LANG_STORAGE_KEY);
        if (saved === 'ar' || saved === 'en') {
          initial = saved;
        } else {
          initial = detectDeviceLanguage(typeof navigator !== 'undefined' ? navigator : undefined);
        }
      } catch {
        initial = detectDeviceLanguage(typeof navigator !== 'undefined' ? navigator : undefined);
      }
    }

    this.applyLanguageToDom(initial, false);
  }

  setLanguage(next: SiteLanguage, persist = true): void {
    this.applyLanguageToDom(next, persist);
  }

  toggleLanguage(): SiteLanguage {
    const next: SiteLanguage = this.lang() === 'ar' ? 'en' : 'ar';
    this.applyLanguageToDom(next, true);
    return next;
  }

  syncDocumentMeta(view: 'novels' | 'details' | 'explore' | 'auth' | 'profile' | 'reader' = 'novels'): void {
    if (!isPlatformBrowser(this.platformId)) return;
    const dict = this.copy();
    const title = dict.site.titles[view] || dict.site.pageTitleDefault;
    this.document.title = title;
    const metaDesc = this.document.querySelector('meta[name="description"]');
    if (metaDesc) {
      metaDesc.setAttribute('content', dict.site.pageDescription);
    }
  }

  formatNumber(n: number): string {
    if (this.lang() === 'en') {
      return n.toString();
    }
    const digits = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
    return n.toString().replace(/\d/g, (d) => digits[+d]);
  }

  displayGenre(rawGenre?: string): string {
    if (!rawGenre) return '';
    if (this.lang() === 'ar') return rawGenre;
    return GENRE_DISPLAY_MAP_EN[rawGenre] || rawGenre;
  }

  displayOriginLanguage(rawOrigin?: string): string {
    if (!rawOrigin) return this.lang() === 'ar' ? 'عربي أصيل' : 'Arabic Original';
    if (this.lang() === 'ar') return rawOrigin;
    return ORIGIN_LANGUAGE_EN_MAP[rawOrigin] || rawOrigin;
  }

  displayTag(rawTag: string): string {
    if (this.lang() === 'ar') return rawTag;
    return TAG_EN_MAP[rawTag] || rawTag;
  }

  private applyLanguageToDom(next: SiteLanguage, persist: boolean): void {
    this.lang.set(next);
    setFirebaseAuthLanguage(next);

    if (!isPlatformBrowser(this.platformId)) return;

    const root = this.document.documentElement;
    root.setAttribute('lang', next);
    root.setAttribute('dir', next === 'ar' ? 'rtl' : 'ltr');

    if (persist) {
      try {
        localStorage.setItem(LANG_STORAGE_KEY, next);
      } catch {
        // Ignore storage quota errors
      }
    }
  }
}
