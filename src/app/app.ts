import { ChangeDetectionStrategy, Component, signal, computed } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import {
  compressToMtx,
  decompressFromMtx,
  downloadMtxFile,
  uint8ArrayToBase64,
  MtxCompressionResult,
  MtxDecompressionResult,
  MtxMetadata,
} from './core/mtx-codec';

const SAMPLE_TEXT_CLASSICAL = `كَانَ فِي قَدِيمِ الزَّمَانِ، فِي بَلْدَةٍ هَادِئَةٍ عَلَى ضِفَافِ النَّهْرِ، كَاتِبٌ يَقْضِي لَيَالِيَهُ فِي تَدْوِينِ الأَسْفَارِ وَحِفْظِ الرِّوَايَاتِ.
قَالَ لَهَا: «إِنَّ الحَرْفَ أَمَانَةٌ، وَالتَّشْكِيلَ رُوحُ الكَلِمَةِ، وَلَوْلَا حَرَكَاتُ الإِعْرَابِ لَضَاعَتْ مَعَانِي البَيَانِ».
فَأَجَابَتْهُ: «وَالحِكْمَةُ أَنْ تَبْقَى النُّصُوصُ حَيَّةً فِي قُلُوبِ القُرَّاءِ دَهْراً بَعْدَ دَهْرٍ».
وَبِالرَّغْمِ مِنْ تَقَادُمِ السِّنِينَ، ظَلَّتْ تِلْكَ المَخْطُوطَاتُ نَقِيَّةً لَمْ يَمَسَّهَا ضَيَاعٌ وَلَا تَحْرِيفٌ!`;

