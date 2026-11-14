import { describe, it, expect } from 'vitest';
import { compressToMtx } from './mtx-codec';
import {
  exportNovelToMtxArchive,
  parseAndValidateMtxArchive,
  plainTextToBlocks,
  verifyExportedMtxBytes,
} from './mtx-novel-archive';
import { LogicalChapter, NovelSection, PublishedNovelRecord } from './models/library.models';

describe('MTX Full-Novel Archive Engine', () => {
  const sampleNovel: PublishedNovelRecord = {
    id: 'novel_test_01',
    title: 'رسائل الغيم',
    titleEn: 'Letters of Cloud',
    authorId: 'writer_1',
    authorName: 'زيد الكاتب',
    workType: 'original',
    novelStatus: 'ongoing',
    genre: 'رواية أدبية معاصرة',
    categoryGroup: 'novels',
    coverUrl: '/images/writers_sanctuary_bg.jpg',
    description: 'رواية تجريبية لاختبار الأرشفة الكاملة.',
    readingHours: 3,
    originLanguage: 'عربي أصيل',
    languageCode: 'ar',
    isPublished: true,
    createdAt: '2026-11-01T00:00:00.000Z',
    updatedAt: '2026-11-01T00:00:00.000Z',
  };

  const sampleSections: NovelSection[] = [
    {
      id: 'sec_1',
      novelId: 'novel_test_01',
      authorId: 'writer_1',
      title: 'الكتاب الأول: البدايات',
      titleEn: 'Book I: Beginnings',
      orderIndex: 0,
      createdAt: '2026-11-01T00:00:00.000Z',
      updatedAt: '2026-11-01T00:00:00.000Z',
    },
  ];

  const sampleChapters: LogicalChapter[] = [
    {
      id: 'ch_1',
      novelId: 'novel_test_01',
      authorId: 'writer_1',
      chapterNumber: 1,
      title: 'مدخل السحاب',
      titleEn: 'Cloud Threshold',
      sectionId: 'sec_1',
      chapterType: 'explanatory',
      endStatus: 'ongoing',
      languageMode: 'both',
      editions: {
        ar: {
          title: 'مدخل السحاب',
          blocks: plainTextToBlocks('هذا فصل توضيحي يشرح بنية العالم.'),
          plainText: 'هذا فصل توضيحي يشرح بنية العالم.',
          wordCount: 6,
          updatedAt: '2026-11-01T00:00:00.000Z',
        },
        en: {
          title: 'Cloud Threshold',
          blocks: plainTextToBlocks('An explanatory chapter introducing the sanctuary world.'),
          plainText: 'An explanatory chapter introducing the sanctuary world.',
          wordCount: 7,
          updatedAt: '2026-11-01T00:00:00.000Z',
        },
      },
      wordCountAr: 6,
      wordCountEn: 7,
      isPublished: true,
      revision: 1,
      createdAt: '2026-11-01T00:00:00.000Z',
      updatedAt: '2026-11-01T00:00:00.000Z',
    },
  ];

  it('exports full novel archive and passes strict read-back verification before deletion', async () => {
    const exported = await exportNovelToMtxArchive({
      novel: sampleNovel,
      sections: sampleSections,
      chapters: sampleChapters,
    });

    expect(exported.mtxBytes.length).toBeGreaterThan(20);
    expect(exported.sha256.length).toBeGreaterThan(10);
    expect(exported.chapterCount).toBe(1);
    expect(exported.sectionCount).toBe(1);

    const verified = await verifyExportedMtxBytes(exported.mtxBytes, {
      novelId: sampleNovel.id,
      chapterCount: 1,
      sha256: exported.sha256,
    });

    expect(verified.ok).toBe(true);
    expect(verified.archive?.novel.title).toBe('رسائل الغيم');
    expect(verified.archive?.chapters[0].chapterType).toBe('explanatory');
    expect(verified.archive?.chapters[0].editions.en?.title).toBe('Cloud Threshold');
  });

  it('rejects corrupted binary payloads or mismatched SHA-256 archives', async () => {
    const exported = await exportNovelToMtxArchive({
      novel: sampleNovel,
      sections: sampleSections,
      chapters: sampleChapters,
    });

    const corrupted = new Uint8Array(exported.mtxBytes);
    corrupted[corrupted.length - 3] ^= 0xff;

    await expect(parseAndValidateMtxArchive(corrupted)).rejects.toThrow();

    const mismatch = await verifyExportedMtxBytes(exported.mtxBytes, {
      novelId: 'different_id',
      chapterCount: 1,
      sha256: exported.sha256,
    });
    expect(mismatch.ok).toBe(false);
  });

  it('blocks SVG script-bearing data URI covers inside imported archives', async () => {
    const malicious = {
      format: 'mtx-full-novel-v1',
      exportedAt: new Date().toISOString(),
      sha256: '',
      novel: {
        id: 'x',
        title: 'Bad SVG',
        authorId: 'u1',
        authorName: 'Bad',
        workType: 'original',
        novelStatus: 'ongoing',
        categoryGroup: 'novels',
        genre: 'Fantasy',
        description: 'Desc',
        coverUrl: 'data:image/svg+xml;base64,PHN2Zz48c2NyaXB0PmFsZXJ0KDEpPC9zY3JpcHQ+PC9zdmc+',
      },
      sections: [],
      chapters: [
        {
          id: 'c1',
          chapterNumber: 1,
          title: 'Ch 1',
          chapterType: 'narrative',
          endStatus: 'ongoing',
          languageMode: 'en',
          isPublished: true,
          editions: {
            en: {
              title: 'Ch 1',
              blocks: [{ id: 'b1', type: 'paragraph', text: 'Hello' }],
              plainText: 'Hello',
              wordCount: 1,
              updatedAt: new Date().toISOString(),
            },
          },
        },
      ],
    };

    const encoded = await compressToMtx(JSON.stringify(malicious), {
      title: 'Bad SVG',
      author: 'Bad',
      chapterTitle: 'Archive',
      chapterIndex: 1,
      createdAt: new Date().toISOString(),
    });

    await expect(parseAndValidateMtxArchive(encoded.mtxBytes)).rejects.toThrow(/SVG/);
  });
});
