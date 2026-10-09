import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { NovelStore } from '../core/novel-store';
import { Novel } from '../core/novel-models';

export type HeroMode = 'most_read' | 'top_rated' | 'most_chapters';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-novel-library',
  imports: [MatIconModule],
  template: `
    <div class="space-y-24 sm:space-y-32 pb-32 text-stone-100">
      
      <!-- ========================================================================= -->
      <!-- 1. CINEMATIC HERO SPOTLIGHT: الأكثر قراءة · الأكثر تقييماً · الأكثر فصولاً -->
      <!-- ========================================================================= -->
      <section class="relative overflow-hidden pt-6 sm:pt-10 pb-16 sm:pb-20 px-4 sm:px-6 lg:px-8 border-b border-stone-800/80">
        <!-- Subtle Soft Ambient Depth (بدون توهجات فاقعة) -->
        <div class="absolute top-1/4 right-1/4 w-96 h-96 bg-rose-950/20 rounded-full blur-3xl pointer-events-none"></div>
        <div class="absolute -bottom-10 left-1/3 w-80 h-80 bg-stone-900/40 rounded-full blur-3xl pointer-events-none"></div>

        <div class="max-w-7xl mx-auto space-y-8">
          
          <!-- Hero Mode Navigation Switcher (تنقلات سلسة بين الأكثر قراءة، تقييماً، وفصولاً) -->
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div class="space-y-1">
              <span class="text-xs font-semibold text-rose-400 tracking-wider uppercase flex items-center gap-1.5">
                <mat-icon class="text-base text-rose-400">workspace_premium</mat-icon>
                <span>صدارة مقاتل الروايات</span>
              </span>
              <h2 class="text-2xl sm:text-3xl font-extrabold font-amiri text-white">
                أبرز الأعمال في المنصة
              </h2>
            </div>

            <!-- Interactive Hero Category Tabs with Smooth Transitions -->
            <div class="inline-flex p-1.5 rounded-2xl liquid-glass border border-white/10 self-start sm:self-auto gap-1">
              <button
                type="button"
                (click)="setHeroMode('most_read')"
                [class]="heroMode() === 'most_read' 
                  ? 'bg-rose-600 text-white font-bold shadow-md' 
                  : 'text-stone-300 hover:text-white hover:bg-white/5'"
                class="flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm transition-all duration-300 cursor-pointer"
              >
                <mat-icon class="text-base">local_fire_department</mat-icon>
                <span>الأكثر قراءة</span>
              </button>

              <button
                type="button"
                (click)="setHeroMode('top_rated')"
                [class]="heroMode() === 'top_rated' 
                  ? 'bg-rose-600 text-white font-bold shadow-md' 
                  : 'text-stone-300 hover:text-white hover:bg-white/5'"
                class="flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm transition-all duration-300 cursor-pointer"
              >
                <mat-icon class="text-base">star</mat-icon>
                <span>الأعلى تقييماً</span>
              </button>

              <button
                type="button"
                (click)="setHeroMode('most_chapters')"
                [class]="heroMode() === 'most_chapters' 
                  ? 'bg-rose-600 text-white font-bold shadow-md' 
                  : 'text-stone-300 hover:text-white hover:bg-white/5'"
                class="flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm transition-all duration-300 cursor-pointer"
              >
                <mat-icon class="text-base">auto_stories</mat-icon>
                <span>الأكثر فصولاً</span>
              </button>
            </div>
          </div>

          <!-- Dynamic Hero Showcase Container -->
          @if (activeHeroChampion(); as hero) {
            <div class="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch transition-opacity duration-300">
              
              <!-- Major Hero Champion Card (8 cols) -->
              <div
                class="lg:col-span-8 rounded-3xl relative overflow-hidden liquid-glass-crimson border border-rose-500/20 shadow-xl p-6 sm:p-10 flex flex-col justify-between group transition-all duration-300"
              >
                <!-- Artistic Background Gradient -->
                <div [class]="'absolute inset-0 bg-gradient-to-br ' + hero.coverGradient + ' opacity-35 transition-transform duration-700 group-hover:scale-103 pointer-events-none'"></div>
                <div class="absolute inset-0 bg-gradient-to-t from-stone-950 via-stone-950/75 to-transparent pointer-events-none"></div>

                <div class="relative z-10 space-y-4">
                  <!-- Badges Bar -->
                  <div class="flex flex-wrap items-center gap-2.5">
                    <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-600/25 text-rose-300 border border-rose-500/30 text-xs font-semibold">
                      <mat-icon class="text-sm text-rose-400">{{ heroCategoryInfo().icon }}</mat-icon>
                      <span>{{ heroCategoryInfo().badge }}</span>
                    </span>

                    <span class="px-2.5 py-1 rounded-full liquid-glass border border-white/10 text-xs text-stone-300 font-sans">
                      {{ hero.category }}
                    </span>

                    <div class="flex items-center gap-1 px-2.5 py-1 rounded-full liquid-glass text-amber-400 text-xs font-bold border border-white/10">
                      <mat-icon class="text-sm">star</mat-icon>
                      <span>{{ hero.rating || 4.9 }}</span>
                    </div>

                    <span class="px-2.5 py-1 rounded-full liquid-glass border border-white/10 text-xs text-stone-400 font-sans flex items-center gap-1">
                      <mat-icon class="text-xs text-rose-400">visibility</mat-icon>
                      <span>{{ hero.views }} قراءة</span>
                    </span>
                  </div>

                  <!-- Author - Translator Prominently Displayed (مؤلف - مترجم) -->
                  <div class="text-xs sm:text-sm text-rose-300 font-medium tracking-wide flex items-center gap-2 pt-1">
                    <mat-icon class="text-base text-rose-400">person</mat-icon>
                    <span>المؤلف: {{ hero.author }}</span>
                    <span class="text-rose-500/80">·</span>
                    <span class="text-stone-300">المترجم: {{ hero.translator || 'الأصل العربي' }}</span>
                  </div>

                  <!-- Novel Title seamlessly blended with soft inner shading -->
                  <h1 class="text-2xl sm:text-4xl lg:text-5xl font-extrabold font-amiri text-white leading-tight">
                    {{ hero.title }}
                  </h1>

                  <!-- Synopsis -->
                  <p class="text-stone-300 text-xs sm:text-sm leading-relaxed max-w-2xl line-clamp-3 font-sans">
                    {{ hero.description }}
                  </p>
                </div>

                <!-- Action Bar & Chapter Metadata -->
                <div class="relative z-10 pt-6 mt-8 border-t border-white/10 flex flex-wrap items-center justify-between gap-4">
                  <div class="flex items-center gap-5 text-xs text-stone-400 font-sans">
                    <span class="flex items-center gap-1.5">
                      <mat-icon class="text-rose-400 text-sm">menu_book</mat-icon>
                      <strong class="text-white">{{ hero.chapters.length }}</strong> فصول كاملة
                    </span>
                    <span class="flex items-center gap-1.5">
                      <mat-icon class="text-rose-400 text-sm">schedule</mat-icon>
                      <span>تحديث فوري</span>
                    </span>
                  </div>

                  <div class="flex items-center gap-3">
                    <button
                      type="button"
                      (click)="readNovel(hero)"
                      class="flex items-center gap-2 px-6 py-2.5 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs sm:text-sm shadow-md transition-all cursor-pointer hover:scale-102"
                    >
                      <mat-icon class="text-lg">play_arrow</mat-icon>
                      <span>ابدأ القراءة فوراً</span>
                    </button>

                    <button
                      type="button"
                      (click)="selectNovel(hero)"
                      class="flex items-center gap-2 px-4 py-2.5 rounded-2xl liquid-glass hover:bg-stone-800/60 text-stone-300 hover:text-white border border-white/10 text-xs font-medium transition-all cursor-pointer"
                    >
                      <mat-icon class="text-sm text-rose-400">format_list_bulleted</mat-icon>
                      <span>تفاصيل الفصول</span>
                    </button>
                  </div>
                </div>

              </div>

              <!-- Secondary Contenders in this Category (4 cols) -->
              <div class="lg:col-span-4 flex flex-col gap-6 justify-between">
                @for (contender of activeHeroContenders(); track contender.id; let idx = $index) {
                  <div
                    (click)="selectNovel(contender)"
                    (keydown.enter)="selectNovel(contender)"
                    tabindex="0"
                    role="button"
                    [attr.aria-label]="'عرض رواية ' + contender.title"
                    class="flex-1 rounded-3xl p-6 liquid-glass-card border border-white/10 hover:border-rose-500/30 shadow-md cursor-pointer flex flex-col justify-between group transition-all duration-300"
                  >
                    <div class="space-y-2.5">
                      <div class="flex items-center justify-between">
                        <span class="text-[11px] font-bold text-rose-300 px-2.5 py-0.5 rounded-md bg-stone-900/80 border border-white/10">
                          المركز #{{ idx + 2 }} في {{ heroCategoryInfo().badge }}
                        </span>
                        <div class="flex items-center gap-1 text-amber-400 text-xs font-bold">
                          <mat-icon class="text-xs">star</mat-icon>
                          <span>{{ contender.rating || 4.8 }}</span>
                        </div>
                      </div>

                      <!-- مؤلف - مترجم -->
                      <div class="text-[11px] text-stone-400 font-sans flex items-center gap-1 pt-1">
                        <mat-icon class="text-xs text-rose-400">person</mat-icon>
                        <span>{{ contender.author }}</span>
                        <span>·</span>
                        <span class="text-stone-300">{{ contender.translator || 'الأصل العربي' }}</span>
                      </div>

                      <h3 class="text-lg font-bold font-amiri text-white leading-snug group-hover:text-rose-300 transition-colors">
                        {{ contender.title }}
                      </h3>

                      <p class="text-xs text-stone-400 line-clamp-2 font-sans">
                        {{ contender.description }}
                      </p>
                    </div>

                    <div class="pt-4 mt-3 border-t border-white/5 flex items-center justify-between text-xs text-stone-400">
                      <span>{{ contender.chapters.length }} فصول · {{ contender.views }} قراءة</span>
                      <span class="text-rose-400 group-hover:translate-x-1 transition-transform flex items-center gap-1 text-[11px] font-bold">
                        <span>تصفح</span>
                        <mat-icon class="text-xs">arrow_back</mat-icon>
                      </span>
                    </div>
                  </div>
                }
              </div>

            </div>
          }
        </div>
      </section>

      <!-- ========================================================================= -->
      <!-- 2. TOP LEADERBOARD CHART (المتصدرون والأكثر شعبية) -->
      <!-- ========================================================================= -->
      <section class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-800/80 pb-6">
          <div class="flex items-center gap-3">
            <div class="w-2.5 h-8 rounded-full bg-gradient-to-b from-rose-500 to-red-700"></div>
            <div>
              <h2 class="text-2xl sm:text-3xl font-bold font-amiri text-white tracking-wide">
                قائمة الصدارة الأكثر قراءة
              </h2>
              <p class="text-xs text-stone-400 mt-1 font-sans">
                الأعمال الأدبية الحائزة على أعلى تفاعل وتقييم في مقاتل الروايات
              </p>
            </div>
          </div>

          <span class="text-xs text-rose-400 font-sans hidden sm:inline">
            تحديث مستمر
          </span>
        </div>

        <!-- Horizontal Ranking Strips / Leaderboard -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          @for (novel of topRankedNovels(); track novel.id; let i = $index) {
            <div
              (click)="selectNovel(novel)"
              (keydown.enter)="selectNovel(novel)"
              tabindex="0"
              role="button"
              [attr.aria-label]="'عرض تفاصيل ' + novel.title"
              class="p-5 rounded-2xl liquid-glass-card border border-white/10 hover:border-rose-500/30 flex items-center gap-4 cursor-pointer group transition-all duration-300"
            >
              <!-- Numeric Rank -->
              <div class="text-3xl sm:text-4xl font-extrabold font-mono-code text-rose-400/80 select-none w-10 text-center">
                0{{ i + 1 }}
              </div>

              <!-- Cover Thumbnail with Soft Inner Shadow -->
              <div [class]="'w-16 h-22 rounded-xl bg-gradient-to-br ' + novel.coverGradient + ' shrink-0 overflow-hidden relative border border-white/10 shadow-sm group-hover:scale-103 transition-transform'">
                <div class="absolute inset-0 cover-inner-shadow"></div>
                <div class="absolute bottom-1 right-1 text-[9px] font-bold text-white bg-black/70 px-1 rounded">
                  ★ {{ novel.rating || 4.9 }}
                </div>
              </div>

              <!-- Info: Title, Author - Translator, Chapters -->
              <div class="flex-1 min-w-0 space-y-1.5">
                <span class="text-[10px] text-rose-400 font-semibold block truncate">
                  {{ novel.category }}
                </span>

                <h3 class="text-base font-bold font-amiri text-white truncate group-hover:text-rose-300 transition-colors">
                  {{ novel.title }}
                </h3>

                <!-- مؤلف - مترجم -->
                <div class="text-xs text-stone-400 truncate font-sans">
                  <span>{{ novel.author }}</span>
                  <span class="text-rose-500 mx-1">·</span>
                  <span class="text-stone-300">{{ novel.translator || 'الأصل العربي' }}</span>
                </div>

                <div class="text-[11px] text-stone-400 flex items-center gap-2 pt-0.5 font-sans">
                  <span>{{ novel.chapters.length }} فصول</span>
                  <span>·</span>
                  <span>{{ novel.views }} قراءة</span>
                </div>
              </div>
            </div>
          }
        </div>
      </section>

      <!-- ========================================================================= -->
      <!-- 3. INTERACTIVE GENRE DISCOVERY & MODERN CARD GRID (تصفح وتوزيع البطاقات الحديث) -->
      <!-- ========================================================================= -->
      <section class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-800/80 pb-6">
          <div class="flex items-center gap-3">
            <div class="w-2.5 h-8 rounded-full bg-gradient-to-b from-amber-500 to-rose-600"></div>
            <div>
              <h2 class="text-2xl sm:text-3xl font-bold font-amiri text-white tracking-wide">
                استكشاف مكتبة الروايات
              </h2>
              <p class="text-xs text-stone-400 mt-1 font-sans">
                تصفح الروايات بتصاميم أغلفة عصرية وتظليل داخلي ناعم
              </p>
            </div>
          </div>

          <!-- Dynamic Genre Filter Pills -->
          <div class="flex flex-wrap items-center gap-2">
            @for (genre of availableGenres; track genre.id) {
              <button
                type="button"
                (click)="selectedGenre.set(genre.id)"
                [class]="selectedGenre() === genre.id 
                  ? 'bg-rose-600 text-white font-bold border-rose-500 shadow-sm' 
                  : 'liquid-glass text-stone-300 hover:text-white border-white/10 hover:border-rose-500/30'"
                class="px-4 py-2 rounded-xl text-xs transition-all duration-300 cursor-pointer border"
              >
                {{ genre.label }}
              </button>
            }
          </div>
        </div>

        <!-- ===================================================================== -->
        <!-- MODERN NOVEL CARDS GRID (توزيع البطاقات العصري بدون حواف حادة مع تظليل داخلي) -->
        <!-- ===================================================================== -->
        <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6 sm:gap-7">
          @for (novel of filteredNovels(); track novel.id) {
            <!-- Card with Soft Shading and Seamless Author/Translator Integration -->
            <div
              (click)="selectNovel(novel)"
              (keydown.enter)="selectNovel(novel)"
              tabindex="0"
              role="button"
              [attr.aria-label]="'عرض تفاصيل رواية ' + novel.title"
              class="group relative h-[380px] sm:h-[420px] rounded-3xl overflow-hidden cursor-pointer liquid-glass-card shadow-md transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-rose-500 hover:-translate-y-1.5"
            >
              <!-- Background Artistic Book Cover Gradient -->
              <div [class]="'absolute inset-0 bg-gradient-to-br ' + novel.coverGradient + ' transition-transform duration-500 group-hover:scale-105'">
                <!-- Subtle Texture Motif -->
                <div class="absolute inset-0 opacity-10 bg-[radial-gradient(#e11d48_1px,transparent_1px)] [background-size:16px_16px]"></div>
              </div>

              <!-- Deep Inner Shading Vignette (تظليل داخلي ناعم بدون حواف حادة) -->
              <div class="absolute inset-0 cover-inner-shadow pointer-events-none"></div>

              <!-- Top Floating Badge: Category & Rating -->
              <div class="absolute top-4 right-4 left-4 flex items-center justify-between z-10">
                <span class="px-2.5 py-1 rounded-lg liquid-glass text-rose-300 border border-white/10 text-[10px] font-bold shadow-sm backdrop-blur-md">
                  {{ novel.badge || novel.category }}
                </span>

                <div class="flex items-center gap-1 px-2.5 py-1 rounded-lg liquid-glass text-amber-400 text-[11px] font-bold border border-white/10">
                  <mat-icon class="text-xs">star</mat-icon>
                  <span>{{ novel.rating || 4.8 }}</span>
                </div>
              </div>

              <!-- Bottom Merged Content: Author - Translator & Novel Title seamlessly blended -->
              <div class="absolute bottom-0 inset-x-0 p-5 z-10 space-y-2">
                
                <!-- مؤلف - مترجم (as explicitly requested) -->
                <div class="text-[11px] text-rose-300 font-medium tracking-wide flex items-center gap-1.5 drop-shadow">
                  <mat-icon class="text-xs text-rose-400">person</mat-icon>
                  <span class="truncate">{{ novel.author }}</span>
                  <span class="text-rose-500">·</span>
                  <span class="text-stone-300 truncate">{{ novel.translator || 'الأصل العربي' }}</span>
                </div>

                <!-- اسم الرواية مدموج بتظليل داخلي مع غلاف الرواية بشكل جميل بدون حواف حادة -->
                <h3 class="text-lg sm:text-xl font-bold font-amiri text-white leading-snug drop-shadow-md group-hover:text-rose-300 transition-colors line-clamp-2">
                  {{ novel.title }}
                </h3>

                <!-- Metadata Bar -->
                <div class="pt-2.5 flex items-center justify-between text-[11px] text-stone-400 border-t border-white/10 font-sans">
                  <span class="flex items-center gap-1">
                    <mat-icon class="text-xs text-rose-400">menu_book</mat-icon>
                    <span>{{ novel.chapters.length }} فصول</span>
                  </span>

                  <span class="flex items-center gap-1 text-stone-400 group-hover:text-rose-300 transition-colors">
                    <mat-icon class="text-xs">visibility</mat-icon>
                    <span>{{ novel.views }}</span>
                  </span>
                </div>

              </div>
            </div>
          }
        </div>

      </section>

      <!-- ========================================================================= -->
      <!-- 4. RECENT CHAPTER RELEASES FEED (أحدث الفصول الصادرة) -->
      <!-- ========================================================================= -->
      <section class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div class="flex items-center justify-between border-b border-stone-800/80 pb-6">
          <div class="flex items-center gap-3">
            <div class="w-2.5 h-8 rounded-full bg-gradient-to-b from-emerald-500 to-rose-600"></div>
            <div>
              <h2 class="text-2xl sm:text-3xl font-bold font-amiri text-white tracking-wide">
                أحدث الفصول المضافة
              </h2>
              <p class="text-xs text-stone-400 mt-1 font-sans">
                فصول جديدة بانتظارك للقراءة المباشرة
              </p>
            </div>
          </div>

          <span class="text-xs text-rose-400 font-sans hidden sm:inline">
            محدث باستمرار
          </span>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          @for (novel of latestUpdatedNovels(); track novel.id) {
            @if (novel.chapters.length > 0) {
              <div class="p-5 rounded-2xl liquid-glass border border-white/10 hover:border-rose-500/30 flex items-center justify-between gap-4 group transition-all duration-300">
                <div class="flex items-center gap-3.5 min-w-0">
                  <div [class]="'w-13 h-16 rounded-xl bg-gradient-to-br ' + novel.coverGradient + ' shrink-0 overflow-hidden relative border border-white/10'">
                    <div class="absolute inset-0 cover-inner-shadow"></div>
                  </div>

                  <div class="min-w-0 space-y-1">
                    <span class="text-[10px] text-rose-400 font-semibold block">
                      {{ novel.title }}
                    </span>
                    <h4 class="text-xs font-bold text-white truncate group-hover:text-rose-300 transition-colors font-amiri">
                      {{ novel.chapters[novel.chapters.length - 1].title }}
                    </h4>
                    <span class="text-[10px] text-stone-400 block truncate font-sans">
                      {{ novel.author }} · {{ novel.translator || 'الأصل العربي' }}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  (click)="readSpecificChapter(novel, novel.chapters[novel.chapters.length - 1].id)"
                  class="px-3.5 py-2 rounded-xl bg-rose-600/20 hover:bg-rose-600 text-rose-300 hover:text-white border border-rose-500/30 text-xs font-bold transition-all shrink-0 cursor-pointer"
                >
                  قراءة
                </button>
              </div>
            }
          }
        </div>
      </section>

    </div>
  `,
})
export class NovelLibrary {
  readonly store = inject(NovelStore);
  private readonly router = inject(Router);

