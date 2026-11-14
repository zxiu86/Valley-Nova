import { Injectable, PLATFORM_ID, computed, effect, inject, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router } from '@angular/router';
import { Subscription, filter } from 'rxjs';
import {
  AppView,
  ChapterItem,
  ChapterLanguage,
  CorridorId,
  ExploreLanguageScope,
  LiterarySalon,
  LogicalChapter,
  NovelCard,
  NovelSection,
  ProfileQuote,
  ProfileWork,
  PublishedNovelRecord,
  ReaderBookmarkItem,
  ReaderFontFamilyId,
  ReaderThemeId,
  SerendipityNovel,
  SiteLanguage,
} from '../models/library.models';
import { compressToMtx } from '../mtx-codec';
import { isArabicCatalogNovel } from '../mtx-catalog-data';
import {
  ChapterTextContent,
  getChapterProse,
  getChaptersForNovel,
  getDefaultChapterLanguageForNovel,
} from '../mtx-reader-chapters';
import {
  commitVerifiedReadTransaction,
  fetchAllPublishedNovels,
  fetchCloudVaultBooks,
  fetchNovelByIdFromFirestore,
  formatFirestoreErrorForUser,
  getPublicAuthorAppearance,
  hasUserReportedNovel,
  publishNovelToFirestore,
  recordChapterReadInFirestore,
  removeBookmarkFromFirestore,
  saveBookmarkToFirestore,
  saveToCloudVault,
  startReadSessionWithServerTime,
  submitWorkReportToFirestore,
  syncSavedNovelsCountToFirestore,
} from '../mtx-firebase';
import { AuthSessionService } from './auth-session.service';
import { AccountService } from './account.service';
import { ThemeService } from './theme.service';
import { I18nService } from './i18n.service';
import { WriterStudioService } from './writer-studio.service';

const NAV_STORAGE_KEY = 'mtx_nav_state_v1';

@Injectable({ providedIn: 'root' })
export class LibraryStateService {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly router = inject(Router);
  readonly authSession = inject(AuthSessionService);
  readonly accountService = inject(AccountService);
  readonly themeService = inject(ThemeService);
  readonly i18n = inject(I18nService);
  readonly writerStudio = inject(WriterStudioService);

  // Navigation & View State ('novels' | 'details' | 'explore' | 'auth' | 'profile' | 'reader' | 'writer')
  readonly currentView = signal<AppView>('novels');
  readonly previousView = signal<Exclude<AppView, 'reader'>>('novels');
  readonly selectedNovel = signal<NovelCard | null>(null);
  readonly activeChapterText = signal<string>('');
  readonly bookmarkedIds = signal<Set<string>>(new Set());
  readonly toastMessage = signal<string | null>(null);
  private toastTimeout: ReturnType<typeof setTimeout> | null = null;

  // Profile View State
  readonly profileActiveTab = signal<'vault' | 'works' | 'quotes' | 'timeline' | 'rituals'>('vault');
  readonly vaultFilter = signal<'all' | 'reading' | 'bookmarked' | 'completed'>('all');
  readonly vaultSearchControl = new FormControl('', { nonNullable: true });
  readonly vaultSearchSignal = toSignal(this.vaultSearchControl.valueChanges, { initialValue: '' });
  readonly profileBannerUrl = signal<string>('/images/writers_sanctuary_bg.jpg');

  // Active Corridor Signal
  readonly activeCorridor = signal<CorridorId>('novels');

  // Header Interactive Modals & Drawers State
  readonly isSearchOpen = signal<boolean>(false);
  readonly isFilterOpen = signal<boolean>(false);
  readonly isBookmarksOpen = signal<boolean>(false);
  readonly isProfileOpen = signal<boolean>(false);
  readonly isMobileNavOpen = signal<boolean>(false);
  readonly isSiteSettingsOpen = signal<boolean>(false);
  readonly readerFontSize = signal<'sm' | 'md' | 'lg'>('md');
  readonly activeSortOrder = signal<'popular' | 'rating' | 'pages' | 'alphabetical'>('popular');
  readonly filterGenre = signal<string>('الكل');

  // Reader State
  readonly readerTheme = signal<ReaderThemeId>('andalusian');
  readonly readerFontFamily = signal<ReaderFontFamilyId>('amiri');
  readonly readerFontSizePx = signal<number>(22);
  readonly readerLineHeight = signal<number>(2.2);
  readonly readerMeasure = signal<'compact' | 'balanced' | 'wide' | 'fluid'>('balanced');
  readonly readerTextAlign = signal<'justify' | 'right'>('justify');
  readonly readerParagraphSpacing = signal<'compact' | 'normal' | 'relaxed'>('normal');
  readonly readerPadding = signal<'compact' | 'balanced' | 'generous'>('balanced');
  readonly readerToolbarVisible = signal<boolean>(true);
  readonly readerProgressPercent = signal<number>(0);
  readonly readerIsFullscreen = signal<boolean>(false);
  readonly readerAutoScrollActive = signal<boolean>(false);
  readonly readerAutoScrollSpeed = signal<1 | 2 | 3>(1);
  readonly readerSettingsDrawerOpen = signal<boolean>(false);
  readonly readerChapterDrawerOpen = signal<boolean>(false);
  readonly readerBookmarksDrawerOpen = signal<boolean>(false);
  readonly readerActiveChapterContent = signal<ChapterTextContent | null>(null);
  readonly readerBookmarks = signal<ReaderBookmarkItem[]>([]);
  readonly readerChapterSearch = new FormControl('', { nonNullable: true });
  readonly readerChapterSearchSignal = toSignal(this.readerChapterSearch.valueChanges, { initialValue: '' });

  private autoScrollInterval: ReturnType<typeof setInterval> | null = null;
  private lastScrollTop = 0;
  private saveProgressTimeout: ReturnType<typeof setTimeout> | null = null;
  private routerEventsSub: Subscription | null = null;
  private soundscapeStopTimer: ReturnType<typeof setTimeout> | null = null;
  private initialized = false;
  private readTrackerTimer: ReturnType<typeof setInterval> | null = null;
  private activeReadSessionId: string | null = null;
  private activeReadSessionNovelId: string | null = null;
  private readVisibleMs = 0;
  private pendingRestoreNovelId: string | null = null;
  private pendingRestoreChapterNumber: number | null = null;

  constructor() {
    effect(() => {
      const ev = this.writerStudio.catalogSyncEvent();
      if (!ev) return;
      if (ev.kind === 'delete') {
        this.exploreBooksList.update((list) => list.filter((b) => b.id !== ev.novelId));
        if (this.selectedNovel()?.id === ev.novelId) {
          this.selectedNovel.set(null);
        }
      } else if (ev.kind === 'upsert') {
        const card = this.mapPublishedRecordToNovelCard(ev.novel);
        this.exploreBooksList.update((list) => {
          const idx = list.findIndex((b) => b.id === card.id);
          if (idx >= 0) {
            const next = [...list];
            next[idx] = card;
            return next;
          }
          return [card, ...list];
        });
        if (this.selectedNovel()?.id === card.id) {
          this.selectedNovel.set(card);
        }
      }
    });
  }

  // Search Control & Forms
  readonly searchControl = new FormControl('', { nonNullable: true });
  readonly searchControlSignal = toSignal(this.searchControl.valueChanges, { initialValue: '' });
  readonly compressForm = new FormGroup({});

  // Details Page Interactive State
  readonly chapterSearchControl = new FormControl('', { nonNullable: true });
  readonly chapterSearchSignal = toSignal(this.chapterSearchControl.valueChanges, { initialValue: '' });
  readonly isChapterSortAscending = signal<boolean>(true);
  readonly isAuthorFollowed = signal<boolean>(false);
  readonly activeReadingChapter = signal<ChapterItem | null>(null);
  readonly isReadingChapterOpen = signal<boolean>(false);
  readonly soundscapeActive = signal<boolean>(false);
  readonly isIntegrityDocOpen = signal<boolean>(false);
  readonly isManuscriptPreviewOpen = signal<boolean>(false);
  readonly readingProgressPercent = signal<number>(0);
  readonly selectedChapterLang = signal<ChapterLanguage>('ar');
  readonly selectedChapterLangProgressPercent = signal<number>(0);

  // Server-Verified 60-Second Read State
  readonly verifiedReadSessionAwarded = signal<boolean>(false);

  // Work Reporting Modal & Reactive Form
  readonly isReportModalOpen = signal<boolean>(false);
  readonly reportSubmitting = signal<boolean>(false);
  readonly alreadyReportedNovel = signal<boolean>(false);
  readonly reportSuccess = signal<boolean>(false);
  readonly reportError = signal<string | null>(null);
  readonly reportForm = new FormGroup({
    reason: new FormControl('rights', { nonNullable: true, validators: [Validators.required] }),
    details: new FormControl('', { nonNullable: true }),
  });

  // Explore View State
  readonly exploreSearchControl = new FormControl('', { nonNullable: true });
  readonly exploreSearchSignal = toSignal(this.exploreSearchControl.valueChanges, { initialValue: '' });
  readonly exploreCategory = signal<string>('all');
  readonly exploreSortOrder = signal<'latest' | 'immersion' | 'revered' | 'alphabetical'>('latest');
  readonly exploreViewMode = signal<'grid' | 'list'>('grid');
  readonly isMobileFilterDrawerOpen = signal<boolean>(false);
  readonly explorePage = signal<number>(1);
  readonly explorePageSize = 12;

  readonly exploreLanguageScope = signal<ExploreLanguageScope>('all');
  readonly exploreFilterOriginal = signal<boolean>(true);
  readonly exploreFilterTranslated = signal<boolean>(true);
  readonly exploreFilterManuscripts = signal<boolean>(false);
  readonly exploreFilterStatus = signal<'all' | 'completed' | 'ongoing'>('all');
  readonly exploreFilterReadingTime = signal<'all' | 'short' | 'medium' | 'long'>('all');
  readonly exploreFilterLanguage = signal<string>('الكل');
  readonly exploreFilterMood = signal<string>('all');

  readonly exploreBooksList = signal<NovelCard[]>([]);
  readonly catalogLoaded = signal<boolean>(false);

  // Publishing Modal State
  readonly isPublishModalOpen = signal<boolean>(false);
  readonly isCharterModalOpen = signal<boolean>(false);
  readonly publishedSuccessSpec = signal<{
    book: NovelCard;
    archiveCode: string;
    depositDate: string;
  } | null>(null);

  readonly publishForm = new FormGroup({
    authorName: new FormControl('', { nonNullable: true }),
    authorEmail: new FormControl('', { nonNullable: true }),
    title: new FormControl('', { nonNullable: true }),
    categoryGroup: new FormControl<'novels' | 'epics' | 'wisdom' | 'heritage'>('novels', { nonNullable: true }),
    genreLabel: new FormControl('رواية أدبية معاصرة', { nonNullable: true }),
    workNature: new FormControl<'original' | 'translated' | 'manuscript'>('original', { nonNullable: true }),
    readingHours: new FormControl<number>(5, { nonNullable: true }),
    originLanguage: new FormControl('عربي أصيل', { nonNullable: true }),
    synopsis: new FormControl('', { nonNullable: true }),
    sampleChapter: new FormControl('', { nonNullable: true }),
    coverUrl: new FormControl('', { nonNullable: true }),
  });

  // Real-only Profile Collections (no hardcoded/demo items)
  readonly profileQuotes = signal<ProfileQuote[]>([]);
  readonly profileWorks = signal<ProfileWork[]>([]);
  readonly profileTimeline: { title: string; time: string; book: string; duration: string }[] = [];
  readonly literarySalons = signal<LiterarySalon[]>([]);

  readonly activeGenre = signal<string>('الكل');

  readonly genrePills = [
    'الكل',
    'الفانتازيا الملحمية',
    'الغموض والتشويق',
    'أدب الرعب القوطي',
    'الخيال العلمي',
    'الدراما النفسية',
    'الواقعية السحرية',
  ];

  readonly serendipitySeed = signal<number>(0);
  readonly isShuffling = signal<boolean>(false);

  // Real Firestore-derived home & details catalog selectors (zero demo/placeholder data)
  readonly totalPublishedChaptersCount = computed<number>(() =>
    this.exploreBooksList().reduce((sum, n) => sum + (n.publishedChapterCount || 0), 0)
  );

  readonly featuredSpotlight = computed<NovelCard | null>(() => this.exploreBooksList()[0] || null);

  readonly featuredMasterpieces = computed<NovelCard[]>(() => this.exploreBooksList().slice(0, 8));

  readonly fantasyNovels = computed<NovelCard[]>(() =>
    this.exploreBooksList().filter(
      (b) =>
        b.categoryGroup === 'epics' ||
        (b.genre || '').includes('فانتازيا') ||
        (b.genre || '').includes('ملحم') ||
        (b.genre || '').toLowerCase().includes('epic') ||
        (b.genre || '').toLowerCase().includes('fantasy')
    )
  );

  readonly mysteryNovels = computed<NovelCard[]>(() =>
    this.exploreBooksList().filter(
      (b) =>
        (b.genre || '').includes('غموض') ||
        (b.genre || '').includes('رعب') ||
        (b.genre || '').includes('نفس') ||
        (b.genre || '').toLowerCase().includes('mystery') ||
        (b.genre || '').toLowerCase().includes('thriller')
    )
  );

  readonly scifiNovels = computed<NovelCard[]>(() =>
    this.exploreBooksList().filter(
      (b) =>
        b.categoryGroup === 'wisdom' ||
        b.categoryGroup === 'heritage' ||
        (b.genre || '').includes('خيال علمي') ||
        (b.genre || '').toLowerCase().includes('sci')
    )
  );

  readonly activeSerendipity = computed<SerendipityNovel[]>(() => {
    const pool = this.exploreBooksList();
    if (pool.length === 0) return [];
    const seed = this.serendipitySeed();
    const rotated = pool.map((_, i) => pool[(i + seed) % pool.length]);
    const corridorNamesAr: Record<CorridorId, string> = {
      novels: 'رواق الروايات',
      epics: 'رواق الملاحم',
      wisdom: 'رواق الحكمة',
      heritage: 'رواق التراث',
    };
    const corridorColorMap: Record<CorridorId, string> = {
      novels: 'text-primary',
      epics: 'text-secondary',
      wisdom: 'text-on-surface',
      heritage: 'text-tertiary',
    };
    return rotated.slice(0, 3).map((b) => {
      const cor = b.categoryGroup || 'novels';
      return {
        id: b.id,
        title: b.title,
        corridor: this.i18n.lang() === 'en' ? b.genre : corridorNamesAr[cor],
        corridorColor: corridorColorMap[cor],
        description: b.description || '',
        coverUrl: b.coverUrl,
        coverAlt: b.coverAlt || b.title,
      };
    });
  });

  readonly topRankedNovels = computed<NovelCard[]>(() => {
    const sorted = [...this.exploreBooksList()].sort(
      (a, b) =>
        (b.verifiedReadsCount || 0) - (a.verifiedReadsCount || 0) ||
        (b.publishedChapterCount || 0) - (a.publishedChapterCount || 0)
    );
    const arabicRanks = ['١', '٢', '٣', '٤', '٥'];
    return sorted.slice(0, 5).map((n, idx) => ({
      ...n,
      rank: arabicRanks[idx] || String(idx + 1),
    }));
  });

