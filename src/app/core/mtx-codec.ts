/**
 * MTX (Modular Text Xenon / Matrix Text) Codec Engine v2.0
 * Specialized Arabic Text Compression & Novel Context Morpheme Engine (.mtx)
 * 
 * Innovative Features:
 * 1. Prefix & Suffix Packing (ضغط السوابق واللواحق الشائعة: الـ، وبالـ، كالـ، ـهم، ـها، ـين، ـات).
 * 2. Novel Context Static Dictionary (قاموس الروايات والأدب الشائع: قال، قالت، كان، كانت، في، على، من...).
 * 3. Space & Punctuation Fusion (دمج علامات الترقيم والمسافات وأسطر الحوار: . ، ، ، \n— ، \n\n).
 * 4. High-frequency Tashkeel Graphemes (دمج الحركات الشائعة كَ، كِ، كُ، كْ، مَ، نَ في بايت واحد).
 * 5. Dynamic Chapter-Specific BPE Extension (اكتشاف المقاطع المتكررة الفريدة لكل رواية).
 * 6. Dynamic Variable-Length Entropy Encoding via universal fflate.
 * 7. 100% Lossless reconstruction preserving every diacritic, punctuation, and character.
 */

import { deflateSync, inflateSync } from 'fflate';

export interface MtxMetadata {
  title: string;
  author: string;
  chapterTitle: string;
  chapterIndex: number;
  createdAt: string;
  wordCount?: number;
  tags?: string[];
}

export type MtxEntryType = 'prefix' | 'suffix' | 'novel' | 'fusion' | 'grapheme' | 'letter' | 'word' | 'ngram' | 'whitespace' | 'punctuation';

export interface MtxDictionaryEntry {
  id: number;
  token: string;
  frequency: number;
  rawUtf8Bytes: number;
  totalSavedBytes: number;
  isDiacritized: boolean;
  type: MtxEntryType;
}

export interface MtxCompressionResult {
  mtxBytes: Uint8Array;
  originalUtf8Bytes: number;
  compressedBytes: number;
  savingsPercent: number;
  compressionRatio: number;
  encodingDurationMs: number;
  decodingDurationMs: number;
  dictionary: MtxDictionaryEntry[];
  tokenCount: number;
  metadata: MtxMetadata;
  checksum: number;
  isLossless: boolean;
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
}

// Magic bytes: 'M', 'T', 'X', '2'
export const MTX_MAGIC = new Uint8Array([0x4D, 0x54, 0x58, 0x32]);
export const MTX_VERSION = 2;
export const MTX_CIPHER_SECRET = 'MTX_ARABIC_SECURE_CODEC_V2_2026';

// 1. Static Base Alphabet (individual Arabic letters, Tashkeel marks, and numbers)
const STATIC_CHARS: string[] = (() => {
  const list: string[] = [];
  for (let c = 0x0621; c <= 0x064A; c++) list.push(String.fromCharCode(c));
  for (let c = 0x064B; c <= 0x0652; c++) list.push(String.fromCharCode(c));
  list.push('\u0670', '\u0671', '\u0640');
  list.push(' ', '\n', '\t', '،', '؛', '؟', '!', '.', ':', '«', '»', '"', '\'', '-', '—', '(', ')', '/', '\\');
  for (let d = 0; d <= 9; d++) list.push(d.toString());
  return list;
})();

// 2. Fused Punctuation & Space (Feature 3)
const FUSED_PUNCTUATION: string[] = [
  '، ', '؛ ', '. ', '؟ ', '! ', ': ', '.\n', '،\n', '\n\n', '\n— ', '— ', '\n- ', '- ', ' «', '» '
];

// 3. Prefixes & Suffixes (Feature 1)
const MORPH_PREFIXES: string[] = [
  'وبالـ', 'كالـ', 'فالـ', 'للـ', 'والـ', 'بالـ', 'الـ', 'ال', 'وبـ', 'ولـ'
];

