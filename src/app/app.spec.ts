import { describe, it, expect } from 'vitest';
import { compressToMtx, decompressFromMtx } from './core/mtx-codec';
import { App } from './app';

describe('MTX Compression & Codec Specs', () => {
  it('should compress and decompress Arabic text with full diacritics losslessly', async () => {
    const sampleText = 'بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ - مَحَطَّةُ التَّرْمِيزِ وَالضَّغْطِ الثُّنَائِيِّ لِلنُّصُوصِ العَرَبِيَّةِ المُشَكَّلَةِ';
    const metadata = {
      title: 'سفر البداية',
      author: 'محرك الترميز',
      chapterTitle: 'الفصل الأول',
      chapterIndex: 1,
      createdAt: new Date().toISOString(),
    };

    const compressed = await compressToMtx(sampleText, metadata);
    expect(compressed.isLossless).toBe(true);
    expect(compressed.compressedBytes).toBeGreaterThan(0);

    const decompressed = await decompressFromMtx(compressed.mtxBytes);
    expect(decompressed.isLossless).toBe(true);
    expect(decompressed.text).toBe(sampleText);
    expect(decompressed.metadata.title).toBe(metadata.title);
  });

  it('should instantiate App component cleanly', () => {
    const app = new App();
    expect(app).toBeDefined();
    expect(app.compressForm).toBeDefined();
  });
});
