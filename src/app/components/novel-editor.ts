import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { NovelStore } from '../core/novel-store';
import { AuthStore } from '../core/auth-store';
import { RoleBadge } from './role-badge';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-novel-editor',
  imports: [RouterLink, ReactiveFormsModule, RoleBadge],
  template: `
    <div class="max-w-5xl mx-auto px-4 sm:px-6 md:px-12 py-10 space-y-8 bg-[#131315] text-[#e5e1e4]">
      
      <!-- Studio Header -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/[0.08] pb-6">
        <div>
          <div class="flex items-center gap-2 text-xs text-[#e9c349] font-semibold mb-1">
            <span>ديوان الإنشاء والتدوين الأدبي</span>
            <span>•</span>
            <span>أروقة الخلود</span>
          </div>
          <h1 class="font-noto-serif text-2xl sm:text-3xl font-bold text-white flex items-center gap-2 flex-wrap">
            <span>تدوين سفر أو فصل جديد</span>
            @if (authStore.activeBadge()) {
              <app-role-badge [role]="authStore.activeBadge()" />
            }
          </h1>
          <p class="text-xs text-[#debfc2]/70 mt-1 max-w-xl">
            دوّن نصوصك وألحقها بأحد الأروقة الأربعة. يتم ضغط النصوص محلياً بتقنية MTX الفائقة مع الحفاظ الكامل على علامات التشكيل وحماية حقوق الملكية الفكرية.
          </p>
        </div>

        <div class="flex items-center gap-3">
          <button
            type="button"
            (click)="publishChapter()"
            [disabled]="editorForm.invalid || isProcessing() || !isAuthorized() || isSelectedWorkSuspended()"
            class="px-6 py-2.5 rounded-xl bg-[#e9c349] hover:bg-[#ffe088] disabled:opacity-40 disabled:cursor-not-allowed text-[#241a00] text-xs font-bold shadow-lg transition-all cursor-pointer flex items-center gap-2"
          >
            <span class="material-symbols-outlined text-[18px]">publish</span>
            <span>نشر في الرواق</span>
          </button>
        </div>
      </div>

      <!-- Permission / Role Guard Notice if not Author/Translator/Founder -->
      @if (!isAuthorized()) {
        <div class="p-6 rounded-2xl bg-[#1c1b1d] border border-[#e9c349]/40 shadow-xl space-y-4">
          <div class="flex items-center gap-3 text-[#e9c349]">
            <span class="material-symbols-outlined text-3xl">lock</span>
            <div>
              <h3 class="font-noto-serif text-base font-bold text-white">
                صلاحية النشر والتدوين مقصورة على الكُتّاب والمترجمين المعتمدين
              </h3>
              <p class="text-xs text-[#debfc2]/80 mt-1">
                للحفاظ على جودة الأسفار الأدبية وحماية حقوق النشر، يتطلب التدوين حصولك على رتبة «كاتب» («author») أو «مترجم» («translate») معتمدة من الإدارة.
              </p>
            </div>
          </div>

          <div class="pt-2 flex items-center gap-3">
            <a
              routerLink="/profile"
              class="px-4 py-2 rounded-xl bg-[#e9c349] hover:bg-[#ffe088] text-[#241a00] text-xs font-bold transition-all shadow-md flex items-center gap-1.5"
            >
              <span class="material-symbols-outlined text-[16px]">assignment_ind</span>
              <span>تقديم طلب انضمام ككاتب أو مترجم</span>
            </a>
            <span class="text-[11px] text-[#debfc2]/60">تتم مراجعة الطلبات واعتمادها رسمياً وفق سياسة التوثيق.</span>
          </div>
        </div>
      }

      <!-- Selected Work Suspended Warning -->
      @if (isSelectedWorkSuspended()) {
        <div class="p-5 rounded-2xl bg-[#881337]/30 border border-[#ffb2bd]/50 space-y-2">
          <div class="flex items-center gap-2 text-[#ffb2bd] font-bold text-sm">
            <span class="material-symbols-outlined text-xl">warning</span>
            <span>هذا العمل معلق احترازياً قيد المراجعة والتحقيق</span>
          </div>
          <p class="text-xs text-[#debfc2] leading-relaxed">
            تم تعليق النشر والتعديل على هذا المصنف نظراً لورود تقرير تدقيق بخصوص شبهة حقوق ملكية أو انتحال. لا يمكن إضافة فصول جديدة لحين صدور قرار إداري رسمي يبت في المسألة.
          </p>
        </div>
      }

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
      <form [formGroup]="editorForm" class="space-y-6 bg-[#1c1b1d]/80 border border-white/[0.08] p-6 rounded-2xl shadow-xl">
        
        <!-- Contribution Mode: Author vs Translator -->
        <div class="space-y-2">
          <span class="text-xs font-semibold text-[#debfc2] block">نوع المساهمة الأدبية:</span>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              type="button"
              (click)="setContributionType('author')"
              class="p-3.5 rounded-xl border text-right transition-all cursor-pointer flex items-center justify-between"
              [class.bg-[#af8d11]/20]="contributionType() === 'author'"
              [class.border-[#e9c349]]="contributionType() === 'author'"
              [class.bg-[#0e0e10]]="contributionType() !== 'author'"
              [class.border-white/10]="contributionType() !== 'author'"
            >
              <div class="flex items-center gap-2">
                <span class="material-symbols-outlined text-lg text-[#e9c349]">history_edu</span>
                <div>
                  <span class="text-xs font-bold text-white block">تأليف أصيل (Author)</span>
                  <span class="text-[10px] text-[#debfc2]/60">عمل أدبي أصلي من إبداع الكاتب</span>
                </div>
              </div>
              @if (contributionType() === 'author') {
                <span class="material-symbols-outlined text-sm text-[#e9c349]">check_circle</span>
              }
            </button>

            <button
              type="button"
              (click)="setContributionType('translator')"
              class="p-3.5 rounded-xl border text-right transition-all cursor-pointer flex items-center justify-between"
              [class.bg-[#881337]/30]="contributionType() === 'translator'"
              [class.border-[#ffb2bd]]="contributionType() === 'translator'"
              [class.bg-[#0e0e10]]="contributionType() !== 'translator'"
              [class.border-white/10]="contributionType() !== 'translator'"
            >
              <div class="flex items-center gap-2">
                <span class="material-symbols-outlined text-lg text-[#ffb2bd]">translate</span>
                <div>
                  <span class="text-xs font-bold text-white block">ترجمة أدبية معربة (Translator)</span>
                  <span class="text-[10px] text-[#debfc2]/60">نقل أمين لعمل معتمد بلغة أخرى</span>
                </div>
              </div>
              @if (contributionType() === 'translator') {
                <span class="material-symbols-outlined text-sm text-[#ffb2bd]">check_circle</span>
              }
            </button>
          </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div class="space-y-1.5">
            <label for="editor-novel-select" class="text-xs font-semibold text-[#debfc2]">اختر السفر الأدبي التابع له</label>
            <select
              id="editor-novel-select"
              formControlName="novelId"
              class="w-full px-3.5 py-2.5 rounded-xl bg-[#0e0e10] border border-white/10 text-xs text-white focus:outline-none focus:border-[#e9c349]"
            >
              <option value="__NEW__">➕ إنشاء سفر جديد في الخزانة</option>
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

        <!-- If creating a new novel: extra metadata -->
        @if (editorForm.get('novelId')?.value === '__NEW__') {
          <div class="p-4 rounded-xl bg-[#0e0e10] border border-white/10 space-y-3">
            <span class="text-xs font-bold text-[#e9c349] block">بيانات السفر الجديد:</span>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input
                type="text"
                formControlName="newNovelTitle"
                placeholder="عنوان السفر أو الرواية..."
                class="px-3 py-2 rounded-lg bg-[#1c1b1d] border border-white/10 text-xs text-white"
              />
              <select
                formControlName="riwaqId"
                class="px-3 py-2 rounded-lg bg-[#1c1b1d] border border-white/10 text-xs text-white"
              >
                <option value="riwaq-al-riwayat">رواق الروايات</option>
                <option value="riwaq-al-malahim">رواق الملاحم</option>
                <option value="riwaq-al-hikma">رواق الحكمة</option>
                <option value="riwaq-al-turath">رواق التراث</option>
              </select>
            </div>
          </div>
        }

        <!-- Translator specific metadata -->
        @if (contributionType() === 'translator') {
          <div class="p-4 rounded-xl bg-[#881337]/20 border border-[#ffb2bd]/30 space-y-3">
            <span class="text-xs font-bold text-[#ffb2bd] block">بيانات المصنف الأصلي المنقول عنه:</span>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input
                type="text"
                formControlName="originalWorkTitle"
                placeholder="عنوان العمل الأصلي باللغة المصدر..."
                class="px-3 py-2 rounded-lg bg-[#0e0e10] border border-white/10 text-xs text-white"
              />
              <input
                type="text"
                formControlName="originalAuthor"
                placeholder="اسم المؤلف الأصلي..."
                class="px-3 py-2 rounded-lg bg-[#0e0e10] border border-white/10 text-xs text-white"
              />
            </div>
          </div>
        }

        <!-- Chapter Content -->
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

        <!-- Mandatory Integrity & Copyright Pledges -->
        <div class="p-4 rounded-xl bg-[#0e0e10] border border-white/10 space-y-3">
          @if (contributionType() === 'author') {
            <div class="flex items-start gap-2.5">
              <input
                id="author-pledge"
                type="checkbox"
                formControlName="authorPledge"
                class="mt-1 rounded bg-[#1c1b1d] border-white/20 text-[#e9c349] focus:ring-0 cursor-pointer"
              />
              <label for="author-pledge" class="text-xs text-[#debfc2] leading-relaxed cursor-pointer select-none">
                <strong>إقرار الملكية الفكرية والأصالة:</strong> أقر وأتعهد بأن هذا العمل الأدبي أصيل ومملوك لي بالكامل أو أنني أحوز تراخيص نشره الرسمية، وخالٍ تماماً من الانتحال أو النسخ أو التعدي على حقوق الآخرين، وأتحمل المسؤولية النظامية الكاملة.
              </label>
            </div>
          } @else {
            <div class="flex items-start gap-2.5">
              <input
                id="translator-pledge"
                type="checkbox"
                formControlName="translatorPledge"
                class="mt-1 rounded bg-[#1c1b1d] border-white/20 text-[#ffb2bd] focus:ring-0 cursor-pointer"
              />
              <label for="translator-pledge" class="text-xs text-[#debfc2] leading-relaxed cursor-pointer select-none">
                <strong>ميثاق أمانة الترجمة الأدبية:</strong> أتعهد بنقل العمل بأمانة ودقة تصون المعنى والسياق وهوية الشخصيات وتسلسل الأحداث والنبرة الأصلية، والامتناع عن أي تحريف أو تشويه أو حذف غير مرخص، وبحيازة الأذونات المناسبة للترجمة والنشر.
              </label>
            </div>
          }
        </div>

        @if (notice()) {
          <div class="p-3.5 rounded-xl bg-[#005039]/50 border border-[#7bd8b1]/40 text-xs text-[#7bd8b1] flex items-center gap-2">
            <span class="material-symbols-outlined text-[18px]">check_circle</span>
            <span>{{ notice() }}</span>
          </div>
        }
        @if (errorNotice()) {
          <div class="p-3.5 rounded-xl bg-[#881337]/50 border border-[#ffb2bd]/40 text-xs text-[#ffb2bd] flex items-center gap-2">
            <span class="material-symbols-outlined text-[18px]">error</span>
            <span>{{ errorNotice() }}</span>
          </div>
        }
      </form>
    </div>
  `,
})
export class NovelEditor {
  readonly novelStore = inject(NovelStore);
  readonly authStore = inject(AuthStore);
  private readonly router = inject(Router);