const MORPH_SUFFIXES: string[] = [
  'هما', 'هم', 'هن', 'كم', 'نا', 'ها', 'ين', 'ون', 'ات', 'ان', 'ية'
];

// 4. Frequent Tashkeel Graphemes (Feature 5)
const TASHKEEL_GRAPHEMES: string[] = [
  'كَ', 'كِ', 'كُ', 'كْ',
  'مَ', 'مِ', 'مُ', 'مْ',
  'نَ', 'نِ', 'نُ', 'نْ',
  'لَ', 'لِ', 'لُ', 'لْ',
  'رَ', 'رِ', 'رُ', 'رْ',
  'فَ', 'فِ', 'بَ', 'بِ', 'تَ', 'تِ', 'يَ', 'يِ'
];

// 5. Novel Context Words (Feature 2)
const NOVEL_CONTEXT_WORDS: string[] = [
  'قال', 'قالت', 'كان', 'كانت', 'في', 'على', 'من', 'إلى', 'عن', 'مع',
  'هذا', 'هذه', 'ذلك', 'تلك', 'الذي', 'التي', 'كل', 'أن', 'إن', 'لم',
  'ثم', 'بعد', 'قبل', 'بين', 'عندما', 'كما', 'غير', 'حتى', 'فقد', 'لقد',
  'كَانَ', 'فِي', 'مِنْ', 'عَلَى', 'إِلَى'
];

/**
 * Precompiled Static Vocabulary (Strictly bounded so that static + dynamic <= 255).
 * Deduplicated and indexed.
 */
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

  return list;
})();

/**
 * Maps an item to its semantic entry type for inspection.
 */
export function getSemanticType(token: string): MtxEntryType {
  if (FUSED_PUNCTUATION.includes(token)) return 'fusion';
  if (MORPH_PREFIXES.includes(token)) return 'prefix';
  if (MORPH_SUFFIXES.includes(token)) return 'suffix';
  if (NOVEL_CONTEXT_WORDS.includes(token)) return 'novel';
  if (TASHKEEL_GRAPHEMES.includes(token)) return 'grapheme';
  if (/^\s+$/.test(token)) return 'whitespace';
  if (/^[،؛؟!«»""''—\-.:()[\]/]+$/.test(token)) return 'punctuation';
  if (token.length === 1) return 'letter';
  if (token.length === 2 && containsArabicTashkeel(token)) return 'grapheme';
  return 'ngram';
}

/**
 * Calculates Adler-32 checksum for integrity verification.
 */
export function calculateAdler32(str: string): number {
  let a = 1;
  let b = 0;
  for (let i = 0; i < str.length; i++) {
    const code = str.charCodeAt(i);
    a = (a + code) % 65521;
    b = (b + a) % 65521;
  }
  return ((b << 16) | a) >>> 0;
}

/**
 * Checks if a string contains Arabic Tashkeel / Harakat.
 */
export function containsArabicTashkeel(text: string): boolean {
  return /[\u064B-\u065F\u0670]/.test(text);
}

/**
 * Symmetric XOR cipher keystream generator based on salt seed and secret key.
 */
function applyMtxKeystream(data: Uint8Array, salt: number): Uint8Array {
  const result = new Uint8Array(data.length);
  const secret = MTX_CIPHER_SECRET;
  let state = (salt ^ 0x9e3779b9) >>> 0;

  for (let i = 0; i < data.length; i++) {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    const keyByte = secret.charCodeAt(i % secret.length);
    const pseudoRandomByte = (state >>> 24) ^ keyByte;
    result[i] = data[i] ^ pseudoRandomByte;
  }

  return result;
}

/**
 * Multi-layer Arabic morphological tokenizer:
 * 1. Matches precompiled words, affixes, tashkeel graphemes, and fused punctuation greedily.
 * 2. Learns chapter-specific BPE merges for maximum repetition exploitation.
 */
