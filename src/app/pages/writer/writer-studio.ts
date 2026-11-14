import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  PLATFORM_ID,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import {
  ChapterBlock,
  ChapterEndStatus,
  ChapterLanguageMode,
  ChapterType,
  CorridorId,
  LocalChapterAutosave,
  LocalNovelDraft,
  LogicalChapter,
  NovelSection,
  NovelStatus,
  PublishedNovelRecord,
  WorkType,
} from '../../core/models/library.models';
import { blocksToPlainText, countWords, plainTextToBlocks } from '../../core/mtx-novel-archive';
import { AccountService, CroppedImageDraft } from '../../core/services/account.service';
import { I18nService } from '../../core/services/i18n.service';
import { LibraryStateService } from '../../core/services/library-state.service';
import { WriterStudioService } from '../../core/services/writer-studio.service';
import { WriterBadge } from '../../shared/components/writer-badge/writer-badge';

export type StudioTab = 'dashboard' | 'novel' | 'chapters' | 'archive' | 'moderation';

@Component({
  selector: 'app-writer-studio',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, WriterBadge],
  templateUrl: './writer-studio.html',
})
export class WriterStudioPage {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);

  readonly account = inject(AccountService);
  readonly studio = inject(WriterStudioService);
  readonly lib = inject(LibraryStateService);
  readonly i18n = inject(I18nService);

  readonly activeTab = signal<StudioTab>('dashboard');

  // Novel Editor state
  readonly editingCloudNovelId = signal<string | null>(null);
  readonly editingLocalDraftId = signal<string | null>(null);
  readonly coverDraft = signal<CroppedImageDraft | null>(null);
  readonly coverPreviewUrl = signal<string>('/images/writers_sanctuary_bg.jpg');
  readonly coverProcessing = signal<boolean>(false);
  readonly coverError = signal<string | null>(null);

  readonly novelForm = new FormGroup({
    title: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.minLength(2)] }),
    titleEn: new FormControl('', { nonNullable: true }),
    workType: new FormControl<WorkType>('original', { nonNullable: true }),
    originalAuthor: new FormControl('', { nonNullable: true }),
    firstAuthor: new FormControl('', { nonNullable: true }),
    supportMethod: new FormControl('', { nonNullable: true }),
    novelStatus: new FormControl<NovelStatus>('ongoing', { nonNullable: true }),
    categoryGroup: new FormControl<CorridorId>('novels', { nonNullable: true }),
    genre: new FormControl('رواية أدبية معاصرة', { nonNullable: true }),
    originLanguage: new FormControl('عربي أصيل', { nonNullable: true }),
    languageCode: new FormControl('ar', { nonNullable: true }),
    description: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.minLength(10)] }),
    tagsInput: new FormControl('', { nonNullable: true }),
    isPublished: new FormControl(true, { nonNullable: true }),
  });

  // Section Editor state
  readonly editingSectionId = signal<string | null>(null);
  readonly sectionForm = new FormGroup({
    title: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    titleEn: new FormControl('', { nonNullable: true }),
  });

  // Chapter Editor state
  readonly editingChapterId = signal<string | null>(null);
  readonly editingChapterRevision = signal<number>(1);
  readonly duplicateChapterError = signal<boolean>(false);
  readonly confirmDeleteChapterId = signal<string | null>(null);
  readonly restorableAutosave = signal<LocalChapterAutosave | null>(null);

  readonly arBlocks = signal<ChapterBlock[]>([{ id: 'ar_blk_1', type: 'paragraph', text: '' }]);
  readonly enBlocks = signal<ChapterBlock[]>([{ id: 'en_blk_1', type: 'paragraph', text: '' }]);

  readonly chapterForm = new FormGroup({
    chapterNumber: new FormControl<number>(1, { nonNullable: true, validators: [Validators.required, Validators.min(1)] }),
    sectionId: new FormControl('', { nonNullable: true }),
    chapterType: new FormControl<ChapterType>('narrative', { nonNullable: true }),
    endStatus: new FormControl<ChapterEndStatus>('ongoing', { nonNullable: true }),
    languageMode: new FormControl<ChapterLanguageMode>('ar', { nonNullable: true }),
    title: new FormControl('', { nonNullable: true }),
    titleEn: new FormControl('', { nonNullable: true }),
    arTitle: new FormControl('', { nonNullable: true }),
    enTitle: new FormControl('', { nonNullable: true }),
    isPublished: new FormControl(true, { nonNullable: true }),
  });

  // Preview Modal state
  readonly isChapterPreviewOpen = signal<boolean>(false);
  readonly previewLanguage = signal<'ar' | 'en'>('ar');

  // Paste-Split Quick Import Modal / Drawer inside chapter editor
  readonly pasteSplitLang = signal<'ar' | 'en' | null>(null);
  readonly pasteSplitControl = new FormControl('', { nonNullable: true });

  // Delete Gate confirm text
  readonly deleteGateConfirmControl = new FormControl('', { nonNullable: true });

  // Admin Moderation Note
  readonly adminDecisionNoteControl = new FormControl('', { nonNullable: true });

  // Computed live word counts
  readonly arLiveWordCount = computed<number>(() => countWords(blocksToPlainText(this.arBlocks())));
  readonly enLiveWordCount = computed<number>(() => countWords(blocksToPlainText(this.enBlocks())));

  // Sorted chapters for studio sidebar
  readonly sortedStudioChapters = computed<LogicalChapter[]>(() =>
    [...this.studio.activeChapters()].sort((a, b) => a.chapterNumber - b.chapterNumber)
  );

  // Sorted sections for studio sidebar
  readonly sortedStudioSections = computed<NovelSection[]>(() =>
    [...this.studio.activeSections()].sort((a, b) => a.orderIndex - b.orderIndex)
  );

  private duplicateCheckTimer: ReturnType<typeof setTimeout> | null = null;
  private autosaveTimer: ReturnType<typeof setTimeout> | null = null;
  private loadedUid: string | null = null;

  constructor() {
    this.destroyRef.onDestroy(() => {
      if (this.duplicateCheckTimer) clearTimeout(this.duplicateCheckTimer);
      if (this.autosaveTimer) clearTimeout(this.autosaveTimer);
    });

    // React to logged-in writer profile loading studio works
    effect(() => {
      const profile = this.account.ownProfile();
      const status = this.account.ownWriterStatus();
      if (profile?.uid && (status.canPublish || status.isAdmin) && this.loadedUid !== profile.uid) {
        this.loadedUid = profile.uid;
        void this.studio.loadStudioForAuthor(profile.uid);
        void this.studio.flushPendingOfflineSync(profile.uid);
        if (status.isAdmin) {
          void this.studio.loadAdminModerationQueue();
        }
      }
    });

    // Sync query params (?novelId=...&tab=...)
    this.route.queryParamMap
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((params) => {
        const tabParam = params.get('tab') as StudioTab | null;
        const novelIdParam = params.get('novelId');

        if (
          tabParam === 'dashboard' ||
          tabParam === 'novel' ||
          tabParam === 'chapters' ||
          tabParam === 'archive' ||
          tabParam === 'moderation'
        ) {
          if (tabParam === 'moderation' && !this.account.ownWriterStatus().isAdmin) {
            this.activeTab.set('dashboard');
          } else {
            this.activeTab.set(tabParam);
          }
        }

        if (novelIdParam) {
          void this.studio.loadNovelWorkspace(novelIdParam).then(() => {
            if (tabParam === 'novel') {
              const found = this.studio.ownNovels().find((n) => n.id === novelIdParam);
              if (found) this.loadCloudNovelIntoForm(found);
            } else if (tabParam === 'chapters') {
              this.suggestNextChapterNumber();
            }
          });
        }
      });

    // Watch chapter number changes for live duplicate check
    this.chapterForm.controls.chapterNumber.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.scheduleDuplicateCheck();
        this.scheduleAutosave();
      });

    // Watch all other chapter fields for debounced local autosave
    this.chapterForm.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.scheduleAutosave();
      });
  }

  // ================= TAB NAVIGATION ================= //

  setTab(tab: StudioTab): void {
    if (tab === 'moderation' && !this.account.ownWriterStatus().isAdmin) return;
    this.studio.clearMessages();
    this.activeTab.set(tab);
    if (tab === 'moderation') {
      void this.studio.loadAdminModerationQueue();
    }
    if (tab === 'chapters' && !this.editingChapterId()) {
      this.suggestNextChapterNumber();
    }
  }

  openNewNovelTab(): void {
    this.studio.clearMessages();
    this.resetNovelForm();
    this.activeTab.set('novel');
  }

  openCloudNovelEdit(novel: PublishedNovelRecord): void {
    this.studio.clearMessages();
    this.loadCloudNovelIntoForm(novel);
    this.activeTab.set('novel');
  }

  async openNovelChaptersTab(novelId: string): Promise<void> {
    this.studio.clearMessages();
    this.activeTab.set('chapters');
    await this.studio.loadNovelWorkspace(novelId);
    this.resetChapterEditor();
    this.suggestNextChapterNumber();
  }

  // ================= NOVEL FORM ACTIONS ================= //

  resetNovelForm(): void {
    this.editingCloudNovelId.set(null);
    this.editingLocalDraftId.set(null);
    this.coverDraft.set(null);
    this.coverPreviewUrl.set('/images/writers_sanctuary_bg.jpg');
    this.coverError.set(null);
    this.novelForm.reset({
      title: '',
      titleEn: '',
      workType: 'original',
      originalAuthor: '',
      firstAuthor: '',
      supportMethod: '',
      novelStatus: 'ongoing',
      categoryGroup: 'novels',
      genre: 'رواية أدبية معاصرة',
      originLanguage: 'عربي أصيل',
      languageCode: 'ar',
      description: '',
      tagsInput: '',
      isPublished: true,
    });
  }

  loadCloudNovelIntoForm(novel: PublishedNovelRecord): void {
    this.editingCloudNovelId.set(novel.id);
    this.editingLocalDraftId.set(null);
    this.coverDraft.set(null);
    this.coverPreviewUrl.set(novel.coverUrl || '/images/writers_sanctuary_bg.jpg');
    this.coverError.set(null);
    this.novelForm.patchValue({
      title: novel.title,
      titleEn: novel.titleEn || '',
      workType: novel.workType || 'original',
      originalAuthor: novel.originalAuthor || '',
      firstAuthor: novel.firstAuthor || '',
      supportMethod: novel.supportMethod || '',
      novelStatus: novel.novelStatus || 'ongoing',
      categoryGroup: novel.categoryGroup || 'novels',
      genre: novel.genre || 'رواية أدبية معاصرة',
      originLanguage: novel.originLanguage || 'عربي أصيل',
      languageCode: novel.languageCode || 'ar',
      description: novel.description || '',
      tagsInput: (novel.tags || []).join(', '),
      isPublished: novel.isPublished,
    });
  }

  resumeLocalDraft(draft: LocalNovelDraft): void {
    this.studio.clearMessages();
    this.editingCloudNovelId.set(null);
    this.editingLocalDraftId.set(draft.localId);
    this.coverDraft.set(null);
    this.coverPreviewUrl.set(draft.coverUrl || '/images/writers_sanctuary_bg.jpg');
    this.coverError.set(null);
    this.novelForm.patchValue({
      title: draft.title,
      titleEn: draft.titleEn || '',
      workType: draft.workType,
      originalAuthor: draft.originalAuthor || '',
      firstAuthor: draft.firstAuthor || '',
      supportMethod: draft.supportMethod || '',
      novelStatus: draft.novelStatus,
      categoryGroup: draft.categoryGroup,
      genre: draft.genre,
      originLanguage: draft.originLanguage,
      languageCode: draft.languageCode,
      description: draft.description,
      tagsInput: (draft.tags || []).join(', '),
      isPublished: true,
    });
    this.activeTab.set('novel');
  }

  async onCoverFileSelected(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (!file || !isPlatformBrowser(this.platformId)) return;

    this.coverError.set(null);
    this.coverProcessing.set(true);
    try {
      const processed = await this.processCoverTo2By3(file);
      this.coverDraft.set(processed);
      this.coverPreviewUrl.set(processed.previewDataUrl);
    } catch (err) {
      this.coverError.set(
        err instanceof Error
          ? err.message
          : this.i18n.lang() === 'en'
            ? 'Could not process cover image.'
            : 'تعذر معالجة صورة الغلاف، تأكد من اختيار صورة صالحة.'
      );
    } finally {
      this.coverProcessing.set(false);
    }
  }

  private async processCoverTo2By3(file: File): Promise<CroppedImageDraft> {
    if (!file.type.startsWith('image/')) {
      throw new Error(this.i18n.lang() === 'en' ? 'Please choose a valid image file.' : 'يرجى اختيار ملف صورة صالح.');
    }
    const objectUrl = URL.createObjectURL(file);
    try {
      const img = await new Promise<HTMLImageElement>((resolve, reject) => {
        const el = new Image();
        el.onload = () => resolve(el);
        el.onerror = () => reject(new Error('Image decode failed'));
        el.src = objectUrl;
      });

      const targetW = 600;
      const targetH = 900; // Strictly 2:3 novel cover ratio
      const canvas = document.createElement('canvas');
      canvas.width = targetW;
      canvas.height = targetH;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Canvas unavailable');

      // Center-crop cover geometry to fill 2:3 frame without distortion
      const srcRatio = img.naturalWidth / Math.max(1, img.naturalHeight);
      const dstRatio = targetW / targetH;
      let sx = 0;
      let sy = 0;
      let sw = img.naturalWidth;
      let sh = img.naturalHeight;

      if (srcRatio > dstRatio) {
        sw = Math.round(img.naturalHeight * dstRatio);
        sx = Math.round((img.naturalWidth - sw) / 2);
      } else {
        sh = Math.round(img.naturalWidth / dstRatio);
        sy = Math.round((img.naturalHeight - sh) / 2);
      }

      ctx.drawImage(img, sx, sy, sw, sh, 0, 0, targetW, targetH);

      // Export compact WebP (< 380KB so both Storage & Firestore fallback remain crisp and fast)
      let quality = 0.84;
      let dataUrl = canvas.toDataURL('image/webp', quality);
      if (dataUrl.length > 380000) {
        quality = 0.72;
        dataUrl = canvas.toDataURL('image/webp', quality);
      }
      if (!dataUrl.startsWith('data:image/webp')) {
        dataUrl = canvas.toDataURL('image/jpeg', 0.82);
      }

      const blob = await new Promise<Blob | null>((resolve) => {
        canvas.toBlob((b) => resolve(b), 'image/webp', quality);
      });

      return {
        kind: 'banner',
        sourceUrl: dataUrl,
        naturalWidth: img.naturalWidth,
        naturalHeight: img.naturalHeight,
        panX: 0,
        panY: 0,
        zoom: 1,
        blob,
        previewDataUrl: dataUrl,
      };
    } finally {
      URL.revokeObjectURL(objectUrl);
    }
  }

  private parseTags(raw: string): string[] {
    return raw
      .split(/[,،]+/)
      .map((s) => s.trim())
      .filter((s) => s.length > 0)
      .slice(0, 8);
  }

  saveAsLocalDraft(): void {
    const profile = this.account.ownProfile();
    if (!profile) return;
    const v = this.novelForm.getRawValue();
    if (!v.title.trim()) {
      this.studio.errorMessage.set(
        this.i18n.lang() === 'en' ? 'Enter a novel title first to save a draft.' : 'أدخل عنوان الرواية أولاً لحفظ المسودة محلياً.'
      );
      return;
    }
    const existingLocal = this.editingLocalDraftId()
      ? this.studio.localDrafts().find((d) => d.localId === this.editingLocalDraftId())
      : null;

    const saved = this.studio.saveLocalNovelDraft({
      localId: existingLocal?.localId,
      authorId: profile.uid,
      title: v.title.trim(),
      titleEn: v.titleEn.trim(),
      workType: v.workType,
      originalAuthor: v.originalAuthor.trim(),
      firstAuthor: v.firstAuthor.trim(),
      supportMethod: v.supportMethod.trim(),
      novelStatus: v.novelStatus,
      categoryGroup: v.categoryGroup,
      genre: v.genre.trim() || 'رواية أدبية معاصرة',
      originLanguage: v.originLanguage,
      languageCode: v.languageCode,
      description: v.description.trim(),
      coverUrl: this.coverDraft()?.previewDataUrl || this.coverPreviewUrl(),
      tags: this.parseTags(v.tagsInput),
      sections: existingLocal?.sections || [],
      chapters: existingLocal?.chapters || [],
    });
    this.editingLocalDraftId.set(saved.localId);
  }

  async submitCloudNovel(): Promise<void> {
    const profile = this.account.ownProfile();
    if (!profile) return;
    const v = this.novelForm.getRawValue();

    let saved: PublishedNovelRecord | null = null;
    if (this.editingLocalDraftId()) {
      // Save latest fields to local draft then publish atomically
      const draft = this.studio.saveLocalNovelDraft({
        localId: this.editingLocalDraftId()!,
        authorId: profile.uid,
        title: v.title.trim(),
        titleEn: v.titleEn.trim(),
        workType: v.workType,
        originalAuthor: v.originalAuthor.trim(),
        firstAuthor: v.firstAuthor.trim(),
        supportMethod: v.supportMethod.trim(),
        novelStatus: v.novelStatus,
        categoryGroup: v.categoryGroup,
        genre: v.genre.trim() || 'رواية أدبية معاصرة',
        originLanguage: v.originLanguage,
        languageCode: v.languageCode,
        description: v.description.trim(),
        coverUrl: this.coverPreviewUrl(),
        tags: this.parseTags(v.tagsInput),
        sections: this.studio.localDrafts().find((d) => d.localId === this.editingLocalDraftId())?.sections || [],
        chapters: this.studio.localDrafts().find((d) => d.localId === this.editingLocalDraftId())?.chapters || [],
      });
      saved = await this.studio.publishLocalDraftToCloud(
        draft.localId,
        profile.uid,
        profile.displayName || 'كاتب معتمد',
        this.coverDraft()
      );
      if (saved) this.editingLocalDraftId.set(null);
    } else {
      saved = await this.studio.saveCloudNovel({
        novelId: this.editingCloudNovelId(),
        authorId: profile.uid,
        authorName: profile.displayName || 'كاتب معتمد',
        title: v.title,
        titleEn: v.titleEn,
        workType: v.workType,
        originalAuthor: v.originalAuthor,
        firstAuthor: v.firstAuthor,
        supportMethod: v.supportMethod,
        novelStatus: v.novelStatus,
        categoryGroup: v.categoryGroup,
        genre: v.genre,
        originLanguage: v.originLanguage,
        languageCode: v.languageCode,
        description: v.description,
        coverUrl: this.coverPreviewUrl(),
        tags: this.parseTags(v.tagsInput),
        coverDraft: this.coverDraft(),
        isPublished: v.isPublished,
      });
    }

    if (saved) {
      this.editingCloudNovelId.set(saved.id);
      this.coverDraft.set(null);
      this.coverPreviewUrl.set(saved.coverUrl);
      await this.studio.loadNovelWorkspace(saved.id);
    }
  }

  async publishLocalDraftDirectly(draft: LocalNovelDraft): Promise<void> {
    const profile = this.account.ownProfile();
    if (!profile) return;
    const saved = await this.studio.publishLocalDraftToCloud(
      draft.localId,
      profile.uid,
      profile.displayName || 'كاتب معتمد'
    );
    if (saved) {
      await this.openNovelChaptersTab(saved.id);
    }
  }

  // ================= SECTIONS MANAGER ================= //

  async submitSection(): Promise<void> {
    const novelId = this.studio.activeNovelId();
    const uid = this.account.ownProfile()?.uid;
    if (!novelId || !uid || this.sectionForm.invalid) return;

    const val = this.sectionForm.getRawValue();
    const saved = await this.studio.saveSection(novelId, uid, {
      id: this.editingSectionId() || undefined,
      title: val.title,
      titleEn: val.titleEn,
    });
    if (saved) {
      this.editingSectionId.set(null);
      this.sectionForm.reset({ title: '', titleEn: '' });
    }
  }

  editSection(sec: NovelSection): void {
    this.editingSectionId.set(sec.id);
    this.sectionForm.setValue({
      title: sec.title,
      titleEn: sec.titleEn || '',
    });
  }

  cancelSectionEdit(): void {
    this.editingSectionId.set(null);
    this.sectionForm.reset({ title: '', titleEn: '' });
  }

  // ================= CHAPTER AUTHORING & BLOCKS ================= //

  async onStudioNovelSwitch(event: Event): Promise<void> {
    const select = event.target as HTMLSelectElement;
    const novelId = select.value;
    if (!novelId) return;
    await this.studio.loadNovelWorkspace(novelId);
    this.resetChapterEditor();
    this.suggestNextChapterNumber();
  }

  private suggestNextChapterNumber(): void {
    const chapters = this.studio.activeChapters();
    const maxNum = chapters.reduce((m, c) => Math.max(m, c.chapterNumber), 0);
    this.chapterForm.patchValue({ chapterNumber: maxNum + 1 }, { emitEvent: false });
    this.duplicateChapterError.set(false);
    this.checkForRestorableAutosave(maxNum + 1, null);
  }

  resetChapterEditor(): void {
    this.editingChapterId.set(null);
    this.editingChapterRevision.set(1);
    this.duplicateChapterError.set(false);
    this.confirmDeleteChapterId.set(null);
    this.arBlocks.set([{ id: `ar_${Date.now()}`, type: 'paragraph', text: '' }]);
    this.enBlocks.set([{ id: `en_${Date.now()}`, type: 'paragraph', text: '' }]);
    const nextNum = this.studio.activeChapters().reduce((m, c) => Math.max(m, c.chapterNumber), 0) + 1;
    this.chapterForm.reset({
      chapterNumber: nextNum,
      sectionId: this.sortedStudioSections()[0]?.id || '',
      chapterType: 'narrative',
      endStatus: 'ongoing',
      languageMode: 'ar',
      title: '',
      titleEn: '',
      arTitle: '',
      enTitle: '',
      isPublished: true,
    }, { emitEvent: false });
    this.checkForRestorableAutosave(nextNum, null);
  }

  loadChapterIntoEditor(chap: LogicalChapter): void {
    this.studio.clearMessages();
    this.editingChapterId.set(chap.id);
    this.editingChapterRevision.set(chap.revision || 1);
    this.duplicateChapterError.set(false);
    this.confirmDeleteChapterId.set(null);

    this.chapterForm.patchValue({
      chapterNumber: chap.chapterNumber,
      sectionId: chap.sectionId || '',
      chapterType: chap.chapterType,
      endStatus: chap.endStatus,
      languageMode: chap.languageMode,
      title: chap.title,
      titleEn: chap.titleEn || '',
      arTitle: chap.editions.ar?.title || chap.title,
      enTitle: chap.editions.en?.title || chap.titleEn || '',
      isPublished: chap.isPublished,
    }, { emitEvent: false });

    this.arBlocks.set(
      chap.editions.ar?.blocks?.length
        ? chap.editions.ar.blocks.map((b) => ({ ...b }))
        : [{ id: `ar_${Date.now()}`, type: 'paragraph', text: '' }]
    );
    this.enBlocks.set(
      chap.editions.en?.blocks?.length
        ? chap.editions.en.blocks.map((b) => ({ ...b }))
        : [{ id: `en_${Date.now()}`, type: 'paragraph', text: '' }]
    );

    this.checkForRestorableAutosave(chap.chapterNumber, chap.id);
  }

  private scheduleDuplicateCheck(): void {
    if (this.duplicateCheckTimer) clearTimeout(this.duplicateCheckTimer);
    this.duplicateCheckTimer = setTimeout(() => {
      void this.runDuplicateCheck();
    }, 240);
  }

  async runDuplicateCheck(): Promise<boolean> {
    const novelId = this.studio.activeNovelId();
    const num = Number(this.chapterForm.controls.chapterNumber.value);
    if (!novelId || !Number.isInteger(num) || num < 1) {
      this.duplicateChapterError.set(false);
      return false;
    }
    const dup = await this.studio.isDuplicateChapterNumber(novelId, num, this.editingChapterId());
    this.duplicateChapterError.set(dup);
    return dup;
  }

  private getAutosaveKey(chapterNum: number, chapterId: string | null): string {
    const novelId = this.studio.activeNovelId() || 'none';
    return chapterId || `${novelId}__new_${chapterNum}`;
  }

  private checkForRestorableAutosave(chapterNum: number, chapterId: string | null): void {
    const key = this.getAutosaveKey(chapterNum, chapterId);
    const saved = this.studio.getChapterAutosave(key);
    this.restorableAutosave.set(saved);
  }

  restoreLocalAutosaveSnapshot(): void {
    const snap = this.restorableAutosave();
    if (!snap) return;
    this.chapterForm.patchValue({
      chapterNumber: snap.chapterNumber,
      title: snap.title,
      titleEn: snap.titleEn,
      sectionId: snap.sectionId,
      chapterType: snap.chapterType,
      endStatus: snap.endStatus,
      languageMode: snap.languageMode,
      arTitle: snap.arTitle,
      enTitle: snap.enTitle,
    }, { emitEvent: false });
    this.arBlocks.set(snap.arBlocks.length ? snap.arBlocks.map((b) => ({ ...b })) : [{ id: 'ar_1', type: 'paragraph', text: '' }]);
    this.enBlocks.set(snap.enBlocks.length ? snap.enBlocks.map((b) => ({ ...b })) : [{ id: 'en_1', type: 'paragraph', text: '' }]);
    this.restorableAutosave.set(null);
  }

  dismissRestorableAutosave(): void {
    const snap = this.restorableAutosave();
    if (snap) {
      this.studio.clearChapterAutosave(snap.key);
    }
    this.restorableAutosave.set(null);
  }

  private scheduleAutosave(): void {
    if (this.autosaveTimer) clearTimeout(this.autosaveTimer);
    this.autosaveTimer = setTimeout(() => {
      this.persistCurrentChapterAutosave();
    }, 900);
  }

  persistCurrentChapterAutosave(): void {
    const novelId = this.studio.activeNovelId();
    if (!novelId) return;
    const v = this.chapterForm.getRawValue();
    const chapterNum = Number(v.chapterNumber) || 1;
    const chId = this.editingChapterId();
    const arHasText = this.arBlocks().some((b) => b.text.trim().length > 0);
    const enHasText = this.enBlocks().some((b) => b.text.trim().length > 0);
    if (!arHasText && !enHasText && !v.title.trim()) return;

    this.studio.saveChapterAutosave({
      key: this.getAutosaveKey(chapterNum, chId),
      novelId,
      chapterId: chId,
      chapterNumber: chapterNum,
      title: v.title,
      titleEn: v.titleEn,
      sectionId: v.sectionId,
      chapterType: v.chapterType,
      endStatus: v.endStatus,
      languageMode: v.languageMode,
      arTitle: v.arTitle,
      arBlocks: this.arBlocks(),
      enTitle: v.enTitle,
      enBlocks: this.enBlocks(),
      baseRevision: this.editingChapterRevision(),
      savedAt: new Date().toISOString(),
    });
  }

  // Structured Block Manipulation (No ngModel)
  addBlock(lang: 'ar' | 'en', type: ChapterBlock['type'] = 'paragraph'): void {
    const block: ChapterBlock = {
      id: `${lang}_${Date.now()}_${Math.random().toString(36).slice(2, 5)}`,
      type,
      text: type === 'divider' ? '---' : '',
    };
    const sig = lang === 'ar' ? this.arBlocks : this.enBlocks;
    sig.update((list) => [...list, block]);
    this.scheduleAutosave();
  }

  updateBlockText(lang: 'ar' | 'en', index: number, event: Event): void {
    const value = (event.target as HTMLTextAreaElement).value;
    const sig = lang === 'ar' ? this.arBlocks : this.enBlocks;
    sig.update((list) => list.map((b, i) => (i === index ? { ...b, text: value } : b)));
    this.scheduleAutosave();
  }

  updateBlockType(lang: 'ar' | 'en', index: number, event: Event): void {
    const nextType = (event.target as HTMLSelectElement).value as ChapterBlock['type'];
    const sig = lang === 'ar' ? this.arBlocks : this.enBlocks;
    sig.update((list) =>
      list.map((b, i) =>
        i === index ? { ...b, type: nextType, text: nextType === 'divider' ? '---' : b.text === '---' ? '' : b.text } : b
      )
    );
    this.scheduleAutosave();
  }

  moveBlock(lang: 'ar' | 'en', index: number, dir: -1 | 1): void {
    const sig = lang === 'ar' ? this.arBlocks : this.enBlocks;
    const list = [...sig()];
    const swap = index + dir;
    if (swap < 0 || swap >= list.length) return;
    [list[index], list[swap]] = [list[swap], list[index]];
    sig.set(list);
    this.scheduleAutosave();
  }

  removeBlock(lang: 'ar' | 'en', index: number): void {
    const sig = lang === 'ar' ? this.arBlocks : this.enBlocks;
    if (sig().length <= 1) {
      sig.set([{ id: `${lang}_${Date.now()}`, type: 'paragraph', text: '' }]);
    } else {
      sig.update((list) => list.filter((_, i) => i !== index));
    }
    this.scheduleAutosave();
  }

  openPasteSplitModal(lang: 'ar' | 'en'): void {
    this.pasteSplitLang.set(lang);
    this.pasteSplitControl.setValue('');
  }

  applyPasteSplitBlocks(): void {
    const lang = this.pasteSplitLang();
    if (!lang) return;
    const raw = this.pasteSplitControl.value;
    if (!raw.trim()) {
      this.pasteSplitLang.set(null);
      return;
    }
    const parsed = plainTextToBlocks(raw);
    const sig = lang === 'ar' ? this.arBlocks : this.enBlocks;
    const current = sig();
    const isCurrentEmpty = current.length === 1 && !current[0].text.trim();
    sig.set(isCurrentEmpty ? parsed : [...current, ...parsed]);
    this.pasteSplitLang.set(null);
    this.scheduleAutosave();
  }

  async submitChapter(): Promise<void> {
    const novelId = this.studio.activeNovelId();
    const uid = this.account.ownProfile()?.uid;
    if (!novelId || !uid) return;

    const isDup = await this.runDuplicateCheck();
    if (isDup && !this.editingChapterId()) {
      this.studio.errorMessage.set('هذا الفصل موجود');
      return;
    }

    const v = this.chapterForm.getRawValue();
    const res = await this.studio.saveChapter({
      novelId,
      authorId: uid,
      chapterId: this.editingChapterId(),
      chapterNumber: Number(v.chapterNumber),
      title: v.title,
      titleEn: v.titleEn,
      sectionId: v.sectionId,
      chapterType: v.chapterType,
      endStatus: v.endStatus,
      languageMode: v.languageMode,
      arTitle: v.arTitle || v.title,
      arBlocks: this.arBlocks(),
      enTitle: v.enTitle || v.titleEn,
      enBlocks: this.enBlocks(),
      isPublished: v.isPublished,
      expectedRevision: this.editingChapterRevision(),
    });

    if (res.status === 'saved') {
      this.editingChapterId.set(res.chapter.id);
      this.editingChapterRevision.set(res.chapter.revision);
      this.restorableAutosave.set(null);
      this.duplicateChapterError.set(false);
    }
  }

  async deleteSelectedChapter(chap: LogicalChapter): Promise<void> {
    const novelId = this.studio.activeNovelId();
    if (!novelId) return;
    const ok = await this.studio.deleteChapter(novelId, chap);
    if (ok) {
      this.confirmDeleteChapterId.set(null);
      if (this.editingChapterId() === chap.id) {
        this.resetChapterEditor();
      }
    }
  }

  // ================= CONFLICT & DELETE GATE ACTIONS ================= //

  async resolveConflict(strategy: 'server' | 'overwrite' | 'merge'): Promise<void> {
    const uid = this.account.ownProfile()?.uid;
    if (!uid) return;
    const updated = await this.studio.resolveChapterConflict(strategy, uid);
    if (updated) {
      this.loadChapterIntoEditor(updated);
    }
  }

  openDeleteGate(novel: PublishedNovelRecord): void {
    this.deleteGateConfirmControl.setValue('');
    this.studio.openDeleteGate(novel);
  }

  canExecutePermanentDelete(): boolean {
    const txt = this.deleteGateConfirmControl.value.trim();
    return (
      this.studio.deleteGateStatus() === 'ready' &&
      (txt === 'حذف نهائي' || txt.toLowerCase() === 'confirm delete')
    );
  }

  // ================= LIVE IN-STUDIO CHAPTER PREVIEW ================= //

  openChapterPreview(): void {
    const mode = this.chapterForm.controls.languageMode.value;
    this.previewLanguage.set(mode === 'en' ? 'en' : 'ar');
    this.isChapterPreviewOpen.set(true);
  }

  // ================= FULL MTX ARCHIVE IMPORT ================= //

  async onImportMtxFileSelected(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    const profile = this.account.ownProfile();
    if (!file || !profile) return;

    const buf = await file.arrayBuffer();
    const bytes = new Uint8Array(buf);
    const created = await this.studio.importMtxArchiveFile(
      bytes,
      profile.uid,
      profile.displayName || 'كاتب معتمد',
      true
    );
    if (created) {
      await this.openNovelChaptersTab(created.id);
    }
  }

  // ================= ADMIN MODERATION QUEUE ================= //

  async keepNovelAdmin(novelId: string): Promise<void> {
    const adminUid = this.account.ownProfile()?.uid;
    if (!adminUid) return;
    const ok = await this.studio.keepNovelAndClearReports(
      novelId,
      adminUid,
      this.adminDecisionNoteControl.value.trim()
    );
    if (ok) this.adminDecisionNoteControl.setValue('');
  }

  async removeNovelAdmin(novelId: string): Promise<void> {
    const adminUid = this.account.ownProfile()?.uid;
    if (!adminUid) return;
    const ok = await this.studio.removeNovelForViolation(
      novelId,
      adminUid,
      this.adminDecisionNoteControl.value.trim()
    );
    if (ok) this.adminDecisionNoteControl.setValue('');
  }
}
