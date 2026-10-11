import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { NovelStore } from '../core/novel-store';
import { AuthStore } from '../core/auth-store';
import { ContentProtectionService } from '../core/content-protection';
import { ChapterSummary, Novel } from '../core/novel-models';
import {
  ALL_SERENDIPITY_POOL,
  FANTASY_BOOKS,
  FEATURED_SELECTION_BOOKS,
  MOST_READ_BOOKS,
  MYSTERY_BOOKS,
  SCIFI_BOOKS,
  SPOTLIGHT_BOOK,
} from '../core/riwaq-novels-data';
import {
  ARABIAN_FOLK_SIYAR,
  GRAND_ERA_EPICS,
  HELLENIC_WAR_EPICS,
  MESOPOTAMIAN_EASTERN_EPICS,
  SPOTLIGHT_EPIC,
  TOP_RANKED_EPICS,
} from '../core/riwaq-epics-data';
import { SPOTLIGHT_WISDOM } from '../core/riwaq-wisdom-data';
import { SPOTLIGHT_HERITAGE } from '../core/riwaq-heritage-data';

export type SanctuaryRealmId = 'crimson' | 'bronze' | 'ivory' | 'emerald';

export interface RealmThemeConfig {
  id: SanctuaryRealmId;
  name: string;
  nameBadge: string;
  breadcrumb: string;
  relatedTag: string;
  corridorRoute: string;
  corridorTitle: string;
  haloColorClass: string;
  bookGlowColorClass: string;
  primaryBtnClass: string;
  badgePillClass: string;
  publisherIconBoxClass: string;
  gaugeStrokeClass: string;
  accentTextClass: string;
  accentBorderClass: string;
  defaultCover: string;
  licenseCode: string;
  volumeNumber: string;
}

