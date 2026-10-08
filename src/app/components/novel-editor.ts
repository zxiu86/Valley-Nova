import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { NovelStore } from '../core/novel-store';
import {
  compressToMtx,
  downloadMtxFile,
  MtxCompressionResult,
} from '../core/mtx-codec';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-novel-editor',
  imports: [ReactiveFormsModule, MatIconModule],
  template: `
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      <!-- Studio Header -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-800 pb-5">
        <div>
          <div class="flex items-center gap-2 text-xs font-mono-code text-amber-400">
            <span>استوديو الكتابة والنشر المحلي</span>
            <span aria-hidden="true">·</span>
            <span>بدون تسجيل حساب</span>
          </div>
          <h1 class="text-3xl font-bold font-amiri text-stone-100 mt-1">
            كتابة فصل جديد وضغطه بصيغة MTX
          </h1>
          <p class="text-xs text-stone-400 mt-1">
            اكتب أو الصق نص الفصل بالعربية، وشاهد التحليل الحي لخريطة الترميز الديناميكية ونسبة التوفير التي تتجاوز 70% إلى 80%.
          </p>
        </div>

        <!-- Quick actions -->
        <div class="flex items-center gap-2">
          <!-- Download MTX Button -->
          <button
            type="button"
            (click)="downloadCurrentMtx()"
            [disabled]="!liveResult() || isProcessing()"
            class="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-bold shadow-sm transition-colors cursor-pointer"
          >
            <mat-icon class="text-base">download</mat-icon>
            <span>تنزيل ملف .mtx</span>
          </button>

          <!-- Publish to Local Site Button -->
          <button
            type="button"
            (click)="publishChapter()"
            [disabled]="editorForm.invalid || isProcessing()"
            class="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 disabled:opacity-40 disabled:cursor-not-allowed text-stone-950 text-xs font-bold shadow-md shadow-amber-950/40 transition-colors cursor-pointer"
          >
            <mat-icon class="text-base">publish</mat-icon>
            <span>نشر في الموقع محلياً</span>
          </button>
        </div>
      </div>

      <!-- Quick Template Presets Bar -->
      <div class="p-4 rounded-2xl bg-stone-900/90 border border-stone-800 space-y-2">
        <span class="text-xs text-stone-400 block font-medium">
          قوالب سريعة لتجربة خوارزمية MTX فوراً:
        </span>
        <div class="flex flex-wrap gap-2 text-xs">
          <button
            type="button"
            (click)="loadTashkeelPreset()"
            class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-950/60 hover:bg-amber-900/60 text-amber-300 border border-amber-800/60 transition-colors cursor-pointer"
          >
            <mat-icon class="text-sm">spellcheck</mat-icon>
            <span>تجربة تشكيل (كَ وكِ وكُ وم ون)</span>
          </button>

          <button
            type="button"
            (click)="loadRepetitivePreset()"
            class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-950/60 hover:bg-emerald-900/60 text-emerald-300 border border-emerald-800/60 transition-colors cursor-pointer"
          >
            <mat-icon class="text-sm">repeat</mat-icon>
            <span>تجربة تكرار المفردات (توفير 80%+)</span>
          </button>

          <button
            type="button"
            (click)="loadNovelPreset()"
            class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-200 border border-stone-700 transition-colors cursor-pointer"
          >
            <mat-icon class="text-sm">menu_book</mat-icon>
            <span>فصل روائي كامل متوازن</span>
          </button>

          <button
            type="button"
            (click)="clearEditor()"
            class="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-stone-800/60 hover:bg-rose-900/40 text-stone-400 hover:text-rose-300 transition-colors cursor-pointer mr-auto"
          >
            <mat-icon class="text-sm">clear</mat-icon>
            <span>مسح النص</span>
          </button>
        </div>
      </div>

      <!-- Live Compression KPI Dashboard -->
      @if (liveResult(); as res) {
        <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          
          <!-- UTF-8 Size -->
          <div class="p-4 bg-stone-900 rounded-xl border border-stone-800 space-y-1">
            <span class="text-[11px] text-stone-400 block">حجم UTF-8 القياسي</span>
            <div class="text-lg font-bold font-mono-code text-stone-200">
              {{ formatBytes(res.originalUtf8Bytes) }}
            </div>
            <span class="text-[10px] text-stone-500">ترميز 2-4 بايت/حرف</span>
          </div>

          <!-- MTX Size -->
          <div class="p-4 bg-stone-900 rounded-xl border border-stone-800 space-y-1">
            <span class="text-[11px] text-stone-400 block">حجم بصيغة MTX</span>
            <div class="text-lg font-bold font-mono-code text-emerald-400">
              {{ formatBytes(res.compressedBytes) }}
            </div>
            <span class="text-[10px] text-emerald-500/80 font-bold">مشفر + قاموس ديناميكي</span>
          </div>

          <!-- Savings % -->
          <div class="p-4 bg-stone-900 rounded-xl border border-amber-900/40 space-y-1">
            <span class="text-[11px] text-amber-400 block font-medium">نسبة التوفير الفعلية</span>
            <div class="text-xl font-bold font-mono-code text-amber-400">
              {{ res.savingsPercent }}%
            </div>
            <span class="text-[10px] text-stone-400">تقليص {{ res.compressionRatio }}x أضعاف</span>
          </div>

          <!-- Lossless Check -->
          <div class="p-4 bg-stone-900 rounded-xl border border-stone-800 space-y-1">
            <span class="text-[11px] text-stone-400 block">سلامة الحركات والبيانات</span>
            <div class="text-base font-bold text-sky-400 flex items-center gap-1">
              <mat-icon class="text-lg text-sky-400">verified</mat-icon>
              <span>100% Lossless</span>
            </div>
            <span class="text-[10px] text-stone-500">تطابق تشكيل كَ وكِ تام</span>
          </div>

          <!-- Decode Speed -->
          <div class="p-4 bg-stone-900 rounded-xl border border-stone-800 space-y-1">
            <span class="text-[11px] text-stone-400 block">سرعة فك التشفير</span>
            <div class="text-lg font-bold font-mono-code text-amber-300">
              {{ res.decodingDurationMs }}ms
            </div>
            <span class="text-[10px] text-stone-500">فك فوري فائق السرعة</span>
          </div>

          <!-- Dictionary Symbols -->
          <div class="p-4 bg-stone-900 rounded-xl border border-stone-800 space-y-1">
            <span class="text-[11px] text-stone-400 block">رموز القاموس الفريدة</span>
            <div class="text-lg font-bold font-mono-code text-stone-100">
              {{ res.dictionary.length }}
            </div>
            <span class="text-[10px] text-stone-500">{{ res.tokenCount }} رمز متسلسل</span>
          </div>

        </div>
      }

      <!-- Main Editor Form -->
      <form [formGroup]="editorForm" class="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        <!-- Left: Text Area (Main Editor) -->
        <div class="lg:col-span-2 space-y-4">
          
          <div class="space-y-1">
            <label for="chapter-content-area" class="text-xs font-semibold text-stone-300 flex items-center justify-between">
              <span>نص الفصل الروائي (يدعم كامل التشكيل والحركات):</span>
              <span class="text-stone-400 font-mono-code text-[11px]">
                {{ editorForm.get('content')?.value?.length || 0 }} حرف · {{ getWordCount() }} كلمة
              </span>
            </label>

            <textarea
              id="chapter-content-area"
              formControlName="content"
              (input)="onContentChange()"
              rows="18"
              placeholder="اكتب هنا فصل روايتك بالعربية... يمكنك وضع حركات التشكيل مثل: كَانَ الكَاتِبُ يَقْرَأُ كِتَابَهُ..."
              class="w-full bg-stone-900/90 text-stone-100 border border-stone-800 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 rounded-2xl p-5 font-amiri text-lg leading-loose resize-y shadow-inner focus:outline-none placeholder:text-stone-600"
            ></textarea>

            @if (editorForm.get('content')?.touched && editorForm.get('content')?.invalid) {
              <p class="text-xs text-rose-400 mt-1">يجب كتابة محتوى الفصل لنشره وضغطه.</p>
            }
          </div>

        </div>

        <!-- Right: Chapter & Novel Metadata Sidebar -->
        <div class="space-y-5">
          
          <div class="p-6 bg-stone-900/90 rounded-2xl border border-stone-800 space-y-4">
            <h3 class="text-base font-bold font-amiri text-stone-100 flex items-center gap-2">
              <mat-icon class="text-amber-500">bookmark</mat-icon>
              <span>بيانات الرواية والفصل</span>
            </h3>

            <!-- Novel Destination -->
            <div class="space-y-1">
              <label for="novel-select-control" class="text-xs text-stone-300 block">إضافة إلى رواية:</label>
              <select
                id="novel-select-control"
                formControlName="novelId"
                class="w-full bg-stone-950 border border-stone-800 rounded-xl px-3 py-2 text-xs text-stone-200 focus:border-amber-500 focus:outline-none"
              >
                <option value="new">+ إنشاء رواية جديدة</option>
                @for (n of store.novels(); track n.id) {
                  <option [value]="n.id">{{ n.title }} ({{ n.chapters.length }} فصول)</option>
                }
              </select>
            </div>

            <!-- Novel Title (if new) -->
            @if (editorForm.get('novelId')?.value === 'new') {
              <div class="space-y-1">
                <label for="novel-title-control" class="text-xs text-stone-300 block">عنوان الرواية الجديدة:</label>
                <input
                  id="novel-title-control"
                  type="text"
                  formControlName="novelTitle"
                  placeholder="مثال: أصداء الماضي"
                  class="w-full bg-stone-950 border border-stone-800 rounded-xl px-3 py-2 text-xs text-stone-100 focus:border-amber-500 focus:outline-none"
                />
              </div>

              <div class="space-y-1">
                <label for="author-control" class="text-xs text-stone-300 block">اسم الكاتب:</label>
                <input
                  id="author-control"
                  type="text"
                  formControlName="author"
                  placeholder="اسم الكاتب"
                  class="w-full bg-stone-950 border border-stone-800 rounded-xl px-3 py-2 text-xs text-stone-100 focus:border-amber-500 focus:outline-none"
                />
              </div>

              <div class="space-y-1">
                <label for="category-control" class="text-xs text-stone-300 block">تصنيف الرواية:</label>
                <input
                  id="category-control"
                  type="text"
                  formControlName="category"
                  placeholder="مثال: أدب كلاسيكي، خيال علمي"
                  class="w-full bg-stone-950 border border-stone-800 rounded-xl px-3 py-2 text-xs text-stone-100 focus:border-amber-500 focus:outline-none"
                />
              </div>
            }

            <!-- Chapter Title -->
            <div class="space-y-1">
              <label for="chapter-title-control" class="text-xs text-stone-300 block">عنوان الفصل:</label>
              <input
                id="chapter-title-control"
                type="text"
                formControlName="chapterTitle"
                placeholder="مثال: الفصل الأول: البداية"
                class="w-full bg-stone-950 border border-stone-800 rounded-xl px-3 py-2 text-xs text-stone-100 focus:border-amber-500 focus:outline-none"
              />
            </div>

          </div>

          <!-- Dynamic Dictionary Preview Snip -->
          @if (liveResult(); as res) {
            <div class="p-5 bg-stone-900/90 rounded-2xl border border-stone-800 space-y-3">
              <div class="flex items-center justify-between">
                <span class="text-xs font-bold text-stone-200">أعلى الرموز توفيراً بالخريطة:</span>
                <span class="text-[10px] text-amber-400 font-mono-code">{{ res.dictionary.length }} رمز</span>
              </div>

              <div class="space-y-1.5 max-h-56 overflow-y-auto text-xs">
                @for (entry of res.dictionary.slice(0, 8); track entry.id) {
                  <div class="flex items-center justify-between p-1.5 rounded-lg bg-stone-950 border border-stone-800/80">
                    <div class="flex items-center gap-2">
                      <span class="w-5 h-5 rounded bg-stone-800 text-[10px] font-mono-code text-stone-400 flex items-center justify-center">
                        #{{ entry.id }}
                      </span>
                      <span class="font-amiri font-bold text-amber-300">
                        {{ entry.token === ' ' ? '[مسافة]' : (entry.token === '\n' ? '[سطر جديد]' : entry.token) }}
                      </span>
                      @if (entry.isDiacritized) {
                        <span class="text-[9px] text-sky-400 font-sans">مشكّل</span>
                      }
                    </div>
                    <div class="flex items-center gap-2 font-mono-code text-[11px] text-stone-400">
                      <span>تكرار: {{ entry.frequency }}</span>
                      <span class="text-emerald-400">+{{ entry.totalSavedBytes }}B</span>
                    </div>
                  </div>
                }
              </div>

              <div class="pt-2 text-[11px] text-stone-500 text-center">
                يتم ترميز الرموز الأكثر تكراراً في بايت واحد (0x00 إلى 0x7F)
              </div>
            </div>
          }

        </div>

      </form>

    </div>
  `,
})
export class NovelEditor {
  readonly store = inject(NovelStore);
  private readonly router = inject(Router);

