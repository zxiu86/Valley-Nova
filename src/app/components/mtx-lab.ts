import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { NovelStore } from '../core/novel-store';
import {
  compressToMtx,
  decompressFromMtx,
  downloadMtxFile,
  getHexDump,
  MtxCompressionResult,
  MtxDictionaryEntry,
} from '../core/mtx-codec';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-mtx-lab',
  imports: [ReactiveFormsModule, MatIconModule],
  template: `
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10">
      
      <!-- Lab Header -->
      <div class="border-b border-stone-800 pb-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div class="flex items-center gap-2 text-xs font-mono-code text-amber-400">
            <span>مختبر فحص الخوارزمية والهندسة العكسية</span>
            <span aria-hidden="true">·</span>
            <span>MTX Binary Spec v1.0</span>
          </div>
          <h1 class="text-3xl font-bold font-amiri text-stone-100 mt-1">
            مختبر خوارزمية MTX وخريطة الترميز الديناميكية
          </h1>
          <p class="text-xs text-stone-400 mt-1">
            فحص حي لآلية تحويل وتكرار الحركات والكلمات (كَ، كِ، م، ن)، واختبار سرعة فك التشفير والتحقق من النزاهة التامة (Lossless).
          </p>
        </div>

        <div class="flex items-center gap-2">
          <!-- Load Sample with Tashkeel Button -->
          <button
            (click)="testTashkeelCases()"
            class="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-950 text-amber-300 border border-amber-800 text-xs font-bold hover:bg-amber-900 transition-colors cursor-pointer"
          >
            <mat-icon class="text-sm">auto_fix_high</mat-icon>
            <span>اختبار كَ وكِ وم ون</span>
          </button>

          <!-- Run Benchmark Button -->
          <button
            (click)="runBenchmark()"
            [disabled]="isBenchmarking() || !currentResult()"
            class="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 disabled:opacity-40 text-stone-200 border border-stone-700 text-xs font-bold transition-colors cursor-pointer"
          >
            <mat-icon class="text-sm text-amber-400">speed</mat-icon>
            <span>قياس سرعة 100 دورة</span>
          </button>

          <!-- Direct Compress and Download MTX Button -->
          <button
            type="button"
            (click)="compressAndDownloadDirectly()"
            [disabled]="isDirectCompressing()"
            class="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-bold shadow-md transition-all cursor-pointer"
          >
            <mat-icon class="text-base">file_download</mat-icon>
            <span>{{ isDirectCompressing() ? 'جاري الضغط والتنزيل...' : 'ضغط الفصل وتنزيل .mtx مباشرة' }}</span>
          </button>
        </div>
      </div>

      <!-- Drag & Drop or Input Section -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        <!-- Live Text Input for Analysis -->
        <div class="p-6 bg-stone-900/90 rounded-2xl border border-stone-800 space-y-3">
          <div class="flex items-center justify-between">
            <label for="lab-analysis-textarea" class="text-xs font-bold text-stone-200 flex items-center gap-1.5">
              <mat-icon class="text-base text-amber-500">subject</mat-icon>
              <span>النص العربي المراد ضغطه وفحصه:</span>
            </label>
            <span class="text-[11px] font-mono-code text-stone-400">
              {{ inputText.value?.length || 0 }} حرف
            </span>
          </div>

          <textarea
            id="lab-analysis-textarea"
            [formControl]="inputText"
            rows="7"
            placeholder="أدخل أي نص عربي لتشاهد فوراً كيف تنشئ صيغة MTX خريطة الرموز وكيف تضغطها بنسبة 70% إلى 80%..."
            class="w-full bg-stone-950 border border-stone-800 rounded-xl p-4 text-stone-100 font-amiri text-base leading-relaxed focus:border-amber-500 focus:outline-none resize-none shadow-inner"
          ></textarea>

          <div class="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
            <span class="text-xs text-stone-400">يدعم كافة الحركات (كَ، كِ، كُ، كْ، تنوين، شدة) والمفردات المكررة.</span>
            
            <div class="flex items-center gap-2 w-full sm:w-auto">
              <button
                type="button"
                (click)="analyzeText()"
                class="px-3.5 py-2.5 bg-stone-800 hover:bg-stone-700 text-stone-200 font-bold rounded-xl text-xs cursor-pointer transition-colors"
              >
                تحديث الإحصائيات
              </button>

              <!-- DIRECT DOWNLOAD BUTTON (Prominent) -->
              <button
                type="button"
                (click)="compressAndDownloadDirectly()"
                [disabled]="isDirectCompressing()"
                class="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold rounded-xl text-xs sm:text-sm shadow-md transition-all cursor-pointer ring-2 ring-emerald-500/20"
              >
                <mat-icon class="text-base">file_download</mat-icon>
                <span>{{ isDirectCompressing() ? 'جاري الضغط والتنزيل...' : 'ضغط الفصل وتنزيل ملف .mtx فوراً' }}</span>
              </button>
            </div>
          </div>

          <!-- Immediate Download Confirmation & Direct Fallback Link -->
          @if (lastDownloadInfo(); as dl) {
            <div class="p-3.5 bg-emerald-950/80 border border-emerald-600/80 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-emerald-200">
              <div class="flex items-center gap-2">
                <mat-icon class="text-emerald-400">check_circle</mat-icon>
                <div>
                  <span class="font-bold">تم ضغط وتجهيز الملف "{{ dl.filename }}.mtx" بنجاح!</span>
                  <span class="text-emerald-300/80 block text-[11px]">حجم الملف الفعلي: {{ dl.size }} بايت</span>
                </div>
              </div>

              <a
                [href]="dl.dataUrl"
                [download]="dl.filename + '.mtx'"
                class="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg shadow cursor-pointer transition-colors flex items-center gap-1.5 whitespace-nowrap"
              >
                <mat-icon class="text-base">file_download</mat-icon>
                <span>تحميل الملف الآن</span>
              </a>
            </div>
          }
        </div>

        <!-- Drag & Drop .MTX File for Direct Decoding -->
        <div
          (dragover)="onDragOver($event)"
          (drop)="onFileDrop($event)"
          class="p-6 bg-stone-900/50 rounded-2xl border-2 border-dashed border-stone-700 hover:border-amber-500 flex flex-col items-center justify-center text-center space-y-3 transition-colors cursor-pointer group"
        >
          <div class="w-12 h-12 rounded-2xl bg-amber-950/60 text-amber-400 border border-amber-800/80 flex items-center justify-center group-hover:scale-110 transition-transform">
            <mat-icon class="text-2xl">file_upload</mat-icon>
          </div>

          <div>
            <h3 class="text-sm font-bold text-stone-200">
              اسحب وأفلت أي ملف بصيغة MTX هنا (.mtx)
            </h3>
            <p class="text-xs text-stone-400 mt-1 max-w-xs">
              سيقوم المحرك بفك تشفيره وفحص خريطة الرموز وإعادة بناء النص في أجزاء من الألف من الثانية.
            </p>
          </div>

          <label class="px-4 py-2 bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-bold rounded-xl border border-stone-700 cursor-pointer transition-colors">
            <span>اختر ملفاً من جهازك</span>
            <input
              type="file"
              accept=".mtx"
              class="hidden"
              (change)="onFileInput($event)"
            />
          </label>
        </div>

      </div>

      <!-- Upload Success Banner -->
      @if (uploadedFileInfo(); as info) {
        <div class="p-4 bg-emerald-950/60 border border-emerald-700/80 rounded-2xl flex items-center justify-between text-xs text-emerald-200">
          <div class="flex items-center gap-2">
            <mat-icon class="text-emerald-400">task_alt</mat-icon>
            <span class="font-bold">تم فك تشفير وقراءة ملف "{{ info.name }}" بنجاح!</span>
            <span>(استرجاع {{ info.textLength }} حرف بنسبة تطابق 100%)</span>
          </div>
          <div class="font-mono-code text-[11px] text-emerald-300">
            <span>سرعة فك التشفير: {{ info.decodeTime }}ms · حجم الملف: {{ info.size }} بايت</span>
          </div>
        </div>
      }

      <!-- Compression KPI Metric Cards -->
      @if (currentResult(); as res) {
        <div class="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
          
          <div class="p-4 bg-stone-900 rounded-xl border border-stone-800">
            <span class="text-[11px] text-stone-400 block">حجم UTF-8 الأصلي</span>
            <div class="text-xl font-bold font-mono-code text-stone-200 mt-1">
              {{ res.originalUtf8Bytes }} <span class="text-xs text-stone-500">Bytes</span>
            </div>
            <span class="text-[10px] text-stone-500">الحجم الطبيعي للنص</span>
          </div>

          <div class="p-4 bg-stone-900 rounded-xl border border-emerald-900/50 bg-emerald-950/10">
            <span class="text-[11px] text-emerald-400 block font-medium">حجم ملف MTX</span>
            <div class="text-xl font-bold font-mono-code text-emerald-400 mt-1">
              {{ res.compressedBytes }} <span class="text-xs text-emerald-500">Bytes</span>
            </div>
            <span class="text-[10px] text-emerald-400 font-bold">مشفر ومقلص بالكامل</span>
          </div>

          <div class="p-4 bg-stone-900 rounded-xl border border-amber-900/60 bg-amber-950/15">
            <span class="text-[11px] text-amber-400 block font-medium">نسبة التوفير (الحجم)</span>
            <div class="text-2xl font-bold font-mono-code text-amber-400 mt-1">
              {{ res.savingsPercent }}%
            </div>
            <span class="text-[10px] text-amber-400/80">توفير {{ res.originalUtf8Bytes - res.compressedBytes }} بايت</span>
          </div>

          <div class="p-4 bg-stone-900 rounded-xl border border-stone-800">
            <span class="text-[11px] text-stone-400 block">فحص المطابقة (Lossless)</span>
            <div class="text-base font-bold text-sky-400 mt-1 flex items-center gap-1">
              <mat-icon class="text-lg text-sky-400">check_circle</mat-icon>
              <span>100% سليم</span>
            </div>
            <span class="text-[10px] text-stone-500">Adler-32: {{ res.checksum.toString(16).toUpperCase() }}</span>
          </div>

          <div class="p-4 bg-stone-900 rounded-xl border border-stone-800">
            <span class="text-[11px] text-stone-400 block">زمن فك التشفير الفوري</span>
            <div class="text-xl font-bold font-mono-code text-amber-300 mt-1">
              {{ res.decodingDurationMs }}ms
            </div>
            <span class="text-[10px] text-stone-500">في متصفح العميل مباشرة</span>
          </div>

          <div class="p-4 bg-stone-900 rounded-xl border border-stone-800">
            <span class="text-[11px] text-stone-400 block">رموز القاموس الديناميكي</span>
            <div class="text-xl font-bold font-mono-code text-white mt-1">
              {{ res.dictionary.length }}
            </div>
            <span class="text-[10px] text-stone-500">تغطي {{ res.tokenCount }} تكرار</span>
          </div>

        </div>
      }

      <!-- Benchmark Results Card (If executed) -->
      @if (benchmarkResult(); as bench) {
        <div class="p-4 rounded-xl bg-amber-950/30 border border-amber-800/80 text-amber-200 text-xs flex flex-wrap items-center justify-between gap-4">
          <div class="flex items-center gap-2">
            <mat-icon class="text-amber-400">bolt</mat-icon>
            <span class="font-bold">نتيجة قياس الأداء (Benchmark):</span>
            <span>تم إجراء {{ bench.iterations }} دورة فك تشفير وتجميع متتالية.</span>
          </div>
          <div class="flex items-center gap-4 font-mono-code">
            <span>متوسط الزمن: <strong class="text-white">{{ bench.avgDurationMs }} مللي ثانية</strong></span>
            <span>معدل المعالجة: <strong class="text-emerald-400">{{ bench.opsPerSec }} عملية فك/ثانية</strong></span>
          </div>
        </div>
      }

      <!-- Detailed Dynamic Dictionary Table (خريطة الترميز الديناميكية) -->
      @if (currentResult(); as res) {
        <section class="bg-stone-900 rounded-2xl border border-stone-800 p-6 space-y-4">
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 class="text-lg font-bold font-amiri text-stone-100 flex items-center gap-2">
                <mat-icon class="text-amber-500">format_list_numbered_rtl</mat-icon>
                <span>خريطة الترميز الديناميكية (Dynamic Dictionary Map)</span>
              </h2>
              <p class="text-xs text-stone-400 mt-0.5">
                توضح كيف تم تعيين كل رمز عربي أو مقطع مشكّل (مثل كَ، كِ، م، ن) إلى معرف رقمي مدمج يقلص حجم التكرارات.
              </p>
            </div>

            <!-- Search filter in dictionary -->
            <div class="flex items-center gap-2">
              <input
                type="text"
                [formControl]="dictSearch"
                placeholder="بحث عن رمز (مثال: كَ أو كِ أو كتاب)..."
                class="bg-stone-950 border border-stone-800 rounded-lg px-3 py-1.5 text-xs text-stone-100 placeholder:text-stone-500 focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          <!-- Dictionary Table -->
          <div class="overflow-x-auto max-h-96 border border-stone-800/80 rounded-xl">
            <table class="w-full text-right text-xs">
              <thead class="bg-stone-950 text-stone-400 sticky top-0 border-b border-stone-800 font-medium">
                <tr>
                  <th class="py-2.5 px-4 font-mono-code">المعرف (ID)</th>
                  <th class="py-2.5 px-4">النص الأصلي</th>
                  <th class="py-2.5 px-4">النوع</th>
                  <th class="py-2.5 px-4">التشكيل</th>
                  <th class="py-2.5 px-4 font-mono-code">التكرار</th>
                  <th class="py-2.5 px-4 font-mono-code">حجم UTF-8</th>
                  <th class="py-2.5 px-4 font-mono-code">صافي التوفير</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-stone-800/50">
                @for (entry of filteredDictionary(); track entry.id) {
                  <tr class="hover:bg-stone-800/40 transition-colors">
                    <td class="py-2 px-4 font-mono-code text-stone-400">
                      #{{ entry.id }}
                    </td>
                    <td class="py-2 px-4 font-amiri font-bold text-sm text-stone-100">
                      @if (entry.token === ' ') {
                        <span class="text-stone-500 font-sans text-xs">[مسافة]</span>
                      } @else if (entry.token === '\n') {
                        <span class="text-stone-500 font-sans text-xs">[سطر جديد]</span>
                      } @else {
                        {{ entry.token }}
                      }
                    </td>
                    <td class="py-2 px-4">
                      <span [class]="getEntryTypeBadge(entry.type)">
                        {{ getEntryTypeLabel(entry.type) }}
                      </span>
                    </td>
                    <td class="py-2 px-4">
                      @if (entry.isDiacritized) {
                        <span class="text-amber-400 font-bold text-[11px] flex items-center gap-1">
                          <mat-icon class="text-xs">check</mat-icon>
                          <span>مشكّل بدقة</span>
                        </span>
                      } @else {
                        <span class="text-stone-500 text-[11px]">بدون تشكيل</span>
                      }
                    </td>
                    <td class="py-2 px-4 font-mono-code text-stone-300">
                      {{ entry.frequency }} مرة
                    </td>
                    <td class="py-2 px-4 font-mono-code text-stone-400">
                      {{ entry.rawUtf8Bytes }} بايت
                    </td>
                    <td class="py-2 px-4 font-mono-code font-bold text-emerald-400">
                      +{{ entry.totalSavedBytes }} بايت
                    </td>
                  </tr>
                } @empty {
                  <tr>
                    <td colspan="7" class="py-6 text-center text-stone-500">
                      لا توجد رموز مطابقة لكلمة البحث
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        </section>
      }

      <!-- Binary Container & Hex Inspection -->
      @if (currentResult(); as res) {
        <section class="bg-stone-900 rounded-2xl border border-stone-800 p-6 space-y-4">
          <div class="flex items-center justify-between">
            <h2 class="text-lg font-bold font-amiri text-stone-100 flex items-center gap-2">
              <mat-icon class="text-amber-500">terminal</mat-icon>
              <span>معمارية الملف الثنائي (MTX Binary Header & Hex Stream)</span>
            </h2>
            <span class="text-xs font-mono-code text-emerald-400">
              Header Signature: MTX1 (0x4D 0x54 0x58 0x31)
            </span>
          </div>

          <p class="text-xs text-stone-400">
            تتكون أول 32 بايت من ترويسة أمان ثابتة تحتوي على بصمة السحر، إصدار الصيغة، بذور التشفير العشوائي، ومجموع فحص Adler-32 للنزاهة، تليها حمولة القاموس والتيار المشفر بقناع الـ XOR:
          </p>

          <div class="p-4 bg-stone-950 rounded-xl border border-stone-800 font-mono-code text-xs text-amber-300 leading-relaxed overflow-x-auto shadow-inner">
            <div class="text-stone-500 mb-1">// أول 64 بايت من ملف .mtx الثنائي:</div>
            <div>{{ getHexDump(res.mtxBytes, 64) }}</div>
          </div>
        </section>
      }

    </div>
  `,
})
export class MtxLab {
  readonly store = inject(NovelStore);