  readonly relatedWorks = computed<NovelCard[]>(() => {
    const current = this.selectedNovel();
    const others = this.exploreBooksList().filter((b) => b.id !== current?.id);
    if (!current) return others.slice(0, 4);
    const sameCategory = others.filter(
      (b) =>
        (current.categoryGroup && b.categoryGroup === current.categoryGroup) ||
        (current.genre && b.genre === current.genre)
    );
    return (sameCategory.length > 0 ? sameCategory : others).slice(0, 4);
  });

  // Computed theme & catalog selectors
  readonly allNovels = computed(() => this.exploreBooksList());

  readonly allNovelsList = computed<NovelCard[]>(() => {
    const map = new Map<string, NovelCard>();
    for (const b of this.exploreBooksList()) {
      if (!map.has(b.id)) {
        map.set(b.id, b);
      }
    }
    const sel = this.selectedNovel();
    if (sel && !map.has(sel.id)) {
      map.set(sel.id, sel);
    }
    return Array.from(map.values());
  });

  readonly filteredNovels = computed(() => {
    const genre = this.activeGenre();
    const query = (this.searchControlSignal() || '').trim().toLowerCase();
    let list = this.allNovels();

    if (genre !== 'الكل') {
      list = list.filter((n) => n.genre.includes(genre) || genre.includes(n.genre));
    }

    if (query) {
      list = list.filter(
        (n) =>
          n.title.toLowerCase().includes(query) ||
          (n.description && n.description.toLowerCase().includes(query)) ||
          n.genre.toLowerCase().includes(query)
      );
    }

    return list;
  });

  readonly searchResults = computed<NovelCard[]>(() => {
    const query = (this.searchControlSignal() || '').trim().toLowerCase();
    if (!query) return [];
    return this.allNovelsList().filter(
      (n) =>
        n.title.toLowerCase().includes(query) ||
        (n.genre && n.genre.toLowerCase().includes(query)) ||
        (n.description && n.description.toLowerCase().includes(query)) ||
        (n.quote && n.quote.toLowerCase().includes(query))
    );
  });

  readonly bookmarkedNovels = computed<NovelCard[]>(() => {
    const ids = this.bookmarkedIds();
    return this.allNovelsList().filter((n) => ids.has(n.id));
  });

  readonly profileVaultBooks = computed<NovelCard[]>(() => {
    const filterVal = this.vaultFilter();
    const query = (this.vaultSearchSignal() || '').trim().toLowerCase();
    const bookmarked = this.bookmarkedIds();
    const all = this.allNovelsList();

    let pool = all.filter((b) => bookmarked.has(b.id));

    if (filterVal === 'bookmarked') {
      pool = all.filter((b) => bookmarked.has(b.id));
    } else if (filterVal === 'reading') {
      pool = pool.filter((b) => !b.isCompleted);
    } else if (filterVal === 'completed') {
      pool = pool.filter((b) => b.isCompleted);
    }

    if (query) {
      pool = pool.filter(
        (b) =>
          b.title.toLowerCase().includes(query) ||
          (b.author && b.author.toLowerCase().includes(query)) ||
          b.genre.toLowerCase().includes(query)
      );
    }

    return pool;
  });

  readonly activeNovelTheme = computed(() => {
    const novel = this.selectedNovel();
    const g = (novel?.genre || '').toLowerCase();
    const t = (novel?.title || '').toLowerCase();
    const isEn = this.i18n.lang() === 'en';
    const archiveSuffix = (novel?.id || 'ETRN').slice(-6).toUpperCase();
    const archiveCode = `MTX-${archiveSuffix}`;

    if (g.includes('ملحم') || g.includes('ملاحم') || t.includes('تنانين') || t.includes('الجدار') || t.includes('رماد')) {
      return {
        realmId: 'epics' as const,
        realmName: 'Mythic Bronze',
        realmArabicName: isEn ? 'Corridor of Epics & Legends' : 'رواق الملاحم والبطولات',
        primaryColor: this.themeService.isDark() ? '#e9c349' : '#9A7209',
        primaryDim: '#af8d11',
        primaryBg: 'bg-secondary',
        textColor: 'text-amber-700 dark:text-[#e9c349]',
        borderColor: 'border-amber-600/35 dark:border-[#e9c349]/40',
        glowGradient: 'from-[#e9c349]/25 via-[#af8d11]/12 to-transparent',
        badgeBg: 'bg-amber-500/15 dark:bg-[#af8d11]/30 text-amber-800 dark:text-[#e9c349] border-amber-600/30 dark:border-[#e9c349]/40',
        btnBg: 'bg-[#9A7209] hover:bg-[#b5870d] dark:bg-[#af8d11] dark:hover:bg-[#e9c349] text-white dark:text-black font-bold shadow-[0_10px_25px_rgba(154,114,9,0.28)]',
        volumeNumber: isEn ? 'CORRIDOR OF EPICS' : 'رواق الملاحم والأساطير',
        archiveCode,
      };
    } else if (g.includes('حكمة') || g.includes('فلسف') || g.includes('نفسي') || t.includes('مرآة') || t.includes('شظايا') || t.includes('dorian')) {
      return {
        realmId: 'wisdom' as const,
        realmName: 'Ivory Philosophy',
        realmArabicName: isEn ? 'Corridor of Wisdom & Philosophy' : 'رواق الحكمة والتأمل الفلسفي',
        primaryColor: this.themeService.isDark() ? '#e5e1e4' : '#211D2B',
        primaryDim: '#8a8589',
        primaryBg: 'bg-on-surface',
        textColor: 'text-on-surface',
        borderColor: 'border-on-surface/30',
        glowGradient: 'from-on-surface/15 via-surface-variant/20 to-transparent',
        badgeBg: 'bg-surface-container-high text-on-surface border-surface-variant',
        btnBg: 'bg-on-surface text-surface hover:opacity-90 font-bold shadow-lg',
        volumeNumber: isEn ? 'CORRIDOR OF WISDOM' : 'رواق الحكمة والفلسفة',
        archiveCode,
      };
    } else if (g.includes('تراث') || g.includes('مخطوط') || g.includes('أندلس') || t.includes('قرطبة') || t.includes('شيراز')) {
      return {
        realmId: 'heritage' as const,
        realmName: 'Manuscript Emerald',
        realmArabicName: isEn ? 'Corridor of Heritage & Manuscripts' : 'رواق التراث والمخطوطات النادرة',
        primaryColor: this.themeService.isDark() ? '#7bd8b1' : '#0D7A5A',
        primaryDim: '#005039',
        primaryBg: 'bg-tertiary',
        textColor: 'text-emerald-700 dark:text-[#7bd8b1]',
        borderColor: 'border-emerald-600/35 dark:border-[#7bd8b1]/40',
        glowGradient: 'from-[#7bd8b1]/25 via-[#005039]/15 to-transparent',
        badgeBg: 'bg-emerald-500/15 dark:bg-[#005039]/40 text-emerald-800 dark:text-[#7bd8b1] border-emerald-600/30 dark:border-[#7bd8b1]/40',
        btnBg: 'bg-[#0D7A5A] hover:bg-[#095C44] dark:bg-[#005039] dark:hover:bg-[#006e4e] text-white dark:text-[#7bd8b1] font-bold shadow-[0_10px_25px_rgba(13,122,90,0.28)]',
        volumeNumber: isEn ? 'CORRIDOR OF HERITAGE' : 'رواق التراث والمخطوطات',
        archiveCode,
      };
    } else {
      return {
        realmId: 'novels' as const,
        realmName: 'Crimson Noir',
        realmArabicName: isEn ? 'Corridor of Novels & Fiction' : 'رواق الروايات والخيال السردي',
        primaryColor: this.themeService.isDark() ? '#ffb2bd' : '#9E1B42',
        primaryDim: '#881337',
        primaryBg: 'bg-primary',
        textColor: 'text-primary',
        borderColor: 'border-primary/35',
        glowGradient: 'from-primary/20 via-primary-container/25 to-transparent',
        badgeBg: 'bg-primary-container/80 dark:bg-[#881337]/40 text-on-primary-container dark:text-[#ffb2bd] border-primary/30',
        btnBg: 'bg-[#881337] hover:bg-[#9f1239] text-white font-bold shadow-[0_10px_25px_rgba(136,19,55,0.35)]',
        volumeNumber: isEn ? 'VERIFIED ARCHIVE' : 'سجل أروقة الخلود',
        archiveCode,
      };
    }
  });

  // Active Firestore-backed Sections & Chapters for Selected Novel
  readonly activeNovelSections = computed<NovelSection[]>(() => {
    const id = this.selectedNovel()?.id;
    if (!id) return [];
    return this.writerStudio.publicNovelDetailsCache()[id]?.sections || [];
  });

  readonly activeNovelFirestoreChapters = computed<LogicalChapter[]>(() => {
    const id = this.selectedNovel()?.id;
    if (!id) return [];
    return this.writerStudio.publicNovelDetailsCache()[id]?.chapters || [];
  });

  // Bilingual Novel Chapters Computed Signals
  readonly availableChaptersForNovel = computed<ChapterItem[]>(() => {
    const novel = this.selectedNovel();
    if (!novel) return [];
    const dbChapters = this.activeNovelFirestoreChapters();
    const dbSections = this.activeNovelSections();
    return getChaptersForNovel(novel.id, this.selectedChapterLang(), novel, dbChapters, dbSections);
  });

  readonly oppositeChapterLang = computed<ChapterLanguage>(() =>
    this.selectedChapterLang() === 'ar' ? 'en' : 'ar'
  );

  readonly oppositeChaptersCount = computed<number>(() => {
    const novel = this.selectedNovel();
    if (!novel) return 0;
    const dbChapters = this.activeNovelFirestoreChapters();
    const dbSections = this.activeNovelSections();
    return getChaptersForNovel(novel.id, this.oppositeChapterLang(), novel, dbChapters, dbSections).length;
  });

  readonly hasOppositeChapterLang = computed<boolean>(() => this.oppositeChaptersCount() > 0);

  // Explore Computed Signals
  readonly filteredExploreBooks = computed<NovelCard[]>(() => {
    const q = (this.exploreSearchSignal() || '').trim().toLowerCase();
    const cat = this.exploreCategory();
    const sort = this.exploreSortOrder();
    const status = this.exploreFilterStatus();
    const timeFilter = this.exploreFilterReadingTime();
    const lang = this.exploreFilterLanguage();
    const scope = this.exploreLanguageScope();
    const mood = this.exploreFilterMood();

    let list = [...this.exploreBooksList()];

    if (scope === 'non-ar') {
      list = list.filter((b) => !isArabicCatalogNovel(b));
    } else if (scope === 'ar') {
      list = list.filter((b) => isArabicCatalogNovel(b));
    }

    if (q) {
      list = list.filter(
        (b) =>
          b.title.toLowerCase().includes(q) ||
          (b.author && b.author.toLowerCase().includes(q)) ||
          b.genre.toLowerCase().includes(q) ||
          (b.description && b.description.toLowerCase().includes(q)) ||
          (b.originLanguage && b.originLanguage.toLowerCase().includes(q)) ||
          (b.tags && b.tags.some((t) => t.toLowerCase().includes(q)))
      );
    }

    if (cat !== 'all') {
      list = list.filter((b) => b.categoryGroup === cat);
    }

    if (status === 'completed') {
      list = list.filter((b) => b.isCompleted === true);
    } else if (status === 'ongoing') {
      list = list.filter((b) => b.isCompleted === false);
    }

    if (timeFilter === 'short') {
      list = list.filter((b) => (b.readingHours || 4) <= 3);
    } else if (timeFilter === 'medium') {
      list = list.filter((b) => (b.readingHours || 5) > 3 && (b.readingHours || 5) <= 10);
    } else if (timeFilter === 'long') {
      list = list.filter((b) => (b.readingHours || 6) > 10);
    }

    if (lang && lang !== 'الكل') {
      list = list.filter((b) => b.originLanguage === lang);
    }

    if (mood && mood !== 'all') {
      list = list.filter((b) => b.tags && b.tags.includes(mood));
    }

    const locale = this.i18n.lang() === 'en' ? 'en' : 'ar';
    if (sort === 'alphabetical') {
      list.sort((a, b) => a.title.localeCompare(b.title, locale));
    } else if (sort === 'immersion') {
      list.sort((a, b) => (b.readingHours || 0) - (a.readingHours || 0));
    } else if (sort === 'revered') {
      list.sort((a, b) => Number(b.isCompleted) - Number(a.isCompleted));
    }

    return list;
  });

  readonly totalExplorePages = computed<number>(() => {
    return Math.ceil(this.filteredExploreBooks().length / this.explorePageSize) || 1;
  });

  readonly explorePageNumbers = computed<number[]>(() => {
    const total = this.totalExplorePages();
    const current = this.explorePage();
    if (total <= 7) {
      return Array.from({ length: total }, (_, i) => i + 1);
    }
    if (current <= 4) {
      return [1, 2, 3, 4, 5, -1, total];
    }
    if (current >= total - 3) {
      return [1, -1, total - 4, total - 3, total - 2, total - 1, total];
    }
    return [1, -1, current - 1, current, current + 1, -1, total];
  });

  readonly explorePageRangeInfo = computed(() => {
    const total = this.filteredExploreBooks().length;
    if (total === 0) return { start: 0, end: 0, total: 0 };
    const page = Math.min(this.explorePage(), this.totalExplorePages());
    const start = (page - 1) * this.explorePageSize + 1;
    const end = Math.min(page * this.explorePageSize, total);
    return { start, end, total };
  });

  readonly pagedExploreBooks = computed<NovelCard[]>(() => {
    const list = this.filteredExploreBooks();
    const page = Math.min(this.explorePage(), this.totalExplorePages());
    const start = (page - 1) * this.explorePageSize;
    return list.slice(start, start + this.explorePageSize);
  });

