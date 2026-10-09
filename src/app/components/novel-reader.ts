import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  HostListener,
  inject,
  OnDestroy,
  OnInit,
  signal,
} from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { NovelStore } from '../core/novel-store';
import { ChapterSummary, ReaderFont, ReaderTheme, ReaderWidth } from '../core/novel-models';

type AutoScrollSpeed = 1 | 2 | 3;

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-novel-reader',
  imports: [MatIconModule, RouterLink],
  template: `
    <div
      [class]="'min-h-screen transition-colors duration-300 relative selection:bg-rose-500/30 ' + getThemeContainerClass()"
    >
      <!-- Top Scroll Progress Indicator Bar -->
      <div class="fixed top-0 left-0 right-0 z-50 h-[3px] bg-black/10 dark:bg-white/5 pointer-events-none">
        <div
          class="h-full bg-gradient-to-l from-rose-600 via-rose-500 to-amber-500 transition-all duration-150"
          [style.width.%]="scrollProgress()"
        ></div>
      </div>

      <!-- MAIN READER TOP NAVIGATION BAR (Header) -->
      @if (!isZenMode()) {
        <header
          [class]="'sticky top-0 z-40 border-b backdrop-blur-xl px-3 sm:px-6 py-2.5 transition-all duration-300 ' + getNavbarThemeClass()"
        >
          <div class="max-w-7xl mx-auto flex items-center justify-between gap-2 sm:gap-4">
            
            <!-- RIGHT (RTL First): Novel Info & Back Navigation -->
            <div class="flex items-center gap-2 sm:gap-3 min-w-0">
              <button
                (click)="backToNovelDetails()"
                title="العودة لتفاصيل الرواية"
                class="p-2 rounded-xl transition-all cursor-pointer flex items-center justify-center shrink-0 border border-transparent hover:border-rose-500/30 hover:bg-rose-500/10 active:scale-95 text-inherit"
                aria-label="العودة لتفاصيل الرواية"
              >
                <mat-icon class="text-xl">arrow_forward</mat-icon>
              </button>

              <div class="flex flex-col min-w-0">
                <div class="flex items-center gap-2">
                  <a
                    [routerLink]="['/novel', currentNovel()?.id]"
                    class="text-xs sm:text-sm font-bold truncate hover:text-rose-400 transition-colors font-amiri"
                    title="{{ currentNovel()?.title }}"
                  >
                    {{ currentNovel()?.title || 'مقاتل الروايات' }}
                  </a>
                  @if (currentNovel()?.author) {
                    <span class="text-[11px] opacity-60 hidden md:inline truncate">
                      · بقلم {{ currentNovel()?.author }}
                    </span>
                  }
                </div>

                <div class="flex items-center gap-2 text-[11px] opacity-75">
                  <span class="font-medium text-rose-500 truncate">
                    الفصل {{ currentChapter()?.chapterIndex || 1 }}: {{ currentChapter()?.title }}
                  </span>
                  <span class="hidden sm:inline">·</span>
                  <span class="hidden sm:inline">{{ readingTimeMinutes() }} دقائق قراءة</span>
                </div>
              </div>
            </div>

            <!-- LEFT: Action Controls & Customization Buttons -->
            <div class="flex items-center gap-1 sm:gap-2 shrink-0">
              
              <!-- Quick Prev / Next Buttons in Header -->
              <div class="hidden sm:flex items-center gap-1 border border-current/10 rounded-xl p-0.5">
                <button
                  (click)="goToPrevChapter()"
                  [disabled]="isFirstChapter()"
                  title="الفصل السابق (السهم الأيمن)"
                  class="p-1.5 rounded-lg disabled:opacity-25 disabled:cursor-not-allowed hover:bg-black/10 dark:hover:bg-white/10 transition-colors cursor-pointer text-xs flex items-center gap-1"
                >
                  <mat-icon class="text-base">chevron_right</mat-icon>
                  <span class="hidden lg:inline">السابق</span>
                </button>

                <button
                  (click)="goToNextChapter()"
                  [disabled]="isLastChapter()"
                  title="الفصل التالي (السهم الأيسر)"
                  class="p-1.5 rounded-lg disabled:opacity-25 disabled:cursor-not-allowed hover:bg-black/10 dark:hover:bg-white/10 transition-colors cursor-pointer text-xs flex items-center gap-1"
                >
                  <span class="hidden lg:inline">التالي</span>
                  <mat-icon class="text-base">chevron_left</mat-icon>
                </button>
              </div>

              <!-- Chapter Drawer Toggle -->
              <button
                (click)="toggleChapterDrawer()"
                [class]="showChapterDrawer() ? 'bg-rose-600 text-white shadow-sm' : 'hover:bg-black/10 dark:hover:bg-white/10 border border-current/10'"
                title="فهرس الفصول"
                class="px-2.5 py-1.5 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 text-xs font-medium"
              >
                <mat-icon class="text-base">format_list_numbered_rtl</mat-icon>
                <span class="hidden md:inline">الفهرس</span>
              </button>

              <!-- Reader Appearance Settings Toggle -->
              <button
                (click)="toggleSettingsDrawer()"
                [class]="showSettingsDrawer() ? 'bg-rose-600 text-white shadow-sm' : 'hover:bg-black/10 dark:hover:bg-white/10 border border-current/10'"
                title="تخصيص مظهر وخط القراءة"
                class="px-2.5 py-1.5 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 text-xs font-medium"
              >
                <mat-icon class="text-base">tune</mat-icon>
                <span class="hidden md:inline">المظهر</span>
              </button>

              <!-- Auto-Scroll Button -->
              <button
                (click)="toggleAutoScroll()"
                [class]="isAutoScrolling() ? 'bg-amber-600 text-stone-950 font-bold animate-pulse' : 'hover:bg-black/10 dark:hover:bg-white/10 border border-current/10 opacity-80 hover:opacity-100'"
                title="{{ isAutoScrolling() ? 'إيقاف التمرير التلقائي' : 'تشغيل التمرير التلقائي' }}"
                class="p-1.5 sm:px-2.5 sm:py-1.5 rounded-xl transition-all cursor-pointer flex items-center gap-1 text-xs"
              >
                <mat-icon class="text-base">swap_vert</mat-icon>
                <span class="hidden lg:inline">{{ isAutoScrolling() ? autoScrollSpeed() + 'x' : 'تمرير تلقائي' }}</span>
              </button>

              <!-- Audio Voice Reader (TTS) -->
              <button
                (click)="toggleTts()"
                [class]="isSpeaking() ? 'bg-emerald-600 text-white animate-pulse' : 'hover:bg-black/10 dark:hover:bg-white/10 border border-current/10 opacity-80 hover:opacity-100'"
                title="{{ isSpeaking() ? 'إيقاف القراءة الصوتية' : 'استمع للفصل صوتياً (ذكاء نطق)' }}"
                class="p-1.5 sm:px-2.5 sm:py-1.5 rounded-xl transition-all cursor-pointer flex items-center gap-1 text-xs"
              >
                <mat-icon class="text-base">{{ isSpeaking() ? 'volume_up' : 'volume_mute' }}</mat-icon>
                <span class="hidden xl:inline">{{ isSpeaking() ? 'استماع...' : 'استمع' }}</span>
              </button>

              <!-- Bookmark Toggle -->
              <button
                (click)="toggleBookmark()"
                [class]="isBookmarked() ? 'text-amber-400 bg-amber-400/10 border-amber-400/30' : 'hover:bg-black/10 dark:hover:bg-white/10 border border-current/10 text-inherit opacity-80 hover:opacity-100'"
                title="{{ isBookmarked() ? 'محفوظ في المفضلة' : 'حفظ في المفضلة' }}"
                class="p-1.5 sm:p-2 rounded-xl border transition-all cursor-pointer flex items-center justify-center"
              >
                <mat-icon class="text-base">{{ isBookmarked() ? 'bookmark' : 'bookmark_border' }}</mat-icon>
              </button>

              <!-- Zen / Focus Mode Toggle -->
              <button
                (click)="toggleZenMode()"
                title="وضع التركيز الخالص (إخفاء الأشرطة)"
                class="p-1.5 sm:p-2 rounded-xl border border-current/10 hover:bg-black/10 dark:hover:bg-white/10 transition-all cursor-pointer flex items-center justify-center opacity-80 hover:opacity-100"
              >
                <mat-icon class="text-base">fullscreen</mat-icon>
              </button>

            </div>

          </div>
        </header>
      }

      <!-- ZEN MODE EXIT PILL (Shows when in Zen Mode) -->
      @if (isZenMode()) {
        <div class="fixed top-4 left-4 z-50 flex items-center gap-2">
          <button
            (click)="toggleZenMode()"
            class="px-3 py-1.5 rounded-full liquid-glass border border-white/20 text-white text-xs flex items-center gap-1.5 shadow-xl hover:bg-white/20 transition-all cursor-pointer backdrop-blur-md"
            title="الخروج من وضع التركيز"
          >
            <mat-icon class="text-sm">fullscreen_exit</mat-icon>
            <span>خروج من التركيز</span>
          </button>
        </div>
      }

      <!-- CHAPTER INDEX DRAWER (Modal / Slide-over) -->
      @if (showChapterDrawer()) {
        <!-- Backdrop -->
        <button
          type="button"
          aria-label="إغلاق فهرس الفصول"
          (click)="closeDrawers()"
          class="fixed inset-0 z-50 w-full h-full bg-black/60 backdrop-blur-sm transition-opacity cursor-pointer border-none"
        ></button>

        <!-- Drawer Content -->
        <div
          class="fixed inset-y-0 right-0 z-50 w-full max-w-md bg-stone-900 text-stone-100 shadow-2xl border-l border-white/10 flex flex-col transition-transform transform duration-300"
        >
          <!-- Drawer Header -->
          <div class="p-4 sm:p-5 border-b border-white/10 flex items-center justify-between bg-stone-950/70">
            <div class="flex items-center gap-2.5">
              <div class="w-8 h-8 rounded-lg bg-rose-600/20 text-rose-400 flex items-center justify-center border border-rose-500/30">
                <mat-icon class="text-base">format_list_numbered_rtl</mat-icon>
              </div>
              <div>
                <h3 class="font-bold text-sm sm:text-base font-amiri">فهرس الفصول</h3>
                <span class="text-xs text-stone-400">{{ currentNovel()?.chapters?.length || 0 }} فصول متوفرة</span>
              </div>
            </div>

            <button
              (click)="closeDrawers()"
              class="p-1.5 rounded-lg hover:bg-white/10 text-stone-400 hover:text-white transition-colors cursor-pointer"
            >
              <mat-icon class="text-xl">close</mat-icon>
            </button>
          </div>

          <!-- Chapter Search Box -->
          <div class="p-3.5 border-b border-white/10 bg-stone-900">
            <div class="relative">
              <input
                type="text"
                [value]="chapterSearchQuery()"
                (input)="onSearchChapter($event)"
                placeholder="ابحث برقم الفصل أو العنوان..."
                class="w-full bg-stone-950/80 border border-white/10 rounded-xl pr-9 pl-4 py-2 text-xs text-white placeholder-stone-500 focus:outline-none focus:border-rose-500 transition-colors"
              />
              <mat-icon class="absolute right-2.5 top-1/2 -translate-y-1/2 text-base text-stone-400 pointer-events-none">
                search
              </mat-icon>
            </div>
          </div>

          <!-- Chapters Scroll List -->
          <div class="flex-1 overflow-y-auto p-3 space-y-1.5">
            @for (ch of filteredChapters(); track ch.id) {
              <button
                (click)="selectChapterFromDrawer(ch.id)"
                [class]="ch.id === currentChapter()?.id
                  ? 'bg-rose-950/80 border-rose-500/50 text-white shadow-sm'
                  : 'bg-stone-950/40 hover:bg-stone-800/60 border-white/5 text-stone-300 hover:text-white'"
                class="w-full text-right p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 group"
              >
                <div class="flex items-center gap-3 min-w-0">
                  <div
                    [class]="ch.id === currentChapter()?.id ? 'bg-rose-600 text-white' : 'bg-stone-800 text-stone-400 group-hover:text-stone-200'"
                    class="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs shrink-0"
                  >
                    {{ ch.chapterIndex }}
                  </div>
                  <div class="min-w-0">
                    <p class="font-bold text-xs sm:text-sm font-amiri truncate leading-tight">
                      {{ ch.title }}
                    </p>
                    <span class="text-[11px] text-stone-400">
                      {{ ch.wordCount }} كلمة
                    </span>
                  </div>
                </div>

                @if (ch.id === currentChapter()?.id) {
                  <span class="px-2 py-0.5 rounded-md bg-rose-600/30 text-rose-300 text-[10px] font-bold border border-rose-500/30 shrink-0">
                    تقرأه الآن
                  </span>
                } @else {
                  <mat-icon class="text-sm text-stone-600 group-hover:text-stone-400 transition-colors shrink-0">
                    chevron_left
                  </mat-icon>
                }
              </button>
            } @empty {
              <div class="p-8 text-center text-stone-500 text-xs">
                لا توجد فصول تطابق بحثك
              </div>
            }
          </div>
        </div>
      }

      <!-- READER APPEARANCE CUSTOMIZATION DRAWER (Modal / Slide-over) -->
      @if (showSettingsDrawer()) {
        <!-- Backdrop -->
        <button
          type="button"
          aria-label="إغلاق مظهر القراءة"
          (click)="closeDrawers()"
          class="fixed inset-0 z-50 w-full h-full bg-black/60 backdrop-blur-sm transition-opacity cursor-pointer border-none"
        ></button>

        <!-- Drawer Content -->
        <div
          class="fixed inset-y-0 left-0 z-50 w-full max-w-md bg-stone-900 text-stone-100 shadow-2xl border-r border-white/10 flex flex-col transition-transform transform duration-300"
        >
          <!-- Drawer Header -->
          <div class="p-4 sm:p-5 border-b border-white/10 flex items-center justify-between bg-stone-950/70">
            <div class="flex items-center gap-2.5">
              <div class="w-8 h-8 rounded-lg bg-rose-600/20 text-rose-400 flex items-center justify-center border border-rose-500/30">
                <mat-icon class="text-base">tune</mat-icon>
              </div>
              <div>
                <h3 class="font-bold text-sm sm:text-base font-amiri">مظهر وتخصيص القراءة</h3>
                <span class="text-xs text-stone-400">اختر الخط والألوان الأنسب لراحة عينيك</span>
              </div>
            </div>

            <button
              (click)="closeDrawers()"
              class="p-1.5 rounded-lg hover:bg-white/10 text-stone-400 hover:text-white transition-colors cursor-pointer"
            >
              <mat-icon class="text-xl">close</mat-icon>
            </button>
          </div>

          <!-- Drawer Body with Controls -->
          <div class="flex-1 overflow-y-auto p-4 sm:p-5 space-y-6 text-xs">
            
            <!-- SECTION 1: Color Themes (السمة اللونية لراحة العين) -->
            <div class="space-y-2.5">
              <div class="flex items-center justify-between">
                <div class="font-bold text-stone-300 text-xs flex items-center gap-1.5">
                  <mat-icon class="text-sm text-rose-400">palette</mat-icon>
                  <span>السمة اللونية لراحة العين</span>
                </div>
                <span class="text-[11px] text-stone-400 font-medium">{{ getThemeName() }}</span>
              </div>

              <div class="grid grid-cols-2 gap-2.5">
                <!-- Royal Dark Theme -->
                <button
                  (click)="setTheme('dark')"
                  [class]="settings().theme === 'dark' ? 'ring-2 ring-rose-500 font-bold bg-[#17151a]' : 'bg-[#17151a]/80 opacity-70 hover:opacity-100'"
                  class="p-3 rounded-xl border border-white/10 flex items-center gap-2.5 transition-all cursor-pointer text-right"
                >
                  <div class="w-5 h-5 rounded-full bg-[#121015] border border-rose-500/50 shadow-inner shrink-0"></div>
                  <div>
                    <span class="block text-white font-bold">داكن ملكي</span>
                    <span class="text-[10px] text-stone-400">الراحة الليلية الافتراضية</span>
                  </div>
                </button>

                <!-- AMOLED Black Theme -->
                <button
                  (click)="setTheme('black')"
                  [class]="settings().theme === 'black' ? 'ring-2 ring-rose-500 font-bold bg-black' : 'bg-black/90 opacity-70 hover:opacity-100'"
                  class="p-3 rounded-xl border border-stone-800 flex items-center gap-2.5 transition-all cursor-pointer text-right"
                >
                  <div class="w-5 h-5 rounded-full bg-black border border-stone-700 shadow-inner shrink-0"></div>
                  <div>
                    <span class="block text-stone-200 font-bold">أموليد أسود</span>
                    <span class="text-[10px] text-stone-500">سواد خالص موفر للطاقة</span>
                  </div>
                </button>

                <!-- Sepia / Parchment Theme -->
                <button
                  (click)="setTheme('sepia')"
                  [class]="settings().theme === 'sepia' ? 'ring-2 ring-amber-600 font-bold bg-[#f4ebd0]' : 'bg-[#f4ebd0]/80 opacity-70 hover:opacity-100'"
                  class="p-3 rounded-xl border border-amber-300 flex items-center gap-2.5 transition-all cursor-pointer text-right"
                >
                  <div class="w-5 h-5 rounded-full bg-[#f4ebd0] border border-amber-500 shadow-inner shrink-0"></div>
                  <div>
                    <span class="block text-[#382b1d] font-bold">ورق بردي (سيبيا)</span>
                    <span class="text-[10px] text-[#78644e]">دفء ورق الكتب القديمة</span>
                  </div>
                </button>

                <!-- Daylight Clean Paper Theme -->
                <button
                  (click)="setTheme('light')"
                  [class]="settings().theme === 'light' ? 'ring-2 ring-rose-500 font-bold bg-[#fafafa]' : 'bg-[#fafafa]/80 opacity-70 hover:opacity-100'"
                  class="p-3 rounded-xl border border-stone-300 flex items-center gap-2.5 transition-all cursor-pointer text-right"
                >
                  <div class="w-5 h-5 rounded-full bg-white border border-stone-400 shadow-inner shrink-0"></div>
                  <div>
                    <span class="block text-stone-900 font-bold">نهاري ناصع</span>
                    <span class="text-[10px] text-stone-500">للقراءة تحت الإضاءة القوية</span>
                  </div>
                </button>
              </div>
            </div>

            <!-- SECTION 2: Arabic Font Family (الخط العربي) -->
            <div class="space-y-2.5">
              <div class="font-bold text-stone-300 text-xs flex items-center gap-1.5">
                <mat-icon class="text-sm text-rose-400">format_size</mat-icon>
                <span>نوع الخط العربي</span>
              </div>

              <div class="grid grid-cols-2 gap-2">
                <button
                  (click)="setFont('amiri')"
                  [class]="settings().fontFamily === 'amiri' ? 'bg-rose-950/80 border-rose-500 text-white font-bold' : 'bg-stone-950/50 border-white/5 text-stone-300 hover:bg-stone-800'"
                  class="p-2.5 rounded-xl border transition-all cursor-pointer text-center font-amiri text-sm"
                >
                  خط أميري (أدبي أصيل)
                </button>

                <button
                  (click)="setFont('cairo')"
                  [class]="settings().fontFamily === 'cairo' ? 'bg-rose-950/80 border-rose-500 text-white font-bold' : 'bg-stone-950/50 border-white/5 text-stone-300 hover:bg-stone-800'"
                  class="p-2.5 rounded-xl border transition-all cursor-pointer text-center font-cairo text-xs"
                >
                  خط كايرو (عصري واضح)
                </button>

                <button
                  (click)="setFont('tajawal')"
                  [class]="settings().fontFamily === 'tajawal' ? 'bg-rose-950/80 border-rose-500 text-white font-bold' : 'bg-stone-950/50 border-white/5 text-stone-300 hover:bg-stone-800'"
                  class="p-2.5 rounded-xl border transition-all cursor-pointer text-center font-tajawal text-xs"
                >
                  خط تجوال (ناعم ومتوازن)
                </button>

                <button
                  (click)="setFont('system')"
                  [class]="settings().fontFamily === 'system' ? 'bg-rose-950/80 border-rose-500 text-white font-bold' : 'bg-stone-950/50 border-white/5 text-stone-300 hover:bg-stone-800'"
                  class="p-2.5 rounded-xl border transition-all cursor-pointer text-center font-sans text-xs"
                >
                  خط النظام الأساسي
                </button>
              </div>
            </div>

            <!-- SECTION 3: Font Size Control (حجم الخط) -->
            <div class="space-y-2.5">
              <div class="flex items-center justify-between">
                <div class="font-bold text-stone-300 text-xs flex items-center gap-1.5">
                  <mat-icon class="text-sm text-rose-400">text_fields</mat-icon>
                  <span>حجم خط النص</span>
                </div>
                <span class="text-xs font-mono font-bold text-rose-400 bg-rose-950/50 px-2 py-0.5 rounded-md border border-rose-500/30">
                  {{ settings().fontSize }}px
                </span>
              </div>

              <div class="flex items-center gap-2">
                <button
                  (click)="changeFontSize(-1)"
                  title="تصغير الخط"
                  class="w-10 h-10 rounded-xl bg-stone-950/60 border border-white/10 hover:bg-stone-800 flex items-center justify-center font-bold text-sm cursor-pointer transition-colors active:scale-95"
                >
                  -A
                </button>

                <input
                  type="range"
                  min="16"
                  max="36"
                  step="1"
                  [value]="settings().fontSize"
                  (input)="onFontSizeSlider($event)"
                  class="flex-1 accent-rose-500 cursor-pointer h-2 bg-stone-800 rounded-lg"
                />

                <button
                  (click)="changeFontSize(1)"
                  title="تكبير الخط"
                  class="w-10 h-10 rounded-xl bg-stone-950/60 border border-white/10 hover:bg-stone-800 flex items-center justify-center font-bold text-sm cursor-pointer transition-colors active:scale-95"
                >
                  +A
                </button>
              </div>

              <!-- Quick Size Presets -->
              <div class="flex items-center justify-between gap-1 pt-1">
                @for (preset of [18, 21, 24, 28, 32]; track preset) {
                  <button
                    (click)="setFontSizeDirect(preset)"
                    [class]="settings().fontSize === preset ? 'bg-rose-600 text-white font-bold' : 'bg-stone-950/40 text-stone-400 hover:text-white'"
                    class="px-2.5 py-1 rounded-lg text-[11px] transition-colors cursor-pointer border border-white/5"
                  >
                    {{ preset }}
                  </button>
                }
              </div>
            </div>

            <!-- SECTION 4: Line Height (ارتفاع الأسطر) -->
            <div class="space-y-2.5">
              <div class="font-bold text-stone-300 text-xs flex items-center gap-1.5">
                <mat-icon class="text-sm text-rose-400">format_line_spacing</mat-icon>
                <span>ارتفاع الأسطر والمسافات</span>
              </div>

              <div class="grid grid-cols-3 gap-2">
                <button
                  (click)="setLineHeight(1.8)"
                  [class]="settings().lineHeight === 1.8 ? 'bg-rose-950/80 border-rose-500 text-white font-bold' : 'bg-stone-950/50 border-white/5 text-stone-300 hover:bg-stone-800'"
                  class="py-2 px-2 rounded-xl border text-center transition-all cursor-pointer"
                >
                  مدمج (1.8)
                </button>

                <button
                  (click)="setLineHeight(2.2)"
                  [class]="settings().lineHeight === 2.2 ? 'bg-rose-950/80 border-rose-500 text-white font-bold' : 'bg-stone-950/50 border-white/5 text-stone-300 hover:bg-stone-800'"
                  class="py-2 px-2 rounded-xl border text-center transition-all cursor-pointer"
                >
                  مريح (2.2)
                </button>

                <button
                  (click)="setLineHeight(2.6)"
                  [class]="settings().lineHeight === 2.6 ? 'bg-rose-950/80 border-rose-500 text-white font-bold' : 'bg-stone-950/50 border-white/5 text-stone-300 hover:bg-stone-800'"
                  class="py-2 px-2 rounded-xl border text-center transition-all cursor-pointer"
                >
                  فسيح (2.6)
                </button>
              </div>
            </div>

            <!-- SECTION 5: Reading Canvas Width (عرض مساحة القراءة) -->
            <div class="space-y-2.5">
              <div class="font-bold text-stone-300 text-xs flex items-center gap-1.5">
                <mat-icon class="text-sm text-rose-400">view_column</mat-icon>
                <span>عرض صفحة القراءة</span>
              </div>

              <div class="grid grid-cols-4 gap-1.5">
                <button
                  (click)="setWidth('narrow')"
                  [class]="settings().pageWidth === 'narrow' ? 'bg-rose-600 text-white font-bold' : 'bg-stone-950/50 border-white/5 text-stone-300 hover:bg-stone-800'"
                  class="py-2 rounded-xl border text-center text-xs transition-all cursor-pointer"
                >
                  ضيق
                </button>

                <button
                  (click)="setWidth('normal')"
                  [class]="settings().pageWidth === 'normal' ? 'bg-rose-600 text-white font-bold' : 'bg-stone-950/50 border-white/5 text-stone-300 hover:bg-stone-800'"
                  class="py-2 rounded-xl border text-center text-xs transition-all cursor-pointer"
                >
                  متوازن
                </button>

                <button
                  (click)="setWidth('wide')"
                  [class]="settings().pageWidth === 'wide' ? 'bg-rose-600 text-white font-bold' : 'bg-stone-950/50 border-white/5 text-stone-300 hover:bg-stone-800'"
                  class="py-2 rounded-xl border text-center text-xs transition-all cursor-pointer"
                >
                  عريض
                </button>

                <button
                  (click)="setWidth('full')"
                  [class]="settings().pageWidth === 'full' ? 'bg-rose-600 text-white font-bold' : 'bg-stone-950/50 border-white/5 text-stone-300 hover:bg-stone-800'"
                  class="py-2 rounded-xl border text-center text-xs transition-all cursor-pointer"
                >
                  كامل
                </button>
              </div>
            </div>

            <!-- SECTION 6: Text Alignment & Tashkeel (محاذاة النص والتشكيل) -->
            <div class="space-y-3 pt-2 border-t border-white/10">
              <!-- Text Alignment -->
              <div class="flex items-center justify-between">
                <span class="text-stone-300 font-medium">محاذاة الأسطر:</span>
                <div class="flex items-center gap-1 border border-white/10 rounded-lg p-0.5 bg-stone-950/40">
                  <button
                    (click)="setTextAlign('justify')"
                    [class]="settings().textAlign !== 'right' ? 'bg-rose-600 text-white' : 'text-stone-400 hover:text-white'"
                    class="px-2 py-1 rounded text-xs cursor-pointer transition-colors"
                  >
                    ضبط كامل
                  </button>
                  <button
                    (click)="setTextAlign('right')"
                    [class]="settings().textAlign === 'right' ? 'bg-rose-600 text-white' : 'text-stone-400 hover:text-white'"
                    class="px-2 py-1 rounded text-xs cursor-pointer transition-colors"
                  >
                    يمين
                  </button>
                </div>
              </div>

              <!-- Tashkeel Diacritics Toggle -->
              <div class="flex items-center justify-between">
                <div>
                  <span class="text-stone-300 font-medium block">تمييز علامات التشكيل الفخمة:</span>
                  <span class="text-[10px] text-stone-500">إبراز الحركات اللغوية بلون جمالي هادئ</span>
                </div>
                <button
                  (click)="toggleTashkeelHighlight()"
                  [class]="settings().highlightTashkeel ? 'bg-rose-600 text-white' : 'bg-stone-950 border border-white/10 text-stone-400'"
                  class="px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer"
                >
                  {{ settings().highlightTashkeel ? 'مُمكَّن' : 'معطل' }}
                </button>
              </div>
            </div>

          </div>

          <!-- Drawer Footer -->
          <div class="p-4 border-t border-white/10 bg-stone-950/80 flex items-center justify-between">
            <button
              (click)="resetSettings()"
              class="text-xs text-stone-400 hover:text-rose-400 transition-colors cursor-pointer flex items-center gap-1"
            >
              <mat-icon class="text-sm">restart_alt</mat-icon>
              <span>إعادة ضبط المظهر</span>
            </button>

            <button
              (click)="closeDrawers()"
              class="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs transition-colors cursor-pointer"
            >
              تم
            </button>
          </div>
        </div>
      }

      <!-- MAIN READING CANVAS / ARTICLE -->
      <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-14">
        <article [class]="'mx-auto transition-all duration-300 ' + getWidthClass()">
          
          <!-- Elegant Novel & Chapter Breadcrumb Header -->
          <header class="mb-10 sm:mb-14 text-center space-y-4 pb-8 border-b border-current/10">
            
            <nav class="flex items-center justify-center gap-2 text-xs opacity-60 font-sans" aria-label="مسار التصفح">
              <a routerLink="/" class="hover:text-rose-500 transition-colors">الرئيسية</a>
              <span>/</span>
              <a [routerLink]="['/novel', currentNovel()?.id]" class="hover:text-rose-500 transition-colors truncate max-w-[200px]">
                {{ currentNovel()?.title }}
              </a>
              <span>/</span>
              <span class="text-rose-500 font-bold">الفصل {{ currentChapter()?.chapterIndex || 1 }}</span>
            </nav>

            <!-- Chapter Main Title -->
            <h1
              [class]="'text-2xl sm:text-4xl md:text-5xl font-black leading-tight sm:leading-snug ' + getFontFamilyClass()"
            >
              {{ currentChapter()?.title || 'جاري تحميل عنوان الفصل...' }}
            </h1>

            <!-- Stylized Arabesque Ornamental Divider -->
            <div class="flex items-center justify-center gap-3 py-1 opacity-70">
              <div class="h-px w-12 sm:w-20 bg-gradient-to-l from-transparent to-current/30"></div>
              <span class="text-rose-500 text-sm font-serif">✤ ✦ ✤</span>
              <div class="h-px w-12 sm:w-20 bg-gradient-to-r from-transparent to-current/30"></div>
            </div>

            <!-- Novel Author & Chapter Word Stats -->
            <div class="flex flex-wrap items-center justify-center gap-3 sm:gap-6 text-xs opacity-75 font-sans">
              <div class="flex items-center gap-1.5">
                <mat-icon class="text-sm text-rose-500">auto_stories</mat-icon>
                <span>بقلم <strong>{{ currentNovel()?.author }}</strong></span>
              </div>

              @if (currentNovel()?.translator) {
                <div class="flex items-center gap-1.5">
                  <mat-icon class="text-sm text-rose-500">translate</mat-icon>
                  <span>ترجمة <strong>{{ currentNovel()?.translator }}</strong></span>
                </div>
              }

              <div class="flex items-center gap-1.5">
                <mat-icon class="text-sm text-rose-500">description</mat-icon>
                <span>{{ currentChapter()?.wordCount || 0 }} كلمة</span>
              </div>

              <div class="flex items-center gap-1.5">
                <mat-icon class="text-sm text-rose-500">schedule</mat-icon>
                <span>{{ readingTimeMinutes() }} دقائق للقراءة</span>
              </div>
            </div>

          </header>

          <!-- DECODING / LOADING STATE -->
          @if (store.isDecoding()) {
            <div class="py-24 flex flex-col items-center justify-center gap-4 text-center">
              <div class="w-14 h-14 rounded-2xl bg-rose-600/10 border border-rose-500/30 flex items-center justify-center text-rose-500 animate-spin">
                <mat-icon class="text-3xl">auto_stories</mat-icon>
              </div>
              <div class="space-y-1">
                <h4 class="font-bold text-base font-amiri">جاري تجهيز النص الأدبي وتنسيقه...</h4>
                <p class="text-xs opacity-60">يتم تحميل بيانات الفصل بجودة فائقة لراحتك</p>
              </div>
            </div>
          } @else {
            <!-- NOVEL CHAPTER PARAGRAPHS (LITERARY BODY) -->
            <div
              [class]="'transition-all duration-300 ' + getFontFamilyClass() + ' ' + getTextAlignClass() + ' ' + getParagraphSpacingClass()"
              [style.font-size.px]="settings().fontSize"
              [style.line-height]="settings().lineHeight"
            >
              @for (paragraph of chapterParagraphs(); track $index) {
                <p
                  class="indent-6 sm:indent-10 tracking-normal transition-all"
                  [innerHTML]="formatParagraph(paragraph)"
                ></p>
              } @empty {
                <div class="py-20 text-center opacity-60 text-sm">
                  لا يتوفر نص في هذا الفصل حالياً.
                </div>
              }
            </div>
          }

          <!-- CHAPTER BOTTOM COMPREHENSIVE CONTROLS -->
          <footer class="mt-16 sm:mt-24 pt-8 sm:pt-12 border-t border-current/10 space-y-8">
            
            <!-- Previous & Next Chapters Grand Navigation Cards -->
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              
              <!-- Previous Chapter Button -->
              <button
                (click)="goToPrevChapter()"
                [disabled]="isFirstChapter()"
                class="group p-4 rounded-2xl border border-current/15 disabled:opacity-30 disabled:cursor-not-allowed hover:border-rose-500/40 hover:bg-black/5 dark:hover:bg-white/5 transition-all cursor-pointer text-right flex items-center gap-3.5"
              >
                <div class="w-10 h-10 rounded-xl bg-current/5 border border-current/10 flex items-center justify-center text-rose-500 group-hover:scale-110 transition-transform shrink-0">
                  <mat-icon>arrow_forward</mat-icon>
                </div>
                <div class="min-w-0 flex-1">
                  <span class="text-[11px] opacity-60 block font-sans">الفصل السابق</span>
                  <strong class="text-xs sm:text-sm font-bold font-amiri truncate block group-hover:text-rose-400 transition-colors">
                    {{ prevChapterTitle() }}
                  </strong>
                </div>
              </button>

              <!-- Next Chapter Button -->
              <button
                (click)="goToNextChapter()"
                [disabled]="isLastChapter()"
                class="group p-4 rounded-2xl bg-gradient-to-l from-rose-600 to-rose-700 text-white disabled:opacity-30 disabled:cursor-not-allowed hover:from-rose-500 hover:to-rose-600 transition-all cursor-pointer text-left flex items-center justify-between gap-3.5 shadow-lg shadow-rose-950/40"
              >
                <div class="min-w-0 flex-1 text-right">
                  <span class="text-[11px] text-rose-200 block font-sans">الفصل التالي</span>
                  <strong class="text-xs sm:text-sm font-bold font-amiri truncate block text-white">
                    {{ nextChapterTitle() }}
                  </strong>
                </div>
                <div class="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center text-white group-hover:scale-110 transition-transform shrink-0">
                  <mat-icon>arrow_back</mat-icon>
                </div>
              </button>

            </div>

            <!-- Additional Auxiliary Action Bar -->
            <div class="flex flex-wrap items-center justify-between gap-3 p-4 rounded-2xl border border-current/10 bg-current/5">
              
              <div class="flex items-center gap-2">
                <button
                  (click)="toggleChapterDrawer()"
                  class="px-3 py-2 rounded-xl border border-current/10 hover:bg-current/10 transition-colors cursor-pointer text-xs flex items-center gap-1.5 font-medium"
                >
                  <mat-icon class="text-base text-rose-500">format_list_numbered_rtl</mat-icon>
                  <span>فهرس الفصول</span>
                </button>

                <a
                  [routerLink]="['/novel', currentNovel()?.id]"
                  class="px-3 py-2 rounded-xl border border-current/10 hover:bg-current/10 transition-colors cursor-pointer text-xs flex items-center gap-1.5 font-medium"
                >
                  <mat-icon class="text-base text-rose-500">auto_stories</mat-icon>
                  <span>تفاصيل الرواية</span>
                </a>
              </div>

              <div class="flex items-center gap-2">
                <button
                  (click)="shareChapter()"
                  class="px-3 py-2 rounded-xl border border-current/10 hover:bg-current/10 transition-colors cursor-pointer text-xs flex items-center gap-1.5 font-medium"
                >
                  <mat-icon class="text-base text-rose-500">share</mat-icon>
                  <span>مشاركة الفصل</span>
                </button>

                <button
                  (click)="scrollToTop()"
                  class="px-3 py-2 rounded-xl border border-current/10 hover:bg-current/10 transition-colors cursor-pointer text-xs flex items-center gap-1.5 font-medium"
                >
                  <mat-icon class="text-base text-rose-500">vertical_align_top</mat-icon>
                  <span>للأعلى</span>
                </button>
              </div>

            </div>

            @if (shareToast()) {
              <div class="text-center p-3 rounded-xl bg-emerald-950/50 border border-emerald-500/40 text-emerald-400 text-xs font-bold animate-in fade-in">
                {{ shareToast() }}
              </div>
            }

          </footer>

        </article>
      </main>

      <!-- FLOATING QUICK NAVIGATION DOCK (Bottom Bar) -->
      @if (showFloatingDock()) {
        <aside
          class="fixed bottom-5 left-1/2 -translate-x-1/2 z-40 px-3 py-2 rounded-2xl liquid-glass border border-white/15 shadow-2xl flex items-center gap-2 text-white text-xs backdrop-blur-xl animate-in fade-in slide-in-from-bottom-3"
          aria-label="شريط التنقل السريع"
        >
          <!-- Prev -->
          <button
            (click)="goToPrevChapter()"
            [disabled]="isFirstChapter()"
            title="الفصل السابق"
            class="p-1.5 rounded-xl hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
          >
            <mat-icon class="text-base">chevron_right</mat-icon>
          </button>

          <!-- Index Drawer -->
          <button
            (click)="toggleChapterDrawer()"
            title="قائمة الفصول"
            class="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-white/10 hover:bg-white/20 transition-colors cursor-pointer font-bold"
          >
            <span class="text-[11px]">فصل {{ currentChapter()?.chapterIndex || 1 }}</span>
            <span class="opacity-50">/</span>
            <span class="text-[10px] opacity-70">{{ currentNovel()?.chapters?.length || 0 }}</span>
          </button>

          <!-- Scroll Percentage -->
          <div class="px-2 py-1 rounded-xl bg-rose-600/30 text-rose-300 font-mono text-[11px] font-bold border border-rose-500/30">
            {{ scrollProgress() }}%
          </div>

          <!-- Next -->
          <button
            (click)="goToNextChapter()"
            [disabled]="isLastChapter()"
            title="الفصل التالي"
            class="p-1.5 rounded-xl hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
          >
            <mat-icon class="text-base">chevron_left</mat-icon>
          </button>

          <div class="h-4 w-px bg-white/20 mx-0.5"></div>

          <!-- Top Scroll -->
          <button
            (click)="scrollToTop()"
            title="الصعود لبداية الصفحة"
            class="p-1.5 rounded-xl hover:bg-white/10 transition-colors cursor-pointer text-stone-300 hover:text-white"
          >
            <mat-icon class="text-base">keyboard_arrow_up</mat-icon>
          </button>
        </aside>
      }

    </div>
  `,
})
export class NovelReader implements OnInit, OnDestroy {
  readonly store = inject(NovelStore);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  // Component Signals
  readonly showChapterDrawer = signal<boolean>(false);
  readonly showSettingsDrawer = signal<boolean>(false);
  readonly isZenMode = signal<boolean>(false);
  readonly scrollProgress = signal<number>(0);
  readonly showFloatingDock = signal<boolean>(false);
  readonly chapterSearchQuery = signal<string>('');
  readonly shareToast = signal<string>('');

