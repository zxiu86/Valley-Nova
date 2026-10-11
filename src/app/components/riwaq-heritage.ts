import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
} from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import {
  ALL_HERITAGE_BOOKS,
  HERITAGE_CATEGORY_FILTERS,
  HERITAGE_ERAS,
  HERITAGE_LANGUAGE_VAULT,
  HERITAGE_ORACLES,
  HERITAGE_POETRY_VAULT,
  HERITAGE_TALES_VAULT,
  HeritageOracleItem,
  MAJOR_HERITAGE_SELECTIONS,
  MOST_STUDIED_MANUSCRIPTS,
  RiwaqHeritageItem,
  SPOTLIGHT_HERITAGE,
} from '../core/riwaq-heritage-data';
import { NovelStore } from '../core/novel-store';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-riwaq-heritage',
  imports: [RouterLink],
  template: `
    <div class="relative w-full min-h-screen bg-[#131315] text-[#e5e1e4] font-sans antialiased selection:bg-[#005039] selection:text-[#97f5cc]" dir="rtl">
      
      <!-- Decorative Manuscript Ambient Atmosphere (Emerald & Warm Copper) -->
      <div class="relative w-full overflow-hidden">
        <div class="absolute top-0 right-1/4 w-96 h-96 rounded-full bg-[#005039]/20 blur-[130px] pointer-events-none"></div>
        <div class="absolute top-48 left-10 w-80 h-80 rounded-full bg-[#af8d11]/15 blur-[120px] pointer-events-none"></div>

        <!-- ======================================================== -->
        <!-- 1. HERO MANUSCRIPT SPOTLIGHT: كليلة ودمنة -->
        <!-- ======================================================== -->
        <section class="w-full px-4 sm:px-6 md:px-12 pt-6 pb-10">
          
          <!-- Website Breadcrumb & Navigation Trail -->
          <div class="max-w-7xl mx-auto flex items-center justify-between py-2 mb-4 text-xs border-b border-white/[0.04]">
            <nav class="flex items-center gap-2 text-[#debfc2]/70 font-medium" aria-label="مسار الموقع">
              <a routerLink="/" class="hover:text-white transition-colors flex items-center gap-1 cursor-pointer">
                <span class="material-symbols-outlined text-[15px]">home</span>
                <span>الرئيسية</span>
              </a>
              <span class="text-white/20">/</span>
              <span class="text-[#7bd8b1] font-semibold flex items-center gap-1">
                <span class="material-symbols-outlined text-[15px]">history_edu</span>
                <span>رواق التراث العربي والمخطوطات</span>
              </span>
            </nav>
            <div class="hidden sm:flex items-center gap-4 text-[11px] text-[#a58a8d]">
              <a routerLink="/riwaq-al-riwayat" class="hover:text-[#ffb2bd] transition-colors cursor-pointer">رواق الروايات</a>
              <span class="text-white/20">•</span>
              <a routerLink="/riwaq-al-malahim" class="hover:text-[#e9c349] transition-colors cursor-pointer">رواق الملاحم</a>
              <span class="text-white/20">•</span>
              <a routerLink="/riwaq-al-hikma" class="hover:text-[#ffe088] transition-colors cursor-pointer">رواق الحكمة</a>
            </div>
          </div>

          <!-- Sanctuary Context Indicator -->
          <div class="max-w-7xl mx-auto flex items-center justify-between flex-wrap gap-2 mb-6">
            <div class="flex items-center gap-3 flex-wrap">
              <span class="inline-flex items-center gap-1.5 text-xs px-3 py-1 rounded-xl bg-[#005039] text-[#97f5cc] tracking-wide font-medium border border-[#7bd8b1]/30">
                <span class="w-1.5 h-1.5 rounded-full bg-[#7bd8b1] animate-pulse"></span>
                <span>خزانة المخطوطات والتحقيق الأندلسي والمشرقي</span>
              </span>
              <span class="text-[#a58a8d] text-xs font-mono">الرقم المرجعي: خ-ت-٧٤٢</span>
            </div>
            <div class="flex items-center gap-1.5 text-[#e9c349] text-xs sm:text-sm font-medium">
              <span class="material-symbols-outlined text-[18px]">auto_stories</span>
              <span>ديوان التراث العربي الأصيل</span>
            </div>
          </div>

          <!-- Hero Card Bento Container -->
          <div class="max-w-7xl mx-auto w-full bg-[#1c1b1d] rounded-2xl shadow-2xl relative overflow-hidden border border-white/[0.08]">
            <!-- Subtle Calligraphic Watermark Accent -->
            <div class="absolute -left-12 -bottom-16 opacity-5 pointer-events-none select-none">
              <span class="font-noto-serif text-[260px] text-[#7bd8b1] leading-none font-bold">حكمة</span>
            </div>

            <div class="grid grid-cols-1 lg:grid-cols-12 gap-8 p-6 sm:p-8 lg:p-12 items-center relative z-10">
              
              <!-- Hero Text Narrative Column (7 Cols in RTL) -->
              <div class="lg:col-span-7 flex flex-col justify-center space-y-4 order-2 lg:order-1">
                <div class="flex items-center gap-2 flex-wrap">
                  <span class="text-[11px] font-semibold px-2.5 py-1 rounded-lg bg-[#2a2a2c] text-[#e9c349] border border-[#e9c349]/30">
                    {{ spotlight.badge }}
                  </span>
                  <span class="text-[#a58a8d] text-xs">٤ مجلدات كاملة بالرسوم الحبرية الأصلية</span>
                </div>

                <h1 class="font-noto-serif text-2xl sm:text-3xl lg:text-4xl font-bold text-[#e5e1e4] tracking-tight leading-tight">
                  {{ spotlight.title }}
                </h1>

                <!-- Quote Container -->
                <div class="bg-[#201f22] p-4 sm:p-5 rounded-xl border border-white/[0.06] shadow-sm relative">
                  <p class="font-noto-serif text-base sm:text-lg text-[#ffe088] leading-relaxed">
                    {{ spotlight.quote }}
                  </p>
                  <span class="block text-xs text-[#a58a8d] mt-2 font-medium">
                    — من ديباجة عبد الله بن المقفع، بغداد عام ١٤٢ هـ
                  </span>
                </div>

                <!-- Meta Details 3-Column Row -->
                <div class="grid grid-cols-3 gap-2 sm:gap-3 py-1 text-right">
                  <div class="bg-[#2a2a2c]/60 p-3 rounded-lg border border-white/[0.04]">
                    <span class="text-[11px] text-[#a58a8d] block font-medium">المصدر الأثري</span>
                    <span class="font-noto-serif text-xs sm:text-sm text-[#e5e1e4] font-semibold">خزانة كوبريللي</span>
                  </div>
                  <div class="bg-[#2a2a2c]/60 p-3 rounded-lg border border-white/[0.04]">
                    <span class="text-[11px] text-[#a58a8d] block font-medium">زمن النسخ</span>
                    <span class="font-noto-serif text-xs sm:text-sm text-[#e5e1e4] font-semibold">أوائل القرن السادس</span>
                  </div>
                  <div class="bg-[#2a2a2c]/60 p-3 rounded-lg border border-white/[0.04]">
                    <span class="text-[11px] text-[#a58a8d] block font-medium">حالة التجليد</span>
                    <span class="font-noto-serif text-xs sm:text-sm text-[#7bd8b1] font-semibold">جلد مغربي محفور</span>
                  </div>
                </div>

                <!-- Sanctuary Call to Action -->
                <div class="flex flex-wrap items-center gap-3 pt-2">
                  <button
                    type="button"
                    (click)="openHeritageReader(spotlight)"
                    class="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-[#005039] hover:bg-[#003827] text-[#97f5cc] font-bold text-xs sm:text-sm shadow-lg hover:shadow-[#005039]/40 border border-[#7bd8b1]/40 transition-all cursor-pointer"
                  >
                    <span class="material-symbols-outlined text-[20px]">import_contacts</span>
                    <span>تصفح المخطوطة المحققة</span>
                  </button>
                  <button
                    type="button"
                    (click)="openHeritageModal(spotlight)"
                    class="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-[#2a2a2c] hover:bg-[#353437] text-[#e5e1e4] text-xs sm:text-sm font-medium border border-white/[0.06] transition-all cursor-pointer"
                  >
                    <span class="material-symbols-outlined text-[18px] text-[#e9c349]">format_list_numbered_rtl</span>
                    <span>فهرس الأبواب والحكايات</span>
                  </button>
                </div>
              </div>

              <!-- Hero Manuscript Visual Column (5 Cols in RTL) -->
              <div class="lg:col-span-5 flex justify-center items-center order-1 lg:order-2">
                <button
                  type="button"
                  (click)="openHeritageModal(spotlight)"
                  class="relative group w-full max-w-sm border-0 bg-transparent p-0 cursor-pointer text-right"
                  aria-label="عرض تفاصيل مخطوطة كليلة ودمنة"
                >
                  <div class="absolute -inset-2 bg-gradient-to-t from-[#005039]/40 via-[#af8d11]/20 to-transparent rounded-2xl blur-xl opacity-75 group-hover:opacity-100 transition-opacity duration-500"></div>
                  <div class="relative aspect-[1/1.55] rounded-xl overflow-hidden shadow-2xl bg-[#0e0e10] border border-white/10 group-hover:-translate-y-1 transition-transform duration-500">
                    <img
                      class="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                      [src]="spotlight.coverImage"
                      alt="مخطوط كليلة ودمنة الأثري"
                      referrerpolicy="no-referrer"
                    />
                    <!-- Gradient Scrim -->
                    <div class="absolute inset-0 bg-gradient-to-t from-[#0e0e10]/90 via-transparent to-black/20 pointer-events-none"></div>
                    <div class="absolute bottom-4 right-4 left-4 text-right">
                      <span class="text-[11px] text-[#e9c349] bg-[#0e0e10]/80 px-2.5 py-1 rounded backdrop-blur border border-white/5 font-medium">
                        طبعة دار الكتب والوثائق القومية
                      </span>
                    </div>
                  </div>
                </button>
              </div>

            </div>
          </div>

          <!-- Quick Shelf Classification Pills -->
          <div id="filters-anchor" class="max-w-7xl mx-auto w-full mt-6 flex items-center justify-start gap-2 overflow-x-auto pb-2 scrollbar-none">
            <span class="text-[#a58a8d] text-xs sm:text-sm ml-2 shrink-0 font-medium flex items-center gap-1">
              <span class="material-symbols-outlined text-[16px] text-[#7bd8b1]">folder_special</span>
              <span>أروقة التبويب:</span>
            </span>
            @for (cat of categoryFilters; track cat.id) {
              <button
                type="button"
                (click)="setCategory(cat.id)"
                class="px-3.5 py-1.5 rounded-xl text-xs font-medium shrink-0 transition-all cursor-pointer flex items-center gap-1"
                [class]="selectedCategory() === cat.id
                  ? 'bg-[#005039] text-[#97f5cc] font-bold border border-[#7bd8b1]/50 shadow-[0_0_12px_rgba(0,80,57,0.4)]'
                  : 'bg-[#1c1b1d] hover:bg-[#201f22] text-[#debfc2] border border-white/[0.06]'"
              >
                @if (selectedCategory() === cat.id) {
                  <span class="w-1.5 h-1.5 rounded-full bg-[#7bd8b1]"></span>
                }
                <span>{{ cat.label }}</span>
                @if (cat.id !== 'all') {
                  <span class="text-[10px] opacity-75">({{ getCategoryCount(cat.id) }})</span>
                }
              </button>
            }
          </div>
        </section>

        <!-- Filter Status Banner (when filtered) -->
        @if (selectedCategory() !== 'all') {
          <section class="w-full px-4 sm:px-6 md:px-12 py-2 max-w-7xl mx-auto">
            <div class="p-3 rounded-xl bg-[#201f22] border border-[#7bd8b1]/30 flex items-center justify-between gap-4">
              <div class="flex items-center gap-2 text-xs sm:text-sm">
                <span class="material-symbols-outlined text-[#7bd8b1] text-[20px]">filter_alt</span>
                <span>المعروض الآن مباحث تبويب: <strong class="text-[#97f5cc]">«{{ selectedCategory() }}»</strong> ({{ filteredItems().length }} مصنف ومخطوط)</span>
              </div>
              <button
                type="button"
                (click)="setCategory('all')"
                class="px-3 py-1 rounded-lg bg-[#2a2a2c] hover:bg-[#353437] text-xs text-[#debfc2] hover:text-white transition-colors cursor-pointer flex items-center gap-1"
              >
                <span>عرض الكل</span>
                <span class="material-symbols-outlined text-[14px]">close</span>
              </button>
            </div>
          </section>
        }

        <!-- ======================================================== -->
        <!-- SECTION 2: مختارات الخزانة التراثية الكبرى (٦ أصول نفيسة) -->
        <!-- ======================================================== -->
        @if (selectedCategory() === 'all' || hasMatchingInList(majorSelections)) {
          <section class="w-full px-4 sm:px-6 md:px-12 py-8">
            <div class="max-w-7xl mx-auto">
              
              <!-- Section Header Row -->
              <div class="flex items-end justify-between mb-5">
                <div>
                  <span class="text-[11px] text-[#e9c349] block font-medium mb-1">نخبة الذخائر المحققة</span>
                  <h2 class="font-noto-serif text-xl sm:text-2xl font-bold text-[#e5e1e4]">مختارات الخزانة التراثية الكبرى</h2>
                </div>
                <div class="flex items-center gap-3">
                  <span class="text-xs text-[#a58a8d] hidden sm:inline">٦ أصول نفيسة</span>
                  <div class="flex items-center gap-1.5">
                    <button
                      type="button"
                      (click)="scrollHorizontal('heritage-major-carousel', -160)"
                      class="p-1 rounded-lg bg-[#1c1b1d] hover:bg-[#2a2a2c] text-[#debfc2] hover:text-[#7bd8b1] border border-white/5 transition-colors cursor-pointer"
                      title="تمرير لليمين"
                    >
                      <span class="material-symbols-outlined text-[16px]">chevron_right</span>
                    </button>
                    <button
                      type="button"
                      (click)="scrollHorizontal('heritage-major-carousel', 160)"
                      class="p-1 rounded-lg bg-[#1c1b1d] hover:bg-[#2a2a2c] text-[#debfc2] hover:text-[#7bd8b1] border border-white/5 transition-colors cursor-pointer"
                      title="تمرير لليسار"
                    >
                      <span class="material-symbols-outlined text-[16px]">chevron_left</span>
                    </button>
                  </div>
                </div>
              </div>

              <!-- Horizontal Scrollable Container with exact width: 80px, height: 120px -->
              <div
                id="heritage-major-carousel"
                class="flex items-start gap-4 overflow-x-auto scrollbar-none py-2 px-1 scroll-smooth focus:outline-none"
              >
                @for (book of getDisplayList(majorSelections); track book.id) {
                  <button
                    type="button"
                    (click)="openHeritageModal(book)"
                    class="w-[80px] min-w-[80px] shrink-0 group flex flex-col gap-1.5 cursor-pointer select-none text-center border-0 bg-transparent p-0"
                  >
                    <div class="w-[80px] h-[120px] rounded-lg overflow-hidden bg-[#201f22] border border-white/10 shadow-md group-hover:shadow-[0_8px_20px_rgba(123,216,177,0.25)] group-hover:border-[#7bd8b1]/60 transition-all duration-300 group-hover:-translate-y-1 relative">
                      <img
                        class="w-full h-full object-cover"
                        [src]="book.coverImage"
                        [alt]="book.title"
                        referrerpolicy="no-referrer"
                      />
                      <div class="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    </div>
                    <h3 class="text-[11px] font-semibold text-[#e5e1e4] group-hover:text-[#7bd8b1] transition-colors text-center line-clamp-2 leading-tight mt-1 w-[80px]">
                      {{ book.title }}
                    </h3>
                  </button>
                }
              </div>
            </div>
          </section>
        }

        <!-- ======================================================== -->
        <!-- SECTION 3: DEEP THEMATIC VAULTS (خزائن التراث التحريرية) -->
        <!-- ======================================================== -->
        <div class="w-full px-4 sm:px-6 md:px-12 space-y-10 py-6 max-w-7xl mx-auto">
          
          <!-- Shelf A: ديوان العرب وعيون الشعر الكلاسيكي -->
          @if (selectedCategory() === 'all' || hasMatchingInList(poetryVault)) {
            <section class="w-full">
              <div class="flex items-center justify-between pb-3 mb-4">
                <div class="flex items-center gap-3">
                  <div class="w-1.5 h-6 bg-[#7bd8b1] rounded-full"></div>
                  <div>
                    <h2 class="font-noto-serif text-lg sm:text-xl font-bold text-[#e5e1e4]">
                      خزانة «ديوان العرب وعيون الشعر الكلاسيكي»
                    </h2>
                    <p class="text-xs text-[#a58a8d] mt-0.5">
                      قصائد الفحول، والشروح الكبرى، وحكايات المعلقات الخالدة في ذاكرة البادية والحواضر
                    </p>
                  </div>
                </div>

                <div class="flex items-center gap-2">
                  <button
                    type="button"
                    (click)="setCategory('دواوين العرب')"
                    class="text-xs text-[#7bd8b1] hover:text-[#97f5cc] transition-colors hidden sm:flex items-center gap-1 cursor-pointer bg-transparent border-0 p-0 font-medium"
                  >
                    <span>عرض الخزانة كاملة</span>
                    <span class="material-symbols-outlined text-[16px]">arrow_back</span>
                  </button>
                  <div class="flex items-center gap-1.5 mr-2">
                    <button
                      type="button"
                      (click)="scrollHorizontal('heritage-poetry-carousel', -160)"
                      class="p-1 rounded-lg bg-[#1c1b1d] hover:bg-[#2a2a2c] text-[#debfc2] hover:text-[#7bd8b1] border border-white/5 transition-colors cursor-pointer"
                      title="تمرير لليمين"
                    >
                      <span class="material-symbols-outlined text-[16px]">chevron_right</span>
                    </button>
                    <button
                      type="button"
                      (click)="scrollHorizontal('heritage-poetry-carousel', 160)"
                      class="p-1 rounded-lg bg-[#1c1b1d] hover:bg-[#2a2a2c] text-[#debfc2] hover:text-[#7bd8b1] border border-white/5 transition-colors cursor-pointer"
                      title="تمرير لليسار"
                    >
                      <span class="material-symbols-outlined text-[16px]">chevron_left</span>
                    </button>
                  </div>
                </div>
              </div>

              <!-- Horizontal Scrollable Container with exact width: 80px, height: 120px -->
              <div
                id="heritage-poetry-carousel"
                class="flex items-start gap-4 overflow-x-auto scrollbar-none py-2 px-1 scroll-smooth focus:outline-none"
              >
                @for (book of getDisplayList(poetryVault); track book.id) {
                  <button
                    type="button"
                    (click)="openHeritageModal(book)"
                    class="w-[80px] min-w-[80px] shrink-0 group flex flex-col gap-1.5 cursor-pointer select-none text-center border-0 bg-transparent p-0"
                  >
                    <div class="w-[80px] h-[120px] rounded-lg overflow-hidden bg-[#201f22] border border-white/10 shadow-md group-hover:shadow-[0_8px_20px_rgba(123,216,177,0.25)] group-hover:border-[#7bd8b1]/60 transition-all duration-300 group-hover:-translate-y-1 relative">
                      <img
                        class="w-full h-full object-cover"
                        [src]="book.coverImage"
                        [alt]="book.title"
                        referrerpolicy="no-referrer"
                      />
                      <div class="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    </div>
                    <h3 class="text-[11px] font-semibold text-[#e5e1e4] group-hover:text-[#7bd8b1] transition-colors text-center line-clamp-2 leading-tight mt-1 w-[80px]">
                      {{ book.title }}
                    </h3>
                  </button>
                }
              </div>
            </section>
          }

          <!-- Shelf B: نوادر الحكايات وأدب المجالس والسير -->
          @if (selectedCategory() === 'all' || hasMatchingInList(talesVault)) {
            <section class="w-full">
              <div class="flex items-center justify-between pb-3 mb-4">
                <div class="flex items-center gap-3">
                  <div class="w-1.5 h-6 bg-[#e9c349] rounded-full"></div>
                  <div>
                    <h2 class="font-noto-serif text-lg sm:text-xl font-bold text-[#e5e1e4]">
                      خزانة «نوادر الحكايات وأدب المجالس والسير»
                    </h2>
                    <p class="text-xs text-[#a58a8d] mt-0.5">
                      أخبار السمار، والطرائف والنوادر، وتراجم الأعلام في عصور التدوين العباسي والأندلسي
                    </p>
                  </div>
                </div>

                <div class="flex items-center gap-2">
                  <button
                    type="button"
                    (click)="setCategory('أمهات الأدب')"
                    class="text-xs text-[#e9c349] hover:text-[#ffe088] transition-colors hidden sm:flex items-center gap-1 cursor-pointer bg-transparent border-0 p-0 font-medium"
                  >
                    <span>عرض الخزانة كاملة</span>
                    <span class="material-symbols-outlined text-[16px]">arrow_back</span>
                  </button>
                  <div class="flex items-center gap-1.5 mr-2">
                    <button
                      type="button"
                      (click)="scrollHorizontal('heritage-tales-carousel', -160)"
                      class="p-1 rounded-lg bg-[#1c1b1d] hover:bg-[#2a2a2c] text-[#debfc2] hover:text-[#e9c349] border border-white/5 transition-colors cursor-pointer"
                      title="تمرير لليمين"
                    >
                      <span class="material-symbols-outlined text-[16px]">chevron_right</span>
                    </button>
                    <button
                      type="button"
                      (click)="scrollHorizontal('heritage-tales-carousel', 160)"
                      class="p-1 rounded-lg bg-[#1c1b1d] hover:bg-[#2a2a2c] text-[#debfc2] hover:text-[#e9c349] border border-white/5 transition-colors cursor-pointer"
                      title="تمرير لليسار"
                    >
                      <span class="material-symbols-outlined text-[16px]">chevron_left</span>
                    </button>
                  </div>
                </div>
              </div>

              <!-- Horizontal Scrollable Container with exact width: 80px, height: 120px -->
              <div
                id="heritage-tales-carousel"
                class="flex items-start gap-4 overflow-x-auto scrollbar-none py-2 px-1 scroll-smooth focus:outline-none"
              >
                @for (book of getDisplayList(talesVault); track book.id) {
                  <button
                    type="button"
                    (click)="openHeritageModal(book)"
                    class="w-[80px] min-w-[80px] shrink-0 group flex flex-col gap-1.5 cursor-pointer select-none text-center border-0 bg-transparent p-0"
                  >
                    <div class="w-[80px] h-[120px] rounded-lg overflow-hidden bg-[#201f22] border border-white/10 shadow-md group-hover:shadow-[0_8px_20px_rgba(233,195,73,0.25)] group-hover:border-[#e9c349]/60 transition-all duration-300 group-hover:-translate-y-1 relative">
                      <img
                        class="w-full h-full object-cover"
                        [src]="book.coverImage"
                        [alt]="book.title"
                        referrerpolicy="no-referrer"
                      />
                      <div class="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    </div>
                    <h3 class="text-[11px] font-semibold text-[#e5e1e4] group-hover:text-[#e9c349] transition-colors text-center line-clamp-2 leading-tight mt-1 w-[80px]">
                      {{ book.title }}
                    </h3>
                  </button>
                }
              </div>
            </section>
          }

          <!-- Shelf C: أصول اللغة وعلوم البيان والمعاجم -->
          @if (selectedCategory() === 'all' || hasMatchingInList(languageVault)) {
            <section class="w-full">
              <div class="flex items-center justify-between pb-3 mb-4">
                <div class="flex items-center gap-3">
                  <div class="w-1.5 h-6 bg-[#97f5cc] rounded-full"></div>
                  <div>
                    <h2 class="font-noto-serif text-lg sm:text-xl font-bold text-[#e5e1e4]">
                      خزانة «أصول اللغة وعلوم البيان والمعاجم»
                    </h2>
                    <p class="text-xs text-[#a58a8d] mt-0.5">
                      أركان اللسان العربي، أسرار النظم والبلاغة، وموسوعات الضاد التي حفظت فصاحة الحرف
                    </p>
                  </div>
                </div>

                <div class="flex items-center gap-2">
                  <button
                    type="button"
                    (click)="setCategory('اللغة والمعاجم')"
                    class="text-xs text-[#7bd8b1] hover:text-[#97f5cc] transition-colors hidden sm:flex items-center gap-1 cursor-pointer bg-transparent border-0 p-0 font-medium"
                  >
                    <span>عرض الخزانة كاملة</span>
                    <span class="material-symbols-outlined text-[16px]">arrow_back</span>
                  </button>
                  <div class="flex items-center gap-1.5 mr-2">
                    <button
                      type="button"
                      (click)="scrollHorizontal('heritage-language-carousel', -160)"
                      class="p-1 rounded-lg bg-[#1c1b1d] hover:bg-[#2a2a2c] text-[#debfc2] hover:text-[#7bd8b1] border border-white/5 transition-colors cursor-pointer"
                      title="تمرير لليمين"
                    >
                      <span class="material-symbols-outlined text-[16px]">chevron_right</span>
                    </button>
                    <button
                      type="button"
                      (click)="scrollHorizontal('heritage-language-carousel', 160)"
                      class="p-1 rounded-lg bg-[#1c1b1d] hover:bg-[#2a2a2c] text-[#debfc2] hover:text-[#7bd8b1] border border-white/5 transition-colors cursor-pointer"
                      title="تمرير لليسار"
                    >
                      <span class="material-symbols-outlined text-[16px]">chevron_left</span>
                    </button>
                  </div>
                </div>
              </div>

              <!-- Horizontal Scrollable Container with exact width: 80px, height: 120px -->
              <div
                id="heritage-language-carousel"
                class="flex items-start gap-4 overflow-x-auto scrollbar-none py-2 px-1 scroll-smooth focus:outline-none"
              >
                @for (book of getDisplayList(languageVault); track book.id) {
                  <button
                    type="button"
                    (click)="openHeritageModal(book)"
                    class="w-[80px] min-w-[80px] shrink-0 group flex flex-col gap-1.5 cursor-pointer select-none text-center border-0 bg-transparent p-0"
                  >
                    <div class="w-[80px] h-[120px] rounded-lg overflow-hidden bg-[#201f22] border border-white/10 shadow-md group-hover:shadow-[0_8px_20px_rgba(123,216,177,0.25)] group-hover:border-[#7bd8b1]/60 transition-all duration-300 group-hover:-translate-y-1 relative">
                      <img
                        class="w-full h-full object-cover"
                        [src]="book.coverImage"
                        [alt]="book.title"
                        referrerpolicy="no-referrer"
                      />
                      <div class="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    </div>
                    <h3 class="text-[11px] font-semibold text-[#e5e1e4] group-hover:text-[#7bd8b1] transition-colors text-center line-clamp-2 leading-tight mt-1 w-[80px]">
                      {{ book.title }}
                    </h3>
                  </button>
                }
              </div>
            </section>
          }

        </div>

        <!-- ======================================================== -->
        <!-- SECTION 4: عصور التدوين وسجلات المخطوطات -->
        <!-- ======================================================== -->
        <section class="w-full px-4 sm:px-6 md:px-12 py-10 bg-[#0e0e10]/60 border-t border-white/[0.04]">
          <div class="max-w-7xl mx-auto">
            <div class="text-center max-w-2xl mx-auto mb-8">
              <span class="text-[11px] text-[#e9c349] uppercase tracking-wider block font-medium mb-1">
                التسلسل الزمني لتدوين الكلمة
              </span>
              <h2 class="font-noto-serif text-2xl sm:text-3xl font-bold text-[#e5e1e4]">
                عصور التدوين وسجلات المخطوطات
              </h2>
              <p class="text-xs sm:text-sm text-[#a58a8d] mt-2 leading-relaxed">
                رحلة الحرف العربي من الرواية الشفاهية وورق البردي حتى أزهى خزائن المدونات الموسوعية
              </p>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
              @for (era of eras; track era.number) {
                <div class="bg-[#1c1b1d] p-6 rounded-xl shadow-lg relative overflow-hidden group hover:bg-[#201f22] border border-white/[0.06] hover:border-[#7bd8b1]/30 transition-all">
                  <div class="flex items-center justify-between mb-4">
                    <span class="font-noto-serif text-3xl font-bold text-[#7bd8b1]/20 group-hover:text-[#7bd8b1]/40 transition-colors">
                      {{ era.number }}
                    </span>
                    <span class="text-[11px] px-2.5 py-1 rounded-md bg-[#2a2a2c] text-[#97f5cc] font-medium border border-white/5">
                      {{ era.century }}
                    </span>
                  </div>
                  <h3 class="font-noto-serif text-lg font-bold text-[#e5e1e4] mb-2">
                    {{ era.title }}
                  </h3>
                  <p class="text-xs sm:text-sm text-[#debfc2] leading-relaxed mb-4">
                    {{ era.desc }}
                  </p>
                  <div class="space-y-1.5 pt-3 border-t border-white/[0.04] text-xs text-[#a58a8d]">
                    <div class="flex items-center gap-1.5">
                      <span class="w-1.5 h-1.5 rounded-full bg-[#e9c349]"></span>
                      <span>{{ era.scholars }}</span>
                    </div>
                    <div class="flex items-center gap-1.5">
                      <span class="w-1.5 h-1.5 rounded-full bg-[#7bd8b1]"></span>
                      <span>{{ era.centers }}</span>
                    </div>
                  </div>
                </div>
              }
            </div>
          </div>
        </section>

        <!-- ======================================================== -->
        <!-- SECTION 5 & 6 (SPLIT BENTO): ORACLE + MOST STUDIED -->
        <!-- ======================================================== -->
        <section class="w-full px-4 sm:px-6 md:px-12 py-10">
          <div class="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            <!-- Interactive Manuscript Oracle Discovery (7 Cols in RTL) -->
            <div class="lg:col-span-7 bg-[#1c1b1d] rounded-2xl p-6 sm:p-8 shadow-xl flex flex-col justify-between border border-white/[0.06]">
              <div>
                <div class="flex items-center justify-between mb-4 flex-wrap gap-2">
                  <div class="flex items-center gap-2 text-[#7bd8b1]">
                    <span class="material-symbols-outlined text-[20px]">magic_button</span>
                    <span class="font-noto-serif text-sm sm:text-base font-bold text-[#e5e1e4]">
                      استحضار مخطوطة نادرة من خزائن الرواق
                    </span>
                  </div>
                  <span class="text-[11px] px-2.5 py-0.5 rounded-md bg-[#2a2a2c] text-[#e9c349] font-medium border border-[#e9c349]/20">
                    خزينة النفائس
                  </span>
                </div>

                <!-- Dynamic Manuscript Card Body -->
                <div
                  class="bg-[#201f22] p-5 sm:p-6 rounded-xl mb-4 border border-white/[0.06] transition-all duration-300"
                  [class.opacity-50]="isOracleTransitioning()"
                  [class.translate-y-1]="isOracleTransitioning()"
                >
                  <div class="flex items-start gap-4">
                    <div class="w-20 sm:w-24 shrink-0 aspect-[1/1.5] rounded-lg overflow-hidden shadow-md border border-white/10 bg-[#0e0e10]">
                      <img
                        class="w-full h-full object-cover"
                        [src]="currentOracle().coverImage"
                        [alt]="currentOracle().title"
                        referrerpolicy="no-referrer"
                      />
                    </div>
                    <div class="flex-1 space-y-1.5">
                      <span class="text-[11px] text-[#e9c349] block font-medium">
                        {{ currentOracle().tag }}
                      </span>
                      <h4 class="font-noto-serif text-base sm:text-lg font-bold text-[#e5e1e4]">
                        {{ currentOracle().title }}
                      </h4>
                      <p class="text-xs sm:text-sm text-[#debfc2] line-clamp-3 leading-relaxed">
                        {{ currentOracle().desc }}
                      </p>
                      <div class="flex items-center gap-3 pt-2 text-[#a58a8d] text-xs">
                        <span>{{ currentOracle().pages }}</span>
                        <span>•</span>
                        <span>{{ currentOracle().script }}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Interaction Trigger Button Row -->
              <div class="flex flex-wrap items-center justify-between gap-3 pt-1">
                <button
                  type="button"
                  (click)="cycleOracle()"
                  class="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#af8d11] hover:bg-[#e9c349] text-[#241a00] font-bold text-xs sm:text-sm shadow-md transition-all cursor-pointer"
                >
                  <span
                    class="material-symbols-outlined text-[18px] transition-transform duration-500"
                    [class.rotate-180]="isOracleTransitioning()"
                  >
                    cached
                  </span>
                  <span>استحضار نفيسة تراثية أخرى</span>
                </button>
                <button
                  type="button"
                  (click)="openOracleDetails(currentOracle())"
                  class="text-xs text-[#7bd8b1] hover:text-[#97f5cc] flex items-center gap-1 cursor-pointer bg-transparent border-0 p-0 font-medium"
                >
                  <span>فحص السجل التوثيقي الكامل</span>
                  <span class="material-symbols-outlined text-[16px]">north_west</span>
                </button>
              </div>
            </div>

            <!-- Most Studied Manuscripts (5 Cols in RTL) -->
            <div class="lg:col-span-5 bg-[#1c1b1d] rounded-2xl p-6 sm:p-8 shadow-xl flex flex-col justify-between border border-white/[0.06]">
              <div>
                <div class="flex items-center justify-between mb-4">
                  <div>
                    <span class="text-[11px] text-[#e9c349] block font-medium mb-1">الأثر البحثي والتحقيقي</span>
                    <h3 class="font-noto-serif text-lg font-bold text-[#e5e1e4]">
                      المخطوطات الأكثر مدارسةً واستقراءً
                    </h3>
                  </div>
                  <span class="material-symbols-outlined text-[#7bd8b1] text-[22px]">history_edu</span>
                </div>

                <!-- Numbered list (١ to ٥) -->
                <div class="space-y-2">
                  @for (item of studiedManuscripts; track item.id; let idx = $index) {
                    <button
                      type="button"
                      (click)="openManuscriptById(item.id)"
                      class="w-full text-right flex items-center gap-3.5 p-2.5 rounded-xl hover:bg-[#201f22] border border-transparent hover:border-white/5 transition-colors group cursor-pointer bg-transparent"
                    >
                      <span
                        class="font-noto-serif text-2xl font-bold shrink-0 w-8 text-center"
                        [class.text-[#e9c349]]="idx === 0"
                        [class.text-[#e9c349]/80]="idx === 1"
                        [class.text-[#e9c349]/60]="idx === 2"
                        [class.text-[#e9c349]/40]="idx === 3"
                        [class.text-[#e9c349]/30]="idx === 4"
                      >
                        {{ item.rank }}
                      </span>
                      <div class="flex-1 min-w-0">
                        <h4 class="font-noto-serif text-xs sm:text-sm font-semibold text-[#e5e1e4] truncate group-hover:text-[#7bd8b1] transition-colors">
                          {{ item.title }}
                        </h4>
                        <span class="text-[11px] text-[#a58a8d] truncate block">
                          {{ item.desc }}
                        </span>
                      </div>
                      <span class="text-[11px] text-[#97f5cc] font-mono shrink-0">
                        {{ item.readersCount }}
                      </span>
                    </button>
                  }
                </div>
              </div>

              <div class="pt-4 text-center border-t border-white/[0.04] mt-3">
                <span class="text-[11px] text-[#a58a8d]">
                  يتم تحديث سجل المدارسة دورياً استناداً إلى جلسات قراءة الباحثين
                </span>
              </div>
            </div>

          </div>
        </section>

        <!-- ======================================================== -->
        <!-- FINAL SANCTUARY SEAL / CALLIGRAPHIC INSCRIPTION -->
        <!-- ======================================================== -->
        <div class="w-full px-4 sm:px-6 md:px-12 py-12 flex flex-col items-center justify-center text-center">
          <div class="w-16 h-px bg-[#7bd8b1]/30 mb-4"></div>
          <p class="font-noto-serif text-lg sm:text-xl text-[#7bd8b1] max-w-2xl leading-relaxed font-bold">
            «إن من البيان لسحراً، وإن في طيات المخطوطات أرواحاً تأبى الفناء»
          </p>
          <span class="text-xs text-[#a58a8d] mt-2 max-w-lg leading-relaxed block">
            ملاذ حر مكرس لحفظ الهيبة السردية والعمق الفكري لتراث المخطوطات والآداب الإنسانية عبر العصور.
          </span>
          <div class="w-16 h-px bg-[#7bd8b1]/30 mt-4"></div>
        </div>

      </div>

      <!-- ======================================================== -->
      <!-- MODAL: Heritage Manuscript Inspection & Reader Preview -->
      <!-- ======================================================== -->
      @if (activeModalBook()) {
        <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div class="relative w-full max-w-2xl bg-[#1c1b1d] border border-white/10 rounded-2xl p-6 sm:p-8 shadow-2xl overflow-y-auto max-h-[90vh]">
            <button
              type="button"
              (click)="closeModal()"
              class="absolute top-4 left-4 p-2 rounded-full bg-[#2a2a2c] text-[#debfc2] hover:text-white hover:bg-[#353437] transition-colors cursor-pointer"
              title="إغلاق"
            >
              <span class="material-symbols-outlined text-[20px]">close</span>
            </button>

            <div class="grid grid-cols-1 sm:grid-cols-12 gap-6 items-start">
              <div class="sm:col-span-4 flex justify-center">
                <div class="w-32 aspect-[1/1.55] rounded-xl overflow-hidden bg-[#0e0e10] border border-[#7bd8b1]/30 shadow-xl relative">
                  <img
                    [src]="activeModalBook()!.coverImage"
                    [alt]="activeModalBook()!.title"
                    class="w-full h-full object-cover"
                    referrerpolicy="no-referrer"
                  />
                  <div class="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                </div>
              </div>

              <div class="sm:col-span-8 flex flex-col gap-3">
                <div class="flex items-center gap-2 flex-wrap">
                  <span class="text-[11px] px-2.5 py-0.5 rounded-full bg-[#005039] text-[#97f5cc] font-medium border border-[#7bd8b1]/30">
                    {{ activeModalBook()!.category }}
                  </span>
                  @if (activeModalBook()!.source) {
                    <span class="text-[11px] text-[#a58a8d]">{{ activeModalBook()!.source }}</span>
                  }
                </div>

                <h3 class="font-noto-serif text-2xl font-bold text-[#e5e1e4]">
                  {{ activeModalBook()!.title }}
                </h3>
                <span class="text-xs text-[#debfc2] font-medium">
                  المصنف / المؤلف: {{ activeModalBook()!.author }}
                </span>

                @if (activeModalBook()!.quote) {
                  <div class="p-3 rounded-lg bg-[#201f22] border-r-2 border-[#7bd8b1] my-1">
                    <p class="font-noto-serif text-xs sm:text-sm text-[#ffe088] italic">
                      {{ activeModalBook()!.quote }}
                    </p>
                  </div>
                }

                <p class="text-xs sm:text-sm text-[#debfc2] leading-relaxed">
                  {{ activeModalBook()!.description }}
                </p>

                <div class="pt-4 flex items-center gap-3">
                  <button
                    type="button"
                    (click)="openHeritageReader(activeModalBook()!)"
                    class="px-5 py-2 bg-[#005039] hover:bg-[#003827] text-[#97f5cc] font-bold text-xs sm:text-sm rounded-xl transition-all shadow-md flex items-center gap-2 border border-[#7bd8b1]/40 cursor-pointer"
                  >
                    <span class="material-symbols-outlined text-[18px]">import_contacts</span>
                    <span>قراءة المخطوط كاملاً</span>
                  </button>
                  <button
                    type="button"
                    (click)="closeModal()"
                    class="px-4 py-2 bg-[#2a2a2c] hover:bg-[#353437] text-[#debfc2] text-xs sm:text-sm rounded-xl transition-colors cursor-pointer"
                  >
                    إغلاق
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      }

      <!-- MODAL: Oracle Details Preview -->
      @if (activeModalOracle()) {
        <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div class="relative w-full max-w-xl bg-[#1c1b1d] border border-white/10 rounded-2xl p-6 sm:p-8 shadow-2xl">
            <button
              type="button"
              (click)="activeModalOracle.set(null)"
              class="absolute top-4 left-4 p-2 rounded-full bg-[#2a2a2c] text-[#debfc2] hover:text-white transition-colors cursor-pointer"
            >
              <span class="material-symbols-outlined text-[20px]">close</span>
            </button>

            <div class="flex flex-col gap-4">
              <span class="text-xs text-[#e9c349] font-medium">
                {{ activeModalOracle()!.tag }}
              </span>
              <h3 class="font-noto-serif text-xl font-bold text-[#e5e1e4]">
                {{ activeModalOracle()!.title }}
              </h3>
              <p class="text-xs sm:text-sm text-[#debfc2] leading-relaxed">
                {{ activeModalOracle()!.desc }}
              </p>
              <div class="p-3 rounded-lg bg-[#201f22] border border-white/5 text-xs text-[#97f5cc] flex items-center justify-between">
                <span>{{ activeModalOracle()!.pages }}</span>
                <span>{{ activeModalOracle()!.script }}</span>
              </div>
              <div class="pt-2 flex justify-end">
                <button
                  type="button"
                  (click)="activeModalOracle.set(null)"
                  class="px-5 py-2 bg-[#005039] text-[#97f5cc] font-semibold text-xs rounded-xl cursor-pointer hover:bg-[#003827] border border-[#7bd8b1]/30"
                >
                  حسناً
                </button>
              </div>
            </div>
          </div>
        </div>
      }

    </div>
  `,
})
export class RiwaqHeritage {
  readonly novelStore = inject(NovelStore);
  private readonly router = inject(Router);

