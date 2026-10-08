import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { NovelStore } from '../core/novel-store';
import { Novel } from '../core/novel-models';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-novel-library',
  imports: [MatIconModule],
  template: `
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-12">
      
      <!-- Literary Hero Banner -->
      <section class="relative rounded-3xl overflow-hidden bg-gradient-to-br from-stone-900 via-stone-900 to-amber-950/40 border border-stone-800 p-8 sm:p-12 shadow-xl">
        <div class="relative z-10 max-w-3xl space-y-5">
          <div class="flex items-center gap-2 text-xs font-mono-code text-amber-400">
            <span>منظومة القراءة والنشر الذكية</span>
            <span aria-hidden="true">·</span>
            <span>صيغة MTX للضغط والترميز العربي</span>
          </div>

          <h1 class="text-3xl sm:text-5xl font-extrabold text-stone-100 font-amiri leading-tight">
            موقع الروايات العربية المتقدم
            <span class="block text-amber-500 font-bold mt-1 text-2xl sm:text-4xl">
              بصيغة نصوص MTX فائقة الضغط والسرعة
            </span>
          </h1>

          <p class="text-stone-300 text-sm sm:text-base leading-relaxed">
            اقرأ وانشر رواياتك وفصولك الأدبية مجاناً وفورياً دون الحاجة إلى إنشاء حساب أو تسجيل دخول. تم تزويد الموقع بمحرك 
            <strong class="text-amber-300 font-mono-code font-bold">MTX</strong> 
            المبتكر، الذي ينشئ خريطة ترميز ديناميكية متخصصة للنصوص العربية، لتقليص الحجم بنسبة 70% إلى 80% مقارنة بترميز UTF-8 القياسي، مع فك تشفير فوري وضمان الحفاظ الكامل 100% على كافة علامات التشكيل والحركات (كَ، كِ، كُ، كْ، م، ن).
          </p>

          <!-- Banner Stats Grid (Clean text, unboxed) -->
          <div class="pt-2 flex flex-wrap items-center gap-6 text-sm text-stone-300 border-t border-stone-800/80">
            <div>
              <span class="text-xs text-stone-400 block">التوفير مقارنة بـ UTF-8</span>
              <span class="text-xl font-bold font-mono-code text-emerald-400">
                {{ store.globalStats().savingsPercent }}%
              </span>
            </div>
            <div class="w-px h-8 bg-stone-800 hidden sm:block"></div>
            <div>
              <span class="text-xs text-stone-400 block">سرعة فك التشفير</span>
              <span class="text-xl font-bold font-mono-code text-amber-400">فورية (&lt;0.5ms)</span>
            </div>
            <div class="w-px h-8 bg-stone-800 hidden sm:block"></div>
            <div>
              <span class="text-xs text-stone-400 block">دقة الحركات والتشكيل</span>
              <span class="text-xl font-bold text-sky-400 font-sans">تطابق تام 100%</span>
            </div>
            <div class="w-px h-8 bg-stone-800 hidden sm:block"></div>
            <div>
              <span class="text-xs text-stone-400 block">إجمالي الفصول المتاحة</span>
              <span class="text-xl font-bold text-stone-200">{{ store.globalStats().totalChapters }} فصل</span>
            </div>
          </div>

          <!-- Hero Actions -->
          <div class="pt-4 flex flex-wrap items-center gap-3">
            <button
              (click)="openLatestNovel()"
              class="flex items-center gap-2 px-6 py-3 rounded-xl bg-amber-600 hover:bg-amber-500 text-stone-950 font-bold text-sm shadow-lg shadow-amber-950/50 transition-all cursor-pointer"
            >
              <mat-icon class="text-lg">auto_stories</mat-icon>
              <span>ابدأ القراءة الآن</span>
            </button>

            <button
              (click)="goToEditor()"
              class="flex items-center gap-2 px-6 py-3 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 font-medium text-sm border border-stone-700 transition-colors cursor-pointer"
            >
              <mat-icon class="text-lg text-amber-400">edit_note</mat-icon>
              <span>كتابة ونشر فصل جديد</span>
            </button>

            <button
              (click)="goToLab()"
              class="flex items-center gap-2 px-4 py-3 rounded-xl text-stone-300 hover:text-white hover:bg-stone-800/40 text-sm transition-colors cursor-pointer"
            >
              <mat-icon class="text-lg">tune</mat-icon>
              <span>فحص خريطة MTX</span>
            </button>
          </div>
        </div>
      </section>

      <!-- Filter Controls & Section Title -->
      <section class="space-y-6">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-800 pb-4">
          <div>
            <h2 class="text-2xl font-bold text-stone-100 font-amiri flex items-center gap-2">
              <mat-icon class="text-amber-500">book</mat-icon>
              <span>مكتبة الروايات المتاحة</span>
            </h2>
            <p class="text-xs text-stone-400 mt-1">
              اختر أي رواية لقراءتها وفك تشفيرها تلقائياً بصيغة MTX فائقة السرعة
            </p>
          </div>

          <!-- Category Filter Segmented Control -->
          <div class="flex items-center gap-1 p-1 bg-stone-900 rounded-xl border border-stone-800 overflow-x-auto text-xs">
            @for (cat of categories(); track cat.id) {
              <button
                (click)="selectedCategory.set(cat.id)"
                [class]="selectedCategory() === cat.id 
                  ? 'bg-amber-600 text-stone-950 font-bold px-3 py-1.5 rounded-lg shadow-sm' 
                  : 'text-stone-400 hover:text-stone-200 px-3 py-1.5 rounded-lg transition-colors'"
              >
                {{ cat.label }}
              </button>
            }
          </div>
        </div>

        <!-- Novels Grid -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          @for (novel of filteredNovels(); track novel.id) {
            <article class="flex flex-col bg-stone-900/80 rounded-2xl border border-stone-800 overflow-hidden hover:border-stone-700 transition-all duration-200 shadow-md hover:shadow-xl group">
              
              <!-- Book Cover Header Area -->
              <div [class]="'relative p-6 bg-gradient-to-br ' + novel.coverGradient + ' text-white min-h-[160px] flex flex-col justify-between'">
                <div class="flex items-start justify-between">
                  <span class="text-xs text-amber-200/90 font-medium font-sans">
                    {{ novel.category }}
                  </span>
                  
                  <!-- Badges / Compression ratio -->
                  <div class="flex items-center gap-1.5 px-2 py-0.5 rounded bg-black/40 backdrop-blur-sm text-[11px] font-mono-code text-emerald-300 border border-white/10">
                    <mat-icon class="text-xs">compress</mat-icon>
                    <span>{{ getNovelAverageSavings(novel) }}% توفير</span>
                  </div>
                </div>

                <div>
                  <h3 class="text-xl font-bold font-amiri text-stone-100 group-hover:text-amber-300 transition-colors leading-snug">
                    {{ novel.title }}
                  </h3>
                  <p class="text-xs text-stone-300 mt-1 flex items-center gap-1">
                    <span>بقلم:</span>
                    <span class="font-medium text-white">{{ novel.author }}</span>
                  </p>
                </div>
              </div>

              <!-- Novel Metadata & Chapters -->
              <div class="p-5 flex-1 flex flex-col justify-between space-y-4">
                <p class="text-xs text-stone-400 line-clamp-3 leading-relaxed">
                  {{ novel.description }}
                </p>

                <!-- Stats summary (clean unboxed text) -->
                <div class="pt-3 border-t border-stone-800/80 flex items-center justify-between text-xs text-stone-400">
                  <div class="flex items-center gap-1.5">
                    <mat-icon class="text-sm text-stone-500">list_alt</mat-icon>
                    <span>{{ novel.chapters.length }} فصول</span>
                  </div>
                  <div class="flex items-center gap-1.5">
                    <mat-icon class="text-sm text-stone-500">data_usage</mat-icon>
                    <span class="font-mono-code">{{ formatBytes(getNovelMtxTotal(novel)) }} MTX</span>
                  </div>
                  <div class="flex items-center gap-1.5">
                    <mat-icon class="text-sm text-stone-500">bolt</mat-icon>
                    <span>فك فوري</span>
                  </div>
                </div>

                <!-- Chapters List Preview -->
                <div class="space-y-1.5 bg-stone-950/60 p-2.5 rounded-xl border border-stone-800/60 text-xs">
                  <span class="text-[11px] text-stone-500 font-semibold block px-1">الفصول المتوفرة:</span>
                  @for (ch of novel.chapters.slice(0, 3); track ch.id) {
                    <button
                      type="button" 
                      (click)="readChapter(novel.id, ch.id)"
                      class="w-full flex items-center justify-between p-1.5 rounded-lg hover:bg-stone-800 text-stone-300 hover:text-amber-300 cursor-pointer transition-colors text-right"
                    >
                      <span class="truncate max-w-[200px]">{{ ch.title }}</span>
                      <span class="text-[10px] font-mono-code text-stone-400">{{ formatBytes(ch.mtxBytes) }}</span>
                    </button>
                  }
                  @if (novel.chapters.length > 3) {
                    <div class="text-[11px] text-stone-400 text-center py-0.5">
                      + {{ novel.chapters.length - 3 }} فصول أخرى
                    </div>
                  }
                </div>

                <!-- Card Actions -->
                <div class="pt-2 flex items-center gap-2">
                  <button
                    (click)="readNovel(novel.id)"
                    class="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-stone-800 hover:bg-amber-600 hover:text-stone-950 text-stone-200 text-xs font-bold transition-all cursor-pointer"
                  >
                    <mat-icon class="text-base">chrome_reader_mode</mat-icon>
                    <span>قراءة الرواية</span>
                  </button>

                  <button
                    (click)="addChapterToNovel(novel.id)"
                    title="كتابة فصل إضافي لهذه الرواية"
                    class="p-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 hover:text-amber-400 transition-colors cursor-pointer"
                  >
                    <mat-icon class="text-base">add_circle_outline</mat-icon>
                  </button>

                  @if (!novel.isPreloaded) {
                    <button
                      (click)="deleteNovel(novel.id)"
                      title="حذف الرواية"
                      class="p-2 rounded-xl bg-stone-800 hover:bg-rose-900/60 text-stone-400 hover:text-rose-300 transition-colors cursor-pointer"
                    >
                      <mat-icon class="text-base">delete_outline</mat-icon>
                    </button>
                  }
                </div>

              </div>
            </article>
          } @empty {
            <div class="col-span-full py-16 text-center text-stone-400 space-y-4">
              <mat-icon class="text-5xl text-stone-600">search_off</mat-icon>
              <p class="text-base">لا توجد روايات مطابقة لهذا التصنيف.</p>
              <button
                (click)="selectedCategory.set('all')"
                class="px-4 py-2 bg-stone-800 hover:bg-stone-700 text-stone-200 rounded-lg text-xs"
              >
                عرض كافة الروايات
              </button>
            </div>
          }
        </div>
      </section>

      <!-- Educational feature: The MTX Architecture Breakdown -->
      <section class="bg-stone-900 rounded-3xl border border-stone-800 p-8 space-y-6">
        <div class="max-w-2xl">
          <span class="text-xs font-mono-code text-amber-400 uppercase tracking-wider block">الابتكار التقني</span>
          <h3 class="text-2xl font-bold font-amiri text-stone-100 mt-1">
            كيف تعمل خوارزمية MTX لتقليص النصوص العربية بنسبة 70% إلى 80%؟
          </h3>
          <p class="text-xs text-stone-400 mt-2 leading-relaxed">
            تعتمد صيغة MTX على معالجة ذكية لطبيعة اللغة العربية وتشكيلها، بدلاً من ترميز كل حرف وحركة بـ 2 إلى 4 بايتات كما في UTF-8:
          </p>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div class="p-5 bg-stone-950 rounded-2xl border border-stone-800/80 space-y-2">
            <div class="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center font-bold">
              1
            </div>
            <h4 class="text-sm font-bold text-stone-200 font-sans">
              خريطة الترميز الديناميكية
            </h4>
            <p class="text-xs text-stone-400 leading-relaxed">
              يقوم المحرك بمسح الفصل وتجميع المفردات واللواصق والحروف المشكلة (مثل كَ، كِ، كُ، كْ، م، ن) وربطها بمعرفات رقمية مدمجة بحجم بايت واحد للرموز الأكثر تكراراً.
            </p>
          </div>

          <div class="p-5 bg-stone-950 rounded-2xl border border-stone-800/80 space-y-2">
            <div class="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-bold">
              2
            </div>
            <h4 class="text-sm font-bold text-stone-200 font-sans">
              حفظ الحركات بدقة 100%
            </h4>
            <p class="text-xs text-stone-400 leading-relaxed">
              لا تفقد الصيغة أي فتحة أو ضمة أو كسرة أو شدة. يتم تمييز الحرف مع حركته ككيان لغوي كامل يُعاد تركيبه دون أدنى تغيير في مواضعه الأصلية.
            </p>
          </div>

          <div class="p-5 bg-stone-950 rounded-2xl border border-stone-800/80 space-y-2">
            <div class="w-8 h-8 rounded-lg bg-sky-500/10 text-sky-400 flex items-center justify-center font-bold">
              3
            </div>
            <h4 class="text-sm font-bold text-stone-200 font-sans">
              تشفير أمان وفك فوري
            </h4>
            <p class="text-xs text-stone-400 leading-relaxed">
              تُحفظ البيانات مشفرة بقناع تدفق ديناميكي لمنع الاستخراج العشوائي، وتُفك داخل المتصفح خلال أجزاء من الألف من الثانية عبر مصفوفات الذاكرة السريعة.
            </p>
          </div>
        </div>
      </section>

    </div>
  `,
})
export class NovelLibrary {
  readonly store = inject(NovelStore);
  private readonly router = inject(Router);

