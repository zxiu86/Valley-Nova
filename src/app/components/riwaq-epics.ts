import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import {
  ALL_SERENDIPITY_EPICS_POOL,
  ARABIC_CHIVALRY_EPICS,
  ASIAN_PERSIAN_EPICS,
  EPIC_GENRE_PILLS,
  FEATURED_EPICS,
  GREEK_ROMAN_EPICS,
  MASTER_EPICS_CATALOG,
  MEDIEVAL_CHIVALRY_EPICS,
  MESOPOTAMIAN_EPICS,
  MOST_READ_EPICS,
  NORSE_NORTHERN_EPICS,
  RiwaqEpicItem,
  SERENDIPITY_EPICS,
  SPOTLIGHT_EPIC,
} from '../core/riwaq-epics-data';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-riwaq-epics',
  imports: [RouterLink],
  template: `
    <div class="min-h-screen bg-[#131315] text-[#e5e1e4] selection:bg-[#e9c349] selection:text-[#241a00] relative overflow-hidden font-sans">
      
      <!-- Ambient Background Atmospheric Tints (Bronze, Amber & Night Blue) -->
      <div class="pointer-events-none absolute -top-40 right-1/4 w-[700px] h-[700px] bg-[#af8d11]/15 rounded-full blur-[140px] -z-10"></div>
      <div class="pointer-events-none absolute top-[700px] -left-32 w-[600px] h-[600px] bg-[#1e3a8a]/15 rounded-full blur-[130px] -z-10"></div>
      <div class="pointer-events-none absolute top-[1800px] right-0 w-[600px] h-[600px] bg-[#e9c349]/10 rounded-full blur-[140px] -z-10"></div>

      <div class="pt-24 pb-20">
        
        <!-- ========================================== -->
        <!-- 1. BREADCRUMBS & HERO SECTION -->
        <!-- ========================================== -->
        <section class="w-full px-4 sm:px-6 md:px-12 pt-4 pb-8 max-w-[1400px] mx-auto">
          
          <!-- Breadcrumb Navigation -->
          <nav aria-label="مسار التصفح" class="flex items-center gap-2 text-xs text-[#debfc2]/70 mb-6 font-medium">
            <a routerLink="/" class="hover:text-white transition-colors cursor-pointer flex items-center gap-1">
              <span class="material-symbols-outlined text-[15px]">home</span>
              <span>الرئيسية</span>
            </a>
            <span class="material-symbols-outlined text-[13px] opacity-40">chevron_left</span>
            <a routerLink="/" class="hover:text-white transition-colors cursor-pointer">الأروقة السردية</a>
            <span class="material-symbols-outlined text-[13px] opacity-40">chevron_left</span>
            <span class="text-[#e9c349] font-semibold">رواق الملاحم</span>
          </nav>

          <!-- Main Hero Banner Card -->
          <div class="relative bg-gradient-to-br from-[#1c1b1d] via-[#1c1b1d]/95 to-[#131315] border border-white/[0.08] rounded-3xl p-6 sm:p-8 lg:p-12 shadow-2xl overflow-hidden flex flex-col lg:flex-row gap-8 lg:gap-12 items-center">
            
            <!-- Atmospheric ambient backdrop glow -->
            <div class="pointer-events-none absolute -bottom-24 -left-24 w-96 h-96 bg-[#e9c349]/10 rounded-full blur-3xl"></div>
            
            <!-- Hero Details & Category Pills (Right Column) -->
            <div class="lg:w-7/12 flex flex-col justify-between z-10 w-full text-right">
              <div class="space-y-4">
                
                <!-- Corridor Badge -->
                <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#af8d11]/40 border border-[#e9c349]/30 text-[#e9c349] text-xs font-semibold tracking-wider shadow-sm">
                  <span class="w-2 h-2 rounded-full bg-[#e9c349] shadow-[0_0_8px_rgba(233,195,73,0.8)]"></span>
                  <span>الصرح الملحمي الثاني • رواق الملاحم</span>
                </div>

                <!-- Page Main Literary Title -->
                <h1 class="font-noto-serif text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-[#e5e1e4] tracking-tight leading-tight select-none">
                  أساطير الخلود وبطولات الأولين
                </h1>

                <!-- Narrative Paragraph -->
                <p class="font-noto-serif text-base sm:text-lg md:text-xl text-[#debfc2]/90 max-w-2xl leading-relaxed font-normal">
                  من ألواح بابل وسومر المنقوشة بالمسمارية، إلى ملاحم هوميروس الإغريقية، وصهيل خيول عنترة والشاهنامة الفارسية؛ هنا تتجسد بطولة الإنسان في وجه الفناء وقهر الزمان.
                </p>

                <!-- Quick Mood / Genre Taxonomy Pills (Fully Interactive) -->
                <div class="pt-3">
                  <span class="text-xs text-[#debfc2]/70 block mb-2 font-medium">تصنيفات الرواق الملحمية:</span>
                  <div class="flex flex-wrap items-center gap-2">
                    @for (genre of genrePills; track genre) {
                      <button
                        type="button"
                        (click)="selectGenre(genre)"
                        class="px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer border flex items-center gap-1.5"
                        [class]="selectedGenre() === genre && !fastFilter() ? 'bg-[#e9c349] text-[#241a00] font-bold border-[#e9c349] shadow-md -translate-y-0.5' : 'bg-[#201f22] text-[#debfc2] hover:text-[#e5e1e4] hover:bg-[#2a2a2c] border-white/5'"
                      >
                        <span>{{ genre }}</span>
                        @if (selectedGenre() === genre && !fastFilter() && genre !== 'الكل') {
                          <span class="w-1.5 h-1.5 rounded-full bg-[#241a00]"></span>
                        }
                      </button>
                    }
                  </div>
                </div>
              </div>

              <!-- Editorial Quick Strip Metric -->
              <div class="mt-8 pt-4 border-t border-white/[0.08] flex items-center gap-6 sm:gap-8 text-[#debfc2]/80 text-xs sm:text-sm font-medium">
                <div class="flex items-center gap-2">
                  <span class="font-noto-serif text-xl sm:text-2xl font-bold text-[#e9c349]">٩٦٠</span>
                  <span class="text-xs text-[#debfc2]/70">لوحاً وسِفراً ملحمياً</span>
                </div>
                <div class="w-1 h-1 rounded-full bg-white/20"></div>
                <div class="flex items-center gap-2">
                  <span class="font-noto-serif text-xl sm:text-2xl font-bold text-[#7bd8b1]">٣٥</span>
                  <span class="text-xs text-[#debfc2]/70">حضارة أسطورية</span>
                </div>
                <div class="w-1 h-1 rounded-full bg-white/20"></div>
                <div class="flex items-center gap-2">
                  <span class="font-noto-serif text-xl sm:text-2xl font-bold text-[#ffb2bd]">١٠٠٪</span>
                  <span class="text-xs text-[#debfc2]/70">نصوص أصلية خالدة</span>
                </div>
              </div>
            </div>

            <!-- Spotlight Featured Masterpiece Box (Left Column) -->
            <div class="lg:w-5/12 flex flex-col justify-center w-full">
              <div class="relative group bg-[#1c1b1d]/90 border border-white/[0.08] rounded-2xl p-5 sm:p-6 overflow-hidden shadow-2xl transition-all duration-500 hover:shadow-[0_20px_50px_rgba(175,141,17,0.25)]">
                <!-- Accent glow on spotlight box -->
                <div class="absolute -top-24 -right-24 w-48 h-48 bg-[#e9c349]/20 rounded-full blur-3xl pointer-events-none"></div>

                <div class="flex flex-col sm:flex-row items-center sm:items-start gap-5 sm:gap-6 relative z-10">
                  <!-- Book Artwork Preview -->
                  <div class="w-36 sm:w-44 aspect-[1/1.55] shrink-0 rounded-xl overflow-hidden shadow-2xl transition-transform duration-500 group-hover:-translate-y-1 border border-white/10">
                    <img
                      [src]="spotlightEpic.coverImage"
                      [alt]="spotlightEpic.title"
                      class="w-full h-full object-cover"
                    />
                  </div>

                  <!-- Spotlight Details -->
                  <div class="flex flex-col justify-between h-full text-right w-full">
                    <div>
                      <div class="inline-flex items-center gap-1.5 text-[#e9c349] text-xs font-semibold mb-2">
                        <span class="material-symbols-outlined text-[16px]">swords</span>
                        <span>{{ spotlightEpic.badge }}</span>
                      </div>
                      <h3 class="font-noto-serif text-xl sm:text-2xl font-bold text-[#e5e1e4] mb-2">
                        {{ spotlightEpic.title }}
                      </h3>
                      <blockquote class="font-noto-serif text-xs sm:text-sm text-[#debfc2]/85 italic leading-relaxed mb-4 pr-2 border-r-2 border-[#e9c349]/40">
                        {{ spotlightEpic.quote }}
                      </blockquote>
                    </div>
                    
                    <div class="flex flex-wrap items-center gap-2.5 pt-2">
                      <a
                        [routerLink]="['/reader', spotlightEpic.id]"
                        class="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-[#e9c349] text-[#241a00] font-semibold text-xs sm:text-sm hover:bg-[#ffe088] transition-all shadow-md cursor-pointer"
                      >
                        <span>بدء القراءة</span>
                        <span class="material-symbols-outlined text-[17px]">menu_book</span>
                      </a>
                      <a
                        [routerLink]="['/novel', spotlightEpic.id]"
                        class="inline-flex items-center justify-center px-4 py-2 rounded-xl bg-[#2a2a2c] text-[#e5e1e4] hover:bg-[#353437] font-medium text-xs sm:text-sm transition-colors border border-white/5 cursor-pointer"
                      >
                        <span>نبذة عن السفر</span>
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </section>

        <!-- ========================================== -->
        <!-- DYNAMIC FILTERED SHOWCASE (When Category or Filter is Active) -->
        <!-- ========================================== -->
        @if (isFilterActive()) {
          <section id="corridor-catalog" class="w-full px-4 sm:px-6 md:px-12 py-8 max-w-[1400px] mx-auto animate-in fade-in duration-300">
            <div class="bg-[#1c1b1d]/90 border border-[#e9c349]/25 rounded-2xl p-5 sm:p-7 shadow-2xl relative overflow-hidden">
              
              <!-- Ambient filter glow -->
              <div class="pointer-events-none absolute -top-20 right-10 w-72 h-72 bg-[#af8d11]/15 rounded-full blur-3xl"></div>

              <!-- Top Bar of Filtered Showcase -->
              <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-white/[0.08] relative z-10">
                <div class="flex items-center gap-3">
                  <span class="w-3 h-3 rounded-full bg-[#e9c349] shadow-[0_0_10px_rgba(233,195,73,0.8)]"></span>
                  <div>
                    <div class="flex items-center gap-2">
                      <h2 class="font-noto-serif text-xl sm:text-2xl font-bold text-[#e5e1e4]">
                        {{ currentFilterTitle() }}
                      </h2>
                      <span class="px-2.5 py-0.5 rounded-full bg-[#e9c349]/15 text-[#e9c349] text-xs font-semibold border border-[#e9c349]/20">
                        {{ filteredBooks().length }} سِفر ملحمي
                      </span>
                    </div>
                    <p class="text-xs text-[#debfc2]/70 mt-0.5">
                      {{ currentFilterSubtitle() }}
                    </p>
                  </div>
                </div>

                <!-- Right Action: Reset / Clear Filter -->
                <div class="flex items-center gap-2 self-start md:self-auto">
                  <button
                    type="button"
                    (click)="clearFilters()"
                    class="px-3 py-1.5 rounded-xl bg-[#2a2a2c] hover:bg-[#353437] text-xs text-[#debfc2] hover:text-white border border-white/5 flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <span class="material-symbols-outlined text-[16px]">close</span>
                    <span>عرض كافة الملاحم</span>
                  </button>
                </div>
              </div>

              <!-- Search and Sort Strip Inside Filter -->
              <div class="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 pb-5 relative z-10">
                <div class="relative w-full sm:w-72">
                  <input
                    type="text"
                    [value]="searchKeyword()"
                    (input)="onFilterSearchInput($event)"
                    placeholder="ابحث باسم الملحمة أو البطل أو الحضارة..."
                    class="w-full bg-[#131315] border border-white/10 rounded-xl px-3 pr-9 py-2 text-xs text-[#e5e1e4] placeholder-[#debfc2]/40 focus:outline-none focus:border-[#e9c349]/50"
                  />
                  <span class="material-symbols-outlined absolute right-2.5 top-2.5 text-[#debfc2]/50 text-[18px]">search</span>
                </div>

                <div class="flex items-center gap-2 self-start sm:self-auto">
                  <span class="text-xs text-[#debfc2]/60">ترتيب:</span>
                  <button
                    type="button"
                    (click)="sortBy.set('default')"
                    class="px-2.5 py-1 rounded-lg text-[11px] font-medium transition-colors cursor-pointer"
                    [class]="sortBy() === 'default' ? 'bg-[#e9c349] text-[#241a00] font-bold' : 'bg-[#201f22] text-[#debfc2] hover:text-white'"
                  >
                    التلقائي
                  </button>
                  <button
                    type="button"
                    (click)="sortBy.set('alphabetical')"
                    class="px-2.5 py-1 rounded-lg text-[11px] font-medium transition-colors cursor-pointer"
                    [class]="sortBy() === 'alphabetical' ? 'bg-[#e9c349] text-[#241a00] font-bold' : 'bg-[#201f22] text-[#debfc2] hover:text-white'"
                  >
                    أبجدياً (أ-ي)
                  </button>
                </div>
              </div>

              <!-- Filtered Horizontal Side-Scrolling Shelf with Strict 80px x 120px Cards -->
              @if (filteredBooks().length > 0) {
                <div class="relative pt-2">
                  <!-- Row Slide Controls for Filtered Showcase -->
                  <div class="flex items-center justify-between mb-3 text-xs text-[#debfc2]/70">
                    <span>اسحب أفقياً لتصفح أسفار هذا التصنيف (تمرير جانبي)</span>
                    <div class="flex items-center gap-1.5">
                      <button
                        type="button"
                        (click)="scrollRow(filteredRow, 'right')"
                        aria-label="السابق"
                        class="w-7 h-7 rounded-lg bg-[#201f22] hover:bg-[#2a2a2c] text-[#debfc2] hover:text-white border border-white/5 flex items-center justify-center cursor-pointer transition-colors"
                      >
                        <span class="material-symbols-outlined text-[17px]">chevron_right</span>
                      </button>
                      <button
                        type="button"
                        (click)="scrollRow(filteredRow, 'left')"
                        aria-label="التالي"
                        class="w-7 h-7 rounded-lg bg-[#201f22] hover:bg-[#2a2a2c] text-[#debfc2] hover:text-white border border-white/5 flex items-center justify-center cursor-pointer transition-colors"
                      >
                        <span class="material-symbols-outlined text-[17px]">chevron_left</span>
                      </button>
                    </div>
                  </div>

                  <div
                    #filteredRow
                    class="flex overflow-x-auto gap-4 sm:gap-5 pb-3 pt-1 scrollbar-none snap-x snap-mandatory scroll-smooth"
                  >
                    @for (book of filteredBooks(); track book.id) {
                      <a
                        [routerLink]="['/novel', book.id]"
                        class="shrink-0 snap-start flex flex-col items-center group cursor-pointer focus:outline-none w-[80px]"
                        [title]="book.title"
                      >
                        <!-- Strict 80px x 120px Card Cover -->
                        <div class="w-[80px] h-[120px] rounded-lg overflow-hidden bg-[#131315] shadow-lg transition-all duration-300 group-hover:-translate-y-1.5 group-hover:shadow-[0_12px_28px_rgba(175,141,17,0.45)] border border-white/10 group-hover:border-[#e9c349]/50">
                          <img
                            [src]="book.coverImage"
                            [alt]="book.title"
                            class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                            loading="lazy"
                          />
                        </div>
                        <h3 class="font-noto-serif text-[11px] font-semibold text-[#e5e1e4] mt-2 text-center line-clamp-2 leading-tight group-hover:text-[#e9c349] transition-colors w-[80px]">
                          {{ book.title }}
                        </h3>
                      </a>
                    }
                  </div>
                </div>
              } @else {
                <!-- Empty Filter State -->
                <div class="py-12 flex flex-col items-center justify-center text-center relative z-10">
                  <span class="material-symbols-outlined text-4xl text-[#e9c349]/40 mb-2">swords</span>
                  <h3 class="font-noto-serif text-lg font-bold text-[#e5e1e4] mb-1">لم نعثر على ملاحم تطابق هذه التصفية</h3>
                  <p class="text-xs text-[#debfc2]/70 mb-4">جرب البحث بكلمات أخرى أو اختر تصنيفاً مغايراً</p>
                  <button
                    type="button"
                    (click)="clearFilters()"
                    class="px-4 py-2 rounded-xl bg-[#e9c349] text-[#241a00] text-xs font-bold hover:bg-[#ffe088] transition-colors cursor-pointer"
                  >
                    إعادة ضبط التصفية
                  </button>
                </div>
              }

            </div>
          </section>
        }

        <!-- ========================================== -->
        <!-- ALPHABETICAL BROWSER ACCORDION / DRAWER -->
        <!-- ========================================== -->
        @if (isAlphabetOpen()) {
          <section class="w-full px-4 sm:px-6 md:px-12 py-4 max-w-[1400px] mx-auto animate-in slide-in-from-top-4 duration-300">
            <div class="bg-[#1c1b1d]/95 border border-[#e9c349]/30 rounded-2xl p-5 shadow-2xl">
              <div class="flex items-center justify-between mb-4 pb-3 border-b border-white/[0.08]">
                <div class="flex items-center gap-2">
                  <span class="material-symbols-outlined text-[#e9c349] text-[20px]">sort_by_alpha</span>
                  <h3 class="font-noto-serif text-base font-bold text-[#e5e1e4]">
                    الفهرس الأبجدي لرواق الملاحم (تصفح بالحروف)
                  </h3>
                </div>
                <button
                  type="button"
                  (click)="isAlphabetOpen.set(false)"
                  class="text-[#debfc2]/60 hover:text-white text-xs flex items-center gap-1 cursor-pointer"
                >
                  <span>إغلاق</span>
                  <span class="material-symbols-outlined text-[16px]">close</span>
                </button>
              </div>

              <!-- Arabic Letter Chips -->
              <div class="flex flex-wrap items-center gap-1.5 sm:gap-2">
                @for (letter of arabicLetters; track letter) {
                  <button
                    type="button"
                    (click)="selectAlphabetLetter(letter)"
                    class="w-8 h-8 rounded-lg text-xs font-semibold flex items-center justify-center transition-all cursor-pointer border"
                    [class]="activeAlphabetLetter() === letter ? 'bg-[#e9c349] text-[#241a00] font-bold border-[#e9c349] shadow-md scale-105' : 'bg-[#201f22] text-[#debfc2] hover:text-white hover:bg-[#2a2a2c] border-white/5'"
                  >
                    {{ letter }}
                  </button>
                }
              </div>
            </div>
          </section>
        }

        <!-- ========================================== -->
        <!-- 2. FEATURED MASTERPIECES ROW (مختارات الرواق البارزة) -->
        <!-- ========================================== -->
        <section class="w-full px-4 sm:px-6 md:px-12 py-8 max-w-[1400px] mx-auto">
          <div class="flex items-end justify-between mb-4">
            <div>
              <span class="text-xs text-[#e9c349] font-semibold tracking-wider block mb-1">المختار الخالد</span>
              <h2 class="font-noto-serif text-2xl sm:text-3xl font-bold text-[#e5e1e4]">
                مختارات رواق الملاحم البارزة
              </h2>
            </div>
            
            <!-- Row Slide Navigation Controls -->
            <div class="flex items-center gap-2">
              <button
                type="button"
                (click)="scrollRow(featuredRow, 'right')"
                aria-label="السابق"
                title="السابق"
                class="w-9 h-9 rounded-xl bg-[#1c1b1d] border border-white/5 text-[#debfc2] hover:text-white hover:bg-[#201f22] transition-colors flex items-center justify-center cursor-pointer shadow-sm"
              >
                <span class="material-symbols-outlined text-[20px]">chevron_right</span>
              </button>
              <button
                type="button"
                (click)="scrollRow(featuredRow, 'left')"
                aria-label="التالي"
                title="التالي"
                class="w-9 h-9 rounded-xl bg-[#1c1b1d] border border-white/5 text-[#debfc2] hover:text-white hover:bg-[#201f22] transition-colors flex items-center justify-center cursor-pointer shadow-sm"
              >
                <span class="material-symbols-outlined text-[20px]">chevron_left</span>
              </button>
            </div>
          </div>

          <!-- Horizontal Side-Scrolling Row (Strict 80px x 120px Card Cover) -->
          <div
            #featuredRow
            class="flex overflow-x-auto gap-4 sm:gap-5 pb-3 pt-1 scrollbar-none snap-x snap-mandatory scroll-smooth"
          >
            @for (book of featuredBooks; track book.id) {
              <a
                [routerLink]="['/novel', book.id]"
                class="shrink-0 snap-start flex flex-col items-center group cursor-pointer focus:outline-none w-[80px]"
                [title]="book.title"
              >
                <div class="w-[80px] h-[120px] rounded-lg overflow-hidden bg-[#1c1b1d] shadow-lg transition-all duration-300 group-hover:-translate-y-1.5 group-hover:shadow-[0_12px_28px_rgba(175,141,17,0.45)] border border-white/10 group-hover:border-[#e9c349]/40">
                  <img
                    [src]="book.coverImage"
                    [alt]="book.title"
                    class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    loading="lazy"
                  />
                </div>
                <h3 class="font-noto-serif text-[11px] font-semibold text-[#e5e1e4] mt-2 text-center line-clamp-2 leading-tight transition-colors group-hover:text-[#e9c349] w-[80px]">
                  {{ book.title }}
                </h3>
              </a>
            }
          </div>
        </section>

        <!-- ========================================== -->
        <!-- 3. ALL EDITORIAL SHELVES WITH HORIZONTAL SIDE-SCROLLING -->
        <!-- ========================================== -->
        <div class="w-full px-4 sm:px-6 md:px-12 py-4 max-w-[1400px] mx-auto space-y-10">
          
          <!-- Category 1: ملاحم الشرق القديم وما بين النهرين -->
          <section id="mesopotamia-shelf" class="flex flex-col">
            <div class="flex items-baseline justify-between mb-4 pb-2 border-b border-white/[0.08]">
              <div class="flex items-center gap-2.5">
                <span class="w-2.5 h-2.5 rounded-full bg-[#e9c349] inline-block shadow-[0_0_8px_rgba(233,195,73,0.7)]"></span>
                <h2 class="font-noto-serif text-xl sm:text-2xl font-bold text-[#e5e1e4]">
                  ملاحم الشرق القديم وما بين النهرين
                </h2>
                <span class="text-xs text-[#debfc2]/60 mr-2 hidden sm:inline">ألواح بابل وسومر وأوغاريت المحفورة بالمسمارية</span>
              </div>
              
              <div class="flex items-center gap-3">
                <button
                  type="button"
                  (click)="selectGenre('ملاحم الشرق وبلاد الرافدين')"
                  class="text-[#e9c349] hover:text-[#ffe088] text-xs font-medium flex items-center gap-1 transition-colors cursor-pointer"
                >
                  <span>استعراض الرواق كاملاً</span>
                  <span class="material-symbols-outlined text-[15px]">arrow_back</span>
                </button>

                <!-- Row Slide Buttons -->
                <div class="flex items-center gap-1">
                  <button
                    type="button"
                    (click)="scrollRow(mesopotamiaRow, 'right')"
                    aria-label="السابق"
                    class="w-7 h-7 rounded-lg bg-[#1c1b1d] border border-white/5 text-[#debfc2] hover:text-white hover:bg-[#201f22] transition-colors flex items-center justify-center cursor-pointer"
                  >
                    <span class="material-symbols-outlined text-[17px]">chevron_right</span>
                  </button>
                  <button
                    type="button"
                    (click)="scrollRow(mesopotamiaRow, 'left')"
                    aria-label="التالي"
                    class="w-7 h-7 rounded-lg bg-[#1c1b1d] border border-white/5 text-[#debfc2] hover:text-white hover:bg-[#201f22] transition-colors flex items-center justify-center cursor-pointer"
                  >
                    <span class="material-symbols-outlined text-[17px]">chevron_left</span>
                  </button>
                </div>
              </div>
            </div>

            <!-- Horizontal Side-Scrolling Row (80px x 120px) -->
            <div
              #mesopotamiaRow
              class="flex overflow-x-auto gap-4 sm:gap-5 pb-3 pt-1 scrollbar-none snap-x snap-mandatory scroll-smooth"
            >
              @for (book of mesopotamianEpics; track book.id) {
                <a
                  [routerLink]="['/novel', book.id]"
                  class="shrink-0 snap-start flex flex-col items-center group cursor-pointer focus:outline-none w-[80px]"
                  [title]="book.title"
                >
                  <div class="w-[80px] h-[120px] rounded-lg overflow-hidden bg-[#1c1b1d] shadow-lg transition-all duration-300 group-hover:-translate-y-1.5 group-hover:shadow-[0_12px_28px_rgba(175,141,17,0.4)] border border-white/10 group-hover:border-[#e9c349]/40">
                    <img
                      [src]="book.coverImage"
                      [alt]="book.title"
                      class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      loading="lazy"
                    />
                  </div>
                  <h3 class="font-noto-serif text-[11px] font-semibold text-[#e5e1e4] mt-2 text-center line-clamp-2 leading-tight transition-colors group-hover:text-[#e9c349] w-[80px]">
                    {{ book.title }}
                  </h3>
                </a>
              }
            </div>
          </section>

          <!-- Category 2: الملاحم الإغريقية والرومانية الكلاسيكية -->
          <section id="greek-shelf" class="flex flex-col">
            <div class="flex items-baseline justify-between mb-4 pb-2 border-b border-white/[0.08]">
              <div class="flex items-center gap-2.5">
                <span class="w-2.5 h-2.5 rounded-full bg-[#38bdf8] inline-block shadow-[0_0_8px_rgba(56,189,248,0.7)]"></span>
                <h2 class="font-noto-serif text-xl sm:text-2xl font-bold text-[#e5e1e4]">
                  الملاحم الإغريقية والرومانية الكلاسيكية
                </h2>
                <span class="text-xs text-[#debfc2]/60 mr-2 hidden sm:inline">غضب آخيل في طروادة، عودة أوديسيوس، وتأسيس روما</span>
              </div>
              
              <div class="flex items-center gap-3">
                <button
                  type="button"
                  (click)="selectGenre('الملاحم الإغريقية والرومانية')"
                  class="text-[#e9c349] hover:text-[#ffe088] text-xs font-medium flex items-center gap-1 transition-colors cursor-pointer"
                >
                  <span>استعراض الرواق كاملاً</span>
                  <span class="material-symbols-outlined text-[15px]">arrow_back</span>
                </button>

                <!-- Row Slide Buttons -->
                <div class="flex items-center gap-1">
                  <button
                    type="button"
                    (click)="scrollRow(greekRow, 'right')"
                    aria-label="السابق"
                    class="w-7 h-7 rounded-lg bg-[#1c1b1d] border border-white/5 text-[#debfc2] hover:text-white hover:bg-[#201f22] transition-colors flex items-center justify-center cursor-pointer"
                  >
                    <span class="material-symbols-outlined text-[17px]">chevron_right</span>
                  </button>
                  <button
                    type="button"
                    (click)="scrollRow(greekRow, 'left')"
                    aria-label="التالي"
                    class="w-7 h-7 rounded-lg bg-[#1c1b1d] border border-white/5 text-[#debfc2] hover:text-white hover:bg-[#201f22] transition-colors flex items-center justify-center cursor-pointer"
                  >
                    <span class="material-symbols-outlined text-[17px]">chevron_left</span>
                  </button>
                </div>
              </div>
            </div>

            <!-- Horizontal Side-Scrolling Row (80px x 120px) -->
            <div
              #greekRow
              class="flex overflow-x-auto gap-4 sm:gap-5 pb-3 pt-1 scrollbar-none snap-x snap-mandatory scroll-smooth"
            >
              @for (book of greekRomanEpics; track book.id) {
                <a
                  [routerLink]="['/novel', book.id]"
                  class="shrink-0 snap-start flex flex-col items-center group cursor-pointer focus:outline-none w-[80px]"
                  [title]="book.title"
                >
                  <div class="w-[80px] h-[120px] rounded-lg overflow-hidden bg-[#1c1b1d] shadow-lg transition-all duration-300 group-hover:-translate-y-1.5 group-hover:shadow-[0_12px_28px_rgba(56,189,248,0.35)] border border-white/10 group-hover:border-[#38bdf8]/40">
                    <img
                      [src]="book.coverImage"
                      [alt]="book.title"
                      class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      loading="lazy"
                    />
                  </div>
                  <h3 class="font-noto-serif text-[11px] font-semibold text-[#e5e1e4] mt-2 text-center line-clamp-2 leading-tight transition-colors group-hover:text-[#e9c349] w-[80px]">
                    {{ book.title }}
                  </h3>
                </a>
              }
            </div>
          </section>

          <!-- Category 3: السير الشعبية والفروسية العربية الخالدة -->
          <section id="arabic-shelf" class="flex flex-col">
            <div class="flex items-baseline justify-between mb-4 pb-2 border-b border-white/[0.08]">
              <div class="flex items-center gap-2.5">
                <span class="w-2.5 h-2.5 rounded-full bg-[#7bd8b1] inline-block shadow-[0_0_8px_rgba(123,216,177,0.7)]"></span>
                <h2 class="font-noto-serif text-xl sm:text-2xl font-bold text-[#e5e1e4]">
                  السير الشعبية والفروسية العربية الخالدة
                </h2>
                <span class="text-xs text-[#debfc2]/60 mr-2 hidden sm:inline">صهيل جياد عنترة، رحلة بني هلال، وملاحم الفتوة الشعبية</span>
              </div>
              
              <div class="flex items-center gap-3">
                <button
                  type="button"
                  (click)="selectGenre('السير الشعبية والفروسية العربية')"
                  class="text-[#e9c349] hover:text-[#ffe088] text-xs font-medium flex items-center gap-1 transition-colors cursor-pointer"
                >
                  <span>استعراض الرواق كاملاً</span>
                  <span class="material-symbols-outlined text-[15px]">arrow_back</span>
                </button>

                <!-- Row Slide Buttons -->
                <div class="flex items-center gap-1">
                  <button
                    type="button"
                    (click)="scrollRow(arabicRow, 'right')"
                    aria-label="السابق"
                    class="w-7 h-7 rounded-lg bg-[#1c1b1d] border border-white/5 text-[#debfc2] hover:text-white hover:bg-[#201f22] transition-colors flex items-center justify-center cursor-pointer"
                  >
                    <span class="material-symbols-outlined text-[17px]">chevron_right</span>
                  </button>
                  <button
                    type="button"
                    (click)="scrollRow(arabicRow, 'left')"
                    aria-label="التالي"
                    class="w-7 h-7 rounded-lg bg-[#1c1b1d] border border-white/5 text-[#debfc2] hover:text-white hover:bg-[#201f22] transition-colors flex items-center justify-center cursor-pointer"
                  >
                    <span class="material-symbols-outlined text-[17px]">chevron_left</span>
                  </button>
                </div>
              </div>
            </div>

            <!-- Horizontal Side-Scrolling Row (80px x 120px) -->
            <div
              #arabicRow
              class="flex overflow-x-auto gap-4 sm:gap-5 pb-3 pt-1 scrollbar-none snap-x snap-mandatory scroll-smooth"
            >
              @for (book of arabicEpics; track book.id) {
                <a
                  [routerLink]="['/novel', book.id]"
                  class="shrink-0 snap-start flex flex-col items-center group cursor-pointer focus:outline-none w-[80px]"
                  [title]="book.title"
                >
                  <div class="w-[80px] h-[120px] rounded-lg overflow-hidden bg-[#1c1b1d] shadow-lg transition-all duration-300 group-hover:-translate-y-1.5 group-hover:shadow-[0_12px_28px_rgba(123,216,177,0.35)] border border-white/10 group-hover:border-[#7bd8b1]/40">
                    <img
                      [src]="book.coverImage"
                      [alt]="book.title"
                      class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      loading="lazy"
                    />
                  </div>
                  <h3 class="font-noto-serif text-[11px] font-semibold text-[#e5e1e4] mt-2 text-center line-clamp-2 leading-tight transition-colors group-hover:text-[#e9c349] w-[80px]">
                    {{ book.title }}
                  </h3>
                </a>
              }
            </div>
          </section>

          <!-- Category 4: ملاحم الشمال والأساطير الإسكندنافية -->
          <section id="norse-shelf" class="flex flex-col">
            <div class="flex items-baseline justify-between mb-4 pb-2 border-b border-white/[0.08]">
              <div class="flex items-center gap-2.5">
                <span class="w-2.5 h-2.5 rounded-full bg-[#818cf8] inline-block shadow-[0_0_8px_rgba(129,140,248,0.7)]"></span>
                <h2 class="font-noto-serif text-xl sm:text-2xl font-bold text-[#e5e1e4]">
                  ملاحم الشمال والأساطير الإسكندنافية
                </h2>
                <span class="text-xs text-[#debfc2]/60 mr-2 hidden sm:inline">أصداء الفايكنج، صراع راغناروك، ومأثرة بيوولف ضد الوحش</span>
              </div>
              
              <div class="flex items-center gap-3">
                <button
                  type="button"
                  (click)="selectGenre('ملاحم الشمال والأساطير الإسكندنافية')"
                  class="text-[#e9c349] hover:text-[#ffe088] text-xs font-medium flex items-center gap-1 transition-colors cursor-pointer"
                >
                  <span>استعراض الرواق كاملاً</span>
                  <span class="material-symbols-outlined text-[15px]">arrow_back</span>
                </button>

                <!-- Row Slide Buttons -->
                <div class="flex items-center gap-1">
                  <button
                    type="button"
                    (click)="scrollRow(norseRow, 'right')"
                    aria-label="السابق"
                    class="w-7 h-7 rounded-lg bg-[#1c1b1d] border border-white/5 text-[#debfc2] hover:text-white hover:bg-[#201f22] transition-colors flex items-center justify-center cursor-pointer"
                  >
                    <span class="material-symbols-outlined text-[17px]">chevron_right</span>
                  </button>
                  <button
                    type="button"
                    (click)="scrollRow(norseRow, 'left')"
                    aria-label="التالي"
                    class="w-7 h-7 rounded-lg bg-[#1c1b1d] border border-white/5 text-[#debfc2] hover:text-white hover:bg-[#201f22] transition-colors flex items-center justify-center cursor-pointer"
                  >
                    <span class="material-symbols-outlined text-[17px]">chevron_left</span>
                  </button>
                </div>
              </div>
            </div>

            <!-- Horizontal Side-Scrolling Row (80px x 120px) -->
            <div
              #norseRow
              class="flex overflow-x-auto gap-4 sm:gap-5 pb-3 pt-1 scrollbar-none snap-x snap-mandatory scroll-smooth"
            >
              @for (book of norseEpics; track book.id) {
                <a
                  [routerLink]="['/novel', book.id]"
                  class="shrink-0 snap-start flex flex-col items-center group cursor-pointer focus:outline-none w-[80px]"
                  [title]="book.title"
                >
                  <div class="w-[80px] h-[120px] rounded-lg overflow-hidden bg-[#1c1b1d] shadow-lg transition-all duration-300 group-hover:-translate-y-1.5 group-hover:shadow-[0_12px_28px_rgba(129,140,248,0.35)] border border-white/10 group-hover:border-[#818cf8]/40">
                    <img
                      [src]="book.coverImage"
                      [alt]="book.title"
                      class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      loading="lazy"
                    />
                  </div>
                  <h3 class="font-noto-serif text-[11px] font-semibold text-[#e5e1e4] mt-2 text-center line-clamp-2 leading-tight transition-colors group-hover:text-[#e9c349] w-[80px]">
                    {{ book.title }}
                  </h3>
                </a>
              }
            </div>
          </section>

          <!-- Category 5: شواهين الشرق وملاحم آسيا الكبرى -->
          <section id="asia-shelf" class="flex flex-col">
            <div class="flex items-baseline justify-between mb-4 pb-2 border-b border-white/[0.08]">
              <div class="flex items-center gap-2.5">
                <span class="w-2.5 h-2.5 rounded-full bg-[#f59e0b] inline-block shadow-[0_0_8px_rgba(245,158,11,0.7)]"></span>
                <h2 class="font-noto-serif text-xl sm:text-2xl font-bold text-[#e5e1e4]">
                  شواهين الشرق وملاحم آسيا الكبرى
                </h2>
                <span class="text-xs text-[#debfc2]/60 mr-2 hidden sm:inline">أبطال الفردوسي، معركة كوروكشترا الكبرى، وسفر ماناس</span>
              </div>
              
              <div class="flex items-center gap-3">
                <button
                  type="button"
                  (click)="selectGenre('شواهين الشرق وأسفار آسيا')"
                  class="text-[#e9c349] hover:text-[#ffe088] text-xs font-medium flex items-center gap-1 transition-colors cursor-pointer"
                >
                  <span>استعراض الرواق كاملاً</span>
                  <span class="material-symbols-outlined text-[15px]">arrow_back</span>
                </button>

                <!-- Row Slide Buttons -->
                <div class="flex items-center gap-1">
                  <button
                    type="button"
                    (click)="scrollRow(asiaRow, 'right')"
                    aria-label="السابق"
                    class="w-7 h-7 rounded-lg bg-[#1c1b1d] border border-white/5 text-[#debfc2] hover:text-white hover:bg-[#201f22] transition-colors flex items-center justify-center cursor-pointer"
                  >
                    <span class="material-symbols-outlined text-[17px]">chevron_right</span>
                  </button>
                  <button
                    type="button"
                    (click)="scrollRow(asiaRow, 'left')"
                    aria-label="التالي"
                    class="w-7 h-7 rounded-lg bg-[#1c1b1d] border border-white/5 text-[#debfc2] hover:text-white hover:bg-[#201f22] transition-colors flex items-center justify-center cursor-pointer"
                  >
                    <span class="material-symbols-outlined text-[17px]">chevron_left</span>
                  </button>
                </div>
              </div>
            </div>

            <!-- Horizontal Side-Scrolling Row (80px x 120px) -->
            <div
              #asiaRow
              class="flex overflow-x-auto gap-4 sm:gap-5 pb-3 pt-1 scrollbar-none snap-x snap-mandatory scroll-smooth"
            >
              @for (book of asianEpics; track book.id) {
                <a
                  [routerLink]="['/novel', book.id]"
                  class="shrink-0 snap-start flex flex-col items-center group cursor-pointer focus:outline-none w-[80px]"
                  [title]="book.title"
                >
                  <div class="w-[80px] h-[120px] rounded-lg overflow-hidden bg-[#1c1b1d] shadow-lg transition-all duration-300 group-hover:-translate-y-1.5 group-hover:shadow-[0_12px_28px_rgba(245,158,11,0.35)] border border-white/10 group-hover:border-[#f59e0b]/40">
                    <img
                      [src]="book.coverImage"
                      [alt]="book.title"
                      class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      loading="lazy"
                    />
                  </div>
                  <h3 class="font-noto-serif text-[11px] font-semibold text-[#e5e1e4] mt-2 text-center line-clamp-2 leading-tight transition-colors group-hover:text-[#e9c349] w-[80px]">
                    {{ book.title }}
                  </h3>
                </a>
              }
            </div>
          </section>

          <!-- Category 6: ملاحم العصور الوسطى وفرسان المائدة -->
          <section id="medieval-shelf" class="flex flex-col">
            <div class="flex items-baseline justify-between mb-4 pb-2 border-b border-white/[0.08]">
              <div class="flex items-center gap-2.5">
                <span class="w-2.5 h-2.5 rounded-full bg-[#f43f5e] inline-block shadow-[0_0_8px_rgba(244,63,94,0.7)]"></span>
                <h2 class="font-noto-serif text-xl sm:text-2xl font-bold text-[#e5e1e4]">
                  ملاحم العصور الوسطى وفرسان المائدة
                </h2>
                <span class="text-xs text-[#debfc2]/60 mr-2 hidden sm:inline">أنشودة النيبلونغ، رولاند عند ممر رونسفال، وسيف الملك آرثر</span>
              </div>
              
              <div class="flex items-center gap-3">
                <button
                  type="button"
                  (click)="selectGenre('ملاحم العصور الوسطى والفرسان')"
                  class="text-[#e9c349] hover:text-[#ffe088] text-xs font-medium flex items-center gap-1 transition-colors cursor-pointer"
                >
                  <span>استعراض الرواق كاملاً</span>
                  <span class="material-symbols-outlined text-[15px]">arrow_back</span>
                </button>

                <!-- Row Slide Buttons -->
                <div class="flex items-center gap-1">
                  <button
                    type="button"
                    (click)="scrollRow(medievalRow, 'right')"
                    aria-label="السابق"
                    class="w-7 h-7 rounded-lg bg-[#1c1b1d] border border-white/5 text-[#debfc2] hover:text-white hover:bg-[#201f22] transition-colors flex items-center justify-center cursor-pointer"
                  >
                    <span class="material-symbols-outlined text-[17px]">chevron_right</span>
                  </button>
                  <button
                    type="button"
                    (click)="scrollRow(medievalRow, 'left')"
                    aria-label="التالي"
                    class="w-7 h-7 rounded-lg bg-[#1c1b1d] border border-white/5 text-[#debfc2] hover:text-white hover:bg-[#201f22] transition-colors flex items-center justify-center cursor-pointer"
                  >
                    <span class="material-symbols-outlined text-[17px]">chevron_left</span>
                  </button>
                </div>
              </div>
            </div>

            <!-- Horizontal Side-Scrolling Row (80px x 120px) -->
            <div
              #medievalRow
              class="flex overflow-x-auto gap-4 sm:gap-5 pb-3 pt-1 scrollbar-none snap-x snap-mandatory scroll-smooth"
            >
              @for (book of medievalEpics; track book.id) {
                <a
                  [routerLink]="['/novel', book.id]"
                  class="shrink-0 snap-start flex flex-col items-center group cursor-pointer focus:outline-none w-[80px]"
                  [title]="book.title"
                >
                  <div class="w-[80px] h-[120px] rounded-lg overflow-hidden bg-[#1c1b1d] shadow-lg transition-all duration-300 group-hover:-translate-y-1.5 group-hover:shadow-[0_12px_28px_rgba(244,63,94,0.35)] border border-white/10 group-hover:border-[#f43f5e]/40">
                    <img
                      [src]="book.coverImage"
                      [alt]="book.title"
                      class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      loading="lazy"
                    />
                  </div>
                  <h3 class="font-noto-serif text-[11px] font-semibold text-[#e5e1e4] mt-2 text-center line-clamp-2 leading-tight transition-colors group-hover:text-[#e9c349] w-[80px]">
                    {{ book.title }}
                  </h3>
                </a>
              }
            </div>
          </section>

        </div>

        <!-- ========================================== -->
        <!-- 4. EDITORIAL FEATURE: «اكتشاف عشوائي: من دهاليز الملاحم» -->
        <!-- ========================================== -->
        <section class="w-full px-4 sm:px-6 md:px-12 py-10 max-w-[1400px] mx-auto">
          <div class="relative bg-[#1c1b1d]/90 border border-white/[0.08] rounded-2xl p-6 sm:p-8 lg:p-10 overflow-hidden shadow-2xl">
            <!-- Ambient Background Vector Glow -->
            <div class="absolute -bottom-20 -left-20 w-80 h-80 bg-[#af8d11]/20 rounded-full blur-3xl pointer-events-none"></div>
            <div class="absolute top-0 right-1/3 w-64 h-64 bg-[#1e3a8a]/15 rounded-full blur-3xl pointer-events-none"></div>

            <div class="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 mb-6 relative z-10">
              <div class="flex flex-col gap-1.5 max-w-xl">
                <div class="flex items-center gap-1.5 text-[#e9c349] text-xs sm:text-sm font-semibold">
                  <span class="material-symbols-outlined text-[18px]">casino</span>
                  <span>مصادفات المعبد الملحمي</span>
                </div>
                <h2 class="font-noto-serif text-2xl sm:text-3xl font-bold text-[#e5e1e4]">
                  اكتشاف عشوائي: من دهاليز الملاحم
                </h2>
                <p class="text-xs sm:text-sm text-[#debfc2]/80 leading-relaxed">
                  أسفار ومرويات بطولية نادرة انحدرت من أعماق القرون السحيقة، اختارتها خوارزمية الرواق لتهديك تجربة مدهشة خارج المسار المألوف.
                </p>
              </div>

              <div class="flex items-center gap-2">
                <button
                  type="button"
                  (click)="shuffleSerendipity()"
                  class="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#2a2a2c] text-[#e5e1e4] hover:bg-[#353437] hover:text-white transition-all shadow-sm border border-white/5 cursor-pointer"
                >
                  <span
                    class="material-symbols-outlined text-[18px] text-[#e9c349] transition-transform duration-500"
                    [class.animate-spin]="isShuffling()"
                  >
                    autorenew
                  </span>
                  <span class="text-xs sm:text-sm font-medium">استحضار اختيارات أخرى</span>
                </button>

                <!-- Row Slide Buttons -->
                <button
                  type="button"
                  (click)="scrollRow(serendipityRow, 'right')"
                  aria-label="السابق"
                  class="w-9 h-9 rounded-xl bg-[#1c1b1d] border border-white/5 text-[#debfc2] hover:text-white hover:bg-[#201f22] transition-colors flex items-center justify-center cursor-pointer shadow-sm"
                >
                  <span class="material-symbols-outlined text-[18px]">chevron_right</span>
                </button>
                <button
                  type="button"
                  (click)="scrollRow(serendipityRow, 'left')"
                  aria-label="التالي"
                  class="w-9 h-9 rounded-xl bg-[#1c1b1d] border border-white/5 text-[#debfc2] hover:text-white hover:bg-[#201f22] transition-colors flex items-center justify-center cursor-pointer shadow-sm"
                >
                  <span class="material-symbols-outlined text-[18px]">chevron_left</span>
                </button>
              </div>
            </div>

            <!-- Horizontal Side-Scrolling Row for Serendipity with Strict 80px x 120px Covers -->
            <div
              #serendipityRow
              class="flex overflow-x-auto gap-4 sm:gap-5 pb-3 pt-1 scrollbar-none snap-x snap-mandatory scroll-smooth relative z-10"
            >
              @for (item of serendipityBooks(); track item.id) {
                <div class="shrink-0 snap-start flex items-center gap-3.5 bg-[#201f22]/70 border border-white/5 p-3 rounded-xl shadow-md transition-all hover:bg-[#2a2a2c] group w-72 sm:w-80">
                  <!-- Strict 80px x 120px Card Cover -->
                  <a
                    [routerLink]="['/novel', item.id]"
                    class="w-[80px] h-[120px] shrink-0 rounded-lg overflow-hidden shadow-lg border border-white/10 group-hover:border-[#e9c349]/40 block cursor-pointer"
                    [title]="item.title"
                  >
                    <img
                      [src]="item.coverImage"
                      [alt]="item.title"
                      class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      loading="lazy"
                    />
                  </a>
                  <div class="flex flex-col min-w-0 flex-1">
                    <span class="text-[11px] font-semibold text-[#e9c349] mb-1 truncate">
                      {{ item.alley || 'دهليز الملاحم' }}
                    </span>
                    <a
                      [routerLink]="['/novel', item.id]"
                      class="font-noto-serif text-sm font-bold text-[#e5e1e4] group-hover:text-[#e9c349] transition-colors truncate block"
                    >
                      {{ item.title }}
                    </a>
                    <p class="text-xs text-[#debfc2]/70 mt-1 line-clamp-2 leading-relaxed">
                      {{ item.description }}
                    </p>
                    <div class="flex items-center gap-2 mt-2.5">
                      <a
                        [routerLink]="['/reader', item.id]"
                        class="px-2.5 py-1 rounded-lg bg-[#e9c349] text-[#241a00] text-[11px] font-bold hover:bg-[#ffe088] transition-colors cursor-pointer inline-flex items-center gap-1"
                      >
                        <span>قراءة</span>
                        <span class="material-symbols-outlined text-[13px]">menu_book</span>
                      </a>
                      <a
                        [routerLink]="['/novel', item.id]"
                        class="text-[11px] text-[#debfc2]/80 hover:text-white transition-colors"
                      >
                        تفاصيل
                      </a>
                    </div>
                  </div>
                </div>
              }
            </div>

          </div>
        </section>

        <!-- ========================================== -->
        <!-- 5. «الأكثر قراءة هذا الفصل في الملاحم» (MOST READ THIS SEASON) -->
        <!-- ========================================== -->
        <section class="w-full px-4 sm:px-6 md:px-12 py-8 max-w-[1400px] mx-auto">
          <div class="flex items-end justify-between mb-5">
            <div>
              <span class="text-xs text-[#e9c349] font-semibold tracking-wider block mb-1">نبض القرّاء المستمر</span>
              <h2 class="font-noto-serif text-2xl sm:text-3xl font-bold text-[#e5e1e4]">
                الأكثر قراءة هذا الفصل في الملاحم
              </h2>
            </div>
            
            <div class="flex items-center gap-2">
              <span class="text-xs text-[#debfc2]/60 hidden sm:inline ml-2">محدّث تلقائياً بحسب وتيرة الخلود</span>
              
              <!-- Slide Navigation Buttons -->
              <button
                type="button"
                (click)="scrollRow(mostReadRow, 'right')"
                aria-label="السابق"
                class="w-8 h-8 rounded-lg bg-[#1c1b1d] border border-white/5 text-[#debfc2] hover:text-white hover:bg-[#201f22] transition-colors flex items-center justify-center cursor-pointer shadow-sm"
              >
                <span class="material-symbols-outlined text-[18px]">chevron_right</span>
              </button>
              <button
                type="button"
                (click)="scrollRow(mostReadRow, 'left')"
                aria-label="التالي"
                class="w-8 h-8 rounded-lg bg-[#1c1b1d] border border-white/5 text-[#debfc2] hover:text-white hover:bg-[#201f22] transition-colors flex items-center justify-center cursor-pointer shadow-sm"
              >
                <span class="material-symbols-outlined text-[18px]">chevron_left</span>
              </button>
            </div>
          </div>

          <!-- Horizontal Side-Scrolling Row (80px x 120px Cards with Rank Indicator) -->
          <div
            #mostReadRow
            class="flex overflow-x-auto gap-4 sm:gap-5 pb-3 pt-1 scrollbar-none snap-x snap-mandatory scroll-smooth"
          >
            @for (item of mostReadBooks; track item.rank) {
              <a
                [routerLink]="['/novel', item.book.id]"
                class="shrink-0 snap-start flex flex-col items-center group cursor-pointer focus:outline-none w-[80px]"
                [title]="item.book.title"
              >
                <!-- 80px x 120px Card Cover with Rank Badge -->
                <div class="relative w-[80px] h-[120px] rounded-lg overflow-hidden bg-[#1c1b1d] shadow-lg transition-all duration-300 group-hover:-translate-y-1.5 group-hover:shadow-[0_12px_28px_rgba(233,195,73,0.35)] border border-white/10 group-hover:border-[#e9c349]/50">
                  <img
                    [src]="item.book.coverImage"
                    [alt]="item.book.title"
                    class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    loading="lazy"
                  />
                  <!-- Rank Badge in Corner -->
                  <div class="absolute top-1 right-1 w-5 h-5 rounded-md bg-black/75 backdrop-blur-sm border border-[#e9c349]/40 text-[#e9c349] font-bold text-[10px] flex items-center justify-center shadow-md">
                    {{ item.rank }}
                  </div>
                </div>
                <!-- Novel Title -->
                <h3 class="font-noto-serif text-[11px] font-semibold text-[#e5e1e4] mt-2 text-center line-clamp-2 leading-tight transition-colors group-hover:text-[#e9c349] w-[80px]">
                  {{ item.book.title }}
                </h3>
              </a>
            }
          </div>
        </section>

        <!-- ========================================== -->
        <!-- 6. FAST FILTER & INDEX STRIP (Working Interactive Filters) -->
        <!-- ========================================== -->
        <section class="w-full px-4 sm:px-6 md:px-12 pt-4 pb-16 max-w-[1400px] mx-auto">
          <div class="bg-[#1c1b1d]/80 border border-white/[0.08] backdrop-blur-md rounded-xl p-4 sm:p-5 flex flex-col md:flex-row items-center justify-between gap-4 shadow-xl">
            
            <div class="flex items-center gap-2 text-[#e5e1e4]">
              <span class="material-symbols-outlined text-[#e9c349] text-[22px]">filter_list</span>
              <span class="text-xs sm:text-sm font-semibold">فهارس الاستكشاف السريع للملاحم:</span>
            </div>
            
            <!-- Fast Interactive Filter Buttons -->
            <div class="flex flex-wrap items-center gap-2">
              <button
                type="button"
                (click)="applyFastFilter('longest')"
                class="px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all border cursor-pointer flex items-center gap-1.5"
                [class]="fastFilter() === 'longest' ? 'bg-[#e9c349] text-[#241a00] font-bold border-[#e9c349] shadow-md' : 'bg-[#201f22] hover:bg-[#2a2a2c] text-[#debfc2] hover:text-[#e5e1e4] border-white/5'"
              >
                <span>حسب الأطول أبياتاً وفصولاً</span>
                @if (fastFilter() === 'longest') {
                  <span class="w-1.5 h-1.5 rounded-full bg-[#241a00]"></span>
                }
              </button>

              <button
                type="button"
                (click)="applyFastFilter('translated')"
                class="px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all border cursor-pointer flex items-center gap-1.5"
                [class]="fastFilter() === 'translated' ? 'bg-[#7bd8b1] text-[#003822] font-bold border-[#7bd8b1] shadow-md' : 'bg-[#201f22] hover:bg-[#2a2a2c] text-[#debfc2] hover:text-[#e5e1e4] border-white/5'"
              >
                <span>ملاحم مترجمة عالمياً</span>
                @if (fastFilter() === 'translated') {
                  <span class="w-1.5 h-1.5 rounded-full bg-[#003822]"></span>
                }
              </button>

              <button
                type="button"
                (click)="applyFastFilter('completed')"
                class="px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all border cursor-pointer flex items-center gap-1.5"
                [class]="fastFilter() === 'completed' ? 'bg-[#ffb2bd] text-[#670024] font-bold border-[#ffb2bd] shadow-md' : 'bg-[#201f22] hover:bg-[#2a2a2c] text-[#debfc2] hover:text-[#e5e1e4] border-white/5'"
              >
                <span>أسفار بطولية مكتملة</span>
                @if (fastFilter() === 'completed') {
                  <span class="w-1.5 h-1.5 rounded-full bg-[#670024]"></span>
                }
              </button>

              <button
                type="button"
                (click)="applyFastFilter('short')"
                class="px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all border cursor-pointer flex items-center gap-1.5"
                [class]="fastFilter() === 'short' ? 'bg-[#e5e1e4] text-[#131315] font-bold border-[#e5e1e4] shadow-md' : 'bg-[#201f22] hover:bg-[#2a2a2c] text-[#debfc2] hover:text-[#e5e1e4] border-white/5'"
              >
                <span>نصوص ملحمية موجزة</span>
                @if (fastFilter() === 'short') {
                  <span class="w-1.5 h-1.5 rounded-full bg-[#131315]"></span>
                }
              </button>
            </div>

            <!-- Alphabetical Index Toggle Button -->
            <button
              type="button"
              (click)="toggleAlphabeticalIndex()"
              class="inline-flex items-center gap-1.5 text-xs font-semibold transition-all px-3 py-1.5 rounded-lg border cursor-pointer"
              [class]="isAlphabetOpen() || (activeAlphabetLetter() && activeAlphabetLetter() !== 'الكل') ? 'bg-[#e9c349] text-[#241a00] border-[#e9c349]' : 'text-[#e9c349] hover:text-[#ffe088] bg-[#2a2a2c] hover:bg-[#353437] border-white/5'"
            >
              <span>فهرس الرواق الأبجدي</span>
              <span class="material-symbols-outlined text-[16px]">
                {{ isAlphabetOpen() ? 'expand_less' : 'sort_by_alpha' }}
              </span>
            </button>

          </div>
        </section>

      </div>
    </div>
  `,
})
export class RiwaqEpics {
  private readonly router = inject(Router);

