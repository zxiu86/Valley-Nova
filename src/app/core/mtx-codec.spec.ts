import { describe, it, expect } from 'vitest';
import {
  compressToMtx,
  decompressFromMtx,
  uint8ArrayToBase64,
  base64ToUint8Array,
  calculateAdler32,
  MtxMetadata,
} from './mtx-codec';

describe('MTX Binary Codec Engine v2.2', () => {
  const sampleArabicText = `
كَانَ فِي قَدِيمِ الزَّمَانِ، فِي بَلْدَةٍ هَادِئَةٍ عَلَى ضِفَافِ النَّهْرِ، كَاتِبٌ يَقْضِي لَيَالِيَهُ فِي تَدْوِينِ الأَسْفَارِ.
قَالَ لَهَا: «إِنَّ الحَرْفَ أَمَانَةٌ، وَالتَّشْكِيلَ رُوحُ الكَلِمَةِ».
فَأَجَابَتْهُ: «وَالحِكْمَةُ أَنْ تَبْقَى النُّصُوصُ حَيَّةً لَا تَمُوتُ».
وَبِالرَّغْمِ مِنْ تَقَادُمِ السِّنِينَ، ظَلَّتْ تِلْكَ المَخْطُوطَاتُ نَقِيَّةً لَمْ يَمَسَّهَا ضَيَاعٌ!
  `.trim();

  const metadata: MtxMetadata = {
    title: 'سفر البدايات',
    author: 'أديب الأروقة',
    chapterTitle: 'الفصل الأول: نداء الحرف',
    chapterIndex: 1,
    createdAt: new Date().toISOString(),
    tags: ['أدب', 'تراث', 'حكمة'],
  };

  it('should compress Arabic diacritized text into a valid MTX binary container', async () => {
    const result = await compressToMtx(sampleArabicText, metadata);

    expect(result.mtxBytes).toBeInstanceOf(Uint8Array);
    expect(result.mtxBytes.length).toBeGreaterThan(20); // Header is 20 bytes
    expect(result.savingsPercent).toBeGreaterThan(0);
    expect(result.originalUtf8Bytes).toBeGreaterThan(result.compressedBytes);
    expect(result.isLossless).toBe(true);

    // Verify MTX2 Magic bytes (0x4D, 0x54, 0x58, 0x32)
    expect(result.mtxBytes[0]).toBe(0x4D); // 'M'
    expect(result.mtxBytes[1]).toBe(0x54); // 'T'
    expect(result.mtxBytes[2]).toBe(0x58); // 'X'
    expect(result.mtxBytes[3]).toBe(0x32); // '2'
    expect(result.mtxBytes[4]).toBe(22);   // v2.2
  });

  it('should decompress MTX binary back to original text with 100% losslessness', async () => {
    const compressed = await compressToMtx(sampleArabicText, metadata);
    const decompressed = await decompressFromMtx(compressed.mtxBytes);

    expect(decompressed.isLossless).toBe(true);
    expect(decompressed.text).toBe(sampleArabicText);
    expect(decompressed.metadata.title).toBe(metadata.title);
    expect(decompressed.metadata.author).toBe(metadata.author);
    expect(decompressed.decodingDurationMs).toBeGreaterThanOrEqual(0);
    expect(decompressed.version).toBe(22);
  });

  it('should support maximum and fast profiles and dual checksums', async () => {
    const maxRes = await compressToMtx(sampleArabicText, metadata, { profile: 'maximum' });
    const fastRes = await compressToMtx(sampleArabicText, metadata, { profile: 'fast' });

    expect(maxRes.isLossless).toBe(true);
    expect(fastRes.isLossless).toBe(true);
    expect(maxRes.crc32Checksum).toBeGreaterThan(0);
    expect(maxRes.checksum).toBeGreaterThan(0);
  });

  it('should correctly calculate Adler-32 checksum and verify integrity', () => {
    const checksum1 = calculateAdler32(sampleArabicText);
    const checksum2 = calculateAdler32(sampleArabicText);
    const checksumDifferent = calculateAdler32(sampleArabicText + ' ');

    expect(checksum1).toBe(checksum2);
    expect(checksum1).not.toBe(checksumDifferent);
  });

  it('should handle Base64 serialization and deserialization cleanly', async () => {
    const compressed = await compressToMtx(sampleArabicText, metadata);
    const b64 = uint8ArrayToBase64(compressed.mtxBytes);
    expect(typeof b64).toBe('string');
    expect(b64.length).toBeGreaterThan(0);

    const restoredBytes = base64ToUint8Array(b64);
    expect(restoredBytes.length).toBe(compressed.mtxBytes.length);

    const decompressed = await decompressFromMtx(restoredBytes);
    expect(decompressed.isLossless).toBe(true);
    expect(decompressed.text).toBe(sampleArabicText);
  });

  it('should losslessly compress and decompress arbitrary texts with emojis and mixed Unicode via Escape Protocol', async () => {
    const complexText = 'رواية المستقبل ٢٠٢٦م: الفارسُ الأندلسيُّ 🚀🌟 [MTX 2.2 Standard: 100% Universal Lossless!] {نهاية}';
    const res = await compressToMtx(complexText, { title: 'مستقبل' });
    expect(res.isLossless).toBe(true);
    expect(res.tokenizationDurationMs).toBeGreaterThanOrEqual(0);

    const decomp = await decompressFromMtx(res.mtxBytes);
    expect(decomp.isLossless).toBe(true);
    expect(decomp.text).toBe(complexText);
    expect(decomp.checksum).toBe(res.checksum);
    expect(decomp.crc32Checksum).toBe(res.crc32Checksum);
  });
});
