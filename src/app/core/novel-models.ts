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
  category: string;
  description: string;
  coverGradient: string;
  accentColor: string;
  chapters: ChapterSummary[];
  createdAt: string;
  updatedAt: string;
  isPreloaded?: boolean;
}

export type ReaderTheme = 'light' | 'sepia' | 'dark' | 'black';
export type ReaderFont = 'amiri' | 'cairo' | 'tajawal' | 'system';
export type ReaderWidth = 'narrow' | 'normal' | 'wide';

export interface ReaderSettings {
  theme: ReaderTheme;
  fontFamily: ReaderFont;
  fontSize: number;
  lineHeight: number;
  pageWidth: ReaderWidth;
  highlightTashkeel: boolean;
  showDiagnostics: boolean;
}
