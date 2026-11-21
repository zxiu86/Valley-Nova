import { LogicalChapter, NovelCard, NovelSection } from './models/library.models';

export const PUBLIC_CATALOG_CACHE_KEY = 'mtx_public_catalog_cache_v1';
export const PUBLIC_NOVEL_CONTENT_CACHE_KEY = 'mtx_public_novel_content_cache_v1';
export const PUBLIC_CACHE_VERSION = 1;
export const PUBLIC_CATALOG_SOFT_TTL_MS = 1000 * 60 * 5; // 5 min soft freshness marker (always background-revalidated)
export const MAX_CACHED_NOVEL_DETAILS = 12;

export interface CachedPublicCatalogPayload {
  version: number;
  updatedAt: number;
  novels: NovelCard[];
}

export interface CachedPublicNovelContentEntry {
  updatedAt: number;
  sections: NovelSection[];
  chapters: LogicalChapter[];
}

export type CachedPublicNovelContentMap = Record<string, CachedPublicNovelContentEntry>;

function hasBrowserLocalStorage(): boolean {
  try {
    return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
  } catch {
    return false;
  }
}

/**
 * Strips a NovelCard down to strictly safe, public, non-sensitive catalog fields
 * before persisting to localStorage. Auth tokens, private notes, moderation reports,
 * emails, and permission flags are never stored here.
 */
export function sanitizePublicNovelCardForCache(novel: NovelCard): NovelCard {
  return {
    id: novel.id,
    title: novel.title,
    ...(novel.titleEn ? { titleEn: novel.titleEn } : {}),
    ...(novel.author ? { author: novel.author } : {}),
    ...(novel.authorId ? { authorId: novel.authorId } : {}),
    ...(novel.authorUsername ? { authorUsername: novel.authorUsername } : {}),
    genre: novel.genre,
    coverUrl: novel.coverUrl,
    coverAlt: novel.coverAlt,
    ...(novel.description ? { description: novel.description } : {}),
    ...(novel.quote ? { quote: novel.quote } : {}),
    ...(novel.rank ? { rank: novel.rank } : {}),
    ...(novel.subGenre ? { subGenre: novel.subGenre } : {}),
    ...(novel.categoryLabel ? { categoryLabel: novel.categoryLabel } : {}),
    ...(novel.categoryBadgeClass ? { categoryBadgeClass: novel.categoryBadgeClass } : {}),
    ...(novel.categoryGroup ? { categoryGroup: novel.categoryGroup } : {}),
    isCompleted: Boolean(novel.isCompleted),
    ...(novel.novelStatus ? { novelStatus: novel.novelStatus } : {}),
    ...(novel.workType ? { workType: novel.workType } : {}),
    ...(novel.originalAuthor ? { originalAuthor: novel.originalAuthor } : {}),
    ...(novel.firstAuthor ? { firstAuthor: novel.firstAuthor } : {}),
    ...(novel.supportMethod ? { supportMethod: novel.supportMethod } : {}),
    verifiedReadsCount: novel.verifiedReadsCount || 0,
    publishedChapterCount: novel.publishedChapterCount || 0,
    publishedWordsAr: novel.publishedWordsAr || 0,
    publishedWordsEn: novel.publishedWordsEn || 0,
    readingHours: novel.readingHours || 1,
    ...(novel.originLanguage ? { originLanguage: novel.originLanguage } : {}),
    ...(novel.languageCode ? { languageCode: novel.languageCode } : {}),
    ...(novel.availableChapterLanguages?.length
      ? { availableChapterLanguages: [...novel.availableChapterLanguages] }
      : {}),
    ...(novel.tags?.length ? { tags: [...novel.tags] } : {}),
    ...(typeof novel.isOriginal === 'boolean' ? { isOriginal: novel.isOriginal } : {}),
    ...(typeof novel.isTranslated === 'boolean' ? { isTranslated: novel.isTranslated } : {}),
    ...(typeof novel.isFirestoreBacked === 'boolean'
      ? { isFirestoreBacked: novel.isFirestoreBacked }
      : {}),
  };
}