  readonly selectedGenre = signal<string>('all');
  readonly heroMode = signal<HeroMode>('most_read');

  readonly availableGenres = [
    { id: 'all', label: 'كافة الروايات' },
    { id: 'fantasy', label: 'فانتازيا وخيال' },
    { id: 'translated', label: 'روايات مترجمة' },
    { id: 'mystery', label: 'غموض وتشويق' },
    { id: 'history', label: 'تاريخ وأدب عربي' },
  ];

  private parseViews(viewsStr?: string): number {
    if (!viewsStr) return 0;
    const num = parseFloat(viewsStr.replace(/[^0-9.]/g, ''));
    if (viewsStr.includes('K') || viewsStr.includes('k')) return num * 1000;
    if (viewsStr.includes('M') || viewsStr.includes('m')) return num * 1000000;
    return num || 0;
  }

  readonly mostReadNovels = computed(() => {
    const list = [...this.store.novels()];
    return list.sort((a, b) => this.parseViews(b.views) - this.parseViews(a.views));
  });

  readonly topRatedNovels = computed(() => {
    const list = [...this.store.novels()];
    return list.sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));
  });

  readonly mostChaptersNovels = computed(() => {
    const list = [...this.store.novels()];
    return list.sort((a, b) => b.chapters.length - a.chapters.length);
  });

  readonly activeHeroChampion = computed(() => {
    const mode = this.heroMode();
    if (mode === 'most_read') return this.mostReadNovels()[0] || null;
    if (mode === 'top_rated') return this.topRatedNovels()[0] || null;
    return this.mostChaptersNovels()[0] || null;
  });

  readonly activeHeroContenders = computed(() => {
    const mode = this.heroMode();
    if (mode === 'most_read') return this.mostReadNovels().slice(1, 3);
    if (mode === 'top_rated') return this.topRatedNovels().slice(1, 3);
    return this.mostChaptersNovels().slice(1, 3);
  });

  readonly heroCategoryInfo = computed(() => {
    const mode = this.heroMode();
    switch (mode) {
      case 'most_read':
        return {
          badge: 'الأكثر قراءة وتفاعلاً',
          icon: 'local_fire_department',
          description: 'الروايات التي حصدت أعلى معدلات القراءة والتفاعل في مقاتل الروايات',
        };
      case 'top_rated':
        return {
          badge: 'الأعلى تقييماً بإجماع القراء',
          icon: 'star',
          description: 'الروايات الحائزة على أعلى الدرجات والتقييمات النقدية من القراء',
        };
      case 'most_chapters':
        return {
          badge: 'الملحمة الأطول والأكثر فصولاً',
          icon: 'auto_stories',
          description: 'السلاسل الروائية الأضخم من حيث الفصول والأحداث المستمرة',
        };
    }
  });

  readonly topRankedNovels = computed(() => {
    return this.mostReadNovels().slice(0, 6);
  });

  readonly filteredNovels = computed(() => {
    const list = this.store.novels();
    const genre = this.selectedGenre();
    if (genre === 'all') return list;
    if (genre === 'fantasy') return list.filter(n => n.category.includes('فانتازيا') || n.category.includes('خيال'));
    if (genre === 'translated') return list.filter(n => n.category.includes('مترجم') || (n.translator && n.translator !== 'الأصل العربي'));
    if (genre === 'mystery') return list.filter(n => n.category.includes('غموض') || n.category.includes('سايبر'));
    if (genre === 'history') return list.filter(n => n.category.includes('تاريخ') || n.category.includes('عربي'));
    return list;
  });

  readonly latestUpdatedNovels = computed(() => {
    const list = this.store.novels();
    return list.slice(0, 6);
  });

  setHeroMode(mode: HeroMode): void {
    this.heroMode.set(mode);
  }

  selectNovel(novel: Novel): void {
    this.store.selectNovel(novel.id);
    this.router.navigate(['/novel', novel.id]);
  }

  readNovel(novel: Novel): void {
    this.store.selectNovel(novel.id);
    const chapterId = novel.chapters.length > 0 ? novel.chapters[0].id : '';
    if (chapterId) {
      this.router.navigate(['/reader', novel.id, chapterId]);
    } else {
      this.router.navigate(['/reader', novel.id]);
    }
  }

  readSpecificChapter(novel: Novel, chapterId: string): void {
    this.store.selectNovel(novel.id);
    this.store.selectChapter(novel.id, chapterId);
    this.router.navigate(['/reader', novel.id, chapterId]);
  }
}