  // Reader Computed Signals
  readonly readerThemeConfig = computed(() => {
    switch (this.readerTheme()) {
      case 'parchment':
        return {
          id: 'parchment',
          name: 'رق البردي',
          badgeText: 'رق البردي والقرطاس',
          bg: 'bg-[#f4ebd9]',
          bgHex: '#f4ebd9',
          drawerBg: 'bg-[#f4ebd9]/95 backdrop-blur-2xl',
          drawerHeaderBg: 'bg-[#ede0ca]/90 backdrop-blur-xl',
          hoverBg: 'hover:bg-[#e5d5ba]',
          text: 'text-[#2c231a]',
          textMuted: 'text-[#615040]',
          toolbarBg: 'bg-[#ede0ca]/95 border-[#d8c7ab]',
          cardBg: 'bg-[#ece0cb]',
          cardBorder: 'border-[#d8c7ab]',
          accent: 'text-[#92400e]',
          accentBg: 'bg-[#92400e] text-[#f4ebd9]',
          selection: 'selection:bg-[#92400e]/30 selection:text-[#2c231a]',
          pillBg: 'bg-[#e2d5bd] text-[#2c231a]',
          ringColor: 'ring-[#92400e]',
          progressBg: 'bg-[#92400e]',
          quoteBorder: 'border-amber-800/40',
        };
      case 'ivory':
        return {
          id: 'ivory',
          name: 'العاجي',
          badgeText: 'بياض العاج المريح',
          bg: 'bg-[#fbf9f4]',
          bgHex: '#fbf9f4',
          drawerBg: 'bg-[#fbf9f4]/95 backdrop-blur-2xl',
          drawerHeaderBg: 'bg-[#f2eee3]/90 backdrop-blur-xl',
          hoverBg: 'hover:bg-[#ece6d7]',
          text: 'text-[#1e2024]',
          textMuted: 'text-[#555c68]',
          toolbarBg: 'bg-[#f2eee3]/95 border-[#ded7c5]',
          cardBg: 'bg-[#f2ede1]',
          cardBorder: 'border-[#ded7c5]',
          accent: 'text-[#0f766e]',
          accentBg: 'bg-[#0f766e] text-white',
          selection: 'selection:bg-[#0f766e]/20 selection:text-[#1e2024]',
          pillBg: 'bg-[#e9e3d3] text-[#1e2024]',
          ringColor: 'ring-[#0f766e]',
          progressBg: 'bg-[#0f766e]',
          quoteBorder: 'border-teal-700/40',
        };
      case 'daylight':
        return {
          id: 'daylight',
          name: 'النهاري',
          badgeText: 'نقاء النهاري الواضح',
          bg: 'bg-[#ffffff]',
          bgHex: '#ffffff',
          drawerBg: 'bg-white/95 backdrop-blur-2xl',
          drawerHeaderBg: 'bg-slate-50/90 backdrop-blur-xl',
          hoverBg: 'hover:bg-slate-100',
          text: 'text-[#0f172a]',
          textMuted: 'text-[#475569]',
          toolbarBg: 'bg-[#f8fafc]/95 border-[#dce3ec]',
          cardBg: 'bg-[#f1f5f9]',
          cardBorder: 'border-[#dce3ec]',
          accent: 'text-[#2563eb]',
          accentBg: 'bg-[#2563eb] text-white',
          selection: 'selection:bg-[#2563eb]/20 selection:text-[#0f172a]',
          pillBg: 'bg-[#e2e8f0] text-[#0f172a]',
          ringColor: 'ring-[#2563eb]',
          progressBg: 'bg-[#2563eb]',
          quoteBorder: 'border-blue-600/40',
        };
      case 'andalusian':
      default:
        return {
          id: 'andalusian',
          name: 'السواد الأندلسي',
          badgeText: 'سواد الأندلس العميق',
          bg: 'bg-[#121214]',
          bgHex: '#121214',
          drawerBg: 'bg-[#161519]/95 backdrop-blur-2xl',
          drawerHeaderBg: 'bg-[#1c1b20]/90 backdrop-blur-xl',
          hoverBg: 'hover:bg-white/10',
          text: 'text-[#e4e4e7]',
          textMuted: 'text-[#a1a1aa]',
          toolbarBg: 'bg-[#18181b]/95 border-[#2c2b30]',
          cardBg: 'bg-[#1f1e24]',
          cardBorder: 'border-[#2c2b30]',
          accent: 'text-[#e9c349]',
          accentBg: 'bg-[#e9c349] text-[#121214]',
          selection: 'selection:bg-[#881337] selection:text-[#ffd9dd]',
          pillBg: 'bg-[#27272a] text-[#e4e4e7]',
          ringColor: 'ring-[#e9c349]',
          progressBg: 'bg-[#e9c349]',
          quoteBorder: 'border-amber-400/40',
        };
    }
  });

  readonly readerFontClass = computed(() => {
    switch (this.readerFontFamily()) {
      case 'amiri': return 'font-amiri';
      case 'naskh': return 'font-naskh';
      case 'aref': return 'font-aref';
      case 'almarai': return 'font-almarai';
      case 'tajawal': return 'font-tajawal';
      case 'kufi': return 'font-kufi';
      case 'alexandria': return 'font-alexandria';
      default: return 'font-amiri';
    }
  });

  readonly readerMeasureClass = computed(() => {
    switch (this.readerMeasure()) {
      case 'compact': return 'max-w-2xl';
      case 'wide': return 'max-w-4xl';
      case 'fluid': return 'max-w-6xl';
      case 'balanced':
      default: return 'max-w-3xl';
    }
  });

  readonly readerParagraphSpacingClass = computed(() => {
    switch (this.readerParagraphSpacing()) {
      case 'compact': return 'space-y-4';
      case 'relaxed': return 'space-y-9';
      case 'normal':
      default: return 'space-y-6';
    }
  });

  readonly readerPaddingClass = computed(() => {
    switch (this.readerPadding()) {
      case 'compact': return 'px-4 sm:px-8';
      case 'generous': return 'px-8 sm:px-24';
      case 'balanced':
      default: return 'px-6 sm:px-16';
    }
  });

  readonly readerWordCount = computed(() => {
    const text = this.activeChapterText();
    if (!text) return 0;
    return text.trim().split(/\s+/).filter(Boolean).length;
  });

  readonly readerEstimatedRemainingMin = computed(() => {
    const totalWords = this.readerWordCount();
    if (totalWords === 0) return 0;
    const readRatio = (100 - this.readerProgressPercent()) / 100;
    const remainingWords = totalWords * readRatio;
    return Math.max(1, Math.ceil(remainingWords / 180));
  });

  readonly filteredReaderChapters = computed(() => {
    const chaptersPool = this.availableChaptersForNovel();
    const query = (this.readerChapterSearchSignal() || '').trim().toLowerCase();
    if (!query) return chaptersPool;
    return chaptersPool.filter(
      (c) =>
        c.title.toLowerCase().includes(query) ||
        c.arabicNumber.includes(query) ||
        (c.chapterNumber ?? c.id).toString().includes(query)
    );
  });

  readonly filteredChaptersList = computed<ChapterItem[]>(() => {
    const query = (this.chapterSearchSignal() || '').trim().toLowerCase();
    let list = this.availableChaptersForNovel();
    if (query) {
      list = list.filter(
        (c) =>
          c.title.toLowerCase().includes(query) ||
          c.arabicNumber.includes(query) ||
          (c.chapterNumber ?? c.id).toString().includes(query) ||
          c.publishDate.toLowerCase().includes(query)
      );
    }
    if (!this.isChapterSortAscending()) {
      return [...list].reverse();
    }
    return list;
  });

  readonly partition1Chapters = computed<ChapterItem[]>(() =>
    this.filteredChaptersList().filter((c) => c.partition === 1)
  );

  readonly partition2Chapters = computed<ChapterItem[]>(() =>
    this.filteredChaptersList().filter((c) => c.partition === 2)
  );

  readonly partition3Chapters = computed<ChapterItem[]>(() =>
    this.filteredChaptersList().filter((c) => c.partition === 3)
  );

  readonly groupedDetailsSections = computed<
    { section: NovelSection | null; chapters: ChapterItem[] }[]
  >(() => {
    const sections = this.activeNovelSections();
    const chapters = this.filteredChaptersList();
    if (sections.length === 0) return [];

    const groups: { section: NovelSection | null; chapters: ChapterItem[] }[] = [];
    const assignedIds = new Set<string>();

    for (const sec of sections) {
      const secChapters = chapters.filter((ch) => ch.sectionId === sec.id);
      if (secChapters.length > 0) {
        secChapters.forEach((c) => assignedIds.add(`${c.id}`));
        groups.push({ section: sec, chapters: secChapters });
      }
    }

    const unsectioned = chapters.filter((ch) => !ch.sectionId || !assignedIds.has(`${ch.id}`));
    if (unsectioned.length > 0) {
      groups.push({ section: null, chapters: unsectioned });
    }
    return groups;
  });

  async init(): Promise<void> {
    if (this.initialized) return;
    this.initialized = true;

    this.i18n.init();
    this.themeService.init();

    if (!isPlatformBrowser(this.platformId)) return;

    this.restoreLocalBookmarks();
    this.loadSavedReaderSettings();
    this.restoreNavigationState();
    this.i18n.syncDocumentMeta(this.currentView());

    // Sync view signal with Angular Router NavigationEnd events (Back/Forward browser buttons)
    this.routerEventsSub?.unsubscribe();
    this.routerEventsSub = this.router.events
      .pipe(filter((ev): ev is NavigationEnd => ev instanceof NavigationEnd))
      .subscribe((ev) => {
        const view = this.routeUrlToView(ev.urlAfterRedirects);
        if (this.currentView() !== view) {
          this.currentView.set(view);
        }
        this.i18n.syncDocumentMeta(view);
        if (view === 'reader' && !this.readerActiveChapterContent()) {
          const pool = this.availableChaptersForNovel();
          const fallbackChap = pool.find((c) => c.status === 'current') || pool[0];
          if (fallbackChap) {
            this.loadChapterContent(fallbackChap);
          }
        }
      });

    // Register auth bookmark sync & restored user handling
    this.authSession.registerSyncCallbacks({
      onBookmarksSynced: (ids) => {
        const nextSet = new Set(this.bookmarkedIds());
        ids.forEach((id) => nextSet.add(id));
        this.bookmarkedIds.set(nextSet);
      },
      onAuthRestored: (user) => {
        const cleanUrl = (this.router.url || '').split('?')[0];
        const isBareProfileRoute = cleanUrl === '/profile' || cleanUrl === '/profile/';
        if (!user && isBareProfileRoute) {
          this.navigateToView('auth', false);
        } else if (user && this.currentView() === 'auth') {
          this.navigateToOwnProfile(false);
        }
      },
    });

    try {
      const [, cached, publishedNovels] = await Promise.all([
        this.authSession.init(),
        fetchCloudVaultBooks().catch(() => []),
        fetchAllPublishedNovels().catch(() => []),
      ]);
      if (cached && cached.length > 0) {
        const nextSet = new Set(this.bookmarkedIds());
        cached.forEach((b) => nextSet.add(b.id));
        this.bookmarkedIds.set(nextSet);
      }
      if (publishedNovels) {
        const mapped: NovelCard[] = publishedNovels.map((n) => this.mapPublishedRecordToNovelCard(n));
        this.exploreBooksList.set(mapped);
      }
      this.catalogLoaded.set(true);

      // Hydrate restored novel & chapter on page reload (/details or /reading)
      const restoreId = this.selectedNovel()?.id || this.pendingRestoreNovelId;
      if (restoreId) {
        let restoredNovel = this.allNovelsList().find((n) => n.id === restoreId) || null;
        if (!restoredNovel) {
          const direct = await fetchNovelByIdFromFirestore(restoreId).catch(() => null);
          if (direct) {
            restoredNovel = this.mapPublishedRecordToNovelCard(direct);
          }
        }
        if (restoredNovel) {
          this.selectedNovel.set(restoredNovel);
          const { chapters } = await this.writerStudio.loadPublicNovelContent(restoredNovel.id, true);
          const scope = this.exploreLanguageScope();
          const preferred: ChapterLanguage | undefined =
            scope === 'non-ar' ? 'en' : scope === 'ar' ? 'ar' : this.i18n.lang();
          const chapLang = getDefaultChapterLanguageForNovel(restoredNovel, preferred, chapters);
          this.selectedChapterLang.set(chapLang);
          this.syncNovelChapterProgress(restoredNovel, chapLang);

          if (this.currentView() === 'reader') {
            const pool = this.availableChaptersForNovel();
            const target =
              (this.pendingRestoreChapterNumber
                ? pool.find((c) => (c.chapterNumber ?? c.id) === this.pendingRestoreChapterNumber)
                : undefined) ||
              pool.find((c) => c.status === 'current') ||
              pool[0];
            if (target) {
              this.isReadingChapterOpen.set(true);
              this.loadChapterContent(target);
            }
          }
        }
        this.pendingRestoreNovelId = null;
        this.pendingRestoreChapterNumber = null;
      }
    } catch {
      this.catalogLoaded.set(true);
    }
  }

  destroy(): void {
    this.routerEventsSub?.unsubscribe();
    this.routerEventsSub = null;
    this.stopVerifiedReadTracking();
    if (this.soundscapeStopTimer) {
      clearTimeout(this.soundscapeStopTimer);
      this.soundscapeStopTimer = null;
    }
    this.authSession.destroy();
    this.stopSoundscape(true);
    this.stopAutoScroll();
    if (this.saveProgressTimeout) {
      clearTimeout(this.saveProgressTimeout);
      this.saveProgressTimeout = null;
    }
    if (this.toastTimeout) {
      clearTimeout(this.toastTimeout);
      this.toastTimeout = null;
    }
    this.initialized = false;
  }

  private mapPublishedRecordToNovelCard(n: PublishedNovelRecord): NovelCard {
    return {
      id: n.id,
      title: n.title,
      ...(n.titleEn ? { titleEn: n.titleEn } : {}),
      author: n.authorName,
      authorId: n.authorId,
      genre: n.genre,
      categoryGroup: n.categoryGroup,
      originLanguage: n.originLanguage || 'عربي أصيل',
      languageCode: n.languageCode || (n.originLanguage === 'الإنجليزية' ? 'en' : 'ar'),
      coverUrl: n.coverUrl || '/images/writers_sanctuary_bg.jpg',
      coverAlt: n.title,
      description: n.description,
      readingHours: n.readingHours,
      isCompleted: n.novelStatus === 'completed',
      novelStatus: n.novelStatus || 'ongoing',
      workType: n.workType || 'original',
      ...(n.originalAuthor ? { originalAuthor: n.originalAuthor } : {}),
      ...(n.firstAuthor ? { firstAuthor: n.firstAuthor } : {}),
      ...(n.supportMethod ? { supportMethod: n.supportMethod } : {}),
      moderationStatus: n.moderationStatus || 'active',
      ...(n.moderationNote ? { moderationNote: n.moderationNote } : {}),
      reportCount: n.reportCount || 0,
      verifiedReadsCount: n.verifiedReadsCount || 0,
      publishedChapterCount: n.publishedChapterCount || 0,
      publishedWordsAr: n.publishedWordsAr || 0,
      publishedWordsEn: n.publishedWordsEn || 0,
      ...(n.tags?.length ? { tags: n.tags } : {}),
      isOriginal: (n.workType || 'original') === 'original',
      isTranslated: n.workType === 'translated',
      isFirestoreBacked: true,
    };
  }

  toArabicNumber(n: number): string {
    if (n === -1) return '...';
    return this.i18n.formatNumber(n);
  }

  navigateToOwnProfile(smoothScroll = true): void {
    this.currentView.set('profile');
    this.isMobileNavOpen.set(false);
    this.persistNavigationState();
    this.i18n.syncDocumentMeta('profile');

    const username = this.accountService.ownProfile()?.username;
    const targetPath = username ? `/profile/${username}` : '/profile';
    if (this.router.url !== targetPath) {
      this.router.navigateByUrl(targetPath).catch(() => false);
    }

    if (isPlatformBrowser(this.platformId)) {
      window.scrollTo({ top: 0, behavior: smoothScroll ? 'smooth' : ('instant' as ScrollBehavior) });
    }
  }