  // Auto-scroll signals
  readonly isAutoScrolling = signal<boolean>(false);
  readonly autoScrollSpeed = signal<AutoScrollSpeed>(1);
  private autoScrollInterval: ReturnType<typeof setInterval> | null = null;

  // TTS signals
  readonly isSpeaking = signal<boolean>(false);
  private speechSynthesisUtterance: SpeechSynthesisUtterance | null = null;

  // Shortcuts & Store aliases
  readonly settings = this.store.readerSettings;
  readonly currentNovel = this.store.selectedNovel;
  readonly currentChapter = this.store.selectedChapter;

  constructor() {
    // When novels are available and nothing is selected, pick the first
    effect(() => {
      const novels = this.store.novels();
      if (!this.store.selectedNovel() && novels.length > 0) {
        this.store.selectNovel(novels[0].id);
      }
    });
  }

  ngOnInit(): void {
    // Listen for route params if provided (e.g., /reader/:novelId/:chapterId)
    this.route.paramMap.subscribe(params => {
      const novelId = params.get('novelId');
      const chapterId = params.get('chapterId');

      if (novelId) {
        this.store.selectNovel(novelId);
        if (chapterId) {
          this.store.selectChapter(novelId, chapterId);
        }
      }
    });

    if (typeof window !== 'undefined') {
      window.addEventListener('scroll', this.onWindowScroll, { passive: true });
    }
  }

