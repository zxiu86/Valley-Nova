import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { NovelStore } from '../core/novel-store';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-novel-editor',
  imports: [ReactiveFormsModule, MatIconModule],
  template: `
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 text-stone-100">
      
      <!-- Studio Header -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-rose-500/20 pb-5">
        <div>
          <div class="flex items-center gap-2 text-xs text-rose-400 font-semibold">
            <span>استوديو كتابة الروايات</span>
            <span aria-hidden="true">·</span>
            <span>مقاتل الروايات</span>
          </div>
          <h1 class="text-2xl sm:text-3xl font-bold font-amiri text-white mt-1">
            كتابة ونشر فصل جديد
          </h1>
          <p class="text-xs text-stone-400 mt-1 max-w-xl">
            أضف فصلاً جديداً لرواية قائمة أو أنشئ عملاً أدبياً جديداً. يتم حفظ النصوص محلياً مع دعم كامل لكافة حركات التشكيل.
          </p>
        </div>

        <!-- Action Button -->
        <div class="flex items-center gap-3">
          <button
            type="button"
            (click)="publishChapter()"
            [disabled]="editorForm.invalid || isProcessing()"
            class="flex items-center gap-2 px-6 py-2.5 rounded-2xl bg-gradient-to-r from-rose-600 to-red-700 hover:from-rose-500 hover:to-red-600 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs sm:text-sm font-bold shadow-lg shadow-rose-950/60 transition-all cursor-pointer"
          >
            <mat-icon class="text-base">publish</mat-icon>
            <span>نشر في المكتبة</span>
          </button>
        </div>
      </div>

      <!-- Live Text Stats Bar -->
      <div class="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div class="p-4 rounded-2xl liquid-glass border border-white/5 space-y-1">
          <span class="text-[11px] text-stone-400 block">إجمالي الكلمات</span>
          <div class="text-xl font-bold font-mono-code text-white">
            {{ getWordCount() }}
          </div>
          <span class="text-[10px] text-stone-500">كلمة عربية</span>
        </div>

        <div class="p-4 rounded-2xl liquid-glass border border-white/5 space-y-1">
          <span class="text-[11px] text-stone-400 block">عدد الأحرف</span>
          <div class="text-xl font-bold font-mono-code text-rose-300">
            {{ editorForm.get('content')?.value?.length || 0 }}
          </div>
          <span class="text-[10px] text-stone-500">حرف مع الحركات</span>
        </div>

        <div class="p-4 rounded-2xl liquid-glass border border-white/5 space-y-1">
          <span class="text-[11px] text-stone-400 block">وقت القراءة التقريبي</span>
          <div class="text-xl font-bold font-mono-code text-amber-400">
            {{ getReadingTime() }} دقيقة
          </div>
          <span class="text-[10px] text-stone-500">بمعدل 200 كلمة/دقيقة</span>
        </div>

        <div class="p-4 rounded-2xl liquid-glass border border-white/5 space-y-1">
          <span class="text-[11px] text-stone-400 block">حالة النص</span>
          <div class="text-sm font-bold text-emerald-400 flex items-center gap-1.5 pt-1">
            <mat-icon class="text-base text-emerald-400">check_circle</mat-icon>
            <span>{{ editorForm.valid ? 'جاهز للنشر' : 'في انتظار الإكمال' }}</span>
          </div>
          <span class="text-[10px] text-stone-500">حفظ تلقائي محلي</span>
        </div>
      </div>

      <!-- Main Editor Form -->
      <form [formGroup]="editorForm" class="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        <!-- Left: Text Area (Main Editor) -->
        <div class="lg:col-span-2 space-y-4">
          
          <div class="space-y-2">
            <div class="flex items-center justify-between">
              <label for="chapter-content-area" class="text-xs font-semibold text-stone-300">
                محتوى الفصل (يدعم التشكيل والحركات):
              </label>

              <button
                type="button"
                (click)="loadSampleText()"
                class="text-xs text-rose-400 hover:text-rose-300 flex items-center gap-1 cursor-pointer"
              >
                <mat-icon class="text-sm">auto_stories</mat-icon>
                <span>إدراج نص تجريبي</span>
              </button>
            </div>

            <textarea
              id="chapter-content-area"
              formControlName="content"
              rows="18"
              placeholder="اكتب هنا فصل روايتك بالعربية... يمكنك كتابة الحوارات وتنسيق الفقرات والحركات بدقة تامة..."
              class="w-full bg-stone-900/90 text-stone-100 border border-stone-800 focus:border-rose-500 focus:ring-1 focus:ring-rose-500 rounded-2xl p-5 font-amiri text-lg leading-loose resize-y shadow-inner focus:outline-none placeholder:text-stone-600"
            ></textarea>

            @if (editorForm.get('content')?.touched && editorForm.get('content')?.invalid) {
              <p class="text-xs text-rose-400 mt-1">يجب كتابة محتوى الفصل (10 أحرف على الأقل).</p>
            }
          </div>

        </div>

        <!-- Right: Chapter & Novel Metadata Sidebar -->
        <div class="space-y-5">
          
          <div class="p-6 liquid-glass rounded-3xl border border-rose-500/20 space-y-4 shadow-xl">
            <h3 class="text-base font-bold font-amiri text-white flex items-center gap-2">
              <mat-icon class="text-rose-400">bookmark</mat-icon>
              <span>بيانات الرواية والفصل</span>
            </h3>

            <!-- Novel Destination -->
            <div class="space-y-1">
              <label for="novel-select-control" class="text-xs text-stone-300 block">إضافة إلى رواية:</label>
              <select
                id="novel-select-control"
                formControlName="novelId"
                class="w-full bg-stone-950 border border-stone-800 rounded-xl px-3 py-2 text-xs text-stone-200 focus:border-rose-500 focus:outline-none"
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
                  class="w-full bg-stone-950 border border-stone-800 rounded-xl px-3 py-2 text-xs text-stone-100 focus:border-rose-500 focus:outline-none"
                />
              </div>

              <div class="space-y-1">
                <label for="author-control" class="text-xs text-stone-300 block">اسم المؤلف:</label>
                <input
                  id="author-control"
                  type="text"
                  formControlName="author"
                  placeholder="اسم المؤلف"
                  class="w-full bg-stone-950 border border-stone-800 rounded-xl px-3 py-2 text-xs text-stone-100 focus:border-rose-500 focus:outline-none"
                />
              </div>

              <div class="space-y-1">
                <label for="translator-control" class="text-xs text-stone-300 block">اسم المترجم (اختياري):</label>
                <input
                  id="translator-control"
                  type="text"
                  formControlName="translator"
                  placeholder="اتركه فارغاً إذا كان عملاً عربياً أصلياً"
                  class="w-full bg-stone-950 border border-stone-800 rounded-xl px-3 py-2 text-xs text-stone-100 focus:border-rose-500 focus:outline-none"
                />
              </div>

              <div class="space-y-1">
                <label for="category-control" class="text-xs text-stone-300 block">تصنيف الرواية:</label>
                <input
                  id="category-control"
                  type="text"
                  formControlName="category"
                  placeholder="مثال: فانتازيا ملحمية، غموض، تاريخ"
                  class="w-full bg-stone-950 border border-stone-800 rounded-xl px-3 py-2 text-xs text-stone-100 focus:border-rose-500 focus:outline-none"
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
                placeholder="مثال: الفصل الأول: لقاء عند الفجر"
                class="w-full bg-stone-950 border border-stone-800 rounded-xl px-3 py-2 text-xs text-stone-100 focus:border-rose-500 focus:outline-none"
              />
            </div>

            <!-- Submit Button Inside Sidebar -->
            <div class="pt-3">
              <button
                type="button"
                (click)="publishChapter()"
                [disabled]="editorForm.invalid || isProcessing()"
                class="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-rose-600 hover:bg-rose-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold text-xs shadow-md transition-all cursor-pointer"
              >
                <mat-icon class="text-base">publish</mat-icon>
                <span>نشر والانتقال للقراءة</span>
              </button>
            </div>

          </div>

        </div>

      </form>

    </div>
  `,
})
export class NovelEditor {
  readonly store = inject(NovelStore);
  private readonly router = inject(Router);

