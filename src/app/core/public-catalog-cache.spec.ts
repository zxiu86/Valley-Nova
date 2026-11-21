import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  MAX_CACHED_NOVEL_DETAILS,
  PUBLIC_CATALOG_CACHE_KEY,
  PUBLIC_NOVEL_CONTENT_CACHE_KEY,
  areCatalogListsEquivalent,
  clearNovelFromPublicCache,
  loadCachedPublicCatalog,
  loadCachedPublicNovelContentMap,
  sanitizePublicNovelCardForCache,
  saveCachedPublicCatalog,
  saveCachedPublicNovelContent,
} from './public-catalog-cache';
import { LogicalChapter, NovelCard, NovelSection } from './models/library.models';

function createMemoryLocalStorage(): Storage {
  const store = new Map<string, string>();
  return {
    get length() {
      return store.size;
    },
    clear() {
      store.clear();
    },
    getItem(key: string) {
      return store.get(key) ?? null;
    },
    key(index: number) {
      return Array.from(store.keys())[index] ?? null;
    },
    removeItem(key: string) {
      store.delete(key);
    },
    setItem(key: string, value: string) {
      store.set(key, String(value));
    },
  };
}

describe('public-catalog-cache (Safe Public Cache Helpers)', () => {
  let originalWindowDescriptor: PropertyDescriptor | undefined;

  beforeEach(() => {
    originalWindowDescriptor = Object.getOwnPropertyDescriptor(globalThis, 'window');
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.clear();
    } else {
      Object.defineProperty(globalThis, 'window', {
        value: { localStorage: createMemoryLocalStorage() },
        configurable: true,
      });
    }
  });

  afterEach(() => {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.clear();
    }
    if (originalWindowDescriptor && !originalWindowDescriptor.value) {
      Object.defineProperty(globalThis, 'window', originalWindowDescriptor);
    }
  });

  it('strips unexpected or private properties when sanitizing NovelCard', () => {
    const rawWithSecrets = {
      id: 'novel-1',
      title: 'ملحمة الصرح',
      genre: 'رواية تاريخية',
      coverUrl: 'https://example.com/cover.jpg',
      coverAlt: 'Cover',
      isCompleted: false,
      publishedChapterCount: 5,
      authorEmail: 'secret@example.com',
      authToken: 'super-secret-token',
      moderationNotes: 'internal review flag',
    } as unknown as NovelCard;

    const sanitized = sanitizePublicNovelCardForCache(rawWithSecrets) as unknown as Record<string, unknown>;
    expect(sanitized['id']).toBe('novel-1');
    expect(sanitized['title']).toBe('ملحمة الصرح');
    expect(sanitized['authorEmail']).toBeUndefined();
    expect(sanitized['authToken']).toBeUndefined();
    expect(sanitized['moderationNotes']).toBeUndefined();
  });

  it('saves and restores versioned public catalog and rejects corrupt payloads', () => {
    const sample: NovelCard[] = [
      {
        id: 'n-1',
        title: 'أطياف الأندلس',
        genre: 'تراث',
        coverUrl: '/images/mtx_hero.jpg',
        coverAlt: 'أطياف الأندلس',
        publishedChapterCount: 12,
        verifiedReadsCount: 44,
      },
    ];

    saveCachedPublicCatalog(sample);
    const loaded = loadCachedPublicCatalog();
    expect(loaded).not.toBeNull();
    expect(loaded?.novels.length).toBe(1);
    expect(loaded?.novels[0].id).toBe('n-1');

    // Mismatched version should safely return null
    window.localStorage.setItem(PUBLIC_CATALOG_CACHE_KEY, JSON.stringify({ version: 99, updatedAt: Date.now(), novels: sample }));
    expect(loadCachedPublicCatalog()).toBeNull();

    // Malformed JSON should safely return null
    window.localStorage.setItem(PUBLIC_CATALOG_CACHE_KEY, '{not-valid-json');
    expect(loadCachedPublicCatalog()).toBeNull();
  });

  it('filters unpublished chapters out of public novel content cache and enforces bounded LRU size', () => {
    const sections: NovelSection[] = [
      {
        id: 'sec-1',
        novelId: 'novel-a',
        authorId: 'author-1',
        title: 'الباب الأول',
        orderIndex: 1,
        createdAt: '2026-01-01',
        updatedAt: '2026-01-01',
      },
    ];
    const chapters: LogicalChapter[] = [
      {
        id: 'c1',
        novelId: 'novel-a',
        authorId: 'author-1',
        chapterNumber: 1,
        title: 'الفصل الأول',
        chapterType: 'narrative',
        endStatus: 'ongoing',
        languageMode: 'ar',
        editions: {
          ar: {
            title: 'الفصل الأول',
            blocks: [{ id: 'b1', type: 'paragraph', text: 'نص الفصل الأول.' }],
            plainText: 'نص الفصل الأول.',
            wordCount: 3,
            updatedAt: '2026-01-01',
          },
        },
        wordCountAr: 3,
        wordCountEn: 0,
        isPublished: true,
        revision: 1,
        createdAt: '2026-01-01',
        updatedAt: '2026-01-01',
      },
      {
        id: 'c2-draft',
        novelId: 'novel-a',
        authorId: 'author-1',
        chapterNumber: 2,
        title: 'مسودة',
        chapterType: 'narrative',
        endStatus: 'ongoing',
        languageMode: 'ar',
        editions: {},
        wordCountAr: 0,
        wordCountEn: 0,
        isPublished: false,
        revision: 1,
        createdAt: '2026-01-02',
        updatedAt: '2026-01-02',
      },
    ];

    saveCachedPublicNovelContent('novel-a', sections, chapters);
    const mapAfterFirst = loadCachedPublicNovelContentMap();
    expect(mapAfterFirst['novel-a'].chapters.length).toBe(1);
    expect(mapAfterFirst['novel-a'].chapters[0].id).toBe('c1');

    // Write more than MAX_CACHED_NOVEL_DETAILS novels and assert LRU bound holds
    for (let i = 0; i < MAX_CACHED_NOVEL_DETAILS + 5; i++) {
      saveCachedPublicNovelContent(`novel-extra-${i}`, sections, [
        { ...chapters[0], id: `ch-${i}`, novelId: `novel-extra-${i}` },
      ]);
    }

    const bounded = loadCachedPublicNovelContentMap();
    expect(Object.keys(bounded).length).toBe(MAX_CACHED_NOVEL_DETAILS);

    // Clearing a cached novel removes both catalog and content entries
    saveCachedPublicCatalog([
      { id: 'novel-keep', title: 'Keep', genre: 'دراما', coverUrl: 'a', coverAlt: 'a' },
      { id: 'novel-extra-16', title: 'Drop', genre: 'دراما', coverUrl: 'b', coverAlt: 'b' },
    ]);
    clearNovelFromPublicCache('novel-extra-16');
    const updatedCatalog = loadCachedPublicCatalog();
    expect(updatedCatalog?.novels.map((n) => n.id)).toEqual(['novel-keep']);
    expect(loadCachedPublicNovelContentMap()['novel-extra-16']).toBeUndefined();

    // Corrupt novel content JSON resets safely to empty object
    window.localStorage.setItem(PUBLIC_NOVEL_CONTENT_CACHE_KEY, 'corrupt');
    expect(loadCachedPublicNovelContentMap()).toEqual({});
  });

  it('detects catalog list equivalence accurately', () => {
    const base: NovelCard[] = [
      {
        id: 'n1',
        title: 'الكتاب الأول',
        genre: 'رواية',
        coverUrl: 'https://cdn.test/1.jpg',
        coverAlt: 'cover',
        publishedChapterCount: 3,
        verifiedReadsCount: 10,
      },
    ];
    expect(areCatalogListsEquivalent(base, [{ ...base[0] }])).toBe(true);
    expect(areCatalogListsEquivalent(base, [{ ...base[0], verifiedReadsCount: 11 }])).toBe(false);
    expect(areCatalogListsEquivalent(base, [])).toBe(false);
  });
});