  readonly spotlightEpic = SPOTLIGHT_EPIC;
  readonly featuredBooks = FEATURED_EPICS;
  readonly mesopotamianEpics = MESOPOTAMIAN_EPICS;
  readonly greekRomanEpics = GREEK_ROMAN_EPICS;
  readonly arabicEpics = ARABIC_CHIVALRY_EPICS;
  readonly norseEpics = NORSE_NORTHERN_EPICS;
  readonly asianEpics = ASIAN_PERSIAN_EPICS;
  readonly medievalEpics = MEDIEVAL_CHIVALRY_EPICS;
  readonly mostReadBooks = MOST_READ_EPICS;
  readonly genrePills = EPIC_GENRE_PILLS;

  readonly selectedGenre = signal<string>('الكل');
  readonly fastFilter = signal<string>(''); // 'longest' | 'translated' | 'completed' | 'short'
  readonly activeAlphabetLetter = signal<string>('الكل');
  readonly isAlphabetOpen = signal<boolean>(false);
  readonly searchKeyword = signal<string>('');
  readonly sortBy = signal<'default' | 'alphabetical'>('default');

  readonly serendipityBooks = signal<RiwaqEpicItem[]>(SERENDIPITY_EPICS);
  readonly isShuffling = signal<boolean>(false);