  ngOnDestroy(): void {
    this.stopAutoScroll();
    this.stopTts();
    if (typeof window !== 'undefined') {
      window.removeEventListener('scroll', this.onWindowScroll);
    }
  }

  // Window scroll handler for progress bar and floating dock
  private readonly onWindowScroll = () => {
    if (typeof window === 'undefined') return;
    const doc = document.documentElement;
    const scrollTop = window.scrollY || doc.scrollTop;
    const scrollHeight = doc.scrollHeight - doc.clientHeight;

    if (scrollHeight > 0) {
      const pct = Math.min(100, Math.max(0, Math.round((scrollTop / scrollHeight) * 100)));
      this.scrollProgress.set(pct);
    }

    // Show floating dock only when scrolled down enough (> 300px)
    this.showFloatingDock.set(scrollTop > 300);
  };

  @HostListener('window:keydown', ['$event'])
  handleKeyboardEvent(event: KeyboardEvent): void {
    // Escape closes drawers or exits Zen mode
    if (event.key === 'Escape') {
      if (this.showChapterDrawer() || this.showSettingsDrawer()) {
        this.closeDrawers();
      } else if (this.isZenMode()) {
        this.isZenMode.set(false);
      }
    }
    // Arrow Right (next in RTL or prev based on standard reading)
    if (event.key === 'ArrowRight' && (event.altKey || event.ctrlKey)) {
      this.goToPrevChapter();
    }
    if (event.key === 'ArrowLeft' && (event.altKey || event.ctrlKey)) {
      this.goToNextChapter();
    }
  }

