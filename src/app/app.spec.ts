import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { describe, it, expect, beforeEach } from 'vitest';
import { compressToMtx, decompressFromMtx } from './core/mtx-codec';
import { App } from './app';
import { ThemeService } from './core/services/theme.service';
import { I18nService, detectDeviceLanguage, LANG_STORAGE_KEY } from './core/services/i18n.service';
import { CopyProtectionService } from './core/copy-protection/copy-protection.service';
import { HomePage } from './pages/home/home-page';
import { DetailsPage } from './pages/details/details-page';
import { ExplorePage } from './pages/explore/explore-page';
import { ReadingPage } from './pages/reading/reading-page';
import { AuthPage } from './pages/auth/auth-page';
import { ProfilePage } from './pages/profile/profile-page';
import { LibraryStateService } from './core/services/library-state.service';
import { WriterStudioService } from './core/services/writer-studio.service';
import { isArabicCatalogNovel } from './core/mtx-catalog-data';
import { getChaptersForNovel } from './core/mtx-reader-chapters';
import { LogicalChapter, NovelCard } from './core/models/library.models';
import { SiteHeader } from './shared/components/site-header/site-header';

function createTestNovelsAndChapters(): {
  novels: NovelCard[];
  chaptersByNovel: Record<string, LogicalChapter[]>;
} {
  const bilingualNovel: NovelCard = {
    id: 'test-bilingual-novel',
    title: 'أصداء سمرقند',
    titleEn: 'Echoes of Samarkand',
    author: 'طارق الأندلسي',
    genre: 'رواية تاريخية',
    categoryGroup: 'novels',
    workType: 'original',
    languageCode: 'ar',
    originLanguage: 'العربية',
    coverUrl: 'https://picsum.photos/seed/testcover/400/600',
    coverAlt: 'غلاف رواية أصداء سمرقند',
    description: 'رواية اختبارية ثنائية اللغة لفحص الفصول.',
    readingHours: 3,
    publishedChapterCount: 2,
    isFirestoreBacked: true,
  };

  const arabicOnlyNovel: NovelCard = {
    id: 'test-ar-only-novel',
    title: 'سفر المخطوطات',
    author: 'زينب القيروانية',
    genre: 'تراث وأدب',
    categoryGroup: 'heritage',
    workType: 'original',
    languageCode: 'ar',
    originLanguage: 'العربية',
    coverUrl: 'https://picsum.photos/seed/testar/400/600',
    coverAlt: 'غلاف سفر المخطوطات',
    description: 'مصنف عربي خالص للاختبار.',
    readingHours: 2,
    publishedChapterCount: 1,
    isFirestoreBacked: true,
  };

  const englishOnlyNovel: NovelCard = {
    id: 'test-en-only-novel',
    title: 'Modern Prometheus Notes',
    titleEn: 'Modern Prometheus Notes',
    author: 'Clara Vance',
    genre: 'الغموض والتشويق',
    categoryGroup: 'novels',
    workType: 'original',
    languageCode: 'en',
    originLanguage: 'English',
    coverUrl: 'https://picsum.photos/seed/testen/400/600',
    coverAlt: 'Cover of Modern Prometheus Notes',
    description: 'English-only test novel.',
    readingHours: 2,
    publishedChapterCount: 1,
    isFirestoreBacked: true,
  };

  const nowIso = '2026-11-14T00:00:00.000Z';

  const bilingualChapters: LogicalChapter[] = [
    {
      id: 'bch-1',
      novelId: bilingualNovel.id,
      authorId: 'test-author-1',
      chapterNumber: 1,
      chapterType: 'narrative',
      endStatus: 'ongoing',
      languageMode: 'both',
      isPublished: true,
      title: 'الباب الأول',
      titleEn: 'The First Gate',
      revision: 1,
      wordCountAr: 240,
      wordCountEn: 210,
      createdAt: nowIso,
      updatedAt: nowIso,
      editions: {
        ar: {
          title: 'الباب الأول',
          blocks: [
            {
              id: 'blk-ar-1',
              type: 'paragraph',
              text: 'في تلك الليلة الهادئة على مشارف سمرقند، دوّن النساخ أول سطر من السجل.',
            },
          ],
          plainText: 'في تلك الليلة الهادئة على مشارف سمرقند، دوّن النساخ أول سطر من السجل.',
          wordCount: 240,
          updatedAt: nowIso,
        },
        en: {
          title: 'The First Gate',
          blocks: [
            {
              id: 'blk-en-1',
              type: 'paragraph',
              text: 'On that quiet night outside Samarkand, scribes inked the opening line of the chronicle.',
            },
          ],
          plainText: 'On that quiet night outside Samarkand, scribes inked the opening line of the chronicle.',
          wordCount: 210,
          updatedAt: nowIso,
        },
      },
    },
    {
      id: 'bch-2',
      novelId: bilingualNovel.id,
      authorId: 'test-author-1',
      chapterNumber: 2,
      chapterType: 'explanatory',
      endStatus: 'ongoing',
      languageMode: 'ar',
      isPublished: true,
      title: 'هامش توضيحي',
      titleEn: 'Explanatory Note',
      revision: 1,
      wordCountAr: 120,
      wordCountEn: 0,
      createdAt: nowIso,
      updatedAt: nowIso,
      editions: {
        ar: {
          title: 'هامش توضيحي',
          blocks: [
            {
              id: 'blk-ar-2',
              type: 'paragraph',
              text: 'توضيح تاريخي موجز لمصطلحات الرواق.',
            },
          ],
          plainText: 'توضيح تاريخي موجز لمصطلحات الرواق.',
          wordCount: 120,
          updatedAt: nowIso,
        },
      },
    },
  ];

  const arOnlyChapters: LogicalChapter[] = [
    {
      id: 'ach-1',
      novelId: arabicOnlyNovel.id,
      authorId: 'test-author-2',
      chapterNumber: 1,
      chapterType: 'narrative',
      endStatus: 'ongoing',
      languageMode: 'ar',
      isPublished: true,
      title: 'المفتتح',
      revision: 1,
      wordCountAr: 180,
      wordCountEn: 0,
      createdAt: nowIso,
      updatedAt: nowIso,
      editions: {
        ar: {
          title: 'المفتتح',
          blocks: [
            {
              id: 'blk-ach-1',
              type: 'paragraph',
              text: 'نص عربي خالص من المخطوطة المحفوظة.',
            },
          ],
          plainText: 'نص عربي خالص من المخطوطة المحفوظة.',
          wordCount: 180,
          updatedAt: nowIso,
        },
      },
    },
  ];

  const enOnlyChapters: LogicalChapter[] = [
    {
      id: 'ech-1',
      novelId: englishOnlyNovel.id,
      authorId: 'test-author-3',
      chapterNumber: 1,
      chapterType: 'narrative',
      endStatus: 'ongoing',
      languageMode: 'en',
      isPublished: true,
      title: 'Prologue in Ice',
      titleEn: 'Prologue in Ice',
      revision: 1,
      wordCountAr: 0,
      wordCountEn: 190,
      createdAt: nowIso,
      updatedAt: nowIso,
      editions: {
        en: {
          title: 'Prologue in Ice',
          blocks: [
            {
              id: 'blk-ech-1',
              type: 'paragraph',
              text: 'Frozen winds crossed the northern ridge as the journal began.',
            },
          ],
          plainText: 'Frozen winds crossed the northern ridge as the journal began.',
          wordCount: 190,
          updatedAt: nowIso,
        },
      },
    },
  ];

  return {
    novels: [bilingualNovel, arabicOnlyNovel, englishOnlyNovel],
    chaptersByNovel: {
      [bilingualNovel.id]: bilingualChapters,
      [arabicOnlyNovel.id]: arOnlyChapters,
      [englishOnlyNovel.id]: enOnlyChapters,
    },
  };
}

