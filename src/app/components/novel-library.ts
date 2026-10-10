import { ChangeDetectionStrategy, Component, computed, inject, signal, OnInit } from '@angular/core';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { NovelStore } from '../core/novel-store';
import { Novel } from '../core/novel-models';

export type HeroMode = 'most_read' | 'top_rated' | 'most_chapters';

export interface RecentChapterItem {
  novelId: string;
  novelTitle: string;
  novelCoverGradient: string;
  author: string;
  translator?: string;
  chapterId: string;
  chapterIndex: number;
  chapterTitle: string;
  wordCount: number;
}

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-novel-library',
  imports: [RouterLink, MatIconModule],
  styles: [`
    .novels-grid,
    .parent {
      display: grid !important;
      grid-template-columns: repeat(3, minmax(0, 1fr)) !important;
      gap: 18px !important;
      direction: rtl !important;
      width: 100% !important;
      box-sizing: border-box !important;
    }

    .novels-grid > *,
    .parent > * {
      direction: rtl !important;
      min-width: 0 !important;
      box-sizing: border-box !important;
    }

    @media (max-width: 640px) {
      .novels-grid,
      .parent {
        gap: 10px !important;
      }
    }
  `],
  template: `
    <div class="space-y-16 sm:space-y-20 pb-28 text-stone-100">
      
      <!-- ========================================================================= -->
      <!-- 1. CINEMATIC HERO SPOTLIGHT: صدارة الروايات بتوزيع فائق الأناقة -->
      <!-- ========================================================================= -->
      <section class="relative overflow-hidden pt-6 sm:pt-10 pb-12 sm:pb-16 px-4 sm:px-6 lg:px-8 border-b border-stone-800/60">
        <!-- Ambient Depth Lights -->
        <div class="absolute top-1/4 right-1/4 w-96 h-96 bg-rose-950/25 rounded-full blur-3xl pointer-events-none"></div>
        <div class="absolute -bottom-10 left-1/3 w-80 h-80 bg-stone-900/40 rounded-full blur-3xl pointer-events-none"></div>

        <div class="max-w-7xl mx-auto space-y-8">
          
          <!-- Hero Header Bar & Mode Navigation Switcher -->
          <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div class="space-y-1.5">
              <div class="flex items-center gap-2">
                <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-600/15 text-rose-300 border border-rose-500/25 text-xs font-semibold">
                  <mat-icon class="text-sm text-rose-400">workspace_premium</mat-icon>
                  <span>صدارة مقاتل الروايات</span>
                </span>
                <span class="text-xs text-stone-400 font-sans hidden sm:inline">· عالم الروايات العربية والمترجمة</span>
              </div>
              <h1 class="text-2xl sm:text-3xl lg:text-4xl font-extrabold font-amiri text-white tracking-wide">
                أبرز الأعمال الروائية المختارة
              </h1>
            </div>

            <!-- Hero Category Tabs (الأكثر قراءة · الأعلى تقييماً · الأكثر فصولاً) -->
            <div class="inline-flex p-1.5 rounded-2xl liquid-glass border border-white/10 self-start md:self-auto gap-1">
              <button
                type="button"
                (click)="setHeroMode('most_read')"
                [class]="heroMode() === 'most_read' 
                  ? 'bg-rose-600 text-white font-bold shadow-md' 
                  : 'text-stone-300 hover:text-white hover:bg-white/5'"
                class="flex items-center gap-2 px-3.5 sm:px-4 py-2 rounded-xl text-xs sm:text-sm transition-all duration-300 cursor-pointer"
              >
                <mat-icon class="text-base text-amber-400">local_fire_department</mat-icon>
                <span>الأكثر قراءة</span>
              </button>

              <button
                type="button"
                (click)="setHeroMode('top_rated')"
                [class]="heroMode() === 'top_rated' 
                  ? 'bg-rose-600 text-white font-bold shadow-md' 
                  : 'text-stone-300 hover:text-white hover:bg-white/5'"
                class="flex items-center gap-2 px-3.5 sm:px-4 py-2 rounded-xl text-xs sm:text-sm transition-all duration-300 cursor-pointer"
              >
                <mat-icon class="text-base text-amber-400">star</mat-icon>
                <span>الأعلى تقييماً</span>
              </button>

              <button
                type="button"
                (click)="setHeroMode('most_chapters')"
                [class]="heroMode() === 'most_chapters' 
                  ? 'bg-rose-600 text-white font-bold shadow-md' 
                  : 'text-stone-300 hover:text-white hover:bg-white/5'"
                class="flex items-center gap-2 px-3.5 sm:px-4 py-2 rounded-xl text-xs sm:text-sm transition-all duration-300 cursor-pointer"
              >
                <mat-icon class="text-base text-rose-400">auto_stories</mat-icon>
                <span>الأكثر فصولاً</span>
              </button>
            </div>
          </div>

          <!-- Dynamic Hero Showcase Container -->
          @if (activeHeroChampion(); as hero) {
            <div class="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 items-stretch">
              
              <!-- Major Spotlight Card (8 cols) -->
              <div
                class="lg:col-span-8 rounded-3xl relative overflow-hidden liquid-glass-crimson border border-rose-500/25 shadow-2xl p-6 sm:p-8 lg:p-10 flex flex-col justify-between group transition-all duration-300"
              >
                <!-- Background Gradient Art -->
                <div [class]="'absolute inset-0 bg-gradient-to-br ' + hero.coverGradient + ' opacity-40 transition-transform duration-700 group-hover:scale-103 pointer-events-none'"></div>
                <div class="absolute inset-0 bg-gradient-to-t from-stone-950 via-stone-950/75 to-transparent pointer-events-none"></div>

                <div class="relative z-10 space-y-4">
                  <!-- Badges Strip -->
                  <div class="flex flex-wrap items-center gap-2">
                    <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-600/30 text-rose-200 border border-rose-400/30 text-xs font-semibold backdrop-blur-md">
                      <mat-icon class="text-sm text-rose-400">{{ heroCategoryInfo().icon }}</mat-icon>
                      <span>{{ heroCategoryInfo().badge }}</span>
                    </span>

                    <span class="px-2.5 py-1 rounded-full liquid-glass border border-white/10 text-xs text-stone-200 font-sans">
                      {{ hero.category }}
                    </span>

                    <div class="flex items-center gap-1 px-2.5 py-1 rounded-full liquid-glass text-amber-400 text-xs font-bold border border-white/10">
                      <mat-icon class="text-sm">star</mat-icon>
                      <span>{{ hero.rating || 4.9 }}</span>
                    </div>

                    <span class="px-2.5 py-1 rounded-full liquid-glass border border-white/10 text-xs text-stone-300 font-sans flex items-center gap-1">
                      <mat-icon class="text-xs text-rose-400">visibility</mat-icon>
                      <span>{{ hero.views }} قراءة</span>
                    </span>
                  </div>

                  <!-- Author & Translator attribution -->
                  <div class="text-xs sm:text-sm text-rose-300 font-medium tracking-wide flex flex-wrap items-center gap-2 pt-1">
                    <div class="flex items-center gap-1.5">
                      <mat-icon class="text-base text-rose-400">edit</mat-icon>
                      <span>المؤلف: <strong>{{ hero.author }}</strong></span>
                    </div>
                    <span class="text-rose-500/80">·</span>
                    <div class="flex items-center gap-1.5">
                      <mat-icon class="text-base text-rose-400">translate</mat-icon>
                      <span class="text-stone-300">المترجم: <strong>{{ hero.translator || 'الأصل العربي' }}</strong></span>
                    </div>
                  </div>

                  <!-- Novel Grand Title -->
                  <h2 class="text-2xl sm:text-4xl lg:text-5xl font-extrabold font-amiri text-white leading-tight">
                    {{ hero.title }}
                  </h2>

                  <!-- Synopsis -->
                  <p class="text-stone-300 text-xs sm:text-sm leading-relaxed max-w-2xl line-clamp-3 font-sans">
                    {{ hero.description }}
                  </p>
                </div>

                <!-- Action Bar & Chapter Metadata -->
                <div class="relative z-10 pt-6 mt-6 border-t border-white/10 flex flex-wrap items-center justify-between gap-4">
                  <div class="flex items-center gap-5 text-xs text-stone-300 font-sans">
                    <span class="flex items-center gap-1.5">
                      <mat-icon class="text-rose-400 text-sm">menu_book</mat-icon>
                      <strong class="text-white">{{ hero.chapters.length }}</strong> فصول متوفرة
                    </span>
                    <span class="flex items-center gap-1.5">
                      <mat-icon class="text-emerald-400 text-sm">bolt</mat-icon>
                      <span>قراءة فورية بدون إعلانات</span>
                    </span>
                  </div>

                  <div class="flex items-center gap-3">
                    <button
                      type="button"
                      (click)="readNovel(hero)"
                      class="flex items-center gap-2 px-6 py-2.5 rounded-2xl bg-gradient-to-l from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 text-white font-bold text-xs sm:text-sm shadow-xl transition-all cursor-pointer hover:scale-102"
                    >
                      <mat-icon class="text-lg">play_arrow</mat-icon>
                      <span>ابدأ القراءة فوراً</span>
                    </button>

                    <button
                      type="button"
                      (click)="selectNovel(hero)"
                      class="flex items-center gap-2 px-4 py-2.5 rounded-2xl liquid-glass hover:bg-stone-800/60 text-stone-300 hover:text-white border border-white/10 text-xs font-medium transition-all cursor-pointer"
                    >
                      <mat-icon class="text-sm text-rose-400">auto_stories</mat-icon>
                      <span>تفاصيل الرواية</span>
                    </button>
                  </div>
                </div>

              </div>

              <!-- Secondary Contenders Column (4 cols) -->
              <div class="lg:col-span-4 flex flex-col gap-4 sm:gap-6 justify-between">
                @for (contender of activeHeroContenders(); track contender.id; let idx = $index) {
                  <div
                    (click)="selectNovel(contender)"
                    (keydown.enter)="selectNovel(contender)"
                    tabindex="0"
                    role="button"
                    [attr.aria-label]="'عرض رواية ' + contender.title"
                    class="flex-1 rounded-3xl p-5 sm:p-6 liquid-glass-card border border-white/10 hover:border-rose-500/30 shadow-lg cursor-pointer flex flex-col justify-between group transition-all duration-300"
                  >
                    <div class="space-y-2">
                      <div class="flex items-center justify-between">
                        <span class="text-[11px] font-bold text-rose-300 px-2.5 py-0.5 rounded-md bg-stone-900/90 border border-white/10">
                          المركز #{{ idx + 2 }} في {{ heroCategoryInfo().badge }}
                        </span>
                        <div class="flex items-center gap-1 text-amber-400 text-xs font-bold">
                          <mat-icon class="text-xs">star</mat-icon>
                          <span>{{ contender.rating || 4.8 }}</span>
                        </div>
                      </div>

                      <!-- Author - Translator -->
                      <div class="text-[11px] text-stone-400 font-sans flex items-center gap-1 pt-1 truncate">
                        <mat-icon class="text-xs text-rose-400">person</mat-icon>
                        <span class="truncate">{{ contender.author }}</span>
                        <span>·</span>
                        <span class="text-stone-300 truncate">{{ contender.translator || 'الأصل العربي' }}</span>
                      </div>

                      <h3 class="text-base sm:text-lg font-bold font-amiri text-white leading-snug group-hover:text-rose-300 transition-colors">
                        {{ contender.title }}
                      </h3>

                      <p class="text-xs text-stone-400 line-clamp-2 font-sans leading-relaxed">
                        {{ contender.description }}
                      </p>
                    </div>

                    <div class="pt-3 mt-3 border-t border-white/5 flex items-center justify-between text-xs text-stone-400">
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
      <!-- WEBSITE PORTAL DIRECTORY: دليل تصفح أقسام الموقع الإلكتروني -->
      <!-- ========================================================================= -->
      <nav aria-label="أقسام الموقع الرئيسية" class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="p-3.5 sm:p-4 rounded-2xl liquid-glass border border-white/10 flex flex-wrap items-center justify-between gap-3 shadow-xl">
          <div class="flex items-center gap-2.5">
            <div class="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse"></div>
            <span class="text-xs sm:text-sm font-bold text-stone-200 font-sans">تصفح موقع مقاتل الروايات:</span>
          </div>

          <div class="flex flex-wrap items-center gap-2">
            <button
              type="button"
              (click)="scrollToSection('leaderboard')"
              class="px-3 py-1.5 rounded-xl bg-stone-900/90 hover:bg-rose-950/60 border border-white/10 hover:border-rose-500/40 text-xs text-stone-300 hover:text-white transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
            >
              <mat-icon class="text-xs text-amber-400">trending_up</mat-icon>
              <span>قائمة الصدارة</span>
            </button>

            <button
              type="button"
              (click)="scrollToSection('latest-additions')"
              class="px-3 py-1.5 rounded-xl bg-stone-900/90 hover:bg-rose-950/60 border border-white/10 hover:border-rose-500/40 text-xs text-stone-300 hover:text-white transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
            >
              <mat-icon class="text-xs text-rose-400">auto_awesome</mat-icon>
              <span>آخر الإضافات</span>
            </button>

            <button
              type="button"
              (click)="scrollToSection('explore')"
              class="px-3 py-1.5 rounded-xl bg-stone-900/90 hover:bg-rose-950/60 border border-white/10 hover:border-rose-500/40 text-xs text-stone-300 hover:text-white transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
            >
              <mat-icon class="text-xs text-sky-400">explore</mat-icon>
              <span>استكشاف الروايات</span>
            </button>

            <button
              type="button"
              (click)="scrollToSection('latest-chapters')"
              class="px-3 py-1.5 rounded-xl bg-stone-900/90 hover:bg-rose-950/60 border border-white/10 hover:border-rose-500/40 text-xs text-stone-300 hover:text-white transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
            >
              <mat-icon class="text-xs text-emerald-400">menu_book</mat-icon>
              <span>أحدث الفصول</span>
            </button>

            <a
              routerLink="/editor"
              class="px-3.5 py-1.5 rounded-xl bg-gradient-to-l from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 text-xs font-bold text-white shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <mat-icon class="text-xs">edit_note</mat-icon>
              <span>نشر رواية جديدة</span>
            </a>
          </div>
        </div>
      </nav>

      <!-- ========================================================================= -->
      <!-- 2. LEADERBOARD: قائمة الصدارة الأكثر قراءة (شبكة 3 أعمدة × صفين لـ 6 روايات) -->
      <!-- ========================================================================= -->
      <section id="leaderboard" class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-5 scroll-mt-24">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-800/60 pb-4">
          <div class="flex items-center gap-3">
            <div class="w-2.5 h-7 rounded-full bg-gradient-to-b from-rose-500 to-red-700"></div>
            <div>
              <h2 class="text-xl sm:text-2xl font-bold font-amiri text-white tracking-wide">
                قائمة الصدارة الأكثر قراءة
              </h2>
              <p class="text-xs text-stone-400 mt-0.5 font-sans">
                الأعمال الأدبية الأكثر شعبية وتفاعلاً في المنصة
              </p>
            </div>
          </div>

          <div class="flex items-center gap-4">
            <span class="text-xs text-rose-400 font-sans hidden sm:inline flex items-center gap-1">
              <mat-icon class="text-sm">trending_up</mat-icon>
              <span>ترتيب المشاهدات</span>
            </span>
            <a
              routerLink="/library"
              class="text-xs text-rose-400 hover:text-rose-300 font-sans flex items-center gap-1 cursor-pointer transition-colors"
            >
              <span>المكتبة الشاملة</span>
              <mat-icon class="text-xs">arrow_back</mat-icon>
            </a>
          </div>
        </div>

        <!-- شبكة ثابتة: 3 أعمدة × صفين (6 عناصر بترتيب RTL من اليمين لليسار) -->
        <div class="novels-grid parent">
          @for (novel of topRankedNovels(); track novel.id; let i = $index) {
            <div
              (click)="selectNovel(novel)"
              (keydown.enter)="selectNovel(novel)"
              tabindex="0"
              role="button"
              [attr.aria-label]="'عرض تفاصيل ' + novel.title"
              class="p-1.5 sm:p-2.5 lg:p-3 rounded-2xl sm:rounded-3xl liquid-glass-card border border-white/10 hover:border-rose-500/40 flex flex-col justify-between cursor-pointer group transition-all duration-300 shadow-xl min-w-0 h-full"
            >
              <!-- غلاف الرواية البارز والواضح بنسبة عمودية فخمة ومساحة مكبّرة -->
              <div class="relative w-full aspect-[2/3] rounded-xl sm:rounded-2xl overflow-hidden bg-stone-900 border border-white/10 shadow-lg group-hover:border-rose-500/40 transition-all">
                <div [class]="'absolute inset-0 bg-gradient-to-br ' + novel.coverGradient">
                  <div class="absolute inset-0 opacity-20 bg-[radial-gradient(#e11d48_1px,transparent_1px)] [background-size:12px_12px] pointer-events-none"></div>
                </div>

                @if (novel.coverImage) {
                  <img
                    [src]="novel.coverImage"
                    [alt]="novel.title"
                    class="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    loading="lazy"
                  />
                }

                <div class="absolute inset-0 cover-inner-shadow pointer-events-none"></div>
                <div class="absolute inset-y-0 right-0 w-1.5 bg-gradient-to-l from-black/40 to-transparent pointer-events-none"></div>

                <!-- شارة الترتيب في قائمة الصدارة (أعلى اليمين) بحجم 4px كحد أقصى -->
                <div class="absolute top-1.5 right-1.5 sm:top-2 sm:right-2 z-10">
                  <span class="badge-micro px-1 py-0.5 rounded-sm bg-stone-950/90 text-rose-400 border border-rose-500/35 font-mono-code font-extrabold shadow-md backdrop-blur-md">
                    0{{ i + 1 }}
                  </span>
                </div>

                <!-- شارة نوع العمل: [مترجم] أو [مؤلف] بحجم 4px (أعلى اليسار) -->
                <div class="absolute top-1.5 left-1.5 sm:top-2 sm:left-2 z-10">
                  @if (isTranslated(novel)) {
                    <span class="badge-micro inline-flex items-center gap-0.5 px-1 py-0.5 rounded-sm bg-stone-950/90 text-indigo-300 border border-indigo-400/35 font-bold backdrop-blur-md shadow-md">
                      <mat-icon class="text-indigo-400">translate</mat-icon>
                      <span>مترجم</span>
                    </span>
                  } @else {
                    <span class="badge-micro inline-flex items-center gap-0.5 px-1 py-0.5 rounded-sm bg-stone-950/90 text-rose-300 border border-rose-400/35 font-bold backdrop-blur-md shadow-md">
                      <mat-icon class="text-rose-400">edit_note</mat-icon>
                      <span>مؤلف</span>
                    </span>
                  }
                </div>

                <!-- وسم التقييم فوق صورة الرواية مباشرة بحجم 4px (أسفل اليمين) -->
                <div class="absolute bottom-1.5 right-1.5 sm:bottom-2 sm:right-2 z-10">
                  <span class="badge-micro inline-flex items-center gap-0.5 px-1 py-0.5 rounded-sm bg-stone-950/90 text-amber-300 border border-amber-500/30 font-bold shadow-md backdrop-blur-md">
                    <mat-icon class="text-amber-400">star</mat-icon>
                    <span class="font-mono font-extrabold">{{ novel.rating || 4.9 }}</span>
                  </span>
                </div>
              </div>

              <!-- تفاصيل الرواية: مؤلف/مترجم + عنوان بدقة ديناميكية والتفاف كامل -->
              <div class="pt-2 px-0.5 space-y-1">
                <span class="text-[10px] sm:text-xs text-rose-400 font-semibold block truncate">
                  {{ isTranslated(novel) ? ('ترجمة: ' + novel.translator) : ('المؤلف: ' + novel.author) }}
                </span>

                <!-- العنوان مع نظام قياس ديناميكي والتفاف كامل لمنع الاقتطاع -->
                <div class="min-h-[2.4rem] sm:min-h-[3rem] flex items-center py-0.5">
                  <h3
                    [class]="getTitleClass(novel.title)"
                    class="font-amiri text-white leading-snug break-words line-clamp-2 group-hover:text-rose-300 transition-colors w-full"
                    [title]="novel.title"
                  >
                    {{ novel.title }}
                  </h3>
                </div>
              </div>
            </div>
          }
        </div>
      </section>

      <!-- ========================================================================= -->
      <!-- 3. LATEST ADDITIONS: قسم آخر الإضافات (شبكة 3 أعمدة × صفين لـ 6 روايات) -->
      <!-- ========================================================================= -->
      <section id="latest-additions" class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-5 scroll-mt-24">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-800/60 pb-4">
          <div class="flex items-center gap-3">
            <div class="w-2.5 h-7 rounded-full bg-gradient-to-b from-amber-500 to-rose-500"></div>
            <div>
              <h2 class="text-xl sm:text-2xl font-bold font-amiri text-white tracking-wide">
                آخر الإضافات
              </h2>
              <p class="text-xs text-stone-400 mt-0.5 font-sans">
                أحدث الروايات المنضمة حديثاً إلى مكتبة مقاتل الروايات
              </p>
            </div>
          </div>

          <div class="flex items-center gap-4">
            <span class="text-xs text-amber-400 font-sans hidden sm:inline flex items-center gap-1">
              <mat-icon class="text-sm">auto_awesome</mat-icon>
              <span>أعمال جديدة</span>
            </span>
            <a
              routerLink="/library"
              class="text-xs text-amber-400 hover:text-amber-300 font-sans flex items-center gap-1 cursor-pointer transition-colors"
            >
              <span>تصفح الكل</span>
              <mat-icon class="text-xs">arrow_back</mat-icon>
            </a>
          </div>
        </div>

        <!-- شبكة ثابتة: 3 أعمدة × صفين (6 عناصر بترتيب RTL من اليمين لليسار) -->
        <div class="novels-grid parent">
          @for (novel of latestAddedNovels(); track novel.id; let i = $index) {
            <div
              (click)="selectNovel(novel)"
              (keydown.enter)="selectNovel(novel)"
              tabindex="0"
              role="button"
              [attr.aria-label]="'عرض تفاصيل رواية ' + novel.title"
              class="p-1.5 sm:p-2.5 lg:p-3 rounded-2xl sm:rounded-3xl liquid-glass-card border border-white/10 hover:border-amber-500/40 flex flex-col justify-between cursor-pointer group transition-all duration-300 shadow-xl min-w-0 h-full"
            >
              <!-- غلاف الرواية بدون إشارة جديد مع حجم مكبّر وبارز -->
              <div class="relative w-full aspect-[2/3] rounded-xl sm:rounded-2xl overflow-hidden bg-stone-900 border border-white/10 shadow-lg group-hover:border-amber-500/40 transition-all">
                <div [class]="'absolute inset-0 bg-gradient-to-br ' + novel.coverGradient">
                  <div class="absolute inset-0 opacity-20 bg-[radial-gradient(#f59e0b_1px,transparent_1px)] [background-size:12px_12px] pointer-events-none"></div>
                </div>

                @if (novel.coverImage) {
                  <img
                    [src]="novel.coverImage"
                    [alt]="novel.title"
                    class="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    loading="lazy"
                  />
                }

                <div class="absolute inset-0 cover-inner-shadow pointer-events-none"></div>
                <div class="absolute inset-y-0 right-0 w-1.5 bg-gradient-to-l from-black/40 to-transparent pointer-events-none"></div>

                <!-- شارة نوع العمل: [مترجم] أو [مؤلف] بحجم 4px (أعلى اليمين) -->
                <div class="absolute top-1.5 right-1.5 sm:top-2 sm:right-2 z-10">
                  @if (isTranslated(novel)) {
                    <span class="badge-micro inline-flex items-center gap-0.5 px-1 py-0.5 rounded-sm bg-stone-950/90 text-indigo-300 border border-indigo-400/35 font-bold backdrop-blur-md shadow-md">
                      <mat-icon class="text-indigo-400">translate</mat-icon>
                      <span>مترجم</span>
                    </span>
                  } @else {
                    <span class="badge-micro inline-flex items-center gap-0.5 px-1 py-0.5 rounded-sm bg-stone-950/90 text-rose-300 border border-rose-400/35 font-bold backdrop-blur-md shadow-md">
                      <mat-icon class="text-rose-400">edit_note</mat-icon>
                      <span>مؤلف</span>
                    </span>
                  }
                </div>

                <!-- وسم التقييم فوق صورة الرواية مباشرة بحجم 4px (أسفل اليمين) -->
                <div class="absolute bottom-1.5 right-1.5 sm:bottom-2 sm:right-2 z-10">
                  <span class="badge-micro inline-flex items-center gap-0.5 px-1 py-0.5 rounded-sm bg-stone-950/90 text-amber-300 border border-amber-500/30 font-bold shadow-md backdrop-blur-md">
                    <mat-icon class="text-amber-400">star</mat-icon>
                    <span class="font-mono font-extrabold">{{ novel.rating || 4.9 }}</span>
                  </span>
                </div>
              </div>

              <!-- تفاصيل الرواية -->
              <div class="pt-2 px-0.5 space-y-1">
                <span class="text-[10px] sm:text-xs text-rose-400 font-semibold block truncate">
                  {{ isTranslated(novel) ? ('ترجمة: ' + novel.translator) : ('المؤلف: ' + novel.author) }}
                </span>

                <!-- العنوان مع نظام قياس ديناميكي والتفاف كامل لمنع الاقتطاع -->
                <div class="min-h-[2.4rem] sm:min-h-[3rem] flex items-center py-0.5">
                  <h3
                    [class]="getTitleClass(novel.title)"
                    class="font-amiri text-white leading-snug break-words line-clamp-2 group-hover:text-amber-300 transition-colors w-full"
                    [title]="novel.title"
                  >
                    {{ novel.title }}
                  </h3>
                </div>
              </div>
            </div>
          }
        </div>
      </section>

      <!-- ========================================================================= -->
      <!-- 4. ALL NOVELS EXPLORER: استكشاف كافة الروايات (شبكة 3 أعمدة × صفين لـ 6 روايات) -->
      <!-- ========================================================================= -->
      <section id="explore" class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-5 scroll-mt-24">
        
        <!-- Header with Search & Filter Pills -->
        <div class="space-y-4 border-b border-stone-800/60 pb-4">
          <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div class="flex items-center gap-3">
              <div class="w-2.5 h-7 rounded-full bg-gradient-to-b from-sky-500 to-indigo-600"></div>
              <div>
                <h2 class="text-xl sm:text-2xl font-bold font-amiri text-white tracking-wide">
                  استكشاف كافة الروايات
                </h2>
                <p class="text-xs text-stone-400 mt-0.5 font-sans">
                  تصفح الأعمال الأدبية حسب التصنيف أو ابحث بالاسم والمؤلف والمترجم
                </p>
              </div>
            </div>

            <!-- Instant Search Input -->
            <div class="relative w-full md:w-72">
              <input
                type="text"
                placeholder="ابحث بالاسم، المؤلف، أو المترجم..."
                [value]="searchQuery()"
                (input)="onSearchChange($event)"
                class="w-full bg-stone-900/90 border border-white/10 rounded-2xl pr-10 pl-4 py-2.5 text-xs text-white placeholder-stone-500 focus:outline-none focus:border-rose-500 transition-colors shadow-inner"
              />
              <mat-icon class="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 text-base pointer-events-none">
                search
              </mat-icon>
              @if (searchQuery()) {
                <button
                  type="button"
                  (click)="clearSearch()"
                  class="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-white cursor-pointer"
                  title="مسح البحث"
                >
                  <mat-icon class="text-sm">close</mat-icon>
                </button>
              }
            </div>
          </div>

          <!-- Dynamic Genre Filter Pills -->
          <div class="flex flex-wrap items-center gap-2 pt-1">
            @for (genre of availableGenres; track genre.id) {
              <button
                type="button"
                (click)="selectedGenre.set(genre.id)"
                [class]="selectedGenre() === genre.id 
                  ? 'bg-rose-600 text-white font-bold border-rose-500 shadow-md' 
                  : 'liquid-glass text-stone-300 hover:text-white border-white/10 hover:border-rose-500/30'"
                class="px-3.5 py-1.5 rounded-xl text-xs transition-all duration-300 cursor-pointer border flex items-center gap-1.5"
              >
                <mat-icon class="text-xs text-rose-400">{{ genre.icon }}</mat-icon>
                <span>{{ genre.label }}</span>
              </button>
            }
          </div>
        </div>

        <!-- شبكة ثابتة: 3 أعمدة × صفين (6 عناصر بترتيب RTL من اليمين لليسار) -->
        <div class="novels-grid parent">
          @for (novel of filteredNovels(); track novel.id; let i = $index) {
            <div
              (click)="selectNovel(novel)"
              (keydown.enter)="selectNovel(novel)"
              tabindex="0"
              role="button"
              [attr.aria-label]="'عرض تفاصيل رواية ' + novel.title"
              class="p-1.5 sm:p-2.5 lg:p-3 rounded-2xl sm:rounded-3xl liquid-glass-card border border-white/10 hover:border-rose-500/40 flex flex-col justify-between cursor-pointer group transition-all duration-300 shadow-xl min-w-0 h-full"
            >
              <!-- غلاف الرواية مع حجم مكبّر وبارز -->
              <div class="relative w-full aspect-[2/3] rounded-xl sm:rounded-2xl overflow-hidden bg-stone-900 border border-white/10 shadow-lg group-hover:border-rose-500/40 transition-all">
                <div [class]="'absolute inset-0 bg-gradient-to-br ' + novel.coverGradient">
                  <div class="absolute inset-0 opacity-20 bg-[radial-gradient(#e11d48_1px,transparent_1px)] [background-size:12px_12px] pointer-events-none"></div>
                </div>

                @if (novel.coverImage) {
                  <img
                    [src]="novel.coverImage"
                    [alt]="novel.title"
                    class="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    loading="lazy"
                  />
                }

                <div class="absolute inset-0 cover-inner-shadow pointer-events-none"></div>
                <div class="absolute inset-y-0 right-0 w-1.5 bg-gradient-to-l from-black/40 to-transparent pointer-events-none"></div>

                <!-- شارة نوع العمل: [مترجم] أو [مؤلف] بحجم 4px (أعلى اليسار) -->
                <div class="absolute top-1.5 left-1.5 sm:top-2 sm:left-2 z-10">
                  @if (isTranslated(novel)) {
                    <span class="badge-micro inline-flex items-center gap-0.5 px-1 py-0.5 rounded-sm bg-stone-950/90 text-indigo-300 border border-indigo-400/35 font-bold backdrop-blur-md shadow-md">
                      <mat-icon class="text-indigo-400">translate</mat-icon>
                      <span>مترجم</span>
                    </span>
                  } @else {
                    <span class="badge-micro inline-flex items-center gap-0.5 px-1 py-0.5 rounded-sm bg-stone-950/90 text-rose-300 border border-rose-400/35 font-bold backdrop-blur-md shadow-md">
                      <mat-icon class="text-rose-400">edit_note</mat-icon>
                      <span>مؤلف</span>
                    </span>
                  }
                </div>

                <!-- وسم التقييم فوق صورة الرواية مباشرة بحجم 4px (أسفل اليمين) -->
                <div class="absolute bottom-1.5 right-1.5 sm:bottom-2 sm:right-2 z-10">
                  <span class="badge-micro inline-flex items-center gap-0.5 px-1 py-0.5 rounded-sm bg-stone-950/90 text-amber-300 border border-amber-500/30 font-bold shadow-md backdrop-blur-md">
                    <mat-icon class="text-amber-400">star</mat-icon>
                    <span class="font-mono font-extrabold">{{ novel.rating || 4.8 }}</span>
                  </span>
                </div>
              </div>

              <!-- تفاصيل الرواية -->
              <div class="pt-2 px-0.5 space-y-1">
                <span class="text-[10px] sm:text-xs text-rose-400 font-semibold block truncate">
                  {{ isTranslated(novel) ? ('ترجمة: ' + novel.translator) : ('المؤلف: ' + novel.author) }}
                </span>

                <!-- العنوان مع نظام قياس ديناميكي والتفاف كامل لمنع الاقتطاع -->
                <div class="min-h-[2.4rem] sm:min-h-[3rem] flex items-center py-0.5">
                  <h3
                    [class]="getTitleClass(novel.title)"
                    class="font-amiri text-white leading-snug break-words line-clamp-2 group-hover:text-rose-300 transition-colors w-full"
                    [title]="novel.title"
                  >
                    {{ novel.title }}
                  </h3>
                </div>
              </div>
            </div>
          } @empty {
            <div class="col-span-full p-12 text-center liquid-glass rounded-3xl border border-white/10 space-y-3">
              <mat-icon class="text-4xl text-rose-400">search_off</mat-icon>
              <h3 class="text-lg font-bold font-amiri text-white">لم يتم العثور على أي رواية مطابقة</h3>
              <p class="text-xs text-stone-400 max-w-sm mx-auto">
                جرب البحث بكلمة أخرى أو قم بإلغاء التصفية لاستعراض جميع الروايات.
              </p>
              <button
                type="button"
                (click)="resetFilters()"
                class="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs transition-colors cursor-pointer"
              >
                عرض كافة الروايات
              </button>
            </div>
          }
        </div>
      </section>

      <!-- ========================================================================= -->
      <!-- 5. ENHANCED RECENT CHAPTER RELEASES FEED (شبكة 3 أعمدة × صفين لـ 6 فصول) -->
      <!-- ========================================================================= -->
      <section id="latest-chapters" class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-5 scroll-mt-24">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-800/60 pb-4">
          <div class="flex items-center gap-3">
            <div class="w-2.5 h-7 rounded-full bg-gradient-to-b from-emerald-500 to-rose-600"></div>
            <div>
              <h2 class="text-xl sm:text-2xl font-bold font-amiri text-white tracking-wide">
                أحدث الفصول المضافة
              </h2>
              <p class="text-xs text-stone-400 mt-0.5 font-sans">
                إصدارات جديدة مدققة وجاهزة للقراءة الفورية المباشرة
              </p>
            </div>
          </div>

          <div class="flex items-center gap-4">
            <span class="text-xs text-emerald-400 font-sans hidden sm:inline flex items-center gap-1">
              <span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>تحديث فوري</span>
            </span>
            <a
              routerLink="/reader"
              class="text-xs text-emerald-400 hover:text-emerald-300 font-sans flex items-center gap-1 cursor-pointer transition-colors"
            >
              <span>متابعة القراءة</span>
              <mat-icon class="text-xs">arrow_back</mat-icon>
            </a>
          </div>
        </div>

        <!-- شبكة ثابتة: 3 أعمدة × صفين (6 عناصر بترتيب RTL من اليمين لليسار) -->
        <div class="novels-grid parent">
          @for (item of latestChapterFeed(); track item.chapterId) {
            <div
              (click)="selectNovelById(item.novelId)"
              (keydown.enter)="selectNovelById(item.novelId)"
              tabindex="0"
              role="button"
              [attr.aria-label]="'عرض تفاصيل ' + item.novelTitle"
              class="p-1.5 sm:p-2.5 lg:p-3 rounded-2xl sm:rounded-3xl liquid-glass-card border border-white/10 hover:border-emerald-500/40 flex flex-col justify-between cursor-pointer group transition-all duration-300 shadow-xl min-w-0 h-full"
            >
              <!-- غلاف الرواية مع حجم مكبّر وبارز -->
              <div class="relative w-full aspect-[2/3] rounded-xl sm:rounded-2xl overflow-hidden bg-stone-900 border border-white/10 shadow-lg group-hover:border-emerald-500/40 transition-all">
                <div [class]="'absolute inset-0 bg-gradient-to-br ' + item.novelCoverGradient">
                  <div class="absolute inset-0 opacity-20 bg-[radial-gradient(#10b981_1px,transparent_1px)] [background-size:12px_12px] pointer-events-none"></div>
                </div>

                <div class="absolute inset-0 cover-inner-shadow pointer-events-none"></div>
                <div class="absolute inset-y-0 right-0 w-1.5 bg-gradient-to-l from-black/40 to-transparent pointer-events-none"></div>

                <!-- شارة رقم الفصل (أعلى اليمين) بحجم 4px كحد أقصى -->
                <div class="absolute top-1.5 right-1.5 sm:top-2 sm:right-2 z-10">
                  <span class="badge-micro inline-flex items-center px-1 py-0.5 rounded-sm bg-stone-950/90 text-emerald-300 border border-emerald-500/30 font-mono font-bold shadow-md backdrop-blur-md">
                    فصل {{ item.chapterIndex }}
                  </span>
                </div>

                <!-- شارة نوع العمل: [مترجم] أو [مؤلف] بحجم 4px (أعلى اليسار) -->
                <div class="absolute top-1.5 left-1.5 sm:top-2 sm:left-2 z-10">
                  @if (isTranslated(item)) {
                    <span class="badge-micro inline-flex items-center gap-0.5 px-1 py-0.5 rounded-sm bg-stone-950/90 text-indigo-300 border border-indigo-400/35 font-bold backdrop-blur-md shadow-md">
                      <mat-icon class="text-indigo-400">translate</mat-icon>
                      <span>مترجم</span>
                    </span>
                  } @else {
                    <span class="badge-micro inline-flex items-center gap-0.5 px-1 py-0.5 rounded-sm bg-stone-950/90 text-rose-300 border border-rose-400/35 font-bold backdrop-blur-md shadow-md">
                      <mat-icon class="text-rose-400">edit_note</mat-icon>
                      <span>مؤلف</span>
                    </span>
                  }
                </div>

                <!-- وسم عدد الكلمات فوق صورة الرواية مباشرة بحجم 4px (أسفل اليمين) -->
                <div class="absolute bottom-1.5 right-1.5 sm:bottom-2 sm:right-2 z-10">
                  <span class="badge-micro inline-flex items-center gap-0.5 px-1 py-0.5 rounded-sm bg-stone-950/90 text-emerald-300 border border-emerald-500/30 font-bold shadow-md backdrop-blur-md">
                    <mat-icon class="text-emerald-400">menu_book</mat-icon>
                    <span class="font-mono font-extrabold">{{ item.wordCount }} كلمة</span>
                  </span>
                </div>
              </div>

              <!-- نصوص البطاقة المبسطة: مؤلف/مترجم باللون القرمزي + اسم الرواية وفصلها -->
              <div class="pt-2 px-0.5 space-y-1">
                <span class="text-[10px] sm:text-xs text-rose-400 font-semibold block truncate">
                  {{ isTranslated(item) ? ('ترجمة: ' + item.translator) : ('المؤلف: ' + item.author) }}
                </span>

                <!-- العنوان مع نظام قياس ديناميكي والتفاف كامل لمنع الاقتطاع -->
                <div class="min-h-[2.4rem] sm:min-h-[3rem] flex items-center py-0.5">
                  <h3
                    [class]="getTitleClass(item.novelTitle)"
                    class="font-amiri text-white leading-snug break-words line-clamp-2 group-hover:text-emerald-300 transition-colors w-full"
                    [title]="item.novelTitle"
                  >
                    {{ item.novelTitle }}
                  </h3>
                </div>

                <p class="text-[9px] sm:text-[11px] text-stone-400 truncate font-sans">
                  فصل {{ item.chapterIndex }}: {{ item.chapterTitle }}
                </p>
              </div>
            </div>
          }
        </div>
      </section>

      <!-- ========================================================================= -->
      <!-- 6. PLATFORM PILLARS & COMFORT (مزايا مقاتل الروايات والراحة البصرية) -->
      <!-- ========================================================================= -->
      <section class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="p-6 sm:p-10 rounded-3xl liquid-glass border border-white/10 space-y-8">
          <div class="text-center space-y-2 max-w-2xl mx-auto">
            <span class="text-xs font-bold text-rose-400 uppercase tracking-widest block">تجربة قراءة رفيعة المستوى</span>
            <h2 class="text-2xl sm:text-3xl font-extrabold font-amiri text-white">
              لماذا يختار المقاتلون منصتنا؟
            </h2>
            <p class="text-xs text-stone-400 font-sans">
              صُممت منصة مقاتل الروايات لتوفر أقصى درجات الراحة البصرية والأدبية لعشاق القراءة الحقيقيين.
            </p>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            <!-- Feature 1 -->
            <div class="p-5 rounded-2xl bg-stone-900/60 border border-white/5 space-y-2.5">
              <div class="w-10 h-10 rounded-xl bg-rose-600/20 text-rose-400 flex items-center justify-center border border-rose-500/30">
                <mat-icon>tune</mat-icon>
              </div>
              <h3 class="text-sm font-bold font-amiri text-white">مظهر قراءة فائق التخصيص</h3>
              <p class="text-[11px] text-stone-400 leading-relaxed font-sans">
                6 خطوط عربية كلاسيكية وعصرية، 6 سمات لونية لراحة العين، محاذاة مرنة وتعتيم ليلي متقدم.
              </p>
            </div>

            <!-- Feature 2 -->
            <div class="p-5 rounded-2xl bg-stone-900/60 border border-white/5 space-y-2.5">
              <div class="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30">
                <mat-icon>verified</mat-icon>
              </div>
              <h3 class="text-sm font-bold font-amiri text-white">حفظ حقوق المترجمين والمؤلفين</h3>
              <p class="text-[11px] text-stone-400 leading-relaxed font-sans">
                توثيق كامل لفرق الترجمة والمؤلفين مع أغلفة وأيقونات تعريفية وحماية الحقوق الأدبية.
              </p>
            </div>

            <!-- Feature 3 -->
            <div class="p-5 rounded-2xl bg-stone-900/60 border border-white/5 space-y-2.5">
              <div class="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
                <mat-icon>bolt</mat-icon>
              </div>
              <h3 class="text-sm font-bold font-amiri text-white">قراءة فورية بدون إعلانات</h3>
              <p class="text-[11px] text-stone-400 leading-relaxed font-sans">
                سرعة تحميل فائقة وتصفح نقي خالٍ تماماً من النوافذ المنبثقة والإعلانات المزعجة.
              </p>
            </div>

            <!-- Feature 4 -->
            <div class="p-5 rounded-2xl bg-stone-900/60 border border-white/5 space-y-2.5">
              <div class="w-10 h-10 rounded-xl bg-sky-500/20 text-sky-400 flex items-center justify-center border border-sky-500/30">
                <mat-icon>cloud_sync</mat-icon>
              </div>
              <h3 class="text-sm font-bold font-amiri text-white">مزامنة التقدم والتعليقات</h3>
              <p class="text-[11px] text-stone-400 leading-relaxed font-sans">
                حفظ الفصول المقروءة ومفضلتك تلقائياً مع نظام تعليقات تفاعلي بأيقونتك وغلافك الخاص.
              </p>
            </div>
          </div>
        </div>
      </section>

    </div>
  `,
})
export class NovelLibrary implements OnInit {
  readonly store = inject(NovelStore);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  readonly selectedGenre = this.store.selectedCategoryFilter;
  readonly heroMode = signal<HeroMode>('most_read');
  readonly searchQuery = signal<string>('');

