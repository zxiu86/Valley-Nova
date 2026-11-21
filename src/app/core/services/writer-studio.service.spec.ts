import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { describe, expect, it, beforeEach, vi } from 'vitest';
import { CHECK_CHAPTER_SLOT_EXISTS_FN, WriterStudioService } from './writer-studio.service';

describe('WriterStudioService', () => {
  let service: WriterStudioService;
  let mockCheckChapterSlotExists: ReturnType<typeof vi.fn<(novelId: string, chapterNumber: number) => Promise<boolean>>>;

  beforeEach(() => {
    localStorage.clear();
    mockCheckChapterSlotExists = vi.fn(async () => false);
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        {
          provide: CHECK_CHAPTER_SLOT_EXISTS_FN,
          useValue: mockCheckChapterSlotExists,
        },
      ],
    });
    service = TestBed.inject(WriterStudioService);
  });

  it('computes KPI stats accurately from ownNovels with all/ar/en word filter', () => {
    service.ownNovels.set([
      {
        id: 'n1',
        title: 'رواية أولى',
        authorId: 'u1',
        authorName: 'كاتب',
        genre: 'رواية',
        categoryGroup: 'novels',
        coverUrl: '/images/writers_sanctuary_bg.jpg',
        description: 'ملخص',
        readingHours: 3,
        isPublished: true,
        moderationStatus: 'active',
        publishedChapterCount: 5,
        publishedWordsAr: 12000,
        publishedWordsEn: 8500,
        verifiedReadsCount: 42,
        createdAt: '2026-01-01',
        updatedAt: '2026-01-02',
      },
      {
        id: 'n2',
        title: 'رواية محذوفة',
        authorId: 'u1',
        authorName: 'كاتب',
        genre: 'رواية',
        categoryGroup: 'novels',
        coverUrl: '/images/writers_sanctuary_bg.jpg',
        description: 'ملخص',
        readingHours: 1,
        isPublished: false,
        moderationStatus: 'rejected_removed',
        publishedChapterCount: 2,
        publishedWordsAr: 1000,
        publishedWordsEn: 500,
        verifiedReadsCount: 10,
        createdAt: '2026-01-01',
        updatedAt: '2026-01-02',
      },
    ]);

    expect(service.publishedWorksCount()).toBe(1);
    expect(service.publishedChaptersCount()).toBe(7);
    expect(service.verifiedReadsTotal()).toBe(52);

    service.wordFilter.set('all');
    expect(service.publishedWordsCount()).toBe(22000);

    service.wordFilter.set('ar');
    expect(service.publishedWordsCount()).toBe(13000);

    service.wordFilter.set('en');
    expect(service.publishedWordsCount()).toBe(9000);
  });

  it('saves and deletes strictly local drafts without cloud side-effects', () => {
    const saved = service.saveLocalNovelDraft({
      authorId: 'u1',
      title: 'مسودة محلية خالصة',
      titleEn: '',
      workType: 'original',
      originalAuthor: '',
      firstAuthor: '',
      supportMethod: '',
      novelStatus: 'ongoing',
      categoryGroup: 'novels',
      genre: 'دراما نفسية',
      originLanguage: 'عربي أصيل',
      languageCode: 'ar',
      description: 'وصف أدبي لا يقل عن عشرة أحرف.',
      coverUrl: '',
      tags: ['أدب'],
      sections: [],
      chapters: [],
    });

    expect(service.localDrafts().length).toBe(1);
    expect(service.localDrafts()[0].localId).toBe(saved.localId);

    service.deleteLocalNovelDraft(saved.localId);
    expect(service.localDrafts().length).toBe(0);
  });

  it('detects duplicate chapter numbers in activeChapters', async () => {
    service.activeChapters.set([
      {
        id: 'ch_1',
        novelId: 'n1',
        authorId: 'u1',
        chapterNumber: 3,
        title: 'الفصل الثالث',
        chapterType: 'narrative',
        endStatus: 'ongoing',
        languageMode: 'ar',
        editions: {
          ar: {
            title: 'الفصل الثالث',
            blocks: [{ id: 'b1', type: 'paragraph', text: 'نص الفصل' }],
            plainText: 'نص الفصل',
            wordCount: 2,
            updatedAt: '2026-01-01',
          },
        },
        wordCountAr: 2,
        wordCountEn: 0,
        isPublished: true,
        revision: 1,
        createdAt: '2026-01-01',
        updatedAt: '2026-01-01',
      },
    ]);

    const duplicateNew = await service.isDuplicateChapterNumber('n1', 3, null);
    expect(duplicateNew).toBe(true);
    expect(mockCheckChapterSlotExists).not.toHaveBeenCalled();

    const sameBeingEdited = await service.isDuplicateChapterNumber('n1', 3, 'ch_1');
    expect(sameBeingEdited).toBe(false);
    expect(mockCheckChapterSlotExists).not.toHaveBeenCalled();

    const unused = await service.isDuplicateChapterNumber('n1', 4, null);
    expect(unused).toBe(false);
    expect(mockCheckChapterSlotExists).toHaveBeenCalledTimes(1);
    expect(mockCheckChapterSlotExists).toHaveBeenCalledWith('n1', 4);

    mockCheckChapterSlotExists.mockResolvedValueOnce(true);
    const remoteConflict = await service.isDuplicateChapterNumber('n1', 5, null);
    expect(remoteConflict).toBe(true);
    expect(mockCheckChapterSlotExists).toHaveBeenCalledWith('n1', 5);

    mockCheckChapterSlotExists.mockRejectedValueOnce(new Error('Missing or insufficient permissions.'));
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const resilientFallback = await service.isDuplicateChapterNumber('n1', 6, null);
    expect(resilientFallback).toBe(false);
    warnSpy.mockRestore();
  });

  it('blocks permanent deletion in Delete Gate until MTX export succeeds and verifies', async () => {
    service.openDeleteGate({
      id: 'n_gate',
      title: 'رواية الاختبار',
      authorId: 'u1',
      authorName: 'كاتب',
      genre: 'رواية',
      categoryGroup: 'novels',
      coverUrl: '/images/writers_sanctuary_bg.jpg',
      description: 'وصف',
      readingHours: 2,
      isPublished: true,
      createdAt: '2026-01-01',
      updatedAt: '2026-01-01',
    });

    expect(service.deleteGateStatus()).toBe('idle');
    const deletedEarly = await service.confirmPermanentDeleteAfterMtx();
    expect(deletedEarly).toBe(false);
    expect(service.deleteGateError()).toBeTruthy();
  });
});
