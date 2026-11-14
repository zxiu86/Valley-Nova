export type SiteLanguage = 'ar' | 'en';
export type ChapterLanguage = 'ar' | 'en';
export type ExploreLanguageScope = 'all' | 'ar' | 'non-ar';

export type WorkType = 'original' | 'translated' | 'republish';
export type NovelStatus = 'ongoing' | 'completed' | 'paused';
export type ModerationStatus = 'active' | 'under_review' | 'rejected_removed';
export type ChapterType = 'narrative' | 'explanatory';
export type ChapterEndStatus = 'ongoing' | 'ending';
export type ChapterLanguageMode = 'ar' | 'en' | 'both';
export type WriterRoleKind = 'founder' | 'author' | 'auditor' | 'translate' | 'reader';

export interface ChapterBlock {
  id: string;
  type: 'paragraph' | 'heading' | 'quote' | 'divider';
  text: string;
}

export interface ChapterLanguageEdition {
  title: string;
  blocks: ChapterBlock[];
  plainText: string;
  wordCount: number;
  updatedAt: string;
}

export interface NovelSection {
  id: string;
  novelId: string;
  authorId: string;
  title: string;
  titleEn?: string;
  orderIndex: number;
  createdAt: string;
  updatedAt: string;
}

export interface LogicalChapter {
  id: string;
  novelId: string;
  authorId: string;
  chapterNumber: number;
  title: string;
  titleEn?: string;
  sectionId?: string;
  chapterType: ChapterType;
  endStatus: ChapterEndStatus;
  languageMode: ChapterLanguageMode;
  editions: {
    ar?: ChapterLanguageEdition;
    en?: ChapterLanguageEdition;
  };
  wordCountAr: number;
  wordCountEn: number;
  isPublished: boolean;
  revision: number;
  createdAt: string;
  updatedAt: string;
}

export interface WorkReport {
  id: string;
  novelId: string;
  novelTitle: string;
  authorId: string;
  reporterUid: string;
  reason: string;
  details?: string;
  status: 'open' | 'reviewed_kept' | 'rejected_removed';
  createdAt: string;
  updatedAt: string;
}

export interface NovelCard {
  id: string;
  title: string;
  titleEn?: string;
  author?: string;
  authorId?: string;
  authorUsername?: string;
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
  novelStatus?: NovelStatus;
  workType?: WorkType;
  originalAuthor?: string;
  firstAuthor?: string;
  supportMethod?: string;
  moderationStatus?: ModerationStatus;
  moderationNote?: string;
  reportCount?: number;
  verifiedReadsCount?: number;
  publishedChapterCount?: number;
  publishedWordsAr?: number;
  publishedWordsEn?: number;
  readingHours?: number;
  originLanguage?: string;
  languageCode?: string;
  availableChapterLanguages?: ChapterLanguage[];
  tags?: string[];
  isOriginal?: boolean;
  isTranslated?: boolean;
  isManuscript?: boolean;
  isFirestoreBacked?: boolean;
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
  firestoreChapterId?: string;
  chapterNumber?: number;
  language?: ChapterLanguage;
  translationGroupId?: string;
  arabicNumber: string;
  title: string;
  titleEn?: string;
  duration: string;
  publishDate: string;
  status: 'read' | 'current' | 'unread';
  partition: 1 | 2 | 3;
  isLast?: boolean;
  chapterType?: ChapterType;
  endStatus?: ChapterEndStatus;
  sectionId?: string;
  sectionTitle?: string;
  sectionTitleEn?: string;
  revision?: number;
  editions?: {
    ar?: ChapterLanguageEdition;
    en?: ChapterLanguageEdition;
  };
}

export interface LiterarySalon {
  id: string;
  title: string;
  description: string;
  membersCount: number;
  isActive: boolean;
}

export interface ProfileQuote {
  id: string;
  quote: string;
  source: string;
  realm: string;
  realmColor: string;
}

export interface ProfileWork {
  id: string;
  title: string;
  category: string;
  type: 'published' | 'draft';
  pages: number;
  words: number;
  date: string;
  summary: string;
}

export interface ReaderBookmarkItem {
  id: string;
  chapterId: number;
  chapterTitle: string;
  language?: ChapterLanguage;
  excerpt: string;
  percent: number;
  date: string;
}

export interface PrivacySettings {
  isPublic: boolean;
  showSavedNovels: boolean;
  showReadingHistory: boolean;
  showProfileInfo: boolean;
}

