export interface ChapterSummary {
  id: string;
  chapterIndex: number;
  title: string;
  wordCount: number;
  utf8Bytes: number;
  mtxBytes: number;
  savingsPercent: number;
  mtxBase64: string; // Base64 representation of the Uint8Array MTX file
  decodingDurationMs?: number;
  isLossless?: boolean;
  diacriticsCount?: number;
}

export interface Novel {
  id: string;
  title: string;
  author: string;
  authorAvatar?: string;
  authorCover?: string;
  authorBio?: string;
  translator?: string;
  translatorAvatar?: string;
  translatorCover?: string;
  translatorBio?: string;
  category: string;
  description: string;
  coverGradient: string;
  coverImage?: string;
  riwaqId?: string;
  riwaqName?: string;
  accentColor: string;
  rating?: number;
  ratingCount?: number;
  views?: string;
  badge?: string;
  section?: string;
  chapters: ChapterSummary[];
  createdAt: string;
  updatedAt: string;
  isPreloaded?: boolean;
}

export type ReaderTheme = 'light' | 'sepia' | 'dark' | 'black' | 'emerald' | 'navy';
export type ReaderFont = 'amiri' | 'cairo' | 'tajawal' | 'naskh' | 'kufi' | 'system';
export type ReaderWidth = 'narrow' | 'normal' | 'wide' | 'full';
export type ReaderAlign = 'justify' | 'right' | 'center' | 'left';
export type ReaderWeight = 'normal' | 'medium' | 'bold';
export type ParagraphSpacing = 'compact' | 'normal' | 'relaxed';

export interface ReaderSettings {
  theme: ReaderTheme;
  fontFamily: ReaderFont;
  fontSize: number;
  lineHeight: number;
  pageWidth: ReaderWidth;
  highlightTashkeel: boolean;
  showDiagnostics: boolean;
  textAlign: ReaderAlign;
  paragraphSpacing: ParagraphSpacing;
  fontWeight?: ReaderWeight;
  indentParagraphs?: boolean;
  screenDimmer?: number;
  readingRuler?: boolean;
}