  // Paragraph splitting and formatting
  readonly chapterParagraphs = computed<string[]>(() => {
    const raw = this.store.currentChapterText();
    if (!raw) return [];
    return raw
      .split(/\n\s*\n/)
      .map(p => p.trim())
      .filter(p => p.length > 0);
  });

  readonly filteredChapters = computed<ChapterSummary[]>(() => {
    const novel = this.currentNovel();
    if (!novel) return [];
    const q = this.chapterSearchQuery().trim().toLowerCase();
    if (!q) return novel.chapters;

    return novel.chapters.filter(ch =>
      ch.title.toLowerCase().includes(q) ||
      ch.chapterIndex.toString().includes(q)
    );
  });

  readonly isFirstChapter = computed<boolean>(() => {
    const novel = this.currentNovel();
    const chapter = this.currentChapter();
    if (!novel || !chapter) return true;
    return novel.chapters.findIndex(c => c.id === chapter.id) <= 0;
  });

  readonly isLastChapter = computed<boolean>(() => {
    const novel = this.currentNovel();
    const chapter = this.currentChapter();
    if (!novel || !chapter) return true;
    const idx = novel.chapters.findIndex(c => c.id === chapter.id);
    return idx === novel.chapters.length - 1;
  });

  readonly prevChapterTitle = computed<string>(() => {
    const novel = this.currentNovel();
    const chapter = this.currentChapter();
    if (!novel || !chapter) return 'لا يوجد فصل سابق';
    const idx = novel.chapters.findIndex(c => c.id === chapter.id);
    if (idx > 0) {
      return novel.chapters[idx - 1].title;
    }
    return 'أنت في بداية الرواية';
  });