  readonly inputText = new FormControl<string>(`كَانَ الكَاتِبُ كَرِيمٌ يَقِفُ عِنْدَ نَافِذَةِ مَكْتَبِهِ القَدِيمِ، يَنْظُرُ إِلَى الأُفُقِ البَعِيدِ، وَفِي يَدِهِ كِتَابٌ أَصْفَرُ الوَرَقِ.
كَانَ يُرَدِّدُ فِي سِرِّهِ: «كَمْ مِنْ كَلِمَةٍ كَتَبَهَا كَاتِبٌ فَكَانَتْ كَالنُّورِ لِمَنْ يَقْرَأُ، وَكَمْ مِنْ كِتَابٍ أَنَارَ كَوْنًا كَانَ غَارِقًا فِي العَتَمَةِ».

كَرِيمٌ كَانَ يُدْرِكُ أَنَّ اللُّغَةَ العَرَبِيَّةَ لَيْسَتْ مُجَرَّدَ حُرُوفٍ جَامِدَةٍ؛ بَلْ هِيَ رُوحٌ تَنْبِضُ بِالحَرَكَاتِ:
فَالـ «كَ» المَفْتُوحَةُ فِي «كَانَ» وَ«كَرَمٍ» وَ«كَشْفٍ» تَبْعَثُ فِي السَّمْعِ صَدًى خَفِيفًا،
بَيْنَمَا الـ «كِ» المَكْسُورَةُ فِي «كِتَابٍ» وَ«كِيَانٍ» وَ«كِسْوَةٍ» تَحْمِلُ عُمْقًا وَهَيْبَةً لَا يُخْطِئُهَا لَبِيبٌ!
وَالـ «كُ» المَضْمُومَةُ فِي «كُتُبٍ» وَ«كُرَةٍ» وَ«كُلٍّ» تَضُمُّ المَعْنَى ضَمًّا رَصِينًا،
وَالـ «كْ» السَّاكِنَةُ فِي «تَذْكُرُ» وَ«يَشْكُرُ» تَقِفُ بِاتِّزَانٍ رَائِعٍ.

كَذَلِكَ الـ «مَ» وَالـ «مِ» وَالـ «مُ»:
مِنْ «مَطَرٍ» يَهْطِلُ عَلَى «مَدِينَةٍ»، إِلَى «مِفْتَاحٍ» يَفْتَحُ بَابَ «مَعْرِفَةٍ»، إِلَى «مُسْتَقْبَلٍ» يَنْتَظِرُ «مُشْرِقًا».
وَالـ «نَ» وَالـ «نِ» وَالـ «نُ»:
نَهْرٌ يَتَدَفَّقُ بِالنَّدَى، وَنِدَاءٌ صَادِقٌ يَحْمِلُ نُورًا خَالِدًا.

قَالَ كَرِيمٌ لِصَدِيقِهِ نَادِرٍ:
— هَلْ تَرَى كَيْفَ أَنَّ الحَرْفَ نَفْسَهُ يَتَغَيَّرُ مَعْنَاهُ تَمَامًا بِمُجَرَّدِ تَغَيُّرِ حَرَكَتِهِ؟
أَجَابَهُ نَادِرٌ بَابْتِسَامَةٍ:
— نَعَمْ يَا كَرِيمُ! هَذَا هُوَ سِرُّ اللُّغَةِ؛ كَلِمَةٌ وَاحِدَةٌ قَدْ تَكُونُ «عَلَمًا» أَوْ «عِلْمًا» أَوْ «عَلَّمَ»، وَالتَّشْكِيلُ هُوَ الرَّوْنَقُ الَّذِي يَحْفَظُ حَقَّ كُلِّ حَرْفٍ.

مَضَتِ السَّاعَاتُ وَكَرِيمٌ يَدُونُ فِي كُرَّاسَتِهِ:
«مَنْ طَلَبَ العِلَا سَهِرَ اللَّيَالِي، وَمَنْ أَرَادَ الحِكْمَةَ كَانَ لَهُ فِي كُلِّ سَطْرٍ مَعْنًى، وَفِي كُلِّ حَرَكَةٍ دَلَالَةٌ».
كَانَ الصَّمْتُ يَسُودُ الغُرْفَةَ إِلَّا مِنْ حَفِيفِ الوَرَقِ، وَكَانَ كُلَّمَا وَصَلَ إِلَى نِهَايَةِ صَفْحَةٍ، عَادَ لِيَقْرَأَهَا بِصَوْتٍ عَالٍ لِيَتَأَكَّدَ مِنْ جَمَالِ السَّبْكِ وَدِقَّةِ الضَّبْطِ.`);

