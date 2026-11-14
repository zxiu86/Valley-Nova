import {
  compressToMtx,
  decompressFromMtx,
  MtxMetadata,
} from './mtx-codec';
import {
  ChapterBlock,
  ChapterEndStatus,
  ChapterLanguageEdition,
  ChapterLanguageMode,
  ChapterType,
  CorridorId,
  FullNovelMtxArchive,
  LogicalChapter,
  NovelSection,
  NovelStatus,
  PublishedNovelRecord,
  WorkType,
} from './models/library.models';

const VALID_CORRIDORS = new Set<CorridorId>(['novels', 'epics', 'wisdom', 'heritage']);
const VALID_WORK_TYPES = new Set<WorkType>(['original', 'translated', 'republish']);
const VALID_NOVEL_STATUSES = new Set<NovelStatus>(['ongoing', 'completed', 'paused']);
const VALID_CHAPTER_TYPES = new Set<ChapterType>(['narrative', 'explanatory']);
const VALID_END_STATUSES = new Set<ChapterEndStatus>(['ongoing', 'ending']);
const VALID_LANGUAGE_MODES = new Set<ChapterLanguageMode>(['ar', 'en', 'both']);

export function isSafeRasterCoverRef(url: string | undefined): boolean {
  if (!url) return true;
  if (url.length > 450000) return false;
  if (url.startsWith('https://') || url.startsWith('/images/')) return true;
  return /^data:image\/(webp|png|jpeg);base64,[A-Za-z0-9+/=]+$/i.test(url);
}

export function countWords(text: string): number {
  const cleaned = text.trim();
  if (!cleaned) return 0;
  return cleaned.split(/\s+/).filter(Boolean).length;
}

export function blocksToPlainText(blocks: ChapterBlock[]): string {
  return blocks
    .map((b) => (b.type === 'divider' ? '---' : b.text.trim()))
    .filter((line) => line.length > 0)
    .join('\n\n');
}

export function plainTextToBlocks(text: string): ChapterBlock[] {
  const normalized = text.replace(/\r\n/g, '\n').trim();
  if (!normalized) {
    return [{ id: `blk_${Date.now()}_0`, type: 'paragraph', text: '' }];
  }
  return normalized
    .split(/\n{2,}/)
    .map((chunk, idx) => {
      const trimmed = chunk.trim();
      if (trimmed === '---' || trimmed === '***') {
        return { id: `blk_${idx}`, type: 'divider' as const, text: '---' };
      }
      if (trimmed.startsWith('## ')) {
        return { id: `blk_${idx}`, type: 'heading' as const, text: trimmed.slice(3).trim() };
      }
      if (trimmed.startsWith('> ')) {
        return { id: `blk_${idx}`, type: 'quote' as const, text: trimmed.slice(2).trim() };
      }
      return { id: `blk_${idx}`, type: 'paragraph' as const, text: trimmed };
    });
}

export async function computeSha256Hex(payload: string | Uint8Array): Promise<string> {
  const bytes = typeof payload === 'string' ? new TextEncoder().encode(payload) : payload;
  if (typeof crypto !== 'undefined' && crypto.subtle && typeof crypto.subtle.digest === 'function') {
    const buffer = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer;
    const digest = await crypto.subtle.digest('SHA-256', buffer);
    return Array.from(new Uint8Array(digest))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
  }
  // Deterministic fallback hash when WebCrypto subtle is absent
  let h1 = 0x811c9dc5;
  let h2 = 0x9e3779b9;
  for (let i = 0; i < bytes.length; i++) {
    h1 ^= bytes[i];
    h1 = Math.imul(h1, 0x01000193) >>> 0;
    h2 ^= (bytes[i] + i) & 0xff;
    h2 = Math.imul(h2, 0x85ebca6b) >>> 0;
  }
  return `${h1.toString(16).padStart(8, '0')}${h2.toString(16).padStart(8, '0')}`;
}

export interface NovelMtxExportBundle {
  novel: PublishedNovelRecord;
  sections: NovelSection[];
  chapters: LogicalChapter[];
  includeCover?: boolean;
}

export interface NovelMtxExportResult {
  mtxBytes: Uint8Array;
  filename: string;
  sha256: string;
  crc32: number;
  adler32: number;
  originalBytes: number;
  compressedBytes: number;
  savingsPercent: number;
  chapterCount: number;
  sectionCount: number;
  archive: FullNovelMtxArchive;
}