  readonly nextChapterTitle = computed<string>(() => {
    const novel = this.currentNovel();
    const chapter = this.currentChapter();
    if (!novel || !chapter) return 'لا يوجد فصل تالٍ';
    const idx = novel.chapters.findIndex(c => c.id === chapter.id);
    if (idx >= 0 && idx < novel.chapters.length - 1) {
      return novel.chapters[idx + 1].title;
    }
    return 'وصلت إلى آخر فصل متوفر حالياً';
  });

  readonly readingTimeMinutes = computed<number>(() => {
    const words = this.currentChapter()?.wordCount || 0;
    return Math.max(1, Math.ceil(words / 180));
  });

  readonly isBookmarked = computed<boolean>(() => {
    const novel = this.currentNovel();
    if (!novel) return false;
    return this.store.isBookmarked(novel.id);
  });

  // Navigation Methods
  goToPrevChapter(): void {
    this.store.goToPrevChapter();
    this.syncUrlWithCurrentChapter();
    this.scrollToTop();
  }

  goToNextChapter(): void {
    this.store.goToNextChapter();
    this.syncUrlWithCurrentChapter();
    this.scrollToTop();
  }

  selectChapterFromDrawer(chapterId: string): void {
    const novel = this.currentNovel();
    if (novel) {
      this.store.selectChapter(novel.id, chapterId);
      this.syncUrlWithCurrentChapter();
      this.closeDrawers();
      this.scrollToTop();
    }
  }

