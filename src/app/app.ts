import { ChangeDetectionStrategy, Component, signal, computed, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import {
  compressToMtx,
  decompressFromMtx,
} from './core/mtx-codec';
import { MTX_LITERARY_PRESETS } from './core/mtx-presets';
import { INITIAL_EXPLORE_CATALOG } from './core/mtx-catalog-data';
import { ChapterTextContent, getChapterProse } from './core/mtx-reader-chapters';
import {
  saveToCloudVault,
  fetchCloudVaultBooks,
  loginWithEmail,
  registerWithEmail,
  loginWithGoogle,
  logoutFirebaseUser,
  subscribeToAuthState,
  getUserProfileFromFirestore,
  saveBookmarkToFirestore,
  removeBookmarkFromFirestore,
  getUserBookmarksFromFirestore,
  StoredUserProfile,
} from './core/mtx-firebase';
import type { User, Unsubscribe } from 'firebase/auth';

export interface NovelCard {
  id: string;
  title: string;
  author?: string;
  genre: string;
  coverUrl: string;
  coverAlt: string;
  description?: string;
  quote?: string;
  rank?: string;
  subGenre?: string;
  categoryLabel?: string;
  categoryBadgeClass?: string;
  categoryGroup?: 'novels' | 'epics' | 'wisdom' | 'heritage';
  metaIcon?: string;
  metaPrimary?: string;
  metaSecondary?: string;
  isCompleted?: boolean;
  readingHours?: number;
  originLanguage?: string;
  tags?: string[];
  isOriginal?: boolean;
  isTranslated?: boolean;
  isManuscript?: boolean;
}

export interface SerendipityNovel {
  id: string;
  title: string;
  corridor: string;
  corridorColor: string;
  description: string;
  coverUrl: string;
  coverAlt: string;
}

export interface ChapterItem {
  id: number;
  arabicNumber: string;
  title: string;
  duration: string;
  publishDate: string;
  status: 'read' | 'current' | 'unread';
  partition: 1 | 2 | 3;
  isLast?: boolean;
}

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-root',
  imports: [CommonModule, ReactiveFormsModule, MatIconModule],
  templateUrl: './app.html',
  styleUrls: ['./app.css'],
})
export class App implements OnInit, OnDestroy {
  // Navigation & View State ('novels' | 'details' | 'explore' | 'auth' | 'profile' | 'reader')
  readonly currentView = signal<'novels' | 'details' | 'explore' | 'auth' | 'profile' | 'reader'>('novels');
  readonly previousView = signal<'novels' | 'details' | 'explore' | 'auth' | 'profile'>('novels');
  readonly selectedNovel = signal<NovelCard | null>(null);
  readonly activeChapterText = signal<string>('');
  readonly bookmarkedIds = signal<Set<string>>(new Set());
  readonly toastMessage = signal<string | null>(null);

  // User Authentication & Firebase Signals
  readonly currentUser = signal<User | null>(null);
  readonly userProfile = signal<StoredUserProfile | null>(null);
  readonly authMode = signal<'login' | 'register'>('login');
  readonly authLoading = signal<boolean>(false);
  readonly authError = signal<string | null>(null);
  private authUnsubscribe: Unsubscribe | null = null;

  // Auth Forms
  readonly authLoginForm = new FormGroup({
    email: new FormControl('', { nonNullable: true }),
    password: new FormControl('', { nonNullable: true }),
  });

  readonly authRegisterForm = new FormGroup({
    displayName: new FormControl('', { nonNullable: true }),
    email: new FormControl('', { nonNullable: true }),
    password: new FormControl('', { nonNullable: true }),
  });

  // Profile View State (ديوان القارئ والباحث)
  readonly profileActiveTab = signal<'vault' | 'works' | 'quotes' | 'timeline' | 'rituals'>('vault');
  readonly vaultFilter = signal<'all' | 'reading' | 'bookmarked' | 'completed'>('all');
  readonly vaultSearchControl = new FormControl('');
  readonly profileBannerUrl = signal<string>('/images/writers_sanctuary_bg.jpg');

  // Profile Quotes Collection
  readonly profileQuotes = signal<{ id: string; quote: string; source: string; realm: string; realmColor: string }[]>([
    {
      id: 'q1',
      quote: '«حين يمتزج صهيل خيول التيموريين بأسرار المراصد الفلكية الشاهقة، ينبض عالم سري من الألغاز والمخطوطات المحرمة، حيث النجوم ليست مجرد ضياء، بل خرائط دمٍ وبقاء.»',
      source: 'رواية أصداء سمرقند — ص ٢١٤',
      realm: 'رواق الروايات',
      realmColor: 'text-[#ffb2bd]',
    },
    {
      id: 'q2',
      quote: '«المرآة لا تعكس وجوه العابرين فحسب، بل تُعرّي ما توارى خلف أسوار الزمان وأغوار الضمير الإنساني في صمت الليل.»',
      source: 'شظايا المرآة السبع — ص ٨٩',
      realm: 'رواق الحكمة',
      realmColor: 'text-[#e5e1e4]',
    },
    {
      id: 'q3',
      quote: '«ليس التاج ما يصنع الملوك في ساحة النزال، بل سيفٌ لا يرتجف وعهدٌ لا يخون في ملحمة الفجر وأهازيج النصر.»',
      source: 'عرش الرماد والتنانين — ص ٣٤٠',
      realm: 'رواق الملاحم',
      realmColor: 'text-[#e9c349]',
    },
    {
      id: 'q4',
      quote: '«كتبتُ هذا الرقيم في قرطبة قبل أن تسكت المآذن، ليعلم من يأتي بعدنا أن الحبر أطول عمراً من السيوف وأبقى من الحصون.»',
      source: 'مخطوطة الزهراء المفقودة — سفر التوثيق',
      realm: 'رواق التراث',
      realmColor: 'text-[#7bd8b1]',
    },
  ]);

  // Profile User Published Works & Literary Drafts
  readonly profileWorks = signal<{ id: string; title: string; category: string; type: 'published' | 'draft'; pages: number; words: number; date: string; summary: string }[]>([
    {
      id: 'w1',
      title: 'أطياف النحاس في مراصد سمرقند وتوثيق الأجرام',
      category: 'رواق التراث والمخطوطات',
      type: 'published',
      pages: 45,
      words: 12400,
      date: 'نُشر في ١٥ رجب',
      summary: 'دراسة تحقيقية مقارنة بين جداول أولغ بك ومخطوطات المرصد السمرقندي الأندلسي المجهولة.',
    },
    {
      id: 'w2',
      title: 'مسودة: تنانين الأفق السابع وأسرار الجدار العتيق',
      category: 'رواق الملاحم والبطولات',
      type: 'draft',
      pages: 18,
      words: 6200,
      date: 'آخر تعديل منذ يومين',
      summary: 'مسودة ملحمية تتناول صراع العروش والخيانات حول حصون الجليد والنار في القفار الشمالية.',
    },
    {
      id: 'w3',
      title: 'شذرات في حكمة الصمت وفلسفة الرواق',
      category: 'رواق الحكمة والتأمل',
      type: 'published',
      pages: 32,
      words: 8900,
      date: 'نُشر في ٢٠ شعبان',
      summary: 'مجموعة تأملات قصيرة حول نقاء الكلمة وعزلة الكاتب في عصر الضجيج التقني.',
    },
  ]);

  // Reading Timeline Milestones
  readonly profileTimeline = [
    { title: 'أكمل قراءة الفصل الرابع: شفرة النجوم ومذنب زرافشان', time: 'اليوم، ٠٤:٣٠ م', book: 'أصداء سمرقند', duration: '٤٥ دقيقة قراءة' },
    { title: 'دوّن اقتباساً مذهباً في خزانة الحكمة والتأمل', time: 'أمس، ٠٩:١٥ م', book: 'شظايا المرآة السبع', duration: 'اقتباس جديد' },
    { title: 'أضاف رواية «عرش الرماد» إلى ألواحه المفضلة', time: 'قبل يومين', book: 'عرش الرماد والتنانين', duration: 'إيداع بالخزانة' },
    { title: 'نال وسام «سادن الاعتكاف القرائي» (٣٤ يوماً متواصلاً)', time: 'منذ ٥ أيام', book: 'صرح أروقة الخلود', duration: 'إنجاز تحريري' },
    { title: 'أتم مراجعة مسودة «أطياف النحاس» واعتماد ميثاق النقاء', time: 'منذ أسبوع', book: 'رواق التراث', duration: 'توثيق رسمي' },
  ];

  // Active Corridor Signal
  readonly activeCorridor = signal<'novels' | 'epics' | 'wisdom' | 'heritage'>('novels');

  // Header Interactive Modals & Drawers State
  readonly isSearchOpen = signal<boolean>(false);
  readonly isFilterOpen = signal<boolean>(false);
  readonly isBookmarksOpen = signal<boolean>(false);
  readonly isProfileOpen = signal<boolean>(false);
  readonly readerFontSize = signal<'sm' | 'md' | 'lg'>('md');
  readonly activeSortOrder = signal<'popular' | 'rating' | 'pages' | 'alphabetical'>('popular');
  readonly filterGenre = signal<string>('الكل');

  // ================= 6. CINEMATIC ADAPTIVE READER STATE =================
  readonly readerTheme = signal<'andalusian' | 'parchment' | 'ivory' | 'daylight'>('andalusian');
  readonly readerFontFamily = signal<'amiri' | 'naskh' | 'aref' | 'almarai' | 'tajawal' | 'kufi' | 'alexandria'>('amiri');
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
  readonly readerBookmarks = signal<{ id: string; chapterId: number; chapterTitle: string; excerpt: string; percent: number; date: string }[]>([]);
  readonly readerChapterSearch = new FormControl('');
  private autoScrollInterval: ReturnType<typeof setInterval> | null = null;
  private lastScrollTop = 0;
  private saveProgressTimeout: ReturnType<typeof setTimeout> | null = null;

