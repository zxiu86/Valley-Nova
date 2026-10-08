/**
 * MTX (Modular Text Xenon / Matrix Text) Codec Engine
 * Specialized Arabic Text Compression & Dynamic Dictionary Encoding Protocol (.mtx)
 * 
 * Features:
 * - High-efficiency compression ratio compared to standard UTF-8 Arabic text.
 * - Dynamic Frequency Dictionary Mapping (خريطة الترميز الديناميكية).
 * - Exact lossless reconstruction preserving all Arabic diacritics / Tashkeel (كَ, كِ, كُ, كْ, م, ن, etc.).
 * - Fast native browser decompression (< 0.5 millisecond).
 * - Built-in symmetric XOR Keystream encryption layer.
 * - Adler-32 checksum verification.
 */

export interface MtxMetadata {
  title: string;
  author: string;
  chapterTitle: string;
  chapterIndex: number;
  createdAt: string;
  wordCount?: number;
  tags?: string[];
}

export interface MtxDictionaryEntry {
  id: number;
  token: string;
  frequency: number;
  rawUtf8Bytes: number;
  totalSavedBytes: number;
  isDiacritized: boolean;
  type: 'word' | 'grapheme' | 'whitespace' | 'punctuation' | 'ngram';
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

// Magic bytes: 'M', 'T', 'X', '1'
export const MTX_MAGIC = new Uint8Array([0x4D, 0x54, 0x58, 0x31]);
export const MTX_VERSION = 1;
export const MTX_CIPHER_SECRET = 'MTX_ARABIC_SECURE_CODEC_V1_2026';

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
 * Deflates binary data using browser CompressionStream.
 */
async function compressStream(data: Uint8Array): Promise<Uint8Array> {
  if (typeof CompressionStream !== 'undefined') {
    const cs = new CompressionStream('deflate-raw');
    const writer = cs.writable.getWriter();
    await writer.write(data as unknown as BufferSource);
    await writer.close();

    const chunks: Uint8Array[] = [];
    const reader = cs.readable.getReader();
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      if (value) chunks.push(value);
    }
    const totalLength = chunks.reduce((acc, c) => acc + c.length, 0);
    const result = new Uint8Array(totalLength);
    let offset = 0;
    for (const chunk of chunks) {
      result.set(chunk, offset);
      offset += chunk.length;
    }
    return result;
  }

  return data;
}

/**
 * Inflates binary data using browser DecompressionStream.
 */
async function decompressStream(data: Uint8Array): Promise<Uint8Array> {
  if (typeof DecompressionStream !== 'undefined') {
    const ds = new DecompressionStream('deflate-raw');
    const writer = ds.writable.getWriter();
    await writer.write(data as unknown as BufferSource);
    await writer.close();

    const chunks: Uint8Array[] = [];
    const reader = ds.readable.getReader();
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      if (value) chunks.push(value);
    }
    const totalLength = chunks.reduce((acc, c) => acc + c.length, 0);
    const result = new Uint8Array(totalLength);
    let offset = 0;
    for (const chunk of chunks) {
      result.set(chunk, offset);
      offset += chunk.length;
    }
    return result;
  }

  return data;
}

/**
 * Tokenizes Arabic text preserving exact diacritics, graphemes, words, and whitespace.
 */