  private syncUrlWithCurrentChapter(): void {
    const novel = this.currentNovel();
    const chapter = this.currentChapter();
    if (novel && chapter) {
      this.router.navigate(['/reader', novel.id, chapter.id], { replaceUrl: true });
    }
  }

  backToNovelDetails(): void {
    const novel = this.currentNovel();
    if (novel) {
      this.router.navigate(['/novel', novel.id]);
    } else {
      this.router.navigate(['/']);
    }
  }

  scrollToTop(): void {
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  // Drawers & Modals
  toggleChapterDrawer(): void {
    this.showSettingsDrawer.set(false);
    this.showChapterDrawer.update(v => !v);
  }

  toggleSettingsDrawer(): void {
    this.showChapterDrawer.set(false);
    this.showSettingsDrawer.update(v => !v);
  }

  closeDrawers(): void {
    this.showChapterDrawer.set(false);
    this.showSettingsDrawer.set(false);
  }

  toggleZenMode(): void {
    this.closeDrawers();
    this.isZenMode.update(v => !v);
  }

  onSearchChapter(event: Event): void {
    const val = (event.target as HTMLInputElement).value;
    this.chapterSearchQuery.set(val);
  }

  toggleBookmark(): void {
    const novel = this.currentNovel();
    if (novel) {
      this.store.toggleBookmark(novel.id);
    }
  }

  shareChapter(): void {
    if (typeof window !== 'undefined') {
      const url = window.location.href;
      if (navigator.clipboard) {
        navigator.clipboard.writeText(url).then(() => {
          this.shareToast.set('تم نسخ رابط هذا الفصل إلى الحافظة بنجاح!');
          setTimeout(() => this.shareToast.set(''), 3000);
        });
      }
    }
  }

  // Settings Actions
  setTheme(theme: ReaderTheme): void {
    this.store.updateReaderSettings({ theme });
  }

  setFont(fontFamily: ReaderFont): void {
    this.store.updateReaderSettings({ fontFamily });
  }

  changeFontSize(delta: number): void {
    const current = this.settings().fontSize;
    const next = Math.min(36, Math.max(16, current + delta));
    this.store.updateReaderSettings({ fontSize: next });
  }

  setFontSizeDirect(size: number): void {
    this.store.updateReaderSettings({ fontSize: size });
  }

  onFontSizeSlider(event: Event): void {
    const val = Number((event.target as HTMLInputElement).value);
    this.store.updateReaderSettings({ fontSize: val });
  }

  setLineHeight(lineHeight: number): void {
    this.store.updateReaderSettings({ lineHeight });
  }

  setWidth(pageWidth: ReaderWidth): void {
    this.store.updateReaderSettings({ pageWidth });
  }

  setTextAlign(textAlign: 'justify' | 'right'): void {
    this.store.updateReaderSettings({ textAlign });
  }

  toggleTashkeelHighlight(): void {
    this.store.updateReaderSettings({ highlightTashkeel: !this.settings().highlightTashkeel });
  }

  resetSettings(): void {
    this.store.updateReaderSettings({
      theme: 'dark',
      fontFamily: 'amiri',
      fontSize: 21,
      lineHeight: 2.2,
      pageWidth: 'normal',
      highlightTashkeel: false,
      textAlign: 'justify',
    });
  }

  // Auto Scroll Engine
  toggleAutoScroll(): void {
    if (this.isAutoScrolling()) {
      // Cycle speed or stop
      const current = this.autoScrollSpeed();
      if (current === 1) {
        this.autoScrollSpeed.set(2);
        this.restartAutoScroll();
      } else if (current === 2) {
        this.autoScrollSpeed.set(3);
        this.restartAutoScroll();
      } else {
        this.stopAutoScroll();
      }
    } else {
      this.isAutoScrolling.set(true);
      this.autoScrollSpeed.set(1);
      this.startAutoScroll();
    }
  }

  private startAutoScroll(): void {
    this.stopAutoScroll();
    if (typeof window === 'undefined') return;

    const speed = this.autoScrollSpeed();
    const intervalMs = speed === 1 ? 50 : speed === 2 ? 30 : 18;

    this.autoScrollInterval = setInterval(() => {
      window.scrollBy({ top: 1, behavior: 'smooth' });
      // If reached bottom, stop
      const doc = document.documentElement;
      if (window.scrollY + window.innerHeight >= doc.scrollHeight - 5) {
        this.stopAutoScroll();
      }
    }, intervalMs);
  }

  private restartAutoScroll(): void {
    if (this.isAutoScrolling()) {
      this.startAutoScroll();
    }
  }

  private stopAutoScroll(): void {
    if (this.autoScrollInterval) {
      clearInterval(this.autoScrollInterval);
      this.autoScrollInterval = null;
    }
    this.isAutoScrolling.set(false);
  }

  // Arabic Text-to-Speech (TTS)
  toggleTts(): void {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      this.shareToast.set('ميزة النطق الصوتي غير مدعومة في هذا المتصفح');
      setTimeout(() => this.shareToast.set(''), 3000);
      return;
    }

    if (this.isSpeaking()) {
      this.stopTts();
    } else {
      this.startTts();
    }
  }