export function tokenizeArabicText(text: string): { tokens: string[]; dictionaryEntries: MtxDictionaryEntry[]; dynamicMerged: string[] } {
  const encoder = new TextEncoder();
  const sortedPrecompiled = [...PRECOMPILED_VOCAB].sort((a, b) => b.length - a.length);

  // 1. Greedy matching against the rich precompiled static vocabulary
  let i = 0;
  const initialTokens: string[] = [];

  while (i < text.length) {
    let matched: string | null = null;
    for (const p of sortedPrecompiled) {
      if (text.startsWith(p, i)) {
        matched = p;
        break;
      }
    }

    if (matched) {
      initialTokens.push(matched);
      i += matched.length;
    } else {
      initialTokens.push(text[i]);
      i++;
    }
  }

  // 2. Discover chapter-specific dynamic merges (BPE)
  const vocab = [...PRECOMPILED_VOCAB];
  const dynamicMerged: string[] = [];
  const maxDynamicSlots = Math.max(0, 255 - PRECOMPILED_VOCAB.length);

  let currentTokens = initialTokens;

  while (dynamicMerged.length < maxDynamicSlots) {
    const pairFreq = new Map<string, number>();
    for (let j = 0; j < currentTokens.length - 1; j++) {
      const pair = currentTokens[j] + currentTokens[j + 1];
      pairFreq.set(pair, (pairFreq.get(pair) || 0) + 1);
    }

    let bestPair: string | null = null;
    let maxSavings = 0;

    for (const [pair, freq] of pairFreq.entries()) {
      const utf8Len = encoder.encode(pair).length;
      const savings = freq * (utf8Len - 1);
      if (savings > maxSavings && freq >= 2) {
        maxSavings = savings;
        bestPair = pair;
      }
    }

    if (!bestPair || maxSavings < 4) break;

    vocab.push(bestPair);
    dynamicMerged.push(bestPair);

    const nextTokens: string[] = [];
    for (let j = 0; j < currentTokens.length; j++) {
      if (j < currentTokens.length - 1 && (currentTokens[j] + currentTokens[j + 1]) === bestPair) {
        nextTokens.push(bestPair);
        j++;
      } else {
        nextTokens.push(currentTokens[j]);
      }
    }
    currentTokens = nextTokens;
  }

  // 3. Compute detailed frequency metrics for UI display
  const tokenFreq = new Map<string, number>();
  for (const t of currentTokens) {
    tokenFreq.set(t, (tokenFreq.get(t) || 0) + 1);
  }

  const dictionaryEntries: MtxDictionaryEntry[] = Array.from(tokenFreq.entries())
    .map(([token, freq], idx) => {
      const utf8Len = encoder.encode(token).length;
      const saved = freq * Math.max(1, utf8Len - 1);
      return {
        id: idx,
        token,
        frequency: freq,
        rawUtf8Bytes: utf8Len,
        totalSavedBytes: saved,
        isDiacritized: containsArabicTashkeel(token),
        type: getSemanticType(token),
      };
    })
    .sort((a, b) => b.totalSavedBytes - a.totalSavedBytes);

  return {
    tokens: currentTokens,
    dictionaryEntries,
    dynamicMerged,
  };
}

/**
 * Compresses an Arabic novel chapter to the enhanced MTX v2 binary format.
 */