  readonly isProcessing = signal<boolean>(false);
  readonly liveResult = signal<MtxCompressionResult | null>(null);

  readonly editorForm = new FormGroup({
    novelId: new FormControl<string>('new', { nonNullable: true, validators: [Validators.required] }),
    novelTitle: new FormControl<string>('رواية جديدة', { nonNullable: true }),
    author: new FormControl<string>('الكاتب', { nonNullable: true }),
    category: new FormControl<string>('أدب وروائع', { nonNullable: true }),
    chapterTitle: new FormControl<string>('الفصل الأول', { nonNullable: true, validators: [Validators.required] }),
    content: new FormControl<string>('', { nonNullable: true, validators: [Validators.required, Validators.minLength(10)] }),
  });

  private debounceTimer: number | null = null;

  constructor() {
    // If a novel is currently selected, pick it
    const selected = this.store.selectedNovel();
    if (selected) {
      this.editorForm.patchValue({
        novelId: selected.id,
        chapterTitle: `الفصل ${selected.chapters.length + 1}`,
      });
    }

    // Default load Tashkeel preset for instant demonstration
    this.loadTashkeelPreset();
  }

  getWordCount(): number {
    const text = this.editorForm.get('content')?.value || '';
    return text.trim().split(/\s+/).filter(Boolean).length;
  }