  private startTts(): void {
    if (typeof window === 'undefined') return;
    const text = this.store.currentChapterText();
    if (!text) return;

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'ar-SA';
    utterance.rate = 0.95;

    // Pick an Arabic voice if available
    const voices = window.speechSynthesis.getVoices();
    const arabicVoice = voices.find(v => v.lang.startsWith('ar'));
    if (arabicVoice) {
      utterance.voice = arabicVoice;
    }

    utterance.onend = () => {
      this.isSpeaking.set(false);
    };
    utterance.onerror = () => {
      this.isSpeaking.set(false);
    };

    this.speechSynthesisUtterance = utterance;
    window.speechSynthesis.speak(utterance);
    this.isSpeaking.set(true);
  }

  private stopTts(): void {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    this.isSpeaking.set(false);
  }

  // Theme Helpers
  getThemeContainerClass(): string {
    switch (this.settings().theme) {
      case 'sepia':
        return 'bg-[#f8f2e4] text-[#2d2417]';
      case 'light':
        return 'bg-[#faf9f5] text-[#1e2428]';
      case 'black':
        return 'bg-black text-[#d6d2cb]';
      case 'dark':
      default:
        return 'bg-[#151318] text-[#e6e2da]';
    }
  }

  getNavbarThemeClass(): string {
    switch (this.settings().theme) {
      case 'sepia':
        return 'bg-[#f0e7d3]/95 border-[#dfd4bd] text-[#2d2417] shadow-sm';
      case 'light':
        return 'bg-[#ffffff]/95 border-stone-200 text-stone-900 shadow-sm';
      case 'black':
        return 'bg-black/95 border-stone-900 text-[#d6d2cb]';
      case 'dark':
      default:
        return 'bg-[#121015]/90 border-white/5 text-[#e6e2da] shadow-sm';
    }
  }