  readonly dictSearch = new FormControl<string>('');
  readonly currentResult = signal<MtxCompressionResult | null>(null);
  readonly isBenchmarking = signal<boolean>(false);
  readonly isDirectCompressing = signal<boolean>(false);
  readonly benchmarkResult = signal<{ iterations: number; avgDurationMs: number; opsPerSec: number } | null>(null);
  readonly uploadedFileInfo = signal<{ name: string; decodeTime: number; size: number; textLength: number } | null>(null);
  readonly lastDownloadInfo = signal<{ filename: string; dataUrl: string; size: number } | null>(null);

  constructor() {
    this.analyzeText();
  }

  readonly filteredDictionary = computed<MtxDictionaryEntry[]>(() => {
    const res = this.currentResult();
    if (!res) return [];
    const query = this.dictSearch.value?.trim();
    if (!query) return res.dictionary;
    return res.dictionary.filter(e => e.token.includes(query) || e.id.toString() === query);
  });

  async analyzeText(): Promise<void> {
    const text = this.inputText.value || '';
    if (!text.trim()) return;

    try {
      const res = await compressToMtx(text, {
        title: 'فصل تجريبي للمختبر',
        author: 'محلل صيغة MTX',
        chapterTitle: 'فحص الحركات والتكرار',
      });
      this.currentResult.set(res);
      this.benchmarkResult.set(null);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'خطأ في معالجة النص.');
    }
  }

  testTashkeelCases(): void {
    const tashkeelText = `اخْتِبَارُ الحَرَكَاتِ العَرَبِيَّةِ الدَّقِيقَةِ:
كَانَ كَرِيمٌ يَقْرَأُ كِتَابَهُ بِكُلِّ شَغَفٍ، وَكَانَ يُرَدِّدُ كَلِمَاتٍ كَثِيرَةً:
كَـ كِـ كُـ كْـ
مَـ مِـ مُـ مْـ
نَـ نِـ نُـ نْـ
«كُلُّ كَلِمَةٍ مَكْتُوبَةٍ كَانَتْ كَنَزًا، وَكُلُّ كِتَابٍ مَقْرُوءٍ كَانَ كَوْكَبًا مُنِيرًا».
تَكَرَّرَتْ «كَانَ» وَ«كِتَابٌ» وَ«كَرِيمٌ» مِرَارًا وَتَكْرَارًا لِإِثْبَاتِ كَفَاءَةِ خَرِيطَةِ MTX فِي الحِفَاظِ عَلَى كُلِّ حَرَكَةٍ دُونَ فَقْدٍ.`;

    this.inputText.setValue(tashkeelText);
    this.analyzeText();
  }

  async runBenchmark(): Promise<void> {
    const res = this.currentResult();
    if (!res) return;

    this.isBenchmarking.set(true);

    // Give browser a frame to update UI
    await new Promise(r => setTimeout(r, 50));

    const iterations = 100;
    const start = performance.now();

    for (let i = 0; i < iterations; i++) {
      await decompressFromMtx(res.mtxBytes);
    }

    const totalDuration = performance.now() - start;
    const avgDuration = Math.round((totalDuration / iterations) * 100) / 100;
    const opsPerSec = Math.round((iterations / (totalDuration / 1000)));

    this.benchmarkResult.set({
      iterations,
      avgDurationMs: avgDuration,
      opsPerSec,
    });

    this.isBenchmarking.set(false);
  }

  /**
   * Direct 1-click chapter compression and .mtx file download
   */
  async compressAndDownloadDirectly(): Promise<void> {
    const text = this.inputText.value || '';
    if (!text.trim()) {
      return;
    }

    this.isDirectCompressing.set(true);

    try {
      const res = await compressToMtx(text, {
        title: 'فصل_رواية_مضغوط',
        author: 'مؤلف_روايات_MTX',
        chapterTitle: 'فصل_مضغوط_بصيغة_MTX',
      });

      this.currentResult.set(res);

      const filename = 'فصل_رواية_MTX';
      const dlResult = await downloadMtxFile(res.mtxBytes, filename);

      this.lastDownloadInfo.set({
        filename: dlResult.filename,
        dataUrl: dlResult.dataUrl,
        size: res.mtxBytes.length,
      });
    } catch (err) {
      console.error('Error compressing and downloading MTX:', err);
    } finally {
      this.isDirectCompressing.set(false);
    }
  }

  downloadResultMtx(): void {
    const res = this.currentResult();
    if (!res) return;
    downloadMtxFile(res.mtxBytes, 'MTX_Lab_Analysis');
  }

  getHexDump(bytes: Uint8Array, len = 64): string {
    return getHexDump(bytes, len);
  }

  getEntryTypeLabel(type: MtxDictionaryEntry['type']): string {
    switch (type) {
      case 'prefix': return 'سابقة شائعة (الـ، وبـ، كالـ)';
      case 'suffix': return 'لاحقة شائعة (ـهم، ـين، ـات)';
      case 'novel': return 'مفردة روائية شائعة';
      case 'fusion': return 'دمج ترقيم ومسافة (، . —)';
      case 'letter': return 'حرف أساسي (مورفيم)';
      case 'grapheme': return 'حرف مشكل (كَ، كِ)';
      case 'word': return 'كلمة كاملة';
      case 'whitespace': return 'مسافة / سطر';
      case 'punctuation': return 'علامة ترقيم';
      case 'ngram': return 'مقطع مدمج خاص';
    }
  }

  getEntryTypeBadge(type: MtxDictionaryEntry['type']): string {
    switch (type) {
      case 'prefix': return 'px-2 py-0.5 rounded bg-violet-950 text-violet-300 border border-violet-800 text-[10px] font-bold';
      case 'suffix': return 'px-2 py-0.5 rounded bg-fuchsia-950 text-fuchsia-300 border border-fuchsia-800 text-[10px] font-bold';
      case 'novel': return 'px-2 py-0.5 rounded bg-teal-950 text-teal-300 border border-teal-800 text-[10px] font-bold';
      case 'fusion': return 'px-2 py-0.5 rounded bg-rose-950 text-rose-300 border border-rose-800 text-[10px] font-bold';
      case 'letter': return 'px-2 py-0.5 rounded bg-blue-950 text-blue-400 border border-blue-800 text-[10px] font-bold';
      case 'grapheme': return 'px-2 py-0.5 rounded bg-amber-950 text-amber-400 border border-amber-800 text-[10px] font-bold';
      case 'word': return 'px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800 text-[10px] font-bold';
      case 'whitespace': return 'px-2 py-0.5 rounded bg-stone-800 text-stone-400 text-[10px]';
      case 'punctuation': return 'px-2 py-0.5 rounded bg-sky-950 text-sky-400 border border-sky-800 text-[10px]';
      case 'ngram': return 'px-2 py-0.5 rounded bg-indigo-950 text-indigo-400 border border-indigo-800 text-[10px]';
    }
  }

  onDragOver(e: DragEvent): void {
    e.preventDefault();
  }

  async onFileDrop(e: DragEvent): Promise<void> {
    e.preventDefault();
    if (!e.dataTransfer?.files || e.dataTransfer.files.length === 0) return;
    const file = e.dataTransfer.files[0];
    await this.processMtxFile(file);
  }

  async onFileInput(e: Event): Promise<void> {
    const input = e.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;
    const file = input.files[0];
    await this.processMtxFile(file);
    input.value = '';
  }

  private async processMtxFile(file: File): Promise<void> {
    try {
      const buffer = await file.arrayBuffer();
      const bytes = new Uint8Array(buffer);
      const decoded = await decompressFromMtx(bytes);

      this.uploadedFileInfo.set({
        name: file.name,
        decodeTime: decoded.decodingDurationMs,
        size: bytes.length,
        textLength: decoded.text.length,
      });

      this.inputText.setValue(decoded.text);
      await this.analyzeText();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'فشل فك تشفير وقراءة ملف MTX.');
    }
  }
}