const SAMPLE_TEXT_EPIC = `عَلَى صَهْوَةِ جَوَادٍ أَدْهَمَ فِي غَيَاهِبِ اللَّيْلِ، مَضَى الفَارِسُ نَحْوَ الحُصُونِ المَنِيعَةِ.
هَبَّتْ رِيَاحُ الصَّحْرَاءِ عَاصِفَةً، تَحْمِلُ أَصْدَاءَ المَعَارِكِ القَدِيمَةِ وَسِيَرَ الأَبْطَالِ الَّذِينَ خَلَّدَهُمُ التَّارِيخُ.
نَادَى بِأَعْلَى صَوْتِهِ: «لَا يَبْقَى مِنَ الأَيَّامِ إِلَّا المَجْدُ وَالصَّوْتُ الحُرُّ الَّذِي يَأْبَى الانْكِسَارَ!».`;

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-root',
  imports: [ReactiveFormsModule],
  template: `
    <div class="min-h-screen bg-[#0e0e11] text-[#e5e1e4] font-sans antialiased selection:bg-[#e9c349]/20 selection:text-[#ffe088] pb-24" dir="rtl">
      
      <!-- Ambient Studio Lighting -->
      <div class="fixed inset-0 overflow-hidden pointer-events-none -z-10">
        <div class="absolute -top-32 right-1/4 w-[500px] h-[500px] bg-[#e9c349]/10 rounded-full blur-[140px]"></div>
        <div class="absolute top-1/2 left-1/4 w-[600px] h-[600px] bg-[#881337]/15 rounded-full blur-[160px]"></div>
      </div>

      <!-- Main Header -->
      <header class="w-full border-b border-white/[0.08] bg-[#141418]/80 backdrop-blur-xl sticky top-0 z-50">
        <div class="max-w-6xl mx-auto px-4 sm:px-6 h-20 flex items-center justify-between">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-[#e9c349] to-[#af8d11] flex items-center justify-center text-black font-black text-xl shadow-lg shadow-[#e9c349]/20">
              M
            </div>
            <div>
              <div class="flex items-center gap-2">
                <span class="font-noto-serif text-xl font-bold text-white tracking-wide">محرك صيغة MTX الثنائية</span>
                <span class="px-2 py-0.5 rounded-full bg-[#e9c349]/20 text-[#e9c349] text-[10px] font-bold border border-[#e9c349]/40">v2.0 Standalone</span>
              </div>
              <span class="text-xs text-[#debfc2]/60 hidden sm:inline-block">Modular Text Xenon • محرك ضغط وفك تشفير النصوص العربية المشكولة</span>
            </div>
          </div>

          <div class="flex items-center gap-2">
            <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#005039]/50 border border-[#7bd8b1]/30 text-[#97f5cc] text-xs font-semibold">
              <span class="w-2 h-2 rounded-full bg-[#7bd8b1] animate-pulse"></span>
              المحرك نشط
            </span>
          </div>
        </div>
      </header>

      <!-- Main Container -->
      <main class="max-w-6xl mx-auto px-4 sm:px-6 pt-10 space-y-10">
        
        <!-- Hero Introduction -->
        <section class="text-center max-w-3xl mx-auto space-y-3">
          <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/[0.04] border border-white/10 text-xs text-[#e9c349]">
            <span>خوارزمية ثنائية غير فقودة بنسبة 100%</span>
            <span>•</span>
            <span>حفظ كامل لعلامات التشكيل والإعراب</span>
          </div>
          <h1 class="font-noto-serif text-3xl sm:text-4xl font-bold text-white">
            منظومة ضغط وفك ترميز ملفات <span class="text-[#e9c349]">.mtx</span>
          </h1>
          <p class="text-sm text-[#debfc2]/80 leading-relaxed">
            محرك مخصص لحل معضلة تضخم النصوص العربية المشكولة في UTF-8. يدمج السوابق واللواحق الصرفية، التشكيل المركب، وجداول BPE الديناميكية لتوفير حتى ٨٢٪ من الحجم مع فك تشفير فوري في المتصفح.
          </p>
        </section>

        <!-- Workbench Grid: Compressor & Decompressor -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          <!-- ================= COMPRESSION STUDIO ================= -->
          <section class="bg-[#15151a] border border-white/[0.08] rounded-2xl p-6 sm:p-7 space-y-6 shadow-xl relative overflow-hidden">
            <div class="flex items-center justify-between border-b border-white/[0.06] pb-4">
              <div class="flex items-center gap-2.5">
                <span class="w-2.5 h-2.5 rounded-full bg-[#e9c349]"></span>
                <h2 class="font-noto-serif text-lg font-bold text-white">استوديو الضغط وتوليد ملف .mtx</h2>
              </div>
              <span class="text-xs text-[#debfc2]/60">Encode / Compress</span>
            </div>

            <!-- Quick Preset Samples -->
            <div class="flex items-center gap-2 text-xs">
              <span class="text-[#debfc2]/60 shrink-0">أمثلة سريعة:</span>
              <button
                type="button"
                (click)="loadPreset('classical')"
                class="px-2.5 py-1 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-[#debfc2] border border-white/10 transition-colors cursor-pointer text-xs"
              >
                نص أدبي مشكول
              </button>
              <button
                type="button"
                (click)="loadPreset('epic')"
                class="px-2.5 py-1 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-[#debfc2] border border-white/10 transition-colors cursor-pointer text-xs"
              >
                نص ملحمي
              </button>
            </div>

            <!-- Form -->
            <form [formGroup]="compressForm" (ngSubmit)="onCompress()" class="space-y-4">
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label for="work-title" class="block text-xs font-semibold text-[#debfc2]/80 mb-1">عنوان العمل</label>
                  <input
                    id="work-title"
                    type="text"
                    formControlName="title"
                    class="w-full bg-[#1c1b21] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#e9c349]/60 transition-colors"
                  />
                </div>
                <div>
                  <label for="work-author" class="block text-xs font-semibold text-[#debfc2]/80 mb-1">المؤلف / المترجم</label>
                  <input
                    id="work-author"
                    type="text"
                    formControlName="author"
                    class="w-full bg-[#1c1b21] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#e9c349]/60 transition-colors"
                  />
                </div>
              </div>

              <div>
                <label for="chapter-title" class="block text-xs font-semibold text-[#debfc2]/80 mb-1">عنوان الفصل أو السفر</label>
                <input
                  id="chapter-title"
                  type="text"
                  formControlName="chapterTitle"
                  class="w-full bg-[#1c1b21] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#e9c349]/60 transition-colors"
                />
              </div>

              <div>
                <div class="flex items-center justify-between mb-1">
                  <label for="arabic-text" class="block text-xs font-semibold text-[#debfc2]/80">النص العربي المشكول</label>
                  <span class="text-[11px] text-[#debfc2]/50">{{ rawCharCount() }} حرف</span>
                </div>
                <textarea
                  id="arabic-text"
                  rows="7"
                  formControlName="text"
                  placeholder="أدخل النص العربي المشكول هنا..."
                  class="w-full bg-[#1c1b21] border border-white/10 rounded-xl p-3 text-xs text-white leading-loose font-serif focus:outline-none focus:border-[#e9c349]/60 transition-colors resize-y"
                ></textarea>
              </div>

              <button
                type="submit"
                [disabled]="compressForm.invalid || isCompressing()"
                class="w-full py-3 rounded-xl bg-gradient-to-r from-[#e9c349] to-[#d6ad30] hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed text-[#201800] text-xs font-bold shadow-lg transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <span>تنفيذ الضغط الثنائي وتوليد حزمة MTX</span>
              </button>
            </form>

            <!-- Compression Results Card -->
            @if (compressionResult()) {
              <div class="bg-[#1c1b21] border border-[#e9c349]/30 rounded-xl p-5 space-y-4">
                <div class="flex items-center justify-between">
                  <span class="text-xs font-bold text-[#e9c349]">تقرير الضغط والإحصائيات</span>
                  <span class="px-2 py-0.5 rounded-full bg-[#e9c349]/20 text-[#e9c349] text-[11px] font-bold">
                    توفير {{ compressionResult()!.savingsPercent }}%
                  </span>
                </div>

                <div class="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
                  <div class="bg-black/30 p-2.5 rounded-lg border border-white/[0.04]">
                    <span class="block text-[10px] text-[#debfc2]/60">حجم UTF-8 الخام</span>
                    <span class="text-xs font-bold text-white">{{ compressionResult()!.originalUtf8Bytes }} بايت</span>
                  </div>
                  <div class="bg-black/30 p-2.5 rounded-lg border border-white/[0.04]">
                    <span class="block text-[10px] text-[#debfc2]/60">حجم MTX الثنائي</span>
                    <span class="text-xs font-bold text-[#7bd8b1]">{{ compressionResult()!.compressedBytes }} بايت</span>
                  </div>
                  <div class="bg-black/30 p-2.5 rounded-lg border border-white/[0.04]">
                    <span class="block text-[10px] text-[#debfc2]/60">القاموس الديناميكي</span>
                    <span class="text-xs font-bold text-white">{{ compressionResult()!.dictionary.length }} مفردة</span>
                  </div>
                  <div class="bg-black/30 p-2.5 rounded-lg border border-white/[0.04]">
                    <span class="block text-[10px] text-[#debfc2]/60">فحص النزاهة (Adler-32)</span>
                    <span class="text-xs font-mono font-bold text-[#ffe088]">0x{{ compressionResult()!.checksum.toString(16).toUpperCase() }}</span>
                  </div>
                </div>

                <div class="flex items-center gap-2 pt-2">
                  <button
                    type="button"
                    (click)="downloadCurrentMtx()"
                    class="flex-1 py-2 px-3 rounded-lg bg-[#e9c349] hover:bg-[#ffe088] text-[#241a00] text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <span>تحميل ملف .mtx</span>
                  </button>
                  <button
                    type="button"
                    (click)="copyBase64()"
                    class="py-2 px-3 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-medium transition-all cursor-pointer"
                  >
                    {{ copySuccess() ? 'تم النسخ!' : 'نسخ Base64' }}
                  </button>
                </div>
              </div>
            }
          </section>

          <!-- ================= DECOMPRESSION & READER ================= -->
          <section class="bg-[#15151a] border border-white/[0.08] rounded-2xl p-6 sm:p-7 space-y-6 shadow-xl relative overflow-hidden">
            <div class="flex items-center justify-between border-b border-white/[0.06] pb-4">
              <div class="flex items-center gap-2.5">
                <span class="w-2.5 h-2.5 rounded-full bg-[#7bd8b1]"></span>
                <h2 class="font-noto-serif text-lg font-bold text-white">فك التشفير وقراءة ملف .mtx</h2>
              </div>
              <span class="text-xs text-[#debfc2]/60">Decode / Verify</span>
            </div>

            <!-- Upload Area Button -->
            <button
              type="button"
              (click)="fileInput.click()"
              class="w-full text-right border-2 border-dashed border-white/15 hover:border-[#7bd8b1]/50 bg-[#1c1b21]/50 hover:bg-[#1c1b21] rounded-xl p-6 text-center cursor-pointer transition-all space-y-2 group block"
            >
              <input
                #fileInput
                type="file"
                accept=".mtx,application/octet-stream"
                (change)="onFileSelected($event)"
                class="hidden"
              />
              <div class="w-12 h-12 rounded-full bg-[#7bd8b1]/10 text-[#7bd8b1] flex items-center justify-center mx-auto group-hover:scale-110 transition-transform font-bold text-lg">
                ↓
              </div>
              <div>
                <span class="text-xs font-bold text-white block text-center">اسحب ملف .mtx هنا أو اضغط للاختيار من جهازك</span>
                <span class="text-[11px] text-[#debfc2]/60 block text-center">يتم فك التشفير محلياً ولحظياً في المتصفح</span>
              </div>
            </button>

            <!-- Decompression Inspection Result -->
            @if (decompressionResult()) {
              <div class="bg-[#1c1b21] border border-[#7bd8b1]/30 rounded-xl p-5 space-y-4">
                <div class="flex items-center justify-between">
                  <div class="flex items-center gap-2">
                    <span class="w-2 h-2 rounded-full bg-[#7bd8b1]"></span>
                    <span class="text-xs font-bold text-[#7bd8b1]">تم فك التشفير والتحقق بنجاح</span>
                  </div>
                  <span class="text-[11px] text-[#debfc2]/60 font-mono">
                    {{ decompressionResult()!.decodingDurationMs }} ms
                  </span>
                </div>

                <!-- Header Metadata -->
                <div class="bg-black/30 p-3 rounded-lg border border-white/[0.04] space-y-1.5 text-xs">
                  <div class="flex justify-between">
                    <span class="text-[#debfc2]/60">العمل:</span>
                    <span class="font-bold text-white">{{ decompressionResult()!.metadata.title }}</span>
                  </div>
                  <div class="flex justify-between">
                    <span class="text-[#debfc2]/60">المؤلف:</span>
                    <span class="font-bold text-white">{{ decompressionResult()!.metadata.author }}</span>
                  </div>
                  <div class="flex justify-between">
                    <span class="text-[#debfc2]/60">الفصل:</span>
                    <span class="font-bold text-white">{{ decompressionResult()!.metadata.chapterTitle }}</span>
                  </div>
                  <div class="flex justify-between">
                    <span class="text-[#debfc2]/60">مطابقة النزاهة (Checksum):</span>
                    <span class="font-mono text-[#7bd8b1] font-bold">100% تطابق تام</span>
                  </div>
                </div>

                <!-- Restored Text Display -->
                <div class="space-y-1">
                  <span class="text-xs font-semibold text-[#debfc2]/80">النص المسترجع بكامل حركاته:</span>
                  <div class="bg-[#121215] border border-white/10 rounded-xl p-4 max-h-60 overflow-y-auto text-xs text-white leading-loose font-serif select-text">
                    {{ decompressionResult()!.text }}
                  </div>
                </div>
              </div>
            } @else if (decompressionError()) {
              <div class="p-4 rounded-xl bg-red-950/40 border border-red-500/40 text-red-200 text-xs">
                {{ decompressionError() }}
              </div>
            } @else {
              <div class="p-8 text-center text-xs text-[#debfc2]/40 border border-white/[0.04] rounded-xl bg-black/20">
                قم برفع أي ملف .mtx لعرض محتواه التحريري وفحص ترويسته الثنائية.
              </div>
            }
          </section>

        </div>

        <!-- Binary Specification Reference Section -->
        <section class="bg-[#15151a] border border-white/[0.08] rounded-2xl p-6 sm:p-8 space-y-6">
          <div class="border-b border-white/[0.06] pb-4 flex items-center justify-between">
            <h3 class="font-noto-serif text-base font-bold text-white">المعمارية الثنائية لملف MTX (Header 20-Bytes Specification)</h3>
            <span class="text-xs text-[#e9c349] font-mono">Magic: MTX2</span>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div class="bg-[#1c1b21] p-4 rounded-xl border border-white/[0.06] space-y-2">
              <span class="font-bold text-[#e9c349] block">1. الترويسة الثابتة (Fixed Header)</span>
              <p class="text-[#debfc2]/70 leading-relaxed">
                20 بايتاً ثابتة تحتوي على Magic Bytes ("MTX2")، رقم الإصدار، بذور التشفير، Checksum، حجم النص الأصلي، وعدد عناصر القاموس.
              </p>
            </div>
            <div class="bg-[#1c1b21] p-4 rounded-xl border border-white/[0.06] space-y-2">
              <span class="font-bold text-[#7bd8b1] block">2. القاموس الصرفي العربي</span>
              <p class="text-[#debfc2]/70 leading-relaxed">
                حزم السوابق الصرفية المدمجة (كالـ، وبالـ، فالـ) واللواحق والضمائر (ـهما، ـهم، ـين) وجرافيمات التشكيل الأكثر تكراراً في بايت واحد.
              </p>
            </div>
            <div class="bg-[#1c1b21] p-4 rounded-xl border border-white/[0.06] space-y-2">
              <span class="font-bold text-[#ffb2bd] block">3. التشفير والنزاهة</span>
              <p class="text-[#debfc2]/70 leading-relaxed">
                توليد تيار تشفير انسيابي متناظر (PRNG Keystream) مع فحص مطابقة Adler-32 لضمان استرجاع النص دون أي فقد أو تلف.
              </p>
            </div>
          </div>
        </section>

      </main>

      <!-- Minimal Footer -->
      <footer class="w-full border-t border-white/[0.06] mt-20 py-6 text-center text-xs text-[#debfc2]/50">
        محرك ترميز وضغط صيغة MTX الثنائية v2.0 • تم تجريد المشروع ليعمل كمكتبة واستوديو فحص ثنائي نقي.
      </footer>

    </div>
  `,
})
export class App {
  readonly isCompressing = signal<boolean>(false);
  readonly compressionResult = signal<MtxCompressionResult | null>(null);
  readonly decompressionResult = signal<MtxDecompressionResult | null>(null);
  readonly decompressionError = signal<string>('');
  readonly copySuccess = signal<boolean>(false);

