import { Injectable, PLATFORM_ID, computed, inject, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { FormControl, FormGroup } from '@angular/forms';
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
  NovelCard,
  ProfileQuote,
  ProfileWork,
  PublishedNovelRecord,
  ReaderBookmarkItem,
  ReaderFontFamilyId,
  ReaderThemeId,
  SerendipityNovel,
  SiteLanguage,
} from '../models/library.models';
import { compressToMtx, decompressFromMtx } from '../mtx-codec';
import { MTX_LITERARY_PRESETS } from '../mtx-presets';
import { INITIAL_EXPLORE_CATALOG, isArabicCatalogNovel } from '../mtx-catalog-data';
import {
  ChapterTextContent,
  getChapterProse,
  getChaptersForNovel,
  getDefaultChapterLanguageForNovel,
} from '../mtx-reader-chapters';
import {
  fetchAllPublishedNovels,
  fetchCloudVaultBooks,
  publishNovelToFirestore,
  recordChapterReadInFirestore,
  removeBookmarkFromFirestore,
  saveBookmarkToFirestore,
  saveToCloudVault,
  syncSavedNovelsCountToFirestore,
} from '../mtx-firebase';
import { AuthSessionService } from './auth-session.service';
import { AccountService } from './account.service';
import { ThemeService } from './theme.service';
import { I18nService } from './i18n.service';

const NAV_STORAGE_KEY = 'mtx_nav_state_v1';

@Injectable({ providedIn: 'root' })
export class LibraryStateService {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly router = inject(Router);
  readonly authSession = inject(AuthSessionService);
  readonly accountService = inject(AccountService);
  readonly themeService = inject(ThemeService);
  readonly i18n = inject(I18nService);

  // Navigation & View State ('novels' | 'details' | 'explore' | 'auth' | 'profile' | 'reader')
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
  readonly readingProgressPercent = signal<number>(17);
  readonly selectedChapterLang = signal<ChapterLanguage>('ar');
  readonly selectedChapterLangProgressPercent = signal<number>(0);

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

  readonly exploreBooksList = signal<NovelCard[]>([...INITIAL_EXPLORE_CATALOG]);

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

  // Profile Collections
  readonly profileQuotes = signal<ProfileQuote[]>([
    {
      id: 'q1',
      quote: '«حين يمتزج صهيل خيول التيموريين بأسرار المراصد الفلكية الشاهقة، ينبض عالم سري من الألغاز والمخطوطات المحرمة، حيث النجوم ليست مجرد ضياء، بل خرائط دمٍ وبقاء.»',
      source: 'رواية أصداء سمرقند — ص ٢١٤',
      realm: 'رواق الروايات',
      realmColor: 'text-primary',
    },
    {
      id: 'q2',
      quote: '«المرآة لا تعكس وجوه العابرين فحسب، بل تُعرّي ما توارى خلف أسوار الزمان وأغوار الضمير الإنساني في صمت الليل.»',
      source: 'شظايا المرآة السبع — ص ٨٩',
      realm: 'رواق الحكمة',
      realmColor: 'text-on-surface',
    },
    {
      id: 'q3',
      quote: '«ليس التاج ما يصنع الملوك في ساحة النزال، بل سيفٌ لا يرتجف وعهدٌ لا يخون في ملحمة الفجر وأهازيج النصر.»',
      source: 'عرش الرماد والتنانين — ص ٣٤٠',
      realm: 'رواق الملاحم',
      realmColor: 'text-secondary',
    },
    {
      id: 'q4',
      quote: '«كتبتُ هذا الرقيم في قرطبة قبل أن تسكت المآذن، ليعلم من يأتي بعدنا أن الحبر أطول عمراً من السيوف وأبقى من الحصون.»',
      source: 'مخطوطة الزهراء المفقودة — سفر التوثيق',
      realm: 'رواق التراث',
      realmColor: 'text-tertiary',
    },
  ]);

