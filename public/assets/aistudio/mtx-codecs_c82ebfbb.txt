/**
 * MTX (Modular Text Xenon / Matrix Text) Codec Engine v2.5
 * Single-File Universal Arabic, English & Multilingual UTF-8 Compression Engine (.mtx)
 *
 * Architectural Highlights (v2.5):
 * 1. Single-File Extensible Architecture: All multilingual vocabulary banks, Unicode-aware
 *    indexing, integer-ID BPE, cryptography, version detection, partial chunk indexing,
 *    chapter edition linking, format compatibility layer, and v1.0–v2.5 decoders live in one file.
 * 2. Multilingual & Lossless Text Engine:
 *    - Independent, non-interfering Vocabulary Banks: Arabic-first (ar), English-first (en),
 *      Balanced Bilingual (mixed), plus extensible runtime registration for future languages.
 *    - 1-byte Primary Bank (0..253), 2-byte Extended Bank (254 + extId), and universal UTF-8
 *      Escape Protocol (255 + len + utf8) for arbitrary Unicode, emojis, and rare terms.
 *    - Preserves 100% exact Tashkeel, Hamza forms, English casing, contractions, whitespace,
 *      RTL/LTR order, and punctuation (zero destructive normalization).
 * 3. Advanced Indexing & Performance:
 *    - Root-indexed Radix Trie (O(1) flat dispatch table for 0x0000..0x06FF + bit-packed results).
 *    - V8 31-bit SMI Integer-ID BPE with doubly-linked token list, block-boundary isolation,
 *      backwards-linked pre-sorted occurrence chains, and Binary Max-Heap.
 *    - Zero-copy Reverse Vocabulary binding, inline UTF-8 fast escape decoding, streaming
 *      zero-alloc CRC-32, deferred-modulo Adler-32, and bounded LRU tokenization cache.
 * 4. Novel Platform Support (v2.5 M5HD):
 *    - Paragraph-aligned multi-block partial indexing for large chapters (O(1) block lookup).
 *    - Independent Arabic & English chapter edition compression + cross-edition linking metadata.
 *    - Full backward compatibility: decodes MTX v1.0, v2.0, v2.1, v2.2, v2.3, v2.4, and v2.5.
 */

import { deflateSync, inflateSync } from 'fflate';

// ============================================================================
// 1. CORE TYPES, INTERFACES & VERSION CONSTANTS
// ============================================================================

export const MTX_ENGINE_VERSION = '2.5.0';

export const MTX_MAGIC_V1 = new Uint8Array([0x4d, 0x54, 0x58, 0x31]); // 'MTX1'
export const MTX_MAGIC_V2 = new Uint8Array([0x4d, 0x54, 0x58, 0x32]); // 'MTX2'
export const MTX_MAGIC = MTX_MAGIC_V2;

export const MTX_FORMAT_VERSIONS = {
  V1_LEGACY: 1,
  V1_0: 10,
  V2_0: 20,
  V2_1: 21,
  V2_2: 22,
  V2_3: 23,
  V2_4: 24,
  V2_5: 25,
} as const;

export const MTX_VERSION = MTX_FORMAT_VERSIONS.V2_5; // Active output format version (25 = v2.5)
export const MTX_CIPHER_SECRET = 'MTX_ARABIC_SECURE_CODEC_V2_2_FORTIFIED_2026';
export const EXT_BANK_TOKEN = 254; // 2-byte extended bank escape [254, extId]
export const ESCAPE_TOKEN = 255; // Reserved for universal arbitrary UTF-8 literals
export const MTX_HEADER_SIZE = 20;

export const MTX_V23_PAYLOAD_MAGIC = new Uint8Array([0x4d, 0x33, 0x48, 0x44]); // 'M3HD'
export const MTX_V23_EXTENDED_HEADER_SIZE = 14;
export const MTX_V23_FORMAT_SPEC = 230;

export const MTX_V24_PAYLOAD_MAGIC = new Uint8Array([0x4d, 0x34, 0x48, 0x44]); // 'M4HD'
export const MTX_V24_EXTENDED_HEADER_SIZE = 18;
export const MTX_V24_FORMAT_SPEC = 240;

export const MTX_V25_PAYLOAD_MAGIC = new Uint8Array([0x4d, 0x35, 0x48, 0x44]); // 'M5HD'
export const MTX_V25_EXTENDED_HEADER_SIZE = 20;
export const MTX_V25_FORMAT_SPEC = 250;
const MTX_V25_LEN_MASK = 0xa55a3c91;
const MTX_V25_CHUNK_THRESHOLD_BYTES = 98_304; // 96 KB UTF-8 auto-chunk threshold (monolithic DEFLATE below 96KB)
const MTX_V25_CHUNK_TARGET_BYTES = 32_768; // 32 KB per chunk (matches Deflate 32KB sliding window)
const MTX_V25_CHUNK_ENTRY_SIZE = 30;

const MAX_METADATA_BYTES = 65535;
const MAX_STREAM_BYTE_LEN = 50_000_000;
const EXT_STATIC_ID_BASE = 256;
const ESCAPE_ID_BASE = 1024;
const SMI_PAIR_SHIFT = 15;
const SMI_MAX_SYMBOL_ID = 32767;
const PAIR_KEY_STRIDE_LARGE = 1048576;

export type MtxMagicType = 'MTX1' | 'MTX2';
export type MtxLanguageCode = 'ar' | 'en' | 'mixed' | string;

export interface MtxMetadata {
  title: string;
  author: string;
  chapterTitle: string;
  chapterIndex: number;
  createdAt: string;
  wordCount?: number;
  tags?: string[];
  genre?: string;
  translator?: string;
  notes?: string;
  codecVersion?: string;
  formatVersion?: number;
  // v2.5 Multilingual Novel Chapter Fields
  chapterId?: string | number;
  languageCode?: MtxLanguageCode;
  translationGroupId?: string;
  editionLabel?: string;
  bankId?: number;
  paragraphCount?: number;
  chunkCount?: number;
}

export type MtxEntryType =
  | 'prefix'
  | 'suffix'
  | 'novel'
  | 'fusion'
  | 'grapheme'
  | 'compound_tashkeel'
  | 'letter'
  | 'word'
  | 'ngram'
  | 'whitespace'
  | 'punctuation'
  | 'contraction'
  | 'escape';

export interface MtxDictionaryEntry {
  id: number;
  token: string;
  frequency: number;
  rawUtf8Bytes: number;
  totalSavedBytes: number;
  isDiacritized: boolean;
  type: MtxEntryType;
}

export type CompressionProfile = 'balanced' | 'maximum' | 'fast';

export interface MtxCompressionOptions {
  profile?: CompressionProfile;
  useCache?: boolean;
  languageHint?: 'auto' | MtxLanguageCode;
  enableChunkIndex?: 'auto' | boolean;
  targetChunkBytes?: number;
}

export interface ArabicTextAnalysis {
  totalChars: number;
  arabicLettersCount: number;
  tashkeelCount: number;
  tashkeelDensityPercent: number;
  wordCount: number;
  spaceCount: number;
  punctuationCount: number;
  detectedPrefixesCount: number;
  detectedSuffixesCount: number;
  estimatedUtf8Bytes: number;
  estimatedMtxBytes: number;
  estimatedSavingsPercent: number;
}

export interface LanguageProfileResult {
  dominantLanguage: 'ar' | 'en' | 'mixed';
  recommendedBankId: number;
  recommendedBankCode: string;
  arabicChars: number;
  latinChars: number;
  digitsAndPunct: number;
  otherUnicodeChars: number;
  arabicRatio: number;
  latinRatio: number;
}

export interface MultilingualTextAnalysis extends ArabicTextAnalysis {
  languageProfile: LanguageProfileResult;
  englishLettersCount: number;
  contractionsCount: number;
  paragraphCount: number;
  emojiAndExtendedCount: number;
  normalizedSearchPreview: string;
}

export interface MtxChunkIndexEntry {
  blockIndex: number;
  charStart: number;
  charLength: number;
  utf8ByteStart: number;
  utf8ByteLength: number;
  paragraphStart: number;
  paragraphCount: number;
  compressedByteStart: number;
  compressedByteLength: number;
  blockCrc32: number;
}

export interface MtxChunkIndexInspection {
  formatVersion: number;
  bankId: number;
  bankCode: string;
  isChunked: boolean;
  totalTokenCount: number;
  chunkCount: number;
  metadata: MtxMetadata;
  chunks: MtxChunkIndexEntry[];
}

export interface MtxCompressionResult {
  mtxBytes: Uint8Array;
  originalUtf8Bytes: number;
  compressedBytes: number;
  savingsPercent: number;
  compressionRatio: number;
  encodingDurationMs: number;
  decodingDurationMs: number;
  tokenizationDurationMs: number;
  indexingDurationMs: number;
  dictionary: MtxDictionaryEntry[];
  tokenCount: number;
  metadata: MtxMetadata;
  checksum: number;
  crc32Checksum: number;
  isLossless: boolean;
  profile: CompressionProfile;
  version: number;
  engineVersion: string;
  escapeTokensCount: number;
  bankId: number;
  languageCode: MtxLanguageCode;
  chunkCount: number;
}

export interface MtxDecompressionResult {
  text: string;
  metadata: MtxMetadata;
  decodingDurationMs: number;
  originalUtf8Bytes: number;
  compressedBytes: number;
  savingsPercent: number;
  tokenCount: number;
  dictionarySize: number;
  isLossless: boolean;
  checksum: number;
  crc32Checksum: number;
  version: number;
  engineVersion: string;
  formatLabel: string;
  decoderId: string;
  bankId?: number;
  chunkCount?: number;
  integrityDetails: {
    adler32Matched: boolean;
    crc32Verified: boolean | null;
  };
}

export interface MtxChapterEditionDescriptor {
  chapterId: string | number;
  languageCode: MtxLanguageCode;
  title?: string;
  author?: string;
  chapterTitle?: string;
  chapterIndex?: number;
  translationGroupId?: string;
  editionLabel?: string;
}

export interface MtxChapterEditionManifestEntry {
  chapterId: string | number;
  languageCode: MtxLanguageCode;
  formatVersion: number;
  bankId: number;
  originalUtf8Bytes: number;
  compressedBytes: number;
  savingsPercent: number;
  adler32Checksum: number;
  crc32Checksum: number;
  chunkCount: number;
  wordCount: number;
  isLossless: boolean;
}

export interface MtxLinkedChapterManifest {
  chapterId: string | number;
  translationGroupId: string;
  createdAt: string;
  editions: Record<string, MtxChapterEditionManifestEntry>;
}

export interface MtxParsedHeader {
  magic: MtxMagicType;
  formatVersion: number;
  flags: number;
  salt: number;
  expectedAdler32: number;
  originalUtf8Bytes: number;
  dictionaryHintCount: number;
}

export interface MtxFormatDetectionResult {
  magic: MtxMagicType;
  formatVersion: number;
  versionLabel: string;
  isLegacyFormat: boolean;
  isCurrentFormat: boolean;
  isSupported: boolean;
  header: MtxParsedHeader;
  flagsDecoded: {
    usesRadixTrie: boolean;
    usesAffixes: boolean;
    usesFusions: boolean;
    usesBpe: boolean;
    usesCipher: boolean;
    usesEscapeProtocol: boolean;
    usesExtendedV23Integrity: boolean;
    usesExtendedV24Indexing: boolean;
    usesExtendedV25Multilingual: boolean;
  };
}

export interface MtxDecodedPayload {
  text: string;
  metadata: MtxMetadata;
  tokenCount: number;
  dictionarySize: number;
  originalUtf8Bytes: number;
  expectedCrc32: number | null;
  decoderId: string;
  formatLabel: string;
  bankId?: number;
  chunkCount?: number;
  warnings?: string[];
}

export interface MtxFormatDecoder {
  readonly decoderId: string;
  readonly formatLabel: string;
  readonly supportedMagic: readonly MtxMagicType[];
  readonly supportedVersions: readonly number[];
  readonly description: string;
  canDecode(detection: MtxFormatDetectionResult): boolean;
  decode(mtxBytes: Uint8Array, detection: MtxFormatDetectionResult): MtxDecodedPayload;
}

export interface DecoderRegistrationInfo {
  decoderId: string;
  formatLabel: string;
  supportedMagic: readonly string[];
  supportedVersions: readonly number[];
  description: string;
}

export interface LegacyDecoderProfile {
  vocabulary?: readonly string[];
  cipherSecret?: string;
  customDecryptor?: (encrypted: Uint8Array, salt: number) => Uint8Array;
}

export interface DownloadResult {
  dataUrl: string;
  filename: string;
  savedViaDialog: boolean;
}

export interface MtxCacheStats {
  tokenizationEntries: number;
  tokenizationBytes: number;
  tokenizationHits: number;
  tokenizationMisses: number;
  secretCacheEntries: number;
}

export interface VocabularyBankConfig {
  bankId: number;
  code: string;
  label: string;
  primaryTokens: readonly string[];
  extendedTokens: readonly string[];
}

// ============================================================================
// 2. ERROR HIERARCHY
// ============================================================================

export class MtxError extends Error {
  readonly code: string;

  constructor(code: string, message: string) {
    super(message);
    this.name = 'MtxError';
    this.code = code;
  }
}

export class MtxInvalidFormatError extends MtxError {
  constructor(message: string) {
    super('MTX_INVALID_FORMAT', message);
    this.name = 'MtxInvalidFormatError';
  }
}

export class MtxCorruptDataError extends MtxError {
  constructor(message: string) {
    super('MTX_CORRUPT_DATA', message);
    this.name = 'MtxCorruptDataError';
  }
}

export class MtxUnsupportedVersionError extends MtxError {
  readonly detectedVersion: number;
  readonly supportedVersions: readonly number[];

  constructor(detectedVersion: number, supportedVersions: readonly number[], message?: string) {
    super(
      'MTX_UNSUPPORTED_VERSION',
      message ||
        `إصدار تنسيق MTX غير مدعوم (${detectedVersion}). الإصدارات المدعومة حالياً: ${supportedVersions.join(', ')}.`
    );
    this.name = 'MtxUnsupportedVersionError';
    this.detectedVersion = detectedVersion;
    this.supportedVersions = supportedVersions;
  }
}

// ============================================================================
// 3. SINGLETON CODECS, CHECKSUMS & HARDENED KEYSTREAM CIPHER
// ============================================================================

const SHARED_ENCODER = new TextEncoder();
const SHARED_DECODER = new TextDecoder('utf-8', { fatal: false });

const CRC32_TABLE: Uint32Array = (() => {
  const table = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let k = 0; k < 8; k++) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    table[i] = c >>> 0;
  }
  return table;
})();

export function calculateCrc32Bytes(bytes: Uint8Array): number {
  let crc = 0 ^ -1;
  const len = bytes.length;
  for (let i = 0; i < len; i++) {
    crc = (crc >>> 8) ^ CRC32_TABLE[(crc ^ bytes[i]) & 0xff];
  }
  return (crc ^ -1) >>> 0;
}

export function calculateCrc32(str: string): number {
  let crc = 0 ^ -1;
  const len = str.length;
  for (let i = 0; i < len; i++) {
    const code = str.charCodeAt(i);
    if (code < 0x80) {
      crc = (crc >>> 8) ^ CRC32_TABLE[(crc ^ code) & 0xff];
    } else if (code < 0x800) {
      crc = (crc >>> 8) ^ CRC32_TABLE[(crc ^ (0xc0 | (code >>> 6))) & 0xff];
      crc = (crc >>> 8) ^ CRC32_TABLE[(crc ^ (0x80 | (code & 0x3f))) & 0xff];
    } else if (code >= 0xd800 && code <= 0xdbff) {
      if (i + 1 < len) {
        const next = str.charCodeAt(i + 1);
        if (next >= 0xdc00 && next <= 0xdfff) {
          const cp = 0x10000 + ((code - 0xd800) << 10) + (next - 0xdc00);
          crc = (crc >>> 8) ^ CRC32_TABLE[(crc ^ (0xf0 | (cp >>> 18))) & 0xff];
          crc = (crc >>> 8) ^ CRC32_TABLE[(crc ^ (0x80 | ((cp >>> 12) & 0x3f))) & 0xff];
          crc = (crc >>> 8) ^ CRC32_TABLE[(crc ^ (0x80 | ((cp >>> 6) & 0x3f))) & 0xff];
          crc = (crc >>> 8) ^ CRC32_TABLE[(crc ^ (0x80 | (cp & 0x3f))) & 0xff];
          i++;
          continue;
        }
      }
      crc = (crc >>> 8) ^ CRC32_TABLE[(crc ^ 0xef) & 0xff];
      crc = (crc >>> 8) ^ CRC32_TABLE[(crc ^ 0xbf) & 0xff];
      crc = (crc >>> 8) ^ CRC32_TABLE[(crc ^ 0xbd) & 0xff];
    } else if (code >= 0xdc00 && code <= 0xdfff) {
      crc = (crc >>> 8) ^ CRC32_TABLE[(crc ^ 0xef) & 0xff];
      crc = (crc >>> 8) ^ CRC32_TABLE[(crc ^ 0xbf) & 0xff];
      crc = (crc >>> 8) ^ CRC32_TABLE[(crc ^ 0xbd) & 0xff];
    } else {
      crc = (crc >>> 8) ^ CRC32_TABLE[(crc ^ (0xe0 | (code >>> 12))) & 0xff];
      crc = (crc >>> 8) ^ CRC32_TABLE[(crc ^ (0x80 | ((code >>> 6) & 0x3f))) & 0xff];
      crc = (crc >>> 8) ^ CRC32_TABLE[(crc ^ (0x80 | (code & 0x3f))) & 0xff];
    }
  }
  return (crc ^ -1) >>> 0;
}

export function calculateAdler32(str: string): number {
  let a = 1;
  let b = 0;
  const len = str.length;
  let i = 0;
  while (i < len) {
    let chunkEnd = i + 5552;
    if (chunkEnd > len) chunkEnd = len;
    while (i < chunkEnd) {
      a += str.charCodeAt(i++);
      b += a;
    }
    a %= 65521;
    b %= 65521;
  }
  return ((b << 16) | a) >>> 0;
}

