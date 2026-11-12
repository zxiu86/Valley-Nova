import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { describe, it, expect, beforeEach } from 'vitest';
import { compressToMtx, decompressFromMtx } from './core/mtx-codec';
import { App } from './app';
import { ThemeService } from './core/services/theme.service';
import { CopyProtectionService } from './core/copy-protection/copy-protection.service';
import { HomePage } from './pages/home/home-page';
import { DetailsPage } from './pages/details/details-page';
import { ExplorePage } from './pages/explore/explore-page';
import { ReadingPage } from './pages/reading/reading-page';
import { AuthPage } from './pages/auth/auth-page';
import { ProfilePage } from './pages/profile/profile-page';
import { LibraryStateService } from './core/services/library-state.service';

describe('MTX Compression, Shell, Theme, Routes & Copy Protection Specs', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [App, HomePage, DetailsPage, ExplorePage, ReadingPage, AuthPage, ProfilePage],
      providers: [provideRouter([])],
    });
  });

  it('should compress and decompress Arabic text with full diacritics losslessly', async () => {
    const sampleText = 'بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ - مَحَطَّةُ التَّرْمِيزِ وَالضَّغْطِ الثُّنَائِيِّ لِلنُّصُوصِ العَرَبِيَّةِ المُشَكَّلَةِ';
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

  it('should persist light and dark theme preference and trigger strictly 12 mosaic tiles via ThemeService', () => {
    const themeService = TestBed.inject(ThemeService);
    themeService.init();
    themeService.setTheme('light');
    expect(themeService.theme()).toBe('light');
    expect(themeService.isDark()).toBe(false);
    expect(localStorage.getItem('mtx_site_theme')).toBe('light');

    themeService.toggleThemeWithMosaic();
    expect(themeService.isMosaicActive()).toBe(true);
    expect(themeService.mosaicTiles().length).toBe(12);
    expect(themeService.mosaicRows() * themeService.mosaicCols()).toBe(12);

    themeService.setTheme('dark');
    expect(themeService.theme()).toBe('dark');
    expect(themeService.isDark()).toBe(true);
    expect(localStorage.getItem('mtx_site_theme')).toBe('dark');
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

  it('should normalize and validate Latin/numeric/underscore usernames case-insensitively and block reserved names', async () => {
    const { normalizeUsername, validateUsernameFormat } = await import('./core/mtx-firebase');

    expect(normalizeUsername('  @Zaid_05  ')).toBe('zaid_05');
    expect(validateUsernameFormat('Zaid').valid).toBe(true);
    expect(validateUsernameFormat('Zaid').normalized).toBe('zaid');
    expect(validateUsernameFormat('za_99').valid).toBe(true);
    expect(validateUsernameFormat('ab').valid).toBe(false);
    expect(validateUsernameFormat('زيد').valid).toBe(false);
    expect(validateUsernameFormat('admin').reserved).toBe(true);
    expect(validateUsernameFormat('Admin').valid).toBe(false);
  });

  it('should render ProfilePage private guard state without exposing personal details and enforce strict 2-stat limit', async () => {
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
});