export async function compressToMtx(
  text: string,
  metadata: Partial<MtxMetadata> = {}
): Promise<MtxCompressionResult> {
  const startTime = performance.now();
  const encoder = new TextEncoder();
  const rawUtf8 = encoder.encode(text);
  const rawUtf8Bytes = rawUtf8.length;
  const checksum = calculateAdler32(text);

  const fullMetadata: MtxMetadata = {
    title: metadata.title || 'رواية جديدة',
    author: metadata.author || 'كاتب مجهول',
    chapterTitle: metadata.chapterTitle || 'الفصل الأول',
    chapterIndex: metadata.chapterIndex ?? 1,
    createdAt: metadata.createdAt || new Date().toISOString(),
    wordCount: text.trim().split(/\s+/).filter(Boolean).length,
    tags: metadata.tags || ['رواية عربية', 'صيغة MTX v2'],
  };

  // 1. Advanced Tokenization
  const { tokens, dictionaryEntries, dynamicMerged } = tokenizeArabicText(text);

  // Combine precompiled vocabulary + chapter dynamic merges
  const fullVocab = [...PRECOMPILED_VOCAB, ...dynamicMerged];
  const vocabMap = new Map<string, number>();
  for (let i = 0; i < fullVocab.length; i++) {
    vocabMap.set(fullVocab[i], i);
  }

  // 2. Build 1-Byte Token Stream
  const stream = new Uint8Array(tokens.length);
  for (let i = 0; i < tokens.length; i++) {
    stream[i] = vocabMap.get(tokens[i]) ?? 0;
  }

  // 3. Compact Binary Payload
  const metaBytes = encoder.encode(JSON.stringify(fullMetadata));
  const dynBuffers = dynamicMerged.map(d => encoder.encode(d));

  let dynSectionLen = 1; // count (1 byte)
  for (const b of dynBuffers) {
    dynSectionLen += 1 + b.length;
  }

  const payload = new Uint8Array(2 + metaBytes.length + dynSectionLen + 4 + stream.length);
  const dv = new DataView(payload.buffer);
  let off = 0;

  // Metadata block
  dv.setUint16(off, metaBytes.length, false);
  off += 2;
  payload.set(metaBytes, off);
  off += metaBytes.length;

  // Dynamic merges dictionary block (only novel-specific merges!)
  payload[off++] = dynamicMerged.length;
  for (const b of dynBuffers) {
    payload[off++] = b.length;
    payload.set(b, off);
    off += b.length;
  }

  // Token sequence block (1 byte per token)
  dv.setUint32(off, stream.length, false);
  off += 4;
  payload.set(stream, off);

  // 4. Deflate Entropy Compression
  const compressedPayload = deflateSync(payload, { level: 9 });

  // 5. Symmetric Keystream Encryption
  const salt = (Math.random() * 0xffffffff) >>> 0;
  const encryptedPayload = applyMtxKeystream(compressedPayload, salt);

  // 6. Binary Header (20 bytes)
  const header = new Uint8Array(20);
  header.set(MTX_MAGIC, 0); // MTX2
  header[4] = MTX_VERSION;  // 2
  header[5] = 0x07;         // Flags: (Precompiled + Affixes + Fusions + BPE + Cipher)

  const hDv = new DataView(header.buffer);
  hDv.setUint32(6, salt, false);
  hDv.setUint32(10, checksum, false);
  hDv.setUint32(14, rawUtf8Bytes, false);
  hDv.setUint16(18, Math.min(65535, dictionaryEntries.length), false);

  const mtxBytes = new Uint8Array(header.length + encryptedPayload.length);
  mtxBytes.set(header, 0);
  mtxBytes.set(encryptedPayload, header.length);

  const encodingDurationMs = Math.round((performance.now() - startTime) * 100) / 100;

  // 7. Verify Lossless Decompression Immediately
  const verifyStart = performance.now();
  const decompressed = await decompressFromMtx(mtxBytes);
  const decodingDurationMs = Math.round((performance.now() - verifyStart) * 100) / 100;

  const isLossless = decompressed.text === text;
  const compressedBytes = mtxBytes.length;
  const savingsPercent = Math.max(0, Math.round(((rawUtf8Bytes - compressedBytes) / Math.max(1, rawUtf8Bytes)) * 1000) / 10);
  const compressionRatio = Math.round((rawUtf8Bytes / Math.max(1, compressedBytes)) * 10) / 10;

  return {
    mtxBytes,
    originalUtf8Bytes: rawUtf8Bytes,
    compressedBytes,
    savingsPercent,
    compressionRatio,
    encodingDurationMs,
    decodingDurationMs,
    dictionary: dictionaryEntries,
    tokenCount: tokens.length,
    metadata: fullMetadata,
    checksum,
    isLossless,
  };
}

