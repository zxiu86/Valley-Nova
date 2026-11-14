import { Injectable, OnDestroy, PLATFORM_ID, computed, inject, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import {
  ChapterBlock,
  ChapterConflictState,
  ChapterEndStatus,
  ChapterLanguageEdition,
  ChapterLanguageMode,
  ChapterType,
  CorridorId,
  LocalChapterAutosave,
  LocalNovelDraft,
  LogicalChapter,
  NovelSection,
  NovelStatus,
  PublishedNovelRecord,
  WorkReport,
  WorkType,
} from '../models/library.models';
import {
  blocksToPlainText,
  countWords,
  exportNovelToMtxArchive,
  NovelMtxExportResult,
  parseAndValidateMtxArchive,
  verifyExportedMtxBytes,
} from '../mtx-novel-archive';
import {
  checkChapterSlotExists,
  createChapterWithSlotTransaction,
  deleteChapterWithSlotTransaction,
  deleteNovelSection,
  deleteNovelTreeFromFirestore,
  fetchAuthorPublishedNovels,
  fetchModeratedNovelsForAdmin,
  fetchNovelByIdFromFirestore,
  fetchNovelChapters,
  fetchNovelSections,
  fetchWorkReportsForAdmin,
  importFullNovelArchiveToFirestore,
  publishNovelToFirestore,
  recomputeNovelStatsInFirestore,
  resolveReportKeepNovelAsAdmin,
  resolveReportRemoveNovelAsAdmin,
  updateChapterWithRevisionTransaction,
  updateNovelRecordInFirestore,
  uploadNovelCoverAsset,
  upsertNovelSection,
} from '../mtx-firebase';
import { AccountService, CroppedImageDraft } from './account.service';
import { I18nService } from './i18n.service';

export const LOCAL_NOVEL_DRAFTS_KEY = 'mtx_writer_local_novels_v1';
export const LOCAL_CHAPTER_AUTOSAVE_KEY = 'mtx_writer_chapter_autosave_v1';
export const LOCAL_CHAPTER_PENDING_SYNC_KEY = 'mtx_writer_pending_sync_v1';

@Injectable({ providedIn: 'root' })
export class WriterStudioService implements OnDestroy {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly accountService = inject(AccountService);
  private readonly i18n = inject(I18nService);

  // Author's cloud works (published, drafts, under_review, removed) & strictly-local drafts
  readonly ownNovels = signal<PublishedNovelRecord[]>([]);
  readonly localDrafts = signal<LocalNovelDraft[]>([]);
  readonly activeNovelId = signal<string | null>(null);
  readonly activeSections = signal<NovelSection[]>([]);
  readonly activeChapters = signal<LogicalChapter[]>([]);

  // Public cache of loaded Firestore sections & chapters keyed by novelId
  readonly publicNovelDetailsCache = signal<
    Record<string, { sections: NovelSection[]; chapters: LogicalChapter[] }>
  >({});

  // Dashboard filter & status signals
  readonly wordFilter = signal<'all' | 'ar' | 'en'>('all');
  readonly isLoading = signal<boolean>(false);
  readonly isBusy = signal<boolean>(false);
  readonly isOnline = signal<boolean>(true);
  readonly errorMessage = signal<string | null>(null);
  readonly successMessage = signal<string | null>(null);

  // Local Autosave, Offline Queue & Optimistic Conflict Resolution
  readonly autosaveMap = signal<Record<string, LocalChapterAutosave>>({});
  readonly pendingSyncQueue = signal<LocalChapterAutosave[]>([]);
  readonly conflictState = signal<ChapterConflictState | null>(null);

  // Verified .mtx Delete Gate
  readonly deleteGateNovel = signal<PublishedNovelRecord | null>(null);
  readonly deleteGateStatus = signal<'idle' | 'exporting' | 'verifying' | 'ready' | 'deleting' | 'error'>('idle');
  readonly deleteGateError = signal<string | null>(null);
  readonly deleteGateArchiveInfo = signal<{
    filename: string;
    sha256: string;
    chapterCount: number;
    sectionCount: number;
  } | null>(null);

  // Founder / Admin Moderation Queue
  readonly workReports = signal<WorkReport[]>([]);
  readonly moderatedNovels = signal<PublishedNovelRecord[]>([]);
  readonly adminLoading = signal<boolean>(false);

  // Computed Active Novel
  readonly activeNovel = computed<PublishedNovelRecord | null>(() => {
    const id = this.activeNovelId();
    if (!id) return null;
    return this.ownNovels().find((n) => n.id === id) || null;
  });

  // Real Aggregated Writer KPIs (No fake/placeholder metrics)
  readonly publishedWorksCount = computed<number>(
    () =>
      this.ownNovels().filter(
        (n) => n.isPublished === true && n.moderationStatus !== 'rejected_removed'
      ).length
  );

  readonly publishedChaptersCount = computed<number>(() =>
    this.ownNovels().reduce((sum, n) => sum + (n.publishedChapterCount || 0), 0)
  );

  readonly publishedWordsCount = computed<number>(() => {
    const mode = this.wordFilter();
    return this.ownNovels().reduce((sum, n) => {
      if (mode === 'ar') return sum + (n.publishedWordsAr || 0);
      if (mode === 'en') return sum + (n.publishedWordsEn || 0);
      return sum + (n.publishedWordsAr || 0) + (n.publishedWordsEn || 0);
    }, 0);
  });

  readonly verifiedReadsTotal = computed<number>(() =>
    this.ownNovels().reduce((sum, n) => sum + (n.verifiedReadsCount || 0), 0)
  );

  private onlineListener: (() => void) | null = null;
  private offlineListener: (() => void) | null = null;
  private initializedListeners = false;

  constructor() {
    this.restoreLocalStorageState();
    this.bindNetworkListeners();
  }

  ngOnDestroy(): void {
    if (isPlatformBrowser(this.platformId) && typeof window !== 'undefined') {
      if (this.onlineListener) {
        window.removeEventListener('online', this.onlineListener);
        this.onlineListener = null;
      }
      if (this.offlineListener) {
        window.removeEventListener('offline', this.offlineListener);
        this.offlineListener = null;
      }
    }
  }

  private bindNetworkListeners(): void {
    if (this.initializedListeners || !isPlatformBrowser(this.platformId) || typeof window === 'undefined') {
      return;
    }
    this.initializedListeners = true;
    this.isOnline.set(typeof navigator !== 'undefined' ? navigator.onLine : true);

    this.onlineListener = () => {
      this.isOnline.set(true);
      const uid = this.accountService.ownProfile()?.uid;
      if (uid) {
        void this.flushPendingOfflineSync(uid);
      }
    };
    this.offlineListener = () => {
      this.isOnline.set(false);
    };

    window.addEventListener('online', this.onlineListener);
    window.addEventListener('offline', this.offlineListener);
  }

  private restoreLocalStorageState(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    try {
      const draftsRaw = localStorage.getItem(LOCAL_NOVEL_DRAFTS_KEY);
      if (draftsRaw) {
        const parsed = JSON.parse(draftsRaw);
        if (Array.isArray(parsed)) {
          this.localDrafts.set(parsed as LocalNovelDraft[]);
        }
      }
    } catch {
      this.localDrafts.set([]);
    }

    try {
      const autoRaw = localStorage.getItem(LOCAL_CHAPTER_AUTOSAVE_KEY);
      if (autoRaw) {
        const parsed = JSON.parse(autoRaw);
        if (parsed && typeof parsed === 'object') {
          this.autosaveMap.set(parsed as Record<string, LocalChapterAutosave>);
        }
      }
    } catch {
      this.autosaveMap.set({});
    }

    try {
      const queueRaw = localStorage.getItem(LOCAL_CHAPTER_PENDING_SYNC_KEY);
      if (queueRaw) {
        const parsed = JSON.parse(queueRaw);
        if (Array.isArray(parsed)) {
          this.pendingSyncQueue.set(parsed as LocalChapterAutosave[]);
        }
      }
    } catch {
      this.pendingSyncQueue.set([]);
    }
  }

  private persistLocalDrafts(list: LocalNovelDraft[]): void {
    this.localDrafts.set(list);
    if (!isPlatformBrowser(this.platformId)) return;
    try {
      localStorage.setItem(LOCAL_NOVEL_DRAFTS_KEY, JSON.stringify(list));
    } catch {
      // Ignore storage quota warning
    }
  }

  private persistAutosaveMap(nextMap: Record<string, LocalChapterAutosave>): void {
    this.autosaveMap.set(nextMap);
    if (!isPlatformBrowser(this.platformId)) return;
    try {
      localStorage.setItem(LOCAL_CHAPTER_AUTOSAVE_KEY, JSON.stringify(nextMap));
    } catch {
      // Ignore storage quota warning
    }
  }

  private persistPendingSyncQueue(nextQueue: LocalChapterAutosave[]): void {
    this.pendingSyncQueue.set(nextQueue);
    if (!isPlatformBrowser(this.platformId)) return;
    try {
      localStorage.setItem(LOCAL_CHAPTER_PENDING_SYNC_KEY, JSON.stringify(nextQueue));
    } catch {
      // Ignore storage quota warning
    }
  }

  clearMessages(): void {
    this.errorMessage.set(null);
    this.successMessage.set(null);
  }

  // ================= WORKSPACE & AUTHOR WORKS LOADING ================= //

  async loadStudioForAuthor(authorId: string): Promise<void> {
    if (!authorId || !isPlatformBrowser(this.platformId)) return;
    this.isLoading.set(true);
    this.errorMessage.set(null);
    try {
      const works = await fetchAuthorPublishedNovels(authorId, true);
      works.sort((a, b) => (b.updatedAt || '').localeCompare(a.updatedAt || ''));
      this.ownNovels.set(works);

      const currentActive = this.activeNovelId();
      if (currentActive && works.some((w) => w.id === currentActive)) {
        await this.loadNovelWorkspace(currentActive);
      } else if (works.length > 0 && !currentActive) {
        this.activeNovelId.set(works[0].id);
        await this.loadNovelWorkspace(works[0].id);
      }
    } catch (err) {
      this.errorMessage.set(err instanceof Error ? err.message : 'تعذر تحميل بيانات استوديو الكاتب.');
    } finally {
      this.isLoading.set(false);
    }
  }

  async loadNovelWorkspace(novelId: string): Promise<void> {
    if (!novelId) return;
    this.activeNovelId.set(novelId);
    this.isLoading.set(true);
    try {
      const [sections, chapters] = await Promise.all([
        fetchNovelSections(novelId),
        fetchNovelChapters(novelId, true),
      ]);
      this.activeSections.set(sections);
      this.activeChapters.set(chapters);
      this.publicNovelDetailsCache.update((prev) => ({
        ...prev,
        [novelId]: {
          sections,
          chapters: chapters.filter((c) => c.isPublished === true),
        },
      }));
    } catch (err) {
      this.errorMessage.set(err instanceof Error ? err.message : 'تعذر تحميل أقسام وفصول الرواية.');
    } finally {
      this.isLoading.set(false);
    }
  }

  /**
   * Loads sections & published chapters for public Details & Reading pages.
   */
  async loadPublicNovelContent(
    novelId: string,
    forceRefresh = false
  ): Promise<{ sections: NovelSection[]; chapters: LogicalChapter[] }> {
    const cached = this.publicNovelDetailsCache()[novelId];
    if (cached && !forceRefresh) {
      return cached;
    }
    const [sections, chapters] = await Promise.all([
      fetchNovelSections(novelId).catch(() => []),
      fetchNovelChapters(novelId, false).catch(() => []),
    ]);
    const payload = { sections, chapters };
    this.publicNovelDetailsCache.update((prev) => ({ ...prev, [novelId]: payload }));
    return payload;
  }

  // ================= STRICTLY LOCAL NOVEL DRAFTS ================= //

  saveLocalNovelDraft(
    payload: Omit<LocalNovelDraft, 'localId' | 'updatedAt'> & { localId?: string }
  ): LocalNovelDraft {
    const now = new Date().toISOString();
    const localId = payload.localId || `local_draft_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    const draft: LocalNovelDraft = {
      ...payload,
      localId,
      updatedAt: now,
    };
    const filtered = this.localDrafts().filter((d) => d.localId !== localId);
    this.persistLocalDrafts([draft, ...filtered]);
    this.successMessage.set(
      this.i18n.lang() === 'en'
        ? 'Draft saved locally on this device (not uploaded to server).'
        : 'تم حفظ المسودة محلياً على جهازك فقط (لم تُرفع للخادم).'
    );
    return draft;
  }

  deleteLocalNovelDraft(localId: string): void {
    const next = this.localDrafts().filter((d) => d.localId !== localId);
    this.persistLocalDrafts(next);
  }

  async publishLocalDraftToCloud(
    localId: string,
    authorId: string,
    authorName: string,
    coverDraft?: CroppedImageDraft | null
  ): Promise<PublishedNovelRecord | null> {
    const draft = this.localDrafts().find((d) => d.localId === localId);
    if (!draft) return null;

    const record = await this.saveCloudNovel({
      authorId,
      authorName,
      title: draft.title,
      titleEn: draft.titleEn,
      workType: draft.workType,
      originalAuthor: draft.originalAuthor,
      firstAuthor: draft.firstAuthor,
      supportMethod: draft.supportMethod,
      novelStatus: draft.novelStatus,
      categoryGroup: draft.categoryGroup,
      genre: draft.genre,
      originLanguage: draft.originLanguage,
      languageCode: draft.languageCode,
      description: draft.description,
      coverUrl: draft.coverUrl,
      tags: draft.tags,
      coverDraft: coverDraft || null,
      isPublished: true,
    });

    if (record) {
      // Transfer any local sections & chapters from the draft
      const sectionIdMap = new Map<string, string>();
      for (let i = 0; i < draft.sections.length; i++) {
        const s = draft.sections[i];
        const newSecId = `sec_${Date.now()}_${i}`;
        sectionIdMap.set(s.id, newSecId);
        await upsertNovelSection({
          id: newSecId,
          novelId: record.id,
          authorId,
          title: s.title,
          titleEn: s.titleEn,
          orderIndex: s.orderIndex ?? i,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
      }

      for (let i = 0; i < draft.chapters.length; i++) {
        const ch = draft.chapters[i];
        await createChapterWithSlotTransaction({
          id: `ch_${ch.chapterNumber}_${Date.now()}_${i}`,
          novelId: record.id,
          authorId,
          chapterNumber: ch.chapterNumber,
          title: ch.title,
          titleEn: ch.titleEn,
          sectionId: ch.sectionId ? sectionIdMap.get(ch.sectionId) : undefined,
          chapterType: ch.chapterType,
          endStatus: ch.endStatus,
          languageMode: ch.languageMode,
          editions: ch.editions,
          wordCountAr: ch.editions.ar?.wordCount || 0,
          wordCountEn: ch.editions.en?.wordCount || 0,
          isPublished: true,
          revision: 1,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
      }

      await recomputeNovelStatsInFirestore(record.id);
      this.deleteLocalNovelDraft(localId);
      await this.loadStudioForAuthor(authorId);
      await this.loadNovelWorkspace(record.id);
    }

    return record;
  }

  // ================= CLOUD NOVEL CREATE / EDIT ================= //

  async saveCloudNovel(input: {
    novelId?: string | null;
    authorId: string;
    authorName: string;
    title: string;
    titleEn?: string;
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
    coverDraft?: CroppedImageDraft | null;
    isPublished?: boolean;
  }): Promise<PublishedNovelRecord | null> {
    const isEn = this.i18n.lang() === 'en';
    this.errorMessage.set(null);
    this.successMessage.set(null);

    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      this.errorMessage.set(
        isEn
          ? 'You are offline. Save your novel as a local draft instead.'
          : 'أنت غير متصل بالإنترنت حالياً. احفظ الرواية كمسودة محلية وسننشرها عند عودة الاتصال.'
      );
      return null;
    }

    const cleanTitle = input.title.trim();
    const cleanDesc = input.description.trim();
    if (cleanTitle.length < 2 || cleanDesc.length < 10) {
      this.errorMessage.set(
        isEn
          ? 'Please enter a valid novel title and synopsis (at least 10 characters).'
          : 'يرجى إدخال عنوان الرواية وملخص أدبي لا يقل عن ١٠ أحرف.'
      );
      return null;
    }

    if (input.workType === 'translated' && !input.originalAuthor?.trim()) {
      this.errorMessage.set(
        isEn
          ? 'Original author name is required for translated works.'
          : 'اسم الكاتب الأصلي إلزامي للأعمال المترجمة.'
      );
      return null;
    }

    if (input.workType === 'republish' && !input.firstAuthor?.trim()) {
      this.errorMessage.set(
        isEn
          ? 'Original / first author attribution is required for republished works.'
          : 'توثيق اسم المؤلف الأول إلزامي عند إعادة النشر.'
      );
      return null;
    }

    this.isBusy.set(true);
    try {
      const targetId = input.novelId || `novel_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
      let finalCoverUrl = (input.coverUrl || '').trim() || '/images/writers_sanctuary_bg.jpg';

      if (input.coverDraft?.blob && input.coverDraft.previewDataUrl) {
        finalCoverUrl = await uploadNovelCoverAsset(
          input.authorId,
          targetId,
          input.coverDraft.blob,
          input.coverDraft.previewDataUrl,
          input.coverUrl
        );
      }

      const now = new Date().toISOString();
      const existing = input.novelId ? this.ownNovels().find((n) => n.id === input.novelId) : null;

      let savedRecord: PublishedNovelRecord;
      if (existing) {
        savedRecord = await updateNovelRecordInFirestore(existing.id, {
          title: cleanTitle,
          ...(input.titleEn?.trim() ? { titleEn: input.titleEn.trim() } : { titleEn: '' }),
          authorName: input.authorName.trim() || existing.authorName,
          workType: input.workType,
          originalAuthor: input.workType === 'translated' ? input.originalAuthor?.trim() : '',
          firstAuthor: input.workType === 'republish' ? input.firstAuthor?.trim() : '',
          supportMethod: input.supportMethod?.trim() || '',
          novelStatus: input.novelStatus,
          categoryGroup: input.categoryGroup,
          genre: input.genre.trim() || 'رواية أدبية معاصرة',
          originLanguage: input.originLanguage || existing.originLanguage || 'عربي أصيل',
          languageCode: input.languageCode || existing.languageCode || 'ar',
          description: cleanDesc,
          coverUrl: finalCoverUrl,
          tags: input.tags || existing.tags || [],
          isPublished: existing.moderationStatus === 'rejected_removed' ? false : (input.isPublished ?? existing.isPublished),
        });
      } else {
        const newDoc: PublishedNovelRecord = {
          id: targetId,
          title: cleanTitle,
          ...(input.titleEn?.trim() ? { titleEn: input.titleEn.trim() } : {}),
          authorId: input.authorId,
          authorName: input.authorName.trim() || 'كاتب معتمد',
          workType: input.workType,
          ...(input.workType === 'translated' && input.originalAuthor?.trim()
            ? { originalAuthor: input.originalAuthor.trim() }
            : {}),
          ...(input.workType === 'republish' && input.firstAuthor?.trim()
            ? { firstAuthor: input.firstAuthor.trim() }
            : {}),
          ...(input.supportMethod?.trim() ? { supportMethod: input.supportMethod.trim() } : {}),
          novelStatus: input.novelStatus,
          moderationStatus: 'active',
          reportCount: 0,
          verifiedReadsCount: 0,
          publishedChapterCount: 0,
          publishedWordsAr: 0,
          publishedWordsEn: 0,
          genre: input.genre.trim() || 'رواية أدبية معاصرة',
          categoryGroup: input.categoryGroup,
          coverUrl: finalCoverUrl,
          description: cleanDesc,
          readingHours: 1,
          originLanguage: input.originLanguage || 'عربي أصيل',
          languageCode: input.languageCode || 'ar',
          ...(input.tags?.length ? { tags: input.tags } : {}),
          isPublished: input.isPublished ?? true,
          createdAt: now,
          updatedAt: now,
        };
        savedRecord = await publishNovelToFirestore(newDoc);
      }

      this.ownNovels.update((list) => {
        const rest = list.filter((n) => n.id !== savedRecord.id);
        return [savedRecord, ...rest];
      });
      this.accountService.ownPublishedNovels.update((list) => {
        const rest = list.filter((n) => n.id !== savedRecord.id);
        return savedRecord.isPublished ? [savedRecord, ...rest] : rest;
      });
      this.activeNovelId.set(savedRecord.id);

      this.successMessage.set(
        existing
          ? isEn
            ? 'Novel details updated cleanly.'
            : 'تم تحديث بيانات الرواية في قاعدة البيانات بنجاح.'
          : isEn
            ? 'Novel created! You can now add sections and chapters.'
            : 'تم إنشاء الرواية واعتمادها! يمكنك الآن إدارة الأقسام والفصول.'
      );
      return savedRecord;
    } catch (err) {
      this.errorMessage.set(
        err instanceof Error ? err.message : isEn ? 'Could not save novel.' : 'تعذر حفظ بيانات الرواية.'
      );
      return null;
    } finally {
      this.isBusy.set(false);
    }
  }

  // ================= SECTIONS CRUD ================= //

  async saveSection(
    novelId: string,
    authorId: string,
    payload: { id?: string; title: string; titleEn?: string; orderIndex?: number }
  ): Promise<NovelSection | null> {
    const cleanTitle = payload.title.trim();
    if (!cleanTitle) {
      this.errorMessage.set(
        this.i18n.lang() === 'en' ? 'Section title is required.' : 'يرجى إدخال عنوان القسم أو المجلد.'
      );
      return null;
    }
    const existing = payload.id ? this.activeSections().find((s) => s.id === payload.id) : null;
    const now = new Date().toISOString();
    const sec: NovelSection = {
      id: existing?.id || `sec_${Date.now()}_${Math.random().toString(36).slice(2, 5)}`,
      novelId,
      authorId,
      title: cleanTitle,
      ...(payload.titleEn?.trim() ? { titleEn: payload.titleEn.trim() } : {}),
      orderIndex: payload.orderIndex ?? existing?.orderIndex ?? this.activeSections().length,
      createdAt: existing?.createdAt || now,
      updatedAt: now,
    };

    try {
      const saved = await upsertNovelSection(sec);
      this.activeSections.update((list) => {
        const filtered = list.filter((s) => s.id !== saved.id);
        return [...filtered, saved].sort((a, b) => a.orderIndex - b.orderIndex);
      });
      this.successMessage.set(
        this.i18n.lang() === 'en' ? 'Section saved.' : 'تم حفظ القسم بنجاح.'
      );
      return saved;
    } catch (err) {
      this.errorMessage.set(err instanceof Error ? err.message : 'تعذر حفظ القسم.');
      return null;
    }
  }

  async moveSectionOrder(novelId: string, sectionId: string, direction: 'up' | 'down'): Promise<void> {
    const current = [...this.activeSections()].sort((a, b) => a.orderIndex - b.orderIndex);
    const idx = current.findIndex((s) => s.id === sectionId);
    if (idx === -1) return;
    const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= current.length) return;

    const a = { ...current[idx], orderIndex: swapIdx };
    const b = { ...current[swapIdx], orderIndex: idx };
    const reordered = [...current];
    reordered[idx] = b;
    reordered[swapIdx] = a;
    this.activeSections.set(reordered.map((s, i) => ({ ...s, orderIndex: i })));

    await Promise.all([
      upsertNovelSection({ ...a, novelId }),
      upsertNovelSection({ ...b, novelId }),
    ]).catch(() => undefined);
  }

  async removeSection(novelId: string, sectionId: string): Promise<void> {
    try {
      await deleteNovelSection(novelId, sectionId);
      this.activeSections.update((list) => list.filter((s) => s.id !== sectionId));
      this.successMessage.set(
        this.i18n.lang() === 'en' ? 'Section removed.' : 'تم حذف القسم (بقيت الفصول محفوظة بدون قسم).'
      );
    } catch (err) {
      this.errorMessage.set(err instanceof Error ? err.message : 'تعذر حذف القسم.');
    }
  }

  // ================= CHAPTER UNIQUENESS, CRUD, AUTOSAVE & CONFLICT ================= //

  async isDuplicateChapterNumber(
    novelId: string,
    chapterNumber: number,
    editingChapterId?: string | null
  ): Promise<boolean> {
    if (!novelId || !Number.isInteger(chapterNumber) || chapterNumber < 1) return false;
    const localMatch = this.activeChapters().find(
      (c) => c.chapterNumber === chapterNumber && c.id !== editingChapterId
    );
    if (localMatch) return true;

    if (editingChapterId) {
      const existingSame = this.activeChapters().find((c) => c.id === editingChapterId);
      if (existingSame && existingSame.chapterNumber === chapterNumber) {
        return false;
      }
    }

    return checkChapterSlotExists(novelId, chapterNumber);
  }

  buildEdition(title: string, blocks: ChapterBlock[], existingUpdatedAt?: string): ChapterLanguageEdition | undefined {
    const cleanBlocks = blocks.filter((b) => b.type === 'divider' || b.text.trim().length > 0);
    const plainText = blocksToPlainText(cleanBlocks);
    const wordCount = countWords(plainText);
    if (!title.trim() && wordCount === 0) {
      return undefined;
    }
    return {
      title: title.trim(),
      blocks: cleanBlocks,
      plainText,
      wordCount,
      updatedAt: existingUpdatedAt || new Date().toISOString(),
    };
  }

  saveChapterAutosave(snapshot: LocalChapterAutosave): void {
    const next = {
      ...this.autosaveMap(),
      [snapshot.key]: snapshot,
    };
    this.persistAutosaveMap(next);
  }

  getChapterAutosave(key: string): LocalChapterAutosave | null {
    return this.autosaveMap()[key] || null;
  }

  clearChapterAutosave(key: string): void {
    const next = { ...this.autosaveMap() };
    delete next[key];
    this.persistAutosaveMap(next);
  }

  private queuePendingOfflineChapter(snapshot: LocalChapterAutosave): void {
    const queued: LocalChapterAutosave = {
      ...snapshot,
      pendingSync: true,
      savedAt: new Date().toISOString(),
    };
    const rest = this.pendingSyncQueue().filter((item) => item.key !== queued.key);
    this.persistPendingSyncQueue([queued, ...rest]);
    this.saveChapterAutosave(queued);
  }

  async flushPendingOfflineSync(authorId: string): Promise<number> {
    if (!isPlatformBrowser(this.platformId) || (typeof navigator !== 'undefined' && !navigator.onLine)) {
      return 0;
    }
    const queue = [...this.pendingSyncQueue()];
    if (queue.length === 0) return 0;

    let synced = 0;
    const remaining: LocalChapterAutosave[] = [];
    for (const item of queue) {
      const res = await this.saveChapter({
        novelId: item.novelId,
        authorId,
        chapterId: item.chapterId,
        chapterNumber: item.chapterNumber,
        title: item.title,
        titleEn: item.titleEn,
        sectionId: item.sectionId,
        chapterType: item.chapterType,
        endStatus: item.endStatus,
        languageMode: item.languageMode,
        arTitle: item.arTitle,
        arBlocks: item.arBlocks,
        enTitle: item.enTitle,
        enBlocks: item.enBlocks,
        isPublished: true,
        expectedRevision: item.baseRevision,
      });
      if (res.status === 'saved') {
        synced++;
      } else {
        remaining.push(item);
      }
    }
    this.persistPendingSyncQueue(remaining);
    if (synced > 0) {
      this.successMessage.set(
        this.i18n.lang() === 'en'
          ? `Synced ${synced} offline chapter change(s) to cloud.`
          : `تمت مزامنة ${synced} تعديلات فصول محفوظة مع قاعدة البيانات تلقائياً.`
      );
    }
    return synced;
  }

  async saveChapter(input: {
    novelId: string;
    authorId: string;
    chapterId?: string | null;
    chapterNumber: number;
    title: string;
    titleEn?: string;
    sectionId?: string;
    chapterType: ChapterType;
    endStatus: ChapterEndStatus;
    languageMode: ChapterLanguageMode;
    arTitle: string;
    arBlocks: ChapterBlock[];
    enTitle: string;
    enBlocks: ChapterBlock[];
    isPublished: boolean;
    expectedRevision?: number;
    forceOverwrite?: boolean;
  }): Promise<
    | { status: 'saved'; chapter: LogicalChapter }
    | { status: 'queued_offline' }
    | { status: 'duplicate' }
    | { status: 'conflict' }
    | { status: 'error'; message: string }
  > {
    const isEn = this.i18n.lang() === 'en';
    this.errorMessage.set(null);
    this.successMessage.set(null);

    const arEdition =
      input.languageMode === 'ar' || input.languageMode === 'both'
        ? this.buildEdition(input.arTitle || input.title, input.arBlocks)
        : undefined;
    const enEdition =
      input.languageMode === 'en' || input.languageMode === 'both'
        ? this.buildEdition(input.enTitle || input.titleEn || input.title, input.enBlocks)
        : undefined;

    if (!arEdition && !enEdition) {
      const msg = isEn
        ? 'Write at least one paragraph in the selected language edition before saving.'
        : 'يرجى كتابة نص الفصل في اللغة المحددة قبل الحفظ أو النشر.';
      this.errorMessage.set(msg);
      return { status: 'error', message: msg };
    }

    const autosaveKey = input.chapterId || `${input.novelId}__new_${input.chapterNumber}`;
    const snapshot: LocalChapterAutosave = {
      key: autosaveKey,
      novelId: input.novelId,
      chapterId: input.chapterId || null,
      chapterNumber: input.chapterNumber,
      title: input.title,
      titleEn: input.titleEn || '',
      sectionId: input.sectionId || '',
      chapterType: input.chapterType,
      endStatus: input.endStatus,
      languageMode: input.languageMode,
      arTitle: input.arTitle,
      arBlocks: input.arBlocks,
      enTitle: input.enTitle,
      enBlocks: input.enBlocks,
      baseRevision: input.expectedRevision || 1,
      savedAt: new Date().toISOString(),
    };

    // Offline protection: never lose text
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      this.queuePendingOfflineChapter(snapshot);
      this.successMessage.set(
        isEn
          ? 'Offline: Chapter edits saved locally and queued for automatic cloud sync.'
          : 'انقطع الاتصال: تم حفظ نص الفصل محلياً في طابور المزامنة الآلي دون أي فقدان.'
      );
      return { status: 'queued_offline' };
    }

    // Check unique chapter number when creating new
    if (!input.chapterId) {
      const exists = await this.isDuplicateChapterNumber(input.novelId, input.chapterNumber, null);
      if (exists) {
        this.errorMessage.set('هذا الفصل موجود');
        return { status: 'duplicate' };
      }
    }

    this.isBusy.set(true);
    try {
      const now = new Date().toISOString();
      const editions: LogicalChapter['editions'] = {
        ...(arEdition ? { ar: arEdition } : {}),
        ...(enEdition ? { en: enEdition } : {}),
      };

      const chapterPayload: LogicalChapter = {
        id: input.chapterId || `ch_${input.chapterNumber}_${Date.now()}`,
        novelId: input.novelId,
        authorId: input.authorId,
        chapterNumber: input.chapterNumber,
        title: input.title.trim() || arEdition?.title || enEdition?.title || `الفصل ${input.chapterNumber}`,
        ...(input.titleEn?.trim() ? { titleEn: input.titleEn.trim() } : {}),
        ...(input.sectionId?.trim() ? { sectionId: input.sectionId.trim() } : {}),
        chapterType: input.chapterType,
        endStatus: input.endStatus,
        languageMode: input.languageMode,
        editions,
        wordCountAr: arEdition?.wordCount || 0,
        wordCountEn: enEdition?.wordCount || 0,
        isPublished: input.isPublished,
        revision: input.expectedRevision || 1,
        createdAt: now,
        updatedAt: now,
      };

      let savedChapter: LogicalChapter;
      if (input.chapterId) {
        const res = await updateChapterWithRevisionTransaction(
          chapterPayload,
          input.expectedRevision || 1,
          Boolean(input.forceOverwrite)
        );
        if (res.ok === false) {
          this.conflictState.set({
            ...res.conflict,
            localSnapshot: snapshot,
          });
          return { status: 'conflict' };
        }
        savedChapter = res.chapter;
      } else {
        savedChapter = await createChapterWithSlotTransaction(chapterPayload);
      }

      const stats = await recomputeNovelStatsInFirestore(input.novelId);

      this.activeChapters.update((list) => {
        const filtered = list.filter((c) => c.id !== savedChapter.id);
        return [...filtered, savedChapter].sort((a, b) => a.chapterNumber - b.chapterNumber);
      });
      this.ownNovels.update((list) =>
        list.map((n) => (n.id === input.novelId ? { ...n, ...stats } : n))
      );
      this.clearChapterAutosave(autosaveKey);
      this.conflictState.set(null);

      // Update public reader cache cleanly
      const cached = this.publicNovelDetailsCache()[input.novelId];
      if (cached) {
        const nextPubChapters = this.activeChapters().filter((c) => c.isPublished === true);
        this.publicNovelDetailsCache.update((prev) => ({
          ...prev,
          [input.novelId]: { ...cached, chapters: nextPubChapters },
        }));
      }

      this.successMessage.set(
        savedChapter.isPublished
          ? isEn
            ? 'Chapter published and synced live.'
            : 'تم نشر الفصل وتحديث القراءة العامة بنجاح.'
          : isEn
            ? 'Chapter saved in studio.'
            : 'تم حفظ الفصل بنجاح.'
      );
      return { status: 'saved', chapter: savedChapter };
    } catch (err) {
      if (err instanceof Error && err.message === 'CHAPTER_NUMBER_EXISTS') {
        this.errorMessage.set('هذا الفصل موجود');
        return { status: 'duplicate' };
      }
      const msg = err instanceof Error ? err.message : 'تعذر حفظ الفصل.';
      this.errorMessage.set(msg);
      return { status: 'error', message: msg };
    } finally {
      this.isBusy.set(false);
    }
  }

  async resolveChapterConflict(
    strategy: 'server' | 'overwrite' | 'merge',
    authorId: string
  ): Promise<LogicalChapter | null> {
    const conflict = this.conflictState();
    if (!conflict) return null;

    if (strategy === 'server') {
      this.activeChapters.update((list) =>
        list.map((c) => (c.id === conflict.chapterId ? conflict.serverChapter : c))
      );
      this.clearChapterAutosave(conflict.localSnapshot.key);
      this.conflictState.set(null);
      return conflict.serverChapter;
    }

    const local = conflict.localSnapshot;
    const server = conflict.serverChapter;

    let arBlocks = local.arBlocks;
    let enBlocks = local.enBlocks;
    if (strategy === 'merge') {
      const serverArText = server.editions.ar?.plainText || '';
      const localArText = blocksToPlainText(local.arBlocks);
      if (serverArText && localArText && serverArText !== localArText) {
        arBlocks = [
          ...(server.editions.ar?.blocks || []),
          { id: `sep_${Date.now()}`, type: 'divider', text: '---' },
          ...local.arBlocks,
        ];
      }
      const serverEnText = server.editions.en?.plainText || '';
      const localEnText = blocksToPlainText(local.enBlocks);
      if (serverEnText && localEnText && serverEnText !== localEnText) {
        enBlocks = [
          ...(server.editions.en?.blocks || []),
          { id: `sep_en_${Date.now()}`, type: 'divider', text: '---' },
          ...local.enBlocks,
        ];
      }
    }

    const res = await this.saveChapter({
      novelId: conflict.novelId,
      authorId,
      chapterId: conflict.chapterId,
      chapterNumber: local.chapterNumber,
      title: local.title,
      titleEn: local.titleEn,
      sectionId: local.sectionId,
      chapterType: local.chapterType,
      endStatus: local.endStatus,
      languageMode: local.languageMode,
      arTitle: local.arTitle,
      arBlocks,
      enTitle: local.enTitle,
      enBlocks,
      isPublished: true,
      expectedRevision: server.revision,
      forceOverwrite: true,
    });
    return res.status === 'saved' ? res.chapter : null;
  }

  async deleteChapter(novelId: string, chapter: LogicalChapter): Promise<boolean> {
    this.isBusy.set(true);
    this.errorMessage.set(null);
    try {
      await deleteChapterWithSlotTransaction(novelId, chapter.id, chapter.chapterNumber);
      const stats = await recomputeNovelStatsInFirestore(novelId);
      this.activeChapters.update((list) => list.filter((c) => c.id !== chapter.id));
      this.ownNovels.update((list) =>
        list.map((n) => (n.id === novelId ? { ...n, ...stats } : n))
      );
      this.successMessage.set(
        this.i18n.lang() === 'en' ? 'Chapter permanently deleted.' : 'تم حذف الفصل وتحرير رقمه بنجاح.'
      );
      return true;
    } catch (err) {
      this.errorMessage.set(err instanceof Error ? err.message : 'تعذر حذف الفصل.');
      return false;
    } finally {
      this.isBusy.set(false);
    }
  }

  // ================= FULL-NOVEL MTX ARCHIVE & VERIFIED DELETE GATE ================= //

  triggerBrowserMtxDownload(bytes: Uint8Array, filename: string): void {
    if (!isPlatformBrowser(this.platformId) || typeof document === 'undefined') return;
    const blob = new Blob([bytes as unknown as BlobPart], { type: 'application/octet-stream' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = filename;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    URL.revokeObjectURL(url);
  }

  async exportNovelMtxArchive(
    novel: PublishedNovelRecord,
    providedSections?: NovelSection[],
    providedChapters?: LogicalChapter[]
  ): Promise<NovelMtxExportResult | null> {
    try {
      const [sections, chapters] = await Promise.all([
        providedSections ? Promise.resolve(providedSections) : fetchNovelSections(novel.id),
        providedChapters ? Promise.resolve(providedChapters) : fetchNovelChapters(novel.id, false),
      ]);
      const result = await exportNovelToMtxArchive({
        novel,
        sections,
        chapters,
        includeCover: true,
      });
      this.triggerBrowserMtxDownload(result.mtxBytes, result.filename);
      return result;
    } catch (err) {
      this.errorMessage.set(err instanceof Error ? err.message : 'تعذر تصدير أرشيف MTX.');
      return null;
    }
  }

  openDeleteGate(novel: PublishedNovelRecord): void {
    this.deleteGateNovel.set(novel);
    this.deleteGateStatus.set('idle');
    this.deleteGateError.set(null);
    this.deleteGateArchiveInfo.set(null);
  }

  closeDeleteGate(): void {
    this.deleteGateNovel.set(null);
    this.deleteGateStatus.set('idle');
    this.deleteGateError.set(null);
    this.deleteGateArchiveInfo.set(null);
  }

  async downloadAndVerifyMtxForDeleteGate(): Promise<boolean> {
    const novel = this.deleteGateNovel();
    if (!novel) return false;

    this.deleteGateStatus.set('exporting');
    this.deleteGateError.set(null);
    try {
      const [latestNovel, sections, chapters] = await Promise.all([
        fetchNovelByIdFromFirestore(novel.id).catch(() => novel),
        fetchNovelSections(novel.id),
        fetchNovelChapters(novel.id, true),
      ]);
      const sourceNovel = latestNovel || novel;
      const exported = await exportNovelToMtxArchive({
        novel: sourceNovel,
        sections,
        chapters,
        includeCover: true,
      });

      this.triggerBrowserMtxDownload(exported.mtxBytes, exported.filename);
      this.deleteGateStatus.set('verifying');

      const check = await verifyExportedMtxBytes(exported.mtxBytes, {
        novelId: sourceNovel.id,
        chapterCount: exported.chapterCount,
        sha256: exported.sha256,
      });

      if (!check.ok) {
        this.deleteGateStatus.set('error');
        this.deleteGateError.set(check.error || 'فشل التحقق من سلامة ملف MTX قبل الحذف.');
        return false;
      }

      this.deleteGateArchiveInfo.set({
        filename: exported.filename,
        sha256: exported.sha256,
        chapterCount: exported.chapterCount,
        sectionCount: exported.sectionCount,
      });
      this.deleteGateStatus.set('ready');
      return true;
    } catch (err) {
      this.deleteGateStatus.set('error');
      this.deleteGateError.set(err instanceof Error ? err.message : 'فشل تصدير أرشيف MTX.');
      return false;
    }
  }

  async confirmPermanentDeleteAfterMtx(): Promise<boolean> {
    const novel = this.deleteGateNovel();
    if (!novel || this.deleteGateStatus() !== 'ready') {
      this.deleteGateError.set(
        this.i18n.lang() === 'en'
          ? 'Download and verify the full .mtx archive first before deleting.'
          : 'يجب تنزيل نسخة MTX الكاملة والتحقق من سلامتها قبل تفعيل الحذف النهائي.'
      );
      return false;
    }

    this.deleteGateStatus.set('deleting');
    this.deleteGateError.set(null);
    try {
      await deleteNovelTreeFromFirestore(novel.id, novel.coverUrl);
      this.ownNovels.update((list) => list.filter((n) => n.id !== novel.id));
      this.accountService.ownPublishedNovels.update((list) => list.filter((n) => n.id !== novel.id));
      if (this.activeNovelId() === novel.id) {
        const nextFirst = this.ownNovels()[0] || null;
        this.activeNovelId.set(nextFirst?.id || null);
        this.activeSections.set([]);
        this.activeChapters.set([]);
      }
      this.closeDeleteGate();
      this.successMessage.set(
        this.i18n.lang() === 'en'
          ? 'Novel permanently deleted after verified MTX backup.'
          : 'تم حذف الرواية نهائياً من قاعدة البيانات بعد توثيق تنزيل أرشيف MTX.'
      );
      return true;
    } catch (err) {
      this.deleteGateStatus.set('error');
      this.deleteGateError.set(err instanceof Error ? err.message : 'تعذر إتمام حذف الرواية.');
      return false;
    }
  }

  async importMtxArchiveFile(
    bytes: Uint8Array,
    authorId: string,
    authorName: string,
    publishImmediately = true
  ): Promise<PublishedNovelRecord | null> {
    this.isBusy.set(true);
    this.errorMessage.set(null);
    this.successMessage.set(null);
    try {
      const archive = await parseAndValidateMtxArchive(bytes);
      const created = await importFullNovelArchiveToFirestore(
        authorId,
        authorName,
        archive,
        publishImmediately
      );
      await this.loadStudioForAuthor(authorId);
      await this.loadNovelWorkspace(created.id);
      this.successMessage.set(
        this.i18n.lang() === 'en'
          ? `Imported "${created.title}" with ${archive.chapters.length} chapter(s).`
          : `تم استيراد «${created.title}» بكامل فصولها (${archive.chapters.length}) بنجاح.`
      );
      return created;
    } catch (err) {
      this.errorMessage.set(err instanceof Error ? err.message : 'تعذر استيراد ملف MTX.');
      return null;
    } finally {
      this.isBusy.set(false);
    }
  }

  // ================= FOUNDER (@zid) MODERATION TRIAGE ================= //

  async loadAdminModerationQueue(): Promise<void> {
    if (!this.accountService.ownWriterStatus().isAdmin) return;
    this.adminLoading.set(true);
    try {
      const [reports, modNovels] = await Promise.all([
        fetchWorkReportsForAdmin(),
        fetchModeratedNovelsForAdmin(),
      ]);
      this.workReports.set(reports);
      this.moderatedNovels.set(modNovels);
    } catch (err) {
      this.errorMessage.set(err instanceof Error ? err.message : 'تعذر تحميل سجل البلاغات.');
    } finally {
      this.adminLoading.set(false);
    }
  }

  async keepNovelAndClearReports(novelId: string, adminUid: string, note = ''): Promise<boolean> {
    if (!this.accountService.ownWriterStatus().isAdmin) return false;
    this.isBusy.set(true);
    try {
      await resolveReportKeepNovelAsAdmin(novelId, adminUid, note);
      await this.loadAdminModerationQueue();
      this.successMessage.set(
        this.i18n.lang() === 'en'
          ? 'Reports cleared and work restored cleanly.'
          : 'تمت تبرئة العمل وإغلاق البلاغات المفتوحة بنجاح.'
      );
      return true;
    } catch (err) {
      this.errorMessage.set(err instanceof Error ? err.message : 'تعذر حفظ القرار الإداري.');
      return false;
    } finally {
      this.isBusy.set(false);
    }
  }

  async removeNovelForViolation(novelId: string, adminUid: string, note = ''): Promise<boolean> {
    if (!this.accountService.ownWriterStatus().isAdmin) return false;
    this.isBusy.set(true);
    try {
      await resolveReportRemoveNovelAsAdmin(novelId, adminUid, note);
      await this.loadAdminModerationQueue();
      this.successMessage.set(
        this.i18n.lang() === 'en'
          ? 'Work removed from public visibility (author status preserved).'
          : 'تمت إزالة العمل المخالف من العرض العام مع بقاء صلاحية الكاتب محفوظة.'
      );
      return true;
    } catch (err) {
      this.errorMessage.set(err instanceof Error ? err.message : 'تعذر تنفيذ الإزالة.');
      return false;
    } finally {
      this.isBusy.set(false);
    }
  }
}