export async function exportNovelToMtxArchive(
  bundle: NovelMtxExportBundle
): Promise<NovelMtxExportResult> {
  const { novel, sections, chapters, includeCover = true } = bundle;
  const sortedSections = [...sections]
    .sort((a, b) => a.orderIndex - b.orderIndex)
    .map((s) => ({
      id: s.id,
      title: s.title,
      ...(s.titleEn ? { titleEn: s.titleEn } : {}),
      orderIndex: s.orderIndex,
    }));

  const sortedChapters = [...chapters]
    .sort((a, b) => a.chapterNumber - b.chapterNumber)
    .map((ch) => ({
      id: ch.id,
      chapterNumber: ch.chapterNumber,
      title: ch.title,
      ...(ch.titleEn ? { titleEn: ch.titleEn } : {}),
      ...(ch.sectionId ? { sectionId: ch.sectionId } : {}),
      chapterType: ch.chapterType,
      endStatus: ch.endStatus,
      languageMode: ch.languageMode,
      isPublished: ch.isPublished,
      editions: {
        ...(ch.editions.ar ? { ar: ch.editions.ar } : {}),
        ...(ch.editions.en ? { en: ch.editions.en } : {}),
      },
    }));

  const coverUrl = includeCover && isSafeRasterCoverRef(novel.coverUrl) ? novel.coverUrl : '';

  const corePayload = {
    novel: {
      id: novel.id,
      title: novel.title,
      ...(novel.titleEn ? { titleEn: novel.titleEn } : {}),
      authorId: novel.authorId,
      authorName: novel.authorName,
      workType: novel.workType || 'original',
      ...(novel.originalAuthor ? { originalAuthor: novel.originalAuthor } : {}),
      ...(novel.firstAuthor ? { firstAuthor: novel.firstAuthor } : {}),
      ...(novel.supportMethod ? { supportMethod: novel.supportMethod } : {}),
      novelStatus: novel.novelStatus || 'ongoing',
      categoryGroup: novel.categoryGroup,
      genre: novel.genre,
      ...(novel.originLanguage ? { originLanguage: novel.originLanguage } : {}),
      ...(novel.languageCode ? { languageCode: novel.languageCode } : {}),
      description: novel.description,
      ...(coverUrl ? { coverUrl } : {}),
      ...(novel.tags?.length ? { tags: novel.tags } : {}),
    },
    sections: sortedSections,
    chapters: sortedChapters,
  };

  const sha256 = await computeSha256Hex(JSON.stringify(corePayload));
  const archive: FullNovelMtxArchive = {
    format: 'mtx-full-novel-v1',
    exportedAt: new Date().toISOString(),
    sha256,
    ...corePayload,
  };

  const jsonPayload = JSON.stringify(archive);
  const metadata: MtxMetadata = {
    title: novel.title,
    author: novel.authorName || 'أروقة الخلود',
    chapterTitle: `${sortedChapters.length} Chapters Full Archive`,
    chapterIndex: sortedChapters.length,
    createdAt: archive.exportedAt,
    genre: novel.genre,
    languageCode: novel.languageCode || 'ar',
    editionLabel: 'mtx-full-novel-v1',
    wordCount: sortedChapters.reduce(
      (sum, c) => sum + (c.editions.ar?.wordCount || 0) + (c.editions.en?.wordCount || 0),
      0
    ),
    tags: novel.tags || [],
  };

  const compressed = await compressToMtx(jsonPayload, metadata, {
    profile: 'maximum',
    languageHint: 'mixed',
  });

  const safeSlug = (novel.titleEn || novel.title || novel.id)
    .trim()
    .replace(/[^\p{L}\p{N}_-]+/gu, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 60) || 'novel';

  return {
    mtxBytes: compressed.mtxBytes,
    filename: `${safeSlug}_full_archive.mtx`,
    sha256,
    crc32: compressed.crc32Checksum,
    adler32: compressed.checksum,
    originalBytes: compressed.originalUtf8Bytes,
    compressedBytes: compressed.compressedBytes,
    savingsPercent: compressed.savingsPercent,
    chapterCount: sortedChapters.length,
    sectionCount: sortedSections.length,
    archive,
  };
}

export async function verifyExportedMtxBytes(
  mtxBytes: Uint8Array,
  expected: { novelId: string; chapterCount: number; sha256: string }
): Promise<{ ok: boolean; error?: string; archive?: FullNovelMtxArchive }> {
  try {
    const archive = await parseAndValidateMtxArchive(mtxBytes);
    if (archive.novel.id !== expected.novelId) {
      return { ok: false, error: 'Archive novel ID mismatch during verification.' };
    }
    if (archive.chapters.length !== expected.chapterCount) {
      return { ok: false, error: 'Archive chapter count mismatch during verification.' };
    }
    if (archive.sha256 !== expected.sha256) {
      return { ok: false, error: 'Archive SHA-256 mismatch during verification.' };
    }
    return { ok: true, archive };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'MTX verification failed.',
    };
  }
}