  getThemeName(): string {
    switch (this.settings().theme) {
      case 'sepia':
        return 'ورق بردي (سيبيا)';
      case 'light':
        return 'نهاري ناصع';
      case 'black':
        return 'أموليد أسود';
      case 'dark':
      default:
        return 'داكن ملكي';
    }
  }

  getFontFamilyClass(): string {
    switch (this.settings().fontFamily) {
      case 'amiri':
        return 'font-amiri';
      case 'cairo':
        return 'font-cairo';
      case 'tajawal':
        return 'font-tajawal';
      case 'system':
      default:
        return 'font-sans';
    }
  }

  getWidthClass(): string {
    switch (this.settings().pageWidth) {
      case 'narrow':
        return 'max-w-2xl'; // ~672px
      case 'wide':
        return 'max-w-5xl'; // ~1024px
      case 'full':
        return 'max-w-full px-2 sm:px-4';
      case 'normal':
      default:
        return 'max-w-3xl'; // ~768px - optimal reading width
    }
  }

  getTextAlignClass(): string {
    return this.settings().textAlign === 'right' ? 'text-right' : 'text-justify';
  }

  getParagraphSpacingClass(): string {
    return 'space-y-6 sm:space-y-8';
  }

  formatParagraph(text: string): string {
    if (!this.settings().highlightTashkeel) {
      return text;
    }
    // Highlighting Arabic diacritics in soft glowing crimson/amber
    return text.replace(/([\u064B-\u065F\u0670])/g, '<span class="text-rose-500 font-bold">$1</span>');
  }
}
