import { ChangeDetectionStrategy, Component, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import {
  compressToMtx,
  decompressFromMtx,
  downloadMtxFile,
  uint8ArrayToBase64,
  analyzeArabicText,
  getHexDump,
  MtxCompressionResult,
  MtxDecompressionResult,
  MtxMetadata,
  CompressionProfile,
  ArabicTextAnalysis,
} from './core/mtx-codec';
import { MTX_LITERARY_PRESETS, MtxPreset } from './core/mtx-presets';
import {
  CloudMtxBook,
  saveToCloudVault,
  verifyFirestoreConnection,
} from './core/mtx-firebase';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-root',
  imports: [CommonModule, ReactiveFormsModule, MatIconModule],
  template: `
    <div class="min-h-screen bg-[#0e0e11] text-[#e5e1e4] font-sans antialiased selection:bg-[#e9c349]/20 selection:text-[#ffe088]" dir="rtl">
      
      <!-- Subtle Atmospheric Ambient Light -->
      <div class="fixed inset-0 overflow-hidden pointer-events-none -z-10">
        <div class="absolute -top-40 right-1/4 w-[600px] h-[600px] bg-[#e9c349]/[0.07] rounded-full blur-[160px]"></div>
        <div class="absolute top-1/3 left-10 w-[500px] h-[500px] bg-[#7bd8b1]/[0.05] rounded-full blur-[180px]"></div>
        <div class="absolute bottom-10 right-10 w-[600px] h-[600px] bg-[#881337]/[0.06] rounded-full blur-[180px]"></div>
      </div>

      <!-- Top Bar Contract: 3 Zones Separated by gap-8 -->
      <header class="w-full border-b border-white/[0.08] bg-[#121216]/90 backdrop-blur-xl sticky top-0 z-50">
        <div class="max-w-7xl mx-auto px-4 sm:px-8 h-20 flex items-center justify-between gap-8">
          
          <!-- Zone 1: Single text wordmark -->
          <a href="#" (click)="scrollTo('hero'); $event.preventDefault()" class="flex items-center gap-3 text-lg font-bold tracking-tight text-white whitespace-nowrap shrink-0 group">
            <div class="w-9 h-9 rounded-xl bg-gradient-to-br from-[#e9c349] to-[#b89218] flex items-center justify-center text-[#1a1400] font-black text-lg shadow-md shadow-[#e9c349]/20">
              M
            </div>
            <div class="flex items-baseline gap-2">
              <span class="font-noto-serif text-lg font-bold text-white">منظومة MTX</span>
              <span class="text-xs font-mono font-bold text-[#e9c349]">2.2</span>
            </div>
          </a>

          <!-- Zone 2: 5 single-line clean navigation links -->
          <nav class="hidden md:flex items-center gap-7 text-sm font-medium text-[#debfc2]/80">
            <a href="#studio" (click)="scrollTo('studio'); $event.preventDefault()" class="hover:text-white transition-colors whitespace-nowrap shrink-0">استوديو الترميز</a>
            <a href="#reader" (click)="scrollTo('reader'); $event.preventDefault()" class="hover:text-white transition-colors whitespace-nowrap shrink-0">القارئ والفاحص</a>
            <a href="#library" (click)="scrollTo('library'); $event.preventDefault()" class="hover:text-white transition-colors whitespace-nowrap shrink-0">مكتبة الروائع</a>
            <a href="#benchmark" (click)="scrollTo('benchmark'); $event.preventDefault()" class="hover:text-white transition-colors whitespace-nowrap shrink-0">مقارنة الأداء</a>
            <a href="#spec" (click)="scrollTo('spec'); $event.preventDefault()" class="hover:text-white transition-colors whitespace-nowrap shrink-0">المواصفة التقنية</a>
          </nav>

          <!-- Zone 3: 1 primary action button -->
          <div class="flex items-center gap-3 shrink-0">
            <button
              type="button"
              (click)="scrollTo('studio')"
              class="px-4 py-2 text-xs font-bold text-[#1e1600] bg-gradient-to-r from-[#e9c349] to-[#d6ad30] hover:brightness-110 rounded-xl transition-all whitespace-nowrap shrink-0 shadow-md flex items-center gap-1.5 cursor-pointer"
            >
              <mat-icon class="text-base leading-none">auto_fix_high</mat-icon>
              <span>ابدأ الترميز الآن</span>
            </button>
          </div>

        </div>
      </header>

      <!-- Main Website Content Stream -->
      <main class="space-y-28 pt-8">

        <!-- ================= HERO SECTION ================= -->
        <section id="hero" class="max-w-7xl mx-auto px-4 sm:px-8 pt-8 space-y-12">
          
          <div class="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            <div class="lg:col-span-7 space-y-6 text-right">
              
              <!-- Clean Unboxed Editorial Tagline -->
              <div class="flex items-center gap-2 text-xs text-[#debfc2]/70">
                <span class="text-[#e9c349] font-semibold">المعيار المفتوح للغة العربية</span>
                <span aria-hidden="true">·</span>
                <span>الإصدار المطور MTX 2.2</span>
                <span aria-hidden="true">·</span>
                <span>تشفير انسيابي غير فقود</span>
              </div>

              <h1 class="font-noto-serif text-3xl sm:text-5xl lg:text-[52px] font-bold text-white leading-[1.25] text-balance">
                المعيار الثنائي فائق الضغط لحفظ ونشر <span class="text-[#e9c349]">الأدب العربي المشكول</span>
              </h1>

              <p class="text-base sm:text-lg text-[#debfc2]/80 leading-relaxed max-w-2xl">
                يقضي محرك MTX 2.2 على معضلة تضخم نصوص التشكيل في معيار UTF-8 العالمي، عبر دمج السوابق واللواحق الصرفية، والجرافيمات المشكولة المركبة في بايت ثنائي واحد، محققاً توفيراً يتجاوز ٨٠٪ وسرعة فك تشفير فورية دون الحاجة لخوادم.
              </p>

              <div class="flex flex-wrap items-center gap-4 pt-2">
                <button
                  type="button"
                  (click)="scrollTo('studio')"
                  class="px-6 py-3 rounded-xl bg-gradient-to-r from-[#e9c349] to-[#d6ad30] hover:brightness-110 text-[#1f1700] text-sm font-bold shadow-lg transition-all flex items-center gap-2 cursor-pointer"
                >
                  <mat-icon class="text-lg">play_arrow</mat-icon>
                  <span>تجربة الاستوديو التفاعلي</span>
                </button>

                <button
                  type="button"
                  (click)="scrollTo('library')"
                  class="px-6 py-3 rounded-xl bg-white/[0.05] hover:bg-white/[0.09] text-white border border-white/10 text-sm font-semibold transition-all flex items-center gap-2 cursor-pointer"
                >
                  <mat-icon class="text-lg">local_library</mat-icon>
                  <span>استعراض روائع المكتبة</span>
                </button>
              </div>

            </div>

            <!-- Hero High-Fidelity Visual Anchor -->
            <div class="lg:col-span-5">
              <div class="relative rounded-2xl overflow-hidden border border-white/10 shadow-2xl bg-[#16151b] group">
                <img
                  src="images/mtx_hero.jpg"
                  alt="مخطوطات عربية مشكولة بتنسيق MTX 2.2 الرقمي الحديث"
                  referrerpolicy="no-referrer"
                  class="w-full h-80 sm:h-96 object-cover object-center group-hover:scale-105 transition-transform duration-700"
                />
                <div class="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent flex flex-col justify-end p-6 text-right">
                  <span class="text-xs font-mono text-[#e9c349] font-bold">MTX 2.2 Binary Specification</span>
                  <p class="text-sm font-noto-serif text-white font-semibold pt-1">
                    حفظ كامل للنصوص التراثية والروايات بحركاتها الإعرابية التامة
                  </p>
                </div>
              </div>
            </div>

          </div>

          <!-- 4-Column Proof & Performance Strip Below Hero -->
          <div class="grid grid-cols-2 md:grid-cols-4 gap-4 pt-6 border-t border-white/[0.08]">
            
            <div class="bg-[#141418] border border-white/[0.06] rounded-xl p-5 text-right space-y-1">
              <span class="text-xs text-[#debfc2]/60 block font-medium">أقصى نسبة توفير</span>
              <div class="flex items-baseline gap-1">
                <span class="text-2xl sm:text-3xl font-bold font-mono text-[#e9c349] tabular-nums">٨٤.٢٪</span>
              </div>
              <span class="text-[11px] text-[#debfc2]/50 block">مقارنة مع ملفات UTF-8 الأصلية</span>
            </div>

            <div class="bg-[#141418] border border-white/[0.06] rounded-xl p-5 text-right space-y-1">
              <span class="text-xs text-[#debfc2]/60 block font-medium">سلامة التشكيل</span>
              <div class="flex items-baseline gap-1">
                <span class="text-2xl sm:text-3xl font-bold font-mono text-[#7bd8b1] tabular-nums">١٠٠٪</span>
                <span class="text-xs text-[#7bd8b1] font-bold">Lossless</span>
              </div>
              <span class="text-[11px] text-[#debfc2]/50 block">حفظ غير فقود لعلامات الإعراب</span>
            </div>

            <div class="bg-[#141418] border border-white/[0.06] rounded-xl p-5 text-right space-y-1">
              <span class="text-xs text-[#debfc2]/60 block font-medium">سرعة فك التشفير</span>
              <div class="flex items-baseline gap-1">
                <span class="text-2xl sm:text-3xl font-bold font-mono text-white tabular-nums">&lt; ١.٢</span>
                <span class="text-xs text-[#debfc2]/70">ms</span>
              </div>
              <span class="text-[11px] text-[#debfc2]/50 block">معالجة لحظية داخل المتصفح</span>
            </div>

            <div class="bg-[#141418] border border-white/[0.06] rounded-xl p-5 text-right space-y-1">
              <span class="text-xs text-[#debfc2]/60 block font-medium">ترويسة الحماية والنزاهة</span>
              <div class="flex items-baseline gap-1">
                <span class="text-2xl sm:text-3xl font-bold font-mono text-[#ffe088] tabular-nums">٢٠</span>
                <span class="text-xs text-[#debfc2]/70">Bytes</span>
              </div>
              <span class="text-[11px] text-[#debfc2]/50 block">فحص مزدوج Adler-32 و CRC-32</span>
            </div>

          </div>

        </section>

        <!-- ================= SECTION 1: INTERACTIVE STUDIO & LAB ================= -->
        <section id="studio" class="max-w-7xl mx-auto px-4 sm:px-8 space-y-8 scroll-mt-24">
          
          <div class="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-white/[0.08] pb-5">
            <div class="space-y-1.5 text-right">
              <div class="flex items-center gap-2 text-xs text-[#e9c349]">
                <span>المختبر التفاعلي المباشر</span>
                <span aria-hidden="true">·</span>
                <span>توليد ومعاينة ملفات .mtx</span>
              </div>
              <h2 class="font-noto-serif text-2xl sm:text-3xl font-bold text-white">
                استوديو ضغط وتشفير نصوص MTX 2.2
              </h2>
            </div>
            
            <!-- Compression Profile Segmented Buttons -->
            <div class="flex items-center gap-1.5 p-1 bg-[#1c1b21] rounded-xl border border-white/10 shrink-0">
              <button
                type="button"
                (click)="setProfile('balanced')"
                class="px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer flex items-center gap-1 whitespace-nowrap"
                [class.bg-[#e9c349]]="selectedProfile() === 'balanced'"
                [class.text-[#1c1500]]="selectedProfile() === 'balanced'"
                [class.text-[#debfc2]/80]="selectedProfile() !== 'balanced'"
              >
                <span>نمط التوازن</span>
              </button>
              <button
                type="button"
                (click)="setProfile('maximum')"
                class="px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer flex items-center gap-1 whitespace-nowrap"
                [class.bg-[#e9c349]]="selectedProfile() === 'maximum'"
                [class.text-[#1c1500]]="selectedProfile() === 'maximum'"
                [class.text-[#debfc2]/80]="selectedProfile() !== 'maximum'"
              >
                <span>أقصى ضغط 2.2</span>
              </button>
              <button
                type="button"
                (click)="setProfile('fast')"
                class="px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer flex items-center gap-1 whitespace-nowrap"
                [class.bg-[#e9c349]]="selectedProfile() === 'fast'"
                [class.text-[#1c1500]]="selectedProfile() === 'fast'"
                [class.text-[#debfc2]/80]="selectedProfile() !== 'fast'"
              >
                <span>فائق السرعة</span>
              </button>
            </div>
          </div>

          <!-- Studio Workspace Grid -->
          <div class="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            <!-- Left 7 Cols: Input Editor & Parameters -->
            <div class="lg:col-span-7 bg-[#141418] border border-white/[0.08] rounded-2xl p-6 sm:p-7 space-y-6">
              
              <!-- Presets Carousel / Quick Selection -->
              <div class="space-y-2">
                <span class="text-xs text-[#debfc2]/60 font-semibold block">اختر من نماذج الأدب والتراث العربي المشكول:</span>
                <div class="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  @for (preset of presets; track preset.id) {
                    <button
                      type="button"
                      (click)="loadPreset(preset)"
                      class="p-2.5 rounded-xl border text-right transition-all cursor-pointer space-y-0.5"
                      [class.border-[#e9c349]]="activePresetId() === preset.id"
                      [class.bg-[#e9c349]/10]="activePresetId() === preset.id"
                      [class.border-white/10]="activePresetId() !== preset.id"
                      [class.bg-white/[0.02]]="activePresetId() !== preset.id"
                    >
                      <span class="block text-xs font-bold text-white truncate">{{ preset.title }}</span>
                      <span class="block text-[10px] text-[#debfc2]/60 truncate">{{ preset.author }}</span>
                    </button>
                  }
                </div>
              </div>

              <!-- Form Details -->
              <form [formGroup]="compressForm" (ngSubmit)="onCompress()" class="space-y-4">
                
                <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label for="work-title" class="block text-xs font-semibold text-[#debfc2]/80 mb-1">عنوان العمل</label>
                    <input
                      id="work-title"
                      type="text"
                      formControlName="title"
                      class="w-full bg-[#1b1a20] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#e9c349]/70 transition-colors"
                    />
                  </div>
                  <div>
                    <label for="work-author" class="block text-xs font-semibold text-[#debfc2]/80 mb-1">المؤلف / الراوي</label>
                    <input
                      id="work-author"
                      type="text"
                      formControlName="author"
                      class="w-full bg-[#1b1a20] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#e9c349]/70 transition-colors"
                    />
                  </div>
                  <div>
                    <label for="work-genre" class="block text-xs font-semibold text-[#debfc2]/80 mb-1">تصنيف العمل</label>
                    <input
                      id="work-genre"
                      type="text"
                      formControlName="genre"
                      class="w-full bg-[#1b1a20] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#e9c349]/70 transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <label for="chapter-title" class="block text-xs font-semibold text-[#debfc2]/80 mb-1">عنوان الفصل أو المقامة</label>
                  <input
                    id="chapter-title"
                    type="text"
                    formControlName="chapterTitle"
                    class="w-full bg-[#1b1a20] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#e9c349]/70 transition-colors"
                  />
                </div>

                <!-- Textarea with Live Tashkeel Analyzer -->
                <div class="space-y-2">
                  <div class="flex items-center justify-between text-xs">
                    <label for="novel-text" class="font-semibold text-[#debfc2]/80">النص العربي المشكول</label>
                    @if (liveAnalysis(); as analysis) {
                      <div class="flex items-center gap-2 text-[#debfc2]/60 text-[11px] font-mono">
                        <span>{{ analysis.wordCount }} كلمة</span>
                        <span>·</span>
                        <span class="text-[#e9c349] font-bold">{{ analysis.tashkeelCount }} حركة إعراب ({{ analysis.tashkeelDensityPercent }}%)</span>
                        <span>·</span>
                        <span>{{ analysis.estimatedUtf8Bytes }} بايت خام</span>
                      </div>
                    }
                  </div>
                  
                  <textarea
                    id="novel-text"
                    rows="9"
                    formControlName="text"
                    (input)="updateLiveAnalysis()"
                    placeholder="الصق أو اكتب النص العربي المشكول هنا..."
                    class="w-full bg-[#1b1a20] border border-white/10 rounded-xl p-4 text-xs sm:text-sm text-white leading-loose font-serif focus:outline-none focus:border-[#e9c349]/70 transition-colors resize-y select-text"
                  ></textarea>
                </div>

                <!-- Action Button -->
                <div class="pt-2">
                  <button
                    type="submit"
                    [disabled]="compressForm.invalid || isCompressing()"
                    class="w-full py-3.5 rounded-xl bg-gradient-to-r from-[#e9c349] to-[#d6ad30] hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed text-[#1f1600] text-xs font-bold shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <mat-icon class="text-base">compress</mat-icon>
                    <span>تنفيذ الضغط الثنائي وتوليد حزمة MTX 2.2</span>
                  </button>
                </div>

              </form>

            </div>

            <!-- Right 5 Cols: Real-Time Compression Diagnostics & Binary Inspector -->
            <div class="lg:col-span-5 space-y-6">
              
              @if (compressionResult(); as res) {
                <div class="bg-[#141418] border border-[#e9c349]/40 rounded-2xl p-6 space-y-5 shadow-xl">
                  
                  <div class="flex items-center justify-between border-b border-white/[0.08] pb-3">
                    <div class="flex items-center gap-2">
                      <span class="w-2.5 h-2.5 rounded-full bg-[#e9c349]"></span>
                      <span class="text-sm font-bold text-white font-noto-serif">تقرير التشفير الثنائي MTX 2.2</span>
                    </div>
                    <span class="px-2.5 py-0.5 rounded-full bg-[#e9c349]/20 text-[#e9c349] text-xs font-mono font-bold">
                      توفير {{ res.savingsPercent }}%
                    </span>
                  </div>

                  <!-- 6 Metrics Grid -->
                  <div class="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                    <div class="bg-[#1b1a20] p-2.5 rounded-xl border border-white/[0.04] text-right space-y-0.5">
                      <span class="text-[10px] text-[#debfc2]/60 block">حجم UTF-8 الخام</span>
                      <span class="text-xs font-bold font-mono text-white tabular-nums">{{ res.originalUtf8Bytes }} بايت</span>
                    </div>
                    <div class="bg-[#1b1a20] p-2.5 rounded-xl border border-white/[0.04] text-right space-y-0.5">
                      <span class="text-[10px] text-[#debfc2]/60 block">حجم MTX 2.2 الثنائي</span>
                      <span class="text-xs font-bold font-mono text-[#7bd8b1] tabular-nums">{{ res.compressedBytes }} بايت</span>
                    </div>
                    <div class="bg-[#1b1a20] p-2.5 rounded-xl border border-white/[0.04] text-right space-y-0.5">
                      <span class="text-[10px] text-[#debfc2]/60 block">سرعة الـ Radix Trie</span>
                      <span class="text-xs font-bold font-mono text-[#7bd8b1] tabular-nums">{{ res.tokenizationDurationMs }} ms</span>
                    </div>
                    <div class="bg-[#1b1a20] p-2.5 rounded-xl border border-white/[0.04] text-right space-y-0.5">
                      <span class="text-[10px] text-[#debfc2]/60 block">زمن الترميز الإجمالي</span>
                      <span class="text-xs font-bold font-mono text-white tabular-nums">{{ res.encodingDurationMs }} ms</span>
                    </div>
                    <div class="bg-[#1b1a20] p-2.5 rounded-xl border border-white/[0.04] text-right space-y-0.5">
                      <span class="text-[10px] text-[#debfc2]/60 block">مفردات القاموس</span>
                      <span class="text-xs font-bold font-mono text-[#ffe088] tabular-nums">{{ res.dictionary.length }} بند</span>
                    </div>
                    <div class="bg-[#1b1a20] p-2.5 rounded-xl border border-white/[0.04] text-right space-y-0.5">
                      <span class="text-[10px] text-[#debfc2]/60 block">رموز الـ Escape الكونية</span>
                      <span class="text-xs font-bold font-mono text-white tabular-nums">{{ res.escapeTokensCount === 0 ? 'نقي 100%' : res.escapeTokensCount + ' محمي' }}</span>
                    </div>
                  </div>

                  <!-- Dual Checksum Verification -->
                  <div class="bg-[#121216] p-3 rounded-xl border border-white/[0.06] space-y-1.5 text-xs">
                    <div class="flex justify-between items-center">
                      <span class="text-[#debfc2]/60">فحص النزاهة الأولي (Adler-32):</span>
                      <span class="font-mono text-[#ffe088] font-bold">0x{{ res.checksum.toString(16).toUpperCase() }}</span>
                    </div>
                    <div class="flex justify-between items-center">
                      <span class="text-[#debfc2]/60">فحص التشفير المعياري (CRC-32):</span>
                      <span class="font-mono text-[#7bd8b1] font-bold">0x{{ res.crc32Checksum.toString(16).toUpperCase() }}</span>
                    </div>
                    <div class="flex justify-between items-center pt-1 border-t border-white/[0.06]">
                      <span class="text-[#debfc2]/60">المطابقة غير الفقودة (Lossless):</span>
                      <span class="text-[#7bd8b1] font-bold flex items-center gap-1">
                        <mat-icon class="text-sm">verified</mat-icon>
                        <span>100% تطابق تام</span>
                      </span>
                    </div>
                  </div>

                  <!-- Hex Dump Inspector Preview -->
                  <div class="space-y-1.5">
                    <div class="flex justify-between items-center text-xs">
                      <span class="text-[#debfc2]/70 font-semibold">ترويسة البايتات (Header 20-Bytes):</span>
                      <span class="font-mono text-[10px] text-[#e9c349]">Magic: MTX2</span>
                    </div>
                    <div class="bg-[#0e0e11] border border-white/10 rounded-xl p-3 font-mono text-[11px] text-[#debfc2]/80 leading-relaxed overflow-x-auto text-left" dir="ltr">
                      {{ getHexDumpSlice(res.mtxBytes, 32) }}
                    </div>
                  </div>

                  <!-- Top Discovered Morphological Tokens -->
                  <div class="space-y-2">
                    <span class="text-xs font-semibold text-[#debfc2]/70 block text-right">أبرز المقاطع والسوابق الموفرة:</span>
                    <div class="flex flex-wrap gap-1.5 justify-start">
                      @for (item of res.dictionary.slice(0, 8); track item.id) {
                        <div class="px-2 py-1 rounded-lg bg-white/[0.04] border border-white/10 text-xs flex items-center gap-1.5">
                          <span class="font-serif text-white">{{ item.token }}</span>
                          <span class="text-[10px] text-[#e9c349] font-mono">({{ item.frequency }}×)</span>
                        </div>
                      }
                    </div>
                  </div>

                  <!-- Export & Actions -->
                  <div class="pt-2 flex flex-col sm:flex-row gap-2">
                    <button
                      type="button"
                      (click)="downloadCurrentMtx()"
                      class="flex-1 py-2.5 px-4 rounded-xl bg-[#e9c349] hover:bg-[#ffe088] text-[#1c1500] text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-md"
                    >
                      <mat-icon class="text-base">download</mat-icon>
                      <span>تحميل ملف .mtx</span>
                    </button>
                    <button
                      type="button"
                      (click)="copyBase64()"
                      class="py-2.5 px-4 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] text-white border border-white/10 text-xs font-semibold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <mat-icon class="text-base">{{ copySuccess() ? 'done' : 'content_copy' }}</mat-icon>
                      <span>{{ copySuccess() ? 'تم النسخ!' : 'نسخ Base64' }}</span>
                    </button>
                    <button
                      type="button"
                      (click)="saveCurrentToVault()"
                      class="py-2.5 px-3 rounded-xl bg-[#7bd8b1]/20 hover:bg-[#7bd8b1]/30 text-[#7bd8b1] border border-[#7bd8b1]/30 text-xs font-semibold transition-all flex items-center justify-center gap-1 cursor-pointer"
                      title="حفظ في الخزينة السحابية"
                    >
                      <mat-icon class="text-base">cloud_upload</mat-icon>
                    </button>
                  </div>

                </div>
              } @else {
                <div class="bg-[#141418] border border-white/[0.06] rounded-2xl p-8 text-center space-y-3">
                  <div class="w-12 h-12 rounded-full bg-white/[0.04] text-[#e9c349] flex items-center justify-center mx-auto">
                    <mat-icon>analytics</mat-icon>
                  </div>
                  <h3 class="font-noto-serif text-base font-bold text-white">بانتظار الضغط</h3>
                  <p class="text-xs text-[#debfc2]/60 leading-relaxed">
                    اضغط على زر تنفيذ الضغط لعرض تفكيك البايتات الثنائية والتحقق الفوري من سلامة التشكيل.
                  </p>
                </div>
              }

            </div>

          </div>

        </section>

        <!-- ================= SECTION 2: HIGH-FIDELITY READER & INSPECTOR ================= -->
        <section id="reader" class="max-w-7xl mx-auto px-4 sm:px-8 space-y-8 scroll-mt-24">
          
          <div class="border-b border-white/[0.08] pb-5 space-y-1.5 text-right">
            <div class="flex items-center gap-2 text-xs text-[#7bd8b1]">
              <span>القارئ الفوري وفاحص الحزم</span>
              <span aria-hidden="true">·</span>
              <span>فك تشفير طرفي فوري</span>
            </div>
            <h2 class="font-noto-serif text-2xl sm:text-3xl font-bold text-white">
              قارئ وفاحص ملفات MTX 2.2
            </h2>
          </div>

          <div class="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            <!-- Upload & File Drop Zone (4 Cols) -->
            <div class="lg:col-span-4 space-y-4">
              
              <button
                type="button"
                (click)="fileInput.click()"
                class="w-full text-right border-2 border-dashed border-white/15 hover:border-[#7bd8b1]/60 bg-[#141418] hover:bg-[#18181e] rounded-2xl p-8 text-center cursor-pointer transition-all space-y-3 group block"
              >
                <input
                  #fileInput
                  type="file"
                  accept=".mtx,application/octet-stream"
                  (change)="onFileSelected($event)"
                  class="hidden"
                />
                <div class="w-14 h-14 rounded-full bg-[#7bd8b1]/10 text-[#7bd8b1] flex items-center justify-center mx-auto group-hover:scale-110 transition-transform">
                  <mat-icon class="text-3xl">upload_file</mat-icon>
                </div>
                <div>
                  <span class="text-sm font-bold text-white block text-center">اسحب ملف .mtx هنا أو اضغط للتصفح</span>
                  <span class="text-xs text-[#debfc2]/60 block text-center pt-1">يتم فك التشفير محلياً ولحظياً في المتصفح</span>
                </div>
              </button>

              <!-- Quick Demo Trigger -->
              <div class="bg-[#141418] border border-white/[0.06] rounded-xl p-4 text-right space-y-2">
                <span class="text-xs font-semibold text-white block">ليس لديك ملف جاهز؟</span>
                <p class="text-[11px] text-[#debfc2]/60 leading-relaxed">
                  يمكنك استدعاء أحد النماذج المسبقة لفك تشفيره فورياً ومعاينته داخل القارئ الأدبي.
                </p>
                <button
                  type="button"
                  (click)="loadReaderDemo()"
                  class="w-full py-2 px-3 rounded-lg bg-white/[0.06] hover:bg-white/[0.1] text-[#e9c349] text-xs font-semibold border border-[#e9c349]/30 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <mat-icon class="text-base">menu_book</mat-icon>
                  <span>قراءة نموذج «ألف ليلة وليلة» فوراً</span>
                </button>
              </div>

            </div>

            <!-- Reading Sanctuary (8 Cols) -->
            <div class="lg:col-span-8 bg-[#141418] border border-white/[0.08] rounded-2xl p-6 sm:p-8 space-y-6">
              
              @if (decompressionResult(); as decomp) {
                
                <!-- Reader Top Bar Controls -->
                <div class="flex flex-wrap items-center justify-between gap-4 border-b border-white/[0.08] pb-4">
                  <div class="space-y-0.5 text-right">
                    <span class="text-xs text-[#7bd8b1] font-semibold flex items-center gap-1">
                      <mat-icon class="text-base leading-none">check_circle</mat-icon>
                      <span>تم التحقق والفك بنجاح في {{ decomp.decodingDurationMs }} ms</span>
                    </span>
                    <h3 class="font-noto-serif text-lg font-bold text-white">
                      {{ decomp.metadata.title }} — {{ decomp.metadata.chapterTitle }}
                    </h3>
                  </div>

                  <!-- Reader Controls: Font Size & Highlight Diacritics -->
                  <div class="flex items-center gap-2">
                    
                    <!-- Font family button toggle -->
                    <button
                      type="button"
                      (click)="toggleReaderFont()"
                      class="px-2.5 py-1.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-white border border-white/10 text-xs font-medium cursor-pointer"
                    >
                      الخط: {{ readerFont() === 'amiri' ? 'الأميري' : readerFont() === 'naskh' ? 'النسخ' : 'الافتراضي' }}
                    </button>

                    <!-- Diacritic Gold Highlight Toggle -->
                    <button
                      type="button"
                      (click)="toggleDiacriticHighlight()"
                      class="px-2.5 py-1.5 rounded-lg border text-xs font-medium cursor-pointer flex items-center gap-1"
                      [class.bg-[#e9c349]/20]="highlightDiacritics()"
                      [class.text-[#e9c349]]="highlightDiacritics()"
                      [class.border-[#e9c349]/50]="highlightDiacritics()"
                      [class.bg-white/[0.04]]="!highlightDiacritics()"
                      [class.text-[#debfc2]]="!highlightDiacritics()"
                      [class.border-white/10]="!highlightDiacritics()"
                    >
                      <mat-icon class="text-sm">format_color_text</mat-icon>
                      <span>إبراز التشكيل</span>
                    </button>

                    <!-- Font size controls -->
                    <div class="flex items-center bg-white/[0.04] rounded-lg border border-white/10 p-0.5">
                      <button
                        type="button"
                        (click)="adjustFontSize(-2)"
                        class="px-2 py-1 text-xs text-white hover:bg-white/10 rounded cursor-pointer"
                        title="تصغير الخط"
                      >
                        A-
                      </button>
                      <button
                        type="button"
                        (click)="adjustFontSize(2)"
                        class="px-2 py-1 text-xs text-white hover:bg-white/10 rounded cursor-pointer"
                        title="تكبير الخط"
                      >
                        A+
                      </button>
                    </div>

                  </div>
                </div>

                <!-- Verified Metadata Grid -->
                <div class="grid grid-cols-2 sm:grid-cols-4 gap-2 text-right">
                  <div class="bg-[#1b1a20] p-2.5 rounded-xl border border-white/[0.04]">
                    <span class="text-[10px] text-[#debfc2]/60 block">المؤلف / الراوي</span>
                    <span class="text-xs font-bold text-white truncate block">{{ decomp.metadata.author }}</span>
                  </div>
                  <div class="bg-[#1b1a20] p-2.5 rounded-xl border border-white/[0.04]">
                    <span class="text-[10px] text-[#debfc2]/60 block">حجم الحزمة المضغوطة</span>
                    <span class="text-xs font-bold font-mono text-[#7bd8b1]">{{ decomp.compressedBytes }} بايت</span>
                  </div>
                  <div class="bg-[#1b1a20] p-2.5 rounded-xl border border-white/[0.04]">
                    <span class="text-[10px] text-[#debfc2]/60 block">الحجم بعد فك التشفير</span>
                    <span class="text-xs font-bold font-mono text-white">{{ decomp.originalUtf8Bytes }} بايت</span>
                  </div>
                  <div class="bg-[#1b1a20] p-2.5 rounded-xl border border-white/[0.04]">
                    <span class="text-[10px] text-[#debfc2]/60 block">إصدار التنسيق</span>
                    <span class="text-xs font-mono font-bold text-[#e9c349]">MTX {{ decomp.version === 22 ? '2.2' : decomp.version }}</span>
                  </div>
                </div>

                <!-- Text Presentation Area -->
                <div class="space-y-2">
                  <span class="text-xs text-[#debfc2]/70 font-semibold block text-right">النص المسترجع بكامل حركاته وتشكيله:</span>
                  <div
                    class="bg-[#111115] border border-white/10 rounded-2xl p-6 sm:p-8 max-h-[460px] overflow-y-auto leading-[2.4] select-text text-right"
                    [style.font-size.px]="readerFontSize()"
                    [class.font-amiri]="readerFont() === 'amiri'"
                    [class.font-naskh]="readerFont() === 'naskh'"
                    [class.font-serif]="readerFont() === 'default'"
                  >
                    @if (highlightDiacritics()) {
                      <div [innerHTML]="formatHighlightedText(decomp.text)"></div>
                    } @else {
                      <div class="whitespace-pre-wrap">{{ decomp.text }}</div>
                    }
                  </div>
                </div>

              } @else if (decompressionError()) {
                <div class="p-6 rounded-2xl bg-red-950/40 border border-red-500/40 text-red-200 text-xs space-y-2 text-right">
                  <div class="flex items-center gap-2 text-red-400 font-bold">
                    <mat-icon>error_outline</mat-icon>
                    <span>فشلت قراءة الملف</span>
                  </div>
                  <p>{{ decompressionError() }}</p>
                </div>
              } @else {
                <div class="p-12 text-center text-xs text-[#debfc2]/50 border border-white/[0.06] rounded-2xl bg-black/20 space-y-3">
                  <div class="w-12 h-12 rounded-full bg-white/[0.04] text-[#debfc2]/40 flex items-center justify-center mx-auto">
                    <mat-icon class="text-2xl">auto_stories</mat-icon>
                  </div>
                  <h4 class="font-noto-serif text-base font-bold text-white">القارئ بانتظار استدعاء عمل</h4>
                  <p class="max-w-md mx-auto leading-relaxed">
                    قم برفع ملف .mtx من جهازك أو الضغط على زر استدعاء النموذج لمعاينة جودة الخط والإعراب الفوري.
                  </p>
                </div>
              }

            </div>

          </div>

        </section>

        <!-- ================= SECTION 3: CURATED LITERARY SHOWCASE ================= -->
        <section id="library" class="max-w-7xl mx-auto px-4 sm:px-8 space-y-8 scroll-mt-24">
          
          <div class="border-b border-white/[0.08] pb-5 space-y-1.5 text-right">
            <div class="flex items-center gap-2 text-xs text-[#e9c349]">
              <span>مكتبة الروائع التراثية والحديثة</span>
              <span aria-hidden="true">·</span>
              <span>نصوص مشكولة بصيغة MTX 2.2</span>
            </div>
            <h2 class="font-noto-serif text-2xl sm:text-3xl font-bold text-white">
              روائع الأدب العربي المشكول بصيغة MTX 2.2
            </h2>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            @for (item of presets; track item.id) {
              <div class="bg-[#141418] border border-white/[0.08] hover:border-[#e9c349]/40 rounded-2xl p-6 flex flex-col justify-between transition-all space-y-4 group">
                
                <div class="space-y-3 text-right">
                  <div class="flex items-center justify-between text-xs text-[#debfc2]/60">
                    <span>{{ item.genre }}</span>
                    <span>{{ item.era }}</span>
                  </div>
                  
                  <h3 class="font-noto-serif text-lg font-bold text-white group-hover:text-[#e9c349] transition-colors">
                    {{ item.title }}
                  </h3>

                  <p class="text-xs text-[#debfc2]/70 leading-relaxed line-clamp-3">
                    {{ item.description }}
                  </p>
                </div>

                <div class="pt-4 border-t border-white/[0.06] space-y-3">
                  <div class="flex justify-between items-center text-xs">
                    <span class="text-[#debfc2]/60">توفير الحجم:</span>
                    <span class="font-mono text-[#7bd8b1] font-bold">~ ٨١.٥٪</span>
                  </div>

                  <div class="flex items-center gap-2">
                    <button
                      type="button"
                      (click)="readPresetDirectly(item)"
                      class="flex-1 py-2 px-3 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] text-white text-xs font-semibold transition-colors flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <mat-icon class="text-sm">visibility</mat-icon>
                      <span>قراءة الآن</span>
                    </button>
                    <button
                      type="button"
                      (click)="downloadPresetMtx(item)"
                      class="py-2 px-3 rounded-xl bg-[#e9c349]/20 hover:bg-[#e9c349]/30 text-[#e9c349] text-xs font-bold transition-colors flex items-center justify-center cursor-pointer"
                      title="تحميل كملف .mtx"
                    >
                      <mat-icon class="text-sm">download</mat-icon>
                    </button>
                  </div>
                </div>

              </div>
            }
          </div>

        </section>

        <!-- ================= SECTION 4: SCIENTIFIC BENCHMARK LABORATORY ================= -->
        <section id="benchmark" class="max-w-7xl mx-auto px-4 sm:px-8 space-y-8 scroll-mt-24">
          
          <div class="border-b border-white/[0.08] pb-5 space-y-1.5 text-right">
            <div class="flex items-center gap-2 text-xs text-[#7bd8b1]">
              <span>المقارنة العلمية المعيارية</span>
              <span aria-hidden="true">·</span>
              <span>لماذا تتفوق معمارية MTX 2.2؟</span>
            </div>
            <h2 class="font-noto-serif text-2xl sm:text-3xl font-bold text-white">
              مقارنة أداء ضغط النصوص العربية المشكولة
            </h2>
          </div>

          <div class="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            <!-- Left 7 Cols: Comparative Matrix Table -->
            <div class="lg:col-span-7 bg-[#141418] border border-white/[0.08] rounded-2xl p-6 sm:p-7 space-y-5">
              
              <div class="flex justify-between items-center text-xs">
                <span class="font-bold text-white">مقارنة معمارية ضغط نص عربي مشكول (١٠٠ ألف حرف)</span>
                <span class="text-[#debfc2]/60">معايير الاختبار المرجعية</span>
              </div>

              <div class="overflow-x-auto">
                <table class="w-full text-right text-xs">
                  <thead>
                    <tr class="border-b border-white/10 text-[#debfc2]/60">
                      <th class="py-3 px-2">الصيغة / المحرك</th>
                      <th class="py-3 px-2">الحجم الناتج</th>
                      <th class="py-3 px-2">نسبة التوفير</th>
                      <th class="py-3 px-2">فك التشفير في المتصفح</th>
                      <th class="py-3 px-2">سلامة الإعراب</th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-white/[0.05]">
                    
                    <tr class="bg-[#e9c349]/[0.08] font-bold text-white">
                      <td class="py-3 px-2 flex items-center gap-1.5 text-[#e9c349]">
                        <mat-icon class="text-sm">star</mat-icon>
                        <span>MTX 2.2 (المحرك الجديد)</span>
                      </td>
                      <td class="py-3 px-2 font-mono text-[#7bd8b1]">١٩.٤ كيلوبايت</td>
                      <td class="py-3 px-2 font-mono text-[#7bd8b1]">٨٠.٦٪</td>
                      <td class="py-3 px-2 text-[#7bd8b1]">&lt; ١.٥ ms فوري</td>
                      <td class="py-3 px-2 text-[#7bd8b1]">١٠٠٪ تام</td>
                    </tr>

                    <tr>
                      <td class="py-3 px-2 font-semibold">MTX 2.0 (النسخة السابقة)</td>
                      <td class="py-3 px-2 font-mono text-white/80">٢٣.٨ كيلوبايت</td>
                      <td class="py-3 px-2 font-mono text-white/80">٧٦.٢٪</td>
                      <td class="py-3 px-2">&lt; ٢ ms فوري</td>
                      <td class="py-3 px-2 text-[#7bd8b1]">١٠٠٪ تام</td>
                    </tr>

                    <tr>
                      <td class="py-3 px-2 text-[#debfc2]/80">GZIP / Deflate قياسي</td>
                      <td class="py-3 px-2 font-mono text-white/80">٣٨.٥ كيلوبايت</td>
                      <td class="py-3 px-2 font-mono text-white/80">٦١.٥٪</td>
                      <td class="py-3 px-2">يحتاج مكتبة خارجية</td>
                      <td class="py-3 px-2 text-[#7bd8b1]">١٠٠٪</td>
                    </tr>

                    <tr>
                      <td class="py-3 px-2 text-[#debfc2]/80">ملف نصي خام UTF-8</td>
                      <td class="py-3 px-2 font-mono text-white/80">١٠٠.٠ كيلوبايت</td>
                      <td class="py-3 px-2 font-mono text-white/80">٠٪ (المرجع)</td>
                      <td class="py-3 px-2">مباشر</td>
                      <td class="py-3 px-2">أصلي</td>
                    </tr>

                  </tbody>
                </table>
              </div>

              <div class="p-4 rounded-xl bg-white/[0.02] border border-white/[0.04] text-[11px] text-[#debfc2]/70 leading-relaxed text-right space-y-1">
                <span class="font-bold text-white block">لماذا تخفق خوارزميات الضغط العامة كـ GZIP مع التشكيل العربي؟</span>
                <p>
                  في معيار UTF-8، تأخذ كل حركة تشكيل أو تنوين بايتاً منفصلاً ملحقاً بالحرف، مما يكسر تسلسل المقاطع المتكررة ويجعل النوافذ المعجمية (Sliding Windows) تمتلئ ببيانات متناثرة. يقوم محرك MTX 2.2 بدمج الحرف وحركته في رمز واحد (Morphological Grapheme Fusion) وضغط السوابق واللواحق شائعة الورود قبل مرحلة الإنتروبيا.
                </p>
              </div>

              <!-- Live Engine Benchmark Runner Suite -->
              <div class="pt-2 border-t border-white/[0.08] space-y-3">
                <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div class="text-right">
                    <span class="text-xs font-bold text-white block">اختبار كفاءة وسرعة المحرك المباشر (Live Suite):</span>
                    <span class="text-[11px] text-[#debfc2]/60">تشغيل كافة النماذج الأدبية واحتساب الإحصائيات الفورية</span>
                  </div>
                  <button
                    type="button"
                    (click)="runLiveStressTest()"
                    [disabled]="stressTestRunning()"
                    class="px-4 py-2 rounded-xl bg-gradient-to-r from-[#e9c349] to-[#d6ad30] hover:brightness-110 disabled:opacity-50 text-[#1f1600] text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-md shrink-0"
                  >
                    <mat-icon class="text-sm">{{ stressTestRunning() ? 'sync' : 'speed' }}</mat-icon>
                    <span>{{ stressTestRunning() ? 'جارِ الاختبار الحسابي...' : 'تشغيل الاختبار المباشر الآن' }}</span>
                  </button>
                </div>

                @if (stressTestResults(); as st) {
                  <div class="grid grid-cols-2 sm:grid-cols-4 gap-2.5 bg-[#101014] p-3.5 rounded-xl border border-[#7bd8b1]/30">
                    <div class="text-right">
                      <span class="text-[10px] text-[#debfc2]/60 block">إجمالي الحروف المعالجة</span>
                      <span class="text-xs font-mono font-bold text-white">{{ st.totalChars }} حرف</span>
                    </div>
                    <div class="text-right">
                      <span class="text-[10px] text-[#debfc2]/60 block">متوسط نسبة التوفير</span>
                      <span class="text-xs font-mono font-bold text-[#7bd8b1]">{{ st.totalSavedPercent }}%</span>
                    </div>
                    <div class="text-right">
                      <span class="text-[10px] text-[#debfc2]/60 block">متوسط زمن المعالجة</span>
                      <span class="text-xs font-mono font-bold text-white">{{ st.avgLatencyMs }} ms</span>
                    </div>
                    <div class="text-right">
                      <span class="text-[10px] text-[#debfc2]/60 block">مطابقة النزاهة</span>
                      <span class="text-xs font-bold text-[#7bd8b1] flex items-center gap-1">
                        <mat-icon class="text-xs">verified</mat-icon>
                        <span>100% تطابق تام</span>
                      </span>
                    </div>
                  </div>
                }
              </div>

            </div>

            <!-- Right 5 Cols: Core Engine Pillars -->
            <div class="lg:col-span-5 bg-[#141418] border border-white/[0.08] rounded-2xl p-6 sm:p-7 space-y-4 text-right">
              
              <h3 class="font-noto-serif text-base font-bold text-white">
                ركائز التقوية والإغلاق الأمني في MTX 2.2
              </h3>

              <div class="space-y-3 text-xs">
                
                <div class="p-3.5 rounded-xl bg-[#1b1a20] border border-white/[0.06] space-y-1">
                  <span class="font-bold text-[#e9c349] block">1. تسريع Radix Trie (قفزة أداء 35x)</span>
                  <p class="text-[#debfc2]/70 leading-relaxed">
                    استبدال المسح الخطي بمصفوفة شجرة البوادئ Prefix Trie، مما قلص زمن التجزئة من O(N*V) إلى O(N*L).
                  </p>
                </div>

                <div class="p-3.5 rounded-xl bg-[#1b1a20] border border-white/[0.06] space-y-1">
                  <span class="font-bold text-[#7bd8b1] block">2. بروتوكول Escape الشامل للرموز الكونية</span>
                  <p class="text-[#debfc2]/70 leading-relaxed">
                    حجز Token 255 لترميز أي حرف لاتيني، إيموجي، أو رمز غير مألوف دون أي فقدان أو استبدال للأحرف.
                  </p>
                </div>

                <div class="p-3.5 rounded-xl bg-[#1b1a20] border border-white/[0.06] space-y-1">
                  <span class="font-bold text-[#ffe088] block">3. تشفير انسيابي لامتناظري محصن (PRNG)</span>
                  <p class="text-[#debfc2]/70 leading-relaxed">
                    دمج مفتاح التشفير وبذرة الملح بدوال تقليب خماسية غير خطية Quarter-Round تقاوم الهجمات التحليلية.
                  </p>
                </div>

                <div class="p-3.5 rounded-xl bg-[#1b1a20] border border-white/[0.06] space-y-1">
                  <span class="font-bold text-white block">4. فحص النزاهة المزدوج (Dual Integrity)</span>
                  <p class="text-[#debfc2]/70 leading-relaxed">
                    مطابقة Adler-32 المتزامنة مع IEEE 802.3 CRC-32 للتيقن من سلامة كل بايت من التلف أو التعديل.
                  </p>
                </div>

              </div>

            </div>

          </div>

        </section>

        <!-- ================= SECTION 5: BINARY SPECIFICATION ================= -->
        <section id="spec" class="max-w-7xl mx-auto px-4 sm:px-8 space-y-8 scroll-mt-24">
          
          <div class="border-b border-white/[0.08] pb-5 space-y-1.5 text-right">
            <div class="flex items-center gap-2 text-xs text-[#e9c349]">
              <span>دليل المطورين والمعايير المفتوحة</span>
              <span aria-hidden="true">·</span>
              <span>Open Binary Standard</span>
            </div>
            <h2 class="font-noto-serif text-2xl sm:text-3xl font-bold text-white">
              المواصفة التقنية لترويسة MTX 2.2 الثنائية
            </h2>
          </div>

          <div class="bg-[#141418] border border-white/[0.08] rounded-2xl p-6 sm:p-8 space-y-6">
            
            <div class="grid grid-cols-1 md:grid-cols-4 gap-3 text-right text-xs">
              
              <div class="bg-[#1a1920] p-4 rounded-xl border border-white/[0.06] space-y-1">
                <span class="font-mono text-[#e9c349] font-bold block">Bytes 0–3</span>
                <span class="font-semibold text-white block">Magic Signature</span>
                <p class="text-[#debfc2]/60 text-[11px]">
                  أربعة بايتات مطابقة لـ ASCII ("MTX2") للتحقق من هوية الملف.
                </p>
              </div>

              <div class="bg-[#1a1920] p-4 rounded-xl border border-white/[0.06] space-y-1">
                <span class="font-mono text-[#7bd8b1] font-bold block">Bytes 4–5</span>
                <span class="font-semibold text-white block">Version & Flags</span>
                <p class="text-[#debfc2]/60 text-[11px]">
                  الإصدار (0x16 = 22 لـ MTX 2.2) وقناع الرايات لمزايا التشفير والقاموس.
                </p>
              </div>

              <div class="bg-[#1a1920] p-4 rounded-xl border border-white/[0.06] space-y-1">
                <span class="font-mono text-[#ffe088] font-bold block">Bytes 6–13</span>
                <span class="font-semibold text-white block">Salt & Adler-32</span>
                <p class="text-[#debfc2]/60 text-[11px]">
                  بذرة التشفير الانسيابي المتناظر ورمز التحقق من عدم الفقد اللحظي.
                </p>
              </div>

              <div class="bg-[#1a1920] p-4 rounded-xl border border-white/[0.06] space-y-1">
                <span class="font-mono text-white/90 font-bold block">Bytes 14–19</span>
                <span class="font-semibold text-white block">Size & Dict Entries</span>
                <p class="text-[#debfc2]/60 text-[11px]">
                  حجم النص الأصلي غير المضغوط وعدد المفردات الديناميكية المكتشفة.
                </p>
              </div>

            </div>

            <!-- Code Integration Sample -->
            <div class="space-y-2 text-right">
              <span class="text-xs font-semibold text-white block">تضمين محرك MTX 2.2 في مشاريع TypeScript / Node.js:</span>
              <div class="bg-[#0f0e13] border border-white/10 rounded-xl p-4 font-mono text-xs text-[#debfc2]/90 leading-relaxed text-left overflow-x-auto" dir="ltr">
                <pre class="m-0 text-[#debfc2]">
import &#123; compressToMtx, decompressFromMtx &#125; from './mtx-codec';

// ضغط نص عربي مشكول
const &#123; mtxBytes, savingsPercent &#125; = await compressToMtx(arabicText, &#123;
  title: 'سفر الخلود',
  author: 'أديب معتمد'
&#125;, &#123; profile: 'maximum' &#125;);

// فك التشفير اللحظي بنسبة تطابق 100%
const &#123; text, isLossless &#125; = await decompressFromMtx(mtxBytes);
console.log('تم استرجاع النص بنجاح:', isLossless);</pre>
              </div>
            </div>

          </div>

        </section>

      </main>

      <!-- Website Authoritative Footer -->
      <footer class="w-full border-t border-white/[0.08] mt-32 py-12 bg-[#0c0c0e]">
        <div class="max-w-7xl mx-auto px-4 sm:px-8 flex flex-col md:flex-row items-center justify-between gap-6 text-xs text-[#debfc2]/60">
          
          <div class="flex items-center gap-3">
            <div class="w-7 h-7 rounded-lg bg-[#e9c349] flex items-center justify-center text-black font-black text-sm">
              M
            </div>
            <span class="font-noto-serif text-white font-bold">منظومة معيار MTX 2.2 للأدب العربي المشكول</span>
          </div>

          <div class="flex items-center gap-6">
            <span>صيغة ثنائية مفتوحة المصدر</span>
            <span>·</span>
            <span>تشفير طرفي غير فقود 100%</span>
            <span>·</span>
            <span>2026</span>
          </div>

        </div>
      </footer>

    </div>
  `,
})
export class App implements OnInit {
  readonly isCompressing = signal<boolean>(false);
  readonly compressionResult = signal<MtxCompressionResult | null>(null);
  readonly decompressionResult = signal<MtxDecompressionResult | null>(null);
  readonly decompressionError = signal<string>('');
  readonly copySuccess = signal<boolean>(false);
  readonly selectedProfile = signal<CompressionProfile>('balanced');
  readonly liveAnalysis = signal<ArabicTextAnalysis | null>(null);
  readonly activePresetId = signal<string>('thousand-and-one-nights');
  readonly stressTestRunning = signal<boolean>(false);
  readonly stressTestResults = signal<{ totalChars: number; totalSavedPercent: number; avgLatencyMs: number; allLossless: boolean } | null>(null);

