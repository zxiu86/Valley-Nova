import { Injectable, computed, signal } from '@angular/core';
import { ChapterSummary, Novel, ReaderSettings } from './novel-models';
import { SAMPLE_NOVELS } from './sample-novels';
import {
  base64ToUint8Array,
  compressToMtx,
  decompressFromMtx,
  downloadMtxFile,
  MtxDecompressionResult,
  uint8ArrayToBase64,
} from './mtx-codec';
import { auth, db } from './firebase';
import { collection, deleteDoc, doc, getDocs, setDoc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';

const STORAGE_KEY_NOVELS = 'muqatil_novels_catalog_v1';
const STORAGE_KEY_SETTINGS = 'muqatil_reader_settings_v1';
const STORAGE_KEY_BOOKMARKS = 'muqatil_bookmarks_v1';
const STORAGE_KEY_RATINGS = 'muqatil_ratings_v1';
const STORAGE_KEY_HISTORY = 'muqatil_reading_history_v1';
const STORAGE_KEY_COMMENTS = 'muqatil_chapter_comments_v1';

export interface ReadHistoryItem {
  novelId: string;
  novelTitle: string;
  novelCoverGradient: string;
  novelAuthor: string;
  chapterId: string;
  chapterIndex: number;
  chapterTitle: string;
  readAt: string;
}

export interface ChapterComment {
  id: string;
  novelId: string;
  chapterId: string;
  userId: string;
  userName: string;
  userAvatar: string;
  userCover: string;
  text: string;
  createdAt: string;
  likes: number;
}

const DEFAULT_SETTINGS: ReaderSettings = {
  theme: 'dark',
  fontFamily: 'amiri',
  fontSize: 21,
  lineHeight: 2.2,
  pageWidth: 'normal',
  highlightTashkeel: false,
  showDiagnostics: false,
  textAlign: 'justify',
  paragraphSpacing: 'normal',
  fontWeight: 'normal',
  indentParagraphs: true,
  screenDimmer: 0,
  readingRuler: false,
};

@Injectable({
  providedIn: 'root',
})
export class NovelStore {
  // State Signals
  readonly novels = signal<Novel[]>([]);
  readonly selectedNovel = signal<Novel | null>(null);
  readonly selectedChapter = signal<ChapterSummary | null>(null);
  readonly currentChapterText = signal<string>('');
  readonly currentChapterDecompressResult = signal<MtxDecompressionResult | null>(null);
  readonly readerSettings = signal<ReaderSettings>(DEFAULT_SETTINGS);
  readonly bookmarkedNovelIds = signal<string[]>([]);
  readonly userRatings = signal<Record<string, number>>({});
  readonly selectedCategoryFilter = signal<string>('all');
  readonly readHistory = signal<ReadHistoryItem[]>([]);
  readonly chapterComments = signal<ChapterComment[]>([]);

  readonly isDecoding = signal<boolean>(false);
  readonly isEncoding = signal<boolean>(false);
  readonly isInitialized = signal<boolean>(false);

  // Computed global statistics & user derived state
  readonly totalChaptersReadCount = computed(() => this.readHistory().length);
  readonly bookmarkedNovels = computed(() => {
    const ids = this.bookmarkedNovelIds();
    return this.novels().filter(n => ids.includes(n.id));
  });
  readonly globalStats = computed(() => {
    const allNovels = this.novels();
    let totalChapters = 0;
    let totalUtf8 = 0;
    let totalMtx = 0;
    let totalWords = 0;

    for (const n of allNovels) {
      for (const ch of n.chapters) {
        totalChapters++;
        totalUtf8 += ch.utf8Bytes;
        totalMtx += ch.mtxBytes;
        totalWords += ch.wordCount;
      }
    }

    const savedBytes = Math.max(0, totalUtf8 - totalMtx);
    const savingsPercent = totalUtf8 > 0 ? Math.round((savedBytes / totalUtf8) * 1000) / 10 : 0;

    return {
      totalNovels: allNovels.length,
      totalChapters,
      totalWords,
      totalUtf8Bytes: totalUtf8,
      totalMtxBytes: totalMtx,
      savedBytes,
      savingsPercent,
    };
  });

  constructor() {
    this.init();
  }

  async init(): Promise<void> {
    if (typeof window === 'undefined') return;

    // Load reader settings
    try {
      const savedSettings = localStorage.getItem(STORAGE_KEY_SETTINGS);
      if (savedSettings) {
        this.readerSettings.set({ ...DEFAULT_SETTINGS, ...JSON.parse(savedSettings) });
      }
    } catch {
      // ignore
    }

    // Load bookmarks and ratings
    try {
      const savedBookmarks = localStorage.getItem(STORAGE_KEY_BOOKMARKS);
      if (savedBookmarks) {
        this.bookmarkedNovelIds.set(JSON.parse(savedBookmarks));
      }
      const savedRatings = localStorage.getItem(STORAGE_KEY_RATINGS);
      if (savedRatings) {
        this.userRatings.set(JSON.parse(savedRatings));
      }
      const savedHistory = localStorage.getItem(STORAGE_KEY_HISTORY);
      if (savedHistory) {
        this.readHistory.set(JSON.parse(savedHistory));
      }
    } catch {
      // ignore
    }

    // Load novels
    try {
      const savedNovels = localStorage.getItem(STORAGE_KEY_NOVELS);
      if (savedNovels) {
        const parsed: Novel[] = JSON.parse(savedNovels);
        if (parsed && parsed.length >= SAMPLE_NOVELS.length && parsed[0].chapters.length > 0) {
          // Verify that the cached chapters can decode cleanly with the current engine
          const testBytes = base64ToUint8Array(parsed[0].chapters[0].mtxBase64);
          await decompressFromMtx(testBytes);

          // Merge sample publisher/creator details into cached items if missing
          const enriched = parsed.map(n => {
            const raw = SAMPLE_NOVELS.find(s => s.id === n.id);
            if (raw) {
              return {
                ...n,
                authorAvatar: n.authorAvatar || raw.authorAvatar,
                authorCover: n.authorCover || raw.authorCover,
                authorBio: n.authorBio || raw.authorBio,
                translator: n.translator || raw.translator || 'الأصل العربي',
                translatorAvatar: n.translatorAvatar || raw.translatorAvatar,
                translatorCover: n.translatorCover || raw.translatorCover,
                translatorBio: n.translatorBio || raw.translatorBio,
                ratingCount: n.ratingCount || raw.ratingCount || 1420,
              };
            }
            return n;
          });

          this.novels.set(enriched);
          this.selectNovel(enriched[0].id);
          this.isInitialized.set(true);
          return;
        }
      }
    } catch (e) {
      console.warn('Cached novel catalog was outdated or incompatible, auto-resetting:', e);
      try {
        localStorage.removeItem(STORAGE_KEY_NOVELS);
      } catch {
        // ignore
      }
    }

    // If no saved novels or cached were incompatible, re-seed fresh catalog
    await this.seedSampleNovels();
    this.isInitialized.set(true);

    // Sync Firestore bookmarks when user signs in
    onAuthStateChanged(auth, async (u) => {
      if (u) {
        try {
          const bms = await getDocs(collection(db, 'users', u.uid, 'bookmarks'));
          const ids: string[] = [];
          bms.forEach(d => {
            if (d.data()?.['novelId']) ids.push(d.data()['novelId']);
          });
          if (ids.length > 0) {
            const merged = Array.from(new Set([...this.bookmarkedNovelIds(), ...ids]));
            this.bookmarkedNovelIds.set(merged);
            localStorage.setItem(STORAGE_KEY_BOOKMARKS, JSON.stringify(merged));
          }
        } catch (e) {
          console.warn('Could not load user bookmarks from Firestore:', e);
        }
      }
    });
  }

  private async seedSampleNovels(): Promise<void> {
    const generatedNovels: Novel[] = [];

    for (const raw of SAMPLE_NOVELS) {
      const chapters: ChapterSummary[] = [];

      for (const rawCh of raw.chapters) {
        const compression = await compressToMtx(rawCh.content, {
          title: raw.title,
          author: raw.author,
          chapterTitle: rawCh.title,
          chapterIndex: rawCh.chapterIndex,
        });

        // Count Tashkeel marks
        const diacriticsCount = (rawCh.content.match(/[\u064B-\u065F\u0670]/g) || []).length;

        chapters.push({
          id: `ch-${raw.id}-${rawCh.chapterIndex}`,
          chapterIndex: rawCh.chapterIndex,
          title: rawCh.title,
          wordCount: rawCh.content.trim().split(/\s+/).filter(Boolean).length,
          utf8Bytes: compression.originalUtf8Bytes,
          mtxBytes: compression.compressedBytes,
          savingsPercent: compression.savingsPercent,
          mtxBase64: uint8ArrayToBase64(compression.mtxBytes),
          decodingDurationMs: compression.decodingDurationMs,
          isLossless: compression.isLossless,
          diacriticsCount,
        });
      }

      generatedNovels.push({
        id: raw.id,
        title: raw.title,
        author: raw.author,
        authorAvatar: raw.authorAvatar,
        authorCover: raw.authorCover,
        authorBio: raw.authorBio,
        translator: raw.translator || 'فريق مقاتل الروايات',
        translatorAvatar: raw.translatorAvatar,
        translatorCover: raw.translatorCover,
        translatorBio: raw.translatorBio,
        category: raw.category,
        description: raw.description,
        coverGradient: raw.coverGradient,
        accentColor: raw.accentColor,
        rating: raw.rating ?? 4.9,
        ratingCount: raw.ratingCount ?? 1420,
        views: raw.views ?? '100K',
        badge: raw.badge,
        section: raw.section,
        chapters,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        isPreloaded: true,
      });
    }

    this.novels.set(generatedNovels);
    this.persistNovels(generatedNovels);
    if (generatedNovels.length > 0) {
      this.selectNovel(generatedNovels[0].id);
    }
  }

  private persistNovels(list: Novel[]): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(STORAGE_KEY_NOVELS, JSON.stringify(list));
    } catch (err) {
      console.warn('Could not persist novels to localStorage:', err);
    }
  }

  updateReaderSettings(partial: Partial<ReaderSettings>): void {
    const updated = { ...this.readerSettings(), ...partial };
    this.readerSettings.set(updated);
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify(updated));
      } catch {
        // ignore
      }
    }
  }

  selectNovel(novelId: string): void {
    const novel = this.novels().find(n => n.id === novelId) || null;
    this.selectedNovel.set(novel);
    if (novel && novel.chapters.length > 0) {
      this.selectChapter(novel.id, novel.chapters[0].id);
    } else {
      this.selectedChapter.set(null);
      this.currentChapterText.set('');
      this.currentChapterDecompressResult.set(null);
    }
  }

  async selectChapter(novelId: string, chapterId: string): Promise<void> {
    const novel = this.novels().find(n => n.id === novelId);
    if (!novel) return;

    this.selectedNovel.set(novel);
    const chapter = novel.chapters.find(c => c.id === chapterId);
    if (!chapter) return;

    this.selectedChapter.set(chapter);
    this.isDecoding.set(true);

    try {
      // Decode from stored MTX base64 binary
      const mtxBytes = base64ToUint8Array(chapter.mtxBase64);
      const decompressed = await decompressFromMtx(mtxBytes);

      this.currentChapterText.set(decompressed.text);
      this.currentChapterDecompressResult.set(decompressed);
      this.recordReadHistory(novel, chapter);
    } catch (err) {
      console.warn('Error decompressing chapter MTX, attempting auto-heal:', err);
      if (novel.isPreloaded) {
        await this.resetToDefault();
      } else {
        this.currentChapterText.set('تعذر فك ضغط الفصل: صيغة MTX غير صالحة.');
      }
    } finally {
      this.isDecoding.set(false);
    }
  }

  goToNextChapter(): void {
    const novel = this.selectedNovel();
    const current = this.selectedChapter();
    if (!novel || !current) return;

    const currentIndex = novel.chapters.findIndex(c => c.id === current.id);
    if (currentIndex >= 0 && currentIndex < novel.chapters.length - 1) {
      const nextChapter = novel.chapters[currentIndex + 1];
      this.selectChapter(novel.id, nextChapter.id);
    }
  }

  goToPrevChapter(): void {
    const novel = this.selectedNovel();
    const current = this.selectedChapter();
    if (!novel || !current) return;

    const currentIndex = novel.chapters.findIndex(c => c.id === current.id);
    if (currentIndex > 0) {
      const prevChapter = novel.chapters[currentIndex - 1];
      this.selectChapter(novel.id, prevChapter.id);
    }
  }

  toggleBookmark(novelId: string): boolean {
    const current = this.bookmarkedNovelIds();
    const isSaved = current.includes(novelId);
    const updated = isSaved ? current.filter(id => id !== novelId) : [...current, novelId];
    this.bookmarkedNovelIds.set(updated);
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(STORAGE_KEY_BOOKMARKS, JSON.stringify(updated));
      } catch {
        // ignore
      }

      // Sync with Firestore if user is authenticated
      if (auth.currentUser) {
        const bmRef = doc(db, 'users', auth.currentUser.uid, 'bookmarks', novelId);
        if (isSaved) {
          deleteDoc(bmRef).catch(err => console.warn('Could not delete Firestore bookmark:', err));
        } else {
          setDoc(bmRef, {
            userId: auth.currentUser.uid,
            novelId,
            novelTitle: this.novels().find(n => n.id === novelId)?.title || '',
            createdAt: new Date().toISOString(),
          }).catch(err => console.warn('Could not write Firestore bookmark:', err));
        }
      }
    }
    return !isSaved;
  }

  isBookmarked(novelId: string): boolean {
    return this.bookmarkedNovelIds().includes(novelId);
  }

  rateNovel(novelId: string, rating: number): void {
    const previousRatings = this.userRatings();
    const oldRating = previousRatings[novelId];

    // If exact same rating clicked again, do not re-calculate
    if (oldRating === rating) {
      return;
    }

    const ratings = { ...previousRatings, [novelId]: rating };
    this.userRatings.set(ratings);

    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(STORAGE_KEY_RATINGS, JSON.stringify(ratings));
      } catch {
        // ignore
      }

      // Sync rating with Firestore if user is authenticated
      if (auth.currentUser) {
        const ratingRef = doc(db, 'users', auth.currentUser.uid, 'ratings', novelId);
        setDoc(ratingRef, {
          userId: auth.currentUser.uid,
          novelId,
          rating,
          createdAt: new Date().toISOString(),
        }).catch(err => console.warn('Could not save Firestore rating:', err));
      }
    }

    // Update novel average rating accurately (only once per user, avoiding infinite stacking!)
    this.novels.update(list => list.map(n => {
      if (n.id === novelId) {
        const count = n.ratingCount || 1420;
        const currentAvg = n.rating ?? 4.8;
        let newRating = currentAvg;
        let newCount = count;

        if (oldRating !== undefined) {
          // User changed their previous vote: replace old rating with new
          newRating = Math.round(((currentAvg * count - oldRating + rating) / count) * 100) / 100;
        } else {
          // First-time vote from this user: increment count by 1
          newCount = count + 1;
          newRating = Math.round(((currentAvg * count + rating) / newCount) * 100) / 100;
        }

        newRating = Math.min(5, Math.max(1, newRating));
        return { ...n, rating: newRating, ratingCount: newCount };
      }
      return n;
    }));

    if (this.selectedNovel()?.id === novelId) {
      const current = this.selectedNovel();
      if (current) {
        const count = current.ratingCount || 1420;
        const currentAvg = current.rating ?? 4.8;
        let newRating = currentAvg;
        let newCount = count;

        if (oldRating !== undefined) {
          newRating = Math.round(((currentAvg * count - oldRating + rating) / count) * 100) / 100;
        } else {
          newCount = count + 1;
          newRating = Math.round(((currentAvg * count + rating) / newCount) * 100) / 100;
        }

        newRating = Math.min(5, Math.max(1, newRating));
        this.selectedNovel.set({ ...current, rating: newRating, ratingCount: newCount });
      }
    }
  }

  /**
   * Publishes or updates a chapter directly in local storage.
   */
  async publishChapter(
    novelId: string,
    chapterTitle: string,
    content: string,
    novelMeta?: { title: string; author: string; category: string; description: string }
  ): Promise<{ novel: Novel; chapter: ChapterSummary }> {
    this.isEncoding.set(true);

    try {
      let novel = this.novels().find(n => n.id === novelId);

      if (!novel) {
        // Create new novel if doesn't exist
        novel = {
          id: novelId || `novel-${Date.now()}`,
          title: novelMeta?.title || 'رواية جديدة',
          author: novelMeta?.author || 'كاتب مجهول',
          category: novelMeta?.category || 'أدب عام',
          description: novelMeta?.description || 'رواية مضغوطة ومنشورة بصيغة MTX.',
          coverGradient: 'from-amber-900 via-stone-900 to-emerald-950',
          accentColor: '#d97706',
          chapters: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
      }

      const chapterIndex = novel.chapters.length + 1;

      // Compress to MTX
      const result = await compressToMtx(content, {
        title: novel.title,
        author: novel.author,
        chapterTitle: chapterTitle.trim() || `الفصل ${chapterIndex}`,
        chapterIndex,
      });

      const diacriticsCount = (content.match(/[\u064B-\u065F\u0670]/g) || []).length;

      const newChapter: ChapterSummary = {
        id: `ch-${novel.id}-${Date.now()}`,
        chapterIndex,
        title: chapterTitle.trim() || `الفصل ${chapterIndex}`,
        wordCount: content.trim().split(/\s+/).filter(Boolean).length,
        utf8Bytes: result.originalUtf8Bytes,
        mtxBytes: result.compressedBytes,
        savingsPercent: result.savingsPercent,
        mtxBase64: uint8ArrayToBase64(result.mtxBytes),
        decodingDurationMs: result.decodingDurationMs,
        isLossless: result.isLossless,
        diacriticsCount,
      };

      const updatedChapters = [...novel.chapters, newChapter];
      const updatedNovel: Novel = {
        ...novel,
        chapters: updatedChapters,
        updatedAt: new Date().toISOString(),
      };

      const currentNovels = this.novels();
      const existingIdx = currentNovels.findIndex(n => n.id === updatedNovel.id);
      let newNovelsList: Novel[];

      if (existingIdx >= 0) {
        newNovelsList = [...currentNovels];
        newNovelsList[existingIdx] = updatedNovel;
      } else {
        newNovelsList = [updatedNovel, ...currentNovels];
      }

      this.novels.set(newNovelsList);
      this.persistNovels(newNovelsList);

      this.selectedNovel.set(updatedNovel);
      this.selectedChapter.set(newChapter);
      this.currentChapterText.set(content);

      return { novel: updatedNovel, chapter: newChapter };
    } finally {
      this.isEncoding.set(false);
    }
  }

  /**
   * Imports an external .mtx file into the library.
   */
  async importMtxFile(bytes: Uint8Array, fileName: string): Promise<{ novel: Novel; chapter: ChapterSummary }> {
    const decompressed = await decompressFromMtx(bytes);

    const title = decompressed.metadata.title || fileName.replace(/\.mtx$/i, '');
    const author = decompressed.metadata.author || 'كاتب غير محدد';
    const chapterTitle = decompressed.metadata.chapterTitle || 'فصل مستورد';

    // Check if novel with this title already exists
    let novel = this.novels().find(n => n.title.trim() === title.trim());

    if (!novel) {
      novel = {
        id: `novel-import-${Date.now()}`,
        title,
        author,
        category: 'روايات مستوردة (MTX)',
        description: 'رواية تم استيرادها وفك تشفيرها بنجاح من ملف بصيغة MTX.',
        coverGradient: 'from-emerald-950 via-stone-900 to-amber-950',
        accentColor: '#10b981',
        chapters: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
    }

    const diacriticsCount = (decompressed.text.match(/[\u064B-\u065F\u0670]/g) || []).length;
    const chapterIndex = novel.chapters.length + 1;

    const chapter: ChapterSummary = {
      id: `ch-import-${Date.now()}`,
      chapterIndex,
      title: chapterTitle,
      wordCount: decompressed.text.trim().split(/\s+/).filter(Boolean).length,
      utf8Bytes: decompressed.originalUtf8Bytes,
      mtxBytes: decompressed.compressedBytes,
      savingsPercent: decompressed.savingsPercent,
      mtxBase64: uint8ArrayToBase64(bytes),
      decodingDurationMs: decompressed.decodingDurationMs,
      isLossless: decompressed.isLossless,
      diacriticsCount,
    };

    const updatedNovel: Novel = {
      ...novel,
      chapters: [...novel.chapters, chapter],
      updatedAt: new Date().toISOString(),
    };

    const currentNovels = this.novels();
    const existingIdx = currentNovels.findIndex(n => n.id === updatedNovel.id);
    let newNovelsList: Novel[];

    if (existingIdx >= 0) {
      newNovelsList = [...currentNovels];
      newNovelsList[existingIdx] = updatedNovel;
    } else {
      newNovelsList = [updatedNovel, ...currentNovels];
    }

    this.novels.set(newNovelsList);
    this.persistNovels(newNovelsList);

    this.selectNovel(updatedNovel.id);
    this.selectChapter(updatedNovel.id, chapter.id);

    return { novel: updatedNovel, chapter };
  }

  /**
   * Downloads current chapter as .mtx file.
   */
  async downloadCurrentChapter(): Promise<void> {
    const chapter = this.selectedChapter();
    const novel = this.selectedNovel();
    if (!chapter) return;

    const bytes = base64ToUint8Array(chapter.mtxBase64);
    const filename = `${novel?.title || 'رواية'}_${chapter.title}`.replace(/[/\\?%*:|"<>]/g, '_');
    await downloadMtxFile(bytes, filename);
  }

  /**
   * Deletes a novel from catalog.
   */
  deleteNovel(novelId: string): void {
    const filtered = this.novels().filter(n => n.id !== novelId);
    this.novels.set(filtered);
    this.persistNovels(filtered);

    if (this.selectedNovel()?.id === novelId) {
      if (filtered.length > 0) {
        this.selectNovel(filtered[0].id);
      } else {
        this.selectedNovel.set(null);
        this.selectedChapter.set(null);
        this.currentChapterText.set('');
        this.currentChapterDecompressResult.set(null);
      }
    }
  }

  /**
   * Resets and re-seeds sample data.
   */
  async resetToDefault(): Promise<void> {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(STORAGE_KEY_NOVELS);
    }
    await this.seedSampleNovels();
    if (this.novels().length > 0) {
      this.selectNovel(this.novels()[0].id);
    }
  }

  /**
   * Record chapter read in history
   */
  private async recordReadHistory(novel: Novel, chapter: ChapterSummary): Promise<void> {
    const item: ReadHistoryItem = {
      novelId: novel.id,
      novelTitle: novel.title,
      novelCoverGradient: novel.coverGradient,
      novelAuthor: novel.author,
      chapterId: chapter.id,
      chapterIndex: chapter.chapterIndex,
      chapterTitle: chapter.title,
      readAt: new Date().toISOString(),
    };

    const current = this.readHistory();
    const filtered = current.filter(h => !(h.novelId === novel.id && h.chapterId === chapter.id));
    const updated = [item, ...filtered].slice(0, 50);
    this.readHistory.set(updated);

    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(STORAGE_KEY_HISTORY, JSON.stringify(updated));
      } catch {
        // ignore
      }
    }

    const u = auth.currentUser;
    if (u) {
      try {
        const histDocId = `${novel.id}_${chapter.id}`.replace(/[^a-zA-Z0-9_-]/g, '_');
        await setDoc(doc(db, 'users', u.uid, 'history', histDocId), {
          ...item,
          userId: u.uid,
        });
      } catch (err) {
        console.warn('Could not sync read chapter to Firestore history:', err);
      }
    }
  }

  /**
   * Clear all reading history
   */
  clearReadHistory(): void {
    this.readHistory.set([]);
    if (typeof window !== 'undefined') {
      localStorage.removeItem(STORAGE_KEY_HISTORY);
    }
  }

  /**
   * Load comments for a specific chapter
   */
  async loadChapterComments(chapterId: string): Promise<void> {
    try {
      const local = typeof window !== 'undefined' ? localStorage.getItem(`${STORAGE_KEY_COMMENTS}_${chapterId}`) : null;
      if (local) {
        this.chapterComments.set(JSON.parse(local));
      }

      const colSnap = await getDocs(collection(db, 'comments'));
      const list: ChapterComment[] = [];
      colSnap.forEach(d => {
        const data = d.data();
        if (data?.['chapterId'] === chapterId) {
          list.push({
            id: d.id,
            novelId: data['novelId'] || '',
            chapterId: data['chapterId'],
            userId: data['userId'] || '',
            userName: data['userName'] || 'قارئ',
            userAvatar: data['userAvatar'] || '',
            userCover: data['userCover'] || '',
            text: data['text'] || '',
            createdAt: data['createdAt'] || new Date().toISOString(),
            likes: data['likes'] || 0,
          });
        }
      });

      if (list.length > 0) {
        list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        this.chapterComments.set(list);
        if (typeof window !== 'undefined') {
          localStorage.setItem(`${STORAGE_KEY_COMMENTS}_${chapterId}`, JSON.stringify(list));
        }
      } else if (!local) {
        const sample: ChapterComment[] = [
          {
            id: `c-sample-1-${chapterId}`,
            novelId: this.selectedNovel()?.id || '',
            chapterId,
            userId: 'user_warrior_1',
            userName: 'فارس الحكايات',
            userAvatar: '',
            userCover: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=1500&auto=format&fit=crop',
            text: 'فصل ملحمي بكل معنى الكلمة! الترجمة ممتازة والصياغة العربية بديعة للغاية.',
            createdAt: new Date(Date.now() - 3600000 * 4).toISOString(),
            likes: 12,
          },
          {
            id: `c-sample-2-${chapterId}`,
            novelId: this.selectedNovel()?.id || '',
            chapterId,
            userId: 'user_warrior_2',
            userName: 'صقر الروايات',
            userAvatar: '',
            userCover: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?q=80&w=1500&auto=format&fit=crop',
            text: 'أحببت تطور الأحداث في هذا الفصل، شكراً لمقاتل الروايات على راحة القراءة.',
            createdAt: new Date(Date.now() - 3600000 * 18).toISOString(),
            likes: 8,
          }
        ];
        this.chapterComments.set(sample);
      }
    } catch (e) {
      console.warn('Could not fetch chapter comments:', e);
    }
  }

  /**
   * Add a new comment to a chapter
   */
  async addChapterComment(
    novelId: string,
    chapterId: string,
    text: string,
    user: { uid: string; displayName: string; photoURL: string; coverURL: string }
  ): Promise<boolean> {
    if (!text.trim()) return false;

    const commentId = `cm_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const comment: ChapterComment = {
      id: commentId,
      novelId,
      chapterId,
      userId: user.uid,
      userName: user.displayName || 'قارئ مقاتل',
      userAvatar: user.photoURL || '',
      userCover: user.coverURL || '',
      text: text.trim(),
      createdAt: new Date().toISOString(),
      likes: 0,
    };

    const updated = [comment, ...this.chapterComments()];
    this.chapterComments.set(updated);
    if (typeof window !== 'undefined') {
      localStorage.setItem(`${STORAGE_KEY_COMMENTS}_${chapterId}`, JSON.stringify(updated));
    }

    try {
      await setDoc(doc(db, 'comments', commentId), comment);
    } catch (err) {
      console.warn('Could not persist comment to Firestore:', err);
    }

    return true;
  }

  /**
   * Like a chapter comment
   */
  async likeChapterComment(commentId: string, chapterId: string): Promise<void> {
    const list = this.chapterComments().map(c => {
      if (c.id === commentId) {
        return { ...c, likes: c.likes + 1 };
      }
      return c;
    });
    this.chapterComments.set(list);
    if (typeof window !== 'undefined') {
      localStorage.setItem(`${STORAGE_KEY_COMMENTS}_${chapterId}`, JSON.stringify(list));
    }
  }

  /**
   * Delete a chapter comment
   */
  async deleteChapterComment(commentId: string, chapterId: string): Promise<void> {
    const list = this.chapterComments().filter(c => c.id !== commentId);
    this.chapterComments.set(list);
    if (typeof window !== 'undefined') {
      localStorage.setItem(`${STORAGE_KEY_COMMENTS}_${chapterId}`, JSON.stringify(list));
    }
  }
}