export interface RelatedSanctuaryBook {
  id: string;
  title: string;
  coverImage: string;
}

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-novel-details',
  imports: [RouterLink],
  template: `
    <div class="w-full min-h-screen bg-[#131315] text-[#e5e1e4] font-sans antialiased selection:bg-[#881337] selection:text-[#ffd9dd] relative overflow-hidden pb-20">
      
      @if (currentNovel(); as novel) {
        @let theme = realmConfig();

        <!-- ==================== 1. Live Sanctuary Theme Atmosphere & Ambient Glow ==================== -->
        <div
          class="pointer-events-none absolute -top-32 right-1/4 w-[600px] h-[600px] rounded-full blur-[140px] opacity-20 transition-all duration-700 z-0"
          [class]="theme.haloColorClass"
        ></div>
        <div class="pointer-events-none absolute bottom-1/3 left-10 w-[420px] h-[420px] rounded-full blur-[120px] opacity-10 bg-[#353437] z-0"></div>

        <!-- ==================== 2. Cinematic Narrative Hero ==================== -->
        <section class="relative w-full overflow-hidden px-4 sm:px-6 md:px-12 pt-6 pb-14 z-10">
          <div class="max-w-7xl mx-auto flex flex-col gap-6 sm:gap-8">
            
            <!-- Breadcrumbs & Provenance Meta -->
            <nav aria-label="مسار التصفح" class="flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.06] pb-4">
              <div class="flex flex-wrap items-center gap-2 text-xs font-medium text-[#debfc2]/80">
                <a routerLink="/" class="hover:text-white transition-colors flex items-center gap-1">
                  <span class="material-symbols-outlined text-[15px]">home</span>
                  <span>أروقة الخلود</span>
                </a>
                <span class="text-white/30 select-none">/</span>
                <a [routerLink]="theme.corridorRoute" class="transition-colors hover:underline" [class]="theme.accentTextClass">
                  {{ theme.breadcrumb }}
                </a>
                <span class="text-white/30 select-none">/</span>
                <span class="text-[#e5e1e4] hidden sm:inline">المصنفات النادرة والمحققة</span>
                <span class="text-white/30 select-none hidden sm:inline">/</span>
                <span class="text-[11px] px-2 py-0.5 rounded bg-[#201f22] text-[#e9c349] font-mono">
                  {{ theme.volumeNumber }}
                </span>
              </div>

              <!-- Back to Corridors button -->
              <button
                type="button"
                (click)="goBack()"
                class="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#1c1b1d] border border-white/10 text-xs text-[#debfc2] hover:text-white hover:bg-[#201f22] transition-all cursor-pointer shadow-sm"
              >
                <span>العودة للأروقة</span>
                <span class="material-symbols-outlined text-[15px]">arrow_back</span>
              </button>
            </nav>

            <!-- Main Masterpiece Grid -->
            <div class="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
              
              <!-- Visual Anchor: 3D Cinematic Book Specimen (Columns 1-5 on LG) -->
              <div class="lg:col-span-5 flex justify-center lg:justify-start">
                <div class="relative group max-w-sm w-full">
                  <!-- Back Book Glow & Chiaroscuro Pedestal -->
                  <div
                    class="absolute inset-4 rounded-xl blur-2xl opacity-40 group-hover:opacity-75 transition-opacity duration-500"
                    [class]="theme.bookGlowColorClass"
                  ></div>

                  <!-- Physical Book Container with Spine Tilt Illusion -->
                  <div class="relative w-full aspect-[1/1.55] rounded-xl overflow-hidden shadow-2xl bg-[#0e0e10] border border-white/10 transition-transform duration-500 group-hover:-translate-y-2">
                    <img
                      [src]="novel.coverImage || theme.defaultCover"
                      [alt]="novel.title"
                      class="w-full h-full object-cover select-none pointer-events-none"
                      referrerpolicy="no-referrer"
                    />

                    <!-- Spine Edge Depth Shading -->
                    <div class="absolute inset-y-0 right-0 w-4 bg-gradient-to-l from-black/60 to-transparent pointer-events-none"></div>

                    <!-- Fine Gloss Film Reflection -->
                    <div class="absolute inset-0 bg-gradient-to-tr from-black/40 via-transparent to-white/10 pointer-events-none"></div>

                    <!-- Top Floating Sanctuary Emblem -->
                    <div class="absolute top-4 right-4 flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#0e0e10]/80 backdrop-blur-md text-[#e5e1e4] border border-white/15 shadow-lg">
                      <span class="material-symbols-outlined text-[16px] text-[#e9c349]">auto_awesome</span>
                      <span class="text-xs font-medium tracking-wide">طبعة الأروقة المحققة</span>
                    </div>

                    <!-- Bottom Right MTX Badge -->
                    <div class="absolute bottom-4 left-4 flex items-center gap-1 px-2.5 py-0.5 rounded bg-black/70 backdrop-blur-md border border-white/10 text-[11px] text-[#7bd8b1] font-mono">
                      <span class="material-symbols-outlined text-[13px]">lock_reset</span>
                      <span>مشفر بـ MTX</span>
                    </div>
                  </div>

                  <!-- Pedestal Reflection Shadow -->
                  <div class="w-4/5 mx-auto h-4 -mt-1 rounded-full bg-black/80 blur-md"></div>
                </div>
              </div>

              <!-- Masterpiece Narrative Core (Columns 6-12 on LG) -->
              <div class="lg:col-span-7 flex flex-col gap-5 sm:gap-6">
                
                <!-- Badges & Identity -->
                <div class="flex flex-wrap items-center gap-2 sm:gap-3">
                  <span
                    class="px-3 py-1 rounded-md text-xs font-semibold tracking-wider transition-colors duration-300"
                    [class]="theme.badgePillClass"
                  >
                    {{ novel.category || 'رواية سردية فلسفية / الطبعة التحريرية المذهبة' }}
                  </span>
                  
                  <span class="px-3 py-1 rounded-md text-xs bg-[#201f22] text-[#debfc2] flex items-center gap-1 border border-white/5">
                    <span class="material-symbols-outlined text-[15px] text-[#7bd8b1]">verified</span>
                    <span>مخطوط رقمي موثق</span>
                  </span>

                  <span class="px-3 py-1 rounded-md text-xs bg-[#1c1b1d] text-[#e9c349] flex items-center gap-1 border border-white/5">
                    <span class="material-symbols-outlined text-[15px]">schedule</span>
                    <span>قراءة متواصلة: {{ readingTimeEstimate() }}</span>
                  </span>
                </div>

                <!-- Master Title & Latin Subtitle -->
                <div class="flex flex-col gap-1">
                  <h1 class="font-noto-serif text-3xl sm:text-4xl lg:text-5xl font-bold text-[#e5e1e4] tracking-tight leading-tight">
                    {{ novel.title }}
                  </h1>
                  <p class="font-noto-serif text-lg sm:text-xl text-[#debfc2]/70 font-normal tracking-wide">
                    {{ latinSubtitle() }}
                  </p>
                </div>

                <!-- Editorial Gold Pull-Quote (Manuscript Excerpt) -->
                <blockquote class="relative p-4 sm:p-5 rounded-xl bg-[#1c1b1d]/80 border border-white/[0.06] shadow-sm">
                  <div class="absolute -top-3 right-6 px-2 bg-[#1c1b1d] font-noto-serif text-2xl text-[#e9c349] select-none leading-none">“</div>
                  <p class="font-amiri text-base sm:text-lg text-[#e5e1e4] font-normal italic leading-relaxed pt-1">
                    {{ featuredQuote() }}
                  </p>
                  <cite class="block mt-2 text-xs text-[#e9c349]/90 not-italic font-medium">
                    — {{ quoteCitation() }}
                  </cite>
                </blockquote>

                <!-- Literary Synopsis -->
                <p class="text-sm sm:text-base text-[#debfc2] leading-relaxed max-w-2xl font-normal">
                  {{ novel.description || 'ملحمة روائية تنبش في الذاكرة الحجرية لمدينة متلاشية، حيث يتقاطع مصير ناسخ مخطوطات قديم مع لغز حجري أسود نُقشت عليه خرائط أرواح التائهين. رحلة سحرية تنعتق من تصنيفات الزمان والمكان لتعيد صياغة مفهوم الفقد والخلود الإنساني.' }}
                </p>

                <!-- Sanctuary Action Buttons (3 bespoke actions) -->
                <div class="flex flex-wrap items-center gap-3 pt-2">
                  <!-- Primary Reading Button with Dynamic Realm Background -->
                  <button
                    type="button"
                    (click)="startPureReading()"
                    class="flex items-center gap-2 px-6 py-3.5 rounded-xl text-sm font-bold shadow-lg hover:brightness-110 active:scale-95 transition-all duration-300 cursor-pointer"
                    [class]="theme.primaryBtnClass"
                  >
                    <span class="material-symbols-outlined text-[20px]">menu_book</span>
                    <span>بدء القراءة النقية (محاذاة كاملة بدون مشتتات)</span>
                  </button>

                  <!-- Save to Private Sanctuary (Restricted to logged-in users) -->
                  <button
                    type="button"
                    (click)="toggleBookmark(novel.id)"
                    class="flex items-center gap-1.5 px-4 py-3.5 rounded-xl text-xs sm:text-sm bg-[#201f22] text-[#e5e1e4] hover:bg-[#2a2a2c] border border-white/5 transition-colors cursor-pointer"
                  >
                    <span
                      class="material-symbols-outlined text-[19px]"
                      [class.text-[#e9c349]]="isBookmarked(novel.id)"
                    >
                      {{ isBookmarked(novel.id) ? 'bookmark_added' : 'bookmark_add' }}
                    </span>
                    <span>{{ isBookmarked(novel.id) ? 'محفوظ في الخزانة' : 'حفظ في الخزانة' }}</span>
                  </button>

                  <!-- Inspect Original Manuscript -->
                  <button
                    type="button"
                    (click)="openManuscriptModal()"
                    class="flex items-center gap-1.5 px-4 py-3.5 rounded-xl text-xs sm:text-sm bg-[#1c1b1d] text-[#e9c349] hover:bg-[#201f22] border border-white/5 transition-colors cursor-pointer"
                  >
                    <span class="material-symbols-outlined text-[19px]">history_edu</span>
                    <span>معاينة الرقيم</span>
                  </button>
                </div>

              </div>
            </div>

          </div>
        </section>

        <!-- ==================== 3. Publisher Section (قسم الناشر التحريري المعتمد) ==================== -->
        <section class="w-full px-4 sm:px-6 md:px-12 py-5 relative z-10">
          <div class="max-w-7xl mx-auto">
            <div class="rounded-2xl bg-[#1c1b1d]/90 p-5 sm:p-7 shadow-sm border border-white/[0.08] backdrop-blur-sm relative overflow-hidden">
              
              <!-- Decorative subtle background badge watermark -->
              <span class="material-symbols-outlined absolute -left-8 -bottom-8 text-[150px] text-white/[0.02] select-none pointer-events-none">auto_stories</span>

              <div class="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center relative z-10">
                
                <!-- Publisher Icon & Identity (Cols 1-5 on LG) -->
                <div class="lg:col-span-5 flex items-center gap-4 sm:gap-5">
                  <!-- Dynamic Publisher Icon with Automatic Realm-Themed Background -->
                  <div
                    class="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl flex items-center justify-center shrink-0 shadow-lg border border-white/10 transition-colors duration-500"
                    [class]="theme.publisherIconBoxClass"
                  >
                    <span class="material-symbols-outlined text-[34px] sm:text-[40px]">{{ publisherIcon() }}</span>
                  </div>

                  <div class="flex flex-col gap-1">
                    <div class="flex items-center gap-2">
                      <span class="text-[11px] font-mono px-2 py-0.5 rounded bg-[#201f22] text-[#e9c349]">قسم الناشر</span>
                      <span class="text-xs text-[#7bd8b1] flex items-center gap-0.5 font-medium">
                        <span class="material-symbols-outlined text-[14px]">verified</span>
                        <span>ناشر موثق</span>
                      </span>
                    </div>
                    <h2 class="font-noto-serif text-lg sm:text-xl font-bold text-white tracking-tight">
                      {{ novel.author ? ('قسم الناشر — ' + novel.author) : 'قسم الناشر والتحقيق المعتمد' }}
                    </h2>
                    <p class="text-xs text-[#debfc2]/70">
                      {{ publisherDesignation() }}
                    </p>
                  </div>
                </div>

                <!-- Publisher Editorial Creed & Bio (Cols 6-9 on LG) -->
                <div class="lg:col-span-4 flex flex-col gap-1.5 border-t lg:border-t-0 lg:border-r border-white/[0.08] pt-4 lg:pt-0 lg:pr-6">
                  <p class="text-xs sm:text-sm text-[#debfc2] leading-relaxed">
                    {{ novel.authorBio || 'ناشر ومحقق نصوص معتمد في صرح أروقة الخلود، ملتزم بضبط المتون وفق تقنية MTX التحريرية والنقاء الرقمي الخالي من الشوائب.' }}
                  </p>
                  <div class="flex items-center gap-3 text-xs text-[#debfc2]/70 pt-0.5 font-mono">
                    <span>رقم الاعتماد: <span class="text-[#e9c349] font-semibold">{{ theme.licenseCode }}</span></span>
                    <span>•</span>
                    <span class="text-[#7bd8b1]">100% نصوص محققة</span>
                  </div>
                </div>

                <!-- Deposit Certificate Action (Cols 10-12 on LG) -->
                <div class="lg:col-span-3 flex lg:justify-end items-center">
                  <button
                    type="button"
                    (click)="openDepositCertificate()"
                    class="w-full lg:w-auto px-5 py-3 rounded-xl bg-[#201f22] hover:bg-[#2a2a2c] text-white hover:text-[#e9c349] text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer border border-white/10 shadow-sm"
                  >
                    <span class="material-symbols-outlined text-[18px]">verified</span>
                    <span>الاطلاع على وثيقة الإيداع</span>
                  </button>
                </div>

              </div>

            </div>
          </div>
        </section>

        <!-- ==================== 4. Literary Metadata Grid & Reader Specs (Bento 4 Cards) ==================== -->
        <section class="w-full px-4 sm:px-6 md:px-12 py-6 relative z-10">
          <div class="max-w-7xl mx-auto flex flex-col gap-4">
            <div class="flex items-center justify-between">
              <h2 class="font-noto-serif text-lg sm:text-xl text-[#e5e1e4] font-bold flex items-center gap-2">
                <span class="material-symbols-outlined text-[#e9c349] text-[22px]">dataset</span>
                <span>بطاقة المواصفات التحريرية والتكوين</span>
              </h2>
              <span class="text-xs text-[#debfc2]/60 font-mono">سجل الخزانة الأدبية الموحد</span>
            </div>

            <!-- Bento-style Metadata Cards -->
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <!-- Spec 1: Date & Editions -->
              <div class="rounded-xl bg-[#201f22] p-4 flex flex-col gap-2 shadow-sm hover:bg-[#2a2a2c] transition-colors border border-white/5">
                <div class="flex items-center justify-between text-[#debfc2]/70">
                  <span class="text-xs font-medium">تاريخ النشر والتدوين</span>
                  <span class="material-symbols-outlined text-[19px]">calendar_today</span>
                </div>
                <div class="flex flex-col gap-0.5 mt-auto">
                  <span class="font-noto-serif text-base sm:text-lg font-bold text-[#e5e1e4]">{{ specPublishDate() }}</span>
                  <span class="text-xs text-[#e9c349]">الطبعة المحققة رقمياً: 2024 م</span>
                </div>
              </div>

              <!-- Spec 2: Scope & Timing -->
              <div class="rounded-xl bg-[#201f22] p-4 flex flex-col gap-2 shadow-sm hover:bg-[#2a2a2c] transition-colors border border-white/5">
                <div class="flex items-center justify-between text-[#debfc2]/70">
                  <span class="text-xs font-medium">الحجم والمدى الزمني</span>
                  <span class="material-symbols-outlined text-[19px]">timer</span>
                </div>
                <div class="flex flex-col gap-0.5 mt-auto">
                  <span class="font-noto-serif text-base sm:text-lg font-bold text-[#e5e1e4]">{{ specPageCount() }} صفحة ورقية</span>
                  <span class="text-xs text-[#debfc2]/80">متوسط القراءة: {{ readingTimeEstimate() }}</span>
                </div>
              </div>

              <!-- Spec 3: Linguistic Heritage -->
              <div class="rounded-xl bg-[#201f22] p-4 flex flex-col gap-2 shadow-sm hover:bg-[#2a2a2c] transition-colors border border-white/5">
                <div class="flex items-center justify-between text-[#debfc2]/70">
                  <span class="text-xs font-medium">لغة العمل والتحقيق</span>
                  <span class="material-symbols-outlined text-[19px]">translate</span>
                </div>
                <div class="flex flex-col gap-0.5 mt-auto">
                  <span class="font-noto-serif text-base sm:text-lg font-bold text-[#e5e1e4]">العربية الفصحى</span>
                  <span class="text-xs text-[#7bd8b1]">تحقيق لغوي ومراجعة نصية معتمدة</span>
                </div>
              </div>

              <!-- Spec 4: Manuscript Cabinet Source -->
              <div class="rounded-xl bg-[#201f22] p-4 flex flex-col gap-2 shadow-sm hover:bg-[#2a2a2c] transition-colors border border-white/5">
                <div class="flex items-center justify-between text-[#debfc2]/70">
                  <span class="text-xs font-medium">المخطوط والمصدر</span>
                  <span class="material-symbols-outlined text-[19px]">folder_special</span>
                </div>
                <div class="flex flex-col gap-0.5 mt-auto">
                  <span class="font-noto-serif text-base sm:text-lg font-bold text-[#e5e1e4]">خزانة الكتب المحفوظة</span>
                  <span class="text-xs text-[#e9c349]">{{ theme.volumeNumber }} — القسم السردي التليد</span>
                </div>
              </div>
            </div>

          </div>
        </section>

        <!-- ==================== 5. Curated Chapters Index ==================== -->
        <section class="w-full px-4 sm:px-6 md:px-12 py-8 relative z-10">
          <div class="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            <!-- Left Column: Chapter Index Philosophy (LG: 4 cols) -->
            <div class="lg:col-span-4 flex flex-col gap-4 lg:sticky lg:top-28">
              <span class="text-xs font-bold text-[#e9c349] uppercase tracking-widest">فهرس المحتويات</span>
              <h2 class="font-noto-serif text-2xl font-bold text-[#e5e1e4] leading-tight">
                أبواب المصنّف ومسارات السرد
              </h2>
              <p class="text-sm text-[#debfc2] leading-relaxed">
                قُسّمت الرواية إلى أبواب رئيسية تحاكي دورة الانبعاث والأفول في الفلسفة التحريرية؛ حيث تتيح لك المنصة القفز المباشر لأي باب مع الاحتفاظ التلقائي بنقطة توقفك في الخزانة.
              </p>

              <!-- Inline Visual Progress Gauge (SVG) -->
              <div class="p-4 rounded-xl bg-[#201f22] flex items-center gap-4 shadow-sm border border-white/5">
                <svg class="w-16 h-16 shrink-0 -rotate-90" viewBox="0 0 36 36">
                  <circle class="stroke-[#353437]" cx="18" cy="18" fill="none" r="15.9155" stroke-width="3"></circle>
                  <circle
                    [class]="theme.gaugeStrokeClass"
                    cx="18"
                    cy="18"
                    fill="none"
                    r="15.9155"
                    stroke-dasharray="35, 100"
                    stroke-linecap="round"
                    stroke-width="3"
                  ></circle>
                </svg>
                <div class="flex flex-col gap-0.5">
                  <span class="text-sm font-semibold text-[#e5e1e4]">اكتمال الفصول المقروءة</span>
                  <span class="text-xs text-[#debfc2]/80">الباب الأول مكتمل بنسبة 35%</span>
                </div>
              </div>
            </div>

            <!-- Right Column: Interactive Chapters List (LG: 8 cols) -->
            <div class="lg:col-span-8 flex flex-col gap-3">
              @for (chapter of chaptersList(); track chapter.id) {
                <button
                  type="button"
                  (click)="readChapter(chapter)"
                  class="w-full text-right group rounded-xl bg-[#201f22] p-4 hover:bg-[#2a2a2c] border border-white/5 hover:border-white/10 transition-all duration-300 flex items-center justify-between gap-4 cursor-pointer"
                >
                  <div class="flex items-center gap-4 min-w-0">
                    <span class="w-10 h-10 rounded-lg bg-[#0e0e10] border border-white/10 flex items-center justify-center font-noto-serif text-lg font-bold text-[#e9c349] shrink-0">
                      {{ arabicChapterNumeral(chapter.chapterIndex) }}
                    </span>
                    <div class="flex flex-col gap-0.5 min-w-0">
                      <span class="font-noto-serif text-base font-bold text-[#e5e1e4] group-hover:text-white transition-colors truncate">
                        {{ chapter.title }}
                      </span>
                      <span class="text-xs text-[#debfc2]/80 line-clamp-1">
                        {{ chapterSubtitle(chapter) }}
                      </span>
                    </div>
                  </div>

                  <div class="flex items-center gap-3 shrink-0">
                    <span class="hidden sm:inline-block text-xs text-[#debfc2]/70 font-mono">{{ chapterTime(chapter) }}</span>
                    <span
                      class="w-9 h-9 rounded-full bg-[#1c1b1d] group-hover:bg-[#e9c349] group-hover:text-[#241a00] text-[#e5e1e4] flex items-center justify-center transition-colors border border-white/5"
                    >
                      <span class="material-symbols-outlined text-[18px]">arrow_forward</span>
                    </span>
                  </div>
                </button>
              }
            </div>

          </div>
        </section>

        <!-- ==================== 6. Related Sanctuary Works (Cover + Title Strict Rule) ==================== -->
        <section class="w-full px-4 sm:px-6 md:px-12 py-12 bg-[#0e0e10]/60 border-t border-white/[0.06] relative z-10">
          <div class="max-w-7xl mx-auto flex flex-col gap-6">
            
            <!-- Section Title & Realm Indicator -->
            <div class="flex items-center justify-between flex-wrap gap-3">
              <div class="flex items-center gap-3">
                <h2 class="font-noto-serif text-xl sm:text-2xl text-[#e5e1e4] font-bold">
                  روائع أخرى من صميم الرواق
                </h2>
                <span
                  class="text-xs px-2.5 py-1 rounded-md bg-[#201f22] font-medium"
                  [class]="theme.accentTextClass"
                >
                  {{ theme.relatedTag }}
                </span>
              </div>

              <a
                [routerLink]="theme.corridorRoute"
                class="text-xs sm:text-sm text-[#e9c349] hover:underline flex items-center gap-1 font-medium"
              >
                <span>تصفح خزانة {{ theme.name }} كاملة</span>
                <span class="material-symbols-outlined text-[16px]">arrow_back</span>
              </a>
            </div>

            <!-- Ultra-Minimalist Book Cards Grid (Cover + Title only) -->
            <div class="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
              @for (item of relatedSanctuaryWorks(); track item.id) {
                <button
                  type="button"
                  (click)="openBook(item.id)"
                  class="flex flex-col gap-2 group cursor-pointer transition-transform duration-300 hover:-translate-y-1 bg-transparent border-0 p-0 text-inherit w-full text-right"
                >
                  <div class="relative w-full aspect-[1/1.55] rounded-xl overflow-hidden shadow-md bg-[#201f22] border border-white/10 group-hover:border-white/20 group-hover:shadow-xl transition-all">
                    <img
                      [src]="item.coverImage"
                      [alt]="item.title"
                      class="w-full h-full object-cover select-none pointer-events-none transition-transform duration-500 group-hover:scale-105"
                      loading="lazy"
                      referrerpolicy="no-referrer"
                    />
                    <div class="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  </div>
                  <span class="font-noto-serif text-sm sm:text-base text-[#e5e1e4] font-bold group-hover:text-white transition-colors text-right truncate pt-1">
                    {{ item.title }}
                  </span>
                </button>
              }
            </div>

          </div>
        </section>

        <!-- ==================== 7. Modals: Deposit Certificate & Manuscript ==================== -->
        @if (showCertificateModal()) {
          <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <div class="w-full max-w-lg rounded-2xl bg-[#1c1b1d] border border-white/15 p-6 shadow-2xl flex flex-col gap-5 text-right relative">
              <button
                type="button"
                (click)="closeDepositCertificate()"
                class="absolute top-4 left-4 w-8 h-8 rounded-full bg-[#2a2a2c] text-[#debfc2] hover:text-white flex items-center justify-center cursor-pointer"
              >
                <span class="material-symbols-outlined text-[18px]">close</span>
              </button>

              <div class="flex items-center gap-3 border-b border-white/10 pb-4">
                <span class="material-symbols-outlined text-3xl text-[#7bd8b1]">verified</span>
                <div>
                  <h3 class="font-noto-serif text-lg font-bold text-white">وثيقة الإيداع والتوثيق التحريري</h3>
                  <span class="text-xs text-[#debfc2]/70 font-mono">NOIR-REG-{{ theme.licenseCode }}</span>
                </div>
              </div>

              <div class="space-y-3 text-xs sm:text-sm text-[#debfc2] leading-relaxed">
                <p>
                  يشهد <strong class="text-[#e9c349]">قسم الناشر والتحقيق المعتمد</strong> بأن المصنف <strong class="text-white">«{{ novel.title }}»</strong> خضع للتحقيق الصرفي والتدقيق اللغوي الشامل وفق معايير صرح «أروقة الخلود».
                </p>
                <div class="p-3 rounded-xl bg-[#0e0e10] border border-white/5 space-y-1.5 font-mono text-xs">
                  <div class="flex justify-between">
                    <span class="text-white/50">رقم الإيداع:</span>
                    <span class="text-[#e9c349]">{{ theme.licenseCode }}</span>
                  </div>
                  <div class="flex justify-between">
                    <span class="text-white/50">الرواق المعماري:</span>
                    <span class="text-white">{{ theme.name }}</span>
                  </div>
                  <div class="flex justify-between">
                    <span class="text-white/50">محرك الترميز:</span>
                    <span class="text-[#7bd8b1]">MTX Pure Text Engine v2.4 (Lossless)</span>
                  </div>
                  <div class="flex justify-between">
                    <span class="text-white/50">حقوق النشر:</span>
                    <span class="text-white">مفتوحة للقراءة المستدامة بدون إعلانات</span>
                  </div>
                </div>
              </div>

              <button
                type="button"
                (click)="closeDepositCertificate()"
                class="w-full py-2.5 rounded-xl bg-[#2a2a2c] hover:bg-[#353437] text-white text-xs font-semibold transition-colors cursor-pointer"
              >
                إغلاق الوثيقة
              </button>
            </div>
          </div>
        }

        @if (showManuscriptModal()) {
          <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <div class="w-full max-w-lg rounded-2xl bg-[#1c1b1d] border border-white/15 p-6 shadow-2xl flex flex-col gap-5 text-right relative">
              <button
                type="button"
                (click)="closeManuscriptModal()"
                class="absolute top-4 left-4 w-8 h-8 rounded-full bg-[#2a2a2c] text-[#debfc2] hover:text-white flex items-center justify-center cursor-pointer"
              >
                <span class="material-symbols-outlined text-[18px]">close</span>
              </button>

              <div class="flex items-center gap-3 border-b border-white/10 pb-4">
                <span class="material-symbols-outlined text-3xl text-[#e9c349]">history_edu</span>
                <div>
                  <h3 class="font-noto-serif text-lg font-bold text-white">معاينة الرقيم والمخطوط الأصلي</h3>
                  <span class="text-xs text-[#debfc2]/70">خزانة المخطوطات القديمة المحفوظة</span>
                </div>
              </div>

              <div class="space-y-3 text-xs sm:text-sm text-[#debfc2] leading-relaxed">
                <p>
                  نُسخ هذا السفر ونُضد بأحدث خوارزميات الضغط النصي العربي (MTX)، محققاً نسبة توفير تتجاوز 75% مع الحفاظ المطلق على كل حركة وتشكيل دون أي تسامح في الدقة.
                </p>
                <div class="p-4 rounded-xl bg-[#0e0e10] border border-white/5 font-amiri text-base sm:text-lg text-[#e5e1e4] italic text-center leading-relaxed">
                  «بِاسْمِ الَّذِي أَبْدَعَ الْحَرْفَ وَجَعَلَهُ لِلْخُلُودِ سَفِيرًا.. هَذَا رَقِيمٌ مُحَقَّقٌ مِنْ خَزَائِنِ الأَرْوِقَةِ»
                </div>
              </div>

              <div class="flex gap-2">
                <button
                  type="button"
                  (click)="startPureReading(); closeManuscriptModal()"
                  class="flex-1 py-2.5 rounded-xl bg-[#e9c349] text-[#241a00] font-bold text-xs hover:bg-[#ffe088] transition-colors cursor-pointer"
                >
                  الانتقال للقارئ الآن
                </button>
                <button
                  type="button"
                  (click)="closeManuscriptModal()"
                  class="px-4 py-2.5 rounded-xl bg-[#2a2a2c] text-white text-xs hover:bg-[#353437] transition-colors cursor-pointer"
                >
                  إغلاق
                </button>
              </div>
            </div>
          </div>
        }

        @if (showAuthPromptModal()) {
          <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <div class="w-full max-w-md rounded-2xl bg-[#1c1b1d] border border-white/15 p-6 shadow-2xl flex flex-col gap-5 text-right relative">
              <button
                type="button"
                (click)="showAuthPromptModal.set(false)"
                class="absolute top-4 left-4 w-8 h-8 rounded-full bg-[#2a2a2c] text-[#debfc2] hover:text-white flex items-center justify-center cursor-pointer"
              >
                <span class="material-symbols-outlined text-[18px]">close</span>
              </button>

              <div class="flex items-center gap-3 border-b border-white/10 pb-4">
                <div class="w-12 h-12 rounded-xl bg-[#e9c349]/20 text-[#e9c349] flex items-center justify-center shrink-0">
                  <span class="material-symbols-outlined text-[26px]">lock</span>
                </div>
                <div>
                  <h3 class="font-noto-serif text-lg font-bold text-white">تسجيل الدخول مطلوب</h3>
                  <span class="text-xs text-[#debfc2]/70 font-mono">خزانة القارئ الخاصة</span>
                </div>
              </div>

              <p class="text-xs sm:text-sm text-[#debfc2] leading-relaxed">
                حفظ الأعمال في الخزانة ومتابعة تقدم القراءة ومزامنة المحفوظات متاح حصرياً للمسجلين. يرجى تسجيل الدخول أو إنشاء حسابك المجاني للمتابعة.
              </p>

              <div class="flex gap-2.5 pt-1">
                <button
                  type="button"
                  (click)="goToAuth()"
                  class="flex-1 py-3 px-4 rounded-xl bg-[#e9c349] hover:bg-[#ffe088] text-[#241a00] font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <span class="material-symbols-outlined text-[18px]">login</span>
                  <span>تسجيل الدخول الآن</span>
                </button>
                <button
                  type="button"
                  (click)="showAuthPromptModal.set(false)"
                  class="px-4 py-3 rounded-xl bg-[#2a2a2c] text-[#debfc2] hover:text-white text-xs font-semibold transition-colors cursor-pointer"
                >
                  إلغاء
                </button>
              </div>
            </div>
          </div>
        }

      } @else {
        <!-- Fallback loading state -->
        <div class="min-h-[60vh] flex flex-col items-center justify-center p-8 text-center gap-4">
          <div class="w-12 h-12 rounded-full border-2 border-[#e9c349] border-t-transparent animate-spin"></div>
          <h2 class="font-noto-serif text-2xl font-bold text-white">جاري استحضار السفر والمخطوط...</h2>
          <p class="text-xs text-[#debfc2]/70 max-w-sm">يتم فك تشفير بيانات المصنف وضبط أبعاد الرواق التحريري</p>
          <a routerLink="/" class="mt-2 text-xs text-[#e9c349] hover:underline flex items-center gap-1">
            <span class="material-symbols-outlined text-[15px]">arrow_forward</span>
            <span>العودة إلى صرح أروقة الخلود</span>
          </a>
        </div>
      }

    </div>
  `,
})
export class NovelDetails {
  readonly novelStore = inject(NovelStore);
  readonly authStore = inject(AuthStore);
  private readonly contentProtection = inject(ContentProtectionService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  private readonly novelIdParam = signal<string>('');
  private readonly queryRealmParam = signal<string | null>(null);

  readonly showCertificateModal = signal<boolean>(false);
  readonly showManuscriptModal = signal<boolean>(false);
  readonly showAuthPromptModal = signal<boolean>(false);

  constructor() {
    this.contentProtection.init();
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id) {
        this.novelIdParam.set(id);
      }
    });

    this.route.queryParamMap.subscribe(q => {
      const realm = q.get('realm') || q.get('riwaq');
      if (realm) {
        this.queryRealmParam.set(realm);
      }
    });
  }

  // Active Novel Resolution
  readonly currentNovel = computed<Novel | null>(() => {
    const id = this.novelIdParam();

    // 1. Search in novelStore loaded novels
    if (id) {
      const foundInStore = this.novelStore.novels().find(n => n.id === id);
      if (foundInStore) return foundInStore;
    }

    // 2. Search in Riwaq Novels data
    const allNovelsPool = [
      SPOTLIGHT_BOOK,
      ...FEATURED_SELECTION_BOOKS,
      ...FANTASY_BOOKS,
      ...MYSTERY_BOOKS,
      ...SCIFI_BOOKS,
      ...ALL_SERENDIPITY_POOL,
      ...MOST_READ_BOOKS.map(m => m.book),
    ];
    const novelItem = id ? allNovelsPool.find(b => b.id === id) : null;
    if (novelItem) {
      return this.synthesizeNovel(novelItem, 'riwaq-al-riwayat', 'رواق الروايات', '#ffb2bd');
    }

    // 3. Search in Riwaq Epics data
    const allEpicsPool = [
      SPOTLIGHT_EPIC,
      ...GRAND_ERA_EPICS,
      ...MESOPOTAMIAN_EASTERN_EPICS,
      ...HELLENIC_WAR_EPICS,
      ...ARABIAN_FOLK_SIYAR,
      ...TOP_RANKED_EPICS,
    ];
    const epicItem = id ? allEpicsPool.find(e => e.id === id) : null;
    if (epicItem) {
      return this.synthesizeNovel(epicItem, 'riwaq-al-malahim', 'رواق الملاحم', '#e9c349');
    }

    // 4. Search in Riwaq Wisdom
    if (id === SPOTLIGHT_WISDOM.id || id?.includes('wisdom') || id?.includes('hikma') || id?.includes('meditations')) {
      return this.synthesizeNovel(SPOTLIGHT_WISDOM, 'riwaq-al-hikma', 'رواق الحكمة', '#e5e1e4');
    }

    // 5. Search in Riwaq Heritage
    if (id === SPOTLIGHT_HERITAGE.id || id?.includes('heritage') || id?.includes('turath') || id?.includes('manuscript')) {
      return this.synthesizeNovel(SPOTLIGHT_HERITAGE, 'riwaq-al-turath', 'رواق التراث', '#7bd8b1');
    }

    // 6. Check query realm param fallback or first novel in store
    const storeNovels = this.novelStore.novels();
    if (storeNovels.length > 0) {
      const qRealm = this.queryRealmParam();
      if (qRealm) {
        const matchingByRealm = storeNovels.find(n => n.riwaqId?.includes(qRealm));
        if (matchingByRealm) return matchingByRealm;
      }
      return storeNovels[0];
    }

    // 7. Masterpiece default: "متاهة حجر السج"
    return this.synthesizeNovel(SPOTLIGHT_BOOK, 'riwaq-al-riwayat', 'رواق الروايات', '#ffb2bd');
  });

  // Determine which of the 4 Realmic themes is active
  readonly activeRealmId = computed<SanctuaryRealmId>(() => {
    const novel = this.currentNovel();
    const qRealm = this.queryRealmParam();

    // Direct query param override
    if (qRealm === 'bronze' || qRealm === 'epics' || qRealm === 'riwaq-al-malahim') return 'bronze';
    if (qRealm === 'ivory' || qRealm === 'wisdom' || qRealm === 'riwaq-al-hikma') return 'ivory';
    if (qRealm === 'emerald' || qRealm === 'heritage' || qRealm === 'riwaq-al-turath') return 'emerald';
    if (qRealm === 'crimson' || qRealm === 'novels' || qRealm === 'riwaq-al-riwayat') return 'crimson';

    // From novel riwaqId or category
    if (!novel) return 'crimson';
    const rId = novel.riwaqId || '';
    const cat = novel.category || '';
    const id = novel.id || '';

    if (rId.includes('malahim') || cat.includes('ملحم') || id.includes('gilgamesh') || id.includes('iliad') || id.includes('shahnameh')) {
      return 'bronze';
    }
    if (rId.includes('hikma') || cat.includes('حكم') || cat.includes('فلسف') || id.includes('wisdom') || id.includes('meditations')) {
      return 'ivory';
    }
    if (rId.includes('turath') || cat.includes('تراث') || cat.includes('مخطوط') || id.includes('heritage') || id.includes('nights') || id.includes('kalila')) {
      return 'emerald';
    }

    return 'crimson';
  });

  // Dynamic Theme Config for the 4 Realmic Corridors
  readonly realmConfig = computed<RealmThemeConfig>(() => {
    const realm = this.activeRealmId();

    switch (realm) {
      case 'bronze':
        return {
          id: 'bronze',
          name: 'رواق الملاحم',
          nameBadge: 'رواق الملاحم (The Mythic Bronze Sanctuary)',
          breadcrumb: 'رواق الملاحم (Mythic Bronze)',
          relatedTag: 'رواق الملاحم والبطولات',
          corridorRoute: '/riwaq-al-malahim',
          corridorTitle: 'خزانة الملاحم الأسطورية',
          haloColorClass: 'bg-[#e9c349]',
          bookGlowColorClass: 'bg-[#e9c349]',
          primaryBtnClass: 'bg-[#e9c349] text-[#241a00] hover:bg-[#ffe088]',
          badgePillClass: 'bg-[#af8d11]/40 text-[#ffe088] border border-[#e9c349]/30',
          publisherIconBoxClass: 'bg-[#af8d11]/50 text-[#ffe088]',
          gaugeStrokeClass: 'stroke-[#e9c349]',
          accentTextClass: 'text-[#e9c349]',
          accentBorderClass: 'border-[#e9c349]/40',
          defaultCover: SPOTLIGHT_EPIC.coverImage,
          licenseCode: 'ETH-9020-BRONZE',
          volumeNumber: 'المجلد 03',
        };

      case 'ivory':
        return {
          id: 'ivory',
          name: 'رواق الحكمة',
          nameBadge: 'رواق الحكمة (The Ivory Philosophy Sanctuary)',
          breadcrumb: 'رواق الحكمة (Ivory Philosophy)',
          relatedTag: 'رواق الفلسفة والتأمل',
          corridorRoute: '/riwaq-al-hikma',
          corridorTitle: 'خزانة الفكر والتأمل',
          haloColorClass: 'bg-white',
          bookGlowColorClass: 'bg-white/50',
          primaryBtnClass: 'bg-[#e5e1e4] text-[#131315] hover:bg-white',
          badgePillClass: 'bg-[#353437] text-[#e5e1e4] border border-white/20',
          publisherIconBoxClass: 'bg-[#353437] text-white',
          gaugeStrokeClass: 'stroke-[#e5e1e4]',
          accentTextClass: 'text-[#e5e1e4]',
          accentBorderClass: 'border-white/30',
          defaultCover: SPOTLIGHT_WISDOM.coverImage,
          licenseCode: 'ETH-4410-IVORY',
          volumeNumber: 'المجلد 12',
        };

      case 'emerald':
        return {
          id: 'emerald',
          name: 'رواق التراث',
          nameBadge: 'رواق التراث (The Emerald Manuscript)',
          breadcrumb: 'رواق التراث (Manuscript Emerald)',
          relatedTag: 'رواق التراث والمخطوطات',
          corridorRoute: '/riwaq-al-turath',
          corridorTitle: 'خزانة المخطوطات والنوادر',
          haloColorClass: 'bg-[#7bd8b1]',
          bookGlowColorClass: 'bg-[#7bd8b1]',
          primaryBtnClass: 'bg-[#7bd8b1] text-[#003827] hover:bg-[#97f5cc]',
          badgePillClass: 'bg-[#005039]/60 text-[#97f5cc] border border-[#7bd8b1]/30',
          publisherIconBoxClass: 'bg-[#005039]/70 text-[#7bd8b1]',
          gaugeStrokeClass: 'stroke-[#7bd8b1]',
          accentTextClass: 'text-[#7bd8b1]',
          accentBorderClass: 'border-[#7bd8b1]/40',
          defaultCover: SPOTLIGHT_HERITAGE.coverImage,
          licenseCode: 'ETH-7720-EMERALD',
          volumeNumber: 'المجلد 05',
        };

      case 'crimson':
      default:
        return {
          id: 'crimson',
          name: 'رواق الروايات',
          nameBadge: 'رواق الروايات (The Crimson Sanctuary)',
          breadcrumb: 'رواق الروايات (Crimson Noir)',
          relatedTag: 'رواق الروايات',
          corridorRoute: '/riwaq-al-riwayat',
          corridorTitle: 'خزانة السرد الرفيع',
          haloColorClass: 'bg-[#ffb2bd]',
          bookGlowColorClass: 'bg-[#ffb2bd]',
          primaryBtnClass: 'bg-[#ffb2bd] text-[#670024] hover:brightness-110',
          badgePillClass: 'bg-[#881337] text-[#ffd9dd] border border-[#ffb2bd]/30',
          publisherIconBoxClass: 'bg-[#881337] text-[#ffb2bd]',
          gaugeStrokeClass: 'stroke-[#ffb2bd]',
          accentTextClass: 'text-[#ffb2bd]',
          accentBorderClass: 'border-[#ffb2bd]/40',
          defaultCover: SPOTLIGHT_BOOK.coverImage,
          licenseCode: 'ETH-8842-NOIR',
          volumeNumber: 'المجلد 07',
        };
    }
  });

  // Latin Subtitle
  readonly latinSubtitle = computed<string>(() => {
    const novel = this.currentNovel();
    if (!novel) return 'The Obsidian Labyrinth';

    const id = novel.id;
    if (id.includes('obsidian') || id.includes('سج') || id.includes('labyrinth')) return 'The Obsidian Labyrinth';
    if (id.includes('gilgamesh')) return 'The Epic of Gilgamesh';
    if (id.includes('iliad')) return 'The Iliad of Homer';
    if (id.includes('shahnameh')) return 'The Book of Kings';
    if (id.includes('meditations')) return 'Meditations of Marcus Aurelius';
    if (id.includes('nights')) return 'One Thousand and One Nights';
    if (id.includes('kalila')) return 'Kalila and Dimna';

    return 'A Masterpiece of the Immortality Sanctuaries';
  });

  // Pull-quote excerpt
  readonly featuredQuote = computed<string>(() => {
    const realm = this.activeRealmId();

    if (realm === 'bronze') {
      return '«هُوَ الذي رَأَى كُلَّ شَيءٍ فَبَلَغَتْ بِهِ الحِكمَةُ أَقَاصِي الأَرضِ، وَعَرَفَ الأَسرَارَ وَغَاصَ فِي لُجَجِ الغَيبِ...»';
    }
    if (realm === 'ivory') {
      return '«أنت تمتلك عقلك، لا الأحداث الخارجية؛ أدرك هذا وستجد قوة لا تتزعزع تنير ظلمات المسير...»';
    }
    if (realm === 'emerald') {
      return '«بلغني أيها الملك السعيد، أن الحرف إذا نُقش بنور الصدق، ظل ناطقاً بعد فناء الممالك والمدائن...»';
    }
    return '«في دهاليز الخيال تتشكل حيواتٌ لم نَعِشها، وينكسر عصف الزمان لترقد الذكرى في ركنٍ مهيب لا تطاله يد النسيان ولا يعكره صخب البدايات...»';
  });

  readonly quoteCitation = computed<string>(() => {
    const realm = this.activeRealmId();
    if (realm === 'bronze') return 'مقتطف من افتتاحية لوح الأزل الأول';
    if (realm === 'ivory') return 'مقتطف من الكتاب الثاني: تأملات في ماهية النفس';
    if (realm === 'emerald') return 'مقتطف من مقدمة المخطوطة المحققة الكبرى';
    return 'مقتطف من استهلال الباب الثالث: سديم الحرف';
  });

  // Reading time and specs
  readonly readingTimeEstimate = computed<string>(() => {
    const novel = this.currentNovel();
    if (!novel) return '5 ساعات و40 دقيقة';
    if (novel.chapters.length >= 6) return '8 ساعات و15 دقيقة';
    if (novel.chapters.length >= 4) return '5 ساعات و40 دقيقة';
    return '3 ساعات و20 دقيقة';
  });

  readonly specPublishDate = computed<string>(() => {
    const realm = this.activeRealmId();
    if (realm === 'bronze') return 'الألفية الثالثة ق.م';
    if (realm === 'ivory') return 'عام 180 ميلادية';
    if (realm === 'emerald') return 'القرن الثالث الهجري';
    return 'خريف 1974 م';
  });

  readonly specPageCount = computed<number>(() => {
    const novel = this.currentNovel();
    if (!novel) return 412;
    return novel.chapters.length ? novel.chapters.length * 105 : 412;
  });

  // Chapters list (always ensure 4 elegant chapters for the curated index)
  readonly chaptersList = computed<ChapterSummary[]>(() => {
    const novel = this.currentNovel();
    if (novel && novel.chapters && novel.chapters.length >= 4) {
      return novel.chapters.slice(0, 4);
    }
    if (novel && novel.chapters && novel.chapters.length > 0) {
      return novel.chapters;
    }

    // Default 4 Masterpiece Chapters from design specification
    return [
      {
        id: 'chap-1',
        chapterIndex: 1,
        title: 'شقشقة الفجر وظلال القلعة المفقودة',
        wordCount: 8400,
        utf8Bytes: 32000,
        mtxBytes: 7800,
        savingsPercent: 75.6,
        mtxBase64: '',
      },
      {
        id: 'chap-2',
        chapterIndex: 2,
        title: 'همس الرقائق في حانة النسيان',
        wordCount: 12200,
        utf8Bytes: 46000,
        mtxBytes: 11200,
        savingsPercent: 75.6,
        mtxBase64: '',
      },
      {
        id: 'chap-3',
        chapterIndex: 3,
        title: 'طيف الغريب والبحث عن الكلمة الأولى',
        wordCount: 15400,
        utf8Bytes: 58000,
        mtxBytes: 13900,
        savingsPercent: 76.0,
        mtxBase64: '',
      },
      {
        id: 'chap-4',
        chapterIndex: 4,
        title: 'مرايا الصمت وانبلاج الحقيقة',
        wordCount: 9600,
        utf8Bytes: 37000,
        mtxBytes: 8900,
        savingsPercent: 75.9,
        mtxBase64: '',
      },
    ];
  });

  // Related Sanctuary Works strictly adhering to (Cover + Title) rule
  readonly relatedSanctuaryWorks = computed<RelatedSanctuaryBook[]>(() => {
    const realm = this.activeRealmId();

    if (realm === 'bronze') {
      return [
        {
          id: 'novel-iliad',
          title: 'الإلياذة',
          coverImage: GRAND_ERA_EPICS[0]?.coverImage || 'https://lh3.googleusercontent.com/aida-public/AB6AXuAsXBTutVCoMnXNcs1KyvICAWxbW60uBsTBoWRVW__pqpqJgpPgnpa8gnxGSglvMQXObV0FVpXTOkuD7vKjZ9M2XfpjFqG1-572wFoVgBgkKEFvJb5wiji8OYoVccNz3LjgfKNVm7LffWvtdAxzsusllY4yO_KWrZQ0SLs6tem6Q88UEbmQzM_X9NFE6Z7jZ2a0Gio9yH1vEbL1imcpmwJO5W0YWAKP7D3kqLizCyqF1S3ymKA8vUZyeg',
        },
        {
          id: 'novel-shahnameh',
          title: 'الشاهنامة',
          coverImage: GRAND_ERA_EPICS[1]?.coverImage || 'https://lh3.googleusercontent.com/aida-public/AB6AXuB-fHyUKQr3iIEMcu0FC-coTLdTDh6wE7bYKCaMpbMZSsW60jJzHZdz9WQXMRmKNZk-KD_2JXUHY04M_lh3JGHPofoSH9ar1rcpuVLm_QSvsctXl9PWDojTPtvIVzNgbJcH3BPOV-RhjBKmuwBlRBeFi-xX_rqeuMS85L3hKd9yetfMR_e6LaYPApAFrrfjVBrRiVNbBy8SF5sGYsLGu-gF8LHqFoyX-xaSVhZYCJHno6QUld-HnW3Nlg',
        },
        {
          id: 'novel-odyssey',
          title: 'الأوديسة وسفر البحار',
          coverImage: HELLENIC_WAR_EPICS[0]?.coverImage || 'https://lh3.googleusercontent.com/aida-public/AB6AXuDgUq10H2jV-e3v6g6-0h50pG5l829s29r170_f738914652',
        },
        {
          id: 'novel-antara',
          title: 'سيرة عنترة بن شداد',
          coverImage: ARABIAN_FOLK_SIYAR[0]?.coverImage || 'https://lh3.googleusercontent.com/aida-public/AB6AXuAuEDU8hDbplJHvSM0C3kDXuyto9P2iUzBk32XduT5MAP6ukg073RnCJ8WJHXazfVzq31jzh4CiFs_ieEKfkGh4o0yqK0yGrNqmegx20S_eA774X7AsKC5HvHAaqDlJbrcA7m1mvpaGmmHZ14YWsJsJibtbdJ6UOMl-9U8yfUi7JP7mMdo7--AbT7eeDiOwxFxFfo3iFhWYfjBMjghvjxze8rYlZ8XkZGfzAuQ8n2fACdpVnP77El11yQ',
        },
      ];
    }

    if (realm === 'ivory') {
      return [
        {
          id: 'novel-republic',
          title: 'الجمهورية والمدينة الفاضلة',
          coverImage: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBtT1PDYKLx0q9w7O1F1OTE2EZXzK1tbfWVdzdFzWS6zkozknRKoEXHQrQBRp92Eg6PtikBHVtqciYLVvbN6goYOGF0ebHPEtj578RK4jqJRrQqercuMCstU5RqpIqcJ5GgEzypR5KTlAXig8cCECb85bcbDLPQuNPebySU400w9WDLNjgITPH-cZygw4f-EiSfY2ZMjSy8JXMHXPVg7oD6CQ8iRG3TY4P-JjcYyraZU-Vy-wQ-9N7r0Q',
        },
        {
          id: 'novel-hayy',
          title: 'حي بن يقظان وأسرار العقل',
          coverImage: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAegTnTNUPUYzZuf9YnpIjq1YERHe1hddEZyidtZgZXm2pm4-k9PWdKq_xNEcLcr8d1GeFIMdMu6lWnEkVPLgNH4AFmMYJXwTahXcyMaNWyWhl8uS095CmTXOTmfvNMmlL4oZKBuZDdLAi9cYVZ-B8Acxy807z7kbM9K9YDwDwW5R634QpdoCib4VPqpDliEi3BwOSUTAdBlRtCNb3YFNmgD_-bJd7XIKQC6yhUFfFdAmDJa6Xzpo71ug',
        },
        {
          id: 'novel-incoherence',
          title: 'تهافت الفلاسفة وحجة البرهان',
          coverImage: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCZHGhM7eEQ8h3gUTtKCB4RA6d3Mc7_Ch0sG3BRiVSFlaUMjyxNmHUtUXQg2oRNPGsK_x44PeNfbD_5Y4vT7eVWldH3jr3XuWeacRxTXPTXRyqlFUhdmn-BGqi7KlNI-pkvYmx-I4JmIwBb9LSh5780phLw9k0rKEBKMYaaNCUuycsN0Z4yRZfWy5DIQKvnHuTkb0AFV091mNCPIJYtTJkTvcJ_enxrh0QdrYekOFO15JjDu1CB-EzgpQ',
        },
        {
          id: 'novel-zarathustra',
          title: 'هكذا تكلم زرادشت',
          coverImage: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBtLSVXB8b2cxMmLeuy3vE4yw96LvDXgmrK2SZMzvA1C9VWGiVj2lAOcx3a_Owe5pg9TJF0GvQktbWE3SKfRWBCOuvM5keslSDc2T7fPTbXd01DYC5h6Hdxp7YjP7xy-p4bxOLy6SjNF9eRktfPEfWiAFCEic3_8rVxHbK4le7P9qVecaH7vegHY-9AnicApJbQHPrb7W72U522W_2kMy2hROTZ_rDH310t86x9qP3UEJcC4DdWYiU6Uw',
        },
      ];
    }

    if (realm === 'emerald') {
      return [
        {
          id: 'novel-thousand-nights',
          title: 'ألف ليلة وليلة (طبعة بولاق)',
          coverImage: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAegTnTNUPUYzZuf9YnpIjq1YERHe1hddEZyidtZgZXm2pm4-k9PWdKq_xNEcLcr8d1GeFIMdMu6lWnEkVPLgNH4AFmMYJXwTahXcyMaNWyWhl8uS095CmTXOTmfvNMmlL4oZKBuZDdLAi9cYVZ-B8Acxy807z7kbM9K9YDwDwW5R634QpdoCib4VPqpDliEi3BwOSUTAdBlRtCNb3YFNmgD_-bJd7XIKQC6yhUFfFdAmDJa6Xzpo71ug',
        },
        {
          id: 'novel-kalila',
          title: 'كليلة ودمنة في ديوان الحكمة',
          coverImage: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBtT1PDYKLx0q9w7O1F1OTE2EZXzK1tbfWVdzdFzWS6zkozknRKoEXHQrQBRp92Eg6PtikBHVtqciYLVvbN6goYOGF0ebHPEtj578RK4jqJRrQqercuMCstU5RqpIqcJ5GgEzypR5KTlAXig8cCECb85bcbDLPQuNPebySU400w9WDLNjgITPH-cZygw4f-EiSfY2ZMjSy8JXMHXPVg7oD6CQ8iRG3TY4P-JjcYyraZU-Vy-wQ-9N7r0Q',
        },
        {
          id: 'novel-maqamat',
          title: 'مقامات الحريري ودرر البلاغة',
          coverImage: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCZHGhM7eEQ8h3gUTtKCB4RA6d3Mc7_Ch0sG3BRiVSFlaUMjyxNmHUtUXQg2oRNPGsK_x44PeNfbD_5Y4vT7eVWldH3jr3XuWeacRxTXPTXRyqlFUhdmn-BGqi7KlNI-pkvYmx-I4JmIwBb9LSh5780phLw9k0rKEBKMYaaNCUuycsN0Z4yRZfWy5DIQKvnHuTkb0AFV091mNCPIJYtTJkTvcJ_enxrh0QdrYekOFO15JjDu1CB-EzgpQ',
        },
        {
          id: 'novel-dove-necklace',
          title: 'طوق الحمامة في الألفة والأُلاّف',
          coverImage: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBtLSVXB8b2cxMmLeuy3vE4yw96LvDXgmrK2SZMzvA1C9VWGiVj2lAOcx3a_Owe5pg9TJF0GvQktbWE3SKfRWBCOuvM5keslSDc2T7fPTbXd01DYC5h6Hdxp7YjP7xy-p4bxOLy6SjNF9eRktfPEfWiAFCEic3_8rVxHbK4le7P9qVecaH7vegHY-9AnicApJbQHPrb7W72U522W_2kMy2hROTZ_rDH310t86x9qP3UEJcC4DdWYiU6Uw',
        },
      ];
    }

    // Default Crimson Novels from Mockup
    return [
      {
        id: 'novel-mirage-dunes',
        title: 'سراب الكثبان العتيقة',
        coverImage: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAegTnTNUPUYzZuf9YnpIjq1YERHe1hddEZyidtZgZXm2pm4-k9PWdKq_xNEcLcr8d1GeFIMdMu6lWnEkVPLgNH4AFmMYJXwTahXcyMaNWyWhl8uS095CmTXOTmfvNMmlL4oZKBuZDdLAi9cYVZ-B8Acxy807z7kbM9K9YDwDwW5R634QpdoCib4VPqpDliEi3BwOSUTAdBlRtCNb3YFNmgD_-bJd7XIKQC6yhUFfFdAmDJa6Xzpo71ug',
      },
      {
        id: 'novel-silk-cipher',
        title: 'شفرة الحرير الغائب',
        coverImage: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBtT1PDYKLx0q9w7O1F1OTE2EZXzK1tbfWVdzdFzWS6zkozknRKoEXHQrQBRp92Eg6PtikBHVtqciYLVvbN6goYOGF0ebHPEtj578RK4jqJRrQqercuMCstU5RqpIqcJ5GgEzypR5KTlAXig8cCECb85bcbDLPQuNPebySU400w9WDLNjgITPH-cZygw4f-EiSfY2ZMjSy8JXMHXPVg7oD6CQ8iRG3TY4P-JjcYyraZU-Vy-wQ-9N7r0Q',
      },
      {
        id: 'novel-seventh-citadel',
        title: 'ظلال القلعة السابعة',
        coverImage: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCZHGhM7eEQ8h3gUTtKCB4RA6d3Mc7_Ch0sG3BRiVSFlaUMjyxNmHUtUXQg2oRNPGsK_x44PeNfbD_5Y4vT7eVWldH3jr3XuWeacRxTXPTXRyqlFUhdmn-BGqi7KlNI-pkvYmx-I4JmIwBb9LSh5780phLw9k0rKEBKMYaaNCUuycsN0Z4yRZfWy5DIQKvnHuTkb0AFV091mNCPIJYtTJkTvcJ_enxrh0QdrYekOFO15JjDu1CB-EzgpQ',
      },
      {
        id: 'novel-echoes-obsidian',
        title: 'أصداء في صخرة اليم',
        coverImage: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBtLSVXB8b2cxMmLeuy3vE4yw96LvDXgmrK2SZMzvA1C9VWGiVj2lAOcx3a_Owe5pg9TJF0GvQktbWE3SKfRWBCOuvM5keslSDc2T7fPTbXd01DYC5h6Hdxp7YjP7xy-p4bxOLy6SjNF9eRktfPEfWiAFCEic3_8rVxHbK4le7P9qVecaH7vegHY-9AnicApJbQHPrb7W72U522W_2kMy2hROTZ_rDH310t86x9qP3UEJcC4DdWYiU6Uw',
      },
    ];
  });

  // Arabic Numeral Format Helper
  arabicChapterNumeral(index: number): string {
    const numerals = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
    return String(index).replace(/[0-9]/g, d => numerals[Number(d)]);
  }

  chapterSubtitle(chapter: ChapterSummary): string {
    switch (chapter.chapterIndex) {
      case 1:
        return 'الافتتاحية — استحضار رفات المدينة المسوّرة ونداء النساخ الأول.';
      case 2:
        return 'حلول الغسق — أول فك لرموز حجر السَّج الأسود ومحادثة العابرين.';
      case 3:
        return 'منتصف الليل — ارتحال في صحراء المخطوطات واكتشاف النبوءة المنسية.';
      case 4:
        return 'الخاتمة — تحول المتاهة إلى أفق ساطع وانكشاف سر الأروقة.';
      default:
        return `${chapter.wordCount} كلمة • توفير MTX النقي ${chapter.savingsPercent}%`;
    }
  }

  chapterTime(chapter: ChapterSummary): string {
    switch (chapter.chapterIndex) {
      case 1:
        return '٤٥ دقيقة';
      case 2:
        return '١ ساعة و١٥ دقيقة';
      case 3:
        return '٢ ساعة و١٠ دقائق';
      case 4:
        return '١ ساعة و٣٠ دقيقة';
      default:
        return `${Math.ceil(chapter.wordCount / 200)} دقيقة`;
    }
  }

  readonly publisherIcon = computed<string>(() => {
    const realm = this.activeRealmId();
    if (realm === 'bronze') return 'shield';
    if (realm === 'ivory') return 'psychology';
    if (realm === 'emerald') return 'history_edu';
    return 'auto_stories';
  });

  readonly publisherDesignation = computed<string>(() => {
    const realm = this.activeRealmId();
    if (realm === 'bronze') return 'ديوان الملاحم والحروب الأسطورية — تحقيق المتون وتوثيق السير التليدة';
    if (realm === 'ivory') return 'مجمع الفكر والتأمل الفلسفي — تدقيق الرسائل والمباحث الكبرى';
    if (realm === 'emerald') return 'خزانة المخطوطات والنوادر — تحقيق المخطوطات وضبط الألفاظ';
    return 'دار صرح الأدب والسرد الرفيع — رعاية النثر والرواية التحريرية';
  });

  // User Actions
  isBookmarked(novelId: string): boolean {
    return this.novelStore.bookmarkedNovelIds().includes(novelId);
  }

  toggleBookmark(novelId: string): void {
    if (!this.authStore.isAuthenticated()) {
      this.showAuthPromptModal.set(true);
      return;
    }
    this.novelStore.toggleBookmark(novelId);
  }

  goToAuth(): void {
    this.showAuthPromptModal.set(false);
    this.router.navigate(['/login']);
  }

  startPureReading(): void {
    const novel = this.currentNovel();
    if (!novel) return;

    this.novelStore.selectNovel(novel.id);
    const chapters = this.chaptersList();
    const firstChapter = chapters[0];
    if (firstChapter) {
      this.novelStore.selectChapter(novel.id, firstChapter.id);
      this.router.navigate(['/reader', novel.id, firstChapter.id]);
    } else {
      this.router.navigate(['/reader', novel.id]);
    }
  }

  readChapter(chapter: ChapterSummary): void {
    const novel = this.currentNovel();
    if (!novel) return;

    this.novelStore.selectNovel(novel.id);
    this.novelStore.selectChapter(novel.id, chapter.id);
    this.router.navigate(['/reader', novel.id, chapter.id]);
  }

  openBook(bookId: string): void {
    this.novelIdParam.set(bookId);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  openDepositCertificate(): void {
    this.showCertificateModal.set(true);
  }

  closeDepositCertificate(): void {
    this.showCertificateModal.set(false);
  }

  openManuscriptModal(): void {
    this.showManuscriptModal.set(true);
  }

  closeManuscriptModal(): void {
    this.showManuscriptModal.set(false);
  }

  goBack(): void {
    const realm = this.activeRealmId();
    if (realm === 'bronze') {
      this.router.navigate(['/riwaq-al-malahim']);
    } else if (realm === 'ivory') {
      this.router.navigate(['/riwaq-al-hikma']);
    } else if (realm === 'emerald') {
      this.router.navigate(['/riwaq-al-turath']);
    } else {
      this.router.navigate(['/riwaq-al-riwayat']);
    }
  }

  // Synthesize a Novel object when an item from static catalogs is requested
  private synthesizeNovel(
    item: { id: string; title: string; author?: string; category?: string; coverImage?: string; description?: string; quote?: string; badge?: string },
    riwaqId: string,
    riwaqName: string,
    accentColor: string
  ): Novel {
    const storeNovels = this.novelStore.novels();
    const fallbackChapters = storeNovels[0]?.chapters || [];

    return {
      id: item.id,
      title: item.title,
      author: item.author || 'أديب الأروقة',
      authorBio: 'كاتب ومحقق نصوص بارز في صرح أروقة الخلود.',
      category: item.category || 'رواية سردية فلسفية',
      riwaqId,
      riwaqName,
      coverGradient: 'from-[#881337] via-[#131315] to-black',
      coverImage: item.coverImage || SPOTLIGHT_BOOK.coverImage,
      accentColor,
      rating: 4.95,
      ratingCount: 2840,
      views: '145K',
      description: item.description || item.quote || 'سفرٌ سردي من نفائس صرح أروقة الخلود، حيث يرقد الحرف ليعاود النهوض حياً في ضمير القارئ.',
      chapters: fallbackChapters,
      createdAt: '2024-01-01',
      updatedAt: '2024-10-10',
    };
  }
}