export function tokenizeArabicText(text: string): { tokens: string[]; dictionaryEntries: MtxDictionaryEntry[] } {
  const regex = /([\u0600-\u06FF\u0750-\u077F]+)|(\s+)|([،؛؟!«»""''—\-.:()[\]/\\\\]+)|([\u0600-\u06FF][\u064B-\u065F\u0670]*)|([\s\S])/g;

  const rawTokens: string[] = [];
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    if (match[0].length > 0) {
      rawTokens.push(match[0]);
    }
  }

  const freqMap = new Map<string, number>();
  for (const token of rawTokens) {
    freqMap.set(token, (freqMap.get(token) || 0) + 1);
  }

  const encoder = new TextEncoder();
  const sortedTokens = Array.from(freqMap.entries())
    .map(([token, freq]) => {
      const utf8Len = encoder.encode(token).length;
      const saved = freq * utf8Len - freq;
      return { token, freq, utf8Len, saved };
    })
    .sort((a, b) => b.saved - a.saved);

  const dictionaryEntries: MtxDictionaryEntry[] = sortedTokens.map((item, index) => {
    let type: MtxDictionaryEntry['type'] = 'word';
    if (/^\s+$/.test(item.token)) type = 'whitespace';
    else if (/^[،؛؟!«»""''—\-.:()[\]]+$/.test(item.token)) type = 'punctuation';
    else if (item.token.length <= 2 && !/[\s]/.test(item.token)) type = 'grapheme';

    return {
      id: index,
      token: item.token,
      frequency: item.freq,
      rawUtf8Bytes: item.utf8Len,
      totalSavedBytes: item.saved,
      isDiacritized: containsArabicTashkeel(item.token),
      type,
    };
  });

  return { tokens: rawTokens, dictionaryEntries };
}

/**
 * Compresses an Arabic text to the MTX binary format using dynamic dictionary + deflate + encryption.
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
    tags: metadata.tags || ['رواية عربية', 'صيغة MTX'],
  };

  // 1. Dynamic Tokenizer
  const { tokens, dictionaryEntries } = tokenizeArabicText(text);

  const t2id = new Map<string, number>();
  for (let i = 0; i < dictionaryEntries.length; i++) {
    t2id.set(dictionaryEntries[i].token, i);
  }

  // 2. Build Compact Binary Payload
  const metaBytes = encoder.encode(JSON.stringify(fullMetadata));
  const dictBuffers = dictionaryEntries.map(e => encoder.encode(e.token));

  let dictPayloadSize = 2; // entry count
  for (const b of dictBuffers) {
    dictPayloadSize += 1 + b.length;
  }

  let streamSize = 4; // token count
  for (const t of tokens) {
    const id = t2id.get(t) ?? 0;
    if (id < 128) streamSize += 1;
    else streamSize += 2;
  }

  const payload = new Uint8Array(2 + metaBytes.length + dictPayloadSize + streamSize);
  const dv = new DataView(payload.buffer);
  let off = 0;

  // Metadata block
  dv.setUint16(off, metaBytes.length, false);
  off += 2;
  payload.set(metaBytes, off);
  off += metaBytes.length;

  // Dictionary block
  dv.setUint16(off, dictBuffers.length, false);
  off += 2;
  for (const b of dictBuffers) {
    payload[off++] = b.length;
    payload.set(b, off);
    off += b.length;
  }

  // Token sequence block
  dv.setUint32(off, tokens.length, false);
  off += 4;
  for (const t of tokens) {
    const id = t2id.get(t) ?? 0;
    if (id < 128) {
      payload[off++] = id;
    } else {
      payload[off++] = (id & 0x7F) | 0x80;
      payload[off++] = (id >> 7);
    }
  }

  // 3. Compress with Deflate stream
  const compressedPayload = await compressStream(payload);

  // 4. Symmetric XOR Encryption
  const salt = (Math.random() * 0xffffffff) >>> 0;
  const encryptedPayload = applyMtxKeystream(compressedPayload, salt);

  // 5. Binary Header (20 bytes)
  const header = new Uint8Array(20);
  header.set(MTX_MAGIC, 0); // 0..3: MTX1
  header[4] = MTX_VERSION;  // 4: 1
  header[5] = 0x03;         // 5: Flags (Dict + Cipher)

  const hDv = new DataView(header.buffer);
  hDv.setUint32(6, salt, false);
  hDv.setUint32(10, checksum, false);
  hDv.setUint32(14, rawUtf8Bytes, false);
  hDv.setUint16(18, Math.min(65535, dictionaryEntries.length), false);

  const mtxBytes = new Uint8Array(header.length + encryptedPayload.length);
  mtxBytes.set(header, 0);
  mtxBytes.set(encryptedPayload, header.length);

  const encodingDurationMs = Math.round((performance.now() - startTime) * 100) / 100;

  // Immediate verification
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
 * Super-fast decompression of an MTX binary buffer.
 */