  readonly selectedCategory = signal<string>('all');

  readonly categories = computed(() => [
    { id: 'all', label: 'كافة الروايات' },
    { id: 'tashkeel', label: 'مختبر التشكيل (كَ وكِ)' },
    { id: 'history', label: 'تاريخ وغموض' },
    { id: 'adventure', label: 'خيال ومغامرة' },
  ]);

  readonly filteredNovels = computed(() => {
    const list = this.store.novels();
    const filter = this.selectedCategory();

    if (filter === 'all') return list;
    if (filter === 'tashkeel') return list.filter(n => n.id.includes('tashkeel') || n.category.includes('تشكيل'));
    if (filter === 'history') return list.filter(n => n.category.includes('تاريخ') || n.category.includes('غموض'));
    if (filter === 'adventure') return list.filter(n => n.category.includes('خيال') || n.category.includes('مغامرات'));
    return list;
  });

  formatBytes(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    return `${(bytes / 1024).toFixed(1)} KB`;
  }

  getNovelMtxTotal(novel: Novel): number {
    return novel.chapters.reduce((sum, ch) => sum + ch.mtxBytes, 0);
  }

  getNovelAverageSavings(novel: Novel): number {
    const totalUtf8 = novel.chapters.reduce((sum, ch) => sum + ch.utf8Bytes, 0);
    const totalMtx = novel.chapters.reduce((sum, ch) => sum + ch.mtxBytes, 0);
    if (totalUtf8 === 0) return 0;
    return Math.round(((totalUtf8 - totalMtx) / totalUtf8) * 1000) / 10;
  }

  readNovel(novelId: string): void {
    this.store.selectNovel(novelId);
    this.router.navigate(['/reader']);
  }

  readChapter(novelId: string, chapterId: string): void {
    this.store.selectChapter(novelId, chapterId);
    this.router.navigate(['/reader']);
  }

  openLatestNovel(): void {
    const novels = this.store.novels();
    if (novels.length > 0) {
      this.store.selectNovel(novels[0].id);
      this.router.navigate(['/reader']);
    }
  }

  goToEditor(): void {
    this.router.navigate(['/editor']);
  }

  goToLab(): void {
    this.router.navigate(['/lab']);
  }

  addChapterToNovel(novelId: string): void {
    this.store.selectNovel(novelId);
    this.router.navigate(['/editor']);
  }

  deleteNovel(novelId: string): void {
    if (confirm('هل أنت متأكد من حذف هذه الرواية من المكتبة المحلية؟')) {
      this.store.deleteNovel(novelId);
    }
  }
}
