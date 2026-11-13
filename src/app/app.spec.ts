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
import { isArabicCatalogNovel } from './core/mtx-catalog-data';
import { getChaptersForNovel } from './core/mtx-reader-chapters';
import { SiteHeader } from './shared/components/site-header/site-header';

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

  it('should instantiate App shell and all 6 modular page components cleanly', () => {
    const i18n = TestBed.inject(I18nService);
    i18n.setLanguage('ar', false);

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

    const detailsFixture = TestBed.createComponent(DetailsPage);
    detailsFixture.detectChanges();
    expect((detailsFixture.nativeElement as HTMLElement).textContent?.length).toBeGreaterThan(0);

    const exploreFixture = TestBed.createComponent(ExplorePage);
    exploreFixture.detectChanges();
    expect((exploreFixture.nativeElement as HTMLElement).textContent?.length).toBeGreaterThan(0);

    const lib = TestBed.inject(LibraryStateService);
    lib.openChapter(lib.chapters[0]);
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

    i18n.setLanguage('ar', false);
    lib.openNovelDetails(lib.defaultEchoesSamarkand);
    const arDetails = TestBed.createComponent(DetailsPage);
    arDetails.detectChanges();
    const arDetailsText = (arDetails.nativeElement as HTMLElement).textContent || '';
    expect(arDetailsText).toContain('To English');
    expect(arDetailsText).toContain(
      'يمكنك قراءة الرواية باللغة الإنجليزية، حيث تتحول الفصول إلى نسختها الإنجليزية عند توفرها.'
    );

    i18n.setLanguage('en', false);
    const enDetails = TestBed.createComponent(DetailsPage);
    enDetails.detectChanges();
    const enDetailsText = (enDetails.nativeElement as HTMLElement).textContent || '';
    expect(enDetailsText).toContain('إلى العربية');
    expect(enDetailsText).toContain(
      'Switch the novel chapters to their Arabic versions when available.'
    );

    expect(getChaptersForNovel('echoes-of-samarkand', 'ar').length).toBe(24);
    expect(getChaptersForNovel('echoes-of-samarkand', 'en').length).toBe(12);
    expect(getChaptersForNovel('hayy-ibn-yaqzan', 'en').length).toBe(0);
    expect(getChaptersForNovel('frankenstein-classic', 'ar').length).toBe(0);
    expect(getChaptersForNovel('frankenstein-classic', 'en').length).toBe(4);

    // Independent progress per (novelId, chapterLanguage, chapterNumber)
    localStorage.setItem('mtx_last_chap_echoes-of-samarkand_ar', '4');
    localStorage.setItem('mtx_read_pct_echoes-of-samarkand_ar_4', '50');
    localStorage.setItem('mtx_last_chap_echoes-of-samarkand_en', '1');
    localStorage.setItem('mtx_read_pct_echoes-of-samarkand_en_1', '0');

    lib.setNovelChapterLanguage('ar');
    const arProgress = lib.selectedChapterLangProgressPercent();
    lib.setNovelChapterLanguage('en');
    const enProgress = lib.selectedChapterLangProgressPercent();
    expect(arProgress).toBeGreaterThan(enProgress);

    // Directional missing-translation hints for single-language books
    const arabicOnlyWork = lib.exploreBooksList().find((b) => b.id === 'lisan-al-arab-ibn-manzur')!;
    expect(arabicOnlyWork).toBeDefined();
    lib.openNovelDetails(arabicOnlyWork);
    i18n.setLanguage('ar', false);
    const arOnlyFixture = TestBed.createComponent(DetailsPage);
    arOnlyFixture.detectChanges();
    expect((arOnlyFixture.nativeElement as HTMLElement).textContent).toContain(
      'لا توجد فصول إنجليزية متوفرة لهذا المصنف بعد'
    );

    const frankenstein = lib.exploreBooksList().find((b) => b.id === 'frankenstein-classic')!;
    expect(frankenstein).toBeDefined();
    lib.openNovelDetails(frankenstein);
    const frankFixture = TestBed.createComponent(DetailsPage);
    frankFixture.detectChanges();
    expect((frankFixture.nativeElement as HTMLElement).textContent).toContain(
      'لا توجد فصول عربية متوفرة لهذا المصنف بعد'
    );

    // Partial Spotlight/Serendipity NovelCard enrichment from canonical catalog
    lib.openNovelDetails({
      id: 'echoes-of-samarkand',
      title: lib.spotlight.title,
      genre: lib.spotlight.genre,
      coverUrl: lib.spotlight.coverUrl,
      coverAlt: lib.spotlight.coverAlt,
      description: lib.spotlight.quote,
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
    i18n.setLanguage('en', false);
    lib.openChapter(lib.chapters[0]);

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
    i18n.setLanguage('ar', false);

    lib.currentView.set('novels');
    const appFixture = TestBed.createComponent(App);
    appFixture.detectChanges();
    const mainEl = (appFixture.nativeElement as HTMLElement).querySelector('#main-content');
    expect(mainEl?.className).toContain('pt-[76px]');

    lib.openChapter(lib.chapters[0]);
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
});