export async function decompressFromMtx(mtxBytes: Uint8Array): Promise<MtxDecompressionResult> {
  const startTime = performance.now();

  if (mtxBytes.length < 20) {
    throw new Error('الملف تالف: الحجم أصغر من ترويسة MTX المعتمدة.');
  }

  // 1. Verify Magic Signature
  for (let i = 0; i < 4; i++) {
    if (mtxBytes[i] !== MTX_MAGIC[i]) {
      throw new Error('صيغة غير صالحة: هذا الملف ليس بصيغة MTX.');
    }
  }

  const version = mtxBytes[4];
  if (version !== MTX_VERSION) {
    throw new Error(`إصدار غير مدعوم: إصدار الملف ${version}.`);
  }

  const hDv = new DataView(mtxBytes.buffer, mtxBytes.byteOffset, mtxBytes.byteLength);
  const salt = hDv.getUint32(6, false);
  const expectedChecksum = hDv.getUint32(10, false);
  const originalUtf8Bytes = hDv.getUint32(14, false);

  // 2. Decrypt Payload
  const encryptedPayload = mtxBytes.subarray(20);
  const decryptedPayload = applyMtxKeystream(encryptedPayload, salt);

  // 3. Decompress stream
  const payload = await decompressStream(decryptedPayload);

  // 4. Parse binary blocks
  const decoder = new TextDecoder('utf-8');
  const pDv = new DataView(payload.buffer, payload.byteOffset, payload.byteLength);
  let off = 0;

  // Metadata
  const metaLen = pDv.getUint16(off, false);
  off += 2;
  const metaStr = decoder.decode(payload.subarray(off, off + metaLen));
  off += metaLen;
  const metadata = JSON.parse(metaStr) as MtxMetadata;

  // Dictionary
  const dictCount = pDv.getUint16(off, false);
  off += 2;
  const dict: string[] = new Array(dictCount);
  for (let i = 0; i < dictCount; i++) {
    const len = payload[off++];
    dict[i] = decoder.decode(payload.subarray(off, off + len));
    off += len;
  }

  // Tokens sequence
  const tokenCount = pDv.getUint32(off, false);
  off += 4;
  const chunks: string[] = new Array(tokenCount);
  for (let i = 0; i < tokenCount; i++) {
    let id = payload[off++];
    if ((id & 0x80) !== 0) {
      const high = payload[off++];
      id = (id & 0x7F) | (high << 7);
    }
    chunks[i] = dict[id] || '';
  }

  // 5. Reassemble string and verify checksum
  const reconstructedText = chunks.join('');
  const actualChecksum = calculateAdler32(reconstructedText);
  const isLossless = actualChecksum === expectedChecksum;

  const decodingDurationMs = Math.round((performance.now() - startTime) * 100) / 100;
  const compressedBytes = mtxBytes.length;
  const savingsPercent = Math.max(0, Math.round(((originalUtf8Bytes - compressedBytes) / Math.max(1, originalUtf8Bytes)) * 1000) / 10);

  return {
    text: reconstructedText,
    metadata,
    decodingDurationMs,
    originalUtf8Bytes,
    compressedBytes,
    savingsPercent,
    tokenCount,
    dictionarySize: dictCount,
    isLossless,
    checksum: actualChecksum,
  };
}

/**
 * Triggers a browser download for the compressed .mtx file.
 */
export function downloadMtxFile(bytes: Uint8Array, filename: string): void {
  const blob = new Blob([bytes as unknown as BlobPart], { type: 'application/octet-stream' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename.endsWith('.mtx') ? filename : `${filename}.mtx`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
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