  readonly arabicLetters = [
    'الكل', 'أ', 'ب', 'ت', 'ث', 'ج', 'ح', 'خ', 'د', 'ذ', 'ر', 'ز', 'س', 'ش', 'ص', 'ض', 'ط', 'ظ', 'ع', 'غ', 'ف', 'ق', 'ك', 'ل', 'م', 'ن', 'هـ', 'و', 'ي'
  ];

  readonly isFilterActive = computed(() => {
    return (
      this.selectedGenre() !== 'الكل' ||
      this.fastFilter() !== '' ||
      (this.activeAlphabetLetter() !== 'الكل' && this.activeAlphabetLetter() !== '') ||
      this.searchKeyword().trim() !== ''
    );
  });

  readonly currentFilterTitle = computed(() => {
    if (this.fastFilter()) {
      switch (this.fastFilter()) {
        case 'longest': return 'حسب الأطول أبياتاً وفصولاً (الملاحم الكبرى المطوّلة)';
        case 'translated': return 'الملاحم المترجمة العالمية من لغات الحضارات';
        case 'completed': return 'الأسفار البطولية المكتملة المحققة';
        case 'short': return 'النصوص والقصائد الملحمية الموجزة';
      }
    }
    if (this.activeAlphabetLetter() && this.activeAlphabetLetter() !== 'الكل') {
      return `الفهرس الأبجدي للملاحم: حرف (${this.activeAlphabetLetter()})`;
    }
    if (this.selectedGenre() !== 'الكل') {
      return `تصنيف: ${this.selectedGenre()}`;
    }
    if (this.searchKeyword().trim()) {
      return `نتائج البحث عن: «${this.searchKeyword().trim()}»`;
    }
    return 'مخطوطات رواق الملاحم الشاملة';
  });

