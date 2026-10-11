import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
} from '@angular/core';
import { Router } from '@angular/router';
import {
  ALL_WISDOM_BOOKS,
  EASTERN_WISDOM_SCHOOLS,
  ISLAMIC_ILLUMINATION_PHILOSOPHY,
  MAJOR_WISDOM_SELECTIONS,
  PHILOSOPHICAL_ISSUES,
  PhilosophicalIssue,
  RiwaqWisdomItem,
  SPOTLIGHT_WISDOM,
  THOUGHT_CURRENTS,
  TOP_CONTEMPLATED_TREATISES,
  WESTERN_ENLIGHTENMENT_CLASSICS,
  WISDOM_CATEGORY_FILTERS,
} from '../core/riwaq-wisdom-data';
import { NovelStore } from '../core/novel-store';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-riwaq-wisdom',
  template: `
    <div class="relative w-full min-h-screen bg-[#131315] text-[#e5e1e4] font-sans antialiased selection:bg-[#e9c349]/20 selection:text-[#ffe088]" dir="rtl">
      
      <!-- Subtle Architectural Atmospheric Backdrop -->
      <div class="relative w-full overflow-hidden">
        <div class="absolute top-0 right-1/4 w-[700px] h-[500px] bg-[#e9c349]/5 rounded-full blur-[140px] pointer-events-none"></div>
        <div class="absolute top-96 left-10 w-[500px] h-[400px] bg-[#ffe088]/5 rounded-full blur-[160px] pointer-events-none"></div>

        <!-- ======================================================== -->
        <!-- 1. HERO EDITORIAL FEATURE: مبحث الحكمة المستنيرة -->
        <!-- ======================================================== -->
        <section class="w-full px-4 sm:px-6 lg:px-12 pt-6 pb-10">
          <div class="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            
            <!-- Hero Text & Philosophical Manifest (Right Col in RTL) -->
            <div class="lg:col-span-7 flex flex-col items-start gap-4 order-2 lg:order-1">
              <div class="flex items-center gap-2 flex-wrap">
                <span class="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-[#2a2a2c] text-[#e9c349] tracking-widest uppercase border border-[#e9c349]/20">
                  {{ spotlight.badge }}
                </span>
                <span class="text-[11px] text-[#debfc2] flex items-center gap-1.5 font-medium">
                  <span class="w-1.5 h-1.5 rounded-full bg-[#e9c349] inline-block shadow-[0_0_6px_rgba(233,195,73,0.8)]"></span>
                  <span>نظرية المعرفة والوجود</span>
                </span>
                <span class="text-[11px] text-[#debfc2]/80 font-medium">· ٤ مجلدات محققة</span>
              </div>

              <h1 class="font-noto-serif text-3xl sm:text-4xl lg:text-5xl font-bold text-[#e5e1e4] tracking-tight leading-tight">
                {{ spotlight.title }}
              </h1>

              <!-- Quote Card with Large Quote Watermark -->
              <div class="p-4 sm:p-5 rounded-xl bg-[#1c1b1d]/70 border border-white/[0.06] shadow-sm relative overflow-hidden w-full">
                <div class="absolute -right-4 -bottom-4 text-[#353437]/30 select-none pointer-events-none">
                  <span class="material-symbols-outlined text-[80px]">format_quote</span>
                </div>
                <p class="font-noto-serif text-lg sm:text-xl text-[#ffe088] leading-relaxed relative z-10">
                  {{ spotlight.quote }}
                </p>
                <span class="block mt-2 text-xs sm:text-sm text-[#debfc2]">
                  — رينيه ديكارت · مع هوامش ابن طفيل وتأملات الشرق
                </span>
              </div>

              <p class="text-sm sm:text-base text-[#debfc2] max-w-2xl leading-relaxed">
                {{ spotlight.description }}
              </p>

              <!-- Hero Action Buttons -->
              <div class="flex items-center flex-wrap gap-3 pt-2">
                <button
                  type="button"
                  (click)="openTreatiseReader(spotlight)"
                  class="px-6 py-2.5 bg-[#e9c349] text-[#3c2f00] font-bold text-xs sm:text-sm rounded-xl shadow-md hover:bg-[#ffe088] transition-all flex items-center gap-2 group cursor-pointer"
                >
                  <span class="material-symbols-outlined text-[18px] group-hover:scale-110 transition-transform">auto_stories</span>
                  <span>بدء القراءة والتأمل</span>
                </button>
                <button
                  type="button"
                  (click)="openTreatiseModal(spotlight)"
                  class="px-5 py-2.5 bg-[#2a2a2c] text-[#e5e1e4] text-xs sm:text-sm font-medium rounded-xl hover:bg-[#353437] border border-white/[0.06] transition-colors flex items-center gap-2 cursor-pointer"
                >
                  <span class="material-symbols-outlined text-[18px] text-[#e9c349]">menu_book</span>
                  <span>بيان المبحث وفهرس المسائل</span>
                </button>
              </div>
            </div>

            <!-- Hero Philosophical Book Showcase (Left Col in RTL) -->
            <div class="lg:col-span-5 flex justify-center lg:justify-end order-1 lg:order-2">
              <button
                type="button"
                (click)="openTreatiseModal(spotlight)"
                class="relative group cursor-pointer border-0 bg-transparent p-0 text-right"
                aria-label="عرض تفاصيل تأملات الفلسفة الأولى"
              >
                <div class="absolute inset-0 bg-[#e9c349]/15 rounded-xl blur-2xl group-hover:bg-[#e9c349]/25 transition-all duration-500"></div>
                <div class="relative w-64 sm:w-72 md:w-80 aspect-[1/1.55] rounded-xl overflow-hidden bg-[#0e0e10] border border-white/10 shadow-2xl transition-transform duration-500 group-hover:-translate-y-2">
                  <img
                    class="w-full h-full object-cover"
                    [src]="spotlight.coverImage"
                    alt="تأملات في الفلسفة الأولى"
                    referrerpolicy="no-referrer"
                  />
                  <div class="absolute inset-0 bg-gradient-to-t from-[#131315]/90 via-transparent to-[#131315]/20 pointer-events-none"></div>
                  <div class="absolute bottom-4 inset-x-4 flex flex-col gap-1 text-center">
                    <span class="text-[11px] text-[#ffe088] tracking-widest uppercase font-medium">خزانة المخطوطات المحققة</span>
                    <span class="font-noto-serif text-lg font-bold text-[#e5e1e4]">تأملات الفلسفة الأولى</span>
                  </div>
                </div>
              </button>
            </div>

          </div>

          <!-- Quick Filter Chips: تصنيف المباحث -->
          <div id="filters-anchor" class="max-w-7xl mx-auto mt-10 pt-6 border-t border-white/[0.06]">
            <div class="flex items-center gap-2 overflow-x-auto scrollbar-none pb-2">
              <span class="text-xs sm:text-sm text-[#debfc2] shrink-0 ml-2 flex items-center gap-1.5 font-medium">
                <span class="material-symbols-outlined text-[16px] text-[#e9c349]">explore</span>
                <span>فهارس الحكمة:</span>
              </span>
              @for (cat of categoryFilters; track cat.id) {
                <button
                  type="button"
                  (click)="setCategory(cat.id)"
                  class="px-3.5 py-1.5 rounded-full text-xs font-medium shrink-0 transition-all cursor-pointer flex items-center gap-1"
                  [class]="selectedCategory() === cat.id
                    ? 'bg-[#e9c349] text-[#3c2f00] font-bold shadow-[0_0_12px_rgba(233,195,73,0.25)]'
                    : 'bg-[#1c1b1d] text-[#debfc2] hover:text-[#e5e1e4] hover:bg-[#201f22] border border-white/[0.06]'"
                >
                  @if (selectedCategory() === cat.id) {
                    <span class="w-1.5 h-1.5 rounded-full bg-[#3c2f00]"></span>
                  }
                  <span>{{ cat.label }}</span>
                  @if (cat.id !== 'all') {
                    <span class="text-[10px] opacity-75">({{ getCategoryCount(cat.id) }})</span>
                  }
                </button>
              }
            </div>
          </div>
        </section>

        <!-- Filter Status Banner (when non-all is chosen) -->
        @if (selectedCategory() !== 'all') {
          <section class="w-full px-4 sm:px-6 lg:px-12 py-3 max-w-7xl mx-auto">
            <div class="p-3 rounded-xl bg-[#201f22] border border-[#e9c349]/30 flex items-center justify-between gap-4">
              <div class="flex items-center gap-2 text-xs sm:text-sm">
                <span class="material-symbols-outlined text-[#e9c349] text-[20px]">filter_alt</span>
                <span>المعروض الآن مباحث تصنيف: <strong class="text-[#ffe088]">«{{ selectedCategory() }}»</strong> ({{ filteredTreatises().length }} مخطوط ومبحث)</span>
              </div>
              <button
                type="button"
                (click)="setCategory('all')"
                class="px-3 py-1 rounded-lg bg-[#2a2a2c] hover:bg-[#353437] text-xs text-[#debfc2] hover:text-white transition-colors cursor-pointer flex items-center gap-1"
              >
                <span>عرض كافة الأقسام</span>
                <span class="material-symbols-outlined text-[14px]">close</span>
              </button>
            </div>
          </section>
        }

        <!-- ======================================================== -->
        <!-- 2. SECTION 1: مختارات الحكمة الكبرى (الأصول الخالدة) -->
        <!-- ======================================================== -->
        @if (selectedCategory() === 'all' || hasMatchingInList(majorSelections)) {
          <section class="w-full px-4 sm:px-6 lg:px-12 py-8 bg-[#0e0e10]/50 border-y border-white/[0.04]">
            <div class="max-w-7xl mx-auto">
              
              <!-- Section Header Row -->
              <div class="flex items-end justify-between mb-5">
                <div>
                  <span class="text-[11px] text-[#e9c349] tracking-widest uppercase block mb-1 font-medium">الأصول الخالدة</span>
                  <h2 class="font-noto-serif text-xl sm:text-2xl font-bold text-[#e5e1e4]">مختارات الحكمة الكبرى</h2>
                </div>
                <div class="flex items-center gap-3">
                  <button
                    type="button"
                    (click)="setCategory('all')"
                    class="text-xs text-[#e9c349] hover:text-[#ffe088] transition-colors flex items-center gap-1 cursor-pointer font-medium bg-transparent border-0 p-0"
                  >
                    <span>تصفح خزانة الكلاسيكيات</span>
                    <span class="material-symbols-outlined text-[16px]">arrow_back</span>
                  </button>
                  <div class="flex items-center gap-1.5 mr-2">
                    <button
                      type="button"
                      (click)="scrollHorizontal('major-carousel', -160)"
                      class="p-1 rounded-lg bg-[#1c1b1d] hover:bg-[#2a2a2c] text-[#debfc2] hover:text-[#e9c349] border border-white/5 transition-colors cursor-pointer"
                      title="تمرير لليمين"
                    >
                      <span class="material-symbols-outlined text-[16px]">chevron_right</span>
                    </button>
                    <button
                      type="button"
                      (click)="scrollHorizontal('major-carousel', 160)"
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
                id="major-carousel"
                class="flex items-start gap-4 overflow-x-auto scrollbar-none py-2 px-1 scroll-smooth focus:outline-none"
              >
                @for (book of getDisplayList(majorSelections); track book.id) {
                  <button
                    type="button"
                    (click)="openTreatiseModal(book)"
                    class="w-[80px] min-w-[80px] shrink-0 group flex flex-col gap-1.5 cursor-pointer select-none text-center border-0 bg-transparent p-0"
                  >
                    <div class="w-[80px] h-[120px] rounded-lg overflow-hidden bg-[#201f22] border border-white/10 shadow-md group-hover:shadow-[0_8px_20px_rgba(233,195,73,0.3)] group-hover:border-[#e9c349]/70 transition-all duration-300 group-hover:-translate-y-1 relative">
                      <img
                        class="w-full h-full object-cover"
                        [src]="book.coverImage"
                        [alt]="book.title"
                        referrerpolicy="no-referrer"
                      />
                      <div class="absolute inset-0 bg-[#e9c349]/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    </div>
                    <h3 class="text-[11px] font-semibold text-[#e5e1e4] group-hover:text-[#e9c349] transition-colors text-center line-clamp-2 leading-tight mt-1 w-[80px]">
                      {{ book.title }}
                    </h3>
                  </button>
                }
              </div>
            </div>
          </section>
        }

        <!-- ======================================================== -->
        <!-- 3. SECTION 2: الفلسفة الإسلامية وحكمة الإشراق -->
        <!-- ======================================================== -->
        @if (selectedCategory() === 'all' || hasMatchingInList(islamicPhilosophy)) {
          <section class="w-full px-4 sm:px-6 lg:px-12 py-8">
            <div class="max-w-7xl mx-auto">
              
              <!-- Section Header Row -->
              <div class="mb-5 flex flex-col sm:flex-row sm:items-end justify-between gap-3">
                <div class="flex flex-col gap-1">
                  <div class="flex items-center gap-2">
                    <span class="w-2.5 h-2.5 rounded-full bg-[#e9c349] shadow-[0_0_8px_rgba(233,195,73,0.6)]"></span>
                    <span class="text-[11px] text-[#e9c349] tracking-widest uppercase font-medium">النسق المشرقي والإشراقي</span>
                  </div>
                  <h2 class="font-noto-serif text-xl sm:text-2xl font-bold text-[#e5e1e4]">الفلسفة الإسلامية وحكمة الإشراق</h2>
                  <p class="text-xs sm:text-sm text-[#debfc2] max-w-3xl">
                    من مناظرات الكندي والفارابي إلى إشراقات السهروردي وحكمة الشيرازي المتعالية في وحدة الوجود والعقل الفعّال.
                  </p>
                </div>

                <div class="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    (click)="scrollHorizontal('islamic-carousel', -160)"
                    class="p-1 rounded-lg bg-[#1c1b1d] hover:bg-[#2a2a2c] text-[#debfc2] hover:text-[#e9c349] border border-white/5 transition-colors cursor-pointer"
                    title="تمرير لليمين"
                  >
                    <span class="material-symbols-outlined text-[16px]">chevron_right</span>
                  </button>
                  <button
                    type="button"
                    (click)="scrollHorizontal('islamic-carousel', 160)"
                    class="p-1 rounded-lg bg-[#1c1b1d] hover:bg-[#2a2a2c] text-[#debfc2] hover:text-[#e9c349] border border-white/5 transition-colors cursor-pointer"
                    title="تمرير لليسار"
                  >
                    <span class="material-symbols-outlined text-[16px]">chevron_left</span>
                  </button>
                </div>
              </div>

              <!-- Horizontal Scrollable Container with exact width: 80px, height: 120px -->
              <div
                id="islamic-carousel"
                class="flex items-start gap-4 overflow-x-auto scrollbar-none py-2 px-1 scroll-smooth focus:outline-none"
              >
                @for (book of getDisplayList(islamicPhilosophy); track book.id) {
                  <button
                    type="button"
                    (click)="openTreatiseModal(book)"
                    class="w-[80px] min-w-[80px] shrink-0 group flex flex-col gap-1.5 cursor-pointer select-none text-center border-0 bg-transparent p-0"
                  >
                    <div class="w-[80px] h-[120px] rounded-lg overflow-hidden bg-[#201f22] border border-white/10 shadow-md group-hover:shadow-[0_8px_20px_rgba(233,195,73,0.3)] group-hover:border-[#e9c349]/70 transition-all duration-300 group-hover:-translate-y-1 relative">
                      <img
                        class="w-full h-full object-cover"
                        [src]="book.coverImage"
                        [alt]="book.title"
                        referrerpolicy="no-referrer"
                      />
                      <div class="absolute inset-0 bg-[#e9c349]/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    </div>
                    <h3 class="text-[11px] font-semibold text-[#e5e1e4] group-hover:text-[#e9c349] transition-colors text-center line-clamp-2 leading-tight mt-1 w-[80px]">
                      {{ book.title }}
                    </h3>
                  </button>
                }
              </div>
            </div>
          </section>
        }

        <!-- ======================================================== -->
        <!-- 4. SECTION 3: كلاسيكيات الفكر الغربي وعصر التنوير -->
        <!-- ======================================================== -->
        @if (selectedCategory() === 'all' || hasMatchingInList(westernClassics)) {
          <section class="w-full px-4 sm:px-6 lg:px-12 py-8 bg-[#1c1b1d]/40 border-y border-white/[0.04]">
            <div class="max-w-7xl mx-auto">
              
              <!-- Section Header Row -->
              <div class="mb-5 flex flex-col sm:flex-row sm:items-end justify-between gap-3">
                <div class="flex flex-col gap-1">
                  <div class="flex items-center gap-2">
                    <span class="w-2.5 h-2.5 rounded-full bg-[#e9c349] shadow-[0_0_8px_rgba(233,195,73,0.6)]"></span>
                    <span class="text-[11px] text-[#e9c349] tracking-widest uppercase font-medium">العقلانية والنقد النسقي</span>
                  </div>
                  <h2 class="font-noto-serif text-xl sm:text-2xl font-bold text-[#e5e1e4]">كلاسيكيات الفكر الغربي وعصر التنوير</h2>
                  <p class="text-xs sm:text-sm text-[#debfc2] max-w-3xl">
                    أصول العقلانية الديكارتية، أطروحات العقد الاجتماعي، فلسفة المحايثة، ونقد الميتافيزيقا الكلاسيكية.
                  </p>
                </div>

                <div class="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    (click)="scrollHorizontal('western-carousel', -160)"
                    class="p-1 rounded-lg bg-[#1c1b1d] hover:bg-[#2a2a2c] text-[#debfc2] hover:text-[#e9c349] border border-white/5 transition-colors cursor-pointer"
                    title="تمرير لليمين"
                  >
                    <span class="material-symbols-outlined text-[16px]">chevron_right</span>
                  </button>
                  <button
                    type="button"
                    (click)="scrollHorizontal('western-carousel', 160)"
                    class="p-1 rounded-lg bg-[#1c1b1d] hover:bg-[#2a2a2c] text-[#debfc2] hover:text-[#e9c349] border border-white/5 transition-colors cursor-pointer"
                    title="تمرير لليسار"
                  >
                    <span class="material-symbols-outlined text-[16px]">chevron_left</span>
                  </button>
                </div>
              </div>

              <!-- Horizontal Scrollable Container with exact width: 80px, height: 120px -->
              <div
                id="western-carousel"
                class="flex items-start gap-4 overflow-x-auto scrollbar-none py-2 px-1 scroll-smooth focus:outline-none"
              >
                @for (book of getDisplayList(westernClassics); track book.id) {
                  <button
                    type="button"
                    (click)="openTreatiseModal(book)"
                    class="w-[80px] min-w-[80px] shrink-0 group flex flex-col gap-1.5 cursor-pointer select-none text-center border-0 bg-transparent p-0"
                  >
                    <div class="w-[80px] h-[120px] rounded-lg overflow-hidden bg-[#201f22] border border-white/10 shadow-md group-hover:shadow-[0_8px_20px_rgba(233,195,73,0.3)] group-hover:border-[#e9c349]/70 transition-all duration-300 group-hover:-translate-y-1 relative">
                      <img
                        class="w-full h-full object-cover"
                        [src]="book.coverImage"
                        [alt]="book.title"
                        referrerpolicy="no-referrer"
                      />
                      <div class="absolute inset-0 bg-[#e9c349]/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    </div>
                    <h3 class="text-[11px] font-semibold text-[#e5e1e4] group-hover:text-[#e9c349] transition-colors text-center line-clamp-2 leading-tight mt-1 w-[80px]">
                      {{ book.title }}
                    </h3>
                  </button>
                }
              </div>
            </div>
          </section>
        }

        <!-- ======================================================== -->
        <!-- 5. SECTION 4: مدارس الحكمة الشرقية والتأمل -->
        <!-- ======================================================== -->
        @if (selectedCategory() === 'all' || hasMatchingInList(easternSchools)) {
          <section class="w-full px-4 sm:px-6 lg:px-12 py-8">
            <div class="max-w-7xl mx-auto">
              
              <!-- Section Header Row -->
              <div class="mb-5 flex flex-col sm:flex-row sm:items-end justify-between gap-3">
                <div class="flex flex-col gap-1">
                  <div class="flex items-center gap-2">
                    <span class="w-2.5 h-2.5 rounded-full bg-[#e9c349] shadow-[0_0_8px_rgba(233,195,73,0.6)]"></span>
                    <span class="text-[11px] text-[#e9c349] tracking-widest uppercase font-medium">الروح والكون والسكينة</span>
                  </div>
                  <h2 class="font-noto-serif text-xl sm:text-2xl font-bold text-[#e5e1e4]">مدارس الحكمة الشرقية والتأمل</h2>
                  <p class="text-xs sm:text-sm text-[#debfc2] max-w-3xl">
                    التاو، الفيدانتا الهندية، حوارات كونفوشيوس، وتأملات طمأنينة البصيرة في التراث الإنساني العتيق.
                  </p>
                </div>

                <div class="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    (click)="scrollHorizontal('eastern-carousel', -160)"
                    class="p-1 rounded-lg bg-[#1c1b1d] hover:bg-[#2a2a2c] text-[#debfc2] hover:text-[#e9c349] border border-white/5 transition-colors cursor-pointer"
                    title="تمرير لليمين"
                  >
                    <span class="material-symbols-outlined text-[16px]">chevron_right</span>
                  </button>
                  <button
                    type="button"
                    (click)="scrollHorizontal('eastern-carousel', 160)"
                    class="p-1 rounded-lg bg-[#1c1b1d] hover:bg-[#2a2a2c] text-[#debfc2] hover:text-[#e9c349] border border-white/5 transition-colors cursor-pointer"
                    title="تمرير لليسار"
                  >
                    <span class="material-symbols-outlined text-[16px]">chevron_left</span>
                  </button>
                </div>
              </div>

              <!-- Horizontal Scrollable Container with exact width: 80px, height: 120px -->
              <div
                id="eastern-carousel"
                class="flex items-start gap-4 overflow-x-auto scrollbar-none py-2 px-1 scroll-smooth focus:outline-none"
              >
                @for (book of getDisplayList(easternSchools); track book.id) {
                  <button
                    type="button"
                    (click)="openTreatiseModal(book)"
                    class="w-[80px] min-w-[80px] shrink-0 group flex flex-col gap-1.5 cursor-pointer select-none text-center border-0 bg-transparent p-0"
                  >
                    <div class="w-[80px] h-[120px] rounded-lg overflow-hidden bg-[#201f22] border border-white/10 shadow-md group-hover:shadow-[0_8px_20px_rgba(233,195,73,0.3)] group-hover:border-[#e9c349]/70 transition-all duration-300 group-hover:-translate-y-1 relative">
                      <img
                        class="w-full h-full object-cover"
                        [src]="book.coverImage"
                        [alt]="book.title"
                        referrerpolicy="no-referrer"
                      />
                      <div class="absolute inset-0 bg-[#e9c349]/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    </div>
                    <h3 class="text-[11px] font-semibold text-[#e5e1e4] group-hover:text-[#e9c349] transition-colors text-center line-clamp-2 leading-tight mt-1 w-[80px]">
                      {{ book.title }}
                    </h3>
                  </button>
                }
              </div>
            </div>
          </section>
        }

        <!-- ======================================================== -->
        <!-- 6. SECTION 5: بوصلة التيارات والمدارس الفكرية -->
        <!-- ======================================================== -->
        <section class="w-full px-4 sm:px-6 lg:px-12 py-10 bg-[#0e0e10]/70 border-t border-white/[0.04]">
          <div class="max-w-7xl mx-auto">
            <div class="mb-6">
              <span class="text-[11px] text-[#e9c349] tracking-widest uppercase block mb-1 font-medium">خريطة الفكر المنهجي</span>
              <h2 class="font-noto-serif text-xl sm:text-2xl font-bold text-[#e5e1e4]">بوصلة التيارات والمدارس الفكرية</h2>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
              @for (school of thoughtCurrents; track school.id) {
                <div class="p-6 rounded-xl bg-[#1c1b1d] hover:bg-[#201f22] border border-white/[0.06] hover:border-[#e9c349]/40 transition-all flex flex-col justify-between shadow-sm group">
                  <div class="flex flex-col gap-3">
                    <div class="flex items-center justify-between">
                      <span class="text-[11px] px-2.5 py-1 rounded-full bg-[#353437] text-[#ffe088] font-medium border border-white/5">
                        {{ school.badge }}
                      </span>
                      <span class="material-symbols-outlined text-[#e9c349] group-hover:scale-110 transition-transform">
                        {{ school.icon }}
                      </span>
                    </div>
                    <h3 class="font-noto-serif text-lg font-bold text-[#e5e1e4] pt-1">
                      {{ school.title }}
                    </h3>
                    <p class="text-sm text-[#debfc2] leading-relaxed">
                      {{ school.quote }}
                    </p>
                    <div class="pt-1 flex items-center gap-1.5 flex-wrap text-xs text-[#debfc2]/80">
                      <span>{{ school.philosophers }}</span>
                    </div>
                  </div>

                  <div class="pt-5 mt-2 border-t border-white/[0.04]">
                    <button
                      type="button"
                      (click)="handleSchoolClick(school)"
                      class="text-xs sm:text-sm text-[#e9c349] hover:text-[#ffe088] flex items-center gap-1 font-medium cursor-pointer transition-colors"
                    >
                      <span>{{ school.linkText }}</span>
                      <span class="material-symbols-outlined text-[16px]">arrow_back</span>
                    </button>
                  </div>
                </div>
              }
            </div>
          </div>
        </section>

        <!-- ======================================================== -->
        <!-- 7 & 8. SECTION 6: TWO-COLUMN ASYMMETRIC SECTION -->
        <!-- (Col 7: استحضار مسألة تأملية | Col 5: الأكثر تداولاً) -->
        <!-- ======================================================== -->
        <section class="w-full px-4 sm:px-6 lg:px-12 py-10">
          <div class="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            <!-- Col 7 (Right): Interactive Intellectual Discovery: استحضار مسألة فلسفية -->
            <div class="lg:col-span-7 flex flex-col gap-4 p-6 rounded-xl bg-[#1c1b1d] border border-white/[0.06] shadow-sm">
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-2">
                  <span class="material-symbols-outlined text-[#e9c349]">flare</span>
                  <span class="font-noto-serif text-lg sm:text-xl font-bold text-[#e5e1e4]">استحضار مسألة تأملية</span>
                </div>
                <span class="text-xs text-[#debfc2]/70 font-medium">خوارزمية الرواق الفكرية</span>
              </div>
              <p class="text-xs sm:text-sm text-[#debfc2] leading-relaxed">
                محاورة مجهرية تنقلك بين نصوص الفلاسفة الكبرى لطرح إشكالية فلسفية واحدة ومسارات النظر فيها.
              </p>

              <!-- Dynamic Contemplation Card -->
              <div
                class="p-5 sm:p-6 rounded-xl bg-[#201f22] border border-white/[0.07] flex flex-col gap-3 relative overflow-hidden transition-all duration-300"
                [class.opacity-40]="isQuestionTransitioning()"
                [class.translate-y-1]="isQuestionTransitioning()"
              >
                <div class="flex items-center justify-between flex-wrap gap-2">
                  <span class="text-xs px-2.5 py-0.5 rounded-full bg-[#e9c349]/15 text-[#e9c349] font-medium border border-[#e9c349]/20">
                    {{ currentIssue().badge }}
                  </span>
                  <span class="text-xs text-[#debfc2]">
                    {{ currentIssue().origin }}
                  </span>
                </div>

                <h4 class="font-noto-serif text-base sm:text-lg font-bold text-[#ffe088] pt-1 leading-relaxed">
                  {{ currentIssue().title }}
                </h4>

                <p class="text-xs sm:text-sm text-[#e5e1e4] leading-relaxed">
                  {{ currentIssue().body }}
                </p>

                <div class="pt-3 flex items-center justify-between border-t border-[#353437]/60 mt-1 flex-wrap gap-2">
                  <span class="text-xs text-[#debfc2]/80 font-serif">
                    {{ currentIssue().ref }}
                  </span>
                  <button
                    type="button"
                    (click)="openIssueDetails(currentIssue())"
                    class="text-xs text-[#e9c349] hover:text-[#ffe088] flex items-center gap-1 font-medium cursor-pointer"
                  >
                    <span>توسيع المسألة والردود</span>
                    <span class="material-symbols-outlined text-[16px]">arrow_back</span>
                  </button>
                </div>
              </div>

              <!-- Dynamic Cycle Button -->
              <div class="flex items-center justify-between pt-1">
                <button
                  type="button"
                  (click)="cycleQuestion()"
                  class="px-5 py-2 bg-[#2a2a2c] hover:bg-[#353437] text-[#e5e1e4] text-xs sm:text-sm font-medium rounded-xl border border-white/[0.06] transition-colors flex items-center gap-2 group cursor-pointer"
                >
                  <span
                    class="material-symbols-outlined text-[18px] text-[#e9c349] transition-transform duration-500"
                    [class.rotate-180]="isQuestionTransitioning()"
                  >
                    sync
                  </span>
                  <span>استحضار مسألة تأملية أخرى</span>
                </button>
                <span class="text-xs text-[#debfc2]/70">تحديث تلقائي للمباحث النادرة</span>
              </div>
            </div>

            <!-- Col 5 (Left): Most Contemplated Treatises: المباحث الأكثر تداولاً وتأملاً -->
            <div class="lg:col-span-5 flex flex-col gap-4 p-6 rounded-xl bg-[#0e0e10] border border-white/[0.06] shadow-sm">
              <div>
                <span class="text-[11px] text-[#e9c349] tracking-widest uppercase block mb-1 font-medium">تواتر القراءة</span>
                <h2 class="font-noto-serif text-lg sm:text-xl font-bold text-[#e5e1e4]">المباحث الأكثر تداولاً وتأملاً</h2>
              </div>

              <div class="flex flex-col gap-2">
                @for (item of topTreatises; track item.id; let idx = $index) {
                  <button
                    type="button"
                    (click)="openTreatiseById(item.id)"
                    class="w-full text-right flex items-center gap-3.5 p-2.5 rounded-lg hover:bg-[#1c1b1d] border border-transparent hover:border-white/5 transition-colors group cursor-pointer bg-transparent"
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
                    <div class="flex flex-col gap-0.5 grow min-w-0">
                      <span class="text-xs sm:text-sm font-semibold text-[#e5e1e4] group-hover:text-[#e9c349] transition-colors truncate">
                        {{ item.title }}
                      </span>
                      <span class="text-[11px] text-[#debfc2]/70 truncate">
                        {{ item.authorAndTheme }}
                      </span>
                    </div>
                    <span class="material-symbols-outlined text-[#debfc2]/50 group-hover:text-[#e9c349] transition-colors text-[20px] shrink-0">
                      chevron_left
                    </span>
                  </button>
                }
              </div>
            </div>

          </div>
        </section>

        <!-- ======================================================== -->
        <!-- 9. SECTION 7: VISUAL ARCHITECTURE DIVIDER / SEAL -->
        <!-- ======================================================== -->
        <div class="w-full px-4 sm:px-6 lg:px-12 py-12 flex flex-col items-center justify-center text-center">
          <div class="w-16 h-px bg-[#e9c349]/30 mb-4"></div>
          <span class="text-[11px] text-[#e9c349] tracking-widest uppercase mb-1 font-medium">صومعة الفكر والتأمل الفلسفي</span>
          <p class="font-noto-serif text-base sm:text-lg text-[#debfc2] max-w-xl leading-relaxed">
            «كل فكرة حقيقية هي باب مشرع نحو الأبدية، وكل سؤال حر هو بداية الحكمة»
          </p>
          <div class="w-16 h-px bg-[#e9c349]/30 mt-4"></div>
        </div>

      </div>

      <!-- ======================================================== -->
      <!-- MODAL: Treatise Philosophical Inspection & Reader Preview -->
      <!-- ======================================================== -->
      @if (activeModalBook()) {
        <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div class="relative w-full max-w-2xl bg-[#1c1b1d] border border-white/10 rounded-2xl p-6 sm:p-8 shadow-2xl overflow-y-auto max-h-[90vh]">
            <!-- Close Button -->
            <button
              type="button"
              (click)="closeModal()"
              class="absolute top-4 left-4 p-2 rounded-full bg-[#2a2a2c] text-[#debfc2] hover:text-white hover:bg-[#353437] transition-colors cursor-pointer"
              title="إغلاق"
            >
              <span class="material-symbols-outlined text-[20px]">close</span>
            </button>

            <!-- Modal Content Grid -->
            <div class="grid grid-cols-1 sm:grid-cols-12 gap-6 items-start">
              <!-- Book Cover with authentic dimension -->
              <div class="sm:col-span-4 flex justify-center">
                <div class="w-32 aspect-[1/1.55] rounded-xl overflow-hidden bg-[#0e0e10] border border-[#e9c349]/30 shadow-xl relative">
                  <img
                    [src]="activeModalBook()!.coverImage"
                    [alt]="activeModalBook()!.title"
                    class="w-full h-full object-cover"
                    referrerpolicy="no-referrer"
                  />
                  <div class="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                </div>
              </div>

              <!-- Book Details -->
              <div class="sm:col-span-8 flex flex-col gap-3">
                <div class="flex items-center gap-2 flex-wrap">
                  <span class="text-[11px] px-2.5 py-0.5 rounded-full bg-[#e9c349]/15 text-[#e9c349] font-medium border border-[#e9c349]/20">
                    {{ activeModalBook()!.category }}
                  </span>
                  @if (activeModalBook()!.period) {
                    <span class="text-[11px] text-[#debfc2]/70">{{ activeModalBook()!.period }}</span>
                  }
                </div>

                <h3 class="font-noto-serif text-2xl font-bold text-[#e5e1e4]">
                  {{ activeModalBook()!.title }}
                </h3>
                <span class="text-xs text-[#debfc2] font-medium">
                  المؤلف: {{ activeModalBook()!.author }}
                </span>

                @if (activeModalBook()!.quote) {
                  <div class="p-3 rounded-lg bg-[#201f22] border-r-2 border-[#e9c349] my-1">
                    <p class="font-noto-serif text-xs sm:text-sm text-[#ffe088] italic">
                      {{ activeModalBook()!.quote }}
                    </p>
                  </div>
                }

                <p class="text-xs sm:text-sm text-[#debfc2] leading-relaxed">
                  {{ activeModalBook()!.description }}
                </p>

                <!-- Key Concepts -->
                @if (activeModalBook()!.keyConcepts?.length) {
                  <div class="pt-2 flex flex-col gap-1.5">
                    <span class="text-[11px] font-semibold text-[#e9c349] tracking-wider">المفاهيم المحورية للمبحث:</span>
                    <div class="flex flex-wrap gap-1.5">
                      @for (concept of activeModalBook()!.keyConcepts!; track concept) {
                        <span class="text-[11px] px-2 py-0.5 rounded-md bg-[#2a2a2c] text-[#e5e1e4]/90 border border-white/5">
                          {{ concept }}
                        </span>
                      }
                    </div>
                  </div>
                }

                <!-- Modal Actions -->
                <div class="pt-4 flex items-center gap-3">
                  <button
                    type="button"
                    (click)="openTreatiseReader(activeModalBook()!)"
                    class="px-5 py-2 bg-[#e9c349] hover:bg-[#ffe088] text-[#3c2f00] font-bold text-xs sm:text-sm rounded-xl transition-all shadow-md flex items-center gap-2 cursor-pointer"
                  >
                    <span class="material-symbols-outlined text-[18px]">auto_stories</span>
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

      <!-- MODAL: Expanded Issue Dialog -->
      @if (activeModalIssue()) {
        <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div class="relative w-full max-w-xl bg-[#1c1b1d] border border-white/10 rounded-2xl p-6 sm:p-8 shadow-2xl">
            <button
              type="button"
              (click)="activeModalIssue.set(null)"
              class="absolute top-4 left-4 p-2 rounded-full bg-[#2a2a2c] text-[#debfc2] hover:text-white transition-colors cursor-pointer"
            >
              <span class="material-symbols-outlined text-[20px]">close</span>
            </button>

            <div class="flex flex-col gap-4">
              <div class="flex items-center gap-2">
                <span class="text-xs px-2.5 py-0.5 rounded-full bg-[#e9c349]/20 text-[#e9c349] font-medium border border-[#e9c349]/30">
                  {{ activeModalIssue()!.badge }}
                </span>
                <span class="text-xs text-[#debfc2]">
                  {{ activeModalIssue()!.origin }}
                </span>
              </div>

              <h3 class="font-noto-serif text-lg sm:text-xl font-bold text-[#ffe088] leading-relaxed">
                {{ activeModalIssue()!.title }}
              </h3>

              <div class="p-4 rounded-xl bg-[#201f22] border border-white/5 text-xs sm:text-sm text-[#e5e1e4] leading-relaxed">
                {{ activeModalIssue()!.body }}
              </div>

              <div class="p-3 rounded-lg bg-[#2a2a2c]/60 flex items-center gap-2 text-xs text-[#debfc2]">
                <span class="material-symbols-outlined text-[18px] text-[#e9c349]">menu_book</span>
                <span>{{ activeModalIssue()!.ref }}</span>
              </div>

              <div class="pt-2 flex justify-end">
                <button
                  type="button"
                  (click)="activeModalIssue.set(null)"
                  class="px-5 py-2 bg-[#e9c349] text-[#3c2f00] font-semibold text-xs rounded-xl cursor-pointer hover:bg-[#ffe088]"
                >
                  فهمت المسألة
                </button>
              </div>
            </div>
          </div>
        </div>
      }

    </div>
  `,
})
export class RiwaqWisdom {
  readonly novelStore = inject(NovelStore);
  private readonly router = inject(Router);