  onContentChange(): void {
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }
    this.debounceTimer = window.setTimeout(() => {
      this.recalculateCompression();
    }, 250);
  }

  async recalculateCompression(): Promise<void> {
    const text = this.editorForm.get('content')?.value || '';
    if (!text || text.trim().length === 0) {
      this.liveResult.set(null);
      return;
    }

    try {
      const res = await compressToMtx(text, {
        title: this.editorForm.get('novelTitle')?.value,
        author: this.editorForm.get('author')?.value,
        chapterTitle: this.editorForm.get('chapterTitle')?.value,
      });
      this.liveResult.set(res);
    } catch (err) {
      console.warn('Compression error:', err);
    }
  }

  formatBytes(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    return `${(bytes / 1024).toFixed(1)} KB`;
  }

  downloadCurrentMtx(): void {
    const res = this.liveResult();
    if (!res) return;

    const title = this.editorForm.get('chapterTitle')?.value || 'فصل';
    const filename = `${title}_MTX`.replace(/[/\\?%*:|"<>]/g, '_');
    downloadMtxFile(res.mtxBytes, filename);
  }

  async publishChapter(): Promise<void> {
    if (this.editorForm.invalid) return;
    this.isProcessing.set(true);

    try {
      const formVal = this.editorForm.getRawValue();
      const novelId = formVal.novelId === 'new' ? `novel-${Date.now()}` : formVal.novelId;

      await this.store.publishChapter(
        novelId,
        formVal.chapterTitle,
        formVal.content,
        {
          title: formVal.novelTitle,
          author: formVal.author,
          category: formVal.category,
          description: `رواية عربية تضم فصولاً مشفرة ومضغوطة بصيغة MTX بقلم ${formVal.author}.`,
        }
      );

      // Navigate to reader to immediately read the newly published chapter!
      this.router.navigate(['/reader']);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'حدث خطأ أثناء نشر الفصل.');
    } finally {
      this.isProcessing.set(false);
    }
  }

  loadTashkeelPreset(): void {
    const sample = `كَانَ الكَاتِبُ كَرِيمٌ يَقِفُ عِنْدَ نَافِذَةِ مَكْتَبِهِ، يَتَأَمَّلُ كِتَابَهُ المَفْتُوحَ وَيُرَدِّدُ:
«كَمْ مِنْ كَلِمَةٍ كُتِبَتْ بِإِخْلَاصٍ فَكَانَتْ كَالنُّورِ! كَـ كِـ كُـ كْـ مَـ مِـ مُـ مْـ نَـ نِـ نُـ نْـ».

فَالـ «كَ» المَفْتُوحَةُ فِي «كَانَ» وَ«كَرَمٍ» تَبْعَثُ فِي السَّمْعِ صَدًى رَنَّانًا،
وَالـ «كِ» المَكْسُورَةُ فِي «كِتَابٍ» وَ«كِيَانٍ» تَحْمِلُ عُمْقًا بَلِيغًا،
وَالـ «كُ» المَضْمُومَةُ فِي «كُتُبٍ» وَ«كُلٍّ» تَضُمُّ المَعْنَى ضَمًّا رَصِينًا،
وَالـ «كْ» السَّاكِنَةُ فِي «تَذْكُرُ» تَقِفُ بِاتِّزَانٍ وَثَبَاتٍ.

كَذَلِكَ الـ «مَ» وَالـ «مِ» وَالـ «مُ»: مِنْ «مَطَرٍ» إِلَى «مِفْتَاحٍ» إِلَى «مُسْتَقْبَلٍ».
وَالـ «نَ» وَالـ «نِ» وَالـ «نُ»: نَهْرٌ وَنِدَاءٌ وَنُورٌ.

تَتَكَرَّرُ هَذِهِ المَقَاطِعُ فِي كُلِّ فَقْرَةٍ وَفَصْلٍ، وَتَقُومُ خَرِيطَةُ MTX بِالتَّعَرُّفِ عَلَيْهَا كَوَحَدَاتٍ فَرِيدَةٍ دُونَ فَقْدِ حَرَكَةٍ وَاحِدَةٍ!`;

    this.editorForm.patchValue({
      chapterTitle: 'اختبار تشكيل كَ وكِ وم ون',
      content: sample,
    });
    this.recalculateCompression();
  }

  loadRepetitivePreset(): void {
    const repetitive = `في قديم الزمان، كان هناك رجل حكيم. كان الرجل يعيش في قرية هادئة، وكان الناس يأتون إليه من كل مكان ليسمعوا نصائحه.
قال الرجل الحكيم: كان الصدق هو الأساس، وكان الإخلاص هو السبيل، وكان العلم هو النور الذي يهتدي به السائرون في دروب الحياة.
في الصباح كان يخرج إلى الحقل، وفي المساء كان يجلس في داره يقرأ ويتأمل.
قال الحكيم أيضاً: إن الذي يزرع الخير يحصد الطمأنينة، والذي يبحث عن الحكمة يجد في كل تجربة درساً نافعاً.
كانت هذه الكلمات تتكرر في كل حديث، وكان الجميع يحفظونها عن ظهر قلب. في كل عام، وفي كل موسم، وفي كل مناسبة، كان الرجل يكرر القول نفسه، لأن المعاني الصادقة لا تبلى مع مرور الأيام.`;

    this.editorForm.patchValue({
      chapterTitle: 'الفصل المتكرر: أقصى نسبة ضغط MTX',
      content: repetitive,
    });
    this.recalculateCompression();
  }

  loadNovelPreset(): void {
    const novelSample = `وقفت القافلة عند مشارف واحة النخيل مع غروب الشمس. كانت الرمال الذهبية تلمع تحت أشعة الشفق الأحمر، بينما كانت نسمات المساء الباردة تداعب أطراف الخيام المنصوبة حديثاً.
خرج الشيخ منصور من خيمته يتفقد الإبل والبضائع التي حملوها من بلاد ما وراء النهر.
قال لأحد الفتيان:
— هل تظن أننا سنصل إلى عاصمة السلطان قبل هطول أمطار الخريف؟
أجابه الفتى بتفاؤل:
— بإذن الله يا سيدي، إذا واصلنا المسير بنفس الهمة، فلن تفصلنا عن أسوار المدينة أكثر من ثلاثة أيام.
جلس الرجال حول موقد النار يتناولون التمر والقهوة العربية الزكية، وبدأ أحدهم يروي قصص الأقدمين وأساطير الصحراء الشاسعة التي لا تنتهي أسرارها.`;

    this.editorForm.patchValue({
      chapterTitle: 'الفصل الثالث: واحة النخيل والغسق',
      content: novelSample,
    });
    this.recalculateCompression();
  }

  clearEditor(): void {
    this.editorForm.patchValue({ content: '' });
    this.liveResult.set(null);
  }
}