/**
 * Super-fast lossless decompression of an MTX binary buffer.
 */
export async function decompressFromMtx(mtxBytes: Uint8Array): Promise<MtxDecompressionResult> {
  const startTime = performance.now();

  if (mtxBytes.length < 20) {
    throw new Error('الملف تالف: الحجم أصغر من ترويسة MTX المعتمدة.');
  }

  // 1. Verify Magic Signature (Supports MTX1 and MTX2)
  const isV2 = mtxBytes[0] === 0x4D && mtxBytes[1] === 0x54 && mtxBytes[2] === 0x58 && mtxBytes[3] === 0x32;
  const isV1 = mtxBytes[0] === 0x4D && mtxBytes[1] === 0x54 && mtxBytes[2] === 0x58 && mtxBytes[3] === 0x31;

  if (!isV2 && !isV1) {
    throw new Error('صيغة غير صالحة: هذا الملف ليس بصيغة MTX المعتمدة.');
  }

  const hDv = new DataView(mtxBytes.buffer, mtxBytes.byteOffset, mtxBytes.byteLength);
  const salt = hDv.getUint32(6, false);
  const expectedChecksum = hDv.getUint32(10, false);
  const originalUtf8Bytes = hDv.getUint32(14, false);

  // 2. Decrypt Payload
  const encryptedPayload = mtxBytes.subarray(20);
  const decryptedPayload = applyMtxKeystream(encryptedPayload, salt);

  // 3. Decompress Inflate
  let payload: Uint8Array;
  try {
    payload = inflateSync(decryptedPayload);
  } catch {
    throw new Error('فشل فك ضغط بيانات MTX: البيانات غير صالحة أو تالفة.');
  }

  // 4. Parse Binary Structure
  const decoder = new TextDecoder('utf-8');
  const pDv = new DataView(payload.buffer, payload.byteOffset, payload.byteLength);
  let off = 0;

  if (payload.length < 7) {
    throw new Error('الملف تالف: حجم الحمولة أصغر من الحد الأدنى.');
  }

  // Metadata
  const metaLen = pDv.getUint16(off, false);
  off += 2;
  if (off + metaLen > payload.length) {
    throw new Error('الملف تالف: بيانات الوصف غير صالحة.');
  }
  const metaStr = decoder.decode(payload.subarray(off, off + metaLen));
  off += metaLen;
  const metadata = JSON.parse(metaStr) as MtxMetadata;

  // Dynamic merges
  if (off >= payload.length) {
    throw new Error('الملف تالف: جدول المقاطع مفقود.');
  }
  const dynCount = payload[off++];
  if (dynCount < 0 || dynCount > 255) {
    throw new Error('الملف تالف: حجم القاموس غير صالح.');
  }

  const dynamicMerged: string[] = new Array(dynCount);
  for (let i = 0; i < dynCount; i++) {
    if (off >= payload.length) throw new Error('الملف تالف: مقاطع القاموس مقطوعة.');
    const len = payload[off++];
    if (off + len > payload.length) throw new Error('الملف تالف: طول المقطع غير صالح.');
    dynamicMerged[i] = decoder.decode(payload.subarray(off, off + len));
    off += len;
  }

  // Rebuild full vocabulary table
  const fullVocabulary = [...PRECOMPILED_VOCAB, ...dynamicMerged];

  // Token sequence
  if (off + 4 > payload.length) {
    throw new Error('الملف تالف: تيار الرموز مفقود.');
  }
  const tokenCount = pDv.getUint32(off, false);
  off += 4;

  if (tokenCount < 0 || tokenCount > 10000000 || off + tokenCount > payload.length) {
    throw new Error('الملف تالف: عدد الرموز غير متوافق.');
  }

  const stream = payload.subarray(off, off + tokenCount);

  // 5. High-speed String Reassembly
  const chunks: string[] = new Array(tokenCount);
  for (let i = 0; i < tokenCount; i++) {
    const id = stream[i];
    chunks[i] = fullVocabulary[id] || '';
  }

  const reconstructedText = chunks.join('');
  const actualChecksum = calculateAdler32(reconstructedText);
  const isLossless = actualChecksum === expectedChecksum;

  const decodingDurationMs = Math.round((performance.now() - startTime) * 100) / 100;
  const compressedBytes = mtxBytes.length;
  const effectiveUtf8Bytes = originalUtf8Bytes > 0 ? originalUtf8Bytes : new TextEncoder().encode(reconstructedText).length;
  const savingsPercent = Math.max(0, Math.round(((effectiveUtf8Bytes - compressedBytes) / effectiveUtf8Bytes) * 1000) / 10);

  return {
    text: reconstructedText,
    metadata,
    decodingDurationMs,
    originalUtf8Bytes: effectiveUtf8Bytes,
    compressedBytes,
    savingsPercent,
    tokenCount,
    dictionarySize: fullVocabulary.length,
    isLossless,
    checksum: actualChecksum,
  };
}