  // Data references
  readonly spotlight = SPOTLIGHT_WISDOM;
  readonly majorSelections = MAJOR_WISDOM_SELECTIONS;
  readonly islamicPhilosophy = ISLAMIC_ILLUMINATION_PHILOSOPHY;
  readonly westernClassics = WESTERN_ENLIGHTENMENT_CLASSICS;
  readonly easternSchools = EASTERN_WISDOM_SCHOOLS;
  readonly allBooks = ALL_WISDOM_BOOKS;
  readonly thoughtCurrents = THOUGHT_CURRENTS;
  readonly issues = PHILOSOPHICAL_ISSUES;
  readonly topTreatises = TOP_CONTEMPLATED_TREATISES;
  readonly categoryFilters = WISDOM_CATEGORY_FILTERS;

  // Active category filter state
  readonly selectedCategory = signal<string>('all');
  readonly searchQuery = signal<string>('');

  // Interactive Question State
  readonly currentIssueIndex = signal<number>(0);
  readonly isQuestionTransitioning = signal<boolean>(false);
  readonly currentIssue = computed<PhilosophicalIssue>(() => {
    return this.issues[this.currentIssueIndex() % this.issues.length];
  });

  // Modal State
  readonly activeModalBook = signal<RiwaqWisdomItem | null>(null);
  readonly activeModalIssue = signal<PhilosophicalIssue | null>(null);

