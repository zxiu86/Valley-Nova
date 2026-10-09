import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { NovelStore } from '../core/novel-store';
import { ChapterSummary, Novel } from '../core/novel-models';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-novel-details',
  imports: [RouterLink, MatIconModule],
  template: `
    <div class="min-h-screen text-stone-100 pb-24">
      
      @if (currentNovel(); as novel) {
        
        <!-- Breadcrumbs & Quick Return Bar -->
        <nav aria-label="مسار التنقل" class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-4">
          <div class="flex flex-wrap items-center justify-between gap-4 border-b border-stone-800/80 pb-4">
            <div class="flex items-center gap-2 text-xs sm:text-sm text-stone-400 font-sans">
              <a routerLink="/" class="hover:text-rose-400 transition-colors flex items-center gap-1">
                <mat-icon class="text-base text-rose-500">home</mat-icon>
                <span>الرئيسية</span>
              </a>
              <span class="text-stone-600">/</span>
              <a routerLink="/" class="hover:text-rose-400 transition-colors">
                {{ novel.category }}
              </a>
              <span class="text-stone-600">/</span>
              <span class="text-rose-300 font-bold truncate max-w-[200px] sm:max-w-md">
                {{ novel.title }}
              </span>
            </div>

            <button
              type="button"
              (click)="goBack()"
              class="flex items-center gap-1.5 px-3 py-1.5 rounded-xl liquid-glass hover:bg-stone-800/80 text-stone-300 hover:text-white border border-white/10 text-xs transition-colors cursor-pointer"
            >
              <mat-icon class="text-sm">arrow_forward</mat-icon>
              <span>العودة للمكتبة</span>
            </button>
          </div>
        </nav>

        <!-- ========================================================================= -->
        <!-- 1. HERO SHOWCASE: THE NOVEL PROFILE -->
        <!-- ========================================================================= -->
        <header class="relative overflow-hidden pt-6 pb-12 px-4 sm:px-6 lg:px-8 border-b border-stone-800/80">
          <!-- Subtle Soft Ambient Light -->
          <div class="absolute top-1/4 right-1/4 w-96 h-96 bg-rose-950/20 rounded-full blur-3xl pointer-events-none"></div>

          <div class="max-w-7xl mx-auto">
            <div class="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
              
              <!-- Left / Cover Art Column (4 cols) -->
              <div class="lg:col-span-4 flex flex-col items-center sm:items-start space-y-4">
                <!-- Book Cover Jacket with Soft Inner Shading -->
                <div class="relative w-64 sm:w-72 lg:w-full h-96 sm:h-[440px] rounded-3xl overflow-hidden liquid-glass-card shadow-2xl border border-white/10 group mx-auto">
                  <!-- Cover Gradient Artwork -->
                  <div [class]="'absolute inset-0 bg-gradient-to-br ' + novel.coverGradient">
                    <div class="absolute inset-0 opacity-15 bg-[radial-gradient(#e11d48_1px,transparent_1px)] [background-size:16px_16px]"></div>
                  </div>

                  <!-- Inner Vignette Shadow -->
                  <div class="absolute inset-0 cover-inner-shadow pointer-events-none"></div>

                  <!-- Top Badges -->
                  <div class="absolute top-4 right-4 left-4 flex items-center justify-between z-10">
                    <span class="px-3 py-1 rounded-lg liquid-glass text-rose-300 border border-white/10 text-xs font-bold shadow-sm backdrop-blur-md">
                      {{ novel.badge || novel.category }}
                    </span>

                    <span class="px-2.5 py-1 rounded-lg liquid-glass text-emerald-400 border border-emerald-500/30 text-[11px] font-bold shadow-sm flex items-center gap-1">
                      <span class="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                      <span>مستمرة</span>
                    </span>
                  </div>

                  <!-- Bottom Cover Shading & Title Impression -->
                  <div class="absolute bottom-0 inset-x-0 p-6 z-10 space-y-1">
                    <span class="text-xs text-rose-300 font-semibold block">
                      {{ novel.author }}
                    </span>
                    <h3 class="text-xl font-bold font-amiri text-white leading-tight drop-shadow-md">
                      {{ novel.title }}
                    </h3>
                  </div>
                </div>

                <!-- Fast Actions Strip Under Cover -->
                <div class="w-full flex items-center justify-center gap-2 pt-2">
                  <button
                    type="button"
                    (click)="toggleBookmark()"
                    [class]="isBookmarked() ? 'bg-rose-600/30 text-rose-300 border-rose-500/50' : 'liquid-glass text-stone-300 border-white/10'"
                    class="flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-2xl border text-xs font-semibold transition-all cursor-pointer hover:border-rose-500/40"
                  >
                    <mat-icon class="text-base text-rose-400">
                      {{ isBookmarked() ? 'bookmark' : 'bookmark_border' }}
                    </mat-icon>
                    <span>{{ isBookmarked() ? 'في المفضلة' : 'حفظ في المفضلة' }}</span>
                  </button>

                  <button
                    type="button"
                    (click)="shareNovel()"
                    class="flex items-center justify-center gap-1.5 py-2.5 px-4 rounded-2xl liquid-glass text-stone-300 hover:text-white border border-white/10 text-xs font-semibold transition-all cursor-pointer hover:border-rose-500/40"
                  >
                    <mat-icon class="text-base text-rose-400">share</mat-icon>
                    <span>مشاركة</span>
                  </button>
                </div>

                @if (copyNotice()) {
                  <div class="w-full text-center text-xs text-emerald-400 bg-emerald-950/40 border border-emerald-500/30 py-1.5 px-3 rounded-xl animate-in fade-in">
                    {{ copyNotice() }}
                  </div>
                }
              </div>

              <!-- Right / Information Column (8 cols) -->
              <div class="lg:col-span-8 space-y-6">
                
                <!-- Category, Status, and Badges -->
                <div class="flex flex-wrap items-center gap-2.5">
                  <span class="px-3 py-1 rounded-full bg-rose-600/20 text-rose-300 border border-rose-500/30 text-xs font-bold">
                    {{ novel.category }}
                  </span>
                  
                  <span class="px-3 py-1 rounded-full liquid-glass border border-white/10 text-xs text-stone-300">
                    {{ isTranslated() ? 'رواية مترجمة معتمدة' : 'رواية عربية أصلية' }}
                  </span>

                  <span class="px-3 py-1 rounded-full liquid-glass border border-white/10 text-xs text-stone-300 flex items-center gap-1">
                    <mat-icon class="text-xs text-emerald-400">check_circle</mat-icon>
                    <span>فصول كاملة وتدقيق لغوي</span>
                  </span>
                </div>

                <!-- Grand Novel Title -->
                <h1 class="text-3xl sm:text-4xl lg:text-5xl font-extrabold font-amiri text-white leading-tight">
                  {{ novel.title }}
                </h1>

                <!-- COMPREHENSIVE DATA MATRIX: التقييم، الفصول، القراءات، الكلمات -->
                <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
                  <!-- 1. التقييم العام -->
                  <div class="p-4 rounded-2xl liquid-glass border border-white/10 space-y-1">
                    <div class="flex items-center justify-between text-xs text-stone-400">
                      <span>التقييم العام</span>
                      <mat-icon class="text-amber-400 text-sm">star</mat-icon>
                    </div>
                    <div class="text-2xl font-extrabold text-white font-mono-code flex items-baseline gap-1">
                      <span>{{ novel.rating || 4.9 }}</span>
                      <span class="text-xs text-stone-500 font-normal">/ 5.0</span>
                    </div>
                    <span class="text-[10px] text-amber-300 block">
                      {{ userRatingCount() }} تقييم قارئ
                    </span>
                  </div>

                  <!-- 2. عدد الفصول -->
                  <div class="p-4 rounded-2xl liquid-glass border border-white/10 space-y-1">
                    <div class="flex items-center justify-between text-xs text-stone-400">
                      <span>عدد الفصول</span>
                      <mat-icon class="text-rose-400 text-sm">auto_stories</mat-icon>
                    </div>
                    <div class="text-2xl font-extrabold text-white font-mono-code">
                      {{ novel.chapters.length }}
                    </div>
                    <span class="text-[10px] text-rose-300 block">
                      فصول متاحة للقراءة
                    </span>
                  </div>

                  <!-- 3. عدد القراءات -->
                  <div class="p-4 rounded-2xl liquid-glass border border-white/10 space-y-1">
                    <div class="flex items-center justify-between text-xs text-stone-400">
                      <span>عدد القراءات</span>
                      <mat-icon class="text-rose-400 text-sm">visibility</mat-icon>
                    </div>
                    <div class="text-2xl font-extrabold text-white font-mono-code">
                      {{ novel.views }}
                    </div>
                    <span class="text-[10px] text-stone-400 block">
                      مشاهدة وقراءة نشطة
                    </span>
                  </div>

                  <!-- 4. إجمالي الكلمات -->
                  <div class="p-4 rounded-2xl liquid-glass border border-white/10 space-y-1">
                    <div class="flex items-center justify-between text-xs text-stone-400">
                      <span>إجمالي الكلمات</span>
                      <mat-icon class="text-rose-400 text-sm">format_shapes</mat-icon>
                    </div>
                    <div class="text-2xl font-extrabold text-white font-mono-code">
                      {{ totalWordCount() }}
                    </div>
                    <span class="text-[10px] text-stone-400 block">
                      ~{{ estimatedReadingTime() }} دقيقة قراءة
                    </span>
                  </div>
                </div>

                <!-- ========================================================================= -->
                <!-- INTERACTIVE ONE-TIME RATING BAR (تقييم تفاعلي صحيح لمرة واحدة دون تضخيم لانهائي) -->
                <!-- ========================================================================= -->
                <div class="p-4 sm:p-5 rounded-2xl liquid-glass border border-amber-500/25 space-y-2.5">
                  <div class="flex flex-wrap items-center justify-between gap-2">
                    <div class="flex items-center gap-2">
                      <div class="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center">
                        <mat-icon class="text-base">star_rate</mat-icon>
                      </div>
                      <div>
                        <span class="text-xs font-bold text-white block">تقييمك الشخصي للرواية</span>
                        <span class="text-[11px] text-stone-400">
                          @if (myRating()) {
                            لقد قيّمت هذه الرواية بـ {{ myRating() }} نجوم. (يمكنك تعديل تقييمك متى شئت)
                          } @else {
                            انقر على النجوم أدناه لتسجيل تقييمك للرواية (يُحتسب صوت واحد فقط)
                          }
                        </span>
                      </div>
                    </div>

                    @if (myRating()) {
                      <span class="px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[11px] font-bold flex items-center gap-1">
                        <mat-icon class="text-xs">check</mat-icon>
                        <span>تم تسجيل تقييمك: {{ myRating() }}/5</span>
                      </span>
                    }
                  </div>

                  <!-- Interactive 5-Star Row with Hover Preview -->
                  <div class="flex items-center gap-2 pt-1">
                    <div
                      class="flex items-center gap-1 bg-stone-950/70 p-1.5 rounded-xl border border-white/10"
                      (mouseleave)="onStarsMouseLeave()"
                    >
                      @for (star of [1, 2, 3, 4, 5]; track star) {
                        <button
                          type="button"
                          (click)="rateNovel(star)"
                          (mouseenter)="onStarMouseEnter(star)"
                          [title]="'تقييم ' + star + ' من 5'"
                          class="p-1.5 rounded-lg hover:scale-120 transition-all cursor-pointer focus:outline-none"
                        >
                          <mat-icon
                            [class]="getStarClass(star)"
                            class="text-xl transition-colors"
                          >
                            star
                          </mat-icon>
                        </button>
                      }
                    </div>

                    <span class="text-xs text-stone-400 font-sans">
                      @if (hoveredStars() > 0) {
                        <strong class="text-amber-400 font-bold">{{ hoveredStars() }} من 5</strong> (انقر للتأكيد)
                      } @else if (myRating()) {
                        <span class="text-stone-300">تقييمك محفوظ</span>
                      } @else {
                        <span>اختر من 1 إلى 5 نجوم</span>
                      }
                    </span>
                  </div>
                </div>

                <!-- ========================================================================= -->
                <!-- PUBLISHER & RIGHTS SECTION: DIRECTLY UNDER STAR RATING (حقوق الناشر والمترجم/المؤلف) -->
                <!-- ========================================================================= -->
                <div class="rounded-3xl overflow-hidden border border-rose-500/25 liquid-glass-card shadow-xl space-y-0">
                  
                  <!-- Top Banner / Background of the Creator (غلاف خلفي سينمائي) -->
                  <div class="relative h-28 sm:h-36 w-full overflow-hidden bg-stone-900">
                    <img
                      [src]="getCreatorCover()"
                      [alt]="getCreatorName()"
                      referrerpolicy="no-referrer"
                      class="w-full h-full object-cover"
                    />
                    <!-- Inner shading and blending into card background -->
                    <div class="absolute inset-0 bg-gradient-to-t from-stone-950 via-stone-950/60 to-black/30 pointer-events-none"></div>
                    <div class="absolute inset-0 cover-inner-shadow pointer-events-none"></div>

                    <!-- Top Badge in Banner -->
                    <div class="absolute top-3 right-4 z-10 flex items-center gap-2">
                      <span class="px-3 py-1 rounded-full bg-black/60 backdrop-blur-md border border-white/15 text-[11px] font-bold text-rose-300 flex items-center gap-1.5">
                        <mat-icon class="text-xs text-rose-400">verified</mat-icon>
                        <span>{{ isTranslated() ? 'حقوق الترجمة والتعريب' : 'حقوق التأليف والملكية الفكرية' }}</span>
                      </span>
                    </div>

                    <!-- Overlapping Creator Circular Avatar and Name -->
                    <div class="absolute bottom-3 right-4 z-10 flex items-center gap-3.5">
                      <!-- Circular Avatar with glowing border -->
                      <div class="w-14 h-14 sm:w-16 sm:h-16 rounded-full overflow-hidden border-2 border-rose-500 shadow-2xl bg-stone-950 shrink-0">
                        @if (getCreatorAvatar()) {
                          <img
                            [src]="getCreatorAvatar()"
                            [alt]="getCreatorName()"
                            referrerpolicy="no-referrer"
                            class="w-full h-full object-cover"
                          />
                        } @else {
                          <div class="w-full h-full bg-gradient-to-br from-rose-700 to-stone-900 flex items-center justify-center text-white font-bold text-xl font-amiri">
                            {{ getCreatorName().charAt(0) || 'ق' }}
                          </div>
                        }
                      </div>

                      <div class="drop-shadow-md">
                        <div class="flex items-center gap-2">
                          <strong class="text-base sm:text-lg font-bold font-amiri text-white">
                            {{ getCreatorName() }}
                          </strong>
                          <span class="px-2 py-0.5 rounded-full bg-rose-600/40 border border-rose-400/40 text-[10px] text-rose-200 font-bold">
                            {{ isTranslated() ? 'المترجم المعتمد' : 'المؤلف الأصلي' }}
                          </span>
                        </div>
                        <span class="text-[11px] text-rose-200/90 font-sans block">
                          {{ isTranslated() ? 'ناشر ومترجم رسمي على منصة مقاتل الروايات' : 'صاحب النص الأدبي والحقوق الفكرية المسجلة' }}
                        </span>
                      </div>
                    </div>
                  </div>

                  <!-- Creator Body & Bio Details -->
                  <div class="p-4 sm:p-5 pt-3 space-y-3 bg-stone-950/80">
                    <p class="text-xs sm:text-sm text-stone-300 leading-relaxed font-sans">
                      {{ getCreatorBio() }}
                    </p>

                    <!-- Rights & Copyright Strip -->
                    <div class="pt-2 border-t border-white/10 flex flex-wrap items-center justify-between gap-3 text-xs">
                      <div class="flex items-center gap-2 text-stone-400 text-[11px]">
                        <mat-icon class="text-sm text-rose-400">shield</mat-icon>
                        <span>
                          {{ isTranslated()
                            ? 'جميع حقوق التعريب والصياغة الأدبية محفوظة للمترجم — منصة مقاتل الروايات © 2026'
                            : 'جميع حقوق الملكية الفكرية والنشر محفوظة للكاتب — منصة مقاتل الروايات © 2026' }}
                        </span>
                      </div>

                      @if (isTranslated() && novel.author) {
                        <div class="text-[11px] text-stone-400 font-sans">
                          <span>المؤلف الأصلي: </span>
                          <strong class="text-stone-200 font-amiri">{{ novel.author }}</strong>
                        </div>
                      }
                    </div>
                  </div>

                </div>

                <!-- Call-to-Action Action Buttons -->
                <div class="flex flex-wrap items-center gap-4 pt-2">
                  <button
                    type="button"
                    (click)="startReadingFirstChapter()"
                    class="flex-1 sm:flex-none flex items-center justify-center gap-2.5 px-8 py-3.5 rounded-2xl bg-gradient-to-l from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 text-white font-bold text-sm sm:text-base shadow-xl transition-all cursor-pointer hover:scale-102"
                  >
                    <mat-icon class="text-xl">play_arrow</mat-icon>
                    <span>ابدأ القراءة من الفصل الأول</span>
                  </button>

                  @if (novel.chapters.length > 1) {
                    <button
                      type="button"
                      (click)="readLatestChapter()"
                      class="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl liquid-glass hover:bg-stone-800/80 text-stone-200 hover:text-white border border-white/10 text-sm font-semibold transition-all cursor-pointer"
                    >
                      <mat-icon class="text-lg text-rose-400">fast_forward</mat-icon>
                      <span>الانتقال لأحدث فصل (فصل {{ novel.chapters.length }})</span>
                    </button>
                  }
                </div>

              </div>

            </div>
          </div>
        </header>

        <!-- ========================================================================= -->
        <!-- 2. STORY SYNOPSIS & LORE (نبذة الرواية وعالم القصة) -->
        <!-- ========================================================================= -->
        <section class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 border-b border-stone-800/80 space-y-6">
          <div class="flex items-center gap-3">
            <div class="w-2.5 h-8 rounded-full bg-gradient-to-b from-rose-500 to-red-700"></div>
            <h2 class="text-2xl sm:text-3xl font-bold font-amiri text-white">
              عن الرواية وملخص القصة
            </h2>
          </div>

          <!-- Extended Story Card -->
          <div class="p-6 sm:p-8 rounded-3xl liquid-glass border border-white/10 space-y-5">
            <p class="text-sm sm:text-base text-stone-300 leading-relaxed font-sans whitespace-pre-line">
              {{ novel.description }}
            </p>

            <blockquote class="p-4 rounded-2xl bg-stone-900/70 border-r-4 border-rose-500 text-xs sm:text-sm text-stone-300 italic font-amiri leading-loose">
              «في هذا العالم، لا حدود لما يمكن أن تبلغه الإرادة؛ حين تتصادم السيوف وتتلاقى الأقدار، تبقى الحكاية هي الشاهد الخالد على صمود المقاتلين.»
            </blockquote>

            <!-- Novel Tags Pills -->
            <div class="pt-2 flex flex-wrap items-center gap-2">
              <span class="text-xs text-stone-400 font-semibold ml-2">الوسوم والنوع:</span>
              @for (tag of getTagsForNovel(novel); track tag) {
                <span class="px-3 py-1 rounded-xl bg-stone-900 border border-white/5 text-xs text-stone-300 hover:text-rose-300 transition-colors">
                  #{{ tag }}
                </span>
              }
            </div>
          </div>
        </section>

        <!-- ========================================================================= -->
        <!-- 3. COMPREHENSIVE CHAPTERS DIRECTORY (فهرس الفصول الشامل مع البحث والفرز) -->
        <!-- ========================================================================= -->
        <section class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
          
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-800/80 pb-6">
            <div class="flex items-center gap-3">
              <div class="w-2.5 h-8 rounded-full bg-gradient-to-b from-amber-500 to-rose-600"></div>
              <div>
                <h2 class="text-2xl sm:text-3xl font-bold font-amiri text-white">
                  فهرس الفصول ({{ novel.chapters.length }})
                </h2>
                <p class="text-xs text-stone-400 mt-1 font-sans">
                  جميع الفصول متاحة ومجهزة للقراءة الفورية
                </p>
              </div>
            </div>

            <!-- Search & Sort Controls -->
            <div class="flex flex-wrap items-center gap-3">
              <!-- Search in chapters -->
              <div class="relative">
                <mat-icon class="absolute right-3 top-2.5 text-stone-500 text-sm">search</mat-icon>
                <input
                  type="text"
                  placeholder="ابحث برقم الفصل أو العنوان..."
                  [value]="chapterSearchQuery()"
                  (input)="onSearchInput($event)"
                  class="bg-stone-900 border border-white/10 rounded-xl pr-9 pl-4 py-2 text-xs text-stone-200 placeholder-stone-500 focus:outline-none focus:border-rose-500/50 w-52 sm:w-64"
                />
              </div>

              <!-- Sort Order Toggle -->
              <button
                type="button"
                (click)="toggleSortOrder()"
                class="flex items-center gap-1.5 px-3.5 py-2 rounded-xl liquid-glass text-stone-300 hover:text-white border border-white/10 text-xs transition-colors cursor-pointer"
              >
                <mat-icon class="text-sm text-rose-400">
                  {{ isSortAscending() ? 'arrow_upward' : 'arrow_downward' }}
                </mat-icon>
                <span>{{ isSortAscending() ? 'من البداية للنهاية' : 'من الأحدث للأول' }}</span>
              </button>
            </div>
          </div>

          <!-- Chapters Interactive List -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            @for (ch of filteredChapters(); track ch.id) {
              <div
                (click)="readChapter(ch.id)"
                (keydown.enter)="readChapter(ch.id)"
                tabindex="0"
                role="button"
                [attr.aria-label]="'قراءة ' + ch.title"
                class="p-4 sm:p-5 rounded-2xl liquid-glass border border-white/10 hover:border-rose-500/40 flex items-center justify-between gap-4 cursor-pointer group transition-all duration-200"
              >
                <div class="flex items-center gap-3.5 min-w-0">
                  <!-- Chapter Index Number -->
                  <div class="w-10 h-10 rounded-xl bg-stone-900 group-hover:bg-rose-950/60 border border-white/10 group-hover:border-rose-500/30 flex items-center justify-center font-mono-code font-bold text-xs text-rose-300 shrink-0 transition-colors">
                    #{{ ch.chapterIndex }}
                  </div>

                  <div class="min-w-0 space-y-0.5">
                    <h3 class="text-sm sm:text-base font-bold font-amiri text-white group-hover:text-rose-300 transition-colors truncate">
                      {{ ch.title }}
                    </h3>
                    <div class="text-[11px] text-stone-400 font-sans flex items-center gap-2">
                      <span>{{ ch.wordCount }} كلمة</span>
                      <span>·</span>
                      <span>~{{ estimateMinutes(ch.wordCount) }} دقائق قراءة</span>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  class="px-3.5 py-1.5 rounded-xl bg-rose-600/20 group-hover:bg-rose-600 text-rose-300 group-hover:text-white border border-rose-500/30 text-xs font-bold transition-all shrink-0"
                >
                  اقرأ الآن
                </button>
              </div>
            } @empty {
              <div class="col-span-full p-8 text-center text-stone-500 text-sm">
                لا توجد فصول تطابق كلمة البحث "{{ chapterSearchQuery() }}"
              </div>
            }
          </div>

        </section>

        <!-- ========================================================================= -->
        <!-- 4. RECOMMENDED / SIMILAR NOVELS (روايات مقترحة ذات صلة) -->
        <!-- ========================================================================= -->
        @if (similarNovels().length > 0) {
          <section class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 border-t border-stone-800/80 space-y-8">
            <div class="flex items-center gap-3">
              <div class="w-2.5 h-8 rounded-full bg-gradient-to-b from-rose-500 to-red-700"></div>
              <div>
                <h2 class="text-2xl sm:text-3xl font-bold font-amiri text-white">
                  روايات أخرى قد تعجبك
                </h2>
                <p class="text-xs text-stone-400 mt-1 font-sans">
                  أعمال أدبية مختارة بعناية من نفس النوع
                </p>
              </div>
            </div>

            <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
              @for (sim of similarNovels(); track sim.id) {
                <div
                  (click)="viewNovel(sim.id)"
                  (keydown.enter)="viewNovel(sim.id)"
                  tabindex="0"
                  role="button"
                  [attr.aria-label]="'عرض تفاصيل ' + sim.title"
                  class="group relative h-80 sm:h-96 rounded-3xl overflow-hidden cursor-pointer liquid-glass-card shadow-md transition-all duration-300 hover:-translate-y-1"
                >
                  <!-- Gradient Cover -->
                  <div [class]="'absolute inset-0 bg-gradient-to-br ' + sim.coverGradient + ' group-hover:scale-105 transition-transform duration-500'"></div>
                  <div class="absolute inset-0 cover-inner-shadow pointer-events-none"></div>

                  <div class="absolute top-3.5 right-3.5 left-3.5 flex items-center justify-between z-10">
                    <span class="px-2.5 py-0.5 rounded-lg liquid-glass text-rose-300 border border-white/10 text-[10px] font-bold">
                      {{ sim.badge || sim.category }}
                    </span>
                    <span class="text-amber-400 text-xs font-bold font-mono-code flex items-center gap-0.5">
                      ★ {{ sim.rating || 4.9 }}
                    </span>
                  </div>

                  <div class="absolute bottom-0 inset-x-0 p-5 z-10 space-y-1">
                    <span class="text-[11px] text-rose-300 font-sans block truncate">
                      {{ sim.author }} · {{ sim.translator || 'الأصل العربي' }}
                    </span>
                    <h3 class="text-base sm:text-lg font-bold font-amiri text-white leading-snug group-hover:text-rose-300 transition-colors line-clamp-2">
                      {{ sim.title }}
                    </h3>
                    <div class="pt-1 text-[11px] text-stone-400 font-sans flex items-center justify-between">
                      <span>{{ sim.chapters.length }} فصول</span>
                      <span>{{ sim.views }} قراءة</span>
                    </div>
                  </div>
                </div>
              }
            </div>
          </section>
        }

      } @else {
        <!-- Fallback if novel not found -->
        <div class="max-w-2xl mx-auto px-4 py-32 text-center space-y-6">
          <mat-icon class="text-6xl text-rose-500">search_off</mat-icon>
          <h2 class="text-2xl font-bold font-amiri text-white">لم يتم العثور على الرواية المطلوبة</h2>
          <p class="text-sm text-stone-400">
            قد يكون تم نقل الرواية أو أن الرابط غير صحيح. يمكنك العودة إلى الصفحة الرئيسية لتصفح كافة الأعمال.
          </p>
          <a
            routerLink="/"
            class="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-sm shadow-md transition-all"
          >
            <mat-icon>auto_stories</mat-icon>
            <span>العودة إلى مكتبة الروايات</span>
          </a>
        </div>
      }

    </div>
  `,
})
export class NovelDetails {
  readonly store = inject(NovelStore);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  readonly novelId = signal<string>('');
  readonly chapterSearchQuery = signal<string>('');
  readonly isSortAscending = signal<boolean>(true);
  readonly copyNotice = signal<string>('');
  readonly hoveredStars = signal<number>(0);