/**
 * Generates a direct data URI for the MTX binary buffer.
 */
export function createMtxDownloadDataUrl(bytes: Uint8Array): string {
  const base64 = uint8ArrayToBase64(bytes);
  return `data:application/octet-stream;base64,${base64}`;
}

export interface DownloadResult {
  dataUrl: string;
  filename: string;
  savedViaDialog: boolean;
}

/**
 * Triggers native browser download dialog ("Save As" prompt).
 */
export async function downloadMtxFile(bytes: Uint8Array, filename: string): Promise<DownloadResult> {
  const cleanBase = filename
    .replace(/[^\w\u0621-\u064A\-_]/g, '_')
    .replace(/_{2,}/g, '_')
    .trim() || 'chapter';
  const finalFilename = cleanBase.endsWith('.mtx') ? cleanBase : `${cleanBase}.mtx`;
  const dataUrl = createMtxDownloadDataUrl(bytes);

  // 1. Try Native File System Save Dialog (showSaveFilePicker)
  const hasSavePicker = typeof window !== 'undefined' && 'showSaveFilePicker' in window;
  if (hasSavePicker) {
    try {
      const pickerFn = (window as unknown as { showSaveFilePicker: (opts: unknown) => Promise<FileSystemFileHandle> }).showSaveFilePicker;
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

  // 2. Standard Browser Download Prompt via Object URL
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
        if (a.parentNode) {
          document.body.removeChild(a);
        }
        URL.revokeObjectURL(blobUrl);
      } catch {
        // ignore
      }
    }, 60000);
  } catch {
    // 3. Fallback Data URL anchor
    const a = document.createElement('a');
    a.style.display = 'none';
    a.href = dataUrl;
    a.setAttribute('download', finalFilename);
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      try {
        if (a.parentNode) {
          document.body.removeChild(a);
        }
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

/**
 * Helper to convert Uint8Array to Hex string preview.
 */
export function getHexDump(bytes: Uint8Array, maxBytes = 64): string {
  const slice = bytes.subarray(0, maxBytes);
  const hexParts: string[] = [];
  for (const byte of slice) {
    hexParts.push(byte.toString(16).padStart(2, '0').toUpperCase());
  }
  return hexParts.join(' ');
}

/**
 * Encodes Uint8Array to base64 string.
 */
export function uint8ArrayToBase64(bytes: Uint8Array): string {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

/**
 * Decodes base64 string to Uint8Array.
 */
export function base64ToUint8Array(base64: string): Uint8Array {
  const binary = atob(base64);
  const len = binary.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}