  readonly isProcessing = signal<boolean>(false);

  readonly editorForm = new FormGroup({
    novelId: new FormControl<string>('new', { nonNullable: true, validators: [Validators.required] }),
    novelTitle: new FormControl<string>('رواية جديدة', { nonNullable: true }),
    author: new FormControl<string>('الكاتب', { nonNullable: true }),
    translator: new FormControl<string>('الأصل العربي', { nonNullable: true }),
    category: new FormControl<string>('أدب وروائع', { nonNullable: true }),
    chapterTitle: new FormControl<string>('الفصل الأول', { nonNullable: true, validators: [Validators.required] }),
    content: new FormControl<string>('', { nonNullable: true, validators: [Validators.required, Validators.minLength(10)] }),
  });

  constructor() {
    const selected = this.store.selectedNovel();
    if (selected) {
      this.editorForm.patchValue({
        novelId: selected.id,
        chapterTitle: `الفصل ${selected.chapters.length + 1}`,
      });
    }

    this.loadSampleText();
  }

  getWordCount(): number {
    const text = this.editorForm.get('content')?.value || '';
    return text.trim().split(/\s+/).filter(Boolean).length;
  }

  getReadingTime(): number {
    const words = this.getWordCount();
    return Math.max(1, Math.ceil(words / 200));
  }

