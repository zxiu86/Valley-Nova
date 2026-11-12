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
  excerpt: string;
  percent: number;
  date: string;
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