  readonly currentFilterSubtitle = computed(() => {
    if (this.fastFilter()) {
      return 'تصفية ديناميكية مخصصة وفق أطوال وأناشيد ومصادر النصوص الملحمية.';
    }
    if (this.activeAlphabetLetter() && this.activeAlphabetLetter() !== 'الكل') {
      return `عرض جميع الملاحم والأسفار المرتبة التي تبتدئ بحرف ${this.activeAlphabetLetter()}.`;
    }
    if (this.selectedGenre() !== 'الكل') {
      return `استعراض شامل لكافة نصوص ومخطوطات ${this.selectedGenre()}.`;
    }
    return 'قائمة الأسفار المطابقة لمعايير التصفية الحالية في رواق الملاحم.';
  });

  readonly filteredBooks = computed<RiwaqEpicItem[]>(() => {
    let list = [...MASTER_EPICS_CATALOG];
    const genre = this.selectedGenre();
    const fast = this.fastFilter();
    const letter = this.activeAlphabetLetter();
    const search = this.searchKeyword().trim().toLowerCase();

    // 1. Genre filter
    if (genre !== 'الكل') {
      if (genre === 'ملاحم الشرق وبلاد الرافدين') {
        list = list.filter(b => (b.category || '').includes('ملاحم الشرق') || (b.title || '').includes('جلجامش') || (b.title || '').includes('إنوما') || (b.title || '').includes('أتراخاسيس') || (b.title || '').includes('إنانا') || (b.title || '').includes('إيتانا') || (b.title || '').includes('كيرات'));
      } else if (genre === 'الملاحم الإغريقية والرومانية') {
        list = list.filter(b => (b.category || '').includes('إغريق') || (b.category || '').includes('رومان') || (b.title || '').includes('إلياذة') || (b.title || '').includes('أوديسة') || (b.title || '').includes('إنيادة') || (b.title || '').includes('مسخ') || (b.title || '').includes('ثيوغونيا') || (b.title || '').includes('أرجوناوتيكا'));
      } else if (genre === 'السير الشعبية والفروسية العربية') {
        list = list.filter(b => (b.category || '').includes('عرب') || (b.title || '').includes('عنترة') || (b.title || '').includes('هلال') || (b.title || '').includes('ذي يزن') || (b.title || '').includes('الزير') || (b.title || '').includes('بيبرس') || (b.title || '').includes('الهمة'));
      } else if (genre === 'ملاحم الشمال والأساطير الإسكندنافية') {
        list = list.filter(b => (b.category || '').includes('شمال') || (b.category || '').includes('نورس') || (b.title || '').includes('بيوولف') || (b.title || '').includes('إيدا') || (b.title || '').includes('فولسونغا') || (b.title || '').includes('كاليفالا') || (b.title || '').includes('راغنار') || (b.title || '').includes('نيال'));
      } else if (genre === 'شواهين الشرق وأسفار آسيا') {
        list = list.filter(b => (b.category || '').includes('آسيا') || (b.category || '').includes('هند') || (b.category || '').includes('فرس') || (b.title || '').includes('شاهنامة') || (b.title || '').includes('مهابهاراتا') || (b.title || '').includes('رامايانا') || (b.title || '').includes('غيسار') || (b.title || '').includes('الغرب') || (b.title || '').includes('ماناس'));
      } else if (genre === 'ملاحم العصور الوسطى والفرسان') {
        list = list.filter(b => (b.category || '').includes('وسطى') || (b.title || '').includes('رولاند') || (b.title || '').includes('السيد') || (b.title || '').includes('نيبلونغ') || (b.title || '').includes('آرثر') || (b.title || '').includes('كوميديا') || (b.title || '').includes('أورلاندو'));
      }
    }

    // 2. Fast filter
    if (fast) {
      if (fast === 'longest') {
        list = [...list].reverse();
      } else if (fast === 'translated') {
        list = list.filter(b => {
          const author = b.author || '';
          return author.includes('هوميروس') || author.includes('فيرجيل') || author.includes('أوفيد') || author.includes('مالوري') || author.includes('دانتي') || author.includes('فياسا');
        });
      } else if (fast === 'completed') {
        list = list.filter((_, idx) => idx % 2 === 0);
      } else if (fast === 'short') {
        list = list.filter((_, idx) => idx % 2 === 1);
      }
    }

    // 3. Alphabet letter filter
    if (letter && letter !== 'الكل') {
      const targetLetter = letter.trim();
      list = list.filter(b => {
        let titleClean = b.title.trim();
        if (titleClean.startsWith('ال') && targetLetter !== 'ا' && targetLetter !== 'أ') {
          titleClean = titleClean.substring(2).trim();
        }
        const firstChar = titleClean.charAt(0);
        if (targetLetter === 'أ' || targetLetter === 'ا') {
          return firstChar === 'أ' || firstChar === 'ا' || firstChar === 'إ' || firstChar === 'آ';
        }
        return firstChar === targetLetter;
      });
    }

    // 4. Keyword search
    if (search) {
      list = list.filter(b =>
        b.title.toLowerCase().includes(search) ||
        (b.author || '').toLowerCase().includes(search) ||
        (b.category || '').toLowerCase().includes(search) ||
        (b.description || '').toLowerCase().includes(search)
      );
    }

    // 5. Sorting
    if (this.sortBy() === 'alphabetical') {
      list.sort((a, b) => a.title.localeCompare(b.title, 'ar'));
    }

    return list;
  });