function validateEdition(ed: unknown): ChapterLanguageEdition | undefined {
  if (!ed || typeof ed !== 'object') return undefined;
  const raw = ed as Partial<ChapterLanguageEdition>;
  if (typeof raw.plainText !== 'string' && !Array.isArray(raw.blocks)) return undefined;
  const blocks: ChapterBlock[] = Array.isArray(raw.blocks)
    ? raw.blocks
        .filter((b): b is ChapterBlock => Boolean(b && typeof b === 'object' && typeof b.text === 'string'))
        .map((b, idx) => ({
          id: typeof b.id === 'string' && b.id ? b.id : `blk_${idx}`,
          type: b.type === 'heading' || b.type === 'quote' || b.type === 'divider' ? b.type : 'paragraph',
          text: b.text,
        }))
    : plainTextToBlocks(String(raw.plainText || ''));
  const plainText = typeof raw.plainText === 'string' ? raw.plainText : blocksToPlainText(blocks);
  return {
    title: typeof raw.title === 'string' ? raw.title : '',
    blocks,
    plainText,
    wordCount: typeof raw.wordCount === 'number' ? raw.wordCount : countWords(plainText),
    updatedAt: typeof raw.updatedAt === 'string' ? raw.updatedAt : new Date().toISOString(),
  };
}