  loadSampleText(): void {
    this.editorForm.patchValue({
      content: `كَانَ الكَاتِبُ كَرِيمٌ يَقِفُ عِنْدَ نَافِذَةِ مَكْتَبِهِ القَدِيمِ، يَنْظُرُ إِلَى الأُفُقِ البَعِيدِ، وَفِي يَدِهِ كِتَابٌ أَصْفَرُ الوَرَقِ.
كَانَ يُرَدِّدُ فِي سِرِّهِ: «كَمْ مِنْ كَلِمَةٍ كَتَبَهَا كَاتِبٌ فَكَانَتْ كَالنُّورِ لِمَنْ يَقْرَأُ، وَكَمْ مِنْ كِتَابٍ أَنَارَ كَوْنًا كَانَ غَارِقًا فِي العَتَمَةِ».

كَرِيمٌ كَانَ يُدْرِكُ أَنَّ اللُّغَةَ العَرَبِيَّةَ رُوحٌ تَنْبِضُ بِالحَرَكَاتِ؛ وَالتَّشْكِيلُ هُوَ الرَّوْنَقُ الَّذِي يَحْفَظُ حَقَّ كُلِّ حَرْفٍ.
مَضَتِ السَّاعَاتُ وَهُوَ يَدُونُ فِي كُرَّاسَتِهِ دُرُوسَ الأَيَّامِ وَحِكَايَاتِ العَابِرِينَ، مُتَيَقِّنًا أَنَّ الأَدَبَ هُوَ الأَثَرُ البَاقِي.`,
    });
  }

  async publishChapter(): Promise<void> {
    if (this.editorForm.invalid || this.isProcessing()) return;

    this.isProcessing.set(true);
    try {
      const val = this.editorForm.getRawValue();
      const novelId = val.novelId === 'new' ? `novel-${Date.now()}` : val.novelId;
      await this.store.publishChapter(
        novelId,
        val.chapterTitle,
        val.content,
        {
          title: val.novelTitle,
          author: val.author,
          category: val.category,
          description: `رواية ${val.novelTitle} بقلم ${val.author}`,
        }
      );

      this.router.navigate(['/reader']);
    } catch (err) {
      console.error('Error publishing chapter:', err);
    } finally {
      this.isProcessing.set(false);
    }
  }
}