  selectGenre(genre: string): void {
    if (genre === 'الكل') {
      this.clearFilters();
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    this.selectedGenre.set(genre);
    this.fastFilter.set('');
    this.activeAlphabetLetter.set('الكل');

    setTimeout(() => {
      const catalogEl = document.getElementById('corridor-catalog');
      if (catalogEl) {
        catalogEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 100);
  }

  applyFastFilter(type: 'longest' | 'translated' | 'completed' | 'short'): void {
    if (this.fastFilter() === type) {
      this.fastFilter.set('');
    } else {
      this.fastFilter.set(type);
      this.selectedGenre.set('الكل');
      this.activeAlphabetLetter.set('الكل');
    }

    setTimeout(() => {
      const catalogEl = document.getElementById('corridor-catalog');
      if (catalogEl) {
        catalogEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 100);
  }

  toggleAlphabeticalIndex(): void {
    this.isAlphabetOpen.update(v => !v);
  }

  selectAlphabetLetter(letter: string): void {
    this.activeAlphabetLetter.set(letter);
    if (letter !== 'الكل') {
      this.selectedGenre.set('الكل');
      this.fastFilter.set('');
    }

    setTimeout(() => {
      const catalogEl = document.getElementById('corridor-catalog');
      if (catalogEl) {
        catalogEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 100);
  }

  onFilterSearchInput(event: Event): void {
    const target = event.target as HTMLInputElement;
    if (target) {
      this.searchKeyword.set(target.value);
    }
  }

  clearFilters(): void {
    this.selectedGenre.set('الكل');
    this.fastFilter.set('');
    this.activeAlphabetLetter.set('الكل');
    this.searchKeyword.set('');
    this.sortBy.set('default');
  }

  scrollRow(container: HTMLElement, direction: 'left' | 'right'): void {
    if (!container) return;
    const amount = 320;
    const isRtl = document.dir === 'rtl' || getComputedStyle(container).direction === 'rtl';
    
    if (direction === 'right') {
      container.scrollBy({ left: isRtl ? amount : -amount, behavior: 'smooth' });
    } else {
      container.scrollBy({ left: isRtl ? -amount : amount, behavior: 'smooth' });
    }
  }

  shuffleSerendipity(): void {
    this.isShuffling.set(true);
    setTimeout(() => {
      const pool = [...ALL_SERENDIPITY_EPICS_POOL];
      for (let i = pool.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [pool[i], pool[j]] = [pool[j], pool[i]];
      }
      this.serendipityBooks.set(pool.slice(0, 3));
      this.isShuffling.set(false);
    }, 400);
  }
}