  // Data references
  readonly spotlight = SPOTLIGHT_HERITAGE;
  readonly majorSelections = MAJOR_HERITAGE_SELECTIONS;
  readonly poetryVault = HERITAGE_POETRY_VAULT;
  readonly talesVault = HERITAGE_TALES_VAULT;
  readonly languageVault = HERITAGE_LANGUAGE_VAULT;
  readonly allBooks = ALL_HERITAGE_BOOKS;
  readonly eras = HERITAGE_ERAS;
  readonly oracles = HERITAGE_ORACLES;
  readonly studiedManuscripts = MOST_STUDIED_MANUSCRIPTS;
  readonly categoryFilters = HERITAGE_CATEGORY_FILTERS;

  // Active category filter state
  readonly selectedCategory = signal<string>('all');

  // Oracle cycle state
  readonly currentOracleIndex = signal<number>(0);
  readonly isOracleTransitioning = signal<boolean>(false);
  readonly currentOracle = computed<HeritageOracleItem>(() => {
    return this.oracles[this.currentOracleIndex() % this.oracles.length];
  });

  // Modal State
  readonly activeModalBook = signal<RiwaqHeritageItem | null>(null);
  readonly activeModalOracle = signal<HeritageOracleItem | null>(null);

  // Filtered Items
  readonly filteredItems = computed(() => {
    const cat = this.selectedCategory();
    if (cat === 'all') return this.allBooks;
    return this.allBooks.filter(b => b.category === cat);
  });

