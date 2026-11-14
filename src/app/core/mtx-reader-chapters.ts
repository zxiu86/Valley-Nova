import {
  ChapterBlock,
  ChapterEndStatus,
  ChapterItem,
  ChapterLanguage,
  ChapterType,
  LogicalChapter,
  NovelCard,
  NovelSection,
} from './models/library.models';

export interface ChapterTextContent {
  chapterId: number;
  chapterNumber: number;
  language: ChapterLanguage;
  translationGroupId: string;
  arabicNumber: string;
  title: string;
  subtitle: string;
  epigraph: string;
  epigraphAuthor: string;
  paragraphs: string[];
  blocks?: ChapterBlock[];
  wordCount?: number;
  chapterType?: ChapterType;
  endStatus?: ChapterEndStatus;
  marginalia: string[];
}

export function toArabicNumerals(num: number): string {
  const digits = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
  return num
    .toString()
    .split('')
    .map((d) => digits[Number(d)] ?? d)
    .join('');
}

function estimateDurationText(wordCount: number, lang: ChapterLanguage): string {
  const mins = Math.max(1, Math.ceil(Math.max(180, wordCount) / 180));
  return lang === 'en' ? `${mins} min read` : `${toArabicNumerals(mins)} دقيقة قراءة`;
}

export function getAvailableLanguagesForNovel(
  novel: NovelCard,
  firestoreChapters?: LogicalChapter[]
): ChapterLanguage[] {
  const langs: ChapterLanguage[] = [];
  if (getChaptersForNovel(novel.id, 'ar', novel, firestoreChapters).length > 0) langs.push('ar');
  if (getChaptersForNovel(novel.id, 'en', novel, firestoreChapters).length > 0) langs.push('en');
  return langs;
}

export function getDefaultChapterLanguageForNovel(
  novel: NovelCard,
  preferredLang?: ChapterLanguage,
  firestoreChapters?: LogicalChapter[]
): ChapterLanguage {
  const arList = getChaptersForNovel(novel.id, 'ar', novel, firestoreChapters);
  const enList = getChaptersForNovel(novel.id, 'en', novel, firestoreChapters);

  if (preferredLang) {
    if (preferredLang === 'en' && enList.length > 0) return 'en';
    if (preferredLang === 'ar' && arList.length > 0) return 'ar';
  }
  if (novel.languageCode === 'en' && enList.length > 0) return 'en';
  if (arList.length > 0) return 'ar';
  if (enList.length > 0) return 'en';
  return preferredLang || (novel.languageCode === 'en' ? 'en' : 'ar');
}

export function getChaptersForNovel(
  novelId: string,
  lang: ChapterLanguage,
  _novel?: NovelCard | null,
  firestoreChapters?: LogicalChapter[],
  sections?: NovelSection[]
): ChapterItem[] {
  if (!novelId || !firestoreChapters || firestoreChapters.length === 0) {
    return [];
  }

  const source = firestoreChapters.filter((ch) => ch.isPublished === true);
  const matching = source
    .filter((ch) => Boolean(lang === 'en' ? ch.editions?.en : ch.editions?.ar))
    .sort((a, b) => a.chapterNumber - b.chapterNumber);

  const sectionMap = new Map<string, NovelSection>((sections || []).map((s) => [s.id, s]));

  return matching.map((ch, idx) => {
    const edition = lang === 'en' ? ch.editions.en! : ch.editions.ar!;
    const sec = ch.sectionId ? sectionMap.get(ch.sectionId) : undefined;
    const partitionIndex = ((idx % 3) + 1) as 1 | 2 | 3;
    const wordCount = edition.wordCount || (lang === 'en' ? ch.wordCountEn : ch.wordCountAr) || 0;
    const titleForLang =
      edition.title ||
      (lang === 'en' ? ch.titleEn || ch.title : ch.title) ||
      (lang === 'en' ? `Chapter ${ch.chapterNumber}` : `الفصل ${toArabicNumerals(ch.chapterNumber)}`);

    return {
      id: ch.chapterNumber,
      firestoreChapterId: ch.id,
      chapterNumber: ch.chapterNumber,
      language: lang,
      translationGroupId: `${novelId}__ch_${ch.chapterNumber}`,
      arabicNumber: lang === 'en' ? `${ch.chapterNumber}` : toArabicNumerals(ch.chapterNumber),
      title: titleForLang,
      titleEn: ch.titleEn || ch.editions.en?.title,
      duration: estimateDurationText(wordCount, lang),
      publishDate:
        ch.endStatus === 'ending'
          ? lang === 'en'
            ? 'Ending Chapter'
            : 'انتهاء'
          : lang === 'en'
            ? 'Ongoing'
            : 'مستمر',
      status: idx === 0 ? 'current' : 'unread',
      partition: partitionIndex,
      isLast: idx === matching.length - 1,
      chapterType: ch.chapterType || 'narrative',
      endStatus: ch.endStatus || 'ongoing',
      sectionId: ch.sectionId,
      sectionTitle: sec?.title,
      sectionTitleEn: sec?.titleEn,
      revision: ch.revision,
      editions: ch.editions,
    };
  });
}