  constructor() {
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id) {
        this.novelId.set(id);
        this.store.selectNovel(id);
      } else {
        const selected = this.store.selectedNovel();
        if (selected) {
          this.novelId.set(selected.id);
        } else if (this.store.novels().length > 0) {
          this.novelId.set(this.store.novels()[0].id);
        }
      }
    });
  }

  readonly currentNovel = computed<Novel | null>(() => {
    const id = this.novelId();
    const list = this.store.novels();
    if (!id && list.length > 0) return list[0];
    return list.find(n => n.id === id) || this.store.selectedNovel() || (list.length > 0 ? list[0] : null);
  });

  readonly isBookmarked = computed(() => {
    const novel = this.currentNovel();
    if (!novel) return false;
    return this.store.isBookmarked(novel.id);
  });

  readonly myRating = computed(() => {
    const novel = this.currentNovel();
    if (!novel) return null;
    return this.store.userRatings()[novel.id] || null;
  });

  readonly isTranslated = computed<boolean>(() => {
    const novel = this.currentNovel();
    if (!novel) return false;
    return Boolean(novel.translator && novel.translator !== 'الأصل العربي');
  });

  readonly userRatingCount = computed(() => {
    const novel = this.currentNovel();
    if (!novel) return '1,420';
    const base = novel.ratingCount || (novel.chapters.length * 350 + 420);
    return base.toLocaleString('ar-EG');
  });

  readonly totalWordCount = computed(() => {
    const novel = this.currentNovel();
    if (!novel) return '0';
    let total = 0;
    for (const ch of novel.chapters) {
      total += ch.wordCount;
    }
    return total.toLocaleString('ar-EG');
  });

  readonly estimatedReadingTime = computed(() => {
    const novel = this.currentNovel();
    if (!novel) return 0;
    let total = 0;
    for (const ch of novel.chapters) {
      total += ch.wordCount;
    }
    return Math.max(1, Math.round(total / 180));
  });

  readonly filteredChapters = computed<ChapterSummary[]>(() => {
    const novel = this.currentNovel();
    if (!novel) return [];
    let list = [...novel.chapters];
    const q = this.chapterSearchQuery().trim().toLowerCase();

    if (q) {
      list = list.filter(ch =>
        ch.title.toLowerCase().includes(q) ||
        ch.chapterIndex.toString().includes(q)
      );
    }

    if (!this.isSortAscending()) {
      list.reverse();
    }
    return list;
  });

  readonly similarNovels = computed<Novel[]>(() => {
    const cur = this.currentNovel();
    if (!cur) return [];
    return this.store.novels().filter(n => n.id !== cur.id).slice(0, 4);
  });

  // Creator profile helpers (Author or Translator)
  getCreatorName(): string {
    const novel = this.currentNovel();
    if (!novel) return 'المؤلف';
    return this.isTranslated() ? (novel.translator || 'فريق مقاتل الروايات') : novel.author;
  }

  getCreatorAvatar(): string {
    const novel = this.currentNovel();
    if (!novel) return '';
    if (this.isTranslated()) {
      return novel.translatorAvatar || 'assist/img/logo.png';
    }
    return novel.authorAvatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=300&auto=format&fit=crop';
  }

  getCreatorCover(): string {
    const novel = this.currentNovel();
    if (!novel) return 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?q=80&w=1500&auto=format&fit=crop';
    if (this.isTranslated()) {
      return novel.translatorCover || 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?q=80&w=1500&auto=format&fit=crop';
    }
    return novel.authorCover || 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=1500&auto=format&fit=crop';
  }

  getCreatorBio(): string {
    const novel = this.currentNovel();
    if (!novel) return '';
    if (this.isTranslated()) {
      return novel.translatorBio || 'فريق الترجمة والتعريب الرسمي لمنصة مقاتل الروايات؛ تعريب حصري متقن يحافظ على روح وفصاحة الضاد.';
    }
    return novel.authorBio || 'صاحب النص الأدبي والحقوق الفكرية المسجلة حصرياً على منصة مقاتل الروايات.';
  }

  // Interactive Star Rating Logic
  onStarMouseEnter(star: number): void {
    this.hoveredStars.set(star);
  }

  onStarsMouseLeave(): void {
    this.hoveredStars.set(0);
  }

  getStarClass(star: number): string {
    const hovered = this.hoveredStars();
    const active = this.myRating() || 0;

    if (hovered > 0) {
      return star <= hovered ? 'text-amber-400 drop-shadow' : 'text-stone-700';
    }
    return star <= active ? 'text-amber-400 drop-shadow' : 'text-stone-700 hover:text-amber-300';
  }

  rateNovel(stars: number): void {
    const novel = this.currentNovel();
    if (!novel) return;
    this.store.rateNovel(novel.id, stars);
    this.copyNotice.set(`شكراً لك! تم تسجيل تقييمك (${stars} نجوم من 5) بنجاح.`);
    setTimeout(() => this.copyNotice.set(''), 3500);
  }

  toggleBookmark(): void {
    const novel = this.currentNovel();
    if (!novel) return;
    this.store.toggleBookmark(novel.id);
  }

  shareNovel(): void {
    if (typeof window !== 'undefined') {
      const url = window.location.href;
      if (navigator.clipboard) {
        navigator.clipboard.writeText(url).then(() => {
          this.copyNotice.set('تم نسخ رابط الرواية إلى الحافظة بنجاح!');
          setTimeout(() => this.copyNotice.set(''), 3000);
        });
      }
    }
  }

  onSearchInput(event: Event): void {
    const val = (event.target as HTMLInputElement).value;
    this.chapterSearchQuery.set(val);
  }

  toggleSortOrder(): void {
    this.isSortAscending.update(v => !v);
  }

  startReadingFirstChapter(): void {
    const novel = this.currentNovel();
    if (!novel || novel.chapters.length === 0) return;
    this.store.selectNovel(novel.id);
    this.store.selectChapter(novel.id, novel.chapters[0].id);
    this.router.navigate(['/reader', novel.id, novel.chapters[0].id]);
  }

  readLatestChapter(): void {
    const novel = this.currentNovel();
    if (!novel || novel.chapters.length === 0) return;
    const latest = novel.chapters[novel.chapters.length - 1];
    this.store.selectNovel(novel.id);
    this.store.selectChapter(novel.id, latest.id);
    this.router.navigate(['/reader', novel.id, latest.id]);
  }

  readChapter(chapterId: string): void {
    const novel = this.currentNovel();
    if (!novel) return;
    this.store.selectNovel(novel.id);
    this.store.selectChapter(novel.id, chapterId);
    this.router.navigate(['/reader', novel.id, chapterId]);
  }

  viewNovel(novelId: string): void {
    this.novelId.set(novelId);
    this.store.selectNovel(novelId);
    this.router.navigate(['/novel', novelId]);
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  goBack(): void {
    this.router.navigate(['/']);
  }

  estimateMinutes(words: number): number {
    return Math.max(1, Math.round(words / 180));
  }

  getTagsForNovel(novel: Novel): string[] {
    const tags = ['أدب_عربي', 'روايات_حصرية', 'فصول_كاملة'];
    if (novel.category.includes('فانتازيا') || novel.category.includes('خيال')) tags.push('فانتازيا', 'سحر_وأساطير');
    if (novel.category.includes('شوان') || novel.category.includes('مترجم')) tags.push('فنون_قتالية', 'عوالم_موازية');
    if (novel.category.includes('غموض')) tags.push('تشويق_وإثارة', 'أسرار');
    if (novel.category.includes('تاريخ')) tags.push('تاريخ_وملاحم', 'فروسية');
    if (novel.category.includes('سايبر')) tags.push('خيال_علمي', 'سايبربانك');
    return tags;
  }
}