describe('MTX Compression, Shell, Theme, Bilingual i18n, Chapters & Copy Protection Specs', () => {
  beforeEach(() => {
    try {
      localStorage.removeItem(LANG_STORAGE_KEY);
      localStorage.removeItem('mtx_site_theme');
    } catch {
      // Ignore storage access restrictions
    }
    TestBed.configureTestingModule({
      imports: [App, HomePage, DetailsPage, ExplorePage, ReadingPage, AuthPage, ProfilePage],
      providers: [provideRouter([])],
    });
  });

  it('should compress and decompress Arabic text with full diacritics losslessly', async () => {
    const sampleText =
      'بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ - مَحَطَّةُ التَّرْمِيزِ وَالضَّغْطِ الثُّنَائِيِّ لِلنُّصُوصِ العَرَبِيَّةِ المُشَكَّلَةِ';
    const metadata = {
      title: 'سفر البداية',
      author: 'محرك الترميز',
      chapterTitle: 'الفصل الأول',
      chapterIndex: 1,
      createdAt: new Date().toISOString(),
    };

    const compressed = await compressToMtx(sampleText, metadata);
    expect(compressed.isLossless).toBe(true);
    expect(compressed.compressedBytes).toBeGreaterThan(0);

    const decompressed = await decompressFromMtx(compressed.mtxBytes);
    expect(decompressed.isLossless).toBe(true);
    expect(decompressed.text).toBe(sampleText);
    expect(decompressed.metadata.title).toBe(metadata.title);
  });

  it('should start with zero fake/mock data and instantiate App shell and all 6 modular page components cleanly', () => {
    const i18n = TestBed.inject(I18nService);
    const lib = TestBed.inject(LibraryStateService);
    const writerStudio = TestBed.inject(WriterStudioService);
    i18n.setLanguage('ar', false);

    // Zero hardcoded/fake catalog, quotes, works, or salons by default
    expect(lib.exploreBooksList().length).toBe(0);
    expect(lib.featuredSpotlight()).toBeNull();
    expect(lib.totalPublishedChaptersCount()).toBe(0);
    expect(lib.profileQuotes().length).toBe(0);
    expect(lib.profileWorks().length).toBe(0);
    expect(lib.literarySalons().length).toBe(0);

    const { novels, chaptersByNovel } = createTestNovelsAndChapters();
    lib.exploreBooksList.set(novels);
    writerStudio.publicNovelDetailsCache.set({
      [novels[0].id]: { sections: [], chapters: chaptersByNovel[novels[0].id] },
      [novels[1].id]: { sections: [], chapters: chaptersByNovel[novels[1].id] },
      [novels[2].id]: { sections: [], chapters: chaptersByNovel[novels[2].id] },
    });

    const appFixture = TestBed.createComponent(App);
    const app = appFixture.componentInstance;
    expect(app).toBeDefined();
    expect(app.compressForm).toBeDefined();
    expect(app.lib).toBeDefined();

    const homeFixture = TestBed.createComponent(HomePage);
    homeFixture.detectChanges();
    const featuredRail = (homeFixture.nativeElement as HTMLElement).querySelector('#featuredRail');
    expect(featuredRail).toBeTruthy();
    expect(featuredRail?.className).toContain('flex-row');
    expect(featuredRail?.className).toContain('overflow-x-auto');

    lib.openNovelDetails(novels[0]);
    const detailsFixture = TestBed.createComponent(DetailsPage);
    detailsFixture.detectChanges();
    const detailsEl = detailsFixture.nativeElement as HTMLElement;
    expect(detailsEl.textContent?.length).toBeGreaterThan(0);
    // Cover is plain & unobstructed (no 3D spine gradient overlay or golden ribbon)
    expect(detailsEl.querySelector('#book-details img')).toBeTruthy();
    expect(detailsEl.querySelector('#book-details .w-6.h-20')).toBeNull();
    expect(detailsEl.querySelector('#book-details .w-8.bg-gradient-to-l')).toBeNull();

    const exploreFixture = TestBed.createComponent(ExplorePage);
    exploreFixture.detectChanges();
    expect((exploreFixture.nativeElement as HTMLElement).textContent?.length).toBeGreaterThan(0);

    const firstChap = lib.availableChaptersForNovel()[0];
    expect(firstChap).toBeDefined();
    lib.openChapter(firstChap);
    const readingFixture = TestBed.createComponent(ReadingPage);
    readingFixture.detectChanges();
    const readingHtml = (readingFixture.nativeElement as HTMLElement).innerHTML;
    expect(readingHtml).toContain('mtx-copy-protected');
    expect(readingHtml).not.toContain('h-[2px] z-50');

    const authFixture = TestBed.createComponent(AuthPage);
    authFixture.detectChanges();
    expect((authFixture.nativeElement as HTMLElement).textContent?.length).toBeGreaterThan(0);

    const profileFixture = TestBed.createComponent(ProfilePage);
    profileFixture.detectChanges();
    expect((profileFixture.nativeElement as HTMLElement).textContent?.length).toBeGreaterThan(0);
  });

  it('should persist light and dark theme preference and trigger GPU Paper Reveal transition via ThemeService', () => {
    const themeService = TestBed.inject(ThemeService);
    themeService.init();
    themeService.setTheme('light');
    expect(themeService.theme()).toBe('light');
    expect(themeService.isDark()).toBe(false);
    expect(localStorage.getItem('mtx_site_theme')).toBe('light');

    themeService.toggleThemeWithPaperReveal();
    expect(themeService.isPaperRevealActive()).toBe(true);
    expect(themeService.paperRevealDirection()).toBe('to-dark');

    themeService.setTheme('dark');
    expect(themeService.theme()).toBe('dark');
    expect(themeService.isDark()).toBe(true);
    expect(localStorage.getItem('mtx_site_theme')).toBe('dark');
  });

  it('should detect device language on first visit, persist manual switching, and sync HTML lang & dir attributes', () => {
    expect(detectDeviceLanguage({ language: 'en-US' })).toBe('en');
    expect(detectDeviceLanguage({ language: 'ar-SA' })).toBe('ar');
    expect(detectDeviceLanguage({ language: 'fr-FR' })).toBe('ar');
    expect(detectDeviceLanguage({ languages: ['es-ES', 'en-GB'] })).toBe('en');

    const i18n = TestBed.inject(I18nService);
    i18n.setLanguage('en', true);
    expect(i18n.lang()).toBe('en');
    expect(i18n.dir()).toBe('ltr');
    expect(document.documentElement.getAttribute('lang')).toBe('en');
    expect(document.documentElement.getAttribute('dir')).toBe('ltr');
    expect(localStorage.getItem(LANG_STORAGE_KEY)).toBe('en');

    i18n.setLanguage('ar', true);
    expect(i18n.lang()).toBe('ar');
    expect(i18n.dir()).toBe('rtl');
    expect(document.documentElement.getAttribute('lang')).toBe('ar');
    expect(document.documentElement.getAttribute('dir')).toBe('rtl');
    expect(localStorage.getItem(LANG_STORAGE_KEY)).toBe('ar');
  });

  it('should render opposite-language Spotlight button copy and filter Explore strictly without changing UI language', () => {
    const i18n = TestBed.inject(I18nService);
    const lib = TestBed.inject(LibraryStateService);
    const { novels } = createTestNovelsAndChapters();
    lib.exploreBooksList.set(novels);

    i18n.setLanguage('ar', false);
    const arHome = TestBed.createComponent(HomePage);
    arHome.detectChanges();
    expect((arHome.nativeElement as HTMLElement).textContent).toContain('ENGLISH');

    lib.openExploreByHeroLanguage();
    expect(i18n.lang()).toBe('ar');
    expect(lib.exploreLanguageScope()).toBe('non-ar');
    expect(lib.filteredExploreBooks().length).toBeGreaterThan(0);
    expect(lib.filteredExploreBooks().every((b) => !isArabicCatalogNovel(b))).toBe(true);

    i18n.setLanguage('en', false);
    const enHome = TestBed.createComponent(HomePage);
    enHome.detectChanges();
    expect((enHome.nativeElement as HTMLElement).textContent).toContain('العربية');

    lib.openExploreByHeroLanguage();
    expect(i18n.lang()).toBe('en');
    expect(lib.exploreLanguageScope()).toBe('ar');
    expect(lib.filteredExploreBooks().length).toBeGreaterThan(0);
    expect(lib.filteredExploreBooks().every((b) => isArabicCatalogNovel(b))).toBe(true);

    lib.setExploreLanguageScope('all');
    i18n.setLanguage('ar', false);
  });

  it('should render Details Liquid Glass chapter language copy, resolve genuine linked chapters, and isolate progress per language', () => {
    const i18n = TestBed.inject(I18nService);
    const lib = TestBed.inject(LibraryStateService);
    const writerStudio = TestBed.inject(WriterStudioService);
    const { novels, chaptersByNovel } = createTestNovelsAndChapters();

    lib.exploreBooksList.set(novels);
    writerStudio.publicNovelDetailsCache.set({
      [novels[0].id]: { sections: [], chapters: chaptersByNovel[novels[0].id] },
      [novels[1].id]: { sections: [], chapters: chaptersByNovel[novels[1].id] },
      [novels[2].id]: { sections: [], chapters: chaptersByNovel[novels[2].id] },
    });

    i18n.setLanguage('ar', false);
    lib.openNovelDetails(novels[0]);
    const arDetails = TestBed.createComponent(DetailsPage);
    arDetails.detectChanges();
    const arDetailsText = (arDetails.nativeElement as HTMLElement).textContent || '';
    expect(arDetailsText).toContain('To English');
    expect(arDetailsText).toContain(
      'يمكنك قراءة الرواية باللغة الإنجليزية، حيث تتحول الفصول إلى نسختها الإنجليزية عند توفرها.'
    );
    expect(arDetailsText).toContain('الباب الأول');

    i18n.setLanguage('en', false);
    const enDetails = TestBed.createComponent(DetailsPage);
    enDetails.detectChanges();
    const enDetailsText = (enDetails.nativeElement as HTMLElement).textContent || '';
    expect(enDetailsText).toContain('إلى العربية');
    expect(enDetailsText).toContain(
      'Switch the novel chapters to their Arabic versions when available.'
    );

    expect(
      getChaptersForNovel(novels[0].id, 'ar', novels[0], chaptersByNovel[novels[0].id]).length
    ).toBe(2);
    expect(
      getChaptersForNovel(novels[0].id, 'en', novels[0], chaptersByNovel[novels[0].id]).length
    ).toBe(1);
    expect(
      getChaptersForNovel(novels[1].id, 'en', novels[1], chaptersByNovel[novels[1].id]).length
    ).toBe(0);
    expect(
      getChaptersForNovel(novels[2].id, 'ar', novels[2], chaptersByNovel[novels[2].id]).length
    ).toBe(0);
    expect(
      getChaptersForNovel(novels[2].id, 'en', novels[2], chaptersByNovel[novels[2].id]).length
    ).toBe(1);

    // Independent progress per (novelId, chapterLanguage, chapterNumber)
    localStorage.setItem(`mtx_last_chap_${novels[0].id}_ar`, '1');
    localStorage.setItem(`mtx_read_pct_${novels[0].id}_ar_1`, '50');
    localStorage.setItem(`mtx_last_chap_${novels[0].id}_en`, '1');
    localStorage.setItem(`mtx_read_pct_${novels[0].id}_en_1`, '0');

    lib.setNovelChapterLanguage('ar');
    const arProgress = lib.selectedChapterLangProgressPercent();
    lib.setNovelChapterLanguage('en');
    const enProgress = lib.selectedChapterLangProgressPercent();
    expect(arProgress).toBeGreaterThan(enProgress);

    // Directional missing-translation hints for single-language books
    lib.openNovelDetails(novels[1]);
    i18n.setLanguage('ar', false);
    const arOnlyFixture = TestBed.createComponent(DetailsPage);
    arOnlyFixture.detectChanges();
    expect((arOnlyFixture.nativeElement as HTMLElement).textContent).toContain(
      'لا توجد فصول إنجليزية متوفرة لهذا المصنف بعد'
    );

    lib.openNovelDetails(novels[2]);
    const enOnlyFixture = TestBed.createComponent(DetailsPage);
    enOnlyFixture.detectChanges();
    expect((enOnlyFixture.nativeElement as HTMLElement).textContent).toContain(
      'لا توجد فصول عربية متوفرة لهذا المصنف بعد'
    );

    // Partial NovelCard enrichment from canonical catalog
    lib.openNovelDetails({
      id: novels[0].id,
      title: novels[0].title,
      genre: novels[0].genre,
      coverUrl: novels[0].coverUrl,
      coverAlt: novels[0].coverAlt,
      description: novels[0].description,
    });
    expect(lib.selectedNovel()?.author).toBeTruthy();
    expect(lib.selectedNovel()?.languageCode).toBe('ar');
    expect(lib.selectedNovel()?.readingHours).toBeGreaterThan(0);

    i18n.setLanguage('ar', false);
  });

  it('should exempt form inputs from copy protection while preventing casual copy on protected prose', () => {
    const protection = TestBed.inject(CopyProtectionService);
    protection.init();

    const inputEl = document.createElement('input');
    const textareaEl = document.createElement('textarea');
    const proseEl = document.createElement('p');
    document.body.appendChild(inputEl);
    document.body.appendChild(textareaEl);
    document.body.appendChild(proseEl);

    const inputCopyEvent = new Event('copy', { bubbles: true, cancelable: true });
    inputEl.dispatchEvent(inputCopyEvent);
    expect(inputCopyEvent.defaultPrevented).toBe(false);

    const textareaCopyEvent = new Event('copy', { bubbles: true, cancelable: true });
    textareaEl.dispatchEvent(textareaCopyEvent);
    expect(textareaCopyEvent.defaultPrevented).toBe(false);

    const proseCopyEvent = new Event('copy', { bubbles: true, cancelable: true });
    proseEl.dispatchEvent(proseCopyEvent);
    expect(proseCopyEvent.defaultPrevented).toBe(true);

    inputEl.remove();
    textareaEl.remove();
    proseEl.remove();
    protection.destroy();
  });

  it('should normalize and validate 4–24 char usernames and enforce @zid exclusive admin exception', async () => {
    const { normalizeUsername, validateUsernameFormat } = await import('./core/mtx-firebase');

    expect(normalizeUsername('  @Zaid_05  ')).toBe('zaid_05');
    expect(validateUsernameFormat('Zaid').valid).toBe(true);
    expect(validateUsernameFormat('Zaid').normalized).toBe('zaid');
    expect(validateUsernameFormat('za_99').valid).toBe(true);
    expect(validateUsernameFormat('abc').valid).toBe(false);
    expect(validateUsernameFormat('ab').valid).toBe(false);
    expect(validateUsernameFormat('زيد').valid).toBe(false);
    expect(validateUsernameFormat('admin').reserved).toBe(true);
    expect(validateUsernameFormat('Admin').valid).toBe(false);
    expect(validateUsernameFormat('zid').valid).toBe(false);
    expect(validateUsernameFormat('zid').reserved).toBe(true);
    expect(validateUsernameFormat('zid', { isAdmin: true }).valid).toBe(true);
  });

  it('should render ProfilePage private guard state without exposing personal details and enforce strict 2-stat limit', async () => {
    const i18n = TestBed.inject(I18nService);
    i18n.setLanguage('ar', false);

    const { AccountService } = await import('./core/services/account.service');
    const accountService = TestBed.inject(AccountService);

    accountService.viewedState.set('private');
    accountService.viewedProfile.set(null);
    const privateFixture = TestBed.createComponent(ProfilePage);
    privateFixture.detectChanges();
    const privateText = (privateFixture.nativeElement as HTMLElement).textContent || '';
    expect(privateText).toContain('هذا الحساب خاص');

    accountService.viewedIsOwner.set(true);
    accountService.viewedWriterStatus.set({
      isWriterBadge: false,
      canPublish: false,
      isAdmin: false,
      roleKind: 'none',
      roleRecord: null,
    });
    accountService.viewedProfile.set({
      uid: 'u1',
      displayName: 'زيد الأدبي',
      username: 'zaid',
      bio: 'قارئ شغوف',
      photoURL: '',
      coverURL: '',
      isPublic: true,
      showSavedNovels: true,
      showReadingHistory: true,
      showProfileInfo: true,
      savedNovelsCount: 3,
      readChaptersCount: 7,
    });
    accountService.viewedState.set('ok');

    const okFixture = TestBed.createComponent(ProfilePage);
    okFixture.detectChanges();
    const okHtml = (okFixture.nativeElement as HTMLElement).textContent || '';
    expect(okHtml).toContain('زيد الأدبي');
    expect(okHtml).toContain('عدد الروايات المحفوظة');
    expect(okHtml).toContain('عدد الفصول المقروءة');
    expect(okHtml).not.toContain('أعمالي المنشورة');
    expect(okHtml).not.toContain('ساعات القراءة');
    expect(okHtml).not.toContain('المتابعين');
  });

  it('should map Firebase Google and Email auth errors cleanly in both Arabic and English diagnostics', async () => {
    const { mapGoogleAuthErrorMessage, mapEmailAuthErrorMessage } = await import(
      './core/services/auth-session.service'
    );

    expect(mapGoogleAuthErrorMessage({ code: 'auth/popup-closed-by-user' })).toBeNull();
    expect(
      mapGoogleAuthErrorMessage({ code: 'auth/unauthorized-domain' }, 'zxiu86.github.io', 'ar')
    ).toContain('zxiu86.github.io');
    expect(mapGoogleAuthErrorMessage({ code: 'auth/popup-blocked' }, '', 'ar')).toContain(
      'النافذة المنبثقة'
    );
    expect(mapGoogleAuthErrorMessage({ code: 'auth/operation-not-allowed' }, '', 'ar')).toContain(
      'Sign-in method'
    );
    expect(mapEmailAuthErrorMessage({ code: 'auth/invalid-credential' }, 'login', 'ar')).toContain(
      'غير صحيحة'
    );
    expect(
      mapEmailAuthErrorMessage({ code: 'auth/email-already-in-use' }, 'register', 'ar')
    ).toContain('مسجل مسبقاً');

    expect(mapGoogleAuthErrorMessage({ code: 'auth/popup-blocked' }, '', 'en')).toContain(
      'popup'
    );
    expect(mapEmailAuthErrorMessage({ code: 'auth/invalid-credential' }, 'login', 'en')).toContain(
      'Incorrect'
    );
  });

  it('should render single-line SiteHeader navigation and unified z-[60] Sanctuary Drawer cleanly in Arabic and English', () => {
    const i18n = TestBed.inject(I18nService);
    const lib = TestBed.inject(LibraryStateService);
    lib.isMobileNavOpen.set(false);

    i18n.setLanguage('en', false);
    const headerFixture = TestBed.createComponent(SiteHeader);
    headerFixture.detectChanges();
    const headerEl = headerFixture.nativeElement as HTMLElement;

    // Header has no bulky inline search input and enforces single-line nav buttons
    expect(headerEl.querySelector('header input[type="text"]')).toBeNull();
    const navButtons = Array.from(headerEl.querySelectorAll('header nav button'));
    expect(navButtons.length).toBe(6);
    expect(navButtons.every((btn) => btn.className.includes('whitespace-nowrap'))).toBe(true);

    // Opening main hamburger menu renders the z-[60] Sanctuary drawer with corridors and EN/AR controls
    lib.toggleMobileNav();
    headerFixture.detectChanges();
    const drawerWrapper = headerEl.querySelector('.fixed.inset-0.z-\\[60\\]');
    expect(drawerWrapper).toBeTruthy();
    const drawerAside = headerEl.querySelector('aside[role="dialog"]');
    expect(drawerAside?.className).toContain('liquid-glass-drawer');
    expect(drawerAside?.textContent).toContain('Eternity Corridors');
    expect(drawerAside?.textContent).toContain('Epics');
    expect(drawerAside?.textContent).toContain('Heroic sagas & ancient legends');

    i18n.setLanguage('ar', false);
    headerFixture.detectChanges();
    expect(drawerAside?.textContent).toContain('أروقة الخلود');
    expect(drawerAside?.textContent).toContain('الملاحم');
    expect(drawerAside?.textContent).toContain('حكايات البطولة والأساطير');

    lib.isMobileNavOpen.set(false);
  });

  it('should render all 3 ReadingPage drawers at z-[60] with localized theme cards, chapter search, and bookmark controls', () => {
    const i18n = TestBed.inject(I18nService);
    const lib = TestBed.inject(LibraryStateService);
    const writerStudio = TestBed.inject(WriterStudioService);
    const { novels, chaptersByNovel } = createTestNovelsAndChapters();

    lib.exploreBooksList.set(novels);
    writerStudio.publicNovelDetailsCache.set({
      [novels[0].id]: { sections: [], chapters: chaptersByNovel[novels[0].id] },
    });
    lib.openNovelDetails(novels[0]);
    i18n.setLanguage('en', false);
    lib.setNovelChapterLanguage('en');
    const enChap = lib.availableChaptersForNovel()[0];
    expect(enChap).toBeDefined();
    lib.openChapter(enChap);

    const readingFixture = TestBed.createComponent(ReadingPage);
    readingFixture.detectChanges();
    const el = readingFixture.nativeElement as HTMLElement;

    // 1. Settings Drawer with 4 localized reading paper themes
    lib.readerSettingsDrawerOpen.set(true);
    lib.readerChapterDrawerOpen.set(false);
    lib.readerBookmarksDrawerOpen.set(false);
    readingFixture.detectChanges();

    expect(el.querySelectorAll('.fixed.inset-0.z-\\[60\\]').length).toBe(1);
    const settingsAside = el.querySelector('aside[role="dialog"]');
    expect(settingsAside?.textContent).toContain('Andalusian Dark');
    expect(settingsAside?.textContent).toContain('Ancient Parchment');
    expect(settingsAside?.textContent).toContain('Warm Ivory');
    expect(settingsAside?.textContent).toContain('Crisp Daylight');

    lib.setReaderTheme('ivory');
    readingFixture.detectChanges();
    expect(lib.readerTheme()).toBe('ivory');

    // 2. Chapters Index Drawer + empty search state
    lib.readerSettingsDrawerOpen.set(false);
    lib.readerChapterDrawerOpen.set(true);
    lib.readerChapterSearch.setValue('__non_existent_chapter_query__');
    readingFixture.detectChanges();
    expect(el.textContent).toContain(i18n.copy().details.noChapterSearchResults);
    lib.readerChapterSearch.setValue('');

    // 3. Bookmarks Drawer
    lib.readerChapterDrawerOpen.set(false);
    lib.readerBookmarksDrawerOpen.set(true);
    readingFixture.detectChanges();
    expect(el.textContent).toContain(i18n.copy().reader.addBookmark);

    lib.readerBookmarksDrawerOpen.set(false);
    lib.setReaderTheme('andalusian');
    i18n.setLanguage('ar', false);
  });

  it('should apply fixed-header top clearance on non-reader views and center novel titles beneath covers', () => {
    const i18n = TestBed.inject(I18nService);
    const lib = TestBed.inject(LibraryStateService);
    const writerStudio = TestBed.inject(WriterStudioService);
    const { novels, chaptersByNovel } = createTestNovelsAndChapters();

    lib.exploreBooksList.set(novels);
    writerStudio.publicNovelDetailsCache.set({
      [novels[0].id]: { sections: [], chapters: chaptersByNovel[novels[0].id] },
    });
    lib.openNovelDetails(novels[0]);
    i18n.setLanguage('ar', false);

    lib.currentView.set('novels');
    const appFixture = TestBed.createComponent(App);
    appFixture.detectChanges();
    const mainEl = (appFixture.nativeElement as HTMLElement).querySelector('#main-content');
    expect(mainEl?.className).toContain('pt-[76px]');

    const firstChap = lib.availableChaptersForNovel()[0];
    lib.openChapter(firstChap);
    appFixture.detectChanges();
    expect(mainEl?.className).not.toContain('pt-[76px]');

    lib.currentView.set('novels');

    const homeFixture = TestBed.createComponent(HomePage);
    homeFixture.detectChanges();
    const homeTitles = (homeFixture.nativeElement as HTMLElement).querySelectorAll('h3.text-center');
    expect(homeTitles.length).toBeGreaterThan(0);

    lib.exploreViewMode.set('grid');
    const exploreFixture = TestBed.createComponent(ExplorePage);
    exploreFixture.detectChanges();
    const exploreTitles = (exploreFixture.nativeElement as HTMLElement).querySelectorAll(
      '#catalog-container .text-center h3'
    );
    expect(exploreTitles.length).toBeGreaterThan(0);
  });

  it('should validate writer application & role request bounds and localize Firestore permission errors without exposing JSON', async () => {
    const {
      validateWriterApplicationInput,
      validateRoleRequestInput,
      parseFirestoreErrorInfo,
      formatFirestoreErrorForUser,
      sanitizeNovelRecordForFirestore,
    } = await import('./core/mtx-firebase');

    // Writer application bounds match firestore.rules (penName>=2, shortBio>=5, genres>=1, writingSample>=20)
    expect(
      validateWriterApplicationInput(
        { penName: 'أ', shortBio: 'نبذة صالحة', genres: ['الرواية التاريخية'], writingSample: 'نص أدبي طويل يتجاوز عشرين حرفاً بوضوح.' },
        'ar'
      ).valid
    ).toBe(false);
    expect(
      validateWriterApplicationInput(
        { penName: 'طارق الأندلسي', shortBio: 'قليل', genres: ['الرواية التاريخية'], writingSample: 'نص أدبي طويل يتجاوز عشرين حرفاً بوضوح.' },
        'ar'
      ).valid
    ).toBe(false);
    expect(
      validateWriterApplicationInput(
        { penName: 'طارق الأندلسي', shortBio: 'كاتب روائي مهتم بالتاريخ', genres: ['الرواية التاريخية'], writingSample: 'قصير' },
        'en'
      ).valid
    ).toBe(false);
    expect(
      validateWriterApplicationInput(
        {
          penName: 'طارق الأندلسي',
          shortBio: 'كاتب روائي مهتم بالتاريخ',
          genres: ['الرواية التاريخية'],
          writingSample: 'في ليالي قرطبة الهادئة، كانت المخطوطات تروي ما عجزت عنه السيوف.',
        },
        'ar'
      ).valid
    ).toBe(true);

    // Role request validator
    expect(validateRoleRequestInput({ role: 'auditor', statement: 'قصير' }, 'ar').valid).toBe(false);
    expect(
      validateRoleRequestInput({ role: 'translate', statement: 'خبرة في الترجمة الأدبية من الإنجليزية إلى العربية.' }, 'en').valid
    ).toBe(true);

    // Raw FirestoreErrorInfo JSON must be parsed and converted to user-friendly localized messages (never dumped verbatim)
    const rawJsonErr = new Error(
      JSON.stringify({
        error: 'Missing or insufficient permissions.',
        operationType: 'create',
        path: 'writer_applications/user-123',
        authInfo: { userId: 'user-123', emailVerified: true },
      })
    );
    const parsed = parseFirestoreErrorInfo(rawJsonErr);
    expect(parsed?.path).toBe('writer_applications/user-123');

    const arMsg = formatFirestoreErrorForUser(rawJsonErr, 'ar');
    const enMsg = formatFirestoreErrorForUser(rawJsonErr, 'en');
    expect(arMsg).not.toContain('operationType');
    expect(enMsg).not.toContain('operationType');
    expect(arMsg).toContain('طلب الكاتب');
    expect(enMsg).toContain('writer application');

    const unauthErr = new Error(
      JSON.stringify({
        error: 'Missing or insufficient permissions.',
        operationType: 'write',
        path: 'role_requests/user-123__auditor',
        authInfo: { userId: null },
      })
    );
    expect(formatFirestoreErrorForUser(unauthErr, 'en')).toContain('sign in again');

    // sanitizeNovelRecordForFirestore strips unknown legacy keys that would break keys().hasOnly()
    const sanitized = sanitizeNovelRecordForFirestore({
      id: 'novel-test-1',
      title: '  أصداء الأندلس  ',
      authorId: 'uid-author-1',
      authorName: 'كاتب',
      description: 'ملخص أدبي متكامل لعمل روائي تاريخي طويل.',
      categoryGroup: 'novels',
      genre: 'رواية تاريخية',
      // Extra legacy fields casted in via Record
      ...({ author: 'Legacy Field', isCompleted: true, coverAlt: 'Alt' } as Record<string, unknown>),
    });
    expect('author' in sanitized).toBe(false);
    expect('isCompleted' in sanitized).toBe(false);
    expect('coverAlt' in sanitized).toBe(false);
    expect(sanitized.title).toBe('أصداء الأندلس');
  });
});