  readonly isProcessing = signal<boolean>(false);
  readonly notice = signal<string | null>(null);
  readonly errorNotice = signal<string | null>(null);
  readonly contributionType = signal<'author' | 'translator'>('author');

  readonly isAuthorized = computed<boolean>(() => {
    return this.authStore.isAuthor() || this.authStore.isTranslator() || this.authStore.isFounder();
  });

  readonly isSelectedWorkSuspended = computed<boolean>(() => {
    const novelId = this.editorForm?.get('novelId')?.value;
    if (!novelId || novelId === '__NEW__') return false;
    const nov = this.novelStore.novels().find(n => n.id === novelId);
    if (!nov) return false;
    const mod = this.novelStore.workModerations()[novelId];
    return nov.status === 'suspended' || nov.status === 'disputed' || mod?.status === 'suspended';
  });

  readonly editorForm = new FormGroup({
    novelId: new FormControl(this.novelStore.novels()[0]?.id || '__NEW__', [Validators.required]),
    title: new FormControl('', [Validators.required, Validators.minLength(3)]),
    content: new FormControl('', [Validators.required, Validators.minLength(10)]),
    newNovelTitle: new FormControl(''),
    riwaqId: new FormControl('riwaq-al-riwayat'),
    originalWorkTitle: new FormControl(''),
    originalAuthor: new FormControl(''),
    authorPledge: new FormControl(false),
    translatorPledge: new FormControl(false),
  });