  // Filtered Treatises computed
  readonly filteredTreatises = computed(() => {
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

  hasMatchingInList(list: RiwaqWisdomItem[]): boolean {
    const cat = this.selectedCategory();
    return cat === 'all' || list.some(b => b.category === cat);
  }

  getDisplayList(list: RiwaqWisdomItem[]): RiwaqWisdomItem[] {
    const cat = this.selectedCategory();
    if (cat === 'all') return list;
    return list.filter(b => b.category === cat);
  }

  cycleQuestion(): void {
    if (this.isQuestionTransitioning()) return;
    this.isQuestionTransitioning.set(true);

    setTimeout(() => {
      this.currentIssueIndex.update(idx => (idx + 1) % this.issues.length);
      this.isQuestionTransitioning.set(false);
    }, 220);
  }

  openTreatiseModal(book: RiwaqWisdomItem): void {
    this.activeModalBook.set(book);
  }

  closeModal(): void {
    this.activeModalBook.set(null);
  }

  openTreatiseById(id: string): void {
    const found = this.allBooks.find(b => b.id === id);
    if (found) {
      this.openTreatiseModal(found);
    }
  }

  openIssueDetails(issue: PhilosophicalIssue): void {
    this.activeModalIssue.set(issue);
  }

  handleSchoolClick(school: typeof THOUGHT_CURRENTS[0]): void {
    if (school.categoryFilter) {
      this.setCategory(school.categoryFilter);
      this.scrollToFilters();
    }
  }

  scrollToFilters(): void {
    const el = document.getElementById('filters-anchor');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  openTreatiseReader(book: RiwaqWisdomItem): void {
    this.closeModal();

    // Look for matching sample novel in store
    const storeNovels = this.novelStore.novels();
    let matching = storeNovels.find(
      n => n.id === book.id || n.title.includes(book.title) || book.title.includes(n.title)
    );

    if (!matching) {
      matching = storeNovels.find(n => n.riwaqId === 'riwaq-al-hikma') || storeNovels[0];
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
