import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { NovelStore } from '../core/novel-store';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-novel-editor',
  imports: [ReactiveFormsModule],
  template: `
    <div class="max-w-5xl mx-auto px-4 sm:px-6 md:px-12 py-10 space-y-8 bg-[#131315] text-[#e5e1e4]">
      
      <!-- Studio Header -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/[0.08] pb-6">
        <div>
          <div class="flex items-center gap-2 text-xs text-[#e9c349] font-semibold mb-1">
            <span>ديوان الإنشاء والتدوين</span>
            <span>•</span>
            <span>أروقة الخلود</span>
          </div>
          <h1 class="font-noto-serif text-2xl sm:text-3xl font-bold text-white">
            تدوين سفر أو فصل جديد
          </h1>
          <p class="text-xs text-[#debfc2]/70 mt-1 max-w-xl">
            دوّن نصوصك وألحقها بأحد الأروقة الأربعة. يتم ضغط النصوص محلياً بتقنية MTX الفائقة مع الحفاظ الكامل على علامات التشكيل.
          </p>
        </div>

        <div class="flex items-center gap-3">
          <button
            type="button"
            (click)="publishChapter()"
            [disabled]="editorForm.invalid || isProcessing()"
            class="px-6 py-2.5 rounded-xl bg-[#e9c349] hover:bg-[#ffe088] disabled:opacity-40 disabled:cursor-not-allowed text-[#241a00] text-xs font-bold shadow-lg transition-all cursor-pointer flex items-center gap-2"
          >
            <span class="material-symbols-outlined text-[18px]">publish</span>
            <span>نشر في الرواق</span>
          </button>
        </div>
      </div>

      <!-- Live Statistics Cards -->
      <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div class="p-4 rounded-xl bg-[#1c1b1d] border border-white/[0.06]">
          <span class="text-[11px] text-[#debfc2]/60 block mb-1">إجمالي الكلمات</span>
          <div class="text-xl font-bold font-mono text-white">
            {{ getWordCount() }}
          </div>
          <span class="text-[10px] text-[#debfc2]/50">كلمة عربية</span>
        </div>

        <div class="p-4 rounded-xl bg-[#1c1b1d] border border-white/[0.06]">
          <span class="text-[11px] text-[#debfc2]/60 block mb-1">عدد الأحرف</span>
          <div class="text-xl font-bold font-mono text-[#ffb2bd]">
            {{ editorForm.get('content')?.value?.length || 0 }}
          </div>
          <span class="text-[10px] text-[#debfc2]/50">حرف مع التشكيل</span>
        </div>

        <div class="p-4 rounded-xl bg-[#1c1b1d] border border-white/[0.06]">
          <span class="text-[11px] text-[#debfc2]/60 block mb-1">علامات التشكيل</span>
          <div class="text-xl font-bold font-mono text-[#7bd8b1]">
            {{ getDiacriticsCount() }}
          </div>
          <span class="text-[10px] text-[#debfc2]/50">حركة مضبوطة</span>
        </div>

        <div class="p-4 rounded-xl bg-[#1c1b1d] border border-white/[0.06]">
          <span class="text-[11px] text-[#debfc2]/60 block mb-1">توفير MTX التقديري</span>
          <div class="text-xl font-bold font-mono text-[#e9c349]">
            75%+
          </div>
          <span class="text-[10px] text-[#debfc2]/50">ضغط فوري فائق السرعة</span>
        </div>
      </div>

      <!-- Editor Form -->
      <form [formGroup]="editorForm" class="space-y-5 bg-[#1c1b1d]/80 border border-white/[0.08] p-6 rounded-2xl shadow-xl">
        
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div class="space-y-1.5">
            <label for="editor-novel-select" class="text-xs font-semibold text-[#debfc2]">اختر السفر التابع له</label>
            <select
              id="editor-novel-select"
              formControlName="novelId"
              class="w-full px-3.5 py-2.5 rounded-xl bg-[#0e0e10] border border-white/10 text-xs text-white focus:outline-none focus:border-[#e9c349]"
            >
              @for (novel of novelStore.novels(); track novel.id) {
                <option [value]="novel.id">{{ novel.title }} ({{ novel.riwaqName }})</option>
              }
            </select>
          </div>

          <div class="space-y-1.5">
            <label for="editor-chapter-title" class="text-xs font-semibold text-[#debfc2]">عنوان الفصل أو المخطوطة</label>
            <input
              id="editor-chapter-title"
              type="text"
              formControlName="title"
              placeholder="مثال: الفصل الثالث: شروق الحكمة في ديوان الزمان"
              class="w-full px-3.5 py-2.5 rounded-xl bg-[#0e0e10] border border-white/10 text-xs text-white focus:outline-none focus:border-[#e9c349]"
            />
          </div>
        </div>

        <div class="space-y-1.5">
          <label for="editor-chapter-content" class="text-xs font-semibold text-[#debfc2]">متن النص (يقبل كافة الحركات والتشكيل العربي الأصيل)</label>
          <textarea
            id="editor-chapter-content"
            formControlName="content"
            rows="12"
            placeholder="اكتب أو الصق النص هنا..."
            class="w-full px-4 py-3 rounded-xl bg-[#0e0e10] border border-white/10 text-sm leading-relaxed text-white font-amiri focus:outline-none focus:border-[#e9c349]"
          ></textarea>
        </div>

        @if (notice()) {
          <div class="p-3 rounded-xl bg-[#005039]/50 border border-[#7bd8b1]/40 text-xs text-[#7bd8b1]">
            {{ notice() }}
          </div>
        }
      </form>
    </div>
  `,
})
export class NovelEditor {
  readonly novelStore = inject(NovelStore);
  private readonly router = inject(Router);

  readonly isProcessing = signal<boolean>(false);
  readonly notice = signal<string | null>(null);

  readonly editorForm = new FormGroup({
    novelId: new FormControl(this.novelStore.novels()[0]?.id || '', [Validators.required]),
    title: new FormControl('', [Validators.required, Validators.minLength(3)]),
    content: new FormControl('', [Validators.required, Validators.minLength(10)]),
  });

  getWordCount(): number {
    const text = this.editorForm.get('content')?.value || '';
    return text.trim().split(/\s+/).filter(Boolean).length;
  }

  getDiacriticsCount(): number {
    const text = this.editorForm.get('content')?.value || '';
    return (text.match(/[\u064B-\u065F\u0670]/g) || []).length;
  }

  async publishChapter(): Promise<void> {
    if (this.editorForm.invalid) return;
    this.isProcessing.set(true);

    const val = this.editorForm.value;
    const novelId = val.novelId!;
    const title = val.title!;
    const content = val.content!;

    try {
      await this.novelStore.publishChapter(novelId, title, content);
      this.notice.set('تم تشفير الفصل بنجاح عبر خوارزمية MTX وإلحاقه بالسفر!');
      setTimeout(() => {
        this.router.navigate(['/novel', novelId]);
      }, 1500);
    } catch (e) {
      console.error(e);
      this.notice.set('حدث خطأ أثناء تشفير ونشر الفصل.');
    } finally {
      this.isProcessing.set(false);
    }
  }
}