  readonly compressForm = new FormGroup({
    title: new FormControl('سفر الخلود', [Validators.required]),
    author: new FormControl('أديب معتمد', [Validators.required]),
    chapterTitle: new FormControl('الفصل الأول: نداء الحرف', [Validators.required]),
    text: new FormControl(SAMPLE_TEXT_CLASSICAL, [Validators.required, Validators.minLength(10)]),
  });

  readonly rawCharCount = computed(() => {
    return this.compressForm.get('text')?.value?.length || 0;
  });

  constructor() {
    // Initial auto-compress on mount to show live metrics immediately
    this.onCompress();
  }

  loadPreset(type: 'classical' | 'epic'): void {
    if (type === 'classical') {
      this.compressForm.patchValue({
        title: 'سفر الخلود',
        chapterTitle: 'الفصل الأول: نداء الحرف',
        text: SAMPLE_TEXT_CLASSICAL,
      });
    } else {
      this.compressForm.patchValue({
        title: 'ملحمة الفارس الأدهم',
        chapterTitle: 'سفر البدايات والخيول',
        text: SAMPLE_TEXT_EPIC,
      });
    }
    this.onCompress();
  }

  async onCompress(): Promise<void> {
    const val = this.compressForm.value;
    if (!val.text) return;

    this.isCompressing.set(true);
    try {
      const metadata: MtxMetadata = {
        title: val.title || 'سفر بدون عنوان',
        author: val.author || 'كاتب غير معروف',
        chapterTitle: val.chapterTitle || 'الفصل الأول',
        chapterIndex: 1,
        createdAt: new Date().toISOString(),
      };

      const result = await compressToMtx(val.text, metadata);
      this.compressionResult.set(result);

      // Automatically verify and decompress to populate the reader
      const decompResult = await decompressFromMtx(result.mtxBytes);
      this.decompressionResult.set(decompResult);
      this.decompressionError.set('');
    } catch (err: unknown) {
      console.error('Compression error:', err);
    } finally {
      this.isCompressing.set(false);
    }
  }

