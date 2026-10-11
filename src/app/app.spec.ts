import { describe, it, expect } from 'vitest';
import { compressToMtx, decompressFromMtx } from './core/mtx-codec';
import { AUDIT_AGREEMENT_THRESHOLD } from './core/novel-store';

describe('MTX Compression & Core Platform Specs', () => {
  it('should compress and decompress Arabic text with full diacritics losslessly', async () => {
    const sampleText = 'بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ - أَرْوِقَةُ الْخُلُودِ لِلْقِرَاءَةِ وَالنَّشْرِ الذَّكِيِّ';
    const metadata = {
      title: 'سفر الخلود',
      author: 'كاتب الأروقة',
      chapterTitle: 'الفصل الأول',
      chapterIndex: 1,
    };

    const compressed = await compressToMtx(sampleText, metadata);
    expect(compressed.isLossless).toBe(true);
    expect(compressed.compressedBytes).toBeGreaterThan(0);

    const decompressed = await decompressFromMtx(compressed.mtxBytes);
    expect(decompressed.text).toBe(sampleText);
    expect(decompressed.metadata.title).toBe(metadata.title);
  });

  it('should have standard audit agreement threshold configured to 2', () => {
    expect(AUDIT_AGREEMENT_THRESHOLD).toBe(2);
  });
});
