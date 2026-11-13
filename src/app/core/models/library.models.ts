export type SiteLanguage = 'ar' | 'en';
export type ChapterLanguage = 'ar' | 'en';
export type ExploreLanguageScope = 'all' | 'ar' | 'non-ar';

export interface NovelCard {
  id: string;
  title: string;
  author?: string;
  authorId?: string;
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
  languageCode?: string;
  availableChapterLanguages?: ChapterLanguage[];
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
  chapterNumber?: number;
  language?: ChapterLanguage;
  translationGroupId?: string;
  arabicNumber: string;
  title: string;
  duration: string;
  publishDate: string;
  status: 'read' | 'current' | 'unread';
  partition: 1 | 2 | 3;
  isLast?: boolean;
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
  role: 'reader' | 'author' | 'auditor' | 'translate' | 'founder';
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
  authorId: string;
  authorName: string;
  genre: string;
  categoryGroup: CorridorId;
  coverUrl: string;
  description: string;
  readingHours: number;
  originLanguage?: string;
  languageCode?: string;
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UsernameCheckResult {
  status: 'idle' | 'invalid' | 'reserved' | 'checking' | 'available' | 'taken' | 'unchanged';
  normalized: string;
  message: string;
  suggestions: string[];
}

export type AppView = 'novels' | 'details' | 'explore' | 'auth' | 'profile' | 'reader';
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