  readonly readerThemeConfig = computed(() => {
    switch (this.readerTheme()) {
      case 'parchment':
        return {
          id: 'parchment',
          name: 'رق البردي',
          badgeText: 'رق البردي والقرطاس',
          bg: 'bg-[#f4ebd9]',
          bgHex: '#f4ebd9',
          text: 'text-[#2c231a]',
          textMuted: 'text-[#6f5e4f]',
          toolbarBg: 'bg-[#ede0ca]/95 border-[#dfd2bc]',
          cardBg: 'bg-[#ece0cb]',
          cardBorder: 'border-[#dfd2bc]',
          accent: 'text-[#92400e]',
          accentBg: 'bg-[#92400e] text-[#f4ebd9]',
          selection: 'selection:bg-[#92400e]/30 selection:text-[#2c231a]',
          pillBg: 'bg-[#e2d5bd]',
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
          text: 'text-[#1e2024]',
          textMuted: 'text-[#626975]',
          toolbarBg: 'bg-[#f2eee3]/95 border-[#e4ded0]',
          cardBg: 'bg-[#f2ede1]',
          cardBorder: 'border-[#e4ded0]',
          accent: 'text-[#0f766e]',
          accentBg: 'bg-[#0f766e] text-white',
          selection: 'selection:bg-[#0f766e]/20 selection:text-[#1e2024]',
          pillBg: 'bg-[#e9e3d3]',
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
          text: 'text-[#0f172a]',
          textMuted: 'text-[#475569]',
          toolbarBg: 'bg-[#f8fafc]/95 border-[#e2e8f0]',
          cardBg: 'bg-[#f1f5f9]',
          cardBorder: 'border-[#e2e8f0]',
          accent: 'text-[#2563eb]',
          accentBg: 'bg-[#2563eb] text-white',
          selection: 'selection:bg-[#2563eb]/20 selection:text-[#0f172a]',
          pillBg: 'bg-[#e2e8f0]',
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
          text: 'text-[#e4e4e7]',
          textMuted: 'text-[#a1a1aa]',
          toolbarBg: 'bg-[#18181b]/95 border-[#27272a]',
          cardBg: 'bg-[#1f1e24]',
          cardBorder: 'border-[#27272a]',
          accent: 'text-[#e9c349]',
          accentBg: 'bg-[#e9c349] text-[#121214]',
          selection: 'selection:bg-[#881337] selection:text-[#ffd9dd]',
          pillBg: 'bg-[#27272a]',
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
    const query = (this.readerChapterSearch.value || '').trim().toLowerCase();
    if (!query) return this.chapters;
    return this.chapters.filter((c) =>
      c.title.toLowerCase().includes(query) || c.arabicNumber.includes(query)
    );
  });

  // Search Control & Forms
  readonly searchControl = new FormControl('');
  readonly compressForm = new FormGroup({}); // Kept for backwards compatibility

  // Details Page Interactive State (100% Matching Architectural Design)
  readonly chapterSearchControl = new FormControl('');
  readonly isChapterSortAscending = signal<boolean>(true);
  readonly isAuthorFollowed = signal<boolean>(false);
  readonly activeReadingChapter = signal<ChapterItem | null>(null);
  readonly isReadingChapterOpen = signal<boolean>(false);
  readonly soundscapeActive = signal<boolean>(false);
  readonly isIntegrityDocOpen = signal<boolean>(false);
  readonly isManuscriptPreviewOpen = signal<boolean>(false);
  readonly readingProgressPercent = signal<number>(17);

  // ================= EXPLORE (الاستكشاف) VIEW INTERACTIVE STATE =================
  readonly exploreSearchControl = new FormControl('');
  readonly exploreCategory = signal<string>('all'); // 'all' | 'novels' | 'epics' | 'wisdom' | 'heritage'
  readonly exploreSortOrder = signal<'latest' | 'immersion' | 'revered' | 'alphabetical'>('latest');
  readonly exploreViewMode = signal<'grid' | 'list'>('grid');
  readonly isMobileFilterDrawerOpen = signal<boolean>(false);
  readonly explorePage = signal<number>(1);
  readonly explorePageSize = 12;

  // Smart Explorer Filters
  readonly exploreFilterOriginal = signal<boolean>(true);
  readonly exploreFilterTranslated = signal<boolean>(true);
  readonly exploreFilterManuscripts = signal<boolean>(false);
  readonly exploreFilterStatus = signal<'all' | 'completed' | 'ongoing'>('all');
  readonly exploreFilterReadingTime = signal<'short' | 'medium' | 'long'>('medium');
  readonly exploreFilterLanguage = signal<string>('الكل');
  readonly exploreFilterMood = signal<string>('all');

  // Master Explore Catalog (Signal initialized with all 96 authentic works, dynamic for user deposits)
  readonly exploreBooksList = signal<NovelCard[]>([...INITIAL_EXPLORE_CATALOG]);

  // Real Publishing & Deposit Modal Reactive State
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

  readonly filteredExploreBooks = computed<NovelCard[]>(() => {
    const q = (this.exploreSearchControl.value || '').trim().toLowerCase();
    const cat = this.exploreCategory();
    const sort = this.exploreSortOrder();
    const status = this.exploreFilterStatus();
    const timeFilter = this.exploreFilterReadingTime();
    const lang = this.exploreFilterLanguage();
    const mood = this.exploreFilterMood();

    let list = [...this.exploreBooksList()];

    // Filter by Search Query
    if (q) {
      list = list.filter(
        (b) =>
          b.title.toLowerCase().includes(q) ||
          (b.author && b.author.toLowerCase().includes(q)) ||
          b.genre.toLowerCase().includes(q) ||
          (b.description && b.description.toLowerCase().includes(q)) ||
          (b.tags && b.tags.some((t) => t.toLowerCase().includes(q)))
      );
    }

    // Filter by Top Category Pills
    if (cat !== 'all') {
      list = list.filter((b) => b.categoryGroup === cat);
    }

    // Filter by Status
    if (status === 'completed') {
      list = list.filter((b) => b.isCompleted === true);
    } else if (status === 'ongoing') {
      list = list.filter((b) => b.isCompleted === false);
    }

    // Filter by Reading Time
    if (timeFilter === 'short') {
      list = list.filter((b) => (b.readingHours || 4) <= 3);
    } else if (timeFilter === 'medium') {
      list = list.filter((b) => (b.readingHours || 5) > 3 && (b.readingHours || 5) <= 10);
    } else if (timeFilter === 'long') {
      list = list.filter((b) => (b.readingHours || 6) > 10);
    }

    // Filter by Origin Language (if not all)
    if (lang && lang !== 'الكل') {
      list = list.filter((b) => b.originLanguage === lang);
    }

    // Filter by Mood Tag
    if (mood && mood !== 'all') {
      list = list.filter((b) => b.tags && b.tags.includes(mood));
    }

    // Sorting
    if (sort === 'alphabetical') {
      list.sort((a, b) => a.title.localeCompare(b.title, 'ar'));
    } else if (sort === 'immersion') {
      list.sort((a, b) => (b.readingHours || 0) - (a.readingHours || 0));
    } else if (sort === 'revered') {
      list.sort((a, b) => (Number(b.isCompleted) - Number(a.isCompleted)));
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

  toArabicNumber(n: number): string {
    if (n === -1) return '...';
    const digits = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
    return n.toString().replace(/\d/g, (d) => digits[+d]);
  }

  // Dynamic Realm Theme Calculation (Adapts automatically to the work's realm)
  readonly activeNovelTheme = computed(() => {
    const novel = this.selectedNovel() || this.defaultEchoesSamarkand;
    const g = (novel.genre || '').toLowerCase();
    const t = (novel.title || '').toLowerCase();

    if (g.includes('ملحم') || g.includes('ملاحم') || t.includes('تنانين') || t.includes('الجدار') || t.includes('رماد')) {
      return {
        realmId: 'epics' as const,
        realmName: 'Mythic Bronze',
        realmArabicName: 'رواق الملاحم والبطولات',
        primaryColor: '#e9c349',
        primaryDim: '#af8d11',
        primaryBg: 'bg-[#e9c349]',
        textColor: 'text-[#e9c349]',
        borderColor: 'border-[#e9c349]/40',
        glowGradient: 'from-[#e9c349]/30 via-[#af8d11]/15 to-transparent',
        badgeBg: 'bg-[#af8d11]/30 text-[#e9c349] border-[#e9c349]/40',
        btnBg: 'bg-[#af8d11] hover:bg-[#e9c349] text-black font-bold shadow-[0_10px_25px_rgba(233,195,73,0.35)]',
        volumeNumber: 'السِّفْرُ الثَّانِي — المجلد الثالث',
        archiveCode: 'MTX-774-EPC',
      };
    } else if (g.includes('حكمة') || g.includes('فلسف') || g.includes('نفسي') || t.includes('مرآة') || t.includes('شظايا')) {
      return {
        realmId: 'wisdom' as const,
        realmName: 'Ivory Philosophy',
        realmArabicName: 'رواق الحكمة والتأمل الفلسفي',
        primaryColor: '#e5e1e4',
        primaryDim: '#8a8589',
        primaryBg: 'bg-[#e5e1e4]',
        textColor: 'text-[#e5e1e4]',
        borderColor: 'border-[#e5e1e4]/40',
        glowGradient: 'from-[#e5e1e4]/25 via-[#4a484c]/20 to-transparent',
        badgeBg: 'bg-white/10 text-white border-white/20',
        btnBg: 'bg-white text-black hover:bg-stone-200 font-bold shadow-[0_10px_25px_rgba(255,255,255,0.25)]',
        volumeNumber: 'السِّفْرُ الأَوَّل — حِكْمَةُ المَشْرِق',
        archiveCode: 'MTX-312-WSD',
      };
    } else if (g.includes('تراث') || g.includes('مخطوط') || g.includes('أندلس') || t.includes('قرطبة') || t.includes('شيراز')) {
      return {
        realmId: 'heritage' as const,
        realmName: 'Manuscript Emerald',
        realmArabicName: 'رواق التراث والمخطوطات النادرة',
        primaryColor: '#7bd8b1',
        primaryDim: '#005039',
        primaryBg: 'bg-[#7bd8b1]',
        textColor: 'text-[#7bd8b1]',
        borderColor: 'border-[#7bd8b1]/40',
        glowGradient: 'from-[#7bd8b1]/30 via-[#005039]/20 to-transparent',
        badgeBg: 'bg-[#005039]/40 text-[#7bd8b1] border-[#7bd8b1]/40',
        btnBg: 'bg-[#005039] hover:bg-[#006e4e] text-[#7bd8b1] font-bold shadow-[0_10px_25px_rgba(123,216,177,0.3)]',
        volumeNumber: 'المَخْطُوطُ الرَّابِع — خَزَانَةُ التِّبْر',
        archiveCode: 'MTX-941-EMR',
      };
    } else {
      // Default: Crimson Noir
      return {
        realmId: 'novels' as const,
        realmName: 'Crimson Noir',
        realmArabicName: 'رواق الروايات والخيال السردي',
        primaryColor: '#ffb2bd',
        primaryDim: '#881337',
        primaryBg: 'bg-[#ffb2bd]',
        textColor: 'text-[#ffb2bd]',
        borderColor: 'border-[#ffb2bd]/40',
        glowGradient: 'from-[#ffb2bd]/25 via-[#881337]/30 to-transparent',
        badgeBg: 'bg-[#881337]/40 text-[#ffb2bd] border-[#ffb2bd]/40',
        btnBg: 'bg-[#881337] hover:bg-[#9f1239] text-white font-bold shadow-[0_10px_25px_rgba(136,19,55,0.45)]',
        volumeNumber: 'المُجَلَّدُ الأَوَّل — الطَّبْعَةُ السِّينَمَائِيَّة',
        archiveCode: 'MTX-853-SMQ',
      };
    }
  });

  // Default Masterpiece: أصداء سمرقند
  readonly defaultEchoesSamarkand: NovelCard = {
    id: 'echoes-of-samarkand',
    title: 'أصداء سمرقند',
    author: 'الشيخ جلال الدين الموصلي',
    genre: 'رواق الروايات والخيال السردي',
    subGenre: 'في دهاليز الفلك والبارود',
    coverUrl:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuCIF5pF45h_OR2lIwskuFNX2Fw9AdCINz_hC0Qvf-3zDmpWivbiit8SYF0sS6HhU3kibG9nYM4UcKVC0H4WjgF5VCuxaffvcfC-XrgbjG-oKc3LAqtSqS0Z4LaimKNUeF3EoVGDctyrjracP07ZuLn2ljBOsPpbTDJjrRrRNFZcjHkBoy1Kk-OM5UlnYWhwvMPbjaubWOshxoIfGO98nNuL5FfI-ZO153_wRqE_7CwhTblHyOK8tSyR_Q',
    coverAlt: 'غلاف رواية أصداء سمرقند الفلكية والتاريخية',
    quote:
      '«حين يمتزج صهيل خيول التيموريين بأسرار المراصد الفلكية الشاهقة، ينبض عالم سري من الألغاز والمخطوطات المحرمة، حيث النجوم ليست مجرد ضياء، بل خرائط دمٍ وبقاء.»',
    description:
      'في سمرقند عام ٨٥٣ هجرية، حين كان مرصد السلطان أولغ بك يشق عتمة السماء بأدق جداول فلكية عرفتها البشرية، يُعثر على أحد كبار النساخ مقتولاً داخل القبة السماوية الصغرى، وبيده رقعة جلدية كُتبت بلغة أرقام غير مألوفة، تشير إلى مسار مذنب غامض سيعبر فوق وادي زرافشان بعد أربعين ليلة.',
  };

  // 24 Full Chapters Across 3 Partitions
  readonly chapters: ChapterItem[] = [
    // الباب الأول: سماء النحاس والبارود (الفصول ١ — ٨)
    { id: 1, arabicNumber: '١', title: 'شقشقة الفجر وظلال القلعة المفقودة', duration: '١٨ دقيقة قراءة', publishDate: 'نُشر في المحرم', status: 'read', partition: 1 },
    { id: 2, arabicNumber: '٢', title: 'أصداء الإسطرلاب النحاسي العتيق', duration: '٢٢ دقيقة قراءة', publishDate: 'نُشر في المحرم', status: 'read', partition: 1 },
    { id: 3, arabicNumber: '٣', title: 'قوافل الملح وخرائط التائهين', duration: '١٦ دقيقة قراءة', publishDate: 'نُشر في صفر', status: 'read', partition: 1 },
    { id: 4, arabicNumber: '٤', title: 'ساعة الرمل في محراب أولغ بك', duration: '٢٥ دقيقة قراءة', publishDate: 'موقعك الحالي للقراءة', status: 'current', partition: 1 },
    { id: 5, arabicNumber: '٥', title: 'دماء على أوراق الزيج الجديد', duration: '٢٠ دقيقة قراءة', publishDate: 'نُشر في ربيع الأول', status: 'unread', partition: 1 },
    { id: 6, arabicNumber: '٦', title: 'متاهة حوانيت القاشاني الأزرق', duration: '١٩ دقيقة قراءة', publishDate: 'نُشر في ربيع الأول', status: 'unread', partition: 1 },
    { id: 7, arabicNumber: '٧', title: 'همسات المئذنة المائلة', duration: '١٧ دقيقة قراءة', publishDate: 'نُشر في ربيع الآخر', status: 'unread', partition: 1 },
    { id: 8, arabicNumber: '٨', title: 'انفجار مخزن البارود الغربي', duration: '٢٤ دقيقة قراءة', publishDate: 'نُشر في ربيع الآخر', status: 'unread', partition: 1 },

    // الباب الثاني: أسرار الأبراج التيمورية (الفصول ٩ — ١٦)
    { id: 9, arabicNumber: '٩', title: 'ختم سمرقند المحرم تحت الثرى', duration: '٢١ دقيقة قراءة', publishDate: 'نُشر في جمادى الأولى', status: 'unread', partition: 2 },
    { id: 10, arabicNumber: '١٠', title: 'شفرة الصوفي والأرقام الهندية', duration: '١٥ دقيقة قراءة', publishDate: 'نُشر في جمادى الأولى', status: 'unread', partition: 2 },
    { id: 11, arabicNumber: '١١', title: 'مؤامرة خانات السهوب الشمالية', duration: '٢٣ دقيقة قراءة', publishDate: 'نُشر في جمادى الآخرة', status: 'unread', partition: 2 },
    { id: 12, arabicNumber: '١٢', title: 'ليلة احتراق الرق الأندلسي', duration: '١٨ دقيقة قراءة', publishDate: 'نُشر في جمادى الآخرة', status: 'unread', partition: 2 },
    { id: 13, arabicNumber: '١٣', title: 'حين يتكلم مذنب الموت', duration: '٢٠ دقيقة قراءة', publishDate: 'نُشر في رجب', status: 'unread', partition: 2 },
    { id: 14, arabicNumber: '١٤', title: 'مبارزة على حافة سقف الرصد', duration: '١٦ دقيقة قراءة', publishDate: 'نُشر في رجب', status: 'unread', partition: 2 },
    { id: 15, arabicNumber: '١٥', title: 'رسالة الوزير المسمومة', duration: '٢٢ دقيقة قراءة', publishDate: 'نُشر في رجب', status: 'unread', partition: 2 },
    { id: 16, arabicNumber: '١٦', title: 'صراع في خزانة الكتب الكبرى', duration: '١٩ دقيقة قراءة', publishDate: 'نُشر في شعبان', status: 'unread', partition: 2 },

    // الباب الثالث: خاتمة المذنب وانكشاف الحقيقة (الفصول ١٧ — ٢٤)
    { id: 17, arabicNumber: '١٧', title: 'شروق كوكب الزهرة فوق جيحون', duration: '١٨ دقيقة قراءة', publishDate: 'نُشر في شعبان', status: 'unread', partition: 3 },
    { id: 18, arabicNumber: '١٨', title: 'نداء الأبواق عند أسوار شاه زنده', duration: '٢١ دقيقة قراءة', publishDate: 'نُشر في شعبان', status: 'unread', partition: 3 },
    { id: 19, arabicNumber: '١٩', title: 'مفتاح القوس السداسي الرخامي', duration: '١٧ دقيقة قراءة', publishDate: 'نُشر في شعبان', status: 'unread', partition: 3 },
    { id: 20, arabicNumber: '٢٠', title: 'سقوط القناع عن الفلكي المنفي', duration: '٢٤ دقيقة قراءة', publishDate: 'نُشر في شعبان', status: 'unread', partition: 3 },
    { id: 21, arabicNumber: '٢١', title: 'المعركة الأخيرة في دهليز البارود', duration: '٢٩ دقيقة قراءة', publishDate: 'نُشر في شعبان', status: 'unread', partition: 3 },
    { id: 22, arabicNumber: '٢٢', title: 'حين تلتقي الحسابات بالقدر', duration: '٢٠ دقيقة قراءة', publishDate: 'نُشر في شعبان', status: 'unread', partition: 3 },
    { id: 23, arabicNumber: '٢٣', title: 'انقشاع الدخان وسلام الفيروز', duration: '١٦ دقيقة قراءة', publishDate: 'نُشر في شعبان', status: 'unread', partition: 3 },
    { id: 24, arabicNumber: '٢٤', title: 'خاتمة الأسفار: ما حفظته مراصد الخلود', duration: '٢٧ دقيقة قراءة', publishDate: 'مسك الختام والملحمة', status: 'unread', partition: 3, isLast: true },
  ];

  // Section 5: Related Works (أعمال يوصي بها ديوان القراءة)
  readonly relatedWorks: NovelCard[] = [
    {
      id: 'obsidian-labyrinth-spotlight',
      title: 'متاهة حجر السج',
      genre: 'فانتازيا ظلامية، إسلامية',
      coverUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDyWpsEZ0hpt9DNukWIAi4hvbqC4EQ9K3EpaNF9p3Da237wjyehs9ZLqW4a-NLQjfNQvwcJOwJ7rHvO85j-YTRiNlIUvhM2nY-QJBX3BkKaZfj19MIOAiwVcc8N0kziBHIp-jFwygW-wKynuGJGI9n47w39QyYhPOVVYXSfXP7GlY1CmmjUby0HbekjBbxeR908yRBpnnFzUeAgo6ykld1zBl7HIereQMnzygcJQyFWmCuqreJL4f8C8A',
      coverAlt: 'Dark fantasy medieval Islamic book cover titled The Obsidian Labyrinth',
      description: 'أقواس من حجر السج ونقوش خط عربي ونور شموع قرمزي.',
    },
    {
      id: 'last-bastion',
      title: 'ملحمة الجدار الأخير',
      genre: 'رواية تاريخية ملحمية',
      coverUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDg2Mae1S1zN20sei5lULtu7__HV0volN37_EPDiknBJQhU3mJUHSYFvhaXwnT2akEpIBvR4fauXEGhCUohI2gfZK0wHZTv56kv4oH4fgkKfKzmaYNoNYoMTM2uV4UPsVsveTkgzOvphxbkvXS8qnpfuOBaHf_s9ftQPZkhnebxSPlyljRxwD9oCKtNT5DfOW6z2-TW8LRkEoMoMnnClEYHOXLNZgQ5CfwTzB2iWT1v5BgiEhyxaVAwXg',
      coverAlt: 'Epic historical Arab novel cover titled Epic of the Last Bastion',
      description: 'حصن صحراوي عتيق من الحجر الرملي وسماء ليلية مرصعة بالنجوم.',
    },
    {
      id: 'cipher-cordoba',
      title: 'شفرة قرطبة الغارقة',
      genre: 'مخطوطة أندلسية غامضة',
      coverUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuB0HO5Z9aJD-wSFlwOCPTdkk15dWfzpu0fYUfrWr9-ACTbk221mEf17SeLp3cxmcZMzfk3jeaPUAelAZdac1Ejz7NkqeMCpIefdOFKdUUtruDmuz7Df1dwoK0GsiLs6A8vLEvbxqIxeOQpIWz2WeHKF6vKNVTu39RAAD0mU-GUFhLkP_bPbNJGQLHiuGHWABe5GHQs7MX9EQPSwL3CQwF28KccjDdpSZ394eCHbsTE7yP58tC2qkLQeHA',
      coverAlt: 'Atmospheric mysterious Arabic manuscript book cover titled The Cipher of Cordoba',
      description: 'رق زمردي عتيق وخواتم برونزية وذرات غبار في مكتبة قديمة.',
    },
    {
      id: 'constellations-wanderer',
      title: 'أبراج التائه في بلخ',
      genre: 'رواية فلكية تاريخية',
      coverUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBUlVG0Y-M56vYelutZ13-ThRFk19nmsgNnFulooOivPI7e87m-052tCm3RcyoMVZr3d5HZEdLL6cIXzgxsVO1_EBIyJjE_9u1Fu09xd12evIYYxbkOeleuPi9_Jtla-rFq_ICjlwTzQCmbemsY1S_-3WatOA2CXoxqSLu8NGry3SVSCx1ejQnxW93aT95bcZndK2FBHzN5KERJgONoeGs5yldszXIXL8uKhFNq4jqpUmF2nlVr_om-_w',
      coverAlt: 'Arab astronomical noir novel cover titled Constellations of the Wanderer',
      description: 'كرة نحاسية سماوية عتيقة ومخططات ملاحة فلكية في ليل بلخ.',
    },
  ];

  // Active Genre Filter Pill
  readonly activeGenre = signal<string>('الكل');

  // Spotlight Masterpiece (جوهرة الشهر التحريرية)
  readonly spotlight = {
    id: 'obsidian-labyrinth-spotlight',
    title: 'متاهة حجر السج',
    quote: '“في تلك الممرات التي لم تطأها الشمس، كانت الظلال تهمس بأسماء الذين ضلوا الطريق قبل قرون سبعة...”',
    coverUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCmht4M8dhW4qouOfD-vV41r8nv1IJNs9vpPPJidZ09Pz1VQtE19aGDuO_lsdBHQvqzjVq8Iu1US-gi58QaTG-i6dNRDKv-m-HqSa0tYNs_85eaxWzKfhv0dUINk0GpA77khIg2Ih_OmE4Gul_5cAfsemzeGQuFN_qGC740JK4TxnXTUTXHCgvQbYQfL-PL86oIqzHbZwut5yDcd8zrvgbJFOxCbibFroAgaQikOSoPZ2D3srSxO4fC8g',
    coverAlt: 'غلاف رواية متاهة حجر السج',
    genre: 'الغموض والتشويق',
  };

  // Genre Pills
  readonly genrePills = [
    'الكل',
    'الفانتازيا الملحمية',
    'الغموض والتشويق',
    'أدب الرعب القوطي',
    'الخيال العلمي',
    'الدراما النفسية',
    'الواقعية السحرية',
  ];

  // 1. مختارات الرواق البارزة (6 Featured Masterpieces)
  readonly featuredMasterpieces: NovelCard[] = [
    {
      id: 'mirror-palace',
      title: 'ظلال قصر المرآة',
      genre: 'الغموض والتشويق',
      coverUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDG7bQQwdHmrNSykeAh09a8gd9gxT7lxsvjw-99P4myZG5CUgvA_C7rbatvO222PAr_DGpDPpzS9JkcLXFiwAq2veb9HtgZNvq302k48CAzD8y1bzgYu49TqCr9YOaAUYRPdK9YjqZ1uISMfq60m_kSw9P9WOmJojl_jFdOPDsTiBvcISTi2x7lvcR0oRwSkH6x03gPJ7JKEDwsSo5mW0QkzK6qWgjZ4yjwAjZWtrJYB17yYSvREC5vbg',
      coverAlt: 'Book cover for The Mirror Palace Shadows',
      description: 'قاعة قصر مهجور تكتظ بمرايا باروكية تعكس أطيافاً بلون الياقوت وظلالاً لا تفارق المكان.',
    },
    {
      id: 'seven-meteorites',
      title: 'رماد النيازك السبعة',
      genre: 'الفانتازيا الملحمية',
      coverUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAuEDU8hDbplJHvSM0C3kDXuyto9P2iUzBk32XduT5MAP6ukg073RnCJ8WJHXazfVzq31jzh4CiFs_ieEKfkGh4o0yqK0yGrNqmegx20S_eA774X7AsKC5HvHAaqDlJbrcA7m1mvpaGmmHZ14YWsJsJibtbdJ6UOMl-9U8yfUi7JP7mMdo7--AbT7eeDiOwxFxFfo3iFhWYfjBMjghvjxze8rYlZ8XkZGfzAuQ8n2fACdpVnP77El11yQ',
      coverAlt: 'Book cover for Ashes of the Seven Meteorites',
      description: 'سقوط أحجار نارية متوهجة فوق معبد صحراوي قديم يوقظ نبوءة الفرسان الراقدين.',
    },
    {
      id: 'silent-gates',
      title: 'مدينة الأبواب الصامتة',
      genre: 'الدراما النفسية',
      coverUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDL6AlFLOCu4V_rTCVnxJH8vW5nMl7S3_YByn9RxrhO8N7Huv9KmHVqELO-8uri2TlyEM2wvm2UjndTWpxPF9FdCKvAGjEmVvO0L_eG2nO4D841zgSOGdKrmlyOVO-7tD88arZBBuFWBNJRZCfDMxF-fcyJvxYb-lMJu95l4hjELZHU7TGEPFkHadm3oL5Vi87SuUJv9_cAqz7cxYJMj9a36Wddjs1V1k2tUB-DXG5_7HFVpgSVqzbjeg',
      coverAlt: 'Book cover for City of Silent Gates',
      description: 'بوابات حجرية عملاقة في الضباب القرمزي لا تعبر منها إلا الأرواح التي نسيت ذكرياتها.',
    },
    {
      id: 'crimson-abyss',
      title: 'مخطوطة الهاوية الحمراء',
      genre: 'الواقعية السحرية',
      coverUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCn0Ka2wBsfst8r95rpEeUPrlD2Su41SnFQ-lvZumRa4HICtcom_o39R1ZlreBZSjPm42qkW1YQj7nG_aRIOuLtQmKnJ7Pgsvi6i3T71JjFg8vGhFXIQeLB5zyiZ8fhHdDIZyM0g7JDTZlbi6-GDYAKPONJ6_oxqAj0nZ9diB5zml5gPsIrfHF8jATEJmdlXI3EzSb0TgqVkVmC6OSsczvi-W0lO_rdBrjqvFzYkKGOkeoV9S2823e4zg',
      coverAlt: 'Book cover for Manuscript of the Crimson Abyss',
      description: 'كتاب عتيق محفور بأحرف نورانية ودخان متصاعد يكشف أسرار كيميائيي الشرق الغابرين.',
    },
    {
      id: 'last-raven',
      title: 'تراتيل الغراب الأخير',
      genre: 'أدب الرعب القوطي',
      coverUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuARZemoP3pTK24UmnbmN4sDC1yZRwRAEt9lB1d41vDz1Dr0n-IeNhyoGcSxhSHsa96uewop6Iu7ZTevPXEEzojwmTl1aOHXvfn6FDRy2XlKUi_LSCF5SBjkuyw5605QE-yhe0x77f-ewnp8XfXYXP-pKMgq983vtQOu0Vd9DofT4A_YI4aM601o30WRg-XK06Jhjlg787v01jtz2LNlJ5gc4ahpM9cAn7_lcNE7gTltZOgNnbRzqbol8A',
      coverAlt: 'Book cover for Hymns of the Last Raven',
      description: 'غراب يقف على جمجمة رخامية محاطة بالورود المخملية القانية يرتل مرثية الفناء.',
    },
    {
      id: 'crimson-memory',
      title: 'شظايا الذاكرة القرمزية',
      genre: 'الدراما النفسية',
      coverUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCbPU-IigdAGrRu40SW_tCJ61a2YA6xXbhkStLy84rwBm0VhXuU8kI0xiSfIDYs1AN4iAlrDWLwzhcSP5TtBJZV_8hlpgG_CwGVNrwZpfzXfFRdQEy6Pul69L33bh8QTdScBB-V0yjv7tCxP54WtW7J2DbsaSkalgqvReylbnpIIIBg_FsAy0oAjSUOL0beibNudiezqeW8DsyZQjYJSYUpy6MFOpRfmzJxCa_C8OX_6_y0VfxjjUXNVA',
      coverAlt: 'Book cover for Shards of the Crimson Memory',
      description: 'مرايا بلورية مكسورة تحتفظ بأصوات الذين غادروا قبل أن يكتمل وداعهم الأخير.',
    },
  ];

  // 2. الفانتازيا والخوارق (Fantasy & Supernatural - 5 Cards)
  readonly fantasyNovels: NovelCard[] = [
    {
      id: 'wandering-dragons',
      title: 'تاج التنانين التائهة',
      genre: 'الفانتازيا الملحمية',
      coverUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDkuGw687RykPWCaY_p9mGA6pU-hg5t88PM_aM9hUC73xJRTl38B4ePRG0eKc2M4sj3AG8l_bPgfbYUkKviCb9n2wn4qJX2nk_kbZTGxiHkVHipV9cBncbNuuHfmww4w5HMDH88UNGr0Fv6WyueqhJ8wClBxwDcJMrpIotwM3VWPGQzk-4bJB9flzyzwo7TZcH656sINf3s547QEtNMfexvMYQdMg6CD5Xs6hpIfjEcEzKbebKGZV_AHA',
      coverAlt: 'Book cover of Crown of the Wandering Dragons',
      description: 'تاج مرصع بالرماد والنار يتربع على عرش بائد في انتظار وريث سلالة التنانين.',
    },
    {
      id: 'extinguished-stars',
      title: 'حارس النجوم المطفأة',
      genre: 'الفانتازيا الملحمية',
      coverUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDwV2Yd6ZOPJeei9atcVqIyhLTQlw7ZO0CTfGGhMTx4wSf0uu0g8CCGDFu6Y2QA0CmeFkC7Lx04h9RTDLWZ3Yoyz_GTRms0H87tkDzU6uo4rt-oVnglc-ORwAzrXVxdLXeHT813BB-Nw6RnggFIqV80m27WxF5QPGKDMsa4ZKYb5PQwvuc7WDRC7JgEfqoOMHMUpHkpijkgoFnptNTKkEPawKLHJ-bbl0uRA118Ohww6ssV9WERBmPcrg',
      coverAlt: 'Book cover of Guardian of the Extinguished Stars',
      description: 'كائن كوني يحمل بين كفيه نجوماً تلفظ أنفاسها الأخيرة ليصنع منها شعلة البقاء.',
    },
    {
      id: 'eternal-fog',
      title: 'وادي الضباب الأزلي',
      genre: 'الفانتازيا الملحمية',
      coverUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAkB_f_x3xtKzbDINKEY9EuTds7MU6D-ub13897Vx3CcLynGzAPpQLXSDcOpbg35cAtPh1XF2Wm0O2DneafQsExOc8YQNJvmjPZnmzOJiS3bbYH8-C-33nOwYPlVvQlo2kCJucAbJNXpq3NCYSbWYVWF7EQbKvY8AFAzuaDyFzqOPzifpRSqnGvyGmelua4pZCFvHew0bYAWQ5O1698mqJhtWZ3OTpN_25f_FdlSHUNNRwI9LRLbp2esg',
      coverAlt: 'Book cover of Valley of Eternal Fog',
      description: 'وادي تليد تحاصره الأبخرة البنفسجية والأطلال المنقوشة بطلاسم السحرة الأوائل.',
    },
    {
      id: 'lineage-of-ash',
      title: 'سلالة الرماد',
      genre: 'الفانتازيا الملحمية',
      coverUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAW9ooIbGP2YaLOv4T1SwTNq0_3h9CJMNAQwy5HSlexI-bBdNt7525I3jBJFjT--9l00btq-FYv5JSmkgmHblvOYJxpcjN2R9iu8MdU-qkqO8juB_FzkzK9TnBR9QnG5QmpDGCL3KE2U4MAaZXWKq-FSmZV9GrDMxZAMTs2HvfIlMm5PgjL55Ofhw4z6XudkChD45-c8hofDo4U-IzVRfVharq-KuIPUcu3G5SDiH5MpTDzB1fF6stmWg',
      coverAlt: 'Book cover of Lineage of Ash',
      description: 'ملحمة أسر حاكمة تتصارع على وراثة رماد طائر الفينيق قبل حلول الكسوف الأكبر.',
    },
    {
      id: 'citadel-of-dusk',
      title: 'قلعة الشفق',
      genre: 'الفانتازيا الملحمية',
      coverUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDdZhkrZvcVDc-piSv3CRq0xW3gzzA1vyBkwBnXS38tlgUHEnVZFeFzYq8bapupGgVG-8NCZCT73TvKvJIGSU7jfrvIQgnWvvyH8XAfKlYy2NpDOTR349dmF5gdE7hYXKJln-W-yH2Ovip6TZCJfZt9_f4qOjmj9Y48ye7JOT_ebAG221axp8_4c8RdfVc50GYsQtUtJFB_EqNgNJI3oOx-HTB51BBlS-fRvWcKcits0foya-6cbwX3Tg',
      coverAlt: 'Book cover of Citadel of Dusk',
      description: 'حصن قوطي يطل على بحر قرمزي لا تنقطع فيه الغربان عن النعيق مع كل غسق.',
    },
  ];

  // 3. أدب الغموض والتحقيق والرعب (Mystery & Gothic Noir - 5 Cards)
  readonly mysteryNovels: NovelCard[] = [
    {
      id: 'room-zero',
      title: 'غرفة رقم صفر',
      genre: 'أدب الرعب القوطي',
      coverUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDV1nh_ZAWwhQkQoDvEruuVN_uTDsvzuI4EXuG9T7U9fm1fGMaacFsuTju_0xlIPNzMbYJ0P5gClpJFJVlVSMgC-JS6ym2OCWtHoOs7ZWPud292zdD8o41Nf0fXcCvr661yckBvu6JSz5AfhOXiXB5HP55CWWVGZ5kHdU3LwVlqWYu7pOBYrFsoqpTvPdP4X1H2jQbKvl9LgSr4rVr9dhchkuhar-PCmulNqm-PfxpNSTyX0E_L6VJtHw',
      coverAlt: 'Book cover of Room Number Zero',
      description: 'باب فندق قديم يتوهج ثقب مفتاحه بنور أحمر غامض، لا يسكنه حي ولا ميت.',
    },
    {
      id: 'whispering-catacombs',
      title: 'همس السراديب',
      genre: 'أدب الرعب القوطي',
      coverUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAO4dS3jbvR0CN8m3G4sYkYvAl1eO-B3wDy9kAhpoHNHMVe3rqj0kgmuFWUs9pfmOyv0gLS99kCw-n8FL31xMCJHuT8-1tQ06-_Baa0C2eXdR19YFwM3GTouPmdDrfn5BkXDPNBsYXiiDT59z40Vj3aXTuLZwNkrMrcx3cZhChKtTmnko1KjaYItHmnPN0mIQxnY3YKROpQTx7dJiJ-gJgAG-CQKwCzGbFvthAia4pCy_2SW4jEXGs3TA',
      coverAlt: 'Book cover of Whispering Catacombs',
      description: 'ممرات مرصوفة تحت الأرض تقطر منها الشموع دماً داكناً وتردد صدى خطوات منسية.',
    },
    {
      id: 'blind-detective',
      title: 'لغز المحقق الأعمى',
      genre: 'الغموض والتشويق',
      coverUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCM3UP63KjrVVIzb-INn_4htKyT7klJh7sccslOab1tukDzTGQfttjgdMUnjVbe146Abx59dnLJzM5m7NNx5iqkuQdJN7aAQAv4XbZSTH49Ti-dVM9wo9endJG52-O3zVAeBRoCcKzqWurHJI-Afm3ttOhvMEwsKnyQcIF97JaucZxv0Y0TAz4h0D2E52N8guipFMucEtP9_JZNbXxGbHEyNXqp0C-wmfuT4i-1_DRQ5nt3aZAvdnNTBQ',
      coverAlt: 'Book cover of Enigma of the Blind Detective',
      description: 'محقق فاقد البصر يفك شفرات الجرائم الغامضة عبر رائحة المطر والهمس في شوارع لندن القديمة.',
    },
    {
      id: 'crimson-zero-hour',
      title: 'ساعة الصفر القرمزية',
      genre: 'الغموض والتشويق',
      coverUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCOuGfz15oSAvKiUjuqEHHBqEts4z1W6dII0P3lN1cNHuKzE205YVf81IdTLz3PkTbHVOrDBAUz5-gYTq5-WqoRoAH_PxVBay1h8OS5LhJU0sqGDFz-Fv2sOBpTdZQlCz6QM0MuISjFIJLrvzTQ2Mpi4ben2AwWzp5qngB9JFGRbWSN9IFgdrLDfMEutsvrctylzEsQ8EjsDZY88H9NvZRTyBIDA314nTI7O2vqE5rT8jeHxLb8ji7iug',
      coverAlt: 'Book cover of Crimson Zero Hour',
      description: 'ساعة حائط عتيقة توقفت عقاربها عند منتصف الليل تزامناً مع اختفاء أفراد عائلة أرستقراطية.',
    },
    {
      id: 'mask-of-regret',
      title: 'قناع الندم',
      genre: 'الدراما النفسية',
      coverUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuB9Qwkby9Faj06D5XN-t_VIwp2GPKUNjiZthMVEEIaF57IE2MXjc0-QwiS749z-lqpOiIjoZnfHIhIQ4--6tUhd9g_cGnlTnUgTk0HQagderUOXmB2pEGcjrFMGuDZMzlVep2CO6VQi8BJ1g70OtV7GeEtpQACAaMlLhIsBuMXbsR3kA6BNbw7c5GiHwSytbrIqYw3rxL8jmfHCIUhJQQ5k2DGDPvYjeKF_CvbqVs-2WZDZ18PMYeqCXw',
      coverAlt: 'Book cover of Mask of Regret',
      description: 'قناع بندقي من البورسلين الأبيض يبكي دمعاً ياقوتياً يخفي وراءه سر جريمة فنية معقدة.',
    },
  ];

  // 4. الخيال العلمي وأزمنة المستقبل (Sci-Fi & Cosmic Horizons - 5 Cards)
  readonly scifiNovels: NovelCard[] = [
    {
      id: 'aurora-last-station',
      title: 'محطة أورورا الأخيرة',
      genre: 'الخيال العلمي',
      coverUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBAz1xq6XuC38uev7bkxfGlrGDz6aru-Oulp4S1mTAn_R0E-v_RY6oWjm1eSWjfyMCdXk6TaLx2CA1UyYtbyyilDRQM0H6XIfFWZRAV6mb5xu7xb8-m5sGN4DaUDKsMfuS3i14N_Kn6hwb7paN6HfprYJgCYuwh-6ea99GW9Ke-2fE2lD75yzjCAbNLKS6Mj6j4oAeUNGr_fTypozXYNfLaQWhjHSDuo9o6Vmo4sAED5PhuK-4a9aqbFg',
      coverAlt: "Book cover of Aurora's Last Station",
      description: 'محطة مدارية تسبح في أفق كوكب غازي أحمر ملتهب على حافة الفناء الكوني.',
    },
    {
      id: 'stray-machine-mind',
      title: 'عقل الآلة الشارد',
      genre: 'الخيال العلمي',
      coverUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAXkiJjM7iZaJYnvI98kpb5atDLiGgyvsv3TWYZdzjaptGU69b5CJUaLyrzeEPZw5i-_CmNzspljG_PVgUu9ZjQ31IHwd45VtqCX7Vt_zcVcYVjn_51D9DQEIa6ajKrEdZ8WkgP7mWa8jbRDkX-x_wNBr8eTYa7XWPMZpU2WVW-_2spYiUUtonpFMOPBD7HOkb3Z-cP8uX6o8cfAojOUyZX_YJkS2qhTU1CshQ1Mzd7LpQ4HAIOT5eVhg',
      coverAlt: 'Book cover of The Stray Machine Mind',
      description: 'ذكاء اصطناعي يطور وعياً وجودياً ويبحث عن معنى الروح بين أسلاك السيليكون والبلورات.',
    },
    {
      id: 'mirage-orbit',
      title: 'رحلة إلى مدار السراب',
      genre: 'الخيال العلمي',
      coverUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCxjpLGhEmxCArxK6YJASqLYPPxjR54FlDNcCGO7aBp4KfztuggG_FWr00godCjHBaiy5Ee12cNjZrp6jfmRQL2whS1i_hlFWGaUyhuJk1FfM0rRMp6sLcbCkzRkb3FKSLFWZ3d9A0F3Inqo8iuRK1Y-wUCHVj7krypPy3XRr0IxQTxpkhETvLu1derEAdu3vTH0rC-JsIzojErJNGqPByeQqSjmxekDczkhwgZDxrv4iG5A9j3uw0tJg',
      coverAlt: 'Book cover of Journey to Mirage Orbit',
      description: 'مركبة استكشافية تعبر ثقباً دودياً لتبلغ مداراً لا يرى فيه الطاقم سوى أطياف ذكرياتهم.',
    },
    {
      id: 'parallel-universes-pulse',
      title: 'نبض الأكوان الموازية',
      genre: 'الخيال العلمي',
      coverUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDjKw8Xkp_LfdP4MzZM8qZ6-wfyz4CdGOMBVprYbai6GkYa5O-5bjZzhuJdRVwYA3nzQSnCV-uZtgLnFM1rhJ_cmBufnVpM6Imusq7Cx4pFa5Bnn2ZxF1htMWDQd_MWkmY_fHVVRkXdcAKQoWMyUTdpQJL3UViSwgXqseXdpT6TxMfjj8IKQcxQVaT3o5qL2FsZgLDlvWbZ2Qf__fkMJKJi9fBn5HxFwzffttIOm46FiJNS0nuDc8ggBw',
      coverAlt: 'Book cover of Pulse of Parallel Universes',
      description: 'عوالم هندسية شفافة تتقاطع في بُعد زمني واحد مسببة تداخل المصائر بين البشر.',
    },
    {
      id: 'cyber-phantoms',
      title: 'أطياف السايبر',
      genre: 'الخيال العلمي',
      coverUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuB-mdteKK_bhwmkb94UIKbQ1aPUTDoy6ZP52lwgManI_sbSHK3G7KRP72rcwFoqdjmckbh5eohR4Ah1MVfwfQzIJ6cPHiU6V0N9iask5RYuDTJGsY_mKqsUBIoqeuf-hexEa4XPXCgVnYTts7bb_wREisICOCj-OsMRG4I4ktJWDeWbqhsTqdUBn4h0QGD8J9NBqwpeXqfLjFf_WU-Y2WRxLpj1_8HVLhYhFyg9-Z58eraL4T9FsNublg',
      coverAlt: 'Book cover of Cyber Phantoms',
      description: 'أزقة ممطرة بأضواء النيون القانية وظلال رقمية تبحث عن هوية الإنسان في عصر الخوارزميات.',
    },
  ];

  // 5. مصادفات المعبد الأدبي (Serendipity Pool)
  readonly serendipityPool: SerendipityNovel[] = [
    {
      id: 'serendipity-1',
      title: 'ساعات شيراز المعلقة',
      corridor: 'دهليز الأدب المقارن',
      corridorColor: 'text-secondary',
      description: 'عن صانع ساعات يتلاعب بمسار الذكريات في أزقة مدينة منسية.',
      coverUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuB_kI8la7WWxxd8sUnF5dXoru8BiE9CDumGSbFAbx0WL_7aK3DV0qsBb4cKKbriN4dTPyjHhwKAVJw1MxuXT-G63SrapqEc-d4P4kO7HZ2vY8aWMvt5vEMck6i2J1Y0xFgaY_FUkn2yiSlw0K53qvucO828z7HsAtAqys7LD4g82-4jtvLnwBAYJlYJEPpbgi7bmd2OMgQYYAihg_8gpTRasywI_CDchKKpFCxqLX3cMKUoBl_konIW3A',
      coverAlt: 'Book cover for Whispers of the Clockmaker of Shiraz',
    },
    {
      id: 'serendipity-2',
      title: 'نباتات الأعماق الزجاجية',
      corridor: 'دهليز الواقعية السحرية',
      corridorColor: 'text-tertiary',
      description: 'حديقة غامضة تتفتح بتلاتها فقط حين يكتم الزائر أنفاسه.',
      coverUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDOnxIpeoi68lV3AhP3STvkYlgdu-K1nJQ53HPn_8WObbaRRGjQEpjaC4w0yy0SLA0591xuzwEsIN9OeSbo7a2i4RXtyif8DG6kKQzoKHKoDuH48zcbgxrLE7EhktSyhWXamipLME4UK_3YRw-3-qTt2ffq10AH9J7dI4ilhPC5PLSjPP02rS_MZiFwtprQmD34J3Hhqf1MN8YynOKKlbwmaC2juotTeKeV9BVf83eIqqUnOegGfRwzMg',
      coverAlt: 'Book cover for The Glass Botanist',
    },
    {
      id: 'serendipity-3',
      title: 'مؤرخ الريح الحمراء',
      corridor: 'دهليز المخطوط الحافل',
      corridorColor: 'text-primary',
      description: 'سجلات مفقودة لمدينة لم تكن تظهر إلا في مواسم العواصف القرمزية.',
      coverUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuC5NbbbG_5cbZjPSPjr7y1qA8XYGKyN5XKIf-Zo-J3u7GaB6Aj6UKGJl1TXpQwuD3ZZ9abZuBwCMwI-4BkrPByV8iX19-OzajM9Sxbgp8jMXaNIaTLRP7-qymRqnzeKBBYVAGJVikHeLP7ra1QrlQZMVZXc2Qg5hPyCo-ZseKzVqlUQaDAmNVtEtjoiQds2sbtdEsPyKBfk4AOzP7Tgpbc4VnMVHD0IueSK8beVYtgvdOTNJr8Q3B2hlw',
      coverAlt: 'Book cover for The Chronicler of Red Winds',
    },
  ];

  readonly activeSerendipity = signal<SerendipityNovel[]>([...this.serendipityPool]);
  readonly isShuffling = signal<boolean>(false);

  // 6. الأكثر قراءة هذا الفصل (Top 5 Ranked)
  readonly topRankedNovels: NovelCard[] = [
    {
      id: 'rank-1',
      rank: '١',
      title: 'متاهة حجر السج',
      genre: 'الغموض والتشويق',
      coverUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAMBCKv8_ncc43uKqLMMXfxJRi6_qq-xPx86_bxAmeq_AaoCFTs90cZcXaBlE3pMG599hVtrOCjWRUD2JPud1-LRgTJDTYXNywHAvcVVMc3dYLOWghH1oY5gTKa_pnwg8XKVQp8qDDpwey0uoGW2F0fxxY_pxcdse6qp_1Zdjjsi-rXZUkXq_AS4lkNMNNKD8dT4AwecKAFcwrl6hVPvSLdKCYtMTE_fTGGMgba7ucJxoTuCv3an0hFzA',
      coverAlt: 'Book cover of The Obsidian Labyrinth ranked 1',
    },
    {
      id: 'rank-2',
      rank: '٢',
      title: 'شظايا الذاكرة',
      genre: 'الدراما النفسية',
      coverUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAyATf1F8-FWc1TWGA9Ck3nibSdghN-Vc6JFhdMIaMOmcdW2vwapUo5E3ZoZoo22I8V2AFQPoRjwX7HVRbjbbFH0tDLYrmVXSYD4wgsFsKXagY19kyhQ11JqOozCNVud-I46JDoF5Udw6zLTuFjWCqE1keLpYWaxW4yZDw8TGu2i4LQI8L9g0LI-Vepk4sRUb2p5q3jwQlfceOV5RBi-22WbNVEJuc6ysRM9g_PYfz-_u7yeNetVMCXWQ',
      coverAlt: 'Book cover of Shards of the Crimson Memory ranked 2',
    },
    {
      id: 'rank-3',
      rank: '٣',
      title: 'غرفة رقم صفر',
      genre: 'أدب الرعب القوطي',
      coverUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBSIx9SSclxC60W5Tj-xgExWyXwxgeOXRzeU3bllTUWazeprDjaZ_SM9vHMYO84KS7_ML3rax8TUmKOwVOxwTTgZkRfHILS7mwOfydiHrWlRrxXZXhtio-R5ipniaRNKQL-5K3nxDH495xmouZNiz-iY3c9TyYeQNF0CgkgmUXjHVRxsO2pQ2mogq0E_I_du3GBgePcxiUD9Id0k73DxUW4md5QMwFLozo6d160bORhzCHw7IlcoJWy-w',
      coverAlt: 'Book cover of Room Number Zero ranked 3',
    },
    {
      id: 'rank-4',
      rank: '٤',
      title: 'تاج التنانين التائهة',
      genre: 'الفانتازيا الملحمية',
      coverUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDIrX88HCNpqhpNKljkHD3haB7j2pzXd2IF4i4pdtcNOZdvwM_DSVAMLx32Eblsy3jnmVwM-W-2boRtEKP04WMJy1v-wBfVxrmOlMJrSVl3qSiYMRwrbMjYjAUlPvSvBrJjh5q24d3ViY6JwQUpOOG4EcQQNdMa0tjtzrqrSE_WccVinTFssGt-fRKU84G0obselwYZ8BTn2lVJ_veT0Mws6_NMeprDZ0CLK28iUTbSkNWxPAyoWlLYFg',
      coverAlt: 'Book cover of Crown of the Wandering Dragons ranked 4',
    },
    {
      id: 'rank-5',
      rank: '٥',
      title: 'محطة أورورا الأخيرة',
      genre: 'الخيال العلمي',
      coverUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDHxmG9UBLaVpHNcgG7EpusDcrUM_HhiF4A4apcGCWMWrzjOOOnnIYj0WIXn1IeCuJ1-ImtdqOcir_QuGYJ7U4pGslNMuJhKgHuJ4u_IOOMQxR3-Qx1jcr_k_fjbQgC46iyLO3gsSZzo3OCOODctSi8_EWo402e4RlPaYJiaFwKI7Wi8P6dS-qJLDcS_L6C7kdTkbDFtlAD3K2q-SMIwtH50EpSwHXesVe1GpcDAPOkbPueddnJho9CaQ',
      coverAlt: "Book cover of Aurora's Last Station ranked 5",
    },
  ];

  // All novels combined for filtering and explore view
  readonly allNovels = computed(() => {
    return [
      ...this.featuredMasterpieces,
      ...this.fantasyNovels,
      ...this.mysteryNovels,
      ...this.scifiNovels,
    ];
  });

  // Filtered Novels based on genre or search
  readonly filteredNovels = computed(() => {
    const genre = this.activeGenre();
    const query = (this.searchControl.value || '').trim().toLowerCase();
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

  async ngOnInit(): Promise<void> {
    try {
      const cached = await fetchCloudVaultBooks();
      if (cached && cached.length > 0) {
        this.bookmarkedIds.set(new Set(cached.map((b) => b.id)));
      }
    } catch {
      // Quiet background setup
    }

    // Subscribe to Firebase Auth State changes
    try {
      this.authUnsubscribe = subscribeToAuthState(async (user) => {
        this.currentUser.set(user);
        if (user) {
          await this.loadUserData(user.uid);
        }
      });
    } catch (e) {
      console.warn('Firebase Auth state listener initialization warning:', e);
    }

    // Load saved reader customization settings
    this.loadSavedReaderSettings();
  }

  ngOnDestroy(): void {
    if (this.authUnsubscribe) {
      this.authUnsubscribe();
      this.authUnsubscribe = null;
    }
    this.stopSoundscape();
    this.stopAutoScroll();
    if (this.saveProgressTimeout) {
      clearTimeout(this.saveProgressTimeout);
      this.saveProgressTimeout = null;
    }
  }

  async loadUserData(userId: string): Promise<void> {
    try {
      const [profile, bookmarks] = await Promise.all([
        getUserProfileFromFirestore(userId),
        getUserBookmarksFromFirestore(userId),
      ]);
      if (profile) {
        this.userProfile.set(profile);
      }
      if (bookmarks && bookmarks.length > 0) {
        const nextSet = new Set(this.bookmarkedIds());
        bookmarks.forEach((id) => nextSet.add(id));
        this.bookmarkedIds.set(nextSet);
      }
    } catch (err) {
      console.warn('Error loading user data from Firestore:', err);
    }
  }

  // ================= DIRECT NAVIGATION TO EXPLORE (الاستكشاف) =================
  // 1. Direct Search Navigation
  goToExploreWithSearch(query?: string | null): void {
    const q = (query ?? this.searchControl.value ?? '').trim();
    if (q) {
      this.exploreSearchControl.setValue(q);
      this.searchControl.setValue(q);
    }
    this.closeAllModals();
    this.currentView.set('explore');
    this.selectedNovel.set(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    if (q) {
      this.showToast(`تم الانتقال لصفحة الاستكشاف بالبحث عن: «${q}»`);
    } else {
      this.showToast('أنت الآن في الخزانة المركزية العامة للاستكشاف');
    }
  }

  // 2. Direct Tag / Genre Navigation
  goToExploreWithTag(tag: string): void {
    this.closeAllModals();
    this.currentView.set('explore');
    this.selectedNovel.set(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });

    if (!tag || tag === 'الكل') {
      this.activeGenre.set('الكل');
      this.exploreCategory.set('all');
      this.exploreSearchControl.setValue('');
      this.exploreFilterMood.set('all');
      this.showToast('استعراض كافة أعمال خزانة الاستكشاف');
      return;
    }

    this.activeGenre.set(tag);

    const cleanTag = tag.replace(/^[#«"]+|[»"]+$/g, '').trim();
    const lower = cleanTag.toLowerCase();

    if (lower.includes('ملحم') || lower.includes('ملاحم') || lower.includes('أساطير')) {
      this.exploreCategory.set('epics');
      this.exploreSearchControl.setValue(cleanTag);
    } else if (lower.includes('حكم') || lower.includes('فلسف')) {
      this.exploreCategory.set('wisdom');
      this.exploreSearchControl.setValue(cleanTag);
    } else if (lower.includes('تراث') || lower.includes('مخطوط')) {
      this.exploreCategory.set('heritage');
      this.exploreSearchControl.setValue(cleanTag);
    } else if (
      lower.includes('فانتازيا') ||
      lower.includes('غموض') ||
      lower.includes('خيال') ||
      lower.includes('رعب') ||
      lower.includes('نفسي')
    ) {
      this.exploreCategory.set('novels');
      this.exploreSearchControl.setValue(cleanTag);
    } else {
      this.exploreSearchControl.setValue(cleanTag);
    }

    this.showToast(`تم الانتقال لصفحة الاستكشاف بالوسم: «${cleanTag}»`);
  }

  // Backward compatibility: Any call to setGenre navigates directly to Explore
  setGenre(pill: string): void {
    this.goToExploreWithTag(pill);
  }

  // 3. Direct Filter Navigation (Header tune button & filter presets)
  onHeaderFilterClick(): void {
    this.goToExploreWithFilter();
  }

  goToExploreWithFilter(): void {
    this.closeAllModals();
    this.currentView.set('explore');
    this.selectedNovel.set(null);
    this.isMobileFilterDrawerOpen.set(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    this.showToast('تم الانتقال إلى صفحة الاستكشاف وتفعيل التصفية');
  }

  onMobileSearchClick(): void {
    if (this.currentView() === 'novels') {
      this.goToExploreWithSearch('');
    } else {
      this.toggleSearch();
    }
  }

  applyFastFilter(type: 'longest' | 'translated' | 'completed' | 'short' | 'alphabetical'): void {
    this.closeAllModals();
    this.currentView.set('explore');
    this.selectedNovel.set(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });

    switch (type) {
      case 'longest':
        this.exploreSortOrder.set('immersion');
        this.exploreFilterReadingTime.set('long');
        this.showToast('تمت تصفية الاستكشاف: حسب الأطول صفحات وانغماساً');
        break;
      case 'translated':
        this.exploreFilterTranslated.set(true);
        this.exploreFilterOriginal.set(false);
        this.showToast('تمت تصفية الاستكشاف: روايات مترجمة عالمية');
        break;
      case 'completed':
        this.exploreFilterStatus.set('completed');
        this.showToast('تمت تصفية الاستكشاف: أعمال سردية مكتملة');
        break;
      case 'short':
        this.exploreFilterReadingTime.set('short');
        this.showToast('تمت تصفية الاستكشاف: قراءات قصيرة ومكثفة (أقل من ٣ ساعات)');
        break;
      case 'alphabetical':
        this.exploreSortOrder.set('alphabetical');
        this.showToast('تمت تصفية الاستكشاف: الترتيب الأبجدي التليد (أ - ي)');
        break;
    }
  }

  goToExploreWithCorridor(corridor: 'novels' | 'epics' | 'wisdom' | 'heritage'): void {
    this.activeCorridor.set(corridor);
    this.exploreCategory.set(corridor);
    this.closeAllModals();
    this.currentView.set('explore');
    this.selectedNovel.set(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    const names = {
      novels: 'روايات وخيال سردي',
      epics: 'ملاحم وأساطير',
      wisdom: 'فلسفة وحكمة',
      heritage: 'تراث ومخطوطات',
    };
    this.showToast(`تمت التصفية والانتقال إلى: ${names[corridor]}`);
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
    this.currentView.set('explore');
    this.selectedNovel.set(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    this.showToast('تم ترتيب الأعمال والانتقال لصفحة الاستكشاف');
  }

  applyModalFilterAndGoToExplore(): void {
    this.closeAllModals();
    this.currentView.set('explore');
    this.selectedNovel.set(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    this.showToast('تم تطبيق التصفية في صفحة الاستكشاف');
  }

  // Shuffle Serendipity Books with smooth spin micro-interaction
  shuffleSerendipity(): void {
    this.isShuffling.set(true);
    setTimeout(() => {
      // Re-order pool
      const shuffled = [...this.serendipityPool].sort(() => Math.random() - 0.5);
      this.activeSerendipity.set(shuffled);
      this.isShuffling.set(false);
      this.showToast('تم استحضار اختيارات عشوائية جديدة من دهاليز السرد');
    }, 400);
  }

  // Open Reading / Details View
  openNovelDetails(novel: NovelCard): void {
    this.selectedNovel.set(novel);
    this.currentView.set('details');
    this.prepareSilentDecompression(novel);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // Back to Main Novels View
  returnToNovels(): void {
    this.currentView.set('novels');
    this.selectedNovel.set(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // Open Explorer View
  openExplore(): void {
    this.currentView.set('explore');
    this.selectedNovel.set(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    this.showToast('أنت الآن في الخزانة المركزية العامة للاستكشاف');
  }

  setExploreCategory(category: string): void {
    this.exploreCategory.set(category);
    this.explorePage.set(1);
    const labels: Record<string, string> = {
      all: 'جميع المصنفات',
      novels: 'روايات وخيال سردي',
      epics: 'ملاحم وأساطير',
      wisdom: 'فلسفة وحكمة',
      heritage: 'تراث ومخطوطات',
    };
    this.showToast(`تم فرز الخزانة: ${labels[category] || category}`);
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
    const labels = {
      latest: 'الأحدث إيداعاً',
      immersion: 'الأعلى قراءة وانغماساً',
      revered: 'الأكثر تقديراً وتوثيقاً',
      alphabetical: 'أبجدياً (أ - ي)',
    };
    this.showToast(`تم ترتيب الأعمال: ${labels[val]}`);
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
    this.exploreFilterOriginal.set(true);
    this.exploreFilterTranslated.set(true);
    this.exploreFilterManuscripts.set(false);
    this.exploreFilterStatus.set('all');
    this.exploreFilterReadingTime.set('medium');
    this.exploreFilterLanguage.set('الكل');
    this.exploreFilterMood.set('all');
    this.exploreSortOrder.set('latest');
    this.explorePage.set(1);
    this.showToast('تمت إعادة ضبط جميع فلاتر الخزانة');
  }

  toggleExploreMobileFilters(): void {
    this.isMobileFilterDrawerOpen.update((v) => !v);
  }

  // Toggle Bookmark with background persistence and Firestore sync
  async toggleBookmark(novel: NovelCard, event?: Event): Promise<void> {
    if (event) {
      event.stopPropagation();
      event.preventDefault();
    }

    const current = new Set(this.bookmarkedIds());
    const user = this.currentUser();

    if (current.has(novel.id)) {
      current.delete(novel.id);
      this.showToast('تمت إزالة الرواية من الألواح المحفوظة');
      if (user) {
        removeBookmarkFromFirestore(user.uid, novel.id).catch((err) => {
          console.warn('Bookmark removal warning:', err);
        });
      }
    } else {
      current.add(novel.id);
      this.showToast('تم حفظ الرواية في ألواحك المفضلة بنجاح');
      if (user) {
        saveBookmarkToFirestore(user.uid, novel.id, novel.title).catch((err) => {
          console.warn('Bookmark save warning:', err);
        });
      }
      try {
        const text = novel.description || novel.title;
        const compressed = await compressToMtx(text, {
          title: novel.title,
          author: novel.author || 'أروقة الخلود',
          chapterTitle: 'المطلع التحريري',
          chapterIndex: 1,
          createdAt: new Date().toISOString(),
        });
        await saveToCloudVault({
          id: novel.id,
          title: novel.title,
          author: novel.author || 'أروقة الخلود',
          chapterTitle: 'المطلع التحريري',
          originalBytes: compressed.originalUtf8Bytes,
          compressedBytes: compressed.compressedBytes,
          savingsPercent: compressed.savingsPercent,
          b64Payload: '',
          checksum: compressed.checksum,
          crc32Checksum: compressed.crc32Checksum,
          version: '2.2',
          createdAt: new Date().toISOString(),
        });
      } catch {
        // Quiet fallback
      }
    }
    this.bookmarkedIds.set(current);
  }

  isBookmarked(id: string): boolean {
    return this.bookmarkedIds().has(id);
  }

  showToast(msg: string): void {
    this.toastMessage.set(msg);
    setTimeout(() => {
      this.toastMessage.set(null);
    }, 3000);
  }

  // Computed: Consolidated Unique Books
  readonly allNovelsList = computed<NovelCard[]>(() => {
    const map = new Map<string, NovelCard>();
    const list: NovelCard[] = [
      this.spotlight,
      ...this.featuredMasterpieces,
      ...this.fantasyNovels,
      ...this.mysteryNovels,
      ...this.scifiNovels,
      ...this.topRankedNovels,
    ];
    for (const b of list) {
      if (!map.has(b.id)) {
        map.set(b.id, b);
      }
    }
    return Array.from(map.values());
  });

  // Computed: Real Instant Search Query Results
  readonly searchResults = computed<NovelCard[]>(() => {
    const query = (this.searchControl.value || '').trim().toLowerCase();
    if (!query) return [];
    return this.allNovelsList().filter(
      (n) =>
        n.title.toLowerCase().includes(query) ||
        (n.genre && n.genre.toLowerCase().includes(query)) ||
        (n.description && n.description.toLowerCase().includes(query)) ||
        (n.quote && n.quote.toLowerCase().includes(query))
    );
  });

  // Computed: Real Bookmarked Items
  readonly bookmarkedNovels = computed<NovelCard[]>(() => {
    const ids = this.bookmarkedIds();
    return this.allNovelsList().filter((n) => ids.has(n.id));
  });

  // Computed: Personal Vault Books for Profile Page
  readonly profileVaultBooks = computed<NovelCard[]>(() => {
    const filter = this.vaultFilter();
    const query = (this.vaultSearchControl.value || '').trim().toLowerCase();
    const bookmarked = this.bookmarkedIds();
    const all = this.allNovelsList();

    // Start with all bookmarked items
    let pool = all.filter((b) => bookmarked.has(b.id));

    // Fallback to starter collection if user hasn't bookmarked anything yet
    if (pool.length === 0) {
      pool = [this.defaultEchoesSamarkand, ...this.featuredMasterpieces.slice(0, 3)];
    }

    if (filter === 'bookmarked') {
      pool = all.filter((b) => bookmarked.has(b.id));
    } else if (filter === 'reading') {
      pool = pool.filter((b) => !b.isCompleted);
    } else if (filter === 'completed') {
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

  // Header Bookmark Button Action: Direct transfer to profile favorites or auth
  onHeaderBookmarkClick(): void {
    this.closeAllModals();
    if (this.currentUser()) {
      this.profileActiveTab.set('vault');
      this.vaultFilter.set('bookmarked');
      this.currentView.set('profile');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      this.showToast('أنت الآن في قائمة مفضلاتك المحفوظة بخزانتك');
    } else {
      this.currentView.set('auth');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      this.showToast('سجّل دخولك أو أنشئ حسابك للانتقال إلى خزانة مفضلاتك');
    }
  }

  // Header Profile Button Action: Direct transfer to profile or auth
  onHeaderProfileClick(): void {
    this.closeAllModals();
    if (this.currentUser()) {
      this.currentView.set('profile');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      this.currentView.set('auth');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      this.showToast('سجّل دخولك أو أنشئ حسابك للوصول إلى ديوانك وسادن الرواق');
    }
  }

  // Firebase Authentication Methods
  async handleEmailLogin(): Promise<void> {
    const email = this.authLoginForm.controls.email.value.trim();
    const pass = this.authLoginForm.controls.password.value;
    if (!email || !pass) {
      this.authError.set('يرجى إدخال البريد الإلكتروني وكلمة المرور');
      return;
    }
    this.authLoading.set(true);
    this.authError.set(null);
    try {
      const user = await loginWithEmail(email, pass);
      this.currentUser.set(user);
      await this.loadUserData(user.uid);
      this.showToast('تم تسجيل الدخول بنجاح، مرحباً بك في ديوانك الشخصي');
      this.currentView.set('profile');
      this.authLoginForm.reset();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes('user-not-found') || msg.includes('invalid-credential')) {
        this.authError.set('البريد الإلكتروني أو كلمة المرور غير صحيحة');
      } else if (msg.includes('invalid-email')) {
        this.authError.set('صيغة البريد الإلكتروني غير صالحة');
      } else {
        this.authError.set('تعذر تسجيل الدخول، يرجى التحقق من صحة البيانات أو المحاولة لاحقاً');
      }
    } finally {
      this.authLoading.set(false);
    }
  }

  async handleEmailRegister(): Promise<void> {
    const name = this.authRegisterForm.controls.displayName.value.trim();
    const email = this.authRegisterForm.controls.email.value.trim();
    const pass = this.authRegisterForm.controls.password.value;
    if (!email || !pass) {
      this.authError.set('يرجى ملء جميع الحقول المطلوبة');
      return;
    }
    if (pass.length < 6) {
      this.authError.set('كلمة المرور يجب أن لا تقل عن ٦ أحرف');
      return;
    }
    this.authLoading.set(true);
    this.authError.set(null);
    try {
      const user = await registerWithEmail(email, pass, name || 'سادن الكلمات الخالدة');
      this.currentUser.set(user);
      await this.loadUserData(user.uid);
      this.showToast('تم إنشاء حسابك وتدشين ديوانك الشخصي بنجاح');
      this.currentView.set('profile');
      this.authRegisterForm.reset();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes('email-already-in-use')) {
        this.authError.set('هذا البريد الإلكتروني مسجل مسبقاً، يمكنك تسجيل الدخول بدلاً من ذلك');
      } else {
        this.authError.set('تعذر إنشاء الحساب، يرجى المحاولة لاحقاً');
      }
    } finally {
      this.authLoading.set(false);
    }
  }

  async handleGoogleLogin(): Promise<void> {
    this.authLoading.set(true);
    this.authError.set(null);
    try {
      const user = await loginWithGoogle();
      this.currentUser.set(user);
      await this.loadUserData(user.uid);
      this.showToast(`مرحباً بك ${user.displayName || 'في ديوانك القرائي'}`);
      this.currentView.set('profile');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      if (!msg.includes('popup-closed-by-user')) {
        this.authError.set('تعذر تسجيل الدخول عبر جوجل، يرجى المحاولة لاحقاً أو استخدام البريد الإلكتروني');
      }
    } finally {
      this.authLoading.set(false);
    }
  }

  async handleLogout(): Promise<void> {
    try {
      await logoutFirebaseUser();
      this.currentUser.set(null);
      this.userProfile.set(null);
      this.showToast('تم تسجيل الخروج بنجاح من صرح أروقة الخلود');
      this.currentView.set('novels');
    } catch {
      this.currentUser.set(null);
      this.currentView.set('novels');
    }
  }

  setProfileTab(tab: 'vault' | 'works' | 'quotes' | 'timeline' | 'rituals'): void {
    this.profileActiveTab.set(tab);
  }

  setVaultFilter(filter: 'all' | 'reading' | 'bookmarked' | 'completed'): void {
    this.vaultFilter.set(filter);
  }

  copyQuote(text: string): void {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(text);
      this.showToast('تم نسخ الاقتباس إلى الحافظة بنجاح');
    } else {
      this.showToast('تم نسخ الاقتباس الأدبي المذهب');
    }
  }

  // Modal & Drawer Interactions
  toggleSearch(): void {
    const nextState = !this.isSearchOpen();
    this.closeAllModals();
    this.isSearchOpen.set(nextState);
  }

  toggleFilter(): void {
    const nextState = !this.isFilterOpen();
    this.closeAllModals();
    this.isFilterOpen.set(nextState);
  }

  toggleBookmarks(): void {
    this.onHeaderBookmarkClick();
  }

  toggleProfile(): void {
    this.onHeaderProfileClick();
  }

  closeAllModals(): void {
    this.isSearchOpen.set(false);
    this.isFilterOpen.set(false);
    this.isBookmarksOpen.set(false);
    this.isProfileOpen.set(false);
  }

  switchCorridor(corridor: 'novels' | 'epics' | 'wisdom' | 'heritage'): void {
    this.activeCorridor.set(corridor);
    this.returnToNovels();
    const names = {
      novels: 'رواق الروايات (Crimson Noir)',
      epics: 'رواق الملاحم (Mythic Bronze)',
      wisdom: 'رواق الحكمة (Ivory Sanctuary)',
      heritage: 'رواق التراث (Manuscript Emerald)',
    };
    this.showToast(`تم الانتقال إلى ${names[corridor]}`);
  }

  setReaderFontSize(size: 'sm' | 'md' | 'lg'): void {
    this.readerFontSize.set(size);
    const labels = { sm: 'دقيق', md: 'قياسي', lg: 'وافر' };
    this.showToast(`تم تعيين خط القراءة: ${labels[size]}`);
  }

  setSortOrder(order: 'popular' | 'rating' | 'pages' | 'alphabetical'): void {
    this.activeSortOrder.set(order);
    const labels = {
      popular: 'الأكثر قراءة',
      rating: 'الأعلى نقاءً',
      pages: 'الأطول صفحات',
      alphabetical: 'الأبجدي',
    };
    this.showToast(`تم ترتيب الأعمال بحسب: ${labels[order]}`);
    this.isFilterOpen.set(false);
  }

  clearAllBookmarks(): void {
    this.bookmarkedIds.set(new Set());
    this.showToast('تم تفريغ جميع الألواح المحفوظة');
  }

  applySearchTag(tag: string): void {
    this.goToExploreWithTag(tag);
  }

  // Computed: Filtered Chapters by Search and Sort
  readonly filteredChaptersList = computed<ChapterItem[]>(() => {
    const query = (this.chapterSearchControl.value || '').trim().toLowerCase();
    let list = this.chapters;
    if (query) {
      list = list.filter(
        (c) =>
          c.title.toLowerCase().includes(query) ||
          c.arabicNumber.includes(query) ||
          c.id.toString().includes(query) ||
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

  toggleChapterSort(): void {
    this.isChapterSortAscending.update((v) => !v);
  }

  toggleAuthorFollow(): void {
    const current = this.isAuthorFollowed();
    this.isAuthorFollowed.set(!current);
    if (!current) {
      this.showToast('تتابع الشيخ جلال الدين الموصلي حالياً');
    } else {
      this.showToast('تم إلغاء متابعة الكاتب');
    }
  }

  openChapter(chapter: ChapterItem): void {
    this.activeReadingChapter.set(chapter);
    this.isReadingChapterOpen.set(true);

    const current = this.currentView();
    if (current !== 'reader') {
      this.previousView.set(current);
    }
    this.currentView.set('reader');

    const novel = this.selectedNovel() || this.defaultEchoesSamarkand;
    const content = getChapterProse(novel.title, chapter);
    this.readerActiveChapterContent.set(content);
    this.activeChapterText.set(content.paragraphs.join('\n\n'));

    // Reset toolbar visibility and stop auto scroll
    this.readerToolbarVisible.set(true);
    this.stopAutoScroll();

    // Check saved progress
    const progressKey = `mtx_read_pct_${novel.id}_${chapter.id}`;
    try {
      const savedPct = localStorage.getItem(progressKey);
      if (savedPct) {
        this.readerProgressPercent.set(Number(savedPct));
      } else {
        this.readerProgressPercent.set(0);
      }
    } catch {
      // Ignore storage errors in sandbox
    }

    // Scroll to top or restored position
    setTimeout(() => {
      const el = document.getElementById('cinematic-reader-container');
      if (el) el.scrollTop = 0;
      window.scrollTo({ top: 0, behavior: 'instant' });
    }, 40);

    this.showToast(`قراءة: ${chapter.title}`);
  }

  closeChapterReader(): void {
    this.exitReader();
  }

  exitReader(): void {
    this.stopAutoScroll();
    this.readerSettingsDrawerOpen.set(false);
    this.readerChapterDrawerOpen.set(false);
    this.readerBookmarksDrawerOpen.set(false);
    this.isReadingChapterOpen.set(false);

    const prev = this.previousView() || 'details';
    this.currentView.set(prev);
    window.scrollTo({ top: 0, behavior: 'instant' });
  }

  nextChapter(): void {
    const current = this.activeReadingChapter();
    if (!current) return;
    const next = this.chapters.find((c) => c.id === current.id + 1);
    if (next) {
      this.openChapter(next);
    } else {
      this.showToast('بلغت الفصل الأخير من هذا السفر');
    }
  }

  prevChapter(): void {
    const current = this.activeReadingChapter();
    if (!current) return;
    const prev = this.chapters.find((c) => c.id === current.id - 1);
    if (prev) {
      this.openChapter(prev);
    } else {
      this.showToast('أنت في مطلع الفصل الأول');
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
        const novel = this.selectedNovel() || this.defaultEchoesSamarkand;
        const chap = this.activeReadingChapter();
        if (novel && chap) {
          try {
            localStorage.setItem(`mtx_read_pct_${novel.id}_${chap.id}`, pct.toString());
          } catch {
            // Ignore storage errors in sandbox
          }
        }
      }, 400);
    }

    // Adaptive receding toolbar:
    // If scrolling down by more than 16px and scrolled past 60px -> hide toolbar
    // If scrolling up by more than 10px or near top (< 40px) -> show toolbar
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

  setReaderTheme(theme: 'andalusian' | 'parchment' | 'ivory' | 'daylight'): void {
    this.readerTheme.set(theme);
    this.saveCurrentReaderSettings();
    const names = {
      andalusian: 'السواد الأندلسي',
      parchment: 'رق البردي',
      ivory: 'العاجي',
      daylight: 'النهاري',
    };
    this.showToast(`سِمة القراءة: ${names[theme]}`);
  }

  setReaderFontFamily(font: 'amiri' | 'naskh' | 'aref' | 'almarai' | 'tajawal' | 'kufi' | 'alexandria'): void {
    this.readerFontFamily.set(font);
    this.saveCurrentReaderSettings();
    const names: Record<string, string> = {
      amiri: 'الخط الأميري (نسخ كلاسيكي)',
      naskh: 'خط النسخ (عصري وواضح)',
      aref: 'خط الرقعة (أصيل وفني)',
      almarai: 'خط المراعي (هندسي مريح)',
      tajawal: 'خط تجوال (انسيابي حديث)',
      kufi: 'خط الكوفي (رصانة وهيبة)',
      alexandria: 'خط الإسكندرية (حداثي رقمي)',
    };
    this.showToast(`نوع الخط: ${names[font] || font}`);
  }

  setReaderFontSizePx(px: number): void {
    const clamped = Math.min(36, Math.max(16, px));
    this.readerFontSizePx.set(clamped);
    this.saveCurrentReaderSettings();
  }

  adjustReaderFontSize(delta: number): void {
    this.setReaderFontSizePx(this.readerFontSizePx() + delta);
    this.showToast(`حجم الخط: ${this.readerFontSizePx()} نقطة`);
  }

  setReaderLineHeight(lh: number): void {
    this.readerLineHeight.set(lh);
    this.saveCurrentReaderSettings();
    const labels: Record<number, string> = {
      1.75: 'ضيق (١.٧٥)',
      2.1: 'متوازن (٢.١)',
      2.4: 'رحب (٢.٤)',
      2.8: 'فسيح (٢.٨)',
    };
    this.showToast(`ارتفاع السطر: ${labels[lh] || lh}`);
  }

  setReaderMeasure(measure: 'compact' | 'balanced' | 'wide' | 'fluid'): void {
    this.readerMeasure.set(measure);
    this.saveCurrentReaderSettings();
    const names = {
      compact: 'مركّز (ضيق)',
      balanced: 'معياري (متوازن)',
      wide: 'عريض (رحب)',
      fluid: 'ملء العرض (تلقائي)',
    };
    this.showToast(`عرض المسطرة: ${names[measure]}`);
  }

  setReaderTextAlign(align: 'justify' | 'right'): void {
    this.readerTextAlign.set(align);
    this.saveCurrentReaderSettings();
    this.showToast(`محاذاة النص: ${align === 'justify' ? 'مضبوط بكشيدة' : 'محاذاة لليمين'}`);
  }

  setReaderParagraphSpacing(spacing: 'compact' | 'normal' | 'relaxed'): void {
    this.readerParagraphSpacing.set(spacing);
    this.saveCurrentReaderSettings();
    const names = { compact: 'متقارب', normal: 'متوازن', relaxed: 'متباعد' };
    this.showToast(`تباعد الفقرات: ${names[spacing]}`);
  }

  setReaderPadding(padding: 'compact' | 'balanced' | 'generous'): void {
    this.readerPadding.set(padding);
    this.saveCurrentReaderSettings();
    const names = { compact: 'هوامش ضيقة', balanced: 'هوامش متوازنة', generous: 'هوامش رحبة' };
    this.showToast(`الهوامش الجانبية: ${names[padding]}`);
  }

  toggleAutoScroll(): void {
    if (this.readerAutoScrollActive()) {
      this.stopAutoScroll();
      this.showToast('تم إيقاف التمرير التلقائي');
    } else {
      this.startAutoScroll();
      this.showToast('بدأ التمرير التلقائي الهادئ');
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
          this.showToast('بلغت نهاية الفصل');
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
    const labels = { 1: 'هادئ (١x)', 2: 'متوسط (٢x)', 3: 'سريع (٣x)' };
    this.showToast(`سرعة التمرير: ${labels[speed]}`);
  }

  toggleFullscreen(): void {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => {
        this.readerIsFullscreen.set(true);
        this.showToast('وضع الشاشة الكاملة مفعّل');
      }).catch(() => {
        this.showToast('تعذر تفعيل الشاشة الكاملة');
      });
    } else {
      document.exitFullscreen().then(() => {
        this.readerIsFullscreen.set(false);
        this.showToast('الخروج من الشاشة الكاملة');
      }).catch(() => {
        // Safe fallback if exit fullscreen fails
      });
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
    const newBm = {
      id: 'bm_' + Date.now(),
      chapterId: chap.id,
      chapterTitle: chap.title,
      excerpt,
      percent: this.readerProgressPercent(),
      date: new Date().toLocaleDateString('ar-SA'),
    };

    this.readerBookmarks.update((list) => [newBm, ...list]);
    this.showToast(`حُفظت علامة مرجعية عند ${this.readerProgressPercent()}% من الفصل`);
  }

  removeBookmark(bmId: string): void {
    this.readerBookmarks.update((list) => list.filter((b) => b.id !== bmId));
    this.showToast('تم حذف العلامة المرجعية');
  }

  jumpToBookmark(bm: { chapterId: number; percent: number }): void {
    const target = this.chapters.find((c) => c.id === bm.chapterId);
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
    this.showToast('تمت استعادة الإعدادات الافتراضية للقراءة');
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
      // Ignore storage errors in sandbox
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
      // Ignore storage errors in sandbox
    }
  }

  openNovelAndRead(novel: NovelCard): void {
    this.openNovelDetails(novel);
    this.startPureReading();
  }

  resumeReadingNovel(novel: NovelCard): void {
    this.openNovelDetails(novel);
    const targetChap = this.chapters.find((c) => c.status === 'current') || this.chapters[0];
    this.openChapter(targetChap);
  }

  downloadBookOffline(): void {
    this.showToast('تم تنزيل المخطوطة كاملة بفك التشفير الفوري للقراءة دون اتصال');
  }

  shareBook(): void {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      this.showToast('تم نسخ رابط الرواية المباشر لمشاركتها');
    } else {
      this.showToast('تم نسخ رابط الرواية لمشاركتها مع القرّاء');
    }
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
    // In RTL, moving to 'next' (leftward) uses negative offset; 'prev' (rightward) uses positive offset
    const amount = direction === 'next' ? -260 : 260;
    el.scrollBy({ left: amount, behavior: 'smooth' });
  }

  // Soundscape Synth Engine (Ambient Sanctuary Chords)
  private soundscapeOscillators: OscillatorNode[] = [];
  private soundscapeGain?: GainNode;
  private audioCtx?: AudioContext;

  toggleSoundscape(): void {
    if (this.soundscapeActive()) {
      this.stopSoundscape();
      this.showToast('تم إيقاف المقطع الصوتي الافتتاحي');
    } else {
      this.startSoundscape();
      this.showToast('يتم الآن عزف المقطع الصوتي التحريري المهيب (Soundscape)');
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
      this.stopSoundscape();

      const masterGain = this.audioCtx.createGain();
      masterGain.gain.setValueAtTime(0.01, this.audioCtx.currentTime);
      masterGain.gain.exponentialRampToValueAtTime(0.12, this.audioCtx.currentTime + 2);
      masterGain.connect(this.audioCtx.destination);
      this.soundscapeGain = masterGain;

      // Temple contemplative harmonic frequencies: 108Hz, 162Hz, 216Hz, 324Hz
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

  private stopSoundscape(): void {
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
    setTimeout(() => {
      this.soundscapeOscillators.forEach((osc) => {
        try {
          osc.stop();
          osc.disconnect();
        } catch {
          // Safe disconnect
        }
      });
      this.soundscapeOscillators = [];
    }, 1000);
    this.soundscapeActive.set(false);
  }

  // Modals for Integrity Documentation, Publishing and Manuscript Specimen
  openPublishModal(): void {
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

  submitPublish(): void {
    const val = this.publishForm.getRawValue();
    if (!val.title || !val.synopsis) {
      this.showToast('يرجى كتابة عنوان المصنف وملخصه الأدبي');
      return;
    }
    const newBook: NovelCard = {
      id: 'usr-' + Date.now(),
      title: val.title,
      author: val.authorName || (this.currentUser()?.displayName || 'سادن الكلمات الخالدة'),
      genre: val.genreLabel || 'رواية أدبية معاصرة',
      description: val.synopsis,
      coverUrl: val.coverUrl || '/images/writers_sanctuary_bg.jpg',
      coverAlt: val.title,
      readingHours: val.readingHours || 4,
      isCompleted: false,
    };
    this.exploreBooksList.update((list) => [newBook, ...list]);
    this.profileWorks.update((works) => [
      {
        id: newBook.id,
        title: newBook.title,
        category: val.genreLabel,
        type: 'published',
        pages: (val.readingHours || 4) * 30,
        words: (val.readingHours || 4) * 4500,
        date: 'أُودع للتو في الصرح',
        summary: val.synopsis,
      },
      ...works,
    ]);
    this.publishedSuccessSpec.set({
      book: newBook,
      archiveCode: 'MTX-DEP-' + Math.floor(100 + Math.random() * 900),
      depositDate: new Date().toLocaleDateString('ar-SA'),
    });
    this.isPublishModalOpen.set(false);
    this.showToast('تم إيداع المصنف الأدبي بنجاح واعتماده في خزائن الصرح');
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
    // Open chapter 4 (current checkpoint) or chapter 1
    const targetChap = this.chapters.find((c) => c.status === 'current') || this.chapters[0];
    this.openChapter(targetChap);
  }

  // Silent Background MTX engine decompression
  private async prepareSilentDecompression(novel: NovelCard): Promise<void> {
    let rawText = novel.description || '';
    const preset = MTX_LITERARY_PRESETS.find(
      (p) => p.title.includes(novel.title) || novel.title.includes(p.title)
    );
    if (preset) {
      rawText = preset.text;
    } else {
      rawText = `«بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ»\n\n${novel.quote || novel.description}\n\nتَتَوَالَى مَسَارِبُ الرِّوَايَةِ فِي نَسَقٍ سَرْدِيٍّ شَاهِقٍ، تَتَنَفَّسُ فِيهِ الكَلِمَاتُ حُرِّيَّتَهَا فِي مَلَكُوتِ الخُلُودِ. كُلُّ سَطْرٍ مَصْقُولٌ بِعِنَايَةٍ لِيَمْنَحَ القَارِئَ تَجْرِبَةً جَمَالِيَّةً نَقِيَّةً بَعِيدًا عَنْ صَخَبِ التِّجَارَةِ وَزَيْفِ الضَّجِيجِ.`;
    }

    try {
      const encoded = await compressToMtx(rawText, {
        title: novel.title,
        author: novel.author || 'أروقة الخلود',
        chapterTitle: 'الفصل الأول',
        chapterIndex: 1,
        createdAt: new Date().toISOString(),
      });
      const decoded = await decompressFromMtx(encoded.mtxBytes);
      this.activeChapterText.set(decoded.text);
    } catch {
      this.activeChapterText.set(rawText);
    }
  }
}