  setContributionType(type: 'author' | 'translator'): void {
    this.contributionType.set(type);
    if (type === 'author') {
      this.editorForm.patchValue({ translatorPledge: true, authorPledge: false });
    } else {
      this.editorForm.patchValue({ authorPledge: true, translatorPledge: false });
    }
  }

  getWordCount(): number {
    const text = this.editorForm.get('content')?.value || '';
    return text.trim().split(/\s+/).filter(Boolean).length;
  }

  getDiacriticsCount(): number {
    const text = this.editorForm.get('content')?.value || '';
    return (text.match(/[\u064B-\u065F\u0670]/g) || []).length;
  }

  async publishChapter(): Promise<void> {
    if (!this.isAuthorized()) {
      this.errorNotice.set('غير مصرح لك بالنشر. يرجى الحصول على رتبة كاتب أو مترجم.');
      return;
    }

    if (this.isSelectedWorkSuspended()) {
      this.errorNotice.set('هذا العمل معلق حالياً قيد التحقيق ولا يمكن النشر فيه.');
      return;
    }

    const val = this.editorForm.value;
    const isTrans = this.contributionType() === 'translator';

    if (!isTrans && !val.authorPledge) {
      this.errorNotice.set('يجب تأكيد إقرار الملكية الفكرية قبل النشر.');
      return;
    }

    if (isTrans && !val.translatorPledge) {
      this.errorNotice.set('يجب الموافقة على ميثاق أمانة الترجمة وحيازة التراخيص.');
      return;
    }

    this.isProcessing.set(true);
    this.notice.set(null);
    this.errorNotice.set(null);

    let novelId = val.novelId!;
    const title = val.title!;
    const content = val.content!;
    const u = this.authStore.user();

    let riwaqName = 'رواق الروايات';
    if (val.riwaqId === 'riwaq-al-malahim') riwaqName = 'رواق الملاحم';
    if (val.riwaqId === 'riwaq-al-hikma') riwaqName = 'رواق الحكمة';
    if (val.riwaqId === 'riwaq-al-turath') riwaqName = 'رواق التراث';

    const novelMeta = {
      title: novelId === '__NEW__' ? (val.newNovelTitle || 'سفر أدبي جديد') : undefined,
      author: isTrans ? (val.originalAuthor || 'المؤلف الأصلي') : this.authStore.displayName(),
      authorId: !isTrans ? (u?.uid || 'author') : undefined,
      authorAvatar: !isTrans ? this.authStore.photoURL() : undefined,
      translator: isTrans ? this.authStore.displayName() : undefined,
      translatorId: isTrans ? (u?.uid || 'translator') : undefined,
      translatorAvatar: isTrans ? this.authStore.photoURL() : undefined,
      riwaqId: val.riwaqId || 'riwaq-al-riwayat',
      riwaqName,
      isTranslation: isTrans,
      originalWorkTitle: isTrans ? (val.originalWorkTitle || '') : undefined,
      copyrightConfirmed: true,
      status: 'pending_audit' as const,
    };

    if (novelId === '__NEW__') {
      novelId = `novel-${Date.now()}`;
    }

    try {
      await this.novelStore.publishChapter(novelId, title, content, novelMeta);
      this.notice.set('تم ضغط الفصل بنجاح عبر خوارزمية MTX وإحالته لهيئة التدقيق!');
      setTimeout(() => {
        this.router.navigate(['/novel', novelId]);
      }, 1500);
    } catch (e) {
      console.error(e);
      this.errorNotice.set('حدث خطأ أثناء تشفير ونشر الفصل.');
    } finally {
      this.isProcessing.set(false);
    }
  }
}