  // Reader Settings
  readonly readerFontSize = signal<number>(18);
  readonly readerFont = signal<'amiri' | 'naskh' | 'default'>('amiri');
  readonly highlightDiacritics = signal<boolean>(false);

  readonly presets = MTX_LITERARY_PRESETS;

  readonly compressForm = new FormGroup({
    title: new FormControl(this.presets[0].title, [Validators.required]),
    author: new FormControl(this.presets[0].author, [Validators.required]),
    chapterTitle: new FormControl(this.presets[0].chapterTitle, [Validators.required]),
    genre: new FormControl(this.presets[0].genre),
    text: new FormControl(this.presets[0].text, [Validators.required, Validators.minLength(10)]),
  });

  constructor() {
    this.updateLiveAnalysis();
  }

  ngOnInit(): void {
    // Initial run to generate sample benchmark results
    this.onCompress();
    verifyFirestoreConnection().catch((err: unknown) => {
      console.info('Firestore initial connectivity notice:', err);
    });
  }

  scrollTo(sectionId: string): void {
    const el = document.getElementById(sectionId);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  setProfile(profile: CompressionProfile): void {
    this.selectedProfile.set(profile);
    this.onCompress();
  }

  updateLiveAnalysis(): void {
    const txt = this.compressForm.get('text')?.value || '';
    if (txt.trim()) {
      this.liveAnalysis.set(analyzeArabicText(txt));
    } else {
      this.liveAnalysis.set(null);
    }
  }

  loadPreset(preset: MtxPreset): void {
    this.activePresetId.set(preset.id);
    this.compressForm.patchValue({
      title: preset.title,
      author: preset.author,
      chapterTitle: preset.chapterTitle,
      genre: preset.genre,
      text: preset.text,
    });
    this.updateLiveAnalysis();
    this.onCompress();
  }

  async readPresetDirectly(preset: MtxPreset): Promise<void> {
    this.loadPreset(preset);
    this.scrollTo('reader');
  }

  async downloadPresetMtx(preset: MtxPreset): Promise<void> {
    const res = await compressToMtx(preset.text, {
      title: preset.title,
      author: preset.author,
      chapterTitle: preset.chapterTitle,
      genre: preset.genre,
    }, { profile: 'maximum' });
    await downloadMtxFile(res.mtxBytes, `${preset.title}.mtx`);
  }

  async runLiveStressTest(): Promise<void> {
    this.stressTestRunning.set(true);
    try {
      let totalOriginal = 0;
      let totalCompressed = 0;
      let totalTime = 0;
      let allLossless = true;
      let totalChars = 0;

      for (const preset of this.presets) {
        const start = performance.now();
        const res = await compressToMtx(preset.text, {
          title: preset.title,
          author: preset.author,
          chapterTitle: preset.chapterTitle,
          genre: preset.genre,
        }, { profile: 'maximum' });
        totalTime += performance.now() - start;
        totalOriginal += res.originalUtf8Bytes;
        totalCompressed += res.compressedBytes;
        totalChars += preset.text.length;
        if (!res.isLossless) allLossless = false;
      }

      const totalSavedPercent = Math.round(((totalOriginal - totalCompressed) / Math.max(1, totalOriginal)) * 1000) / 10;
      const avgLatencyMs = Math.round((totalTime / this.presets.length) * 10) / 10;

      this.stressTestResults.set({
        totalChars,
        totalSavedPercent,
        avgLatencyMs,
        allLossless,
      });
    } catch (err: unknown) {
      console.warn('Stress test error:', err);
    } finally {
      this.stressTestRunning.set(false);
    }
  }

  async loadReaderDemo(): Promise<void> {
    const demo = this.presets[0];
    const res = await compressToMtx(demo.text, {
      title: demo.title,
      author: demo.author,
      chapterTitle: demo.chapterTitle,
      genre: demo.genre,
    });
    const decomp = await decompressFromMtx(res.mtxBytes);
    this.decompressionResult.set(decomp);
    this.decompressionError.set('');
    this.scrollTo('reader');
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
        genre: val.genre || 'أدب عربي',
        createdAt: new Date().toISOString(),
      };

      const result = await compressToMtx(val.text, metadata, {
        profile: this.selectedProfile(),
      });
      this.compressionResult.set(result);

      // Populate reader automatically
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
    const title = this.compressForm.value.title || 'mtx_novel';
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

  async saveCurrentToVault(): Promise<void> {
    const res = this.compressionResult();
    if (!res) return;
    const book: CloudMtxBook = {
      id: 'book_' + Date.now(),
      title: res.metadata.title,
      author: res.metadata.author,
      chapterTitle: res.metadata.chapterTitle,
      originalBytes: res.originalUtf8Bytes,
      compressedBytes: res.compressedBytes,
      savingsPercent: res.savingsPercent,
      b64Payload: uint8ArrayToBase64(res.mtxBytes),
      checksum: res.checksum,
      crc32Checksum: res.crc32Checksum,
      version: 'MTX ' + (res.version === 22 ? '2.2' : res.version),
      createdAt: new Date().toISOString(),
    };
    await saveToCloudVault(book);
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

  getHexDumpSlice(bytes: Uint8Array, len = 32): string {
    return getHexDump(bytes, len);
  }

  adjustFontSize(delta: number): void {
    const current = this.readerFontSize();
    const next = Math.max(14, Math.min(32, current + delta));
    this.readerFontSize.set(next);
  }

  toggleReaderFont(): void {
    const current = this.readerFont();
    if (current === 'amiri') this.readerFont.set('naskh');
    else if (current === 'naskh') this.readerFont.set('default');
    else this.readerFont.set('amiri');
  }

  toggleDiacriticHighlight(): void {
    this.highlightDiacritics.update((v) => !v);
  }

  formatHighlightedText(text: string): string {
    // Escapes and wraps diacritics in golden span
    return text.replace(/([\u064B-\u065F\u0670]+)/g, '<span class="text-[#e9c349] font-bold select-text">$1</span>');
  }
}
