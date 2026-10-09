import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
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
  imports: [MatIconModule],
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
      <!-- 2. LEADERBOARD: قائمة الصدارة الأكثر قراءة (توزيع 3x3 ثلاث فوق ثلاث مع غلافات مصغرة) -->
      <!-- ========================================================================= -->
      <section class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-5">
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

          <span class="text-xs text-rose-400 font-sans hidden sm:inline flex items-center gap-1">
            <mat-icon class="text-sm">trending_up</mat-icon>
            <span>ترتيب المشاهدات</span>
          </span>
        </div>

        <!-- 3x3: ثلاث فوق ثلاث (6 عناصر: 3 أعمدة في صفين - شبكة 6x6 مخصصة) -->
        <div class="parent">
          @for (novel of topRankedNovels(); track novel.id; let i = $index) {
            <div
              (click)="selectNovel(novel)"
              (keydown.enter)="selectNovel(novel)"
              tabindex="0"
              role="button"
              [attr.aria-label]="'عرض تفاصيل ' + novel.title"
              [class]="'div' + (i + 1) + ' p-3.5 rounded-2xl liquid-glass-card border border-white/10 hover:border-rose-500/30 flex items-center gap-3 cursor-pointer group transition-all duration-300'"
            >
              <!-- Numeric Rank Badge -->
              <div class="text-xl sm:text-2xl font-extrabold font-mono-code text-rose-400/90 select-none w-7 text-center shrink-0">
                0{{ i + 1 }}
              </div>

              <!-- Compact Cover Thumbnail (صغر حجم الغلاف) -->
              <div [class]="'w-11 h-15 rounded-lg bg-gradient-to-br ' + novel.coverGradient + ' shrink-0 overflow-hidden relative border border-white/10 shadow-sm group-hover:scale-105 transition-transform'">
                <div class="absolute inset-0 cover-inner-shadow"></div>
                <div class="absolute bottom-0.5 right-0.5 text-[8px] font-bold text-white bg-black/80 px-1 rounded font-mono">
                  ★ {{ novel.rating || 4.9 }}
                </div>
              </div>

              <!-- Novel Details -->
              <div class="flex-1 min-w-0 space-y-0.5">
                <span class="text-[9px] text-rose-400 font-semibold block truncate">
                  {{ novel.category }}
                </span>

                <h3 class="text-xs sm:text-sm font-bold font-amiri text-white truncate group-hover:text-rose-300 transition-colors">
                  {{ novel.title }}
                </h3>

                <!-- Author - Translator -->
                <div class="text-[10px] text-stone-400 truncate font-sans">
                  <span>{{ novel.author }}</span>
                  <span class="text-rose-500 mx-1">·</span>
                  <span class="text-stone-300">{{ novel.translator || 'الأصل العربي' }}</span>
                </div>

                <div class="text-[10px] text-stone-400 flex items-center gap-2 pt-0.5 font-sans">
                  <span>{{ novel.chapters.length }} فصول</span>
                  <span>·</span>
                  <span>{{ novel.views }} قراءة</span>
                </div>
              </div>

              <mat-icon class="text-stone-600 group-hover:text-rose-400 text-base transition-colors shrink-0">
                chevron_left
              </mat-icon>
            </div>
          }
        </div>
      </section>

      <!-- ========================================================================= -->
      <!-- 3. LATEST ADDITIONS: قسم آخر الإضافات (توزيع 3x3 ثلاث فوق ثلاث للروايات الجديدة) -->
      <!-- ========================================================================= -->
      <section class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-5">
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

          <span class="text-xs text-amber-400 font-sans hidden sm:inline flex items-center gap-1">
            <mat-icon class="text-sm">auto_awesome</mat-icon>
            <span>أعمال جديدة</span>
          </span>
        </div>

        <!-- 3x3: ثلاث فوق ثلاث (6 عناصر: 3 أعمدة في صفين - شبكة 6x6 مخصصة) -->
        <div class="parent">
          @for (novel of latestAddedNovels(); track novel.id; let i = $index) {
            <div
              (click)="selectNovel(novel)"
              (keydown.enter)="selectNovel(novel)"
              tabindex="0"
              role="button"
              [attr.aria-label]="'عرض تفاصيل رواية ' + novel.title"
              [class]="'div' + (i + 1) + ' p-3.5 rounded-2xl liquid-glass-card border border-white/10 hover:border-amber-500/30 flex items-center gap-3 cursor-pointer group transition-all duration-300'"
            >
              <!-- New Badge or Sparkle -->
              <div class="w-7 text-center shrink-0 flex items-center justify-center">
                <span class="px-1.5 py-0.5 rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[9px] font-bold">
                  جديد
                </span>
              </div>

              <!-- Compact Cover Thumbnail (صغر حجم الغلاف) -->
              <div [class]="'w-11 h-15 rounded-lg bg-gradient-to-br ' + novel.coverGradient + ' shrink-0 overflow-hidden relative border border-white/10 shadow-sm group-hover:scale-105 transition-transform'">
                <div class="absolute inset-0 cover-inner-shadow"></div>
                <div class="absolute bottom-0.5 right-0.5 text-[8px] font-bold text-white bg-black/80 px-1 rounded font-mono">
                  ★ {{ novel.rating || 4.9 }}
                </div>
              </div>

              <!-- Novel Details -->
              <div class="flex-1 min-w-0 space-y-0.5">
                <span class="text-[9px] text-amber-400/90 font-semibold block truncate">
                  {{ novel.category }}
                </span>

                <h3 class="text-xs sm:text-sm font-bold font-amiri text-white truncate group-hover:text-amber-300 transition-colors">
                  {{ novel.title }}
                </h3>

                <!-- Author - Translator -->
                <div class="text-[10px] text-stone-400 truncate font-sans">
                  <span>{{ novel.author }}</span>
                  <span class="text-amber-500 mx-1">·</span>
                  <span class="text-stone-300">{{ novel.translator || 'الأصل العربي' }}</span>
                </div>

                <div class="text-[10px] text-stone-400 flex items-center gap-2 pt-0.5 font-sans">
                  <span>{{ novel.chapters.length }} فصول</span>
                  <span>·</span>
                  <span>{{ novel.views }} قراءة</span>
                </div>
              </div>

              <mat-icon class="text-stone-600 group-hover:text-amber-400 text-base transition-colors shrink-0">
                chevron_left
              </mat-icon>
            </div>
          }
        </div>
      </section>

      <!-- ========================================================================= -->
      <!-- 4. ALL NOVELS EXPLORER: استكشاف كافة الروايات (توزيع 3x3 ثلاث فوق ثلاث) -->
      <!-- ========================================================================= -->
      <section class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-5">
        
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

        <!-- 3x3: ثلاث فوق ثلاث (6 عناصر: 3 أعمدة في صفين - شبكة 6x6 مخصصة) -->
        <div class="parent">
          @for (novel of filteredNovels(); track novel.id; let i = $index) {
            <div
              (click)="selectNovel(novel)"
              (keydown.enter)="selectNovel(novel)"
              tabindex="0"
              role="button"
              [attr.aria-label]="'عرض تفاصيل رواية ' + novel.title"
              [class]="'div' + (i + 1) + ' p-3.5 rounded-2xl liquid-glass-card border border-white/10 hover:border-rose-500/30 flex items-center gap-3 cursor-pointer group transition-all duration-300'"
            >
              <!-- Index or Category Marker -->
              <div class="w-7 text-center shrink-0 flex items-center justify-center">
                <span class="w-2 h-2 rounded-full bg-rose-500/60 group-hover:scale-125 transition-transform"></span>
              </div>

              <!-- Compact Cover Thumbnail (صغر حجم الغلاف) -->
              <div [class]="'w-11 h-15 rounded-lg bg-gradient-to-br ' + novel.coverGradient + ' shrink-0 overflow-hidden relative border border-white/10 shadow-sm group-hover:scale-105 transition-transform'">
                <div class="absolute inset-0 cover-inner-shadow"></div>
                <div class="absolute bottom-0.5 right-0.5 text-[8px] font-bold text-white bg-black/80 px-1 rounded font-mono">
                  ★ {{ novel.rating || 4.8 }}
                </div>
              </div>

              <!-- Novel Details -->
              <div class="flex-1 min-w-0 space-y-0.5">
                <span class="text-[9px] text-rose-400 font-semibold block truncate">
                  {{ novel.category }}
                </span>

                <h3 class="text-xs sm:text-sm font-bold font-amiri text-white truncate group-hover:text-rose-300 transition-colors">
                  {{ novel.title }}
                </h3>

                <!-- Author - Translator -->
                <div class="text-[10px] text-stone-400 truncate font-sans">
                  <span>{{ novel.author }}</span>
                  <span class="text-rose-500 mx-1">·</span>
                  <span class="text-stone-300">{{ novel.translator || 'الأصل العربي' }}</span>
                </div>

                <div class="text-[10px] text-stone-400 flex items-center gap-2 pt-0.5 font-sans">
                  <span>{{ novel.chapters.length }} فصول</span>
                  <span>·</span>
                  <span>{{ novel.views }} قراءة</span>
                </div>
              </div>

              <mat-icon class="text-stone-600 group-hover:text-rose-400 text-base transition-colors shrink-0">
                chevron_left
              </mat-icon>
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
      <!-- 5. ENHANCED RECENT CHAPTER RELEASES FEED (ماعدى قسم أحدث الفصول - تصميم فسيح ومحسن) -->
      <!-- ========================================================================= -->
      <section class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-5">
        <div class="flex items-center justify-between border-b border-stone-800/60 pb-4">
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

          <span class="text-xs text-emerald-400 font-sans hidden sm:inline flex items-center gap-1">
            <span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>تحديث فوري</span>
          </span>
        </div>

        <!-- Enhanced Chapter Feed Grid (عمودان واسعان فسيحان - استثناء عن توزيع 3x3 لراحة العنوان) -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
          @for (item of latestChapterFeed(); track item.chapterId) {
            <div class="p-4 rounded-2xl liquid-glass border border-white/10 hover:border-emerald-500/40 flex items-center justify-between gap-4 group transition-all duration-300 shadow-md">
              
              <!-- Left Info with Cover Thumbnail -->
              <div class="flex items-center gap-3.5 min-w-0">
                <!-- Mini Cover -->
                <div [class]="'w-12 h-16 rounded-xl bg-gradient-to-br ' + item.novelCoverGradient + ' shrink-0 overflow-hidden relative border border-white/10 shadow-sm'">
                  <div class="absolute inset-0 cover-inner-shadow"></div>
                </div>

                <!-- Text metadata -->
                <div class="min-w-0 space-y-1">
                  <a
                    (click)="selectNovelById(item.novelId)"
                    (keydown.enter)="selectNovelById(item.novelId)"
                    tabindex="0"
                    role="button"
                    class="text-[11px] text-rose-400 hover:text-rose-300 font-semibold block truncate cursor-pointer transition-colors"
                  >
                    {{ item.novelTitle }}
                  </a>
                  
                  <h4 class="text-xs sm:text-sm font-bold text-white truncate group-hover:text-emerald-300 transition-colors font-amiri">
                    فصل {{ item.chapterIndex }}: {{ item.chapterTitle }}
                  </h4>

                  <div class="text-[10px] text-stone-400 flex items-center gap-2 font-sans truncate">
                    <span>{{ item.wordCount }} كلمة</span>
                    <span>·</span>
                    <span class="truncate">بقلم {{ item.author }}</span>
                  </div>
                </div>
              </div>

              <!-- Direct Reading Button -->
              <button
                type="button"
                (click)="readChapterDirect(item.novelId, item.chapterId)"
                class="px-4 py-2 rounded-xl bg-emerald-600/20 hover:bg-emerald-600 text-emerald-300 hover:text-white border border-emerald-500/30 text-xs font-bold transition-all shrink-0 cursor-pointer flex items-center gap-1.5"
                title="قراءة هذا الفصل مباشرة"
              >
                <mat-icon class="text-base">menu_book</mat-icon>
                <span>اقرأ الفصل</span>
              </button>

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
export class NovelLibrary {
  readonly store = inject(NovelStore);
  private readonly router = inject(Router);

  readonly selectedGenre = this.store.selectedCategoryFilter;
  readonly heroMode = signal<HeroMode>('most_read');
  readonly searchQuery = signal<string>('');

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
}