  openWriterStudio(
    novelId?: string,
    tab?: 'dashboard' | 'novel' | 'chapters' | 'archive' | 'moderation'
  ): void {
    this.closeAllModals();
    this.currentView.set('writer');
    this.persistNavigationState();
    this.i18n.syncDocumentMeta('writer');
    const queryParams: Record<string, string> = {};
    if (novelId) queryParams['novelId'] = novelId;
    if (tab) queryParams['tab'] = tab;
    this.router.navigate(['/writer'], { queryParams }).catch(() => false);
    if (isPlatformBrowser(this.platformId)) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  async navigateToAuthorProfile(authorId?: string, authorUsername?: string): Promise<void> {
    if (!authorId) return;
    const own = this.accountService.ownProfile();
    if (own && own.uid === authorId) {
      this.navigateToOwnProfile();
      return;
    }

    let username = authorUsername || this.accountService.getAuthorAppearance(authorId)?.username;
    if (!username) {
      const appearance = await getPublicAuthorAppearance(authorId).catch(() => null);
      username = appearance?.username;
    }

    if (username) {
      this.closeAllModals();
      this.currentView.set('profile');
      this.i18n.syncDocumentMeta('profile');
      this.router.navigate(['/profile', username]).catch(() => false);
      if (isPlatformBrowser(this.platformId)) {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
      return;
    }

    this.showToast(
      this.isEn()
        ? 'This author has not enabled a public profile link yet.'
        : 'لم يفعل هذا الكاتب رابط ملفه الشخصي العام بعد.'
    );
  }

  navigateToView(view: AppView, smoothScroll = true): void {
    if (view === 'profile') {
      this.navigateToOwnProfile(smoothScroll);
      return;
    }

    this.currentView.set(view);
    this.isMobileNavOpen.set(false);
    this.persistNavigationState();
    this.i18n.syncDocumentMeta(view);

    const routeMap: Record<AppView, string> = {
      novels: '/',
      details: '/details',
      explore: '/explore',
      reading: '/reading',
      reader: '/reading',
      auth: '/auth',
      profile: '/profile',
      writer: '/writer',
    } as unknown as Record<AppView, string>;

    const targetPath = routeMap[view] || '/';
    if (this.router.url !== targetPath) {
      this.router.navigateByUrl(targetPath).catch(() => false);
    }

    if (isPlatformBrowser(this.platformId) && view !== 'reader') {
      window.scrollTo({ top: 0, behavior: smoothScroll ? 'smooth' : ('instant' as ScrollBehavior) });
    }
  }

  private routeUrlToView(url: string): AppView {
    const clean = (url || '/').split('?')[0].split('#')[0];
    if (clean.startsWith('/details')) return 'details';
    if (clean.startsWith('/explore')) return 'explore';
    if (clean.startsWith('/reading')) return 'reader';
    if (clean.startsWith('/auth')) return 'auth';
    if (clean.startsWith('/profile')) return 'profile';
    if (clean.startsWith('/writer')) return 'writer';
    return 'novels';
  }

  private persistNavigationState(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    try {
      const payload = {
        view: this.currentView(),
        novelId: this.selectedNovel()?.id || null,
        chapterId: this.activeReadingChapter()?.id || null,
        chapterNumber: this.activeReadingChapter()?.chapterNumber ?? this.activeReadingChapter()?.id ?? null,
        corridor: this.activeCorridor(),
      };
      localStorage.setItem(NAV_STORAGE_KEY, JSON.stringify(payload));
    } catch {
      // Ignore storage error
    }
  }

  private restoreNavigationState(): void {
    try {
      const currentRouteView = this.routeUrlToView(this.router.url);
      const raw = localStorage.getItem(NAV_STORAGE_KEY);
      if (raw) {
        const saved = JSON.parse(raw) as {
          view?: AppView;
          novelId?: string | null;
          chapterId?: number | null;
          chapterNumber?: number | null;
          corridor?: CorridorId;
        };
        if (saved.corridor) {
          this.activeCorridor.set(saved.corridor);
        }
        if (saved.novelId) {
          this.pendingRestoreNovelId = saved.novelId;
          const found = this.allNovelsList().find((n) => n.id === saved.novelId);
          if (found) {
            this.selectedNovel.set(found);
          }
        }
        if (saved.chapterNumber ?? saved.chapterId) {
          this.pendingRestoreChapterNumber = saved.chapterNumber ?? saved.chapterId ?? null;
        }
      }

      if (currentRouteView !== 'novels') {
        this.currentView.set(currentRouteView);
      }
    } catch {
      // Safe fallback
    }
  }

  private restoreLocalBookmarks(): void {
    try {
      const localBm = localStorage.getItem('mtx_local_bookmarks');
      if (localBm) {
        const parsed = JSON.parse(localBm);
        if (Array.isArray(parsed)) {
          const nextSet = new Set(this.bookmarkedIds());
          parsed.forEach((id: string) => nextSet.add(id));
          this.bookmarkedIds.set(nextSet);
        }
      }
    } catch {
      // Quiet fallback
    }
  }

  // ================= NAVIGATION & EXPLORE HANDLERS =================
  private isEn(): boolean {
    return this.i18n.lang() === 'en';
  }

  openSiteSettings(): void {
    this.closeAllModals();
    this.isSiteSettingsOpen.set(true);
  }

  closeSiteSettings(): void {
    this.isSiteSettingsOpen.set(false);
  }

  setSiteLanguage(lang: SiteLanguage): void {
    this.i18n.setLanguage(lang, true);
    this.i18n.syncDocumentMeta(this.currentView());
    this.showToast(
      lang === 'en'
        ? this.i18n.copy().siteSettings.languageChangedEn
        : this.i18n.copy().siteSettings.languageChangedAr
    );
  }

  toggleSiteLanguage(): void {
    const next: SiteLanguage = this.i18n.lang() === 'ar' ? 'en' : 'ar';
    this.setSiteLanguage(next);
  }

  setExploreLanguageScope(scope: ExploreLanguageScope): void {
    this.exploreLanguageScope.set(scope);
    this.explorePage.set(1);
  }

  openExploreByHeroLanguage(): void {
    const uiLang = this.i18n.lang();
    const targetScope: ExploreLanguageScope = uiLang === 'ar' ? 'non-ar' : 'ar';
    this.closeAllModals();
    this.selectedNovel.set(null);
    this.exploreSearchControl.setValue('');
    this.exploreCategory.set('all');
    this.exploreFilterOriginal.set(true);
    this.exploreFilterTranslated.set(true);
    this.exploreFilterManuscripts.set(false);
    this.exploreFilterStatus.set('all');
    this.exploreFilterReadingTime.set('all');
    this.exploreFilterLanguage.set('الكل');
    this.exploreFilterMood.set('all');
    this.exploreSortOrder.set('latest');
    this.exploreLanguageScope.set(targetScope);
    this.explorePage.set(1);
    this.navigateToView('explore');
    this.showToast(
      targetScope === 'non-ar'
        ? this.isEn()
          ? 'Filtered catalog to non-Arabic / English works'
          : 'تمت تصفية الخزانة لعرض الروايات غير العربية فقط'
        : this.isEn()
          ? 'Filtered catalog to Arabic works'
          : 'تمت تصفية الخزانة لعرض الروايات العربية فقط'
    );
  }

  goToExploreWithSearch(query?: string | null): void {
    const q = (query ?? this.searchControl.value ?? '').trim();
    if (q) {
      this.exploreSearchControl.setValue(q);
      this.searchControl.setValue(q);
    }
    this.closeAllModals();
    this.selectedNovel.set(null);
    this.navigateToView('explore');
    if (q) {
      this.showToast(
        this.isEn() ? `Exploring results for: "${q}"` : `تم الانتقال لصفحة الاستكشاف بالبحث عن: «${q}»`
      );
    } else {
      this.showToast(
        this.isEn() ? 'Opened the Central Explore Catalog' : 'أنت الآن في الخزانة المركزية العامة للاستكشاف'
      );
    }
  }

  goToExploreWithTag(tag: string): void {
    this.closeAllModals();
    this.selectedNovel.set(null);
    this.navigateToView('explore');

    if (!tag || tag === 'الكل') {
      this.activeGenre.set('الكل');
      this.exploreCategory.set('all');
      this.exploreSearchControl.setValue('');
      this.exploreFilterMood.set('all');
      this.showToast(
        this.isEn() ? 'Showing all works in Explore catalog' : 'استعراض كافة أعمال خزانة الاستكشاف'
      );
      return;
    }

    this.activeGenre.set(tag);
    const cleanTag = tag.replace(/^[#«"]+|[»"]+$/g, '').trim();
    const lower = cleanTag.toLowerCase();

    if (lower.includes('ملحم') || lower.includes('ملاحم') || lower.includes('أساطير')) {
      this.exploreCategory.set('epics');
    } else if (lower.includes('حكم') || lower.includes('فلسف')) {
      this.exploreCategory.set('wisdom');
    } else if (lower.includes('تراث') || lower.includes('مخطوط')) {
      this.exploreCategory.set('heritage');
    } else if (
      lower.includes('فانتازيا') ||
      lower.includes('غموض') ||
      lower.includes('خيال') ||
      lower.includes('رعب') ||
      lower.includes('نفسي')
    ) {
      this.exploreCategory.set('novels');
    }

    this.exploreSearchControl.setValue(cleanTag);
    this.showToast(
      this.isEn() ? `Exploring tag: "${cleanTag}"` : `تم الانتقال لصفحة الاستكشاف بالوسم: «${cleanTag}»`
    );
  }

  setGenre(pill: string): void {
    this.goToExploreWithTag(pill);
  }

  onHeaderFilterClick(): void {
    this.toggleFilter();
  }

  goToExploreWithFilter(): void {
    this.closeAllModals();
    this.selectedNovel.set(null);
    this.isMobileFilterDrawerOpen.set(true);
    this.navigateToView('explore');
    this.showToast(this.isEn() ? 'Opened Explore filters' : 'تم الانتقال إلى صفحة الاستكشاف وتفعيل التصفية');
  }

  onMobileSearchClick(): void {
    if (this.currentView() === 'novels') {
      this.goToExploreWithSearch('');
    } else {
      this.toggleSearch();
    }
  }

  applyMobileFilters(): void {
    this.isMobileFilterDrawerOpen.set(false);
    const count = this.filteredExploreBooks().length;
    this.showToast(
      this.isEn() ? `Filters applied — ${count} works shown` : `تم تطبيق التصفية — معروض ${count} عملاً`
    );
  }

  applyFastFilter(type: 'longest' | 'translated' | 'completed' | 'short' | 'alphabetical'): void {
    this.closeAllModals();
    this.selectedNovel.set(null);
    this.navigateToView('explore');

    switch (type) {
      case 'longest':
        this.exploreSortOrder.set('immersion');
        this.exploreFilterReadingTime.set('long');
        this.showToast(this.isEn() ? 'Filtered: Longest immersive works' : 'تمت تصفية الاستكشاف: حسب الأطول صفحات وانغماساً');
        break;
      case 'translated':
        this.exploreFilterTranslated.set(true);
        this.exploreFilterOriginal.set(false);
        this.showToast(this.isEn() ? 'Filtered: Translated world classics' : 'تمت تصفية الاستكشاف: روايات مترجمة عالمية');
        break;
      case 'completed':
        this.exploreFilterStatus.set('completed');
        this.showToast(this.isEn() ? 'Filtered: Completed works' : 'تمت تصفية الاستكشاف: أعمال سردية مكتملة');
        break;
      case 'short':
        this.exploreFilterReadingTime.set('short');
        this.showToast(this.isEn() ? 'Filtered: Concise reads (≤ 3 hrs)' : 'تمت تصفية الاستكشاف: قراءات قصيرة ومكثفة (أقل من ٣ ساعات)');
        break;
      case 'alphabetical':
        this.exploreSortOrder.set('alphabetical');
        this.showToast(this.isEn() ? 'Sorted alphabetically' : 'تمت تصفية الاستكشاف: الترتيب الأبجدي التليد (أ - ي)');
        break;
    }
  }

  goToExploreWithCorridor(corridor: CorridorId): void {
    this.activeCorridor.set(corridor);
    this.exploreCategory.set(corridor);
    this.closeAllModals();
    this.selectedNovel.set(null);
    this.navigateToView('explore');
    const namesAr: Record<CorridorId, string> = {
      novels: 'روايات وخيال سردي',
      epics: 'ملاحم وأساطير',
      wisdom: 'فلسفة وحكمة',
      heritage: 'تراث ومخطوطات',
    };
    const namesEn: Record<CorridorId, string> = {
      novels: 'Novels & Fiction',
      epics: 'Epics & Legends',
      wisdom: 'Philosophy & Wisdom',
      heritage: 'Heritage & Manuscripts',
    };
    this.showToast(
      this.isEn() ? `Filtered to: ${namesEn[corridor]}` : `تمت التصفية والانتقال إلى: ${namesAr[corridor]}`
    );
  }

  goToExploreWithSort(order: 'popular' | 'rating' | 'pages' | 'alphabetical'): void {
    this.activeSortOrder.set(order);
    const sortMap: Record<string, 'latest' | 'immersion' | 'revered' | 'alphabetical'> = {
      popular: 'immersion',
      rating: 'revered',
      pages: 'immersion',
      alphabetical: 'alphabetical',
    };
    this.exploreSortOrder.set(sortMap[order] || 'latest');
    this.closeAllModals();
    this.selectedNovel.set(null);
    this.navigateToView('explore');
    this.showToast(this.isEn() ? 'Sorted catalog in Explore' : 'تم ترتيب الأعمال والانتقال لصفحة الاستكشاف');
  }

  applyModalFilterAndGoToExplore(): void {
    this.closeAllModals();
    this.selectedNovel.set(null);
    this.navigateToView('explore');
    this.showToast(this.isEn() ? 'Filters applied in Explore' : 'تم تطبيق التصفية في صفحة الاستكشاف');
  }

  shuffleSerendipity(): void {
    this.isShuffling.set(true);
    setTimeout(() => {
      this.serendipitySeed.update((s) => s + 1);
      this.isShuffling.set(false);
      if (this.exploreBooksList().length > 0) {
        this.showToast(this.isEn() ? 'Curated new selections from the corridors' : 'تم استحضار اختيارات جديدة من دهاليز السرد');
      }
    }, 350);
  }

  private resolveCanonicalNovel(novel: NovelCard): NovelCard {
    const match = this.allNovelsList().find((n) => n.id === novel.id);
    if (!match) return novel;
    return {
      ...match,
      ...novel,
      author: novel.author || match.author,
      originLanguage: novel.originLanguage || match.originLanguage,
      languageCode: novel.languageCode || match.languageCode,
      readingHours: novel.readingHours ?? match.readingHours,
      isCompleted: novel.isCompleted ?? match.isCompleted,
      quote: novel.quote || match.quote,
    };
  }

  openNovelDetails(novel: NovelCard): void {
    const resolved = this.resolveCanonicalNovel(novel);
    this.selectedNovel.set(resolved);
    const scope = this.exploreLanguageScope();
    const preferred: ChapterLanguage | undefined =
      scope === 'non-ar' ? 'en' : scope === 'ar' ? 'ar' : this.i18n.lang();
    const cached = this.writerStudio.publicNovelDetailsCache()[resolved.id];
    const initialChapLang = getDefaultChapterLanguageForNovel(resolved, preferred, cached?.chapters);
    this.selectedChapterLang.set(initialChapLang);
    this.chapterSearchControl.setValue('');
    this.syncNovelChapterProgress(resolved, initialChapLang);
    this.closeAllModals();
    this.navigateToView('details');

    void this.writerStudio.loadPublicNovelContent(resolved.id, true).then(({ chapters }) => {
      if (this.selectedNovel()?.id !== resolved.id) return;
      const currentPool = getChaptersForNovel(resolved.id, this.selectedChapterLang(), resolved, chapters);
      const nextLang =
        currentPool.length > 0
          ? this.selectedChapterLang()
          : getDefaultChapterLanguageForNovel(resolved, preferred, chapters);
      if (nextLang !== this.selectedChapterLang()) {
        this.selectedChapterLang.set(nextLang);
      }
      this.syncNovelChapterProgress(resolved, nextLang);
    });
  }

  setNovelChapterLanguage(lang: ChapterLanguage): void {
    const novel = this.selectedNovel();
    if (!novel) {
      this.selectedChapterLang.set(lang);
      return;
    }
    const prevChapter = this.activeReadingChapter();
    this.selectedChapterLang.set(lang);
    this.chapterSearchControl.setValue('');
    this.syncNovelChapterProgress(novel, lang);

    const nextPool = this.availableChaptersForNovel();
    if (this.currentView() === 'reader' && prevChapter) {
      const prevChNum = prevChapter.chapterNumber ?? prevChapter.id;
      const linked = nextPool.find((c) => (c.chapterNumber ?? c.id) === prevChNum) || nextPool[0];
      if (linked) {
        this.loadChapterContent(linked);
      }
    }

    if (nextPool.length === 0) {
      this.showToast(
        this.isEn()
          ? 'No chapters are available in the selected language yet.'
          : 'لا توجد فصول متوفرة بهذه اللغة حالياً لهذا العمل.'
      );
    } else if (lang === 'en') {
      this.showToast(
        this.isEn()
          ? `Switched novel chapters to English (${nextPool.length} chapters)`
          : `تم تحويل فصول الرواية إلى الإنجليزية (${nextPool.length} فصول متاحة)`
      );
    } else {
      this.showToast(
        this.isEn()
          ? `Switched novel chapters to Arabic (${nextPool.length} chapters)`
          : `تم تحويل فصول الرواية إلى العربية (${nextPool.length} فصلاً متاحاً)`
      );
    }
  }

  toggleNovelChapterLanguage(): void {
    const nextLang: ChapterLanguage = this.selectedChapterLang() === 'ar' ? 'en' : 'ar';
    this.setNovelChapterLanguage(nextLang);
  }

  private getChapterProgressStorageKey(novelId: string, lang: ChapterLanguage, chapterNumber: number): string {
    return `mtx_read_pct_${novelId}_${lang}_${chapterNumber}`;
  }

  private getLastChapterStorageKey(novelId: string, lang: ChapterLanguage): string {
    return `mtx_last_chap_${novelId}_${lang}`;
  }

  private syncNovelChapterProgress(novel: NovelCard, lang: ChapterLanguage): void {
    if (!isPlatformBrowser(this.platformId)) {
      this.selectedChapterLangProgressPercent.set(0);
      return;
    }
    const dbChapters = this.selectedNovel()?.id === novel.id ? this.activeNovelFirestoreChapters() : undefined;
    const dbSections = this.selectedNovel()?.id === novel.id ? this.activeNovelSections() : undefined;
    const chapters = getChaptersForNovel(novel.id, lang, novel, dbChapters, dbSections);
    if (chapters.length === 0) {
      this.selectedChapterLangProgressPercent.set(0);
      return;
    }
    try {
      const lastChRaw = localStorage.getItem(this.getLastChapterStorageKey(novel.id, lang));
      const lastChNum = lastChRaw ? Number(lastChRaw) : 0;
      if (lastChNum > 0) {
        const idx = chapters.findIndex((c) => (c.chapterNumber ?? c.id) === lastChNum);
        const pctSaved = Number(localStorage.getItem(this.getChapterProgressStorageKey(novel.id, lang, lastChNum)) || '0');
        const chapterWeight = Math.max(0, idx) + Math.min(1, Math.max(0, pctSaved / 100));
        const overall = Math.min(100, Math.round((chapterWeight / chapters.length) * 100));
        this.selectedChapterLangProgressPercent.set(overall);
        return;
      }
      this.selectedChapterLangProgressPercent.set(0);
    } catch {
      this.selectedChapterLangProgressPercent.set(0);
    }
  }

  returnToNovels(): void {
    this.closeAllModals();
    this.selectedNovel.set(null);
    this.navigateToView('novels');
  }

  openExplore(): void {
    this.closeAllModals();
    this.selectedNovel.set(null);
    this.navigateToView('explore');
    this.showToast(
      this.isEn() ? 'Opened the Central Explore Catalog' : 'أنت الآن في الخزانة المركزية العامة للاستكشاف'
    );
  }

  setExploreCategory(category: string): void {
    this.exploreCategory.set(category);
    this.explorePage.set(1);
    const labelsAr: Record<string, string> = {
      all: 'جميع المصنفات',
      novels: 'روايات وخيال سردي',
      epics: 'ملاحم وأساطير',
      wisdom: 'فلسفة وحكمة',
      heritage: 'تراث ومخطوطات',
    };
    const labelsEn: Record<string, string> = {
      all: 'All Works',
      novels: 'Novels & Fiction',
      epics: 'Epics & Legends',
      wisdom: 'Philosophy & Wisdom',
      heritage: 'Heritage & Manuscripts',
    };
    this.showToast(
      this.isEn()
        ? `Category: ${labelsEn[category] || category}`
        : `تم فرز الخزانة: ${labelsAr[category] || category}`
    );
  }

  setExploreViewMode(mode: 'grid' | 'list'): void {
    this.exploreViewMode.set(mode);
  }

  onExploreSortChange(event: Event): void {
    const val = (event.target as HTMLSelectElement).value as
      | 'latest'
      | 'immersion'
      | 'revered'
      | 'alphabetical';
    this.exploreSortOrder.set(val);
    this.explorePage.set(1);
    const labelsAr = {
      latest: 'الأحدث إيداعاً',
      immersion: 'الأعلى قراءة وانغماساً',
      revered: 'الأكثر تقديراً وتوثيقاً',
      alphabetical: 'أبجدياً (أ - ي)',
    };
    const labelsEn = {
      latest: 'Recently Deposited',
      immersion: 'Longest & Deepest',
      revered: 'Most Verified & Complete',
      alphabetical: 'Alphabetical (A - Z)',
    };
    this.showToast(this.isEn() ? `Sorted by: ${labelsEn[val]}` : `تم ترتيب الأعمال: ${labelsAr[val]}`);
  }

  setExplorePage(p: number): void {
    if (p >= 1 && p <= this.totalExplorePages()) {
      this.explorePage.set(p);
      const el = document.getElementById('catalog-container');
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    }
  }

  nextExplorePage(): void {
    if (this.explorePage() < this.totalExplorePages()) {
      this.explorePage.update((p) => p + 1);
      const el = document.getElementById('catalog-container');
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    }
  }

  prevExplorePage(): void {
    if (this.explorePage() > 1) {
      this.explorePage.update((p) => p - 1);
      const el = document.getElementById('catalog-container');
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    }
  }

  resetExploreFilters(): void {
    this.exploreSearchControl.setValue('');
    this.exploreCategory.set('all');
    this.exploreLanguageScope.set('all');
    this.exploreFilterOriginal.set(true);
    this.exploreFilterTranslated.set(true);
    this.exploreFilterManuscripts.set(false);
    this.exploreFilterStatus.set('all');
    this.exploreFilterReadingTime.set('all');
    this.exploreFilterLanguage.set('الكل');
    this.exploreFilterMood.set('all');
    this.exploreSortOrder.set('latest');
    this.explorePage.set(1);
    this.showToast(this.isEn() ? 'All catalog filters have been reset' : 'تمت إعادة ضبط جميع فلاتر الخزانة');
  }

  toggleExploreMobileFilters(): void {
    this.isMobileFilterDrawerOpen.update((v) => !v);
  }

  // Bookmarks
  async toggleBookmark(novel: NovelCard, event?: Event): Promise<void> {
    if (event) {
      event.stopPropagation();
      event.preventDefault();
    }

    const current = new Set(this.bookmarkedIds());
    const user = this.authSession.currentUser();

    if (current.has(novel.id)) {
      current.delete(novel.id);
      this.showToast(
        this.isEn() ? 'Removed novel from saved tablets' : 'تمت إزالة الرواية من الألواح المحفوظة'
      );
      if (user) {
        removeBookmarkFromFirestore(user.uid, novel.id, current.size).catch((err) => {
          console.warn('Bookmark removal warning:', err);
        });
      }
    } else {
      current.add(novel.id);
      this.showToast(
        this.isEn() ? 'Saved novel to your library shelf' : 'تم حفظ الرواية في ألواحك المفضلة بنجاح'
      );
      if (user) {
        saveBookmarkToFirestore(user.uid, novel, current.size).catch((err) => {
          console.warn('Bookmark save warning:', err);
        });
      }
      try {
        const text = novel.description || novel.title;
        const compressed = await compressToMtx(text, {
          title: novel.title,
          author: novel.author || this.i18n.copy().site.brand,
          chapterTitle: this.isEn() ? 'Opening Excerpt' : 'المطلع التحريري',
          chapterIndex: 1,
          createdAt: new Date().toISOString(),
        });
        await saveToCloudVault({
          id: novel.id,
          title: novel.title,
          author: novel.author || this.i18n.copy().site.brand,
          chapterTitle: this.isEn() ? 'Opening Excerpt' : 'المطلع التحريري',
          originalBytes: compressed.originalUtf8Bytes,
          compressedBytes: compressed.compressedBytes,
          savingsPercent: compressed.savingsPercent,
          b64Payload: '',
          checksum: compressed.checksum,
          crc32Checksum: compressed.crc32Checksum,
          version: '2.5',
          createdAt: new Date().toISOString(),
        });
      } catch {
        // Quiet fallback
      }
    }
    this.bookmarkedIds.set(current);
    this.accountService.ownProfile.update((prof) =>
      prof ? { ...prof, savedNovelsCount: current.size } : prof
    );
    if (this.accountService.viewedIsOwner()) {
      this.accountService.viewedProfile.update((prof) =>
        prof ? { ...prof, savedNovelsCount: current.size } : prof
      );
    }
    try {
      localStorage.setItem('mtx_local_bookmarks', JSON.stringify([...current]));
    } catch {
      // Ignore storage error
    }
  }

  isBookmarked(id: string): boolean {
    return this.bookmarkedIds().has(id);
  }

  showToast(msg: string): void {
    this.toastMessage.set(msg);
    if (this.toastTimeout) {
      clearTimeout(this.toastTimeout);
    }
    this.toastTimeout = setTimeout(() => {
      this.toastMessage.set(null);
      this.toastTimeout = null;
    }, 3000);
  }

  onHeaderBookmarkClick(): void {
    this.toggleBookmarks();
  }

  viewFullVaultFromBookmarks(): void {
    this.isBookmarksOpen.set(false);
    if (this.authSession.currentUser()) {
      this.profileActiveTab.set('vault');
      this.vaultFilter.set('bookmarked');
      this.navigateToView('profile');
      this.showToast(
        this.isEn() ? 'Viewing your saved shelf in your sanctuary' : 'أنت الآن في قائمة مفضلاتك المحفوظة بخزانتك'
      );
    } else {
      this.navigateToView('auth');
      this.showToast(
        this.isEn() ? 'Sign in or create an account to access your library shelf' : 'سجّل دخولك أو أنشئ حسابك للانتقال إلى خزانة مفضلاتك'
      );
    }
  }

  onHeaderProfileClick(): void {
    this.closeAllModals();
    if (this.authSession.currentUser()) {
      this.navigateToView('profile');
    } else {
      this.navigateToView('auth');
      this.showToast(
        this.isEn() ? 'Sign in to access your personal sanctuary' : 'سجّل دخولك أو أنشئ حسابك للوصول إلى ديوانك وسادن الرواق'
      );
    }
  }

  // Auth Actions
  async handleEmailLogin(): Promise<void> {
    const user = await this.authSession.loginWithEmailForm();
    if (user) {
      this.showToast(this.isEn() ? 'Signed in successfully' : 'تم تسجيل الدخول بنجاح، مرحباً بك في ديوانك الشخصي');
      this.navigateToView('profile');
    }
  }

  async handleEmailRegister(): Promise<void> {
    const user = await this.authSession.registerWithEmailForm();
    if (user) {
      this.showToast(this.isEn() ? 'Account created successfully' : 'تم إنشاء حسابك وتدشين ديوانك الشخصي بنجاح');
      this.navigateToView('profile');
    }
  }

  async handleGoogleLogin(): Promise<void> {
    const user = await this.authSession.loginWithGoogleProvider();
    if (user) {
      this.showToast(
        this.isEn()
          ? `Welcome ${user.displayName || 'to your reading sanctuary'}`
          : `مرحباً بك ${user.displayName || 'في ديوانك القرائي'}`
      );
      this.navigateToView('profile');
    }
  }

  async handleLogout(): Promise<void> {
    await this.authSession.logout();
    this.showToast(this.isEn() ? 'Signed out cleanly' : 'تم تسجيل الخروج بنجاح من صرح أروقة الخلود');
    this.navigateToView('novels');
  }

  setProfileTab(tab: 'vault' | 'works' | 'quotes' | 'timeline' | 'rituals'): void {
    this.profileActiveTab.set(tab);
  }

  setVaultFilter(filterVal: 'all' | 'reading' | 'bookmarked' | 'completed'): void {
    this.vaultFilter.set(filterVal);
  }

  copyQuote(text: string): void {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(text).catch(() => false);
    }
    this.showToast(this.isEn() ? 'Quote copied to clipboard' : 'تم نسخ الاقتباس إلى الحافظة بنجاح');
  }

  // Modals & Drawers
  toggleSearch(): void {
    const nextState = !this.isSearchOpen();
    this.closeAllModals();
    this.isSearchOpen.set(nextState);
  }

  toggleFilter(): void {
    if (this.currentView() === 'explore') {
      this.isMobileFilterDrawerOpen.update((v) => !v);
    } else {
      const nextState = !this.isFilterOpen();
      this.closeAllModals();
      this.isFilterOpen.set(nextState);
    }
  }

  toggleBookmarks(): void {
    const nextState = !this.isBookmarksOpen();
    this.closeAllModals();
    this.isBookmarksOpen.set(nextState);
  }

  toggleProfile(): void {
    this.onHeaderProfileClick();
  }

  toggleMobileNav(): void {
    const nextState = !this.isMobileNavOpen();
    this.closeAllModals();
    this.isMobileNavOpen.set(nextState);
  }

  closeAllModals(): void {
    this.isSearchOpen.set(false);
    this.isFilterOpen.set(false);
    this.isBookmarksOpen.set(false);
    this.isProfileOpen.set(false);
    this.isMobileNavOpen.set(false);
    this.isSiteSettingsOpen.set(false);
    this.isReportModalOpen.set(false);
  }

  switchCorridor(corridor: CorridorId): void {
    this.activeCorridor.set(corridor);
    this.returnToNovels();
    const namesAr: Record<CorridorId, string> = {
      novels: 'رواق الروايات (Crimson Noir)',
      epics: 'رواق الملاحم (Mythic Bronze)',
      wisdom: 'رواق الحكمة (Ivory Sanctuary)',
      heritage: 'رواق التراث (Manuscript Emerald)',
    };
    const namesEn: Record<CorridorId, string> = {
      novels: 'Corridor of Novels (Crimson Noir)',
      epics: 'Corridor of Epics (Mythic Bronze)',
      wisdom: 'Corridor of Wisdom (Ivory Sanctuary)',
      heritage: 'Corridor of Heritage (Manuscript Emerald)',
    };
    this.showToast(
      this.isEn() ? `Switched to ${namesEn[corridor]}` : `تم الانتقال إلى ${namesAr[corridor]}`
    );
  }

  setReaderFontSize(size: 'sm' | 'md' | 'lg'): void {
    this.readerFontSize.set(size);
    const labelsAr = { sm: 'دقيق', md: 'قياسي', lg: 'وافر' };
    const labelsEn = { sm: 'Compact', md: 'Standard', lg: 'Large' };
    this.showToast(
      this.isEn() ? `Reader size: ${labelsEn[size]}` : `تم تعيين خط القراءة: ${labelsAr[size]}`
    );
  }

  setSortOrder(order: 'popular' | 'rating' | 'pages' | 'alphabetical'): void {
    this.activeSortOrder.set(order);
    const labelsAr = {
      popular: 'الأكثر قراءة',
      rating: 'الأعلى نقاءً',
      pages: 'الأطول صفحات',
      alphabetical: 'الأبجدي',
    };
    const labelsEn = {
      popular: 'Most Read',
      rating: 'Highest Rated',
      pages: 'Longest',
      alphabetical: 'Alphabetical',
    };
    this.showToast(
      this.isEn() ? `Sorted by: ${labelsEn[order]}` : `تم ترتيب الأعمال بحسب: ${labelsAr[order]}`
    );
    this.isFilterOpen.set(false);
  }

  clearAllBookmarks(): void {
    const previous = Array.from(this.bookmarkedIds());
    this.bookmarkedIds.set(new Set());
    const user = this.authSession.currentUser();
    if (user) {
      previous.forEach((id) => {
        void removeBookmarkFromFirestore(user.uid, id, 0).catch(() => undefined);
      });
      void syncSavedNovelsCountToFirestore(user.uid, 0).catch(() => undefined);
      this.accountService.ownProfile.update((prof) =>
        prof ? { ...prof, savedNovelsCount: 0 } : prof
      );
      if (this.accountService.viewedIsOwner()) {
        this.accountService.viewedProfile.update((prof) =>
          prof ? { ...prof, savedNovelsCount: 0 } : prof
        );
      }
    }
    try {
      localStorage.removeItem('mtx_local_bookmarks');
    } catch {
      // Ignore storage error
    }
    this.showToast(
      this.isEn() ? 'All saved tablets have been cleared' : 'تم تفريغ جميع الألواح المحفوظة'
    );
  }

  applySearchTag(tag: string): void {
    this.goToExploreWithTag(tag);
  }

  toggleChapterSort(): void {
    this.isChapterSortAscending.update((v) => !v);
  }

  toggleAuthorFollow(): void {
    const novel = this.selectedNovel();
    if (!novel) return;
    const authorName = novel.author || (this.isEn() ? 'the author' : 'الكاتب');
    const current = this.isAuthorFollowed();
    this.isAuthorFollowed.set(!current);
    if (!current) {
      this.showToast(
        this.isEn() ? `Following ${authorName}` : `تتابع ${authorName} حالياً`
      );
    } else {
      this.showToast(this.isEn() ? 'Unfollowed author' : 'تم إلغاء متابعة الكاتب');
    }
  }

  private loadChapterContent(chapter: ChapterItem): void {
    const novel = this.selectedNovel();
    if (!novel) return;
    const chapLang: ChapterLanguage = chapter.language || this.selectedChapterLang();
    if (this.selectedChapterLang() !== chapLang) {
      this.selectedChapterLang.set(chapLang);
    }
    this.activeReadingChapter.set(chapter);
    const dbChapters = this.activeNovelFirestoreChapters();
    const dbSections = this.activeNovelSections();
    const content = getChapterProse(novel.title, chapter, novel, dbChapters, dbSections);
    this.readerActiveChapterContent.set(content);
    this.activeChapterText.set(content.paragraphs.join('\n\n'));

    const chNum = chapter.chapterNumber ?? chapter.id;
    const progressKey = this.getChapterProgressStorageKey(novel.id, chapLang, chNum);
    try {
      const savedPct = localStorage.getItem(progressKey);
      this.readerProgressPercent.set(savedPct ? Number(savedPct) : 0);
      localStorage.setItem(this.getLastChapterStorageKey(novel.id, chapLang), String(chNum));
    } catch {
      this.readerProgressPercent.set(0);
    }
    this.syncNovelChapterProgress(novel, chapLang);
  }

  private getAnonReaderKey(): string {
    if (!isPlatformBrowser(this.platformId)) return 'guest_ssr';
    try {
      const existing = localStorage.getItem('mtx_anon_reader_id');
      if (existing && /^[a-zA-Z0-9_-]+$/.test(existing)) {
        return existing;
      }
      const created = `guest_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
      localStorage.setItem('mtx_anon_reader_id', created);
      return created;
    } catch {
      return `guest_${Date.now().toString(36)}`;
    }
  }

  private stopVerifiedReadTracking(): void {
    if (this.readTrackerTimer) {
      clearInterval(this.readTrackerTimer);
      this.readTrackerTimer = null;
    }
    this.activeReadSessionId = null;
    this.activeReadSessionNovelId = null;
    this.readVisibleMs = 0;
  }

  private startVerifiedReadTracking(novel: NovelCard, chapter: ChapterItem): void {
    this.stopVerifiedReadTracking();
    this.verifiedReadSessionAwarded.set(false);
    if (!isPlatformBrowser(this.platformId) || !novel.isFirestoreBacked || !chapter.firestoreChapterId) {
      return;
    }

    const user = this.authSession.currentUser();
    const readerKey = user ? user.uid : this.getAnonReaderKey();
    const firestoreChapId = chapter.firestoreChapterId;
    const novelId = novel.id;

    void startReadSessionWithServerTime(novelId, firestoreChapId, readerKey, user?.uid)
      .then((res) => {
        if (this.activeReadingChapter()?.firestoreChapterId !== firestoreChapId) return;
        if (res.alreadyVerified) {
          this.verifiedReadSessionAwarded.set(true);
          return;
        }
        if (!res.sessionId) return;

        this.activeReadSessionId = res.sessionId;
        this.activeReadSessionNovelId = novelId;
        this.readVisibleMs = 0;

        this.readTrackerTimer = setInterval(() => {
          if (typeof document === 'undefined') return;
          if (
            document.visibilityState !== 'visible' ||
            this.currentView() !== 'reader' ||
            !this.isReadingChapterOpen()
          ) {
            return;
          }
          this.readVisibleMs += 1000;
          // 61s ensures Firestore server timestamp delta >= 60s strictly passes
          if (this.readVisibleMs >= 61_000 && this.activeReadSessionId && this.activeReadSessionNovelId === novelId) {
            const committedSessionId = this.activeReadSessionId;
            if (this.readTrackerTimer) {
              clearInterval(this.readTrackerTimer);
              this.readTrackerTimer = null;
            }
            void commitVerifiedReadTransaction(
              novelId,
              committedSessionId,
              readerKey,
              firestoreChapId,
              user?.uid
            ).then((commitRes) => {
              if (commitRes.counted) {
                this.verifiedReadSessionAwarded.set(true);
                const nextReads = commitRes.newCount;
                if (typeof nextReads === 'number') {
                  this.selectedNovel.update((curr) =>
                    curr && curr.id === novelId ? { ...curr, verifiedReadsCount: nextReads } : curr
                  );
                  this.exploreBooksList.update((list) =>
                    list.map((b) => (b.id === novelId ? { ...b, verifiedReadsCount: nextReads } : b))
                  );
                }
              }
            });
          }
        }, 1000);
      })
      .catch(() => undefined);
  }

  openChapter(chapter: ChapterItem): void {
    this.isReadingChapterOpen.set(true);
    const current = this.currentView();
    if (current !== 'reader') {
      this.previousView.set(current);
    }

    this.loadChapterContent(chapter);
    this.readerToolbarVisible.set(true);
    this.stopAutoScroll();
    this.navigateToView('reader', false);

    if (isPlatformBrowser(this.platformId)) {
      setTimeout(() => {
        const el = document.getElementById('cinematic-reader-container');
        if (el) el.scrollTop = 0;
        window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
      }, 40);
    }

    const novel = this.selectedNovel();
    if (!novel) return;
    this.startVerifiedReadTracking(novel, chapter);

    const user = this.authSession.currentUser();
    if (user) {
      void recordChapterReadInFirestore(
        user.uid,
        novel.id,
        novel.title,
        chapter.chapterNumber ?? chapter.id,
        chapter.title
      )
        .then((count) => {
          if (count > 0) {
            this.accountService.ownReadChaptersCount.set(count);
            this.accountService.ownProfile.update((prof) =>
              prof ? { ...prof, readChaptersCount: count } : prof
            );
            if (this.accountService.viewedIsOwner()) {
              this.accountService.viewedProfile.update((prof) =>
                prof ? { ...prof, readChaptersCount: count } : prof
              );
            }
          }
        })
        .catch(() => undefined);
    }

    this.showToast(this.isEn() ? `Reading: ${chapter.title}` : `قراءة: ${chapter.title}`);
  }

  closeChapterReader(): void {
    this.exitReader();
  }

  exitReader(): void {
    this.stopVerifiedReadTracking();
    this.stopAutoScroll();
    this.readerSettingsDrawerOpen.set(false);
    this.readerChapterDrawerOpen.set(false);
    this.readerBookmarksDrawerOpen.set(false);
    this.isReadingChapterOpen.set(false);

    const prev = this.previousView() || 'details';
    this.navigateToView(prev, false);
  }

  nextChapter(): void {
    const current = this.activeReadingChapter();
    if (!current) return;
    const currentNum = current.chapterNumber ?? current.id;
    const pool = this.availableChaptersForNovel();
    const next = pool.find((c) => (c.chapterNumber ?? c.id) === currentNum + 1);
    if (next) {
      this.openChapter(next);
    } else {
      this.showToast(
        this.isEn() ? 'You have reached the final available chapter.' : 'بلغت الفصل الأخير المتاح من هذا السفر'
      );
    }
  }

  prevChapter(): void {
    const current = this.activeReadingChapter();
    if (!current) return;
    const currentNum = current.chapterNumber ?? current.id;
    const pool = this.availableChaptersForNovel();
    const prev = pool.find((c) => (c.chapterNumber ?? c.id) === currentNum - 1);
    if (prev) {
      this.openChapter(prev);
    } else {
      this.showToast(
        this.isEn() ? 'You are already at the opening chapter.' : 'أنت في مطلع الفصل الأول'
      );
    }
  }

  onReaderScroll(event: Event): void {
    const target = event.target as HTMLElement;
    const currentScrollTop = target.scrollTop || 0;
    const maxScroll = target.scrollHeight - target.clientHeight;

    if (maxScroll > 0) {
      const pct = Math.min(100, Math.max(0, Math.round((currentScrollTop / maxScroll) * 100)));
      this.readerProgressPercent.set(pct);

      if (this.saveProgressTimeout) {
        clearTimeout(this.saveProgressTimeout);
      }
      this.saveProgressTimeout = setTimeout(() => {
        const novel = this.selectedNovel();
        const chap = this.activeReadingChapter();
        if (novel && chap) {
          const lang: ChapterLanguage = chap.language || this.selectedChapterLang();
          const chNum = chap.chapterNumber ?? chap.id;
          try {
            localStorage.setItem(
              this.getChapterProgressStorageKey(novel.id, lang, chNum),
              pct.toString()
            );
            localStorage.setItem(this.getLastChapterStorageKey(novel.id, lang), String(chNum));
            this.syncNovelChapterProgress(novel, lang);
          } catch {
            // Ignore storage errors
          }
        }
      }, 400);
    }

    const delta = currentScrollTop - this.lastScrollTop;
    if (delta > 16 && currentScrollTop > 60) {
      if (this.readerToolbarVisible()) {
        this.readerToolbarVisible.set(false);
      }
    } else if (delta < -10 || currentScrollTop < 40) {
      if (!this.readerToolbarVisible()) {
        this.readerToolbarVisible.set(true);
      }
    }
    this.lastScrollTop = currentScrollTop;
  }

  setReaderTheme(theme: ReaderThemeId): void {
    this.readerTheme.set(theme);
    this.saveCurrentReaderSettings();
    const namesAr: Record<ReaderThemeId, string> = {
      andalusian: 'السواد الأندلسي',
      parchment: 'رق البردي',
      ivory: 'العاجي',
      daylight: 'النهاري',
    };
    const namesEn: Record<ReaderThemeId, string> = {
      andalusian: 'Andalusian Noir',
      parchment: 'Ancient Parchment',
      ivory: 'Warm Ivory',
      daylight: 'Crisp Daylight',
    };
    this.showToast(
      this.isEn() ? `Reader theme: ${namesEn[theme]}` : `سِمة القراءة: ${namesAr[theme]}`
    );
  }

  setReaderFontFamily(font: ReaderFontFamilyId): void {
    this.readerFontFamily.set(font);
    this.saveCurrentReaderSettings();
    const namesAr: Record<ReaderFontFamilyId, string> = {
      amiri: 'الخط الأميري (نسخ كلاسيكي)',
      naskh: 'خط النسخ (عصري وواضح)',
      aref: 'خط الرقعة (أصيل وفني)',
      almarai: 'خط المراعي (هندسي مريح)',
      tajawal: 'خط تجوال (انسيابي حديث)',
      kufi: 'خط الكوفي (رصانة وهيبة)',
      alexandria: 'خط الإسكندرية (حداثي رقمي)',
    };
    const namesEn: Record<ReaderFontFamilyId, string> = {
      amiri: 'Amiri (Classical Serif)',
      naskh: 'Noto Naskh (Editorial)',
      aref: 'Aref Ruqaa (Calligraphic)',
      almarai: 'Almarai (Geometric)',
      tajawal: 'Tajawal (Modern Sans)',
      kufi: 'Noto Kufi (Display)',
      alexandria: 'Alexandria (Clean Sans)',
    };
    this.showToast(
      this.isEn() ? `Typeface: ${namesEn[font] || font}` : `نوع الخط: ${namesAr[font] || font}`
    );
  }

  setReaderFontSizePx(px: number): void {
    const clamped = Math.min(36, Math.max(16, px));
    this.readerFontSizePx.set(clamped);
    this.saveCurrentReaderSettings();
  }

  adjustReaderFontSize(delta: number): void {
    this.setReaderFontSizePx(this.readerFontSizePx() + delta);
    this.showToast(
      this.isEn()
        ? `Font size: ${this.readerFontSizePx()}pt`
        : `حجم الخط: ${this.readerFontSizePx()} نقطة`
    );
  }

  setReaderLineHeight(lh: number): void {
    this.readerLineHeight.set(lh);
    this.saveCurrentReaderSettings();
    const labelsAr: Record<number, string> = {
      1.75: 'ضيق (١.٧٥)',
      2.1: 'متوازن (٢.١)',
      2.4: 'رحب (٢.٤)',
      2.8: 'فسيح (٢.٨)',
    };
    const labelsEn: Record<number, string> = {
      1.75: 'Compact (1.75)',
      2.1: 'Balanced (2.1)',
      2.4: 'Relaxed (2.4)',
      2.8: 'Generous (2.8)',
    };
    this.showToast(
      this.isEn()
        ? `Line spacing: ${labelsEn[lh] || lh}`
        : `ارتفاع السطر: ${labelsAr[lh] || lh}`
    );
  }

  setReaderMeasure(measure: 'compact' | 'balanced' | 'wide' | 'fluid'): void {
    this.readerMeasure.set(measure);
    this.saveCurrentReaderSettings();
    const namesAr = {
      compact: 'مركّز (ضيق)',
      balanced: 'معياري (متوازن)',
      wide: 'عريض (رحب)',
      fluid: 'ملء العرض (تلقائي)',
    };
    const namesEn = {
      compact: 'Compact',
      balanced: 'Balanced',
      wide: 'Wide',
      fluid: 'Full Width',
    };
    this.showToast(
      this.isEn() ? `Column width: ${namesEn[measure]}` : `عرض المسطرة: ${namesAr[measure]}`
    );
  }

  setReaderTextAlign(align: 'justify' | 'right'): void {
    this.readerTextAlign.set(align);
    this.saveCurrentReaderSettings();
    this.showToast(
      this.isEn()
        ? `Alignment: ${align === 'justify' ? 'Justified' : 'Natural Edge'}`
        : `محاذاة النص: ${align === 'justify' ? 'مضبوط بكشيدة' : 'محاذاة طبيعية للحافة'}`
    );
  }

  setReaderParagraphSpacing(spacing: 'compact' | 'normal' | 'relaxed'): void {
    this.readerParagraphSpacing.set(spacing);
    this.saveCurrentReaderSettings();
    const namesAr = { compact: 'متقارب', normal: 'متوازن', relaxed: 'متباعد' };
    const namesEn = { compact: 'Compact', normal: 'Normal', relaxed: 'Relaxed' };
    this.showToast(
      this.isEn()
        ? `Paragraph spacing: ${namesEn[spacing]}`
        : `تباعد الفقرات: ${namesAr[spacing]}`
    );
  }

  setReaderPadding(padding: 'compact' | 'balanced' | 'generous'): void {
    this.readerPadding.set(padding);
    this.saveCurrentReaderSettings();
    const namesAr = { compact: 'هوامش ضيقة', balanced: 'هوامش متوازنة', generous: 'هوامش رحبة' };
    const namesEn = { compact: 'Compact', balanced: 'Balanced', generous: 'Generous' };
    this.showToast(
      this.isEn() ? `Side margins: ${namesEn[padding]}` : `الهوامش الجانبية: ${namesAr[padding]}`
    );
  }

  toggleAutoScroll(): void {
    if (this.readerAutoScrollActive()) {
      this.stopAutoScroll();
      this.showToast(this.isEn() ? 'Auto-scroll paused' : 'تم إيقاف التمرير التلقائي');
    } else {
      this.startAutoScroll();
      this.showToast(this.isEn() ? 'Calm auto-scroll started' : 'بدأ التمرير التلقائي الهادئ');
    }
  }

  startAutoScroll(): void {
    this.stopAutoScroll();
    this.readerAutoScrollActive.set(true);
    const speed = this.readerAutoScrollSpeed();
    const intervalMs = 35;
    const stepPx = speed === 1 ? 1 : speed === 2 ? 2 : 3;

    this.autoScrollInterval = setInterval(() => {
      const container = document.getElementById('cinematic-reader-container');
      if (container) {
        if (container.scrollTop + container.clientHeight >= container.scrollHeight - 5) {
          this.stopAutoScroll();
          this.showToast(this.isEn() ? 'End of chapter reached' : 'بلغت نهاية الفصل');
          return;
        }
        container.scrollTop += stepPx;
      }
    }, intervalMs);
  }

  stopAutoScroll(): void {
    if (this.autoScrollInterval) {
      clearInterval(this.autoScrollInterval);
      this.autoScrollInterval = null;
    }
    this.readerAutoScrollActive.set(false);
  }

  setAutoScrollSpeed(speed: 1 | 2 | 3): void {
    this.readerAutoScrollSpeed.set(speed);
    if (this.readerAutoScrollActive()) {
      this.startAutoScroll();
    }
    const labelsAr = { 1: 'هادئ (١x)', 2: 'متوسط (٢x)', 3: 'سريع (٣x)' };
    const labelsEn = { 1: 'Calm (1x)', 2: 'Moderate (2x)', 3: 'Brisk (3x)' };
    this.showToast(
      this.isEn() ? `Scroll speed: ${labelsEn[speed]}` : `سرعة التمرير: ${labelsAr[speed]}`
    );
  }

  toggleFullscreen(): void {
    if (!document.fullscreenElement) {
      document.documentElement
        .requestFullscreen()
        .then(() => {
          this.readerIsFullscreen.set(true);
          this.showToast(this.isEn() ? 'Fullscreen enabled' : 'وضع الشاشة الكاملة مفعّل');
        })
        .catch(() => {
          this.showToast(this.isEn() ? 'Could not enter fullscreen' : 'تعذر تفعيل الشاشة الكاملة');
        });
    } else {
      document
        .exitFullscreen()
        .then(() => {
          this.readerIsFullscreen.set(false);
          this.showToast(this.isEn() ? 'Exited fullscreen' : 'الخروج من الشاشة الكاملة');
        })
        .catch(() => false);
    }
  }

  toggleReaderSettingsDrawer(): void {
    this.readerSettingsDrawerOpen.update((v) => !v);
    if (this.readerSettingsDrawerOpen()) {
      this.readerChapterDrawerOpen.set(false);
      this.readerBookmarksDrawerOpen.set(false);
    }
  }

  toggleReaderChapterDrawer(): void {
    this.readerChapterDrawerOpen.update((v) => !v);
    if (this.readerChapterDrawerOpen()) {
      this.readerSettingsDrawerOpen.set(false);
      this.readerBookmarksDrawerOpen.set(false);
    }
  }

  toggleReaderBookmarksDrawer(): void {
    this.readerBookmarksDrawerOpen.update((v) => !v);
    if (this.readerBookmarksDrawerOpen()) {
      this.readerSettingsDrawerOpen.set(false);
      this.readerChapterDrawerOpen.set(false);
    }
  }

  addCurrentBookmark(): void {
    const chap = this.activeReadingChapter();
    if (!chap) return;

    const content = this.readerActiveChapterContent();
    const excerpt = content?.paragraphs[0]?.slice(0, 75) + '...' || chap.title;
    const chapLang: ChapterLanguage = chap.language || this.selectedChapterLang();
    const newBm: ReaderBookmarkItem = {
      id: 'bm_' + Date.now(),
      chapterId: chap.chapterNumber ?? chap.id,
      chapterTitle: chap.title,
      language: chapLang,
      excerpt,
      percent: this.readerProgressPercent(),
      date: new Date().toLocaleDateString(this.isEn() ? 'en-US' : 'ar-SA'),
    };

    this.readerBookmarks.update((list) => [newBm, ...list]);
    this.showToast(
      this.isEn()
        ? `Bookmark saved at ${this.readerProgressPercent()}%`
        : `حُفظت علامة مرجعية عند ${this.readerProgressPercent()}% من الفصل`
    );
  }

  removeBookmark(bmId: string): void {
    this.readerBookmarks.update((list) => list.filter((b) => b.id !== bmId));
    this.showToast(this.isEn() ? 'Bookmark removed' : 'تم حذف العلامة المرجعية');
  }

  jumpToBookmark(bm: { chapterId: number; percent: number; language?: ChapterLanguage }): void {
    if (bm.language && bm.language !== this.selectedChapterLang()) {
      this.selectedChapterLang.set(bm.language);
    }
    const pool = this.availableChaptersForNovel();
    const target = pool.find((c) => (c.chapterNumber ?? c.id) === bm.chapterId) || pool[0];
    if (target) {
      this.openChapter(target);
      this.readerBookmarksDrawerOpen.set(false);
      setTimeout(() => {
        const container = document.getElementById('cinematic-reader-container');
        if (container) {
          const targetScroll = (container.scrollHeight - container.clientHeight) * (bm.percent / 100);
          container.scrollTo({ top: targetScroll, behavior: 'smooth' });
        }
      }, 150);
    }
  }

  resetReaderSettings(): void {
    this.readerTheme.set('andalusian');
    this.readerFontFamily.set('amiri');
    this.readerFontSizePx.set(22);
    this.readerLineHeight.set(2.2);
    this.readerMeasure.set('balanced');
    this.readerTextAlign.set('justify');
    this.readerParagraphSpacing.set('normal');
    this.readerPadding.set('balanced');
    this.saveCurrentReaderSettings();
    this.showToast(this.isEn() ? 'Reader settings reset to defaults' : 'تمت استعادة الإعدادات الافتراضية للقراءة');
  }

  saveCurrentReaderSettings(): void {
    try {
      const settings = {
        theme: this.readerTheme(),
        fontFamily: this.readerFontFamily(),
        fontSizePx: this.readerFontSizePx(),
        lineHeight: this.readerLineHeight(),
        measure: this.readerMeasure(),
        textAlign: this.readerTextAlign(),
        paragraphSpacing: this.readerParagraphSpacing(),
        padding: this.readerPadding(),
      };
      localStorage.setItem('mtx_reader_settings', JSON.stringify(settings));
    } catch {
      // Ignore storage error
    }
  }

  loadSavedReaderSettings(): void {
    try {
      const raw = localStorage.getItem('mtx_reader_settings');
      if (raw) {
        const s = JSON.parse(raw);
        if (s.theme) this.readerTheme.set(s.theme);
        if (s.fontFamily) this.readerFontFamily.set(s.fontFamily);
        if (s.fontSizePx) this.readerFontSizePx.set(s.fontSizePx);
        if (s.lineHeight) this.readerLineHeight.set(s.lineHeight);
        if (s.measure) this.readerMeasure.set(s.measure);
        if (s.textAlign) this.readerTextAlign.set(s.textAlign);
        if (s.paragraphSpacing) this.readerParagraphSpacing.set(s.paragraphSpacing);
        if (s.padding) this.readerPadding.set(s.padding);
      }
    } catch {
      // Ignore storage error
    }
  }

  async startReadingNovel(novel: NovelCard): Promise<void> {
    const resolved = this.resolveCanonicalNovel(novel);
    this.selectedNovel.set(resolved);
    let dbChapters: LogicalChapter[] | undefined;
    if (resolved.isFirestoreBacked || resolved.id.startsWith('novel_') || resolved.id.startsWith('usr-')) {
      const loaded = await this.writerStudio.loadPublicNovelContent(resolved.id, false).catch(() => ({
        sections: [],
        chapters: [],
      }));
      dbChapters = loaded.chapters;
    }
    const scope = this.exploreLanguageScope();
    const preferred: ChapterLanguage | undefined =
      scope === 'non-ar' ? 'en' : scope === 'ar' ? 'ar' : this.i18n.lang();
    const chapLang = getDefaultChapterLanguageForNovel(resolved, preferred, dbChapters);
    this.selectedChapterLang.set(chapLang);
    const pool = getChaptersForNovel(resolved.id, chapLang, resolved, dbChapters);
    const targetChap = pool.find((c) => c.status === 'current') || pool[0];
    if (!targetChap) {
      this.openNovelDetails(resolved);
      this.showToast(
        this.isEn() ? 'No chapters available in this language yet.' : 'لا توجد فصول متوفرة بهذه اللغة حالياً.'
      );
      return;
    }
    this.openChapter(targetChap);
  }

  openNovelAndRead(novel: NovelCard): void {
    void this.startReadingNovel(novel);
  }

  resumeReadingNovel(novel: NovelCard): void {
    void this.startReadingNovel(novel);
  }

  async downloadBookOffline(): Promise<void> {
    const novel = this.selectedNovel();
    if (!novel) return;

    if (novel.isFirestoreBacked || this.activeNovelFirestoreChapters().length > 0) {
      try {
        const rec: PublishedNovelRecord = {
          id: novel.id,
          title: novel.title,
          ...(novel.titleEn ? { titleEn: novel.titleEn } : {}),
          authorId: novel.authorId || '',
          authorName: novel.author || this.i18n.copy().site.brand,
          workType: novel.workType || 'original',
          ...(novel.originalAuthor ? { originalAuthor: novel.originalAuthor } : {}),
          ...(novel.firstAuthor ? { firstAuthor: novel.firstAuthor } : {}),
          ...(novel.supportMethod ? { supportMethod: novel.supportMethod } : {}),
          novelStatus: novel.novelStatus || (novel.isCompleted ? 'completed' : 'ongoing'),
          genre: novel.genre,
          categoryGroup: novel.categoryGroup || 'novels',
          coverUrl: novel.coverUrl,
          description: novel.description || '',
          readingHours: novel.readingHours || 1,
          originLanguage: novel.originLanguage,
          languageCode: novel.languageCode,
          ...(novel.tags?.length ? { tags: novel.tags } : {}),
          isPublished: true,
          createdAt: '',
          updatedAt: new Date().toISOString(),
        };
        const exported = await this.writerStudio.exportNovelMtxArchive(
          rec,
          this.activeNovelSections(),
          this.activeNovelFirestoreChapters()
        );
        if (exported) {
          this.showToast(
            this.isEn()
              ? `Downloaded complete .mtx package (${exported.chapterCount} chapter(s))`
              : `تم تنزيل حزمة الرواية الكاملة بصيغة MTX (${exported.chapterCount} فصول)`
          );
          return;
        }
      } catch {
        // Fallback cleanly to single-text archival export below
      }
    }

    try {
      const rawText = this.activeChapterText() || novel.description || novel.quote || novel.title;
      const compression = await compressToMtx(rawText, {
        title: novel.title,
        author: novel.author || this.i18n.copy().site.brand,
        chapterTitle: this.isEn() ? 'Verified Chapter' : 'الفصل المحقق',
        chapterIndex: 1,
        genre: novel.genre,
        createdAt: new Date().toISOString(),
      });

      try {
        const base64Mtx = btoa(
          Array.from(compression.mtxBytes)
            .map((b) => String.fromCharCode(b))
            .join('')
        );
        localStorage.setItem(`mtx_offline_${novel.id}`, base64Mtx);
      } catch {
        // Ignore storage limits
      }

      const blob = new Blob([compression.mtxBytes as unknown as BlobPart], {
        type: 'application/octet-stream',
      });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      const safeTitle = novel.title.replace(/[\\/?%*:|"<>]/g, '_').trim();
      anchor.download = this.isEn() ? `${safeTitle}_verified.mtx` : `${safeTitle}_محقق.mtx`;
      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);
      URL.revokeObjectURL(url);

      this.showToast(
        this.isEn()
          ? `Downloaded "${novel.title}" as verified MTX v2.5 for offline reading`
          : `تم تنزيل «${novel.title}» محققة بصيغة MTX v2.5 وحفظها في الذاكرة دون اتصال`
      );
    } catch (err) {
      console.error('Download offline error:', err);
      this.showToast(
        this.isEn()
          ? 'Could not encode and download the manuscript'
          : 'حدث خطأ أثناء تشفير المخطوطة وتنزيلها'
      );
    }
  }

  async shareBook(): Promise<void> {
    const novel = this.selectedNovel();
    const shareTitle = novel ? novel.title : this.i18n.copy().site.brand;
    const shareText = novel
      ? this.isEn()
        ? `Read "${novel.title}" on Eternity Corridors:`
        : `اقرأ سفر «${novel.title}» في صرح أروقة الخلود:`
      : this.i18n.copy().site.brand;
    const shareUrl = typeof window !== 'undefined' ? window.location.href : '';

    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: shareTitle,
          text: shareText,
          url: shareUrl,
        });
        this.showToast(this.isEn() ? 'Work link shared' : 'تمت مشاركة المخطوطة بنجاح');
        return;
      } catch {
        // Fallback to clipboard
      }
    }

    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      try {
        await navigator.clipboard.writeText(shareUrl);
        this.showToast(this.isEn() ? 'Link copied to clipboard' : 'تم نسخ رابط الرواية المباشر لمشاركتها');
      } catch {
        this.showToast(this.isEn() ? 'Link ready to share' : 'تم نسخ رابط الرواية لمشاركتها مع القرّاء');
      }
    } else {
      this.showToast(this.isEn() ? 'Link ready to share' : 'تم نسخ رابط الرواية لمشاركتها مع القرّاء');
    }
  }

  openEditDraft(work: { id: string; title: string; category: string; summary: string }): void {
    this.publishForm.patchValue({
      title: work.title,
      synopsis: work.summary,
      genreLabel: work.category,
      authorName: this.authSession.displayName(),
    });
    this.isPublishModalOpen.set(true);
    this.showToast(
      this.isEn()
        ? `Opened draft "${work.title}" in the publishing editor`
        : `تم فتح مسودة «${work.title}» في محرر النشر`
    );
  }

  sponsorNewSalon(): void {
    this.showToast(
      this.isEn()
        ? 'Literary salons are created alongside published discussions.'
        : 'تُنشأ المجالس الأدبية تبعاً لنقاشات الأعمال المنشورة في الرواق.'
    );
  }

  scrollToSection(id: string): void {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  }

  scrollContainer(containerId: string, direction: 'prev' | 'next'): void {
    const el = document.getElementById(containerId);
    if (!el) return;
    const distance = Math.max(280, Math.round(el.clientWidth * 0.72));
    const sign = this.i18n.isRtl()
      ? direction === 'next'
        ? -1
        : 1
      : direction === 'next'
        ? 1
        : -1;
    el.scrollBy({ left: sign * distance, behavior: 'smooth' });
  }

  // Soundscape Synth Engine
  private soundscapeOscillators: OscillatorNode[] = [];
  private soundscapeGain?: GainNode;
  private audioCtx?: AudioContext;

  toggleSoundscape(): void {
    if (this.soundscapeActive()) {
      this.stopSoundscape();
      this.showToast(this.isEn() ? 'Ambient soundscape muted' : 'تم إيقاف المقطع الصوتي الافتتاحي');
    } else {
      this.startSoundscape();
      this.showToast(
        this.isEn()
          ? 'Playing ambient soundscape'
          : 'يتم الآن عزف المقطع الصوتي التحريري المهيب (Soundscape)'
      );
    }
  }

  private startSoundscape(): void {
    try {
      const AudioCtxClass =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtxClass) {
        this.soundscapeActive.set(true);
        return;
      }
      if (!this.audioCtx) {
        this.audioCtx = new AudioCtxClass();
      }
      if (this.audioCtx.state === 'suspended') {
        this.audioCtx.resume();
      }
      this.stopSoundscape(true);

      const masterGain = this.audioCtx.createGain();
      masterGain.gain.setValueAtTime(0.01, this.audioCtx.currentTime);
      masterGain.gain.exponentialRampToValueAtTime(0.12, this.audioCtx.currentTime + 2);
      masterGain.connect(this.audioCtx.destination);
      this.soundscapeGain = masterGain;

      const freqs = [108, 162, 216, 324];
      this.soundscapeOscillators = freqs.map((freq, idx) => {
        const osc = this.audioCtx!.createOscillator();
        osc.type = idx % 2 === 0 ? 'sine' : 'triangle';
        osc.frequency.setValueAtTime(freq, this.audioCtx!.currentTime);

        const filter = this.audioCtx!.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(450, this.audioCtx!.currentTime);

        osc.connect(filter);
        filter.connect(masterGain);
        osc.start();
        return osc;
      });
      this.soundscapeActive.set(true);
    } catch {
      this.soundscapeActive.set(true);
    }
  }

  private stopSoundscape(immediate = false): void {
    if (this.soundscapeStopTimer) {
      clearTimeout(this.soundscapeStopTimer);
      this.soundscapeStopTimer = null;
    }

    const cleanupOscillators = () => {
      this.soundscapeOscillators.forEach((osc) => {
        try {
          osc.stop();
          osc.disconnect();
        } catch {
          // Safe disconnect
        }
      });
      this.soundscapeOscillators = [];
    };

    if (immediate) {
      cleanupOscillators();
      this.soundscapeActive.set(false);
      return;
    }

    if (this.soundscapeGain && this.audioCtx) {
      try {
        this.soundscapeGain.gain.setValueAtTime(
          this.soundscapeGain.gain.value,
          this.audioCtx.currentTime
        );
        this.soundscapeGain.gain.exponentialRampToValueAtTime(0.0001, this.audioCtx.currentTime + 1);
      } catch {
        // Safe fallback
      }
    }
    this.soundscapeStopTimer = setTimeout(() => {
      cleanupOscillators();
      this.soundscapeStopTimer = null;
    }, 1000);
    this.soundscapeActive.set(false);
  }

  openPublishModal(): void {
    const user = this.authSession.currentUser();
    if (!user) {
      this.showToast(
        this.isEn()
          ? 'Please sign in first before applying or publishing'
          : 'يرجى تسجيل الدخول أولاً قبل التقديم أو النشر'
      );
      this.navigateToView('auth');
      return;
    }
    if (!this.accountService.ownWriterStatus().canPublish) {
      this.showToast(
        this.isEn()
          ? 'Publishing requires verified author approval. Apply via Account Settings.'
          : 'النشر متاح فقط للحسابات الحاصلة على صلاحية كاتب معتمد. قدّم طلبك من إعدادات الحساب.'
      );
      this.accountService.activeSettingsSection.set('writer');
      this.accountService.isSettingsOpen.set(true);
      this.navigateToOwnProfile();
      return;
    }
    this.publishForm.patchValue({
      authorName: this.authSession.displayName(),
    });
    this.isPublishModalOpen.set(true);
  }

  closePublishModal(): void {
    this.isPublishModalOpen.set(false);
  }

  openCharterModal(): void {
    this.isCharterModalOpen.set(true);
  }

  closeCharterModal(): void {
    this.isCharterModalOpen.set(false);
  }

  openPublishedNovel(rec: PublishedNovelRecord): void {
    const card = this.mapPublishedRecordToNovelCard(rec);
    this.openNovelDetails(card);
  }

  async openReportModal(): Promise<void> {
    const novel = this.selectedNovel();
    if (!novel) return;
    const user = this.authSession.currentUser();
    if (!user) {
      this.showToast(
        this.isEn()
          ? 'Please sign in first to submit a report.'
          : 'يرجى تسجيل الدخول أولاً لتقديم بلاغ للإدارة.'
      );
      this.navigateToView('auth');
      return;
    }

    this.reportSuccess.set(false);
    this.reportError.set(null);
    this.reportForm.reset({ reason: 'rights', details: '' });
    const reported = await hasUserReportedNovel(novel.id, user.uid).catch(() => false);
    this.alreadyReportedNovel.set(reported);
    this.isReportModalOpen.set(true);
  }

  closeReportModal(): void {
    this.isReportModalOpen.set(false);
    this.reportError.set(null);
  }

  async submitWorkReport(): Promise<void> {
    const novel = this.selectedNovel();
    const user = this.authSession.currentUser();
    if (!novel || !user) return;
    if (this.reportForm.invalid) return;

    const val = this.reportForm.getRawValue();
    this.reportSubmitting.set(true);
    this.reportError.set(null);
    try {
      const res = await submitWorkReportToFirestore(
        novel.id,
        novel.title,
        novel.authorId || '',
        val.reason,
        val.details
      );
      this.alreadyReportedNovel.set(true);
      this.reportSuccess.set(true);

      const nextStatus = res.underReview ? 'under_review' : (novel.moderationStatus || 'active');
      this.selectedNovel.update((curr) =>
        curr && curr.id === novel.id
          ? { ...curr, reportCount: res.reportCount, moderationStatus: nextStatus }
          : curr
      );
      this.exploreBooksList.update((list) =>
        list.map((b) =>
          b.id === novel.id
            ? { ...b, reportCount: res.reportCount, moderationStatus: nextStatus }
            : b
        )
      );
      this.showToast(this.i18n.copy().reports.successMsg);
    } catch (err) {
      const code = err instanceof Error ? err.message : '';
      if (code === 'ALREADY_REPORTED') {
        this.alreadyReportedNovel.set(true);
        this.reportError.set(this.i18n.copy().reports.alreadyReported);
      } else {
        this.reportError.set(
          formatFirestoreErrorForUser(
            err,
            this.i18n.lang(),
            'تعذر إرسال البلاغ حالياً. يرجى المحاولة مجدداً.',
            'Could not submit your report. Please try again.'
          )
        );
      }
    } finally {
      this.reportSubmitting.set(false);
    }
  }

  async submitPublish(): Promise<void> {
    const user = this.authSession.currentUser();
    if (!user || !this.accountService.ownWriterStatus().canPublish) {
      this.showToast(
        this.isEn()
          ? 'Verified author permissions are required.'
          : 'ليست لديك صلاحية نشر معتمدة في قاعدة البيانات.'
      );
      return;
    }

    const val = this.publishForm.getRawValue();
    const cleanTitle = val.title.trim();
    const cleanSynopsis = val.synopsis.trim();
    if (cleanTitle.length < 2 || cleanSynopsis.length < 10) {
      this.showToast(
        this.isEn()
          ? 'Please enter a valid work title (min 2 chars) and synopsis (min 10 chars).'
          : 'يرجى كتابة عنوان المصنف (حرفان على الأقل) وملخص أدبي (١٠ أحرف على الأقل).'
      );
      return;
    }

    const now = new Date().toISOString();
    const isEnglishOrigin = val.originLanguage === 'الإنجليزية' || val.originLanguage === 'English';
    const record: PublishedNovelRecord = {
      id: 'usr-' + Date.now(),
      title: cleanTitle.slice(0, 140),
      authorId: user.uid,
      authorName: val.authorName.trim() || this.authSession.displayName(),
      genre: val.genreLabel || 'رواية أدبية معاصرة',
      categoryGroup: val.categoryGroup || 'novels',
      originLanguage: val.originLanguage || 'عربي أصيل',
      languageCode: isEnglishOrigin ? 'en' : 'ar',
      coverUrl: val.coverUrl.trim() || '/images/writers_sanctuary_bg.jpg',
      description: cleanSynopsis.slice(0, 2000),
      readingHours: val.readingHours || 4,
      isPublished: true,
      createdAt: now,
      updatedAt: now,
    };

    try {
      await publishNovelToFirestore(record);
    } catch (err) {
      this.showToast(
        formatFirestoreErrorForUser(
          err,
          this.i18n.lang(),
          'تعذر حفظ العمل في قاعدة البيانات. تحقق من صلاحيات الكاتب.',
          'Could not publish work. Please verify writer permissions.'
        )
      );
      return;
    }

    const newBook: NovelCard = {
      id: record.id,
      title: record.title,
      author: record.authorName,
      authorId: record.authorId,
      genre: record.genre,
      categoryGroup: record.categoryGroup,
      originLanguage: record.originLanguage,
      languageCode: record.languageCode,
      description: record.description,
      coverUrl: record.coverUrl,
      coverAlt: record.title,
      readingHours: record.readingHours,
      isCompleted: false,
      isOriginal: true,
      isFirestoreBacked: true,
    };
    this.exploreBooksList.update((list) => [newBook, ...list]);
    this.accountService.ownPublishedNovels.update((list) => [record, ...list]);
    if (this.accountService.viewedIsOwner()) {
      this.accountService.viewedPublishedNovels.update((list) => [record, ...list]);
    }
    this.publishedSuccessSpec.set({
      book: newBook,
      archiveCode: 'MTX-DEP-' + Math.floor(100 + Math.random() * 900),
      depositDate: new Date().toLocaleDateString(this.isEn() ? 'en-US' : 'ar-SA'),
    });
    this.isPublishModalOpen.set(false);
    this.publishForm.reset({
      authorName: this.authSession.displayName(),
      categoryGroup: 'novels',
      genreLabel: 'رواية أدبية معاصرة',
      workNature: 'original',
      readingHours: 5,
      originLanguage: 'عربي أصيل',
    });
    this.showToast(
      this.isEn()
        ? 'Your work has been deposited and published cleanly!'
        : 'تم إيداع المصنف الأدبي بنجاح واعتماده في خزائن الصرح'
    );
  }

  openIntegrityDoc(): void {
    this.isIntegrityDocOpen.set(true);
  }

  closeIntegrityDoc(): void {
    this.isIntegrityDocOpen.set(false);
  }

  openManuscriptPreview(): void {
    this.isManuscriptPreviewOpen.set(true);
  }

  closeManuscriptPreview(): void {
    this.isManuscriptPreviewOpen.set(false);
  }

  startPureReading(): void {
    const pool = this.availableChaptersForNovel();
    const targetChap = pool.find((c) => c.status === 'current') || pool[0];
    if (!targetChap) {
      this.showToast(
        this.isEn()
          ? 'No chapters are available in this language yet.'
          : 'لا توجد فصول متوفرة بهذه اللغة حالياً لهذا العمل.'
      );
      return;
    }
    this.openChapter(targetChap);
  }
}