export function fnv1a32(items: readonly string[]): number {
  let hash = 0x811c9dc5;
  for (const item of items) {
    for (let i = 0; i < item.length; i++) {
      hash ^= item.charCodeAt(i);
      hash = Math.imul(hash, 0x01000193) >>> 0;
    }
    hash ^= 0xff;
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return hash >>> 0;
}

function fnv1a32String(str: string): number {
  let hash = 0x811c9dc5;
  const len = str.length;
  for (let i = 0; i < len; i++) {
    hash ^= str.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return hash >>> 0;
}

const DEFAULT_SECRET_BYTES: Uint8Array = (() => {
  const arr = new Uint8Array(MTX_CIPHER_SECRET.length);
  for (let i = 0; i < MTX_CIPHER_SECRET.length; i++) {
    arr[i] = MTX_CIPHER_SECRET.charCodeAt(i) & 0xff;
  }
  return arr;
})();

const SECRET_BYTES_CACHE = new Map<string, Uint8Array>();

function getSecretBytes(secret: string): Uint8Array {
  if (secret === MTX_CIPHER_SECRET) return DEFAULT_SECRET_BYTES;
  let cached = SECRET_BYTES_CACHE.get(secret);
  if (!cached) {
    if (SECRET_BYTES_CACHE.size >= 8) {
      const oldestKey = SECRET_BYTES_CACHE.keys().next().value;
      if (oldestKey !== undefined) SECRET_BYTES_CACHE.delete(oldestKey);
    }
    cached = new Uint8Array(secret.length);
    for (let i = 0; i < secret.length; i++) {
      cached[i] = secret.charCodeAt(i) & 0xff;
    }
    SECRET_BYTES_CACHE.set(secret, cached);
  }
  return cached;
}

export function applyMtxKeystream(
  data: Uint8Array,
  salt: number,
  secret: string = MTX_CIPHER_SECRET
): Uint8Array {
  const len = data.length;
  const result = new Uint8Array(len);
  const secBytes = getSecretBytes(secret);
  const secLen = secBytes.length;

  let s0 = (salt ^ 0x9e3779b9) >>> 0;
  let s1 = (salt ^ 0x6c62272e) >>> 0;
  let s2 = 0x85ebca6b >>> 0;
  let s3 = 0xc2b2ae35 >>> 0;
  let secIdx = 0;

  for (let i = 0; i < len; i++) {
    s0 = (s0 + s1) >>> 0;
    s3 = (((s3 ^ s0) << 16) | ((s3 ^ s0) >>> 16)) >>> 0;
    s2 = (s2 + s3) >>> 0;
    s1 = (((s1 ^ s2) << 12) | ((s1 ^ s2) >>> 20)) >>> 0;
    s0 = (s0 + s1) >>> 0;
    s3 = (((s3 ^ s0) << 8) | ((s3 ^ s0) >>> 24)) >>> 0;
    s2 = (s2 + s3) >>> 0;
    s1 = (((s1 ^ s2) << 7) | ((s1 ^ s2) >>> 25)) >>> 0;

    const prn = (s0 ^ s2) & 0xff;
    result[i] = data[i] ^ (prn ^ secBytes[secIdx]);
    if (++secIdx === secLen) secIdx = 0;
  }

  return result;
}

export function applyLegacyLcgKeystream(
  data: Uint8Array,
  salt: number,
  secret: string,
  multiplier = 1664525,
  increment = 1013904223
): Uint8Array {
  const len = data.length;
  const result = new Uint8Array(len);
  const secBytes = secret.length > 0 ? getSecretBytes(secret) : null;
  const secLen = secBytes ? secBytes.length : 1;
  let state = salt >>> 0;
  let secIdx = 0;

  for (let i = 0; i < len; i++) {
    state = (Math.imul(state, multiplier) + increment) >>> 0;
    const keyByte = secBytes ? secBytes[secIdx] : 0;
    if (++secIdx === secLen) secIdx = 0;
    const prn = (state >>> 16) & 0xff;
    result[i] = data[i] ^ (prn ^ keyByte);
  }

  return result;
}

// ============================================================================
// 4. VOCABULARIES, HASH INDEXES, MULTILINGUAL BANKS & ROOT-INDEXED TRIE
// ============================================================================

const STATIC_CHARS: string[] = (() => {
  const list: string[] = [];
  for (let c = 0x0621; c <= 0x064a; c++) list.push(String.fromCharCode(c));
  for (let c = 0x064b; c <= 0x0652; c++) list.push(String.fromCharCode(c));
  list.push('\u0670', '\u0671', '\u0640', 'ٱ', 'پ', 'چ', 'ژ', 'گ');
  list.push(
    ' ',
    '\n',
    '\t',
    '،',
    '؛',
    '؟',
    '!',
    '.',
    ':',
    '«',
    '»',
    '"',
    "'",
    '-',
    '—',
    '(',
    ')',
    '[',
    ']',
    '{',
    '}',
    '/',
    '\\',
    '@',
    '#',
    '%',
    '&',
    '*',
    '+',
    '=',
    '<',
    '>',
    '_',
    '^',
    '|',
    '~',
    '“',
    '”',
    '…'
  );
  for (let d = 0; d <= 9; d++) list.push(d.toString());
  const arabicDigits = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
  for (const ad of arabicDigits) list.push(ad);
  return list;
})();

const FUSED_PUNCTUATION: string[] = [
  '، ',
  '؛ ',
  '. ',
  '؟ ',
  '! ',
  ': ',
  '.\n',
  '،\n',
  '\n\n',
  '\n— ',
  '— ',
  '\n- ',
  '- ',
  ' «',
  '» ',
  '... ',
  '.. ',
  ' (',
  ') ',
];

const MORPH_PREFIXES: string[] = [
  'وبالـ',
  'كالـ',
  'فالـ',
  'للـ',
  'والـ',
  'بالـ',
  'الـ',
  'ال',
  'وبـ',
  'ولـ',
  'فلـ',
  'أبالـ',
  'وكالـ',
  'فكالـ',
  'فلما ',
  'ولما ',
  'وحين ',
  'فحين ',
  'وإذا ',
  'فإذا ',
  'حيث ',
  'كذلك ',
];

const MORPH_SUFFIXES: string[] = [
  'هما',
  'هم',
  'هن',
  'كم',
  'كن',
  'نا',
  'ها',
  'ين',
  'ون',
  'ات',
  'ان',
  'ية',
  'تك',
  'تهم',
  'تها',
  'تنا',
  'تم',
  'تني',
  'ني',
  'ه',
];

const TASHKEEL_GRAPHEMES: string[] = [
  'َّ',
  'ُّ',
  'ِّ',
  'ًّ',
  'ٌّ',
  'ٍّ',
  'كَ',
  'كِ',
  'كُ',
  'كْ',
  'مَ',
  'مِ',
  'مُ',
  'مْ',
  'نَ',
  'نِ',
  'نُ',
  'نْ',
  'لَ',
  'لِ',
  'لُ',
  'لْ',
  'رَ',
  'رِ',
  'رُ',
  'رْ',
  'فَ',
  'فِ',
  'بَ',
  'بِ',
  'تَ',
  'تِ',
  'يَ',
  'يِ',
  'سَ',
  'سِ',
  'سُ',
  'هَ',
  'هِ',
  'هُ',
];

const NOVEL_CONTEXT_WORDS: string[] = [
  'قال',
  'قالت',
  'كان',
  'كانت',
  'في',
  'على',
  'من',
  'إلى',
  'عن',
  'مع',
  'هذا',
  'هذه',
  'ذلك',
  'تلك',
  'الذي',
  'التي',
  'كل',
  'أن',
  'إن',
  'لم',
  'ثم',
  'بعد',
  'قبل',
  'بين',
  'عندما',
  'كما',
  'غير',
  'حتى',
  'فقد',
  'لقد',
  'كَانَ',
  'فِي',
  'مِنْ',
  'عَلَى',
  'إِلَى',
  'قَالَ',
  'قَالَتْ',
  'لَمْ',
  'كُلّ',
  'الَّذِي',
  'الَّتِي',
  'إِنَّ',
  'أَنَّ',
  'لَكِنَّ',
  'لَيْسَ',
  'كَانُوا',
  'يَكُونُ',
  'هَذَا',
  'هَذِهِ',
  'ذَلِكَ',
  'تِلْكَ',
  'عليه',
  'عليها',
  'إليه',
  'إليها',
  'منه',
  'منها',
  'عنه',
  'عنها',
  'فيه',
  'فيها',
  'بها',
  'به',
];

const FUSED_SET = new Set<string>(FUSED_PUNCTUATION);
const PREFIX_SET = new Set<string>(MORPH_PREFIXES);
const SUFFIX_SET = new Set<string>(MORPH_SUFFIXES);
const NOVEL_SET = new Set<string>(NOVEL_CONTEXT_WORDS);
const GRAPHEME_SET = new Set<string>(TASHKEEL_GRAPHEMES);

// Legacy & v2.2–v2.4 Fixed Precompiled Vocabulary (MUST remain invariant for backward compatibility)
export const PRECOMPILED_VOCAB: string[] = (() => {
  const list: string[] = [];
  const seen = new Set<string>();
  const allItems = [
    ...STATIC_CHARS,
    ...FUSED_PUNCTUATION,
    ...MORPH_PREFIXES,
    ...MORPH_SUFFIXES,
    ...TASHKEEL_GRAPHEMES,
    ...NOVEL_CONTEXT_WORDS,
  ];
  for (const item of allItems) {
    if (!seen.has(item)) {
      seen.add(item);
      list.push(item);
    }
  }
  return list.length > 225 ? list.slice(0, 225) : list;
})();

export const PRECOMPILED_VOCAB_LEN = PRECOMPILED_VOCAB.length;
export const PRECOMPILED_VOCAB_HASH: number = fnv1a32(PRECOMPILED_VOCAB);

// Multilingual Static Building Blocks for v2.5 Banks
const ASCII_LOWER_LETTERS: string[] = Array.from({ length: 26 }, (_, i) =>
  String.fromCharCode(97 + i)
);
const ASCII_UPPER_LETTERS: string[] = Array.from({ length: 26 }, (_, i) =>
  String.fromCharCode(65 + i)
);
const ARABIC_CORE_LETTERS: string[] = (() => {
  const arr: string[] = [];
  for (let c = 0x0621; c <= 0x064a; c++) arr.push(String.fromCharCode(c));
  for (let c = 0x064b; c <= 0x0652; c++) arr.push(String.fromCharCode(c));
  arr.push('\u0670', '\u0671', '\u0640', 'ٱ', 'پ', 'چ', 'ژ', 'گ');
  return arr;
})();
const DIGITS_ASCII: string[] = Array.from({ length: 10 }, (_, i) => String.fromCharCode(48 + i));
const DIGITS_ARABIC_INDIC: string[] = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];

const ENGLISH_FUSED_AND_CONTRACTIONS: string[] = [
  '. ',
  ', ',
  '? ',
  '! ',
  ': ',
  '; ',
  '.\n',
  ',\n',
  '\n\n',
  '" ',
  ' "',
  '” ',
  ' “',
  "'s",
  "n't",
  "'t",
  "'re",
  "'ve",
  "'ll",
  "'d",
  "'m",
  '— ',
  '... ',
  ' - ',
];

const ENGLISH_MORPHEMES_AND_NGRAMS: string[] = [
  'th',
  'he',
  'in',
  'er',
  'an',
  're',
  'on',
  'at',
  'en',
  'nd',
  'ti',
  'es',
  'or',
  'te',
  'of',
  'ed',
  'is',
  'it',
  'al',
  'ar',
  'st',
  'to',
  'nt',
  'ng',
  'se',
  'ha',
  'as',
  'ou',
  'io',
  'le',
  've',
  'co',
  'me',
  'de',
  'hi',
  'ri',
  'ro',
  'ic',
  'ne',
  'ea',
  'ra',
  'ce',
  'ing',
  'tion',
  'ment',
  'ness',
  'able',
  'ful',
  'less',
  'ous',
  'ly',
  'un',
  'pre',
  'igh',
  'ould',
];

const ENGLISH_NOVEL_WORDS: string[] = [
  'the ',
  'and ',
  'was ',
  'that ',
  'with ',
  'his ',
  'her ',
  'for ',
  'she ',
  'you ',
  'said ',
  'not ',
  'but ',
  'had ',
  'have ',
  'from ',
  'they ',
  'were ',
  'this ',
  'The ',
  'He ',
  'She ',
  'It ',
  'their ',
  'would ',
  'there ',
  'could ',
  'what ',
  'when ',
  'into ',
  'which ',
  'about ',
  'more ',
  'will ',
  'him ',
  'all ',
  'out ',
  'one ',
  'up ',
  'are ',
  'been ',
  'who ',
  'eyes ',
  'voice ',
  'chapter ',
  'Chapter ',
];

const ARABIC_V25_PREFIXES: string[] = [
  'وال',
  'بال',
  'كال',
  'فال',
  'لل',
  'وبال',
  'وكال',
  'فكال',
  'ال',
  'ول',
  'فل',
];

const ARABIC_V25_NOVEL_WORDS: string[] = [
  'في ',
  'من ',
  'على ',
  'إلى ',
  'عن ',
  'مع ',
  'أن ',
  'إن ',
  'كان ',
  'كانت ',
  'قال ',
  'قالت ',
  'الذي ',
  'التي ',
  'هذا ',
  'هذه ',
  'ذلك ',
  'تلك ',
  'ثم ',
  'لم ',
  'بعد ',
  'قبل ',
  'بين ',
  'كما ',
  'غير ',
  'حتى ',
  'كل ',
  'عندما ',
  'فقد ',
  'لقد ',
  'عليه',
  'عليها',
  'إليه',
  'إليها',
  'منه',
  'منها',
  'فيه',
  'فيها',
  'كَانَ',
  'فِي',
  'مِنْ',
  'عَلَى',
  'إِلَى',
  'قَالَ',
];

function deduplicateVocabList(items: readonly string[], maxLen: number): string[] {
  const out: string[] = [];
  const seen = new Set<string>();
  for (const item of items) {
    if (item.length === 0 || seen.has(item)) continue;
    seen.add(item);
    out.push(item);
    if (out.length >= maxLen) break;
  }
  return out;
}

const CONTRACTION_SET = new Set<string>([
  "'s",
  "n't",
  "'t",
  "'re",
  "'ve",
  "'ll",
  "'d",
  "'m",
]);

export function getUtf8ByteLength(str: string): number {
  let bytes = 0;
  const len = str.length;
  for (let i = 0; i < len; i++) {
    const code = str.charCodeAt(i);
    if (code < 0x80) {
      bytes += 1;
    } else if (code < 0x800) {
      bytes += 2;
    } else if (code >= 0xd800 && code <= 0xdbff) {
      if (i + 1 < len) {
        const next = str.charCodeAt(i + 1);
        if (next >= 0xdc00 && next <= 0xdfff) {
          bytes += 4;
          i++;
          continue;
        }
      }
      bytes += 3;
    } else {
      bytes += 3;
    }
  }
  return bytes;
}

export function containsArabicTashkeel(text: string): boolean {
  for (let i = 0; i < text.length; i++) {
    const c = text.charCodeAt(i);
    if ((c >= 0x064b && c <= 0x065f) || c === 0x0670) return true;
  }
  return false;
}

const PUNCT_CHAR_SET = new Set<string>(
  '،؛؟!«»""\'\'“”‘’—-.:()[]{}/\\@#$%&*+=<>_^|~…'
);

export function getSemanticType(token: string): MtxEntryType {
  if (CONTRACTION_SET.has(token)) return 'contraction';
  if (FUSED_SET.has(token)) return 'fusion';
  if (PREFIX_SET.has(token)) return 'prefix';
  if (SUFFIX_SET.has(token)) return 'suffix';
  if (NOVEL_SET.has(token)) return 'novel';
  if (GRAPHEME_SET.has(token)) {
    return token.includes('ّ') ? 'compound_tashkeel' : 'grapheme';
  }
  const len = token.length;
  if (len > 0) {
    let allWs = true;
    let allPunct = true;
    for (let i = 0; i < len; i++) {
      const ch = token[i];
      const code = token.charCodeAt(i);
      if (code !== 32 && code !== 10 && code !== 9 && code !== 13) allWs = false;
      if (!PUNCT_CHAR_SET.has(ch)) allPunct = false;
      if (!allWs && !allPunct) break;
    }
    if (allWs) return 'whitespace';
    if (allPunct) return 'punctuation';
  }
  if (len === 1) return 'letter';
  if (len === 2 && containsArabicTashkeel(token)) return 'grapheme';
  if (token.endsWith(' ') && len >= 3) return 'word';
  return 'ngram';
}

// Legacy v2.2–v2.4 Hash & Lookup Tables
const PRECOMPILED_VOCAB_INDEX = new Map<string, number>();
const PRECOMPILED_VOCAB_UTF8_LEN = new Uint8Array(PRECOMPILED_VOCAB_LEN);
const PRECOMPILED_VOCAB_TASHKEEL = new Uint8Array(PRECOMPILED_VOCAB_LEN);
const PRECOMPILED_VOCAB_TYPES: MtxEntryType[] = new Array<MtxEntryType>(PRECOMPILED_VOCAB_LEN);

for (let i = 0; i < PRECOMPILED_VOCAB_LEN; i++) {
  const tok = PRECOMPILED_VOCAB[i];
  PRECOMPILED_VOCAB_INDEX.set(tok, i);
  PRECOMPILED_VOCAB_UTF8_LEN[i] = getUtf8ByteLength(tok);
  PRECOMPILED_VOCAB_TASHKEEL[i] = containsArabicTashkeel(tok) ? 1 : 0;
  PRECOMPILED_VOCAB_TYPES[i] = getSemanticType(tok);
}

// Pre-populated 255-slot scratch table for v2.2–v2.4 zero-copy reverse lookup
const FAST_DECODE_VOCAB_SLOTS: (string | undefined)[] = new Array<string | undefined>(255);
for (let i = 0; i < PRECOMPILED_VOCAB_LEN; i++) {
  FAST_DECODE_VOCAB_SLOTS[i] = PRECOMPILED_VOCAB[i];
}
let fastDecodePrevEnd = PRECOMPILED_VOCAB_LEN;

export class ReverseVocabularyIndex {
  private readonly dynamicTokens: readonly string[];
  readonly totalSize: number;

  constructor(dynamicTokens: readonly string[]) {
    this.dynamicTokens = dynamicTokens;
    this.totalSize = PRECOMPILED_VOCAB_LEN + dynamicTokens.length;
  }

  get(id: number): string | undefined {
    if (id < PRECOMPILED_VOCAB_LEN) {
      return PRECOMPILED_VOCAB[id];
    }
    return this.dynamicTokens[id - PRECOMPILED_VOCAB_LEN];
  }

  getOrEmpty(id: number): string {
    if (id < PRECOMPILED_VOCAB_LEN) {
      return PRECOMPILED_VOCAB[id] ?? '';
    }
    return this.dynamicTokens[id - PRECOMPILED_VOCAB_LEN] ?? '';
  }

  bindFlatTable(): readonly (string | undefined)[] {
    const dynLen = this.dynamicTokens.length;
    const newEnd = Math.min(255, PRECOMPILED_VOCAB_LEN + dynLen);
    for (let i = 0; i < dynLen && PRECOMPILED_VOCAB_LEN + i < 255; i++) {
      FAST_DECODE_VOCAB_SLOTS[PRECOMPILED_VOCAB_LEN + i] = this.dynamicTokens[i];
    }
    for (let i = newEnd; i < fastDecodePrevEnd; i++) {
      FAST_DECODE_VOCAB_SLOTS[i] = undefined;
    }
    fastDecodePrevEnd = newEnd;
    return FAST_DECODE_VOCAB_SLOTS;
  }
}

const ROOT_FLAT_LIMIT = 0x0700; // Covers ASCII + Latin + Arabic block (0x0000..0x06FF) in O(1) array lookup

class TrieNode {
  token: string | null = null;
  tokenId = -1;
  children = new Map<number, TrieNode>();
}

export class FastVocabularyTrie {
  root = new TrieNode();
  private readonly rootFastTable: (TrieNode | undefined)[] = new Array<TrieNode | undefined>(
    ROOT_FLAT_LIMIT
  );

  insert(word: string, tokenId = -1): void {
    if (word.length === 0) return;
    const firstCode = word.charCodeAt(0);
    let curr: TrieNode;

    if (firstCode < ROOT_FLAT_LIMIT) {
      let node = this.rootFastTable[firstCode];
      if (!node) {
        node = new TrieNode();
        this.rootFastTable[firstCode] = node;
        this.root.children.set(firstCode, node);
      }
      curr = node;
    } else {
      let node = this.root.children.get(firstCode);
      if (!node) {
        node = new TrieNode();
        this.root.children.set(firstCode, node);
      }
      curr = node;
    }

    for (let i = 1; i < word.length; i++) {
      const code = word.charCodeAt(i);
      let next: TrieNode | undefined = curr.children.get(code);
      if (!next) {
        next = new TrieNode();
        curr.children.set(code, next);
      }
      curr = next;
    }
    curr.token = word;
    curr.tokenId = tokenId;
  }

  findLongestPrefix(text: string, startIndex: number): string | null {
    const len = text.length;
    if (startIndex >= len) return null;

    const firstCode = text.charCodeAt(startIndex);
    const startNode =
      firstCode < ROOT_FLAT_LIMIT
        ? this.rootFastTable[firstCode]
        : this.root.children.get(firstCode);
    if (!startNode) return null;

    let curr: TrieNode = startNode;
    let longest: string | null = curr.token;
    for (let i = startIndex + 1; i < len; i++) {
      const next: TrieNode | undefined = curr.children.get(text.charCodeAt(i));
      if (!next) break;
      curr = next;
      if (curr.token !== null) {
        longest = curr.token;
      }
    }
    return longest;
  }

  findLongestPrefixPacked(text: string, startIndex: number): number {
    const len = text.length;
    if (startIndex >= len) return 0;

    const firstCode = text.charCodeAt(startIndex);
    const startNode =
      firstCode < ROOT_FLAT_LIMIT
        ? this.rootFastTable[firstCode]
        : this.root.children.get(firstCode);
    if (!startNode) return 0;

    let curr: TrieNode = startNode;
    let bestPacked = curr.tokenId >= 0 ? (1 << 10) | (curr.tokenId + 1) : 0;
    for (let i = startIndex + 1; i < len; i++) {
      const next: TrieNode | undefined = curr.children.get(text.charCodeAt(i));
      if (!next) break;
      curr = next;
      if (curr.tokenId >= 0) {
        bestPacked = ((i - startIndex + 1) << 10) | (curr.tokenId + 1);
      }
    }
    return bestPacked;
  }
}

/**
 * Compiled Multilingual Vocabulary Bank for MTX v2.5+
 * Keeps each language's 1-byte Primary Bank independent while sharing universal 2-byte Extended fallback.
 */
export class CompiledVocabularyBank {
  readonly bankId: number;
  readonly code: string;
  readonly label: string;
  readonly primaryVocab: readonly string[];
  readonly extendedVocab: readonly string[];
  readonly primaryLen: number;
  readonly extStaticLen: number;
  readonly primaryDynCap: number;
  readonly extDynCap: number;
  readonly totalDynCap: number;
  readonly extDynIdBase: number;
  readonly vocabHash: number;
  readonly trie: FastVocabularyTrie;
  readonly tokenToId = new Map<string, number>();
  readonly primaryUtf8Len: Uint8Array;
  readonly primaryTashkeel: Uint8Array;
  readonly primaryTypes: MtxEntryType[];
  readonly extUtf8Len: Uint8Array;
  readonly extTashkeel: Uint8Array;
  readonly extTypes: MtxEntryType[];
  private readonly scratchPrimary: (string | undefined)[] = new Array<string | undefined>(
    EXT_BANK_TOKEN
  );
  private readonly scratchExt: (string | undefined)[] = new Array<string | undefined>(256);
  private prevPrimaryEnd: number;
  private prevExtEnd: number;

  constructor(config: VocabularyBankConfig) {
    this.bankId = config.bankId;
    this.code = config.code;
    this.label = config.label;
    this.primaryVocab = deduplicateVocabList(config.primaryTokens, 224);
    const primarySet = new Set(this.primaryVocab);
    const filteredExt: string[] = [];
    for (const item of config.extendedTokens) {
      if (!primarySet.has(item)) filteredExt.push(item);
    }
    this.extendedVocab = deduplicateVocabList(filteredExt, 176);

    this.primaryLen = this.primaryVocab.length;
    this.extStaticLen = this.extendedVocab.length;
    this.primaryDynCap = EXT_BANK_TOKEN - this.primaryLen;
    this.extDynCap = 256 - this.extStaticLen;
    this.totalDynCap = this.primaryDynCap + this.extDynCap;
    this.extDynIdBase = EXT_STATIC_ID_BASE + this.extStaticLen;
    this.vocabHash = fnv1a32([...this.primaryVocab, ...this.extendedVocab]);

    this.trie = new FastVocabularyTrie();
    this.primaryUtf8Len = new Uint8Array(this.primaryLen);
    this.primaryTashkeel = new Uint8Array(this.primaryLen);
    this.primaryTypes = new Array<MtxEntryType>(this.primaryLen);

    for (let i = 0; i < this.primaryLen; i++) {
      const tok = this.primaryVocab[i];
      this.trie.insert(tok, i);
      this.tokenToId.set(tok, i);
      this.primaryUtf8Len[i] = getUtf8ByteLength(tok);
      this.primaryTashkeel[i] = containsArabicTashkeel(tok) ? 1 : 0;
      this.primaryTypes[i] = getSemanticType(tok);
      this.scratchPrimary[i] = tok;
    }

    this.extUtf8Len = new Uint8Array(this.extStaticLen);
    this.extTashkeel = new Uint8Array(this.extStaticLen);
    this.extTypes = new Array<MtxEntryType>(this.extStaticLen);

    for (let i = 0; i < this.extStaticLen; i++) {
      const tok = this.extendedVocab[i];
      const id = EXT_STATIC_ID_BASE + i;
      this.trie.insert(tok, id);
      this.tokenToId.set(tok, id);
      this.extUtf8Len[i] = getUtf8ByteLength(tok);
      this.extTashkeel[i] = containsArabicTashkeel(tok) ? 1 : 0;
      this.extTypes[i] = getSemanticType(tok);
      this.scratchExt[i] = tok;
    }

    this.prevPrimaryEnd = this.primaryLen;
    this.prevExtEnd = this.extStaticLen;
  }

  bindDynamicTables(dynamicTokens: readonly string[]): {
    primary: readonly (string | undefined)[];
    extended: readonly (string | undefined)[];
  } {
    const dynLen = dynamicTokens.length;
    const primaryDynCount = Math.min(dynLen, this.primaryDynCap);
    for (let i = 0; i < primaryDynCount; i++) {
      this.scratchPrimary[this.primaryLen + i] = dynamicTokens[i];
    }
    const newPrimaryEnd = this.primaryLen + primaryDynCount;
    for (let i = newPrimaryEnd; i < this.prevPrimaryEnd; i++) {
      this.scratchPrimary[i] = undefined;
    }
    this.prevPrimaryEnd = newPrimaryEnd;

    const extDynCount = Math.max(0, Math.min(dynLen - this.primaryDynCap, this.extDynCap));
    for (let i = 0; i < extDynCount; i++) {
      this.scratchExt[this.extStaticLen + i] = dynamicTokens[this.primaryDynCap + i];
    }
    const newExtEnd = this.extStaticLen + extDynCount;
    for (let i = newExtEnd; i < this.prevExtEnd; i++) {
      this.scratchExt[i] = undefined;
    }
    this.prevExtEnd = newExtEnd;

    return {
      primary: this.scratchPrimary,
      extended: this.scratchExt,
    };
  }
}

export class MtxVocabularyBankRegistry {
  private readonly banksById = new Map<number, CompiledVocabularyBank>();
  private readonly banksByCode = new Map<string, CompiledVocabularyBank>();

  register(config: VocabularyBankConfig): CompiledVocabularyBank {
    const bank = new CompiledVocabularyBank(config);
    this.banksById.set(bank.bankId, bank);
    this.banksByCode.set(bank.code.toLowerCase(), bank);
    return bank;
  }

  getById(bankId: number): CompiledVocabularyBank | undefined {
    return this.banksById.get(bankId);
  }

  getByCode(code: string): CompiledVocabularyBank | undefined {
    return this.banksByCode.get(code.toLowerCase());
  }

  listBanks(): { bankId: number; code: string; label: string; primarySize: number; extendedSize: number }[] {
    return Array.from(this.banksById.values())
      .sort((a, b) => a.bankId - b.bankId)
      .map((b) => ({
        bankId: b.bankId,
        code: b.code,
        label: b.label,
        primarySize: b.primaryLen,
        extendedSize: b.extStaticLen,
      }));
  }
}

export const defaultVocabularyRegistry = new MtxVocabularyBankRegistry();

const ARABIC_PRIMARY_LETTERS: string[] = (() => {
  const arr: string[] = [];
  for (let c = 0x0621; c <= 0x064a; c++) arr.push(String.fromCharCode(c));
  for (let c = 0x064b; c <= 0x0652; c++) arr.push(String.fromCharCode(c));
  arr.push('\u0670', '\u0671', '\u0640');
  return arr;
})();

// Bank 0: Arabic-First Novel Bank (retains full Arabic Tashkeel graphemes & vowelized words + fixes tatweel prefixes)
export const BANK_ARABIC_PRIMARY = defaultVocabularyRegistry.register({
  bankId: 0,
  code: 'ar',
  label: 'Arabic Novel Primary + English Extended',
  primaryTokens: [
    ...ARABIC_PRIMARY_LETTERS,
    ' ',
    '\n',
    '\t',
    '،',
    '؛',
    '؟',
    '!',
    '.',
    ':',
    '«',
    '»',
    '"',
    "'",
    '-',
    '—',
    '(',
    ')',
    '…',
    '“',
    '”',
    ...DIGITS_ASCII,
    ...DIGITS_ARABIC_INDIC,
    ...FUSED_PUNCTUATION,
    ...ARABIC_V25_PREFIXES,
    ...MORPH_SUFFIXES,
    ...TASHKEEL_GRAPHEMES,
    'كَانَ',
    'فِي',
    'مِنْ',
    'عَلَى',
    'إِلَى',
    'قَالَ',
    'قَالَتْ',
    'لَمْ',
    'كُلّ',
    'الَّذِي',
    'الَّتِي',
    'هَذَا',
    'هَذِهِ',
    'ذَلِكَ',
    'تِلْكَ',
    ...ARABIC_V25_NOVEL_WORDS,
  ],
  extendedTokens: [
    ...ASCII_LOWER_LETTERS,
    ...ASCII_UPPER_LETTERS,
    '[',
    ']',
    '{',
    '}',
    '/',
    '\\',
    '@',
    '#',
    '%',
    '&',
    '*',
    '+',
    '=',
    '<',
    '>',
    '_',
    '^',
    '|',
    '~',
    'ٱ',
    'پ',
    'چ',
    'ژ',
    'گ',
    ...ENGLISH_FUSED_AND_CONTRACTIONS,
    ...ENGLISH_MORPHEMES_AND_NGRAMS,
    ...ENGLISH_NOVEL_WORDS,
  ],
});

// Bank 1: English-First Novel Bank (206 static tokens -> 48 1-byte dynamic BPE slots)
export const BANK_ENGLISH_PRIMARY = defaultVocabularyRegistry.register({
  bankId: 1,
  code: 'en',
  label: 'English Novel Primary + Arabic Extended',
  primaryTokens: [
    ...ASCII_LOWER_LETTERS,
    ...ASCII_UPPER_LETTERS,
    ' ',
    '\n',
    '\t',
    '.',
    ',',
    '!',
    '?',
    ':',
    ';',
    "'",
    '"',
    '-',
    '—',
    '(',
    ')',
    '…',
    '“',
    '”',
    '’',
    '‘',
    ...DIGITS_ASCII,
    ...ENGLISH_FUSED_AND_CONTRACTIONS,
    ...ENGLISH_MORPHEMES_AND_NGRAMS,
    ...ENGLISH_NOVEL_WORDS,
  ],
  extendedTokens: [
    '[',
    ']',
    '{',
    '}',
    '/',
    '\\',
    '*',
    '&',
    '%',
    '#',
    '@',
    '+',
    '=',
    '$',
    '<',
    '>',
    '_',
    '^',
    '|',
    '~',
    ...ARABIC_CORE_LETTERS,
    '،',
    '؛',
    '؟',
    '«',
    '»',
    '، ',
    ...DIGITS_ARABIC_INDIC,
    ...ARABIC_V25_PREFIXES,
    ...ARABIC_V25_NOVEL_WORDS,
  ],
});

// Bank 2: Balanced Bilingual Arabic + English Bank (210 static tokens -> 44 1-byte dynamic BPE slots)
export const BANK_MIXED_BILINGUAL = defaultVocabularyRegistry.register({
  bankId: 2,
  code: 'mixed',
  label: 'Balanced Bilingual (Arabic + English)',
  primaryTokens: [
    ...ARABIC_PRIMARY_LETTERS,
    ...ASCII_LOWER_LETTERS,
    ...ASCII_UPPER_LETTERS,
    ' ',
    '\n',
    '\t',
    ...DIGITS_ASCII,
    '.',
    ',',
    '،',
    '؟',
    '?',
    '!',
    ':',
    ';',
    '؛',
    "'",
    '"',
    '-',
    '—',
    '(',
    ')',
    '«',
    '»',
    '“',
    '”',
    '’',
    '…',
    '. ',
    ', ',
    '، ',
    '? ',
    '؟ ',
    '! ',
    ': ',
    '.\n',
    '\n\n',
    "'s",
    "n't",
    "'t",
    "'re",
    "'ve",
    "'ll",
    '— ',
    'ال',
    'وال',
    'بال',
    'لل',
    'في ',
    'من ',
    'على ',
    'إلى ',
    'عن ',
    'مع ',
    'أن ',
    'إن ',
    'كان ',
    'كانت ',
    'قال ',
    'قالت ',
    'هذا ',
    'هذه ',
    'التي ',
    'الذي ',
    'th',
    'he',
    'in',
    'er',
    'an',
    're',
    'on',
    'at',
    'en',
    'nd',
    'es',
    'or',
    'ed',
    'is',
    'it',
    'st',
    'to',
    'ng',
    'ing',
    'tion',
    'ment',
    'ly',
    'the ',
    'and ',
    'was ',
    'that ',
    'with ',
    'his ',
    'her ',
    'for ',
    'said ',
    'not ',
    'but ',
    'you ',
    'this ',
  ],
  extendedTokens: [
    '[',
    ']',
    '{',
    '}',
    '/',
    '\\',
    '@',
    '#',
    '%',
    '&',
    '*',
    '+',
    '=',
    'ٱ',
    'پ',
    'چ',
    'ژ',
    'گ',
    ...DIGITS_ARABIC_INDIC,
    ...MORPH_SUFFIXES,
    ...TASHKEEL_GRAPHEMES,
    ...ARABIC_V25_NOVEL_WORDS,
    ...ENGLISH_MORPHEMES_AND_NGRAMS,
    ...ENGLISH_NOVEL_WORDS,
  ],
});

/**
 * Fast O(N) script/language detector for selecting the optimal v2.5 Vocabulary Bank.
 * Does NOT modify or normalize source text; decompression uses the stored bankId byte.
 */
export function detectTextLanguageProfile(text: string): LanguageProfileResult {
  const len = text.length;
  let arabicChars = 0;
  let latinChars = 0;
  let digitsAndPunct = 0;
  let otherUnicodeChars = 0;

  for (let i = 0; i < len; i++) {
    const code = text.charCodeAt(i);
    if ((code >= 0x0600 && code <= 0x06ff) || (code >= 0x0750 && code <= 0x077f)) {
      arabicChars++;
    } else if ((code >= 65 && code <= 90) || (code >= 97 && code <= 122)) {
      latinChars++;
    } else if (code < 0x80) {
      digitsAndPunct++;
    } else {
      otherUnicodeChars++;
      if (code >= 0xd800 && code <= 0xdbff && i + 1 < len) {
        const next = text.charCodeAt(i + 1);
        if (next >= 0xdc00 && next <= 0xdfff) i++;
      }
    }
  }

  const totalLetters = Math.max(1, arabicChars + latinChars);
  const arabicRatio = Math.round((arabicChars / totalLetters) * 1000) / 1000;
  const latinRatio = Math.round((latinChars / totalLetters) * 1000) / 1000;

  let dominantLanguage: 'ar' | 'en' | 'mixed';
  let recommendedBankId: number;
  let recommendedBankCode: string;

  if (latinChars === 0 && arabicChars >= 0) {
    dominantLanguage = 'ar';
    recommendedBankId = BANK_ARABIC_PRIMARY.bankId;
    recommendedBankCode = 'ar';
  } else if (arabicChars === 0 && latinChars > 0) {
    dominantLanguage = 'en';
    recommendedBankId = BANK_ENGLISH_PRIMARY.bankId;
    recommendedBankCode = 'en';
  } else if (arabicChars >= latinChars * 4) {
    dominantLanguage = 'ar';
    recommendedBankId = BANK_ARABIC_PRIMARY.bankId;
    recommendedBankCode = 'ar';
  } else if (latinChars >= arabicChars * 4) {
    dominantLanguage = 'en';
    recommendedBankId = BANK_ENGLISH_PRIMARY.bankId;
    recommendedBankCode = 'en';
  } else {
    dominantLanguage = 'mixed';
    recommendedBankId = BANK_MIXED_BILINGUAL.bankId;
    recommendedBankCode = 'mixed';
  }

  return {
    dominantLanguage,
    recommendedBankId,
    recommendedBankCode,
    arabicChars,
    latinChars,
    digitsAndPunct,
    otherUnicodeChars,
    arabicRatio,
    latinRatio,
  };
}

/**
 * Internal non-destructive normalization helper strictly for search/indexing analysis (never alters compressed bytes).
 */
export function buildNormalizedSearchIndexKey(text: string): string {
  return text
    .replace(/[\u064B-\u065F\u0670\u0640]/g, '')
    .replace(/[أإآٱ]/g, 'ا')
    .replace(/ى/g, 'ي')
    .replace(/ة/g, 'ه')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

// ============================================================================
// 5. BOUNDED SMART LRU TOKENIZATION CACHE
// ============================================================================

interface CachedTokenizationPlan {
  text: string;
  bankId: number;
  finalTokenIds: Int32Array;
  blockTokenRanges: { start: number; count: number }[];
  dynamicMerged: string[];
  escapeLiterals: string[];
  escapeUtf8Lengths: Uint8Array;
  dictionaryEntries: MtxDictionaryEntry[];
  tokenizationDurationMs: number;
  indexingDurationMs: number;
  estimatedBytes: number;
}

const MAX_CACHE_ENTRIES = 24;
const MAX_CACHE_TOTAL_BYTES = 1_572_864; // 1.5 MB hard ceiling
const MAX_CACHEABLE_TEXT_CHARS = 32_768;

class MtxTokenizationLruCache {
  private readonly map = new Map<string, CachedTokenizationPlan>();
  private totalBytes = 0;
  hits = 0;
  misses = 0;

  get(key: string, text: string): CachedTokenizationPlan | undefined {
    const entry = this.map.get(key);
    if (!entry || entry.text !== text) {
      this.misses++;
      return undefined;
    }
    this.map.delete(key);
    this.map.set(key, entry);
    this.hits++;
    return entry;
  }

  set(key: string, plan: CachedTokenizationPlan): void {
    const existing = this.map.get(key);
    if (existing) {
      this.totalBytes -= existing.estimatedBytes;
      this.map.delete(key);
    }

    while (
      this.map.size >= MAX_CACHE_ENTRIES ||
      (this.totalBytes + plan.estimatedBytes > MAX_CACHE_TOTAL_BYTES && this.map.size > 0)
    ) {
      const oldestKey = this.map.keys().next().value;
      if (oldestKey === undefined) break;
      const oldest = this.map.get(oldestKey);
      if (oldest) this.totalBytes -= oldest.estimatedBytes;
      this.map.delete(oldestKey);
    }

    if (plan.estimatedBytes <= MAX_CACHE_TOTAL_BYTES) {
      this.map.set(key, plan);
      this.totalBytes += plan.estimatedBytes;
    }
  }

  clear(): void {
    this.map.clear();
    this.totalBytes = 0;
    this.hits = 0;
    this.misses = 0;
  }

  getStats(): { entries: number; bytes: number; hits: number; misses: number } {
    return {
      entries: this.map.size,
      bytes: this.totalBytes,
      hits: this.hits,
      misses: this.misses,
    };
  }
}

const TOKENIZATION_CACHE = new MtxTokenizationLruCache();

export function clearMtxCaches(): void {
  TOKENIZATION_CACHE.clear();
  SECRET_BYTES_CACHE.clear();
}

export function getMtxCacheStats(): MtxCacheStats {
  const stats = TOKENIZATION_CACHE.getStats();
  return {
    tokenizationEntries: stats.entries,
    tokenizationBytes: stats.bytes,
    tokenizationHits: stats.hits,
    tokenizationMisses: stats.misses,
    secretCacheEntries: SECRET_BYTES_CACHE.size,
  };
}

// ============================================================================
// 6. HIGH-SPEED MULTILINGUAL INTEGER-ID BPE ENGINE & PARAGRAPH CHUNKER
// ============================================================================

class BpeMaxHeap {
  private heapSavings: Int32Array;
  private heapFreqs: Int32Array;
  private heapKeys: Float64Array;
  size = 0;

  constructor(initialCapacity = 256) {
    this.heapSavings = new Int32Array(initialCapacity);
    this.heapFreqs = new Int32Array(initialCapacity);
    this.heapKeys = new Float64Array(initialCapacity);
  }

  private ensureCapacity(): void {
    if (this.size < this.heapSavings.length) return;
    const nextCap = this.heapSavings.length * 2;
    const nextSavings = new Int32Array(nextCap);
    const nextFreqs = new Int32Array(nextCap);
    const nextKeys = new Float64Array(nextCap);
    nextSavings.set(this.heapSavings);
    nextFreqs.set(this.heapFreqs);
    nextKeys.set(this.heapKeys);
    this.heapSavings = nextSavings;
    this.heapFreqs = nextFreqs;
    this.heapKeys = nextKeys;
  }

  push(savings: number, freq: number, key: number): void {
    this.ensureCapacity();
    let idx = this.size++;
    while (idx > 0) {
      const parent = (idx - 1) >>> 1;
      const pSav = this.heapSavings[parent];
      if (pSav > savings || (pSav === savings && this.heapFreqs[parent] >= freq)) break;
      this.heapSavings[idx] = pSav;
      this.heapFreqs[idx] = this.heapFreqs[parent];
      this.heapKeys[idx] = this.heapKeys[parent];
      idx = parent;
    }
    this.heapSavings[idx] = savings;
    this.heapFreqs[idx] = freq;
    this.heapKeys[idx] = key;
  }

  popInto(out: { savings: number; freq: number; key: number }): boolean {
    if (this.size === 0) return false;
    out.savings = this.heapSavings[0];
    out.freq = this.heapFreqs[0];
    out.key = this.heapKeys[0];

    const lastIdx = --this.size;
    if (lastIdx > 0) {
      const lastSav = this.heapSavings[lastIdx];
      const lastFreq = this.heapFreqs[lastIdx];
      const lastKey = this.heapKeys[lastIdx];
      let idx = 0;
      const half = this.size >>> 1;

      while (idx < half) {
        let child = (idx << 1) + 1;
        const right = child + 1;
        if (
          right < this.size &&
          (this.heapSavings[right] > this.heapSavings[child] ||
            (this.heapSavings[right] === this.heapSavings[child] &&
              this.heapFreqs[right] > this.heapFreqs[child]))
        ) {
          child = right;
        }
        const cSav = this.heapSavings[child];
        if (lastSav > cSav || (lastSav === cSav && lastFreq >= this.heapFreqs[child])) break;
        this.heapSavings[idx] = cSav;
        this.heapFreqs[idx] = this.heapFreqs[child];
        this.heapKeys[idx] = this.heapKeys[child];
        idx = child;
      }
      this.heapSavings[idx] = lastSav;
      this.heapFreqs[idx] = lastFreq;
      this.heapKeys[idx] = lastKey;
    }
    return true;
  }
}

interface TextChunkSpan {
  charStart: number;
  charLength: number;
  paragraphStart: number;
  paragraphCount: number;
}

function splitTextIntoParagraphChunks(
  text: string,
  targetChunkBytes: number
): TextChunkSpan[] {
  const len = text.length;
  if (len === 0) {
    return [{ charStart: 0, charLength: 0, paragraphStart: 0, paragraphCount: 1 }];
  }

  const spans: TextChunkSpan[] = [];
  let chunkStart = 0;
  let chunkParaStart = 0;
  let chunkParaCount = 0;
  let currentParaIdx = 0;
  let approxUtf8Bytes = 0;
  let pos = 0;

  while (pos < len) {
    const nlIdx = text.indexOf('\n', pos);
    const paraEnd = nlIdx === -1 ? len : nlIdx + 1;
    const paraLen = paraEnd - pos;
    // Fast byte estimate per paragraph without full allocation
    approxUtf8Bytes += text.charCodeAt(pos) >= 0x0600 ? paraLen * 2 : paraLen * 1.15;
    chunkParaCount++;

    if (approxUtf8Bytes >= targetChunkBytes && paraEnd < len) {
      spans.push({
        charStart: chunkStart,
        charLength: paraEnd - chunkStart,
        paragraphStart: chunkParaStart,
        paragraphCount: chunkParaCount,
      });
      chunkStart = paraEnd;
      chunkParaStart = currentParaIdx + 1;
      chunkParaCount = 0;
      approxUtf8Bytes = 0;
    }

    currentParaIdx++;
    pos = paraEnd;
  }

  if (chunkStart < len) {
    spans.push({
      charStart: chunkStart,
      charLength: len - chunkStart,
      paragraphStart: chunkParaStart,
      paragraphCount: Math.max(1, chunkParaCount),
    });
  }

  return spans;
}

interface InternalTokenizationOutput {
  finalTokenIds: Int32Array;
  blockTokenRanges: { start: number; count: number }[];
  dynamicMerged: string[];
  escapeLiterals: string[];
  escapeUtf8Lengths: Uint8Array;
  dictionaryEntries: MtxDictionaryEntry[];
  tokenizationDurationMs: number;
  indexingDurationMs: number;
}

function executeMultilingualBpeTokenization(
  text: string,
  bank: CompiledVocabularyBank,
  profile: CompressionProfile,
  chunkSpans: readonly TextChunkSpan[],
  buildDictionaryEntries: boolean
): InternalTokenizationOutput {
  const startTime = performance.now();
  const textLen = text.length;
  const numBlocks = chunkSpans.length;

  let cap = Math.max(16, textLen);
  let rawIds = new Int32Array(cap);
  let tokenCount = 0;

  const escapeMap = new Map<string, number>();
  const escapeLiterals: string[] = [];
  const escapeUtf8LenList: number[] = [];

  const blockStartIndices = new Int32Array(numBlocks);
  const blockInitialCounts = new Int32Array(numBlocks);
  const trie = bank.trie;

  for (let b = 0; b < numBlocks; b++) {
    const span = chunkSpans[b];
    const spanEnd = span.charStart + span.charLength;
    blockStartIndices[b] = tokenCount;
    let i = span.charStart;

    while (i < spanEnd) {
      const packed = trie.findLongestPrefixPacked(text, i);
      let tokenId: number;
      if (packed !== 0) {
        const matchLen = packed >>> 10;
        // Clamp match so no token crosses chunk boundary
        if (i + matchLen <= spanEnd) {
          tokenId = (packed & 1023) - 1;
          i += matchLen;
        } else {
          // Rare split at chunk boundary: fall back to single char or escape
          const ch = text.slice(i, i + 1);
          const singleId = bank.tokenToId.get(ch);
          if (singleId !== undefined) {
            tokenId = singleId;
          } else {
            const existingEscId = escapeMap.get(ch);
            if (existingEscId !== undefined) {
              tokenId = existingEscId;
            } else {
              tokenId = ESCAPE_ID_BASE + escapeLiterals.length;
              escapeMap.set(ch, tokenId);
              escapeLiterals.push(ch);
              escapeUtf8LenList.push(getUtf8ByteLength(ch));
            }
          }
          i += 1;
        }
      } else {
        const codePoint = text.codePointAt(i);
        const charLen = codePoint !== undefined && codePoint > 0xffff ? 2 : 1;
        const lit = text.slice(i, i + charLen);
        i += charLen;
        const existingEscId = escapeMap.get(lit);
        if (existingEscId !== undefined) {
          tokenId = existingEscId;
        } else {
          tokenId = ESCAPE_ID_BASE + escapeLiterals.length;
          escapeMap.set(lit, tokenId);
          escapeLiterals.push(lit);
          escapeUtf8LenList.push(getUtf8ByteLength(lit));
        }
      }

      if (tokenCount === cap) {
        cap *= 2;
        const grown = new Int32Array(cap);
        grown.set(rawIds);
        rawIds = grown;
      }
      rawIds[tokenCount++] = tokenId;
    }

    blockInitialCounts[b] = tokenCount - blockStartIndices[b];
  }

  const indexingStart = performance.now();

  const maxDynamicSlots =
    profile === 'fast'
      ? Math.min(20, bank.primaryDynCap)
      : profile === 'maximum'
      ? Math.min(128, bank.totalDynCap)
      : Math.min(44, bank.primaryDynCap);

  const minFrequency = profile === 'fast' ? 3 : 2;
  const minSavingsThreshold = profile === 'fast' ? 5 : 3;

  const dynamicMerged: string[] = [];
  const dynUtf8Lengths = new Uint8Array(maxDynamicSlots);

  const getUtf8LenById = (id: number): number => {
    if (id < bank.primaryLen) return bank.primaryUtf8Len[id];
    if (id < EXT_BANK_TOKEN) return dynUtf8Lengths[id - bank.primaryLen];
    if (id < bank.extDynIdBase) return bank.extUtf8Len[id - EXT_STATIC_ID_BASE];
    if (id < ESCAPE_ID_BASE) {
      return dynUtf8Lengths[bank.primaryDynCap + (id - bank.extDynIdBase)];
    }
    return escapeUtf8LenList[id - ESCAPE_ID_BASE];
  };

  const getStreamByteCostById = (id: number): number => {
    if (id < EXT_BANK_TOKEN) return 1;
    if (id < ESCAPE_ID_BASE) return 2;
    const uLen = escapeUtf8LenList[id - ESCAPE_ID_BASE];
    return uLen > 255 ? Math.ceil(uLen / 255) * 2 + uLen : 2 + uLen;
  };

  const getTokenStrById = (id: number): string => {
    if (id < bank.primaryLen) return bank.primaryVocab[id];
    if (id < EXT_BANK_TOKEN) return dynamicMerged[id - bank.primaryLen];
    if (id < bank.extDynIdBase) return bank.extendedVocab[id - EXT_STATIC_ID_BASE];
    if (id < ESCAPE_ID_BASE) {
      return dynamicMerged[bank.primaryDynCap + (id - bank.extDynIdBase)];
    }
    return escapeLiterals[id - ESCAPE_ID_BASE];
  };

  let finalTokenIds: Int32Array;
  const blockTokenRanges: { start: number; count: number }[] = new Array(numBlocks);

  const maxSymbolId = ESCAPE_ID_BASE + escapeLiterals.length;
  const useSmiKeys = maxSymbolId <= SMI_MAX_SYMBOL_ID;
  const keyStride = useSmiKeys ? 1 << SMI_PAIR_SHIFT : PAIR_KEY_STRIDE_LARGE;

  if (tokenCount >= 2 && maxDynamicSlots > 0) {
    const tokIds = rawIds.subarray(0, tokenCount);
    const prev = new Int32Array(tokenCount);
    const next = new Int32Array(tokenCount);
    const occPrev = new Int32Array(tokenCount);
    const occNext = new Int32Array(tokenCount);
    const keyAt = useSmiKeys ? new Int32Array(tokenCount) : new Float64Array(tokenCount);

    // Initialize doubly-linked token list with strict block boundary isolation (next[blockEnd] = -1)
    for (let b = 0; b < numBlocks; b++) {
      const bStart = blockStartIndices[b];
      const bCount = blockInitialCounts[b];
      const bEnd = bStart + bCount;
      for (let idx = bStart; idx < bEnd; idx++) {
        prev[idx] = idx > bStart ? idx - 1 : -1;
        next[idx] = idx + 1 < bEnd ? idx + 1 : -1;
        occPrev[idx] = -1;
        occNext[idx] = -1;
        keyAt[idx] = -1;
      }
    }

    const pairCount = new Map<number, number>();
    const occHead = new Map<number, number>();
    const heap = new BpeMaxHeap(Math.min(4096, Math.max(64, tokenCount >>> 2)));

    const linkPair = (nodeIdx: number, pushToHeap: boolean): void => {
      const r = next[nodeIdx];
      if (r === -1) return;
      const idA = tokIds[nodeIdx];
      const idB = tokIds[r];
      const key = useSmiKeys ? (idA << SMI_PAIR_SHIFT) | idB : idA * keyStride + idB;
      keyAt[nodeIdx] = key;
      const nextCnt = (pairCount.get(key) || 0) + 1;
      pairCount.set(key, nextCnt);

      const oldHead = occHead.get(key);
      occPrev[nodeIdx] = -1;
      occNext[nodeIdx] = oldHead !== undefined ? oldHead : -1;
      if (oldHead !== undefined) occPrev[oldHead] = nodeIdx;
      occHead.set(key, nodeIdx);

      if (pushToHeap && nextCnt >= minFrequency) {
        const mergedUtf8 = getUtf8LenById(idA) + getUtf8LenById(idB);
        if (mergedUtf8 <= 96) {
          const targetBytes = dynamicMerged.length < bank.primaryDynCap ? 1 : 2;
          const sav = nextCnt * (getStreamByteCostById(idA) + getStreamByteCostById(idB) - targetBytes);
          if (sav >= minSavingsThreshold) {
            heap.push(sav, nextCnt, key);
          }
        }
      }
    };

    const unlinkPair = (nodeIdx: number): void => {
      const oldKey = keyAt[nodeIdx];
      if (oldKey < 0) return;
      const cnt = (pairCount.get(oldKey) || 0) - 1;
      if (cnt <= 0) pairCount.delete(oldKey);
      else pairCount.set(oldKey, cnt);

      const p = occPrev[nodeIdx];
      const nx = occNext[nodeIdx];
      if (p !== -1) {
        occNext[p] = nx;
      } else if (nx !== -1) {
        occHead.set(oldKey, nx);
      } else {
        occHead.delete(oldKey);
      }
      if (nx !== -1) occPrev[nx] = p;

      occPrev[nodeIdx] = -1;
      occNext[nodeIdx] = -1;
      keyAt[nodeIdx] = -1;
    };

    // Initial pass backwards so occurrence chains naturally start sorted in ascending index order!
    for (let idx = tokenCount - 2; idx >= 0; idx--) {
      if (next[idx] !== -1) {
        linkPair(idx, false);
      }
    }

    for (const [key, freq] of pairCount.entries()) {
      if (freq < minFrequency) continue;
      const idA = useSmiKeys ? key >>> SMI_PAIR_SHIFT : Math.floor(key / keyStride);
      const idB = useSmiKeys ? key & SMI_MAX_SYMBOL_ID : key - idA * keyStride;
      const mergedUtf8 = getUtf8LenById(idA) + getUtf8LenById(idB);
      if (mergedUtf8 > 96) continue;
      const sav = freq * (getStreamByteCostById(idA) + getStreamByteCostById(idB) - 1);
      if (sav >= minSavingsThreshold) {
        heap.push(sav, freq, key);
      }
    }

    const popped = { savings: 0, freq: 0, key: 0 };
    const positionsScratch: number[] = [];
    let currentTokenCount = tokenCount;
    const blockHeads = new Int32Array(blockStartIndices);
    const blockCounts = new Int32Array(blockInitialCounts);

    while (dynamicMerged.length < maxDynamicSlots && heap.popInto(popped)) {
      const actualFreq = pairCount.get(popped.key) || 0;
      if (actualFreq < minFrequency) continue;

      const idA = useSmiKeys ? popped.key >>> SMI_PAIR_SHIFT : Math.floor(popped.key / keyStride);
      const idB = useSmiKeys ? popped.key & SMI_MAX_SYMBOL_ID : popped.key - idA * keyStride;
      const mergedUtf8Len = getUtf8LenById(idA) + getUtf8LenById(idB);
      if (mergedUtf8Len > 96) continue;

      const newDynIdx = dynamicMerged.length;
      const isPrimarySlot = newDynIdx < bank.primaryDynCap;
      const costSum = getStreamByteCostById(idA) + getStreamByteCostById(idB);
      if (!isPrimarySlot && costSum <= 2) continue;

      const targetStreamBytes = isPrimarySlot ? 1 : 2;
      const actualSavings = actualFreq * (costSum - targetStreamBytes);

      if (actualSavings < minSavingsThreshold) continue;
      if (!isPrimarySlot && actualSavings <= mergedUtf8Len + 2) continue;

      if (actualFreq !== popped.freq || actualSavings !== popped.savings) {
        heap.push(actualSavings, actualFreq, popped.key);
        continue;
      }

      const newDynId = isPrimarySlot
        ? bank.primaryLen + newDynIdx
        : bank.extDynIdBase + (newDynIdx - bank.primaryDynCap);

      dynUtf8Lengths[newDynIdx] = mergedUtf8Len;
      dynamicMerged.push(getTokenStrById(idA) + getTokenStrById(idB));

      positionsScratch.length = 0;
      let occCur = occHead.get(popped.key);
      let isSortedAsc = true;
      let lastPos = -1;
      while (occCur !== undefined && occCur !== -1) {
        if (occCur <= lastPos) isSortedAsc = false;
        lastPos = occCur;
        positionsScratch.push(occCur);
        occCur = occNext[occCur];
      }
      if (!isSortedAsc && positionsScratch.length > 1) {
        positionsScratch.sort((a, b) => a - b);
      }

      // Map node index to block when multi-block is active (usually 2..8 blocks -> tiny loop)
      for (const leftNode of positionsScratch) {
        if (keyAt[leftNode] !== popped.key) continue;
        const rightNode = next[leftNode];
        if (rightNode === -1) continue;

        const leftNeighbor = prev[leftNode];
        const rightNeighbor = next[rightNode];

        if (leftNeighbor !== -1) unlinkPair(leftNeighbor);
        unlinkPair(leftNode);
        unlinkPair(rightNode);

        tokIds[leftNode] = newDynId;
        next[leftNode] = rightNeighbor;
        if (rightNeighbor !== -1) prev[rightNeighbor] = leftNode;
        prev[rightNode] = -1;
        next[rightNode] = -1;
        currentTokenCount--;

        if (numBlocks === 1) {
          blockCounts[0]--;
        } else {
          for (let b = numBlocks - 1; b >= 0; b--) {
            if (leftNode >= blockStartIndices[b]) {
              blockCounts[b]--;
              break;
            }
          }
        }

        if (leftNeighbor !== -1) linkPair(leftNeighbor, true);
        if (rightNeighbor !== -1) linkPair(leftNode, true);
      }
    }

    finalTokenIds = new Int32Array(currentTokenCount);
    let writeIdx = 0;
    for (let b = 0; b < numBlocks; b++) {
      const rangeStart = writeIdx;
      let cur = blockInitialCounts[b] > 0 ? blockHeads[b] : -1;
      while (cur !== -1) {
        finalTokenIds[writeIdx++] = tokIds[cur];
        cur = next[cur];
      }
      blockTokenRanges[b] = { start: rangeStart, count: writeIdx - rangeStart };
    }
  } else {
    finalTokenIds = rawIds.slice(0, tokenCount);
    for (let b = 0; b < numBlocks; b++) {
      blockTokenRanges[b] = { start: blockStartIndices[b], count: blockInitialCounts[b] };
    }
  }

  const indexingEnd = performance.now();

  let dictionaryEntries: MtxDictionaryEntry[] = [];
  if (buildDictionaryEntries) {
    const idFreq = new Map<number, number>();
    for (const id of finalTokenIds) {
      idFreq.set(id, (idFreq.get(id) || 0) + 1);
    }

    dictionaryEntries = new Array<MtxDictionaryEntry>(idFreq.size);
    let entryIdx = 0;
    for (const [id, freq] of idFreq.entries()) {
      const tokenStr = getTokenStrById(id);
      const utf8Len = getUtf8LenById(id);
      const saved = freq * Math.max(1, utf8Len - getStreamByteCostById(id));
      const isDiacritized =
        id < bank.primaryLen
          ? bank.primaryTashkeel[id] === 1
          : id >= EXT_STATIC_ID_BASE && id < bank.extDynIdBase
          ? bank.extTashkeel[id - EXT_STATIC_ID_BASE] === 1
          : containsArabicTashkeel(tokenStr);
      const entryType: MtxEntryType =
        id < bank.primaryLen
          ? bank.primaryTypes[id]
          : id >= ESCAPE_ID_BASE
          ? 'escape'
          : id < bank.extDynIdBase && id >= EXT_STATIC_ID_BASE
          ? bank.extTypes[id - EXT_STATIC_ID_BASE]
          : getSemanticType(tokenStr);

      dictionaryEntries[entryIdx++] = {
        id: entryIdx - 1,
        token: tokenStr,
        frequency: freq,
        rawUtf8Bytes: utf8Len,
        totalSavedBytes: saved,
        isDiacritized,
        type: entryType,
      };
    }
    dictionaryEntries.sort((a, b) => b.totalSavedBytes - a.totalSavedBytes);
  }

  const escapeUtf8Lengths = new Uint8Array(escapeUtf8LenList);
  const tokenizationDurationMs = Math.round((performance.now() - startTime) * 100) / 100;
  const indexingDurationMs = Math.round((indexingEnd - indexingStart) * 100) / 100;

  return {
    finalTokenIds,
    blockTokenRanges,
    dynamicMerged,
    escapeLiterals,
    escapeUtf8Lengths,
    dictionaryEntries,
    tokenizationDurationMs,
    indexingDurationMs,
  };
}

function getOrComputeTokenizationPlan(
  text: string,
  bank: CompiledVocabularyBank,
  profile: CompressionProfile,
  chunkSpans: readonly TextChunkSpan[],
  useCache: boolean
): CachedTokenizationPlan {
  const canCache = useCache && text.length <= MAX_CACHEABLE_TEXT_CHARS && chunkSpans.length === 1;
  let cacheKey = '';
  if (canCache) {
    cacheKey = `${bank.bankId}:${profile}:${text.length}:${fnv1a32String(text)}`;
    const hit = TOKENIZATION_CACHE.get(cacheKey, text);
    if (hit) return hit;
  }

  const output = executeMultilingualBpeTokenization(text, bank, profile, chunkSpans, true);
  const plan: CachedTokenizationPlan = {
    text,
    bankId: bank.bankId,
    finalTokenIds: output.finalTokenIds,
    blockTokenRanges: output.blockTokenRanges,
    dynamicMerged: output.dynamicMerged,
    escapeLiterals: output.escapeLiterals,
    escapeUtf8Lengths: output.escapeUtf8Lengths,
    dictionaryEntries: output.dictionaryEntries,
    tokenizationDurationMs: output.tokenizationDurationMs,
    indexingDurationMs: output.indexingDurationMs,
    estimatedBytes:
      text.length * 2 +
      output.finalTokenIds.byteLength +
      output.dictionaryEntries.length * 64,
  };

  if (canCache) {
    TOKENIZATION_CACHE.set(cacheKey, plan);
  }

  return plan;
}

/**
 * Public Morphological & BPE Tokenizer (100% backward-compatible return shape, now multilingual).
 */
export function tokenizeArabicText(
  text: string,
  profile: CompressionProfile = 'balanced',
  languageHint: 'auto' | MtxLanguageCode = 'auto'
): {
  tokens: string[];
  dictionaryEntries: MtxDictionaryEntry[];
  dynamicMerged: string[];
  tokenizationDurationMs: number;
} {
  const bank = resolveBankForText(text, languageHint);
  const spans: TextChunkSpan[] = [
    { charStart: 0, charLength: text.length, paragraphStart: 0, paragraphCount: 1 },
  ];
  const plan = getOrComputeTokenizationPlan(text, bank, profile, spans, true);
  const ids = plan.finalTokenIds;
  const tokens = new Array<string>(ids.length);
  for (let i = 0; i < ids.length; i++) {
    const id = ids[i];
    if (id < bank.primaryLen) {
      tokens[i] = bank.primaryVocab[id];
    } else if (id < EXT_BANK_TOKEN) {
      tokens[i] = plan.dynamicMerged[id - bank.primaryLen];
    } else if (id < bank.extDynIdBase) {
      tokens[i] = bank.extendedVocab[id - EXT_STATIC_ID_BASE];
    } else if (id < ESCAPE_ID_BASE) {
      tokens[i] = plan.dynamicMerged[bank.primaryDynCap + (id - bank.extDynIdBase)];
    } else {
      tokens[i] = plan.escapeLiterals[id - ESCAPE_ID_BASE];
    }
  }

  return {
    tokens,
    dictionaryEntries: plan.dictionaryEntries.slice(),
    dynamicMerged: plan.dynamicMerged.slice(),
    tokenizationDurationMs: plan.tokenizationDurationMs,
  };
}

function resolveBankForText(
  text: string,
  languageHint: 'auto' | MtxLanguageCode = 'auto'
): CompiledVocabularyBank {
  if (languageHint && languageHint !== 'auto') {
    const explicit = defaultVocabularyRegistry.getByCode(languageHint);
    if (explicit) return explicit;
  }
  const profile = detectTextLanguageProfile(text);
  return defaultVocabularyRegistry.getById(profile.recommendedBankId) ?? BANK_ARABIC_PRIMARY;
}

export function analyzeArabicText(text: string): ArabicTextAnalysis {
  const rawUtf8Bytes = getUtf8ByteLength(text);

  const tashkeelMatches = text.match(/[\u064B-\u065F\u0670]/g);
  const tashkeelCount = tashkeelMatches ? tashkeelMatches.length : 0;

  const arabicLetterMatches = text.match(/[\u0621-\u064A]/g);
  const arabicLettersCount = arabicLetterMatches ? arabicLetterMatches.length : 0;

  const spaceMatches = text.match(/\s/g);
  const spaceCount = spaceMatches ? spaceMatches.length : 0;

  const punctMatches = text.match(/[،؛؟!«»""''—\-.:()[\]/]/g);
  const punctuationCount = punctMatches ? punctMatches.length : 0;

  const trimmed = text.trim();
  const words = trimmed.length > 0 ? trimmed.split(/\s+/).filter(Boolean) : [];
  const wordCount = words.length;

  let detectedPrefixesCount = 0;
  for (const w of words) {
    for (const p of ARABIC_V25_PREFIXES) {
      if (w.startsWith(p)) {
        detectedPrefixesCount++;
        break;
      }
    }
  }

  let detectedSuffixesCount = 0;
  for (const w of words) {
    for (const s of MORPH_SUFFIXES) {
      if (w.endsWith(s)) {
        detectedSuffixesCount++;
        break;
      }
    }
  }

  const effectiveCharBase = Math.max(1, arabicLettersCount + tashkeelCount);
  const tashkeelDensityPercent = Math.round((tashkeelCount / effectiveCharBase) * 1000) / 10;

  const estimatedSavingsRatio = tashkeelDensityPercent > 20 ? 0.82 : 0.76;
  const estimatedMtxBytes =
    rawUtf8Bytes === 0 ? 0 : Math.max(32, Math.round(rawUtf8Bytes * (1 - estimatedSavingsRatio)));
  const estimatedSavingsPercent =
    rawUtf8Bytes === 0 ? 0 : Math.round(estimatedSavingsRatio * 1000) / 10;

  return {
    totalChars: text.length,
    arabicLettersCount,
    tashkeelCount,
    tashkeelDensityPercent,
    wordCount,
    spaceCount,
    punctuationCount,
    detectedPrefixesCount,
    detectedSuffixesCount,
    estimatedUtf8Bytes: rawUtf8Bytes,
    estimatedMtxBytes,
    estimatedSavingsPercent,
  };
}

export function analyzeMultilingualText(text: string): MultilingualTextAnalysis {
  const base = analyzeArabicText(text);
  const languageProfile = detectTextLanguageProfile(text);
  const englishMatches = text.match(/[A-Za-z]/g);
  const contractionMatches = text.match(/\b[A-Za-z]+(?:'s|n't|'t|'re|'ve|'ll|'d|'m)\b/gi);
  const emojiAndExtended = text.match(/[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\uFDF0-\uFDFF]/gu);
  const paragraphCount = text.length === 0 ? 0 : text.split('\n').length;

  return {
    ...base,
    languageProfile,
    englishLettersCount: englishMatches ? englishMatches.length : 0,
    contractionsCount: contractionMatches ? contractionMatches.length : 0,
    paragraphCount,
    emojiAndExtendedCount: emojiAndExtended ? emojiAndExtended.length : 0,
    normalizedSearchPreview: buildNormalizedSearchIndexKey(text.slice(0, 240)),
  };
}

// ============================================================================
// 7. VERSION DETECTION & BINARY PAYLOAD PARSERS
// ============================================================================

export function formatVersionToLabel(magic: MtxMagicType, version: number): string {
  if (magic === 'MTX1') {
    if (version === 1 || version === 10) return 'v1.0';
    return `v1.${version}`;
  }
  if (version >= 10) {
    const major = Math.floor(version / 10);
    const minor = version % 10;
    return `v${major}.${minor}`;
  }
  return `v2.${version}`;
}

const KNOWN_FORMAT_VERSIONS = new Set<number>([
  MTX_FORMAT_VERSIONS.V1_LEGACY,
  MTX_FORMAT_VERSIONS.V1_0,
  MTX_FORMAT_VERSIONS.V2_0,
  MTX_FORMAT_VERSIONS.V2_1,
  MTX_FORMAT_VERSIONS.V2_2,
  MTX_FORMAT_VERSIONS.V2_3,
  MTX_FORMAT_VERSIONS.V2_4,
  MTX_FORMAT_VERSIONS.V2_5,
]);

export function detectMtxFormat(mtxBytes: Uint8Array): MtxFormatDetectionResult {
  if (!(mtxBytes instanceof Uint8Array)) {
    throw new MtxInvalidFormatError('مدخلات غير صالحة: يجب تمرير مصفوفة بايت Uint8Array.');
  }

  if (mtxBytes.length < MTX_HEADER_SIZE) {
    throw new MtxCorruptDataError(
      `الملف تالف: الحجم (${mtxBytes.length} بايت) أصغر من ترويسة MTX المعتمدة (${MTX_HEADER_SIZE} بايت).`
    );
  }

  const isV2 =
    mtxBytes[0] === 0x4d &&
    mtxBytes[1] === 0x54 &&
    mtxBytes[2] === 0x58 &&
    mtxBytes[3] === 0x32;
  const isV1 =
    mtxBytes[0] === 0x4d &&
    mtxBytes[1] === 0x54 &&
    mtxBytes[2] === 0x58 &&
    mtxBytes[3] === 0x31;

  if (!isV2 && !isV1) {
    throw new MtxInvalidFormatError('صيغة غير صالحة: التوقيع السحري للملف لا يطابق MTX1 أو MTX2.');
  }

  const magic: MtxMagicType = isV2 ? 'MTX2' : 'MTX1';
  const formatVersion = mtxBytes[4];
  const flags = mtxBytes[5];

  const hDv = new DataView(mtxBytes.buffer, mtxBytes.byteOffset, mtxBytes.byteLength);
  const salt = hDv.getUint32(6, false);
  const expectedAdler32 = hDv.getUint32(10, false);
  const originalUtf8Bytes = hDv.getUint32(14, false);
  const dictionaryHintCount = hDv.getUint16(18, false);

  const isSupported =
    (magic === 'MTX1' && (formatVersion === 1 || formatVersion === 10)) ||
    (magic === 'MTX2' && KNOWN_FORMAT_VERSIONS.has(formatVersion) && formatVersion >= 20);

  return {
    magic,
    formatVersion,
    versionLabel: formatVersionToLabel(magic, formatVersion),
    isLegacyFormat: magic === 'MTX1' || formatVersion < MTX_FORMAT_VERSIONS.V2_2,
    isCurrentFormat: magic === 'MTX2' && formatVersion === MTX_FORMAT_VERSIONS.V2_5,
    isSupported,
    header: {
      magic,
      formatVersion,
      flags,
      salt,
      expectedAdler32,
      originalUtf8Bytes,
      dictionaryHintCount,
    },
    flagsDecoded: {
      usesRadixTrie: (flags & 0x01) !== 0,
      usesAffixes: (flags & 0x02) !== 0,
      usesFusions: (flags & 0x04) !== 0,
      usesBpe: (flags & 0x08) !== 0,
      usesCipher: (flags & 0x10) !== 0,
      usesEscapeProtocol: formatVersion >= MTX_FORMAT_VERSIONS.V2_2,
      usesExtendedV23Integrity:
        (flags & 0x20) !== 0 && formatVersion >= MTX_FORMAT_VERSIONS.V2_3,
      usesExtendedV24Indexing:
        (flags & 0x40) !== 0 && formatVersion >= MTX_FORMAT_VERSIONS.V2_4,
      usesExtendedV25Multilingual:
        (flags & 0x80) !== 0 && formatVersion >= MTX_FORMAT_VERSIONS.V2_5,
    },
  };
}

function parseMetadataJsonBlock(
  payload: Uint8Array,
  pDv: DataView,
  offStart: number
): { metadata: MtxMetadata; nextOffset: number } {
  let off = offStart;
  if (off + 2 > payload.length) {
    throw new MtxCorruptDataError('الملف تالف: طول بيانات الوصف مفقود.');
  }
  const metaLen = pDv.getUint16(off, false);
  off += 2;
  if (off + metaLen > payload.length) {
    throw new MtxCorruptDataError('الملف تالف: بيانات الوصف مقطوعة أو تتجاوز حدود الحمولة.');
  }

  let metadata: MtxMetadata;
  try {
    const metaStr = SHARED_DECODER.decode(payload.subarray(off, off + metaLen));
    const parsed = JSON.parse(metaStr) as Partial<MtxMetadata>;
    metadata = {
      title: typeof parsed.title === 'string' ? parsed.title : 'مخطوطة مسترجعة',
      author: typeof parsed.author === 'string' ? parsed.author : 'كاتب غير معروف',
      chapterTitle: typeof parsed.chapterTitle === 'string' ? parsed.chapterTitle : 'فصل مسترجع',
      chapterIndex: typeof parsed.chapterIndex === 'number' ? parsed.chapterIndex : 1,
      createdAt: typeof parsed.createdAt === 'string' ? parsed.createdAt : new Date().toISOString(),
      wordCount: parsed.wordCount,
      tags: Array.isArray(parsed.tags) ? parsed.tags : undefined,
      genre: parsed.genre,
      translator: parsed.translator,
      notes: parsed.notes,
      codecVersion: parsed.codecVersion,
      formatVersion: parsed.formatVersion,
      chapterId: parsed.chapterId,
      languageCode: parsed.languageCode,
      translationGroupId: parsed.translationGroupId,
      editionLabel: parsed.editionLabel,
      bankId: parsed.bankId,
      paragraphCount: parsed.paragraphCount,
      chunkCount: parsed.chunkCount,
    };
  } catch {
    metadata = {
      title: 'مخطوطة مسترجعة',
      author: 'كاتب غير معروف',
      chapterTitle: 'فصل مسترجع',
      chapterIndex: 1,
      createdAt: new Date().toISOString(),
    };
  }
  off += metaLen;
  return { metadata, nextOffset: off };
}

function parseDynamicDictionaryBlock(
  payload: Uint8Array,
  offStart: number
): { dynamicMerged: string[]; nextOffset: number } {
  let off = offStart;
  if (off >= payload.length) {
    throw new MtxCorruptDataError('الملف تالف: جدول المقاطع الديناميكي مفقود.');
  }
  const dynCount = payload[off++];
  if (dynCount < 0 || dynCount > 255) {
    throw new MtxCorruptDataError('الملف تالف: حجم القاموس الديناميكي غير صالح.');
  }

  const dynamicMerged = new Array<string>(dynCount);
  for (let i = 0; i < dynCount; i++) {
    if (off >= payload.length) {
      throw new MtxCorruptDataError('الملف تالف: مقاطع القاموس مقطوعة.');
    }
    const len = payload[off++];
    if (off + len > payload.length) {
      throw new MtxCorruptDataError('الملف تالف: طول المقطع الديناميكي يتجاوز حدود البيانات.');
    }
    dynamicMerged[i] = SHARED_DECODER.decode(payload.subarray(off, off + len));
    off += len;
  }
  return { dynamicMerged, nextOffset: off };
}

function parseStandardMtxPayload(
  payload: Uint8Array,
  customBaseVocabulary: readonly string[] | null,
  offsetStart = 0
): {
  metadata: MtxMetadata;
  dynamicMerged: string[];
  reverseIndex: ReverseVocabularyIndex | null;
  customFullVocab: string[] | null;
  stream: Uint8Array;
  nextOffset: number;
} {
  const pDv = new DataView(payload.buffer, payload.byteOffset, payload.byteLength);
  let off = offsetStart;

  if (payload.length - off < 7) {
    throw new MtxCorruptDataError('الملف تالف: حجم الحمولة أصغر من الحد الأدنى المطلوب.');
  }

  const metaRes = parseMetadataJsonBlock(payload, pDv, off);
  off = metaRes.nextOffset;

  const dynRes = parseDynamicDictionaryBlock(payload, off);
  off = dynRes.nextOffset;

  if (off + 4 > payload.length) {
    throw new MtxCorruptDataError('الملف تالف: ترويسة تيار الرموز مفقودة.');
  }
  const streamByteLen = pDv.getUint32(off, false);
  off += 4;

  if (streamByteLen > MAX_STREAM_BYTE_LEN || off + streamByteLen > payload.length) {
    throw new MtxCorruptDataError('الملف تالف: طول تيار الرموز غير متوافق مع حجم الحمولة.');
  }

  const stream = payload.subarray(off, off + streamByteLen);
  off += streamByteLen;

  if (customBaseVocabulary) {
    return {
      metadata: metaRes.metadata,
      dynamicMerged: dynRes.dynamicMerged,
      reverseIndex: null,
      customFullVocab: [...customBaseVocabulary, ...dynRes.dynamicMerged],
      stream,
      nextOffset: off,
    };
  }

  return {
    metadata: metaRes.metadata,
    dynamicMerged: dynRes.dynamicMerged,
    reverseIndex: new ReverseVocabularyIndex(dynRes.dynamicMerged),
    customFullVocab: null,
    stream,
    nextOffset: off,
  };
}

const ASCII_CHAR_TABLE: readonly string[] = Array.from({ length: 128 }, (_, i) =>
  String.fromCharCode(i)
);

function decodeEscapeUtf8Fast(stream: Uint8Array, offset: number, len: number): string {
  if (len === 1) {
    const b0 = stream[offset];
    if (b0 < 0x80) return ASCII_CHAR_TABLE[b0];
  } else if (len === 2) {
    const b0 = stream[offset];
    const b1 = stream[offset + 1];
    if ((b0 & 0xe0) === 0xc0 && (b1 & 0xc0) === 0x80) {
      const cp = ((b0 & 0x1f) << 6) | (b1 & 0x3f);
      if (cp >= 0x80) return String.fromCharCode(cp);
    }
  } else if (len === 3) {
    const b0 = stream[offset];
    const b1 = stream[offset + 1];
    const b2 = stream[offset + 2];
    if ((b0 & 0xf0) === 0xe0 && (b1 & 0xc0) === 0x80 && (b2 & 0xc0) === 0x80) {
      const cp = ((b0 & 0x0f) << 12) | ((b1 & 0x3f) << 6) | (b2 & 0x3f);
      if (cp >= 0x800 && (cp < 0xd800 || cp > 0xdfff)) return String.fromCharCode(cp);
    }
  } else if (len === 4) {
    const b0 = stream[offset];
    const b1 = stream[offset + 1];
    const b2 = stream[offset + 2];
    const b3 = stream[offset + 3];
    if (
      (b0 & 0xf8) === 0xf0 &&
      (b1 & 0xc0) === 0x80 &&
      (b2 & 0xc0) === 0x80 &&
      (b3 & 0xc0) === 0x80
    ) {
      const cp =
        ((b0 & 0x07) << 18) | ((b1 & 0x3f) << 12) | ((b2 & 0x3f) << 6) | (b3 & 0x3f);
      if (cp >= 0x10000 && cp <= 0x10ffff) return String.fromCodePoint(cp);
    }
  }
  return SHARED_DECODER.decode(stream.subarray(offset, offset + len));
}

export function decodeUniversalEscapeStream(
  stream: Uint8Array,
  vocabLookup: readonly string[] | ReverseVocabularyIndex,
  tokenCountHint = -1
): { text: string; tokenCount: number } {
  const flatTable: readonly (string | undefined)[] =
    vocabLookup instanceof ReverseVocabularyIndex ? vocabLookup.bindFlatTable() : vocabLookup;
  const streamLen = stream.length;

  if (tokenCountHint > MAX_STREAM_BYTE_LEN) {
    throw new MtxCorruptDataError('الملف تالف: عدد الرموز المصرّح به يتجاوز الحد الأقصى المسموح.');
  }

  const chunks: string[] = [];
  let sOff = 0;
  while (sOff < streamLen) {
    const id = stream[sOff++];
    if (id === ESCAPE_TOKEN) {
      if (sOff >= streamLen) {
        throw new MtxCorruptDataError('الملف تالف: تسلسل ESCAPE_TOKEN مقطوع قبل بايت الطول.');
      }
      const len = stream[sOff++];
      if (sOff + len > streamLen) {
        throw new MtxCorruptDataError('الملف تالف: بيانات UTF-8 داخل ESCAPE_TOKEN مقطوعة.');
      }
      chunks.push(decodeEscapeUtf8Fast(stream, sOff, len));
      sOff += len;
    } else {
      const mapped = flatTable[id];
      if (mapped === undefined) {
        throw new MtxCorruptDataError(`الملف تالف: مرجع رمز غير موجود في القاموس (ID=${id}).`);
      }
      chunks.push(mapped);
    }
  }

  return {
    text: chunks.join(''),
    tokenCount: chunks.length,
  };
}

/**
 * Decodes MTX v2.5 Dual-Bank + Escape token stream cleanly without language heuristics.
 */
function decodeV25BankedStream(
  stream: Uint8Array,
  primaryTable: readonly (string | undefined)[],
  extendedTable: readonly (string | undefined)[],
  tokenCountHint = 0
): { text: string; tokenCount: number } {
  const streamLen = stream.length;
  const hasValidHint = tokenCountHint > 0 && tokenCountHint <= MAX_STREAM_BYTE_LEN;
  const chunks: string[] = hasValidHint ? new Array<string>(tokenCountHint) : [];
  let count = 0;
  let sOff = 0;

  while (sOff < streamLen) {
    const id = stream[sOff++];
    if (id < EXT_BANK_TOKEN) {
      const mapped = primaryTable[id];
      if (mapped === undefined) {
        throw new MtxCorruptDataError(`الملف تالف: مرجع رمز غير موجود في البنك الأساسي (ID=${id}).`);
      }
      chunks[count++] = mapped;
    } else if (id === EXT_BANK_TOKEN) {
      if (sOff >= streamLen) {
        throw new MtxCorruptDataError('الملف تالف: تسلسل EXT_BANK_TOKEN (254) مقطوع.');
      }
      const extId = stream[sOff++];
      const mapped = extendedTable[extId];
      if (mapped === undefined) {
        throw new MtxCorruptDataError(`الملف تالف: مرجع رمز غير موجود في البنك الموسّع (extID=${extId}).`);
      }
      chunks[count++] = mapped;
    } else {
      if (sOff >= streamLen) {
        throw new MtxCorruptDataError('الملف تالف: تسلسل ESCAPE_TOKEN مقطوع قبل بايت الطول.');
      }
      const len = stream[sOff++];
      if (sOff + len > streamLen) {
        throw new MtxCorruptDataError('الملف تالف: بيانات UTF-8 داخل ESCAPE_TOKEN مقطوعة.');
      }
      chunks[count++] = decodeEscapeUtf8Fast(stream, sOff, len);
      sOff += len;
    }
  }

  if (count < chunks.length) chunks.length = count;

  return {
    text: chunks.join(''),
    tokenCount: count,
  };
}

// ============================================================================
// 8. LEGACY & CURRENT FORMAT DECODERS (v1.0 – v2.5)
// ============================================================================

function decodeLegacySingleByteStream(
  stream: Uint8Array,
  reverseIndex: ReverseVocabularyIndex | null,
  customFullVocab: readonly string[] | null
): { text: string; tokenCount: number } {
  const len = stream.length;
  const chunks = new Array<string>(len);
  if (reverseIndex) {
    for (let i = 0; i < len; i++) {
      chunks[i] = reverseIndex.getOrEmpty(stream[i]);
    }
  } else if (customFullVocab) {
    for (let i = 0; i < len; i++) {
      chunks[i] = customFullVocab[stream[i]] ?? '';
    }
  }
  return {
    text: chunks.join(''),
    tokenCount: len,
  };
}

function tryDecryptAndInflateLegacy(
  encryptedPayload: Uint8Array,
  salt: number,
  expectedAdler32: number,
  customBaseVocabulary: readonly string[] | null,
  profile?: LegacyDecoderProfile
): {
  parsed: ReturnType<typeof parseStandardMtxPayload>;
  decoded: { text: string; tokenCount: number };
} {
  const secret = profile?.cipherSecret ?? MTX_CIPHER_SECRET;
  const candidates: (() => Uint8Array)[] = [];

  if (profile?.customDecryptor) {
    const customFn = profile.customDecryptor;
    candidates.push(() => customFn(encryptedPayload, salt));
  }
  candidates.push(() => applyMtxKeystream(encryptedPayload, salt, secret));
  candidates.push(() => applyLegacyLcgKeystream(encryptedPayload, salt, secret));
  candidates.push(() => encryptedPayload);

  let firstSuccess: {
    parsed: ReturnType<typeof parseStandardMtxPayload>;
    decoded: { text: string; tokenCount: number };
  } | null = null;

  for (const decrypt of candidates) {
    try {
      const decrypted = decrypt();
      const inflated = inflateSync(decrypted);
      const parsed = parseStandardMtxPayload(inflated, customBaseVocabulary, 0);
      const decoded = decodeLegacySingleByteStream(
        parsed.stream,
        parsed.reverseIndex,
        parsed.customFullVocab
      );
      if (calculateAdler32(decoded.text) === expectedAdler32) {
        return { parsed, decoded };
      }
      if (!firstSuccess) {
        firstSuccess = { parsed, decoded };
      }
    } catch {
      // Probe next historical decryption strategy
    }
  }

  if (firstSuccess) return firstSuccess;

  throw new MtxCorruptDataError(
    'فشل فك ضغط ملف MTX القديم: البيانات تالفة أو مشفرة بمفتاح/خوارزمية قديمة غير متطابقة.'
  );
}

export class MtxV1LegacyDecoder implements MtxFormatDecoder {
  readonly decoderId = 'mtx-legacy-v1';
  readonly formatLabel = 'MTX v1.0 (Legacy)';
  readonly supportedMagic: readonly MtxMagicType[] = ['MTX1'];
  readonly supportedVersions: readonly number[] = [
    MTX_FORMAT_VERSIONS.V1_LEGACY,
    MTX_FORMAT_VERSIONS.V1_0,
  ];
  readonly description =
    'مفكك ضغط مخصص لإصدارات MTX 1.x القديمة ذات الترويسة MTX1 وتدفق الرموز أحادي البايت.';

  constructor(private readonly profile?: LegacyDecoderProfile) {}

  canDecode(detection: MtxFormatDetectionResult): boolean {
    return detection.magic === 'MTX1' && this.supportedVersions.includes(detection.formatVersion);
  }

  decode(mtxBytes: Uint8Array, detection: MtxFormatDetectionResult): MtxDecodedPayload {
    const encryptedPayload = mtxBytes.subarray(MTX_HEADER_SIZE);
    const customBase = this.profile?.vocabulary ?? null;

    const { parsed, decoded } = tryDecryptAndInflateLegacy(
      encryptedPayload,
      detection.header.salt,
      detection.header.expectedAdler32,
      customBase,
      this.profile
    );

    const dictSize = parsed.reverseIndex
      ? parsed.reverseIndex.totalSize
      : parsed.customFullVocab?.length ?? PRECOMPILED_VOCAB_LEN;

    return {
      text: decoded.text,
      metadata: parsed.metadata,
      tokenCount: decoded.tokenCount,
      dictionarySize: dictSize,
      originalUtf8Bytes: detection.header.originalUtf8Bytes,
      expectedCrc32: null,
      decoderId: this.decoderId,
      formatLabel: this.formatLabel,
    };
  }
}

export class MtxV20V21LegacyDecoder implements MtxFormatDecoder {
  readonly decoderId = 'mtx-legacy-v2.0-v2.1';
  readonly formatLabel = 'MTX v2.0 / v2.1 (Legacy)';
  readonly supportedMagic: readonly MtxMagicType[] = ['MTX2'];
  readonly supportedVersions: readonly number[] = [
    MTX_FORMAT_VERSIONS.V2_0,
    MTX_FORMAT_VERSIONS.V2_1,
  ];
  readonly description =
    'مفكك ضغط مخصص لإصدارات MTX v2.0 و v2.1 قبل إضافة بروتوكول ESCAPE_TOKEN=255.';

  constructor(private readonly profile?: LegacyDecoderProfile) {}

  canDecode(detection: MtxFormatDetectionResult): boolean {
    return detection.magic === 'MTX2' && this.supportedVersions.includes(detection.formatVersion);
  }

  decode(mtxBytes: Uint8Array, detection: MtxFormatDetectionResult): MtxDecodedPayload {
    const encryptedPayload = mtxBytes.subarray(MTX_HEADER_SIZE);
    const customBase = this.profile?.vocabulary ?? null;

    const { parsed, decoded } = tryDecryptAndInflateLegacy(
      encryptedPayload,
      detection.header.salt,
      detection.header.expectedAdler32,
      customBase,
      this.profile
    );

    const dictSize = parsed.reverseIndex
      ? parsed.reverseIndex.totalSize
      : parsed.customFullVocab?.length ?? PRECOMPILED_VOCAB_LEN;

    return {
      text: decoded.text,
      metadata: parsed.metadata,
      tokenCount: decoded.tokenCount,
      dictionarySize: dictSize,
      originalUtf8Bytes: detection.header.originalUtf8Bytes,
      expectedCrc32: null,
      decoderId: this.decoderId,
      formatLabel:
        detection.formatVersion === MTX_FORMAT_VERSIONS.V2_0
          ? 'MTX v2.0 (Legacy)'
          : 'MTX v2.1 (Legacy)',
    };
  }
}

export class MtxV22Decoder implements MtxFormatDecoder {
  readonly decoderId = 'mtx-v2.2-fortified';
  readonly formatLabel = 'MTX v2.2 (Fortified)';
  readonly supportedMagic: readonly MtxMagicType[] = ['MTX2'];
  readonly supportedVersions: readonly number[] = [MTX_FORMAT_VERSIONS.V2_2];
  readonly description =
    'مفكك ضغط لإصدار MTX v2.2 المحصّن المزوّد ببروتوكول ESCAPE_TOKEN=255 ومفتاح التدفق غير الخطي.';

  canDecode(detection: MtxFormatDetectionResult): boolean {
    return detection.magic === 'MTX2' && detection.formatVersion === MTX_FORMAT_VERSIONS.V2_2;
  }

  decode(mtxBytes: Uint8Array, detection: MtxFormatDetectionResult): MtxDecodedPayload {
    const encryptedPayload = mtxBytes.subarray(MTX_HEADER_SIZE);
    const decryptedPayload = applyMtxKeystream(encryptedPayload, detection.header.salt);

    let payload: Uint8Array;
    try {
      payload = inflateSync(decryptedPayload);
    } catch {
      throw new MtxCorruptDataError(
        'فشل فك ضغط بيانات MTX v2.2: البيانات غير صالحة أو تعرضت للتلف.'
      );
    }

    const parsed = parseStandardMtxPayload(payload, null, 0);
    const reverseIndex = parsed.reverseIndex!;
    const decoded = decodeUniversalEscapeStream(parsed.stream, reverseIndex);

    return {
      text: decoded.text,
      metadata: parsed.metadata,
      tokenCount: decoded.tokenCount,
      dictionarySize: reverseIndex.totalSize,
      originalUtf8Bytes: detection.header.originalUtf8Bytes,
      expectedCrc32: null,
      decoderId: this.decoderId,
      formatLabel: this.formatLabel,
    };
  }
}

export class MtxV23Decoder implements MtxFormatDecoder {
  readonly decoderId = 'mtx-v2.3-unified';
  readonly formatLabel = 'MTX v2.3 (Unified)';
  readonly supportedMagic: readonly MtxMagicType[] = ['MTX2'];
  readonly supportedVersions: readonly number[] = [MTX_FORMAT_VERSIONS.V2_3];
  readonly description =
    'مفكك ضغط إصدار MTX v2.3 مع التحقق المزدوج (Adler-32 + CRC-32) وبصمة القاموس M3HD.';

  canDecode(detection: MtxFormatDetectionResult): boolean {
    return detection.magic === 'MTX2' && detection.formatVersion === MTX_FORMAT_VERSIONS.V2_3;
  }

  decode(mtxBytes: Uint8Array, detection: MtxFormatDetectionResult): MtxDecodedPayload {
    const encryptedPayload = mtxBytes.subarray(MTX_HEADER_SIZE);
    const decryptedPayload = applyMtxKeystream(encryptedPayload, detection.header.salt);

    let payload: Uint8Array;
    try {
      payload = inflateSync(decryptedPayload);
    } catch {
      throw new MtxCorruptDataError(
        'فشل فك ضغط بيانات MTX v2.3: البيانات غير صالحة أو تعرضت للتلف.'
      );
    }

    if (payload.length < MTX_V23_EXTENDED_HEADER_SIZE) {
      throw new MtxCorruptDataError('الملف تالف: ترويسة التحقق الممتدة (M3HD) لإصدار v2.3 مفقودة.');
    }

    if (
      payload[0] !== MTX_V23_PAYLOAD_MAGIC[0] ||
      payload[1] !== MTX_V23_PAYLOAD_MAGIC[1] ||
      payload[2] !== MTX_V23_PAYLOAD_MAGIC[2] ||
      payload[3] !== MTX_V23_PAYLOAD_MAGIC[3]
    ) {
      throw new MtxCorruptDataError('الملف تالف: توقيع ترويسة v2.3 الداخلية (M3HD) غير مطابق.');
    }

    const pDv = new DataView(payload.buffer, payload.byteOffset, payload.byteLength);
    const formatSpec = pDv.getUint16(4, false);
    const expectedCrc32 = pDv.getUint32(6, false);
    const vocabHash = pDv.getUint32(10, false);

    if (formatSpec > MTX_V23_FORMAT_SPEC + 9) {
      throw new MtxCorruptDataError(`مواصفة v2.3 الفرعية غير متوافقة (${formatSpec}).`);
    }

    const warnings: string[] = [];
    if (vocabHash !== PRECOMPILED_VOCAB_HASH) {
      warnings.push(
        `تنبيه توافق: بصمة القاموس الثابت في الملف (${vocabHash.toString(16)}) تختلف عن القاموس الحالي.`
      );
    }

    const parsed = parseStandardMtxPayload(payload, null, MTX_V23_EXTENDED_HEADER_SIZE);
    const reverseIndex = parsed.reverseIndex!;
    const decoded = decodeUniversalEscapeStream(parsed.stream, reverseIndex);

    return {
      text: decoded.text,
      metadata: parsed.metadata,
      tokenCount: decoded.tokenCount,
      dictionarySize: reverseIndex.totalSize,
      originalUtf8Bytes: detection.header.originalUtf8Bytes,
      expectedCrc32,
      decoderId: this.decoderId,
      formatLabel: this.formatLabel,
      warnings: warnings.length > 0 ? warnings : undefined,
    };
  }
}

export class MtxV24Decoder implements MtxFormatDecoder {
  readonly decoderId = 'mtx-v2.4-indexed';
  readonly formatLabel = 'MTX v2.4 (Indexed)';
  readonly supportedMagic: readonly MtxMagicType[] = ['MTX2'];
  readonly supportedVersions: readonly number[] = [MTX_FORMAT_VERSIONS.V2_4];
  readonly description =
    'مفكك ضغط إصدار MTX v2.4 المزوّد بفهرس عكسي مباشر وترويسة الفهرسة M4HD.';

  canDecode(detection: MtxFormatDetectionResult): boolean {
    return detection.magic === 'MTX2' && detection.formatVersion === MTX_FORMAT_VERSIONS.V2_4;
  }

  decode(mtxBytes: Uint8Array, detection: MtxFormatDetectionResult): MtxDecodedPayload {
    const encryptedPayload = mtxBytes.subarray(MTX_HEADER_SIZE);
    const decryptedPayload = applyMtxKeystream(encryptedPayload, detection.header.salt);

    let payload: Uint8Array;
    try {
      payload = inflateSync(decryptedPayload);
    } catch {
      throw new MtxCorruptDataError(
        'فشل فك ضغط بيانات MTX v2.4: البيانات غير صالحة أو تعرضت للتلف.'
      );
    }

    if (payload.length < MTX_V24_EXTENDED_HEADER_SIZE) {
      throw new MtxCorruptDataError('الملف تالف: ترويسة الفهرسة الممتدة (M4HD) لإصدار v2.4 مفقودة.');
    }

    if (
      payload[0] !== MTX_V24_PAYLOAD_MAGIC[0] ||
      payload[1] !== MTX_V24_PAYLOAD_MAGIC[1] ||
      payload[2] !== MTX_V24_PAYLOAD_MAGIC[2] ||
      payload[3] !== MTX_V24_PAYLOAD_MAGIC[3]
    ) {
      throw new MtxCorruptDataError('الملف تالف: توقيع ترويسة v2.4 الداخلية (M4HD) غير مطابق.');
    }

    const pDv = new DataView(payload.buffer, payload.byteOffset, payload.byteLength);
    const formatSpec = pDv.getUint16(4, false);
    const expectedCrc32 = pDv.getUint32(6, false);
    const vocabHash = pDv.getUint32(10, false);
    const tokenCountHint = pDv.getUint32(14, false);

    if (formatSpec > MTX_V24_FORMAT_SPEC + 9) {
      throw new MtxCorruptDataError(`مواصفة v2.4 الفرعية غير متوافقة (${formatSpec}).`);
    }

    const warnings: string[] = [];
    if (vocabHash !== PRECOMPILED_VOCAB_HASH) {
      warnings.push(
        `تنبيه توافق: بصمة القاموس الثابت في الملف (${vocabHash.toString(16)}) تختلف عن القاموس الحالي.`
      );
    }

    const parsed = parseStandardMtxPayload(payload, null, MTX_V24_EXTENDED_HEADER_SIZE);
    const reverseIndex = parsed.reverseIndex!;
    const decoded = decodeUniversalEscapeStream(parsed.stream, reverseIndex, tokenCountHint);

    return {
      text: decoded.text,
      metadata: parsed.metadata,
      tokenCount: decoded.tokenCount,
      dictionarySize: reverseIndex.totalSize,
      originalUtf8Bytes: detection.header.originalUtf8Bytes,
      expectedCrc32,
      decoderId: this.decoderId,
      formatLabel: this.formatLabel,
      warnings: warnings.length > 0 ? warnings : undefined,
    };
  }
}

interface ParsedV25Envelope {
  bank: CompiledVocabularyBank;
  isChunked: boolean;
  expectedCrc32: number;
  totalTokenCountHint: number;
  metadata: MtxMetadata;
  dynamicMerged: string[];
  chunks: MtxChunkIndexEntry[];
  singleStreamOffset?: number;
  headerPayload?: Uint8Array;
  warnings: string[];
}

function parseV25HeaderDirectory(
  mtxBytes: Uint8Array,
  detection: MtxFormatDetectionResult
): ParsedV25Envelope {
  if (mtxBytes.length < MTX_HEADER_SIZE + 5) {
    throw new MtxCorruptDataError('الملف تالف: ترويسة حاوية MTX v2.5 غير مكتملة.');
  }

  const dv = new DataView(mtxBytes.buffer, mtxBytes.byteOffset, mtxBytes.byteLength);
  const salt = detection.header.salt;
  const maskedSegLen = dv.getUint32(MTX_HEADER_SIZE, false);
  const headerSegLen = (maskedSegLen ^ (salt ^ MTX_V25_LEN_MASK)) >>> 0;
  const containerStart = MTX_HEADER_SIZE + 4;

  if (headerSegLen > mtxBytes.length - containerStart) {
    throw new MtxCorruptDataError('الملف تالف: طول ترويسة v2.5 الداخلية غير متوافق مع حجم الملف.');
  }

  const headerCipher =
    headerSegLen === 0
      ? mtxBytes.subarray(containerStart)
      : mtxBytes.subarray(containerStart, containerStart + headerSegLen);
  const decryptedHeader = applyMtxKeystream(headerCipher, salt);

  let headerPayload: Uint8Array;
  try {
    headerPayload = inflateSync(decryptedHeader);
  } catch {
    throw new MtxCorruptDataError(
      'فشل فك ضغط بيانات MTX v2.5: الترويسة الداخلية تالفة أو مفتاح الفك غير مطابق.'
    );
  }

  if (headerPayload.length < MTX_V25_EXTENDED_HEADER_SIZE) {
    throw new MtxCorruptDataError('الملف تالف: ترويسة M5HD لإصدار v2.5 مفقودة.');
  }

  if (
    headerPayload[0] !== MTX_V25_PAYLOAD_MAGIC[0] ||
    headerPayload[1] !== MTX_V25_PAYLOAD_MAGIC[1] ||
    headerPayload[2] !== MTX_V25_PAYLOAD_MAGIC[2] ||
    headerPayload[3] !== MTX_V25_PAYLOAD_MAGIC[3]
  ) {
    throw new MtxCorruptDataError('الملف تالف: توقيع M5HD غير مطابق.');
  }

  const pDv = new DataView(
    headerPayload.buffer,
    headerPayload.byteOffset,
    headerPayload.byteLength
  );
  const formatSpec = pDv.getUint16(4, false);
  const bankId = headerPayload[6];
  const chunkFlags = headerPayload[7];
  const expectedCrc32 = pDv.getUint32(8, false);
  const vocabHash = pDv.getUint32(12, false);
  const totalTokenCountHint = pDv.getUint32(16, false);

  if (formatSpec > MTX_V25_FORMAT_SPEC + 9) {
    throw new MtxCorruptDataError(`مواصفة v2.5 الفرعية غير متوافقة (${formatSpec}).`);
  }

  const bank = defaultVocabularyRegistry.getById(bankId);
  if (!bank) {
    throw new MtxCorruptDataError(`معرّف بنك المفردات (${bankId}) غير مسجل في المحرك.`);
  }

  const warnings: string[] = [];
  if (vocabHash !== bank.vocabHash) {
    warnings.push(
      `تنبيه توافق: بصمة بنك المفردات (${vocabHash.toString(16)}) تختلف عن البنك المسجل (${bank.code}).`
    );
  }

  const isChunked = (chunkFlags & 0x01) !== 0;
  let off = MTX_V25_EXTENDED_HEADER_SIZE;
  let chunkCount = 1;
  if (isChunked) {
    if (off + 2 > headerPayload.length) {
      throw new MtxCorruptDataError('الملف تالف: عدد الكتل المفهرسة مفقود في ترويسة M5HD.');
    }
    chunkCount = pDv.getUint16(off, false);
    off += 2;
  }

  const metaRes = parseMetadataJsonBlock(headerPayload, pDv, off);
  off = metaRes.nextOffset;

  const dynRes = parseDynamicDictionaryBlock(headerPayload, off);
  off = dynRes.nextOffset;

  if (!isChunked) {
    return {
      bank,
      isChunked: false,
      expectedCrc32,
      totalTokenCountHint,
      metadata: metaRes.metadata,
      dynamicMerged: dynRes.dynamicMerged,
      chunks: [],
      singleStreamOffset: off,
      headerPayload,
      warnings,
    };
  }

  const expectedTableBytes = chunkCount * MTX_V25_CHUNK_ENTRY_SIZE;
  if (off + expectedTableBytes > headerPayload.length) {
    throw new MtxCorruptDataError('الملف تالف: جدول فهرسة الكتل (Chunk Index) مقطوع.');
  }

  const chunks: MtxChunkIndexEntry[] = new Array(chunkCount);
  let blockCursor = containerStart + headerSegLen;

  for (let i = 0; i < chunkCount; i++) {
    const charStart = pDv.getUint32(off, false);
    const charLength = pDv.getUint32(off + 4, false);
    const utf8ByteStart = pDv.getUint32(off + 8, false);
    const utf8ByteLength = pDv.getUint32(off + 12, false);
    const paragraphStart = pDv.getUint32(off + 16, false);
    const paragraphCount = pDv.getUint16(off + 20, false);
    const compressedByteLength = pDv.getUint32(off + 22, false);
    const blockCrc32 = pDv.getUint32(off + 26, false);
    off += MTX_V25_CHUNK_ENTRY_SIZE;

    if (blockCursor + compressedByteLength > mtxBytes.length) {
      throw new MtxCorruptDataError(`الملف تالف: حدود الكتلة المضغوطة رقم ${i} تتجاوز حجم الملف.`);
    }

    chunks[i] = {
      blockIndex: i,
      charStart,
      charLength,
      utf8ByteStart,
      utf8ByteLength,
      paragraphStart,
      paragraphCount,
      compressedByteStart: blockCursor,
      compressedByteLength,
      blockCrc32,
    };
    blockCursor += compressedByteLength;
  }

  if (blockCursor !== mtxBytes.length) {
    throw new MtxCorruptDataError('الملف تالف: مجموع أطوال الكتل لا يطابق حجم الحاوية الثنائية.');
  }

  return {
    bank,
    isChunked: true,
    expectedCrc32,
    totalTokenCountHint,
    metadata: metaRes.metadata,
    dynamicMerged: dynRes.dynamicMerged,
    chunks,
    warnings,
  };
}

function decodeSingleV25Block(
  mtxBytes: Uint8Array,
  salt: number,
  chunk: MtxChunkIndexEntry,
  primaryTable: readonly (string | undefined)[],
  extendedTable: readonly (string | undefined)[]
): { text: string; tokenCount: number } {
  const blockSalt = (salt ^ Math.imul(chunk.blockIndex + 1, 0x9e3779b1)) >>> 0;
  const encSlice = mtxBytes.subarray(
    chunk.compressedByteStart,
    chunk.compressedByteStart + chunk.compressedByteLength
  );
  const decrypted = applyMtxKeystream(encSlice, blockSalt);
  let stream: Uint8Array;
  try {
    stream = inflateSync(decrypted);
  } catch {
    throw new MtxCorruptDataError(`فشل فك ضغط الكتلة رقم ${chunk.blockIndex}: البيانات تالفة.`);
  }
  const decoded = decodeV25BankedStream(stream, primaryTable, extendedTable);
  const actualBlockCrc = calculateCrc32(decoded.text);
  if (actualBlockCrc !== chunk.blockCrc32) {
    throw new MtxCorruptDataError(
      `فشل التحقق من سلامة الكتلة رقم ${chunk.blockIndex}: بصمة CRC-32 غير مطابقة.`
    );
  }
  return decoded;
}

/**
 * Current Decoder for MTX v2.5 Multilingual Dual-Bank & Chunk-Indexed Format ('MTX2', version 25, 'M5HD')
 */
export class MtxV25Decoder implements MtxFormatDecoder {
  readonly decoderId = 'mtx-v2.5-multilingual';
  readonly formatLabel = 'MTX v2.5 (Multilingual Indexed)';
  readonly supportedMagic: readonly MtxMagicType[] = ['MTX2'];
  readonly supportedVersions: readonly number[] = [MTX_FORMAT_VERSIONS.V2_5];
  readonly description =
    'مفكك ضغط الإصدار الحالي MTX v2.5 متعدد اللغات (العربية والإنجليزية والمختلط) المزوّد ببنوك المفردات المستقلة وفهرسة الكتل الجزئية M5HD.';

  canDecode(detection: MtxFormatDetectionResult): boolean {
    return detection.magic === 'MTX2' && detection.formatVersion === MTX_FORMAT_VERSIONS.V2_5;
  }

  decode(mtxBytes: Uint8Array, detection: MtxFormatDetectionResult): MtxDecodedPayload {
    const env = parseV25HeaderDirectory(mtxBytes, detection);
    const { primary, extended } = env.bank.bindDynamicTables(env.dynamicMerged);
    const dictSize = env.bank.primaryLen + env.bank.extStaticLen + env.dynamicMerged.length;

    if (!env.isChunked) {
      const payload = env.headerPayload!;
      let off = env.singleStreamOffset!;
      if (off + 4 > payload.length) {
        throw new MtxCorruptDataError('الملف تالف: ترويسة تيار الرموز مفقودة في M5HD.');
      }
      const pDv = new DataView(payload.buffer, payload.byteOffset, payload.byteLength);
      const streamByteLen = pDv.getUint32(off, false);
      off += 4;
      if (streamByteLen > MAX_STREAM_BYTE_LEN || off + streamByteLen > payload.length) {
        throw new MtxCorruptDataError('الملف تالف: طول تيار الرموز في v2.5 غير متوافق مع الحمولة.');
      }
      const stream = payload.subarray(off, off + streamByteLen);
      const decoded = decodeV25BankedStream(stream, primary, extended, env.totalTokenCountHint);

      return {
        text: decoded.text,
        metadata: env.metadata,
        tokenCount: decoded.tokenCount,
        dictionarySize: dictSize,
        originalUtf8Bytes: detection.header.originalUtf8Bytes,
        expectedCrc32: env.expectedCrc32,
        decoderId: this.decoderId,
        formatLabel: this.formatLabel,
        bankId: env.bank.bankId,
        chunkCount: 1,
        warnings: env.warnings.length > 0 ? env.warnings : undefined,
      };
    }

    const blockTexts = new Array<string>(env.chunks.length);
    let totalTokens = 0;
    for (let i = 0; i < env.chunks.length; i++) {
      const dec = decodeSingleV25Block(mtxBytes, detection.header.salt, env.chunks[i], primary, extended);
      blockTexts[i] = dec.text;
      totalTokens += dec.tokenCount;
    }

    return {
      text: blockTexts.join(''),
      metadata: env.metadata,
      tokenCount: totalTokens,
      dictionarySize: dictSize,
      originalUtf8Bytes: detection.header.originalUtf8Bytes,
      expectedCrc32: env.expectedCrc32,
      decoderId: this.decoderId,
      formatLabel: this.formatLabel,
      bankId: env.bank.bankId,
      chunkCount: env.chunks.length,
      warnings: env.warnings.length > 0 ? env.warnings : undefined,
    };
  }
}

// ============================================================================
// 9. FORMAT COMPATIBILITY LAYER
// ============================================================================

export class MtxFormatCompatibilityLayer {
  private readonly decoders: MtxFormatDecoder[] = [];

  constructor(initialDecoders: MtxFormatDecoder[] = []) {
    for (const decoder of initialDecoders) {
      this.registerDecoder(decoder);
    }
  }

  registerDecoder(decoder: MtxFormatDecoder): void {
    const existingIdx = this.decoders.findIndex((d) => d.decoderId === decoder.decoderId);
    if (existingIdx >= 0) {
      this.decoders[existingIdx] = decoder;
    } else {
      this.decoders.push(decoder);
    }
  }

  unregisterDecoder(decoderId: string): boolean {
    const idx = this.decoders.findIndex((d) => d.decoderId === decoderId);
    if (idx >= 0) {
      this.decoders.splice(idx, 1);
      return true;
    }
    return false;
  }

  listRegisteredDecoders(): DecoderRegistrationInfo[] {
    return this.decoders.map((d) => ({
      decoderId: d.decoderId,
      formatLabel: d.formatLabel,
      supportedMagic: [...d.supportedMagic],
      supportedVersions: [...d.supportedVersions],
      description: d.description,
    }));
  }

  getSupportedVersions(): number[] {
    const versions = new Set<number>();
    for (const d of this.decoders) {
      for (const v of d.supportedVersions) {
        versions.add(v);
      }
    }
    return Array.from(versions).sort((a, b) => a - b);
  }

  resolveDecoder(detection: MtxFormatDetectionResult): MtxFormatDecoder {
    const match = this.decoders.find((decoder) => decoder.canDecode(detection));
    if (!match) {
      throw new MtxUnsupportedVersionError(
        detection.formatVersion,
        this.getSupportedVersions(),
        `إصدار تنسيق MTX (${detection.versionLabel} / رمز ${detection.formatVersion}) غير مدعوم في طبقة التوافق الحالية. الإصدارات المدعومة: ${this.getSupportedVersions().join(', ')}.`
      );
    }
    return match;
  }

  decode(mtxBytes: Uint8Array, detection: MtxFormatDetectionResult): MtxDecodedPayload {
    const decoder = this.resolveDecoder(detection);
    return decoder.decode(mtxBytes, detection);
  }
}

export function createMtxCompatibilityLayer(
  legacyProfile?: LegacyDecoderProfile
): MtxFormatCompatibilityLayer {
  return new MtxFormatCompatibilityLayer([
    new MtxV25Decoder(),
    new MtxV24Decoder(),
    new MtxV23Decoder(),
    new MtxV22Decoder(),
    new MtxV20V21LegacyDecoder(legacyProfile),
    new MtxV1LegacyDecoder(legacyProfile),
  ]);
}

export const defaultCompatibilityLayer = createMtxCompatibilityLayer();

// ============================================================================
// 10. UNIFIED MTX ENGINE, PARTIAL CHUNK ACCESS & CHAPTER EDITION APIS
// ============================================================================

function encodeTokenRangeToStream(
  finalIds: Int32Array,
  start: number,
  count: number,
  bank: CompiledVocabularyBank,
  dynamicMerged: readonly string[],
  escapeByteBuffers: readonly Uint8Array[]
): { stream: Uint8Array; escapeTokensCount: number } {
  const end = start + count;
  let streamByteLength = 0;
  let escapeTokensCount = 0;

  for (let k = start; k < end; k++) {
    const id = finalIds[k];
    if (id < EXT_BANK_TOKEN) {
      streamByteLength += 1;
    } else if (id < ESCAPE_ID_BASE) {
      streamByteLength += 2;
    } else {
      escapeTokensCount++;
      const rawBytes = escapeByteBuffers[id - ESCAPE_ID_BASE];
      streamByteLength +=
        rawBytes.length > 255
          ? Math.ceil(rawBytes.length / 255) * 2 + rawBytes.length
          : 2 + rawBytes.length;
    }
  }

  const stream = new Uint8Array(streamByteLength);
  let off = 0;
  for (let k = start; k < end; k++) {
    const id = finalIds[k];
    if (id < EXT_BANK_TOKEN) {
      stream[off++] = id;
    } else if (id < ESCAPE_ID_BASE) {
      const extSlot =
        id < bank.extDynIdBase
          ? id - EXT_STATIC_ID_BASE
          : bank.extStaticLen + (id - bank.extDynIdBase);
      stream[off++] = EXT_BANK_TOKEN;
      stream[off++] = extSlot;
    } else {
      const rawBytes = escapeByteBuffers[id - ESCAPE_ID_BASE];
      if (rawBytes.length > 255) {
        for (let sliceOff = 0; sliceOff < rawBytes.length; sliceOff += 255) {
          const slice = rawBytes.subarray(sliceOff, sliceOff + 255);
          stream[off++] = ESCAPE_TOKEN;
          stream[off++] = slice.length;
          stream.set(slice, off);
          off += slice.length;
        }
      } else {
        stream[off++] = ESCAPE_TOKEN;
        stream[off++] = rawBytes.length;
        stream.set(rawBytes, off);
        off += rawBytes.length;
      }
    }
  }

  // Note: dynamicMerged is validated cleanly by BPE bounds; retained in signature for clarity
  void dynamicMerged;
  return { stream, escapeTokensCount };
}

export class MtxEngine {
  readonly engineVersion = MTX_ENGINE_VERSION;
  readonly outputFormatVersion = MTX_VERSION;

  constructor(
    private readonly compatibilityLayer: MtxFormatCompatibilityLayer = defaultCompatibilityLayer
  ) {}

  registerFormatDecoder(decoder: MtxFormatDecoder): void {
    this.compatibilityLayer.registerDecoder(decoder);
  }

  getCompatibilityLayer(): MtxFormatCompatibilityLayer {
    return this.compatibilityLayer;
  }

  inspect(mtxBytes: Uint8Array): MtxFormatDetectionResult {
    return detectMtxFormat(mtxBytes);
  }

  inspectChunkIndex(mtxBytes: Uint8Array): MtxChunkIndexInspection {
    const detection = detectMtxFormat(mtxBytes);
    if (detection.formatVersion !== MTX_FORMAT_VERSIONS.V2_5) {
      throw new MtxUnsupportedVersionError(
        detection.formatVersion,
        [MTX_FORMAT_VERSIONS.V2_5],
        'فهرسة الكتل الجزئية متاحة حصرياً لتنسيق MTX v2.5 (M5HD).'
      );
    }
    const env = parseV25HeaderDirectory(mtxBytes, detection);
    return {
      formatVersion: detection.formatVersion,
      bankId: env.bank.bankId,
      bankCode: env.bank.code,
      isChunked: env.isChunked,
      totalTokenCount: env.totalTokenCountHint,
      chunkCount: env.isChunked ? env.chunks.length : 1,
      metadata: env.metadata,
      chunks: env.chunks,
    };
  }

  async decompressBlock(mtxBytes: Uint8Array, blockIndex: number): Promise<string> {
    const detection = detectMtxFormat(mtxBytes);
    if (detection.formatVersion !== MTX_FORMAT_VERSIONS.V2_5) {
      return (await this.decompress(mtxBytes)).text;
    }
    const env = parseV25HeaderDirectory(mtxBytes, detection);
    if (!env.isChunked) {
      if (blockIndex !== 0) {
        throw new MtxCorruptDataError(`رقم الكتلة (${blockIndex}) خارج النطاق (الكتل المتاحة: 1).`);
      }
      return (await this.decompress(mtxBytes)).text;
    }
    if (blockIndex < 0 || blockIndex >= env.chunks.length) {
      throw new MtxCorruptDataError(
        `رقم الكتلة (${blockIndex}) خارج النطاق (0..${env.chunks.length - 1}).`
      );
    }
    const { primary, extended } = env.bank.bindDynamicTables(env.dynamicMerged);
    return decodeSingleV25Block(
      mtxBytes,
      detection.header.salt,
      env.chunks[blockIndex],
      primary,
      extended
    ).text;
  }

  async decompressParagraphRange(
    mtxBytes: Uint8Array,
    startParagraph: number,
    endParagraph: number
  ): Promise<{ text: string; accessedBlocks: number; totalBlocks: number }> {
    const detection = detectMtxFormat(mtxBytes);
    if (detection.formatVersion !== MTX_FORMAT_VERSIONS.V2_5) {
      const full = await this.decompress(mtxBytes);
      const paras = full.text.split('\n');
      const sliced = paras.slice(Math.max(0, startParagraph), endParagraph + 1).join('\n');
      return { text: sliced, accessedBlocks: 1, totalBlocks: 1 };
    }

    const env = parseV25HeaderDirectory(mtxBytes, detection);
    if (!env.isChunked) {
      const full = await this.decompress(mtxBytes);
      const paras = full.text.split('\n');
      const sliced = paras.slice(Math.max(0, startParagraph), endParagraph + 1).join('\n');
      return { text: sliced, accessedBlocks: 1, totalBlocks: 1 };
    }

    const { primary, extended } = env.bank.bindDynamicTables(env.dynamicMerged);
    const matchingChunks = env.chunks.filter((c) => {
      const cEnd = c.paragraphStart + c.paragraphCount - 1;
      return cEnd >= startParagraph && c.paragraphStart <= endParagraph;
    });

    if (matchingChunks.length === 0) {
      return { text: '', accessedBlocks: 0, totalBlocks: env.chunks.length };
    }

    const firstPara = matchingChunks[0].paragraphStart;
    const decodedTexts = new Array<string>(matchingChunks.length);
    for (let i = 0; i < matchingChunks.length; i++) {
      decodedTexts[i] = decodeSingleV25Block(
        mtxBytes,
        detection.header.salt,
        matchingChunks[i],
        primary,
        extended
      ).text;
    }

    const combined = decodedTexts.join('');
    const paras = combined.split('\n');
    const relStart = Math.max(0, startParagraph - firstPara);
    const relEnd = Math.min(paras.length - 1, endParagraph - firstPara);
    return {
      text: relStart <= relEnd ? paras.slice(relStart, relEnd + 1).join('\n') : '',
      accessedBlocks: matchingChunks.length,
      totalBlocks: env.chunks.length,
    };
  }

  async compress(
    text: string,
    metadata: Partial<MtxMetadata> = {},
    options: MtxCompressionOptions = {}
  ): Promise<MtxCompressionResult> {
    const startTime = performance.now();
    const profile: CompressionProfile = options.profile || 'balanced';
    const useCache = options.useCache !== false;

    const rawUtf8 = SHARED_ENCODER.encode(text);
    const rawUtf8Bytes = rawUtf8.length;
    const checksum = calculateAdler32(text);
    const crc32Checksum = calculateCrc32Bytes(rawUtf8);

    const langProfile = detectTextLanguageProfile(text);
    const bank = resolveBankForText(text, options.languageHint ?? metadata.languageCode ?? 'auto');
    const effectiveLangCode: MtxLanguageCode =
      metadata.languageCode ||
      (options.languageHint && options.languageHint !== 'auto'
        ? options.languageHint
        : langProfile.dominantLanguage);

    const targetChunkBytes = options.targetChunkBytes ?? MTX_V25_CHUNK_TARGET_BYTES;
    const wantsChunking =
      options.enableChunkIndex === true ||
      (options.enableChunkIndex !== false && rawUtf8Bytes >= MTX_V25_CHUNK_THRESHOLD_BYTES);

    let chunkSpans: TextChunkSpan[];
    if (wantsChunking) {
      chunkSpans = splitTextIntoParagraphChunks(text, targetChunkBytes);
      if (chunkSpans.length < 2) {
        chunkSpans = [
          {
            charStart: 0,
            charLength: text.length,
            paragraphStart: 0,
            paragraphCount: text.length === 0 ? 0 : text.split('\n').length,
          },
        ];
      }
    } else {
      chunkSpans = [
        {
          charStart: 0,
          charLength: text.length,
          paragraphStart: 0,
          paragraphCount: text.length === 0 ? 0 : text.split('\n').length,
        },
      ];
    }

    const isChunked = chunkSpans.length > 1;
    const trimmedWords = text.trim();
    const paragraphCount = text.length === 0 ? 0 : text.split('\n').length;

    const fullMetadata: MtxMetadata = {
      title: metadata.title || 'رواية جديدة',
      author: metadata.author || 'كاتب مجهول',
      chapterTitle: metadata.chapterTitle || 'الفصل الأول',
      chapterIndex: metadata.chapterIndex ?? 1,
      createdAt: metadata.createdAt || new Date().toISOString(),
      wordCount:
        metadata.wordCount ??
        (trimmedWords.length > 0 ? trimmedWords.split(/\s+/).filter(Boolean).length : 0),
      tags: metadata.tags || ['رواية متعددة اللغات', 'صيغة MTX v2.5'],
      genre: metadata.genre || 'أدب روائي',
      translator: metadata.translator || '',
      notes: metadata.notes || '',
      codecVersion: `MTX ${this.engineVersion} Multilingual`,
      formatVersion: this.outputFormatVersion,
      chapterId: metadata.chapterId,
      languageCode: effectiveLangCode,
      translationGroupId: metadata.translationGroupId,
      editionLabel: metadata.editionLabel,
      bankId: bank.bankId,
      paragraphCount,
      chunkCount: chunkSpans.length,
    };

    // 1. Multilingual Indexed Trie + SMI Integer-ID BPE Tokenization
    const plan = getOrComputeTokenizationPlan(text, bank, profile, chunkSpans, useCache);
    const finalIds = plan.finalTokenIds;
    const finalLen = finalIds.length;
    const dynamicMerged = plan.dynamicMerged;

    const escapeByteBuffers = new Array<Uint8Array>(plan.escapeLiterals.length);
    for (let e = 0; e < plan.escapeLiterals.length; e++) {
      escapeByteBuffers[e] = SHARED_ENCODER.encode(plan.escapeLiterals[e]);
    }

    const metaBytes = SHARED_ENCODER.encode(JSON.stringify(fullMetadata));
    if (metaBytes.length > MAX_METADATA_BYTES) {
      throw new MtxInvalidFormatError(
        `حجم بيانات الوصف (${metaBytes.length} بايت) يتجاوز الحد الأقصى المسموح (${MAX_METADATA_BYTES} بايت).`
      );
    }

    const dynBuffers = new Array<Uint8Array>(dynamicMerged.length);
    let dynSectionLen = 1;
    for (let d = 0; d < dynamicMerged.length; d++) {
      const buf = SHARED_ENCODER.encode(dynamicMerged[d]);
      dynBuffers[d] = buf;
      dynSectionLen += 1 + buf.length;
    }

    const deflateLevel = (profile === 'fast' ? 5 : profile === 'maximum' ? 9 : 8) as
      | 0
      | 1
      | 2
      | 3
      | 4
      | 5
      | 6
      | 7
      | 8
      | 9;
    const salt = (Math.random() * 0xffffffff) >>> 0;
    let escapeTokensCount = 0;
    let containerBody: Uint8Array;
    let headerSegLen = 0;

    if (!isChunked) {
      // Mode 0: Single-Stream M5HD Payload (Zero chunk table overhead)
      const encodedStream = encodeTokenRangeToStream(
        finalIds,
        0,
        finalLen,
        bank,
        dynamicMerged,
        escapeByteBuffers
      );
      escapeTokensCount = encodedStream.escapeTokensCount;
      const stream = encodedStream.stream;

      const payload = new Uint8Array(
        MTX_V25_EXTENDED_HEADER_SIZE + 2 + metaBytes.length + dynSectionLen + 4 + stream.length
      );
      const dv = new DataView(payload.buffer);
      let off = 0;

      payload.set(MTX_V25_PAYLOAD_MAGIC, off);
      off += 4;
      dv.setUint16(off, MTX_V25_FORMAT_SPEC, false);
      off += 2;
      payload[off++] = bank.bankId;
      payload[off++] = 0x00; // chunkFlags = single-stream
      dv.setUint32(off, crc32Checksum, false);
      off += 4;
      dv.setUint32(off, bank.vocabHash, false);
      off += 4;
      dv.setUint32(off, finalLen, false);
      off += 4;

      dv.setUint16(off, metaBytes.length, false);
      off += 2;
      payload.set(metaBytes, off);
      off += metaBytes.length;

      payload[off++] = dynBuffers.length;
      for (const b of dynBuffers) {
        payload[off++] = b.length;
        payload.set(b, off);
        off += b.length;
      }

      dv.setUint32(off, stream.length, false);
      off += 4;
      payload.set(stream, off);

      const compressedPayload = deflateSync(payload, { level: deflateLevel });
      containerBody = applyMtxKeystream(compressedPayload, salt);
      headerSegLen = 0;
    } else {
      // Mode 1: Multi-Block Partial-Indexed Container
      const numBlocks = chunkSpans.length;
      const encryptedBlocks: Uint8Array[] = new Array(numBlocks);
      const chunkUtf8Lengths = new Uint32Array(numBlocks);
      const chunkUtf8Starts = new Uint32Array(numBlocks);
      const chunkCrcs = new Uint32Array(numBlocks);
      let totalBlocksByteLen = 0;
      let runningUtf8Offset = 0;

      for (let b = 0; b < numBlocks; b++) {
        const span = chunkSpans[b];
        const range = plan.blockTokenRanges[b];
        const blockSlice = text.slice(span.charStart, span.charStart + span.charLength);
        const blockUtf8 = SHARED_ENCODER.encode(blockSlice);
        chunkUtf8Starts[b] = runningUtf8Offset;
        chunkUtf8Lengths[b] = blockUtf8.length;
        runningUtf8Offset += blockUtf8.length;
        chunkCrcs[b] = calculateCrc32Bytes(blockUtf8);

        const encodedBlock = encodeTokenRangeToStream(
          finalIds,
          range.start,
          range.count,
          bank,
          dynamicMerged,
          escapeByteBuffers
        );
        escapeTokensCount += encodedBlock.escapeTokensCount;

        const blockDeflated = deflateSync(encodedBlock.stream, { level: deflateLevel });
        const blockSalt = (salt ^ Math.imul(b + 1, 0x9e3779b1)) >>> 0;
        const blockEncrypted = applyMtxKeystream(blockDeflated, blockSalt);
        encryptedBlocks[b] = blockEncrypted;
        totalBlocksByteLen += blockEncrypted.length;
      }

      const headerDirSize =
        MTX_V25_EXTENDED_HEADER_SIZE +
        2 +
        2 +
        metaBytes.length +
        dynSectionLen +
        numBlocks * MTX_V25_CHUNK_ENTRY_SIZE;
      const headerDir = new Uint8Array(headerDirSize);
      const hDirDv = new DataView(headerDir.buffer);
      let off = 0;

      headerDir.set(MTX_V25_PAYLOAD_MAGIC, off);
      off += 4;
      hDirDv.setUint16(off, MTX_V25_FORMAT_SPEC, false);
      off += 2;
      headerDir[off++] = bank.bankId;
      headerDir[off++] = 0x01; // chunkFlags = multi-block indexed
      hDirDv.setUint32(off, crc32Checksum, false);
      off += 4;
      hDirDv.setUint32(off, bank.vocabHash, false);
      off += 4;
      hDirDv.setUint32(off, finalLen, false);
      off += 4;

      hDirDv.setUint16(off, numBlocks, false);
      off += 2;

      hDirDv.setUint16(off, metaBytes.length, false);
      off += 2;
      headerDir.set(metaBytes, off);
      off += metaBytes.length;

      headerDir[off++] = dynBuffers.length;
      for (const b of dynBuffers) {
        headerDir[off++] = b.length;
        headerDir.set(b, off);
        off += b.length;
      }

      for (let b = 0; b < numBlocks; b++) {
        const span = chunkSpans[b];
        hDirDv.setUint32(off, span.charStart, false);
        hDirDv.setUint32(off + 4, span.charLength, false);
        hDirDv.setUint32(off + 8, chunkUtf8Starts[b], false);
        hDirDv.setUint32(off + 12, chunkUtf8Lengths[b], false);
        hDirDv.setUint32(off + 16, span.paragraphStart, false);
        hDirDv.setUint16(off + 20, span.paragraphCount, false);
        hDirDv.setUint32(off + 22, encryptedBlocks[b].length, false);
        hDirDv.setUint32(off + 26, chunkCrcs[b], false);
        off += MTX_V25_CHUNK_ENTRY_SIZE;
      }

      const deflatedDir = deflateSync(headerDir, { level: deflateLevel });
      const encryptedDir = applyMtxKeystream(deflatedDir, salt);
      headerSegLen = encryptedDir.length;

      containerBody = new Uint8Array(headerSegLen + totalBlocksByteLen);
      containerBody.set(encryptedDir, 0);
      let bodyOff = headerSegLen;
      for (const eb of encryptedBlocks) {
        containerBody.set(eb, bodyOff);
        bodyOff += eb.length;
      }
    }

    // 6. Final Output Buffer (20-byte MTX2 header + 4-byte masked headerSegLen + containerBody)
    const mtxBytes = new Uint8Array(MTX_HEADER_SIZE + 4 + containerBody.length);
    mtxBytes.set(MTX_MAGIC, 0);
    mtxBytes[4] = this.outputFormatVersion; // 25 (v2.5)
    mtxBytes[5] = 0xff; // All flags including v2.5 multilingual & chunk support

    const hDv = new DataView(mtxBytes.buffer);
    hDv.setUint32(6, salt, false);
    hDv.setUint32(10, checksum, false);
    hDv.setUint32(14, rawUtf8Bytes, false);
    hDv.setUint16(18, Math.min(65535, plan.dictionaryEntries.length), false);
    hDv.setUint32(20, (headerSegLen ^ (salt ^ MTX_V25_LEN_MASK)) >>> 0, false);
    mtxBytes.set(containerBody, MTX_HEADER_SIZE + 4);

    const encodingDurationMs = Math.round((performance.now() - startTime) * 100) / 100;

    // 7. Immediate Lossless Verification
    const verifyStart = performance.now();
    const decompressed = await this.decompress(mtxBytes);
    const decodingDurationMs = Math.round((performance.now() - verifyStart) * 100) / 100;

    const isLossless = decompressed.text === text && decompressed.isLossless;
    const compressedBytes = mtxBytes.length;
    const savingsPercent =
      rawUtf8Bytes === 0
        ? 0
        : Math.max(
            0,
            Math.round(((rawUtf8Bytes - compressedBytes) / rawUtf8Bytes) * 1000) / 10
          );
    const compressionRatio =
      rawUtf8Bytes === 0
        ? 0
        : Math.round((rawUtf8Bytes / Math.max(1, compressedBytes)) * 10) / 10;

    return {
      mtxBytes,
      originalUtf8Bytes: rawUtf8Bytes,
      compressedBytes,
      savingsPercent,
      compressionRatio,
      encodingDurationMs,
      decodingDurationMs,
      tokenizationDurationMs: plan.tokenizationDurationMs,
      indexingDurationMs: plan.indexingDurationMs,
      dictionary: plan.dictionaryEntries.slice(),
      tokenCount: finalLen,
      metadata: fullMetadata,
      checksum,
      crc32Checksum,
      isLossless,
      profile,
      version: this.outputFormatVersion,
      engineVersion: this.engineVersion,
      escapeTokensCount,
      bankId: bank.bankId,
      languageCode: effectiveLangCode,
      chunkCount: chunkSpans.length,
    };
  }

  /**
   * Compresses one independent language edition (e.g., Arabic 'ar' or English 'en') of a novel chapter.
   * Preserves complete binary isolation between language streams while tagging chapter linkage metadata.
   */
  async compressChapterEdition(
    text: string,
    edition: MtxChapterEditionDescriptor,
    options: MtxCompressionOptions = {}
  ): Promise<MtxCompressionResult> {
    return this.compress(
      text,
      {
        title: edition.title,
        author: edition.author,
        chapterTitle: edition.chapterTitle,
        chapterIndex: edition.chapterIndex,
        chapterId: edition.chapterId,
        languageCode: edition.languageCode,
        translationGroupId: edition.translationGroupId || `chapter-${edition.chapterId}`,
        editionLabel: edition.editionLabel || edition.languageCode.toUpperCase(),
      },
      {
        ...options,
        languageHint: options.languageHint ?? edition.languageCode,
      }
    );
  }

  async decompress(mtxBytes: Uint8Array): Promise<MtxDecompressionResult> {
    const startTime = performance.now();

    const detection = detectMtxFormat(mtxBytes);
    const decoded = this.compatibilityLayer.decode(mtxBytes, detection);

    const actualChecksum = calculateAdler32(decoded.text);
    const actualCrc32 = calculateCrc32(decoded.text);
    const adler32Matched = actualChecksum === detection.header.expectedAdler32;
    const crc32Verified =
      decoded.expectedCrc32 !== null ? actualCrc32 === decoded.expectedCrc32 : null;
    const isLossless = adler32Matched && (crc32Verified === null || crc32Verified === true);

    const decodingDurationMs = Math.round((performance.now() - startTime) * 100) / 100;
    const compressedBytes = mtxBytes.length;
    const effectiveUtf8Bytes =
      decoded.originalUtf8Bytes > 0
        ? decoded.originalUtf8Bytes
        : getUtf8ByteLength(decoded.text);

    const savingsPercent =
      effectiveUtf8Bytes === 0
        ? 0
        : Math.max(
            0,
            Math.round(((effectiveUtf8Bytes - compressedBytes) / effectiveUtf8Bytes) * 1000) / 10
          );

    return {
      text: decoded.text,
      metadata: decoded.metadata,
      decodingDurationMs,
      originalUtf8Bytes: effectiveUtf8Bytes,
      compressedBytes,
      savingsPercent,
      tokenCount: decoded.tokenCount,
      dictionarySize: decoded.dictionarySize,
      isLossless,
      checksum: actualChecksum,
      crc32Checksum: actualCrc32,
      version: detection.formatVersion,
      engineVersion: this.engineVersion,
      formatLabel: decoded.formatLabel,
      decoderId: decoded.decoderId,
      bankId: decoded.bankId,
      chunkCount: decoded.chunkCount,
      integrityDetails: {
        adler32Matched,
        crc32Verified,
      },
    };
  }
}

export const defaultMtxEngine = new MtxEngine(defaultCompatibilityLayer);

export async function compressToMtx(
  text: string,
  metadata: Partial<MtxMetadata> = {},
  options: MtxCompressionOptions = {}
): Promise<MtxCompressionResult> {
  return defaultMtxEngine.compress(text, metadata, options);
}

export async function decompressFromMtx(mtxBytes: Uint8Array): Promise<MtxDecompressionResult> {
  return defaultMtxEngine.decompress(mtxBytes);
}

export function inspectMtxHeader(mtxBytes: Uint8Array): MtxFormatDetectionResult {
  return defaultMtxEngine.inspect(mtxBytes);
}

export function inspectMtxChunkIndex(mtxBytes: Uint8Array): MtxChunkIndexInspection {
  return defaultMtxEngine.inspectChunkIndex(mtxBytes);
}

export async function decompressMtxBlock(
  mtxBytes: Uint8Array,
  blockIndex: number
): Promise<string> {
  return defaultMtxEngine.decompressBlock(mtxBytes, blockIndex);
}

export async function decompressMtxParagraphRange(
  mtxBytes: Uint8Array,
  startParagraph: number,
  endParagraph: number
): Promise<{ text: string; accessedBlocks: number; totalBlocks: number }> {
  return defaultMtxEngine.decompressParagraphRange(mtxBytes, startParagraph, endParagraph);
}

export async function compressChapterEdition(
  text: string,
  edition: MtxChapterEditionDescriptor,
  options: MtxCompressionOptions = {}
): Promise<MtxCompressionResult> {
  return defaultMtxEngine.compressChapterEdition(text, edition, options);
}

export function buildLinkedChapterManifest(
  chapterId: string | number,
  editionResults: readonly MtxCompressionResult[],
  translationGroupId?: string
): MtxLinkedChapterManifest {
  const editions: Record<string, MtxChapterEditionManifestEntry> = {};
  for (const res of editionResults) {
    const lang = res.languageCode || res.metadata.languageCode || 'unknown';
    editions[lang] = {
      chapterId,
      languageCode: lang,
      formatVersion: res.version,
      bankId: res.bankId,
      originalUtf8Bytes: res.originalUtf8Bytes,
      compressedBytes: res.compressedBytes,
      savingsPercent: res.savingsPercent,
      adler32Checksum: res.checksum,
      crc32Checksum: res.crc32Checksum,
      chunkCount: res.chunkCount,
      wordCount: res.metadata.wordCount ?? 0,
      isLossless: res.isLossless,
    };
  }
  return {
    chapterId,
    translationGroupId: translationGroupId || `chapter-${chapterId}`,
    createdAt: new Date().toISOString(),
    editions,
  };
}

export function createMtxDownloadDataUrl(bytes: Uint8Array): string {
  const base64 = uint8ArrayToBase64(bytes);
  return `data:application/octet-stream;base64,${base64}`;
}

export async function downloadMtxFile(bytes: Uint8Array, filename: string): Promise<DownloadResult> {
  const cleanBase =
    filename
      .replace(/[^\w\u0621-\u064A\-_]/g, '_')
      .replace(/_{2,}/g, '_')
      .trim() || 'novel_chapter';
  const finalFilename = cleanBase.endsWith('.mtx') ? cleanBase : `${cleanBase}.mtx`;
  const dataUrl = createMtxDownloadDataUrl(bytes);

  const hasSavePicker = typeof window !== 'undefined' && 'showSaveFilePicker' in window;
  if (hasSavePicker) {
    try {
      const pickerFn = (
        window as unknown as { showSaveFilePicker: (opts: unknown) => Promise<FileSystemFileHandle> }
      ).showSaveFilePicker;
      const fileHandle = await pickerFn({
        suggestedName: finalFilename,
        types: [
          {
            description: 'ملف رواية MTX المضغوط (.mtx)',
            accept: {
              'application/octet-stream': ['.mtx'],
            },
          },
        ],
      });

      const writable = await fileHandle.createWritable();
      await writable.write(bytes as unknown as BlobPart);
      await writable.close();

      return {
        dataUrl,
        filename: finalFilename,
        savedViaDialog: true,
      };
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'name' in err && err.name === 'AbortError') {
        return {
          dataUrl,
          filename: finalFilename,
          savedViaDialog: false,
        };
      }
    }
  }

  try {
    const blob = new Blob([bytes as unknown as BlobPart], { type: 'application/octet-stream' });
    const blobUrl = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.style.display = 'none';
    a.href = blobUrl;
    a.setAttribute('download', finalFilename);
    document.body.appendChild(a);
    a.click();

    setTimeout(() => {
      try {
        if (a.parentNode) document.body.removeChild(a);
        URL.revokeObjectURL(blobUrl);
      } catch {
        // ignore
      }
    }, 60000);
  } catch {
    const a = document.createElement('a');
    a.style.display = 'none';
    a.href = dataUrl;
    a.setAttribute('download', finalFilename);
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      try {
        if (a.parentNode) document.body.removeChild(a);
      } catch {
        // ignore
      }
    }, 5000);
  }

  return {
    dataUrl,
    filename: finalFilename,
    savedViaDialog: false,
  };
}

export function getHexDump(bytes: Uint8Array, maxBytes = 64): string {
  const slice = bytes.subarray(0, maxBytes);
  const hexParts: string[] = [];
  for (const byte of slice) {
    hexParts.push(byte.toString(16).padStart(2, '0').toUpperCase());
  }
  return hexParts.join(' ');
}

export function uint8ArrayToBase64(bytes: Uint8Array): string {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

export function base64ToUint8Array(base64: string): Uint8Array {
  const binary = atob(base64);
  const len = binary.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}