  readonly profileWorks = signal<ProfileWork[]>([
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

  readonly profileTimeline = [
    { title: 'أكمل قراءة الفصل الرابع: شفرة النجوم ومذنب زرافشان', time: 'اليوم، ٠٤:٣٠ م', book: 'أصداء سمرقند', duration: '٤٥ دقيقة قراءة' },
    { title: 'دوّن اقتباساً مذهباً في خزانة الحكمة والتأمل', time: 'أمس، ٠٩:١٥ م', book: 'شظايا المرآة السبع', duration: 'اقتباس جديد' },
    { title: 'أضاف رواية «عرش الرماد» إلى ألواحه المفضلة', time: 'قبل يومين', book: 'عرش الرماد والتنانين', duration: 'إيداع بالخزانة' },
    { title: 'نال وسام «سادن الاعتكاف القرائي» (٣٤ يوماً متواصلاً)', time: 'منذ ٥ أيام', book: 'صرح أروقة الخلود', duration: 'إنجاز تحريري' },
    { title: 'أتم مراجعة مسودة «أطياف النحاس» واعتماد ميثاق النقاء', time: 'منذ أسبوع', book: 'رواق التراث', duration: 'توثيق رسمي' },
  ];

  readonly literarySalons = signal<LiterarySalon[]>([
    {
      id: 's1',
      title: 'صالون الفلك والبارود السمرقندي',
      description: 'نقاش حول شفرة النجوم ومذنب زرافشان — ١٤ مشاركاً نشطاً.',
      membersCount: 14,
      isActive: true,
    },
    {
      id: 's2',
      title: 'مجلس السرد الأندلسي التليد',
      description: 'تحقيق مخطوطة الزهراء المفقودة — ٩ باحثين.',
      membersCount: 9,
      isActive: true,
    },
  ]);

  // Default Masterpiece: أصداء سمرقند
  readonly defaultEchoesSamarkand: NovelCard = {
    id: 'echoes-of-samarkand',
    title: 'أصداء سمرقند',
    author: 'الشيخ جلال الدين الموصلي',
    genre: 'رواق الروايات والخيال السردي',
    subGenre: 'في دهاليز الفلك والبارود',
    originLanguage: 'عربي أصيل',
    languageCode: 'ar',
    availableChapterLanguages: ['ar', 'en'],
    readingHours: 9,
    isCompleted: true,
    coverUrl:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuCIF5pF45h_OR2lIwskuFNX2Fw9AdCINz_hC0Qvf-3zDmpWivbiit8SYF0sS6HhU3kibG9nYM4UcKVC0H4WjgF5VCuxaffvcfC-XrgbjG-oKc3LAqtSqS0Z4LaimKNUeF3EoVGDctyrjracP07ZuLn2ljBOsPpbTDJjrRrRNFZcjHkBoy1Kk-OM5UlnYWhwvMPbjaubWOshxoIfGO98nNuL5FfI-ZO153_wRqE_7CwhTblHyOK8tSyR_Q',
    coverAlt: 'غلاف رواية أصداء سمرقند الفلكية والتاريخية',
    quote:
      '«حين يمتزج صهيل خيول التيموريين بأسرار المراصد الفلكية الشاهقة، ينبض عالم سري من الألغاز والمخطوطات المحرمة، حيث النجوم ليست مجرد ضياء، بل خرائط دمٍ وبقاء.»',
    description:
      'في سمرقند عام ٨٥٣ هجرية، حين كان مرصد السلطان أولغ بك يشق عتمة السماء بأدق جداول فلكية عرفتها البشرية، يُعثر على أحد كبار النساخ مقتولاً داخل القبة السماوية الصغرى، وبيده رقعة جلدية كُتبت بلغة أرقام غير مألوفة، تشير إلى مسار مذنب غامض سيعبر فوق وادي زرافشان بعد أربعين ليلة.',
  };

  readonly chapters: ChapterItem[] = [
    { id: 1, arabicNumber: '١', title: 'شقشقة الفجر وظلال القلعة المفقودة', duration: '١٨ دقيقة قراءة', publishDate: 'نُشر في المحرم', status: 'read', partition: 1 },
    { id: 2, arabicNumber: '٢', title: 'أصداء الإسطرلاب النحاسي العتيق', duration: '٢٢ دقيقة قراءة', publishDate: 'نُشر في المحرم', status: 'read', partition: 1 },
    { id: 3, arabicNumber: '٣', title: 'قوافل الملح وخرائط التائهين', duration: '١٦ دقيقة قراءة', publishDate: 'نُشر في صفر', status: 'read', partition: 1 },
    { id: 4, arabicNumber: '٤', title: 'ساعة الرمل في محراب أولغ بك', duration: '٢٥ دقيقة قراءة', publishDate: 'موقعك الحالي للقراءة', status: 'current', partition: 1 },
    { id: 5, arabicNumber: '٥', title: 'دماء على أوراق الزيج الجديد', duration: '٢٠ دقيقة قراءة', publishDate: 'نُشر في ربيع الأول', status: 'unread', partition: 1 },
    { id: 6, arabicNumber: '٦', title: 'متاهة حوانيت القاشاني الأزرق', duration: '١٩ دقيقة قراءة', publishDate: 'نُشر في ربيع الأول', status: 'unread', partition: 1 },
    { id: 7, arabicNumber: '٧', title: 'همسات المئذنة المائلة', duration: '١٧ دقيقة قراءة', publishDate: 'نُشر في ربيع الآخر', status: 'unread', partition: 1 },
    { id: 8, arabicNumber: '٨', title: 'انفجار مخزن البارود الغربي', duration: '٢٤ دقيقة قراءة', publishDate: 'نُشر في ربيع الآخر', status: 'unread', partition: 1 },
    { id: 9, arabicNumber: '٩', title: 'ختم سمرقند المحرم تحت الثرى', duration: '٢١ دقيقة قراءة', publishDate: 'نُشر في جمادى الأولى', status: 'unread', partition: 2 },
    { id: 10, arabicNumber: '١٠', title: 'شفرة الصوفي والأرقام الهندية', duration: '١٥ دقيقة قراءة', publishDate: 'نُشر في جمادى الأولى', status: 'unread', partition: 2 },
    { id: 11, arabicNumber: '١١', title: 'مؤامرة خانات السهوب الشمالية', duration: '٢٣ دقيقة قراءة', publishDate: 'نُشر في جمادى الآخرة', status: 'unread', partition: 2 },
    { id: 12, arabicNumber: '١٢', title: 'ليلة احتراق الرق الأندلسي', duration: '١٨ دقيقة قراءة', publishDate: 'نُشر في جمادى الآخرة', status: 'unread', partition: 2 },
    { id: 13, arabicNumber: '١٣', title: 'حين يتكلم مذنب الموت', duration: '٢٠ دقيقة قراءة', publishDate: 'نُشر في رجب', status: 'unread', partition: 2 },
    { id: 14, arabicNumber: '١٤', title: 'مبارزة على حافة سقف الرصد', duration: '١٦ دقيقة قراءة', publishDate: 'نُشر في رجب', status: 'unread', partition: 2 },
    { id: 15, arabicNumber: '١٥', title: 'رسالة الوزير المسمومة', duration: '٢٢ دقيقة قراءة', publishDate: 'نُشر في رجب', status: 'unread', partition: 2 },
    { id: 16, arabicNumber: '١٦', title: 'صراع في خزانة الكتب الكبرى', duration: '١٩ دقيقة قراءة', publishDate: 'نُشر في شعبان', status: 'unread', partition: 2 },
    { id: 17, arabicNumber: '١٧', title: 'شروق كوكب الزهرة فوق جيحون', duration: '١٨ دقيقة قراءة', publishDate: 'نُشر في شعبان', status: 'unread', partition: 3 },
    { id: 18, arabicNumber: '١٨', title: 'نداء الأبواق عند أسوار شاه زنده', duration: '٢١ دقيقة قراءة', publishDate: 'نُشر في شعبان', status: 'unread', partition: 3 },
    { id: 19, arabicNumber: '١٩', title: 'مفتاح القوس السداسي الرخامي', duration: '١٧ دقيقة قراءة', publishDate: 'نُشر في شعبان', status: 'unread', partition: 3 },
    { id: 20, arabicNumber: '٢٠', title: 'سقوط القناع عن الفلكي المنفي', duration: '٢٤ دقيقة قراءة', publishDate: 'نُشر في شعبان', status: 'unread', partition: 3 },
    { id: 21, arabicNumber: '٢١', title: 'المعركة الأخيرة في دهليز البارود', duration: '٢٩ دقيقة قراءة', publishDate: 'نُشر في شعبان', status: 'unread', partition: 3 },
    { id: 22, arabicNumber: '٢٢', title: 'حين تلتقي الحسابات بالقدر', duration: '٢٠ دقيقة قراءة', publishDate: 'نُشر في شعبان', status: 'unread', partition: 3 },
    { id: 23, arabicNumber: '٢٣', title: 'انقشاع الدخان وسلام الفيروز', duration: '١٦ دقيقة قراءة', publishDate: 'نُشر في شعبان', status: 'unread', partition: 3 },
    { id: 24, arabicNumber: '٢٤', title: 'خاتمة الأسفار: ما حفظته مراصد الخلود', duration: '٢٧ دقيقة قراءة', publishDate: 'مسك الختام والملحمة', status: 'unread', partition: 3, isLast: true },
  ];

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

  readonly activeGenre = signal<string>('الكل');

  readonly spotlight = {
    id: 'obsidian-labyrinth-spotlight',
    title: 'متاهة حجر السج',
    quote: '“في تلك الممرات التي لم تطأها الشمس، كانت الظلال تهمس بأسماء الذين ضلوا الطريق قبل قرون سبعة...”',
    coverUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCmht4M8dhW4qouOfD-vV41r8nv1IJNs9vpPPJidZ09Pz1VQtE19aGDuO_lsdBHQvqzjVq8Iu1US-gi58QaTG-i6dNRDKv-m-HqSa0tYNs_85eaxWzKfhv0dUINk0GpA77khIg2Ih_OmE4Gul_5cAfsemzeGQuFN_qGC740JK4TxnXTUTXHCgvQbYQfL-PL86oIqzHbZwut5yDcd8zrvgbJFOxCbibFroAgaQikOSoPZ2D3srSxO4fC8g',
    coverAlt: 'غلاف رواية متاهة حجر السج',
    genre: 'الغموض والتشويق',
  };

  readonly genrePills = [
    'الكل',
    'الفانتازيا الملحمية',
    'الغموض والتشويق',
    'أدب الرعب القوطي',
    'الخيال العلمي',
    'الدراما النفسية',
    'الواقعية السحرية',
  ];

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

  // Computed theme & catalog selectors
  readonly allNovels = computed(() => [
    ...this.featuredMasterpieces,
    ...this.fantasyNovels,
    ...this.mysteryNovels,
    ...this.scifiNovels,
  ]);

  readonly allNovelsList = computed<NovelCard[]>(() => {
    const map = new Map<string, NovelCard>();
    const list: NovelCard[] = [
      this.defaultEchoesSamarkand,
      this.spotlight,
      ...this.featuredMasterpieces,
      ...this.fantasyNovels,
      ...this.mysteryNovels,
      ...this.scifiNovels,
      ...this.topRankedNovels,
      ...this.relatedWorks,
      ...this.exploreBooksList(),
    ];
    for (const b of list) {
      if (!map.has(b.id)) {
        map.set(b.id, b);
      }
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
    if (pool.length === 0) {
      pool = [this.defaultEchoesSamarkand, ...this.featuredMasterpieces.slice(0, 3)];
    }

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
    const novel = this.selectedNovel() || this.defaultEchoesSamarkand;
    const g = (novel.genre || '').toLowerCase();
    const t = (novel.title || '').toLowerCase();
    const isEn = this.i18n.lang() === 'en';

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
        volumeNumber: isEn ? 'VOLUME II — CHRONICLE OF EMPIRES' : 'السِّفْرُ الثَّانِي — المجلد الثالث',
        archiveCode: 'MTX-774-EPC',
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
        volumeNumber: isEn ? 'VOLUME I — PHILOSOPHICAL TREATISE' : 'السِّفْرُ الأَوَّل — حِكْمَةُ المَشْرِق',
        archiveCode: 'MTX-312-WSD',
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
        volumeNumber: isEn ? 'CODEX IV — ARCHIVAL COLLECTION' : 'المَخْطُوطُ الرَّابِع — خَزَانَةُ التِّبْر',
        archiveCode: 'MTX-941-EMR',
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
        volumeNumber: isEn ? 'VOLUME I — VERIFIED CINEMATIC EDITION' : 'المُجَلَّدُ الأَوَّل — الطَّبْعَةُ السِّينَمَائِيَّة',
        archiveCode: 'MTX-853-SMQ',
      };
    }
  });

  // Bilingual Novel Chapters Computed Signals
  readonly availableChaptersForNovel = computed<ChapterItem[]>(() => {
    const novel = this.selectedNovel() || this.defaultEchoesSamarkand;
    return getChaptersForNovel(novel.id, this.selectedChapterLang(), novel);
  });

  readonly oppositeChapterLang = computed<ChapterLanguage>(() =>
    this.selectedChapterLang() === 'ar' ? 'en' : 'ar'
  );

  readonly oppositeChaptersCount = computed<number>(() => {
    const novel = this.selectedNovel() || this.defaultEchoesSamarkand;
    return getChaptersForNovel(novel.id, this.oppositeChapterLang(), novel).length;
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
          const fallbackChap =
            pool.find((c) => c.status === 'current') || pool[0] || this.chapters[0];
          this.loadChapterContent(fallbackChap);
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

    await this.authSession.init();

    try {
      const [cached, publishedNovels] = await Promise.all([
        fetchCloudVaultBooks(),
        fetchAllPublishedNovels(),
      ]);
      if (cached && cached.length > 0) {
        const nextSet = new Set(this.bookmarkedIds());
        cached.forEach((b) => nextSet.add(b.id));
        this.bookmarkedIds.set(nextSet);
      }
      if (publishedNovels && publishedNovels.length > 0) {
        const mapped: NovelCard[] = publishedNovels.map((n) => ({
          id: n.id,
          title: n.title,
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
          isCompleted: false,
          isOriginal: true,
        }));
        this.exploreBooksList.update((existing) => {
          const existingIds = new Set(existing.map((item) => item.id));
          const fresh = mapped.filter((m) => !existingIds.has(m.id));
          return [...fresh, ...existing];
        });
      }
    } catch {
      // Quiet background setup
    }
  }

  destroy(): void {
    this.routerEventsSub?.unsubscribe();
    this.routerEventsSub = null;
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
    return 'novels';
  }

  private persistNavigationState(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    try {
      const payload = {
        view: this.currentView(),
        novelId: this.selectedNovel()?.id || null,
        chapterId: this.activeReadingChapter()?.id || null,
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
          corridor?: CorridorId;
        };
        if (saved.corridor) {
          this.activeCorridor.set(saved.corridor);
        }
        if (saved.novelId) {
          const found = this.allNovelsList().find((n) => n.id === saved.novelId);
          if (found) {
            this.selectedNovel.set(found);
          }
        }
        if (saved.chapterId) {
          const foundChap = this.chapters.find((c) => c.id === saved.chapterId);
          if (foundChap) {
            this.activeReadingChapter.set(foundChap);
          }
        }
      }

      if (currentRouteView !== 'novels') {
        this.currentView.set(currentRouteView);
        if (currentRouteView === 'reader') {
          const chap = this.activeReadingChapter() || this.chapters.find((c) => c.status === 'current') || this.chapters[0];
          this.loadChapterContent(chap);
        }
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
      const shuffled = [...this.serendipityPool].sort(() => Math.random() - 0.5);
      this.activeSerendipity.set(shuffled);
      this.isShuffling.set(false);
      this.showToast(this.isEn() ? 'Curated new serendipitous picks' : 'تم استحضار اختيارات عشوائية جديدة من دهاليز السرد');
    }, 400);
  }

  private resolveCanonicalNovel(novel: NovelCard): NovelCard {
    if (!novel) return this.defaultEchoesSamarkand;
    const match =
      this.allNovelsList().find((n) => n.id === novel.id) ||
      this.featuredMasterpieces.find((n) => n.id === novel.id);
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
    const initialChapLang = getDefaultChapterLanguageForNovel(resolved, preferred);
    this.selectedChapterLang.set(initialChapLang);
    this.chapterSearchControl.setValue('');
    this.syncNovelChapterProgress(resolved, initialChapLang);
    this.closeAllModals();
    this.navigateToView('details');
    this.prepareSilentDecompression(resolved);
  }

  setNovelChapterLanguage(lang: ChapterLanguage): void {
    const novel = this.selectedNovel() || this.defaultEchoesSamarkand;
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
    const chapters = getChaptersForNovel(novel.id, lang, novel);
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
    const novel = this.selectedNovel() || this.defaultEchoesSamarkand;
    const authorName = novel.author || (this.isEn() ? 'the author' : 'الشيخ جلال الدين الموصلي');
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
    const chapLang: ChapterLanguage = chapter.language || this.selectedChapterLang();
    if (this.selectedChapterLang() !== chapLang) {
      this.selectedChapterLang.set(chapLang);
    }
    this.activeReadingChapter.set(chapter);
    const novel = this.selectedNovel() || this.defaultEchoesSamarkand;
    const content = getChapterProse(novel.title, chapter, novel);
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

    const novel = this.selectedNovel() || this.defaultEchoesSamarkand;
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
        const novel = this.selectedNovel() || this.defaultEchoesSamarkand;
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

  startReadingNovel(novel: NovelCard): void {
    const resolved = this.resolveCanonicalNovel(novel);
    this.selectedNovel.set(resolved);
    const scope = this.exploreLanguageScope();
    const preferred: ChapterLanguage | undefined =
      scope === 'non-ar' ? 'en' : scope === 'ar' ? 'ar' : this.i18n.lang();
    const chapLang = getDefaultChapterLanguageForNovel(resolved, preferred);
    this.selectedChapterLang.set(chapLang);
    const pool = getChaptersForNovel(resolved.id, chapLang, resolved);
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
    this.startReadingNovel(novel);
  }

  resumeReadingNovel(novel: NovelCard): void {
    this.startReadingNovel(novel);
  }

  async downloadBookOffline(): Promise<void> {
    const novel = this.selectedNovel() || this.defaultEchoesSamarkand;
    if (!novel) return;

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
    const salonNames = this.isEn()
      ? [
          {
            title: 'Cordoba Wisdom & Averroes Circle',
            desc: 'Studying Andalusian philosophy manuscripts — Active Salon',
          },
          {
            title: 'Chronicle of Ashes & Epics Circle',
            desc: 'Philological review of heroic and mythic literature',
          },
          {
            title: 'Contemporary Narrative & Symbolism Council',
            desc: 'Close readings of modern rhetorical prose',
          },
          {
            title: 'Heritage Folios & Verified Manuscripts Seminar',
            desc: 'Inspecting historical folios and curated texts',
          },
        ]
      : [
          {
            title: 'ملتقى حكمة قرطبة وفلسفة ابن رشد',
            desc: 'مدارسة مخطوطات الفلسفة والتنوير الأندلسي — حلقة نشطة',
          },
          {
            title: 'ديوان ملاحم الرماد وتدوين الأساطير',
            desc: 'حلقة تحقيق نصوص البطولات والملاحم الشرقية القديمة',
          },
          {
            title: 'مجلس نقد السرد والرمزية المعاصرة',
            desc: 'جلسات تحليل التراكيب السردية والبلاغية الرفيعة',
          },
          {
            title: 'ندوة خزائن التراث والمخطوط المرقوم',
            desc: 'استقراء الوثائق التاريخية والنصوص المحققة الأصيلة',
          },
        ];
    const count = this.literarySalons().length;
    const nextTemplate = salonNames[Math.abs(count - 2) % salonNames.length];
    const newSalon: LiterarySalon = {
      id: `salon_${Date.now()}`,
      title: nextTemplate.title,
      description: nextTemplate.desc,
      membersCount: 1,
      isActive: true,
    };
    this.literarySalons.update((list) => [...list, newSalon]);
    this.showToast(
      this.isEn()
        ? `Sponsored "${newSalon.title}" successfully`
        : `تم تدشين «${newSalon.title}» ورعايته بنجاح`
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
    const card: NovelCard = {
      id: rec.id,
      title: rec.title,
      author: rec.authorName,
      authorId: rec.authorId,
      genre: rec.genre,
      categoryGroup: rec.categoryGroup,
      originLanguage: rec.originLanguage,
      languageCode: rec.languageCode,
      coverUrl: rec.coverUrl || '/images/writers_sanctuary_bg.jpg',
      coverAlt: rec.title,
      description: rec.description,
      readingHours: rec.readingHours,
      isCompleted: false,
      isOriginal: true,
    };
    this.openNovelDetails(card);
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
    if (!val.title.trim() || !val.synopsis.trim()) {
      this.showToast(
        this.isEn()
          ? 'Please enter the work title and synopsis'
          : 'يرجى كتابة عنوان المصنف وملخصه الأدبي'
      );
      return;
    }

    const now = new Date().toISOString();
    const isEnglishOrigin = val.originLanguage === 'الإنجليزية' || val.originLanguage === 'English';
    const record: PublishedNovelRecord = {
      id: 'usr-' + Date.now(),
      title: val.title.trim(),
      authorId: user.uid,
      authorName: val.authorName.trim() || this.authSession.displayName(),
      genre: val.genreLabel || 'رواية أدبية معاصرة',
      categoryGroup: val.categoryGroup || 'novels',
      originLanguage: val.originLanguage || 'عربي أصيل',
      languageCode: isEnglishOrigin ? 'en' : 'ar',
      coverUrl: val.coverUrl.trim() || '/images/writers_sanctuary_bg.jpg',
      description: val.synopsis.trim(),
      readingHours: val.readingHours || 4,
      isPublished: true,
      createdAt: now,
      updatedAt: now,
    };

    try {
      await publishNovelToFirestore(record);
    } catch {
      this.showToast(
        this.isEn()
          ? 'Could not publish work. Please verify writer permissions.'
          : 'تعذر حفظ العمل في قاعدة البيانات. تحقق من صلاحيات الكاتب.'
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