export function loadCachedPublicCatalog(): CachedPublicCatalogPayload | null {
  if (!hasBrowserLocalStorage()) return null;
  try {
    const raw = window.localStorage.getItem(PUBLIC_CATALOG_CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<CachedPublicCatalogPayload>;
    if (
      !parsed ||
      parsed.version !== PUBLIC_CACHE_VERSION ||
      typeof parsed.updatedAt !== 'number' ||
      !Array.isArray(parsed.novels)
    ) {
      return null;
    }
    const validNovels = parsed.novels.filter(
      (n): n is NovelCard =>
        Boolean(n && typeof n.id === 'string' && n.id.length > 0 && typeof n.title === 'string')
    );
    return {
      version: PUBLIC_CACHE_VERSION,
      updatedAt: parsed.updatedAt,
      novels: validNovels.map(sanitizePublicNovelCardForCache),
    };
  } catch {
    return null;
  }
}

export function saveCachedPublicCatalog(novels: NovelCard[]): void {
  if (!hasBrowserLocalStorage()) return;
  try {
    const payload: CachedPublicCatalogPayload = {
      version: PUBLIC_CACHE_VERSION,
      updatedAt: Date.now(),
      novels: novels.slice(0, 80).map(sanitizePublicNovelCardForCache),
    };
    window.localStorage.setItem(PUBLIC_CATALOG_CACHE_KEY, JSON.stringify(payload));
  } catch {
    // Gracefully ignore storage quota / privacy mode failures
  }
}

export function loadCachedPublicNovelContentMap(): CachedPublicNovelContentMap {
  if (!hasBrowserLocalStorage()) return {};
  try {
    const raw = window.localStorage.getItem(PUBLIC_NOVEL_CONTENT_CACHE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as {
      version?: number;
      entries?: CachedPublicNovelContentMap;
    };
    if (!parsed || parsed.version !== PUBLIC_CACHE_VERSION || !parsed.entries || typeof parsed.entries !== 'object') {
      return {};
    }
    const result: CachedPublicNovelContentMap = {};
    for (const [novelId, entry] of Object.entries(parsed.entries)) {
      if (
        entry &&
        typeof entry.updatedAt === 'number' &&
        Array.isArray(entry.sections) &&
        Array.isArray(entry.chapters)
      ) {
        result[novelId] = {
          updatedAt: entry.updatedAt,
          sections: entry.sections,
          chapters: entry.chapters.filter((ch) => ch && ch.isPublished === true),
        };
      }
    }
    return result;
  } catch {
    return {};
  }
}

export function saveCachedPublicNovelContent(
  novelId: string,
  sections: NovelSection[],
  chapters: LogicalChapter[]
): void {
  if (!hasBrowserLocalStorage() || !novelId) return;
  try {
    const current = loadCachedPublicNovelContentMap();
    const publishedOnly = chapters.filter((ch) => ch && ch.isPublished === true);
    const next: CachedPublicNovelContentMap = {
      ...current,
      [novelId]: {
        updatedAt: Date.now(),
        sections,
        chapters: publishedOnly,
      },
    };

    const sortedEntries = Object.entries(next)
      .sort((a, b) => b[1].updatedAt - a[1].updatedAt)
      .slice(0, MAX_CACHED_NOVEL_DETAILS);

    const trimmedMap: CachedPublicNovelContentMap = Object.fromEntries(sortedEntries);
    window.localStorage.setItem(
      PUBLIC_NOVEL_CONTENT_CACHE_KEY,
      JSON.stringify({ version: PUBLIC_CACHE_VERSION, entries: trimmedMap })
    );
  } catch {
    // Retry once keeping only the most recent 3 novels if localStorage quota is nearly full
    try {
      const compact: CachedPublicNovelContentMap = {
        [novelId]: {
          updatedAt: Date.now(),
          sections,
          chapters: chapters.filter((ch) => ch && ch.isPublished === true),
        },
      };
      window.localStorage.setItem(
        PUBLIC_NOVEL_CONTENT_CACHE_KEY,
        JSON.stringify({ version: PUBLIC_CACHE_VERSION, entries: compact })
      );
    } catch {
      // Ignore unrecoverable storage quota error
    }
  }
}

export function clearNovelFromPublicCache(novelId: string): void {
  if (!hasBrowserLocalStorage() || !novelId) return;
  try {
    const catalog = loadCachedPublicCatalog();
    if (catalog) {
      saveCachedPublicCatalog(catalog.novels.filter((n) => n.id !== novelId));
    }
    const contentMap = loadCachedPublicNovelContentMap();
    if (contentMap[novelId]) {
      delete contentMap[novelId];
      window.localStorage.setItem(
        PUBLIC_NOVEL_CONTENT_CACHE_KEY,
        JSON.stringify({ version: PUBLIC_CACHE_VERSION, entries: contentMap })
      );
    }
  } catch {
    // Ignore storage error
  }
}

export function areCatalogListsEquivalent(a: NovelCard[], b: NovelCard[]): boolean {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    const itemA = a[i];
    const itemB = b[i];
    if (
      itemA.id !== itemB.id ||
      itemA.title !== itemB.title ||
      itemA.coverUrl !== itemB.coverUrl ||
      (itemA.publishedChapterCount || 0) !== (itemB.publishedChapterCount || 0) ||
      (itemA.verifiedReadsCount || 0) !== (itemB.verifiedReadsCount || 0) ||
      itemA.novelStatus !== itemB.novelStatus ||
      itemA.description !== itemB.description
    ) {
      return false;
    }
  }
  return true;
}