  ngOnInit(): void {
    const q = this.route.snapshot.queryParams['q'];
    if (q) {
      this.searchQuery.set(q);
      setTimeout(() => {
        const el = document.getElementById('explore');
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 200);
    }
  }

  scrollToSection(id: string, event?: Event): void {
    if (event) event.preventDefault();
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  readonly availableGenres = [
    { id: 'all', label: 'كافة الروايات', icon: 'auto_stories' },
    { id: 'fantasy', label: 'فانتازيا وخيال', icon: 'auto_fix_high' },
    { id: 'translated', label: 'روايات مترجمة', icon: 'translate' },
    { id: 'mystery', label: 'غموض وتشويق', icon: 'visibility' },
    { id: 'history', label: 'تاريخ وأدب عربي', icon: 'history_edu' },
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

  // 3x3: ثلاث فوق ثلاث (6 عناصر للأكثر قراءة)
  readonly topRankedNovels = computed(() => {
    return this.mostReadNovels().slice(0, 6);
  });

  // 3x3: ثلاث فوق ثلاث (6 عناصر لآخر الإضافات)
  readonly latestAddedNovels = computed(() => {
    const list = [...this.store.novels()];
    return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 6);
  });

  // 3x3: ثلاث فوق ثلاث (6 عناصر لاستكشاف الروايات)
  readonly filteredNovels = computed(() => {
    const list = this.store.novels();
    const genre = this.selectedGenre();
    const q = this.searchQuery().trim().toLowerCase();
    
    let res = list;
    if (genre !== 'all') {
      if (genre === 'fantasy') res = res.filter(n => n.category.includes('فانتازيا') || n.category.includes('خيال') || n.category.includes('قتالية'));
      else if (genre === 'translated') res = res.filter(n => n.category.includes('مترجم') || (n.translator && n.translator !== 'الأصل العربي'));
      else if (genre === 'mystery') res = res.filter(n => n.category.includes('غموض') || n.category.includes('سايبر'));
      else if (genre === 'history') res = res.filter(n => n.category.includes('تاريخ') || n.category.includes('عربي'));
    }

    if (q) {
      res = res.filter(n =>
        n.title.toLowerCase().includes(q) ||
        n.author.toLowerCase().includes(q) ||
        (n.translator && n.translator.toLowerCase().includes(q)) ||
        n.category.toLowerCase().includes(q)
      );
    }

    return res.slice(0, 6);
  });

  // ماعدى قسم أحدث الفصول (عمودان فسيحان للقراءة الفورية)
  readonly latestChapterFeed = computed<RecentChapterItem[]>(() => {
    const novels = this.store.novels();
    const items: RecentChapterItem[] = [];

    for (const novel of novels) {
      if (novel.chapters.length > 0) {
        const latestCh = novel.chapters[novel.chapters.length - 1];
        items.push({
          novelId: novel.id,
          novelTitle: novel.title,
          novelCoverGradient: novel.coverGradient,
          author: novel.author,
          translator: novel.translator,
          chapterId: latestCh.id,
          chapterIndex: latestCh.chapterIndex,
          chapterTitle: latestCh.title,
          wordCount: latestCh.wordCount,
        });
      }
    }

    return items.slice(0, 6);
  });

  setHeroMode(mode: HeroMode): void {
    this.heroMode.set(mode);
  }

  onSearchChange(event: Event): void {
    const val = (event.target as HTMLInputElement).value;
    this.searchQuery.set(val);
  }

  clearSearch(): void {
    this.searchQuery.set('');
  }

  resetFilters(): void {
    this.searchQuery.set('');
    this.selectedGenre.set('all');
  }

  selectNovel(novel: Novel): void {
    this.store.selectNovel(novel.id);
    this.router.navigate(['/novel', novel.id]);
  }

  selectNovelById(novelId: string): void {
    this.store.selectNovel(novelId);
    this.router.navigate(['/novel', novelId]);
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

  readChapterDirect(novelId: string, chapterId: string): void {
    this.store.selectNovel(novelId);
    this.store.selectChapter(novelId, chapterId);
    this.router.navigate(['/reader', novelId, chapterId]);
  }

  isTranslated(novel: { translator?: string }): boolean {
    const t = novel.translator?.trim();
    return !!(t && t !== 'الأصل العربي');
  }

  getTitleClass(title?: string): string {
    if (!title) return 'text-xs sm:text-base';
    const len = title.trim().length;
    if (len <= 16) {
      return 'text-xs sm:text-base font-bold';
    } else if (len <= 26) {
      return 'text-[11.5px] sm:text-[14px] font-bold';
    } else {
      return 'text-[10px] sm:text-[12.5px] font-semibold';
    }
  }
}