  setCategory(catId: string): void {
    this.selectedCategory.set(catId);
  }

  getCategoryCount(catId: string): number {
    return this.allBooks.filter(b => b.category === catId).length;
  }

  hasMatchingInList(list: RiwaqHeritageItem[]): boolean {
    const cat = this.selectedCategory();
    if (cat === 'all') return true;
    return list.some(b => b.category === cat);
  }

  getDisplayList(list: RiwaqHeritageItem[]): RiwaqHeritageItem[] {
    const cat = this.selectedCategory();
    if (cat === 'all') return list;
    return list.filter(b => b.category === cat);
  }

  cycleOracle(): void {
    if (this.isOracleTransitioning()) return;
    this.isOracleTransitioning.set(true);

    setTimeout(() => {
      this.currentOracleIndex.update(idx => (idx + 1) % this.oracles.length);
      this.isOracleTransitioning.set(false);
    }, 200);
  }

  openHeritageModal(book: RiwaqHeritageItem): void {
    this.activeModalBook.set(book);
  }

  closeModal(): void {
    this.activeModalBook.set(null);
  }

  openManuscriptById(id: string): void {
    const found = this.allBooks.find(b => b.id === id);
    if (found) {
      this.openHeritageModal(found);
    }
  }

  openOracleDetails(oracle: HeritageOracleItem): void {
    this.activeModalOracle.set(oracle);
  }

  openHeritageReader(book: RiwaqHeritageItem): void {
    this.closeModal();

    // Look for matching sample novel in store
    const storeNovels = this.novelStore.novels();
    let matching = storeNovels.find(
      n => n.id === book.id || n.title.includes(book.title) || book.title.includes(n.title)
    );

    if (!matching) {
      matching = storeNovels.find(n => n.riwaqId === 'riwaq-al-turath') || storeNovels[0];
    }

    if (matching) {
      this.novelStore.selectNovel(matching.id);
      this.router.navigate(['/reader', matching.id]);
    } else {
      this.router.navigate(['/reader']);
    }
  }

  scrollHorizontal(elementId: string, delta: number): void {
    const el = document.getElementById(elementId);
    if (el) {
      el.scrollBy({ left: delta, behavior: 'smooth' });
    }
  }
}