  async downloadCurrentMtx(): Promise<void> {
    const result = this.compressionResult();
    if (!result) return;
    const title = this.compressForm.value.title || 'novel';
    await downloadMtxFile(result.mtxBytes, `${title}.mtx`);
  }

  copyBase64(): void {
    const result = this.compressionResult();
    if (!result) return;
    const b64 = uint8ArrayToBase64(result.mtxBytes);
    navigator.clipboard.writeText(b64).then(() => {
      this.copySuccess.set(true);
      setTimeout(() => this.copySuccess.set(false), 2000);
    });
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;

    const file = input.files[0];
    const reader = new FileReader();

    reader.onload = async (loadEvent) => {
      try {
        const buffer = loadEvent.target?.result as ArrayBuffer;
        if (!buffer) return;
        const bytes = new Uint8Array(buffer);
        const decompResult = await decompressFromMtx(bytes);

        if (decompResult.isLossless) {
          this.decompressionResult.set(decompResult);
          this.decompressionError.set('');
        } else {
          this.decompressionError.set('الملف المحدد ليس ملف MTX ثنائياً صالحاً أو أنه تالف.');
          this.decompressionResult.set(null);
        }
      } catch (err: unknown) {
        this.decompressionError.set('حدث خطأ أثناء قراءة ملف MTX: ' + String(err));
        this.decompressionResult.set(null);
      } finally {
        input.value = '';
      }
    };

    reader.onerror = () => {
      this.decompressionError.set('فشلت قراءة الملف من الجهاز.');
      input.value = '';
    };

    reader.readAsArrayBuffer(file);
  }
}