export function getChapterProse(
  _novelTitle: string,
  chapter: ChapterItem,
  novel?: NovelCard | null,
  firestoreChapters?: LogicalChapter[],
  sections?: NovelSection[]
): ChapterTextContent {
  const chNum = chapter.chapterNumber ?? chapter.id;
  const lang: ChapterLanguage = chapter.language || 'ar';
  const translationGroupId = chapter.translationGroupId || `${novel?.id || 'work'}__ch_${chNum}`;

  const matchedDb = firestoreChapters?.find(
    (c) =>
      (chapter.firestoreChapterId && c.id === chapter.firestoreChapterId) ||
      c.chapterNumber === chNum
  );
  const edition = matchedDb?.editions?.[lang] || chapter.editions?.[lang];

  if (edition) {
    const blocks = edition.blocks || [];
    const paragraphs = blocks.length
      ? blocks.filter((b) => b.type !== 'divider' && b.text.trim().length > 0).map((b) => b.text)
      : (edition.plainText || '')
          .split(/\n{2,}/)
          .map((p) => p.trim())
          .filter(Boolean);

    const secId = matchedDb?.sectionId || chapter.sectionId;
    const secObj = secId && sections ? sections.find((s) => s.id === secId) : undefined;
    const secSubtitle = secObj
      ? lang === 'en'
        ? secObj.titleEn || secObj.title
        : secObj.title
      : lang === 'en'
        ? chapter.sectionTitleEn || chapter.sectionTitle || ''
        : chapter.sectionTitle || '';

    return {
      chapterId: chapter.id,
      chapterNumber: chNum,
      language: lang,
      translationGroupId,
      arabicNumber: lang === 'en' ? `${chNum}` : toArabicNumerals(chNum),
      title: edition.title || chapter.title,
      subtitle:
        secSubtitle ||
        (matchedDb?.chapterType === 'explanatory' || chapter.chapterType === 'explanatory'
          ? lang === 'en'
            ? 'Explanatory Chapter'
            : 'فصل توضيحي'
          : ''),
      epigraph: '',
      epigraphAuthor: '',
      paragraphs,
      blocks,
      wordCount: edition.wordCount,
      chapterType: matchedDb?.chapterType || chapter.chapterType || 'narrative',
      endStatus: matchedDb?.endStatus || chapter.endStatus || 'ongoing',
      marginalia: [],
    };
  }

  return {
    chapterId: chapter.id,
    chapterNumber: chNum,
    language: lang,
    translationGroupId,
    arabicNumber: lang === 'en' ? `${chNum}` : toArabicNumerals(chNum),
    title: chapter.title,
    subtitle: '',
    epigraph: '',
    epigraphAuthor: '',
    paragraphs: [],
    blocks: [],
    wordCount: 0,
    chapterType: chapter.chapterType || 'narrative',
    endStatus: chapter.endStatus || 'ongoing',
    marginalia: [],
  };
}