export interface PublicProfile {
  uid: string;
  displayName: string;
  username: string;
  photoURL: string;
  coverURL: string;
  isPublic: boolean;
  showSavedNovels: boolean;
  showReadingHistory: boolean;
  showProfileInfo: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface FullAccountProfile extends PublicProfile {
  email?: string;
  bio: string;
  savedNovelsCount: number | null;
  readChaptersCount: number | null;
}

export interface UserRoleRecord {
  userId: string;
  role: WriterRoleKind;
  roles?: string[];
  status: 'active' | 'revoked';
  canPublish?: boolean;
  assignedBy?: string;
  assignedAt?: string;
}

export interface VerifiedWriterStatus {
  isWriterBadge: boolean;
  canPublish: boolean;
  isAdmin: boolean;
  roleKind: 'founder' | 'author' | 'none';
  roleRecord: UserRoleRecord | null;
}

export type WriterApplicationStatus = 'none' | 'pending' | 'approved' | 'rejected';

export interface WriterApplication {
  userId: string;
  penName: string;
  shortBio: string;
  genres: string[];
  writingSample: string;
  status: 'pending' | 'approved' | 'rejected';
  reviewNote?: string;
  reviewedBy?: string;
  reviewedAt?: string;
  submittedAt: string;
  updatedAt: string;
}

export interface PublishedNovelRecord {
  id: string;
  title: string;
  titleEn?: string;
  authorId: string;
  authorName: string;
  workType?: WorkType;
  originalAuthor?: string;
  firstAuthor?: string;
  supportMethod?: string;
  novelStatus?: NovelStatus;
  moderationStatus?: ModerationStatus;
  moderationNote?: string;
  reportCount?: number;
  genre: string;
  categoryGroup: CorridorId;
  coverUrl: string;
  description: string;
  readingHours: number;
  originLanguage?: string;
  languageCode?: string;
  verifiedReadsCount?: number;
  lastVerifiedReadKey?: string;
  publishedChapterCount?: number;
  publishedWordsAr?: number;
  publishedWordsEn?: number;
  tags?: string[];
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface LocalNovelDraft {
  localId: string;
  authorId: string;
  title: string;
  titleEn: string;
  workType: WorkType;
  originalAuthor: string;
  firstAuthor: string;
  supportMethod: string;
  novelStatus: NovelStatus;
  categoryGroup: CorridorId;
  genre: string;
  originLanguage: string;
  languageCode: string;
  description: string;
  coverUrl: string;
  tags: string[];
  sections: { id: string; title: string; titleEn?: string; orderIndex: number }[];
  chapters: {
    localChapterId: string;
    chapterNumber: number;
    title: string;
    titleEn?: string;
    sectionId?: string;
    chapterType: ChapterType;
    endStatus: ChapterEndStatus;
    languageMode: ChapterLanguageMode;
    editions: {
      ar?: ChapterLanguageEdition;
      en?: ChapterLanguageEdition;
    };
    updatedAt: string;
  }[];
  updatedAt: string;
}

export interface LocalChapterAutosave {
  key: string;
  novelId: string;
  chapterId: string | null;
  chapterNumber: number;
  title: string;
  titleEn: string;
  sectionId: string;
  chapterType: ChapterType;
  endStatus: ChapterEndStatus;
  languageMode: ChapterLanguageMode;
  arTitle: string;
  arBlocks: ChapterBlock[];
  enTitle: string;
  enBlocks: ChapterBlock[];
  baseRevision: number;
  savedAt: string;
  pendingSync?: boolean;
}

export interface ChapterConflictState {
  novelId: string;
  chapterId: string;
  serverChapter: LogicalChapter;
  localSnapshot: LocalChapterAutosave;
}

export interface FullNovelMtxArchive {
  format: 'mtx-full-novel-v1';
  exportedAt: string;
  sha256: string;
  novel: {
    id: string;
    title: string;
    titleEn?: string;
    authorId: string;
    authorName: string;
    workType: WorkType;
    originalAuthor?: string;
    firstAuthor?: string;
    supportMethod?: string;
    novelStatus: NovelStatus;
    categoryGroup: CorridorId;
    genre: string;
    originLanguage?: string;
    languageCode?: string;
    description: string;
    coverUrl?: string;
    tags?: string[];
  };
  sections: {
    id: string;
    title: string;
    titleEn?: string;
    orderIndex: number;
  }[];
  chapters: {
    id: string;
    chapterNumber: number;
    title: string;
    titleEn?: string;
    sectionId?: string;
    chapterType: ChapterType;
    endStatus: ChapterEndStatus;
    languageMode: ChapterLanguageMode;
    isPublished: boolean;
    editions: {
      ar?: ChapterLanguageEdition;
      en?: ChapterLanguageEdition;
    };
  }[];
}

export interface UsernameCheckResult {
  status: 'idle' | 'invalid' | 'reserved' | 'checking' | 'available' | 'taken' | 'unchanged';
  normalized: string;
  message: string;
  suggestions: string[];
}

export type AppView = 'novels' | 'details' | 'explore' | 'auth' | 'profile' | 'reader' | 'writer';
export type CorridorId = 'novels' | 'epics' | 'wisdom' | 'heritage';
export type ReaderThemeId = 'andalusian' | 'parchment' | 'ivory' | 'daylight';
export type ReaderFontFamilyId =
  | 'amiri'
  | 'naskh'
  | 'aref'
  | 'almarai'
  | 'tajawal'
  | 'kufi'
  | 'alexandria';