export async function parseAndValidateMtxArchive(bytes: Uint8Array): Promise<FullNovelMtxArchive> {
  if (!(bytes instanceof Uint8Array) || bytes.length < 24) {
    throw new Error('ملف MTX غير صالح أو تالف.');
  }

  const decompressed = await decompressFromMtx(bytes);
  if (!decompressed.isLossless || !decompressed.integrityDetails.adler32Matched) {
    throw new Error('فشل التحقق من سلامة البيانات داخل ملف MTX (عدم تطابق البصمة).');
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(decompressed.text);
  } catch {
    throw new Error('لا يحتوي ملف MTX على بنية أرشيف رواية صالحة.');
  }

  if (!parsed || typeof parsed !== 'object') {
    throw new Error('بنية ملف MTX غير مكتملة.');
  }

  const candidate = parsed as Partial<FullNovelMtxArchive>;
  if (candidate.format !== 'mtx-full-novel-v1' || !candidate.novel || typeof candidate.novel !== 'object') {
    throw new Error('تنسيق أرشيف الرواية الكامل غير مدعوم أو غير صالح.');
  }

  const n = candidate.novel;
  if (typeof n.title !== 'string' || n.title.trim().length < 2) {
    throw new Error('عنوان الرواية مفقود داخل حزمة MTX.');
  }
  if (n.coverUrl && !isSafeRasterCoverRef(n.coverUrl)) {
    throw new Error('الغلاف المرفق داخل الحزمة بصيغة غير مسموحة (تم حظر SVG أو الروابط غير الآمنة).');
  }

  const categoryGroup: CorridorId = VALID_CORRIDORS.has(n.categoryGroup as CorridorId)
    ? (n.categoryGroup as CorridorId)
    : 'novels';
  const workType: WorkType = VALID_WORK_TYPES.has(n.workType as WorkType)
    ? (n.workType as WorkType)
    : 'original';
  const novelStatus: NovelStatus = VALID_NOVEL_STATUSES.has(n.novelStatus as NovelStatus)
    ? (n.novelStatus as NovelStatus)
    : 'ongoing';

  const sections = Array.isArray(candidate.sections)
    ? candidate.sections
        .filter((s) => s && typeof s.title === 'string' && s.title.trim().length > 0)
        .map((s, idx) => ({
          id: typeof s.id === 'string' && s.id ? s.id : `sec_${idx + 1}`,
          title: s.title.trim().slice(0, 120),
          ...(typeof s.titleEn === 'string' && s.titleEn.trim() ? { titleEn: s.titleEn.trim().slice(0, 120) } : {}),
          orderIndex: typeof s.orderIndex === 'number' ? s.orderIndex : idx,
        }))
    : [];

  if (!Array.isArray(candidate.chapters)) {
    throw new Error('قائمة الفصول مفقودة داخل حزمة MTX.');
  }

  const seenChapterNumbers = new Set<number>();
  const chapters = candidate.chapters.map((ch, idx) => {
    if (!ch || typeof ch !== 'object') {
      throw new Error(`بيانات الفصل رقم ${idx + 1} غير صالحة.`);
    }
    const chapterNumber = Number(ch.chapterNumber);
    if (!Number.isInteger(chapterNumber) || chapterNumber < 1) {
      throw new Error(`رقم فصل غير صالح داخل حزمة MTX (${String(ch.chapterNumber)}).`);
    }
    if (seenChapterNumbers.has(chapterNumber)) {
      throw new Error(`تضارب أرقام الفصول داخل الأرشيف: الفصل ${chapterNumber} مكرر.`);
    }
    seenChapterNumbers.add(chapterNumber);

    const arEdition = validateEdition(ch.editions?.ar);
    const enEdition = validateEdition(ch.editions?.en);
    if (!arEdition && !enEdition) {
      throw new Error(`الفصل رقم ${chapterNumber} لا يحتوي على نص عربي أو إنجليزي.`);
    }

    const chapterType: ChapterType = VALID_CHAPTER_TYPES.has(ch.chapterType as ChapterType)
      ? (ch.chapterType as ChapterType)
      : 'narrative';
    const endStatus: ChapterEndStatus = VALID_END_STATUSES.has(ch.endStatus as ChapterEndStatus)
      ? (ch.endStatus as ChapterEndStatus)
      : 'ongoing';
    const languageMode: ChapterLanguageMode = VALID_LANGUAGE_MODES.has(ch.languageMode as ChapterLanguageMode)
      ? (ch.languageMode as ChapterLanguageMode)
      : arEdition && enEdition
        ? 'both'
        : enEdition
          ? 'en'
          : 'ar';

    return {
      id: typeof ch.id === 'string' && ch.id ? ch.id : `ch_${chapterNumber}`,
      chapterNumber,
      title: (typeof ch.title === 'string' && ch.title.trim()) || arEdition?.title || enEdition?.title || `الفصل ${chapterNumber}`,
      ...(typeof ch.titleEn === 'string' && ch.titleEn.trim() ? { titleEn: ch.titleEn.trim() } : {}),
      ...(typeof ch.sectionId === 'string' && ch.sectionId.trim() ? { sectionId: ch.sectionId.trim() } : {}),
      chapterType,
      endStatus,
      languageMode,
      isPublished: ch.isPublished !== false,
      editions: {
        ...(arEdition ? { ar: arEdition } : {}),
        ...(enEdition ? { en: enEdition } : {}),
      },
    };
  });

  // Verify embedded SHA-256 matches reconstructed core payload
  const expectedSha = candidate.sha256 || '';
  if (expectedSha) {
    const corePayload = {
      novel: candidate.novel,
      sections: candidate.sections || [],
      chapters: candidate.chapters,
    };
    const actualSha = await computeSha256Hex(JSON.stringify(corePayload));
    if (actualSha !== expectedSha) {
      throw new Error('فشل تطابق بصمة التحقق SHA-256 لأرشيف MTX.');
    }
  }

  return {
    format: 'mtx-full-novel-v1',
    exportedAt: typeof candidate.exportedAt === 'string' ? candidate.exportedAt : new Date().toISOString(),
    sha256: expectedSha,
    novel: {
      id: typeof n.id === 'string' && n.id ? n.id : 'imported_novel',
      title: n.title.trim().slice(0, 140),
      ...(typeof n.titleEn === 'string' && n.titleEn.trim() ? { titleEn: n.titleEn.trim().slice(0, 160) } : {}),
      authorId: typeof n.authorId === 'string' ? n.authorId : '',
      authorName: typeof n.authorName === 'string' ? n.authorName.trim().slice(0, 80) : '',
      workType,
      ...(typeof n.originalAuthor === 'string' && n.originalAuthor.trim() ? { originalAuthor: n.originalAuthor.trim() } : {}),
      ...(typeof n.firstAuthor === 'string' && n.firstAuthor.trim() ? { firstAuthor: n.firstAuthor.trim() } : {}),
      ...(typeof n.supportMethod === 'string' && n.supportMethod.trim() ? { supportMethod: n.supportMethod.trim() } : {}),
      novelStatus,
      categoryGroup,
      genre: typeof n.genre === 'string' && n.genre.trim() ? n.genre.trim() : 'رواية أدبية معاصرة',
      ...(typeof n.originLanguage === 'string' ? { originLanguage: n.originLanguage } : {}),
      ...(typeof n.languageCode === 'string' ? { languageCode: n.languageCode } : {}),
      description: typeof n.description === 'string' ? n.description : '',
      ...(n.coverUrl ? { coverUrl: n.coverUrl } : {}),
      ...(Array.isArray(n.tags) ? { tags: n.tags.filter((t): t is string => typeof t === 'string').slice(0, 12) } : {}),
    },
    sections,
    chapters,
  };
}
