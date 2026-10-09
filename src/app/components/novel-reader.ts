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
import { AuthStore } from '../core/auth-store';
import {
  ChapterSummary,
  ParagraphSpacing,
  ReaderAlign,
  ReaderFont,
  ReaderTheme,
  ReaderWeight,
  ReaderWidth,
} from '../core/novel-models';

type AutoScrollSpeed = 1 | 2 | 3;

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-novel-reader',
  imports: [MatIconModule, RouterLink],
  template: `
    <div
      [class]="'min-h-screen transition-colors duration-300 relative selection:bg-rose-500/30 ' + getThemeContainerClass()"
      (mousemove)="onMouseMove($event)"
    >
      <!-- Optional Eye Comfort Dimmer Overlay -->
      @if (settings().screenDimmer && (settings().screenDimmer ?? 0) > 0) {
        <div
          class="fixed inset-0 z-30 pointer-events-none bg-black transition-opacity duration-300"
          [style.opacity]="(settings().screenDimmer ?? 0) / 100"
        ></div>
      }

      <!-- Optional Reading Focus Ruler Guide -->
      @if (settings().readingRuler && rulerY() > 0) {
        <div
          class="fixed left-0 right-0 z-20 pointer-events-none h-10 border-y border-rose-500/25 bg-rose-500/5 transition-transform duration-75"
          [style.top.px]="rulerY() - 20"
        ></div>
      }

      <!-- COMPACT REFINED TOP READER BAR (No clutters, compressed tools) -->
      @if (!isZenMode()) {
        <header
          [class]="'sticky top-0 z-40 border-b backdrop-blur-xl px-3 sm:px-6 py-2 sm:py-2.5 transition-all duration-300 ' + getNavbarThemeClass()"
        >
          <div class="max-w-7xl mx-auto flex items-center justify-between gap-2 sm:gap-4">
            
            <!-- RIGHT (RTL First): Back Navigation & Novel/Chapter Info -->
            <div class="flex items-center gap-2 sm:gap-3 min-w-0">
              <button
                (click)="backToNovelDetails()"
                title="العودة لتفاصيل الرواية"
                class="p-2 rounded-xl transition-all cursor-pointer flex items-center justify-center shrink-0 border border-transparent hover:border-current/20 hover:bg-current/10 active:scale-95 text-inherit"
                aria-label="العودة لتفاصيل الرواية"
              >
                <mat-icon class="text-xl">arrow_forward</mat-icon>
              </button>

              <div class="flex flex-col min-w-0">
                <div class="flex items-center gap-2">
                  <a
                    [routerLink]="['/novel', currentNovel()?.id]"
                    class="text-xs sm:text-sm font-bold truncate hover:text-rose-500 transition-colors font-amiri"
                    title="{{ currentNovel()?.title }}"
                  >
                    {{ currentNovel()?.title || 'مقاتل الروايات' }}
                  </a>
                  @if (currentNovel()?.author) {
                    <span class="text-[11px] opacity-60 hidden md:inline truncate">
                      · {{ currentNovel()?.author }}
                    </span>
                  }
                </div>

                <div class="flex items-center gap-2 text-[11px] opacity-80 truncate">
                  <span class="font-medium text-rose-500 truncate">
                    فصل {{ currentChapter()?.chapterIndex || 1 }}: {{ currentChapter()?.title }}
                  </span>
                  <span class="hidden sm:inline opacity-50">·</span>
                  <span class="hidden sm:inline text-[10px] opacity-70">{{ readingTimeMinutes() }} د قراءة</span>
                </div>
              </div>
            </div>

            <!-- LEFT: Compressed Reader Controls (Prev/Next, Index, Appearance, Compressed Tools) -->
            <div class="flex items-center gap-1.5 sm:gap-2 shrink-0">
              
              <!-- Quick Compact Prev / Next Chevrons -->
              <div class="flex items-center border border-current/15 rounded-xl p-0.5">
                <button
                  (click)="goToPrevChapter()"
                  [disabled]="isFirstChapter()"
                  title="الفصل السابق"
                  class="p-1 sm:p-1.5 rounded-lg disabled:opacity-25 disabled:cursor-not-allowed hover:bg-current/10 transition-colors cursor-pointer text-xs flex items-center"
                >
                  <mat-icon class="text-base sm:text-lg">chevron_right</mat-icon>
                  <span class="hidden xl:inline text-[11px] font-sans pr-0.5">السابق</span>
                </button>

                <span class="w-px h-3.5 bg-current/15 mx-0.5"></span>

                <button
                  (click)="goToNextChapter()"
                  [disabled]="isLastChapter()"
                  title="الفصل التالي"
                  class="p-1 sm:p-1.5 rounded-lg disabled:opacity-25 disabled:cursor-not-allowed hover:bg-current/10 transition-colors cursor-pointer text-xs flex items-center"
                >
                  <span class="hidden xl:inline text-[11px] font-sans pl-0.5">التالي</span>
                  <mat-icon class="text-base sm:text-lg">chevron_left</mat-icon>
                </button>
              </div>

              <!-- Chapter Index Drawer Toggle -->
              <button
                (click)="toggleChapterDrawer()"
                [class]="showChapterDrawer() ? 'bg-rose-600 text-white shadow-sm' : 'hover:bg-current/10 border border-current/15 text-inherit'"
                title="فهرس فصول الرواية"
                class="px-2 sm:px-3 py-1.5 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 text-xs font-medium"
              >
                <mat-icon class="text-base">format_list_numbered_rtl</mat-icon>
                <span class="hidden md:inline text-xs">الفهرس</span>
              </button>

              <!-- Reader Appearance Settings Toggle -->
              <button
                (click)="toggleSettingsDrawer()"
                [class]="showSettingsDrawer() ? 'bg-rose-600 text-white shadow-sm' : 'hover:bg-current/10 border border-current/15 text-inherit'"
                title="تخصيص الخط والمظهر والقراءة"
                class="px-2 sm:px-3 py-1.5 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 text-xs font-medium"
              >
                <mat-icon class="text-base">tune</mat-icon>
                <span class="hidden md:inline text-xs">المظهر</span>
              </button>

              <!-- COMPRESSED TOOLS TOGGLE (Hides auto-scroll, TTS, bookmark, etc. behind clean menu) -->
              <div class="relative">
                <button
                  (click)="toggleToolsMenu()"
                  [class]="showToolsMenu() || isAutoScrolling() || isSpeaking()
                    ? 'bg-rose-600 text-white shadow-sm'
                    : 'hover:bg-current/10 border border-current/15 text-inherit'"
                  title="أدوات القراءة والميزات الإضافية"
                  class="p-1.5 sm:px-2.5 sm:py-1.5 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 text-xs font-medium relative"
                >
                  <mat-icon class="text-base">more_horiz</mat-icon>
                  <span class="hidden lg:inline text-xs">الأدوات</span>
                  @if (isAutoScrolling() || isSpeaking() || isBookmarked()) {
                    <span class="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-rose-500 ring-2 ring-stone-900 animate-pulse"></span>
                  }
                </button>

                <!-- Tools Popover Menu (Compressed cleanly) -->
                @if (showToolsMenu()) {
                  <div
                    class="absolute left-0 mt-2 w-64 rounded-2xl bg-stone-900 text-stone-100 border border-white/10 shadow-2xl p-2.5 space-y-1.5 z-50 animate-in fade-in slide-in-from-top-2"
                  >
                    <div class="px-2.5 py-1.5 border-b border-white/10 flex items-center justify-between">
                      <span class="text-[11px] font-bold text-stone-300">أدوات القراءة الذكية</span>
                      <button (click)="closeToolsMenu()" class="text-stone-400 hover:text-white p-0.5 rounded cursor-pointer">
                        <mat-icon class="text-sm">close</mat-icon>
                      </button>
                    </div>

                    <!-- Auto Scroll Toggle & Speed in Tools -->
                    <div class="p-2 rounded-xl bg-stone-950/60 border border-white/5 space-y-2">
                      <div class="flex items-center justify-between">
                        <div class="flex items-center gap-2">
                          <mat-icon class="text-sm text-amber-400">swap_vert</mat-icon>
                          <span class="text-xs font-medium">التمرير التلقائي</span>
                        </div>
                        <button
                          (click)="toggleAutoScroll()"
                          [class]="isAutoScrolling() ? 'bg-amber-500 text-stone-950 font-bold' : 'bg-white/10 text-stone-300'"
                          class="px-2.5 py-1 rounded-lg text-[11px] transition-colors cursor-pointer"
                        >
                          {{ isAutoScrolling() ? 'تشغيل (' + autoScrollSpeed() + 'x)' : 'معطل' }}
                        </button>
                      </div>

                      @if (isAutoScrolling()) {
                        <div class="flex items-center justify-between gap-1 pt-1 border-t border-white/10 text-[10px]">
                          <span class="text-stone-400">سرعة التمرير:</span>
                          <div class="flex items-center gap-1">
                            @for (spd of [1, 2, 3]; track spd) {
                              <button
                                (click)="setAutoScrollSpeed(spd)"
                                [class]="autoScrollSpeed() === spd ? 'bg-amber-500 text-stone-950 font-bold' : 'bg-stone-800 text-stone-300'"
                                class="px-2 py-0.5 rounded cursor-pointer font-mono"
                              >
                                {{ spd }}x
                              </button>
                            }
                          </div>
                        </div>
                      }
                    </div>

                    <!-- Audio Narration TTS in Tools -->
                    <button
                      (click)="toggleTts()"
                      [class]="isSpeaking() ? 'bg-emerald-950/80 border-emerald-500/50 text-emerald-300 font-bold' : 'hover:bg-white/5 border border-transparent text-stone-300'"
                      class="w-full text-right p-2.5 rounded-xl transition-all cursor-pointer flex items-center justify-between text-xs"
                    >
                      <div class="flex items-center gap-2">
                        <mat-icon class="text-sm text-emerald-400">{{ isSpeaking() ? 'volume_up' : 'volume_mute' }}</mat-icon>
                        <span>القراءة الصوتية (ذكاء النطق)</span>
                      </div>
                      <span class="text-[10px] opacity-75">{{ isSpeaking() ? 'جاري القراءة' : 'تشغيل' }}</span>
                    </button>

                    <!-- Bookmark in Tools -->
                    <button
                      (click)="toggleBookmark()"
                      [class]="isBookmarked() ? 'bg-amber-950/60 border-amber-500/40 text-amber-300' : 'hover:bg-white/5 border border-transparent text-stone-300'"
                      class="w-full text-right p-2.5 rounded-xl transition-all cursor-pointer flex items-center justify-between text-xs"
                    >
                      <div class="flex items-center gap-2">
                        <mat-icon class="text-sm text-amber-400">{{ isBookmarked() ? 'bookmark' : 'bookmark_border' }}</mat-icon>
                        <span>حفظ الرواية في المفضلة</span>
                      </div>
                      <span class="text-[10px] opacity-75">{{ isBookmarked() ? 'محفوظة' : 'حفظ' }}</span>
                    </button>

                    <!-- Zen Mode in Tools -->
                    <button
                      (click)="toggleZenMode(); closeToolsMenu()"
                      class="w-full text-right p-2.5 rounded-xl hover:bg-white/5 text-stone-300 transition-all cursor-pointer flex items-center justify-between text-xs"
                    >
                      <div class="flex items-center gap-2">
                        <mat-icon class="text-sm text-rose-400">fullscreen</mat-icon>
                        <span>وضع التركيز الكامل (Zen)</span>
                      </div>
                      <span class="text-[10px] text-stone-500">إخفاء الأشرطة</span>
                    </button>

                    <!-- Fullscreen Browser Mode -->
                    <button
                      (click)="toggleFullscreen(); closeToolsMenu()"
                      class="w-full text-right p-2.5 rounded-xl hover:bg-white/5 text-stone-300 transition-all cursor-pointer flex items-center justify-between text-xs"
                    >
                      <div class="flex items-center gap-2">
                        <mat-icon class="text-sm text-rose-400">fit_screen</mat-icon>
                        <span>ملء الشاشة بالمتصفح</span>
                      </div>
                      <span class="text-[10px] text-stone-500">F11</span>
                    </button>

                    <!-- Share Chapter Link -->
                    <button
                      (click)="shareChapter(); closeToolsMenu()"
                      class="w-full text-right p-2.5 rounded-xl hover:bg-white/5 text-stone-300 transition-all cursor-pointer flex items-center justify-between text-xs"
                    >
                      <div class="flex items-center gap-2">
                        <mat-icon class="text-sm text-rose-400">share</mat-icon>
                        <span>مشاركة رابط الفصل</span>
                      </div>
                      <span class="text-[10px] text-stone-500">نسخ الرابط</span>
                    </button>

                    <!-- Scroll to Comments Shortcut -->
                    <button
                      (click)="scrollToComments(); closeToolsMenu()"
                      class="w-full text-right p-2.5 rounded-xl hover:bg-white/5 text-stone-300 transition-all cursor-pointer flex items-center justify-between text-xs"
                    >
                      <div class="flex items-center gap-2">
                        <mat-icon class="text-sm text-rose-400">forum</mat-icon>
                        <span>الذهاب لقسم التعليقات</span>
                      </div>
                      <span class="text-[10px] text-stone-500">نهاية الفصل</span>
                    </button>
                  </div>
                }
              </div>

            </div>

          </div>
        </header>
      }

      <!-- ZEN MODE MINIMAL EXIT PILL (Only appears in Zen Mode) -->
      @if (isZenMode()) {
        <div class="fixed top-4 left-4 z-50 flex items-center gap-2">
          <button
            (click)="toggleZenMode()"
            class="px-3.5 py-1.5 rounded-full bg-stone-900/90 border border-white/20 text-white text-xs flex items-center gap-1.5 shadow-xl hover:bg-stone-800 transition-all cursor-pointer backdrop-blur-md"
            title="الخروج من وضع التركيز"
          >
            <mat-icon class="text-sm">fullscreen_exit</mat-icon>
            <span>خروج من التركيز</span>
          </button>
        </div>
      }

      <!-- ACTIVE STATUS MINI FLOATING PILL (Only shown when Auto-Scroll or TTS is actively running) -->
      @if (isAutoScrolling() || isSpeaking()) {
        <div
          class="fixed bottom-5 left-5 z-40 flex items-center gap-2 p-1.5 rounded-2xl bg-stone-900/95 border border-white/15 text-white shadow-2xl backdrop-blur-md text-xs animate-in fade-in slide-in-from-bottom-2"
        >
          @if (isAutoScrolling()) {
            <div class="flex items-center gap-1.5 px-2 py-1 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/30">
              <mat-icon class="text-sm animate-spin">autorenew</mat-icon>
              <span>تمرير {{ autoScrollSpeed() }}x</span>
            </div>
            <button
              (click)="stopAutoScroll()"
              class="p-1 rounded-lg hover:bg-white/10 text-stone-300 hover:text-white transition-colors cursor-pointer"
              title="إيقاف التمرير"
            >
              <mat-icon class="text-base">pause</mat-icon>
            </button>
          }
          @if (isSpeaking()) {
            <div class="flex items-center gap-1.5 px-2 py-1 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              <mat-icon class="text-sm animate-pulse">volume_up</mat-icon>
              <span>نطق صوتي</span>
            </div>
            <button
              (click)="stopTts()"
              class="p-1 rounded-lg hover:bg-white/10 text-stone-300 hover:text-white transition-colors cursor-pointer"
              title="إيقاف القراءة الصوتية"
            >
              <mat-icon class="text-base">stop</mat-icon>
            </button>
          }
        </div>
      }

      <!-- CHAPTER INDEX DRAWER (Modal / Slide-over) -->
      @if (showChapterDrawer()) {
        <button
          type="button"
          aria-label="إغلاق فهرس الفصول"
          (click)="closeDrawers()"
          class="fixed inset-0 z-50 w-full h-full bg-black/60 backdrop-blur-sm transition-opacity cursor-pointer border-none"
        ></button>

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
                <h3 class="font-bold text-sm sm:text-base font-amiri">فهرس فصول الرواية</h3>
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
                placeholder="ابحث برقم الفصل أو عنوانه..."
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

      <!-- ENHANCED READER APPEARANCE & SETTINGS DRAWER -->
      @if (showSettingsDrawer()) {
        <button
          type="button"
          aria-label="إغلاق مظهر القراءة"
          (click)="closeDrawers()"
          class="fixed inset-0 z-50 w-full h-full bg-black/60 backdrop-blur-sm transition-opacity cursor-pointer border-none"
        ></button>

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
                <h3 class="font-bold text-sm sm:text-base font-amiri">تخصيص مظهر وتجربة القراءة</h3>
                <span class="text-xs text-stone-400">تحكم بالخط، المحاذاة، الألوان لراحة تامة</span>
              </div>
            </div>

            <button
              (click)="closeDrawers()"
              class="p-1.5 rounded-lg hover:bg-white/10 text-stone-400 hover:text-white transition-colors cursor-pointer"
            >
              <mat-icon class="text-xl">close</mat-icon>
            </button>
          </div>

          <!-- Drawer Body with Categorized Clean Sections -->
          <div class="flex-1 overflow-y-auto p-4 sm:p-5 space-y-6 text-xs">
            
            <!-- SECTION 1: Color Themes (6 Distinct Eye-Friendly Themes) -->
            <div class="space-y-2.5">
              <div class="flex items-center justify-between">
                <div class="font-bold text-stone-300 text-xs flex items-center gap-1.5">
                  <mat-icon class="text-sm text-rose-400">palette</mat-icon>
                  <span>السمة اللونية لراحة العين</span>
                </div>
                <span class="text-[11px] text-stone-400 font-medium">{{ getThemeName() }}</span>
              </div>

              <div class="grid grid-cols-2 gap-2">
                <!-- Royal Dark Theme -->
                <button
                  (click)="setTheme('dark')"
                  [class]="settings().theme === 'dark' ? 'ring-2 ring-rose-500 font-bold bg-[#141217]' : 'bg-[#141217]/80 opacity-70 hover:opacity-100'"
                  class="p-2.5 rounded-xl border border-white/10 flex items-center gap-2.5 transition-all cursor-pointer text-right"
                >
                  <div class="w-4 h-4 rounded-full bg-[#110f14] border border-rose-500/50 shadow-inner shrink-0"></div>
                  <div>
                    <span class="block text-white font-bold">داكن ملكي</span>
                    <span class="text-[10px] text-stone-400">الراحة الليلية</span>
                  </div>
                </button>

                <!-- AMOLED Black Theme -->
                <button
                  (click)="setTheme('black')"
                  [class]="settings().theme === 'black' ? 'ring-2 ring-rose-500 font-bold bg-black' : 'bg-black/90 opacity-70 hover:opacity-100'"
                  class="p-2.5 rounded-xl border border-stone-800 flex items-center gap-2.5 transition-all cursor-pointer text-right"
                >
                  <div class="w-4 h-4 rounded-full bg-black border border-stone-700 shadow-inner shrink-0"></div>
                  <div>
                    <span class="block text-stone-200 font-bold">أموليد أسود</span>
                    <span class="text-[10px] text-stone-500">سواد خالص</span>
                  </div>
                </button>

                <!-- Sepia / Parchment Theme -->
                <button
                  (click)="setTheme('sepia')"
                  [class]="settings().theme === 'sepia' ? 'ring-2 ring-amber-600 font-bold bg-[#f7f0e0]' : 'bg-[#f7f0e0]/80 opacity-70 hover:opacity-100'"
                  class="p-2.5 rounded-xl border border-amber-300 flex items-center gap-2.5 transition-all cursor-pointer text-right"
                >
                  <div class="w-4 h-4 rounded-full bg-[#f7f0e0] border border-amber-500 shadow-inner shrink-0"></div>
                  <div>
                    <span class="block text-[#2c2217] font-bold">ورق بردي (سيبيا)</span>
                    <span class="text-[10px] text-[#78644e]">دفء الكتب القديمة</span>
                  </div>
                </button>

                <!-- Clean Light Paper Theme -->
                <button
                  (click)="setTheme('light')"
                  [class]="settings().theme === 'light' ? 'ring-2 ring-rose-500 font-bold bg-[#faf9f6]' : 'bg-[#faf9f6]/80 opacity-70 hover:opacity-100'"
                  class="p-2.5 rounded-xl border border-stone-300 flex items-center gap-2.5 transition-all cursor-pointer text-right"
                >
                  <div class="w-4 h-4 rounded-full bg-white border border-stone-400 shadow-inner shrink-0"></div>
                  <div>
                    <span class="block text-stone-900 font-bold">نهاري ناصع</span>
                    <span class="text-[10px] text-stone-500">إضاءة بيضاء نقية</span>
                  </div>
                </button>

                <!-- Emerald Forest Night -->
                <button
                  (click)="setTheme('emerald')"
                  [class]="settings().theme === 'emerald' ? 'ring-2 ring-emerald-500 font-bold bg-[#0b1712]' : 'bg-[#0b1712]/80 opacity-70 hover:opacity-100'"
                  class="p-2.5 rounded-xl border border-emerald-900/60 flex items-center gap-2.5 transition-all cursor-pointer text-right"
                >
                  <div class="w-4 h-4 rounded-full bg-[#0b1712] border border-emerald-500 shadow-inner shrink-0"></div>
                  <div>
                    <span class="block text-emerald-200 font-bold">واحة زمردية</span>
                    <span class="text-[10px] text-emerald-400/80">تهدئة إجهاد العين</span>
                  </div>
                </button>

                <!-- Midnight Navy -->
                <button
                  (click)="setTheme('navy')"
                  [class]="settings().theme === 'navy' ? 'ring-2 ring-sky-500 font-bold bg-[#0a1220]' : 'bg-[#0a1220]/80 opacity-70 hover:opacity-100'"
                  class="p-2.5 rounded-xl border border-sky-900/60 flex items-center gap-2.5 transition-all cursor-pointer text-right"
                >
                  <div class="w-4 h-4 rounded-full bg-[#0a1220] border border-sky-500 shadow-inner shrink-0"></div>
                  <div>
                    <span class="block text-sky-200 font-bold">سماء كحلية</span>
                    <span class="text-[10px] text-sky-400/80">أزرق داكن هادئ</span>
                  </div>
                </button>
              </div>
            </div>

            <!-- SECTION 2: Text Alignment (RIGHT, CENTER, LEFT with RTL Direction, JUSTIFY) -->
            <!-- CRITICAL USER REQUIREMENT: Left alignment MUST keep direction RTL! -->
            <div class="space-y-2.5 pt-2 border-t border-white/10">
              <div class="font-bold text-stone-300 text-xs flex items-center justify-between">
                <div class="flex items-center gap-1.5">
                  <mat-icon class="text-sm text-rose-400">format_align_right</mat-icon>
                  <span>شكل ومحاذاة القراءة</span>
                </div>
                <span class="text-[10px] text-stone-400">اتجاه النص عربي أصيل</span>
              </div>

              <div class="grid grid-cols-4 gap-1.5 bg-stone-950/60 p-1.5 rounded-2xl border border-white/10">
                <!-- Right Alignment -->
                <button
                  (click)="setTextAlign('right')"
                  [class]="settings().textAlign === 'right' ? 'bg-rose-600 text-white font-bold shadow-sm' : 'text-stone-400 hover:text-white hover:bg-white/5'"
                  class="py-2 px-1 rounded-xl flex flex-col items-center gap-1 transition-all cursor-pointer"
                  title="الكتابة من اليمين"
                >
                  <mat-icon class="text-base">format_align_right</mat-icon>
                  <span class="text-[11px]">من اليمين</span>
                </button>

                <!-- Center Alignment -->
                <button
                  (click)="setTextAlign('center')"
                  [class]="settings().textAlign === 'center' ? 'bg-rose-600 text-white font-bold shadow-sm' : 'text-stone-400 hover:text-white hover:bg-white/5'"
                  class="py-2 px-1 rounded-xl flex flex-col items-center gap-1 transition-all cursor-pointer"
                  title="الكتابة من المنتصف (توسيط)"
                >
                  <mat-icon class="text-base">format_align_center</mat-icon>
                  <span class="text-[11px]">من المنتصف</span>
                </button>

                <!-- Left Alignment (Direction remains RTL, only text aligned left) -->
                <button
                  (click)="setTextAlign('left')"
                  [class]="settings().textAlign === 'left' ? 'bg-rose-600 text-white font-bold shadow-sm' : 'text-stone-400 hover:text-white hover:bg-white/5'"
                  class="py-2 px-1 rounded-xl flex flex-col items-center gap-1 transition-all cursor-pointer"
                  title="الكتابة من اليسار (مع الحفاظ على اتجاه وترابط الحروف العربية)"
                >
                  <mat-icon class="text-base">format_align_left</mat-icon>
                  <span class="text-[11px]">من اليسار</span>
                </button>

                <!-- Justify Alignment -->
                <button
                  (click)="setTextAlign('justify')"
                  [class]="settings().textAlign === 'justify' ? 'bg-rose-600 text-white font-bold shadow-sm' : 'text-stone-400 hover:text-white hover:bg-white/5'"
                  class="py-2 px-1 rounded-xl flex flex-col items-center gap-1 transition-all cursor-pointer"
                  title="ضبط كامل وتوزيع متوازن للأسطر"
                >
                  <mat-icon class="text-base">format_align_justify</mat-icon>
                  <span class="text-[11px]">ضبط كامل</span>
                </button>
              </div>

              <p class="text-[10px] text-stone-400 px-1 leading-normal">
                ملاحظة: عند اختيار "من اليسار"، تظل الحروف وتشكيلها باتجاه اللغة العربية الطبيعي السليم مع محاذاة بداية الأسطر لجهة اليسار.
              </p>
            </div>

            <!-- SECTION 3: Arabic Fonts (Amiri, Cairo, Tajawal, Naskh, Kufi, System) -->
            <div class="space-y-2.5 pt-2 border-t border-white/10">
              <div class="font-bold text-stone-300 text-xs flex items-center gap-1.5">
                <mat-icon class="text-sm text-rose-400">text_format</mat-icon>
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
                  خط كايرو (عصري بارز)
                </button>

                <button
                  (click)="setFont('tajawal')"
                  [class]="settings().fontFamily === 'tajawal' ? 'bg-rose-950/80 border-rose-500 text-white font-bold' : 'bg-stone-950/50 border-white/5 text-stone-300 hover:bg-stone-800'"
                  class="p-2.5 rounded-xl border transition-all cursor-pointer text-center font-tajawal text-xs"
                >
                  خط تجوال (ناعم ومريح)
                </button>

                <button
                  (click)="setFont('naskh')"
                  [class]="settings().fontFamily === 'naskh' ? 'bg-rose-950/80 border-rose-500 text-white font-bold' : 'bg-stone-950/50 border-white/5 text-stone-300 hover:bg-stone-800'"
                  class="p-2.5 rounded-xl border transition-all cursor-pointer text-center font-naskh text-sm"
                >
                  خط النسخ (تراثي واضح)
                </button>

                <button
                  (click)="setFont('kufi')"
                  [class]="settings().fontFamily === 'kufi' ? 'bg-rose-950/80 border-rose-500 text-white font-bold' : 'bg-stone-950/50 border-white/5 text-stone-300 hover:bg-stone-800'"
                  class="p-2.5 rounded-xl border transition-all cursor-pointer text-center font-kufi text-xs"
                >
                  خط كوفي (هندسي فاخر)
                </button>

                <button
                  (click)="setFont('system')"
                  [class]="settings().fontFamily === 'system' ? 'bg-rose-950/80 border-rose-500 text-white font-bold' : 'bg-stone-950/50 border-white/5 text-stone-300 hover:bg-stone-800'"
                  class="p-2.5 rounded-xl border transition-all cursor-pointer text-center font-sans text-xs"
                >
                  خط النظام المدمج
                </button>
              </div>
            </div>

            <!-- SECTION 4: Font Size & Font Weight (حجم وسماكة الخط) -->
            <div class="space-y-3 pt-2 border-t border-white/10">
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
                  class="w-9 h-9 rounded-xl bg-stone-950/60 border border-white/10 hover:bg-stone-800 flex items-center justify-center font-bold text-sm cursor-pointer transition-colors active:scale-95"
                >
                  -A
                </button>

                <input
                  type="range"
                  min="16"
                  max="38"
                  step="1"
                  [value]="settings().fontSize"
                  (input)="onFontSizeSlider($event)"
                  class="flex-1 accent-rose-500 cursor-pointer h-2 bg-stone-800 rounded-lg"
                />

                <button
                  (click)="changeFontSize(1)"
                  title="تكبير الخط"
                  class="w-9 h-9 rounded-xl bg-stone-950/60 border border-white/10 hover:bg-stone-800 flex items-center justify-center font-bold text-sm cursor-pointer transition-colors active:scale-95"
                >
                  +A
                </button>
              </div>

              <!-- Quick Size Presets -->
              <div class="flex items-center justify-between gap-1">
                @for (preset of [18, 22, 26, 30, 34]; track preset) {
                  <button
                    (click)="setFontSizeDirect(preset)"
                    [class]="settings().fontSize === preset ? 'bg-rose-600 text-white font-bold' : 'bg-stone-950/40 text-stone-400 hover:text-white'"
                    class="px-2.5 py-1 rounded-lg text-[11px] transition-colors cursor-pointer border border-white/5"
                  >
                    {{ preset }}
                  </button>
                }
              </div>

              <!-- Font Weight Selector -->
              <div class="flex items-center justify-between pt-1">
                <span class="text-stone-300">سماكة الخط:</span>
                <div class="flex items-center gap-1 bg-stone-950/60 p-1 rounded-xl border border-white/10">
                  <button
                    (click)="setFontWeight('normal')"
                    [class]="(settings().fontWeight || 'normal') === 'normal' ? 'bg-rose-600 text-white font-bold' : 'text-stone-400 hover:text-white'"
                    class="px-2.5 py-1 rounded-lg text-[11px] transition-colors cursor-pointer"
                  >
                    عادي
                  </button>
                  <button
                    (click)="setFontWeight('medium')"
                    [class]="settings().fontWeight === 'medium' ? 'bg-rose-600 text-white font-bold' : 'text-stone-400 hover:text-white'"
                    class="px-2.5 py-1 rounded-lg text-[11px] transition-colors cursor-pointer"
                  >
                    متوسط
                  </button>
                  <button
                    (click)="setFontWeight('bold')"
                    [class]="settings().fontWeight === 'bold' ? 'bg-rose-600 text-white font-bold' : 'text-stone-400 hover:text-white'"
                    class="px-2.5 py-1 rounded-lg text-[11px] transition-colors cursor-pointer"
                  >
                    عريض
                  </button>
                </div>
              </div>
            </div>

            <!-- SECTION 5: Line Spacing & Paragraph Margins (ارتفاع الأسطر وتباعد الفقرات) -->
            <div class="space-y-3 pt-2 border-t border-white/10">
              <div class="font-bold text-stone-300 text-xs flex items-center gap-1.5">
                <mat-icon class="text-sm text-rose-400">format_line_spacing</mat-icon>
                <span>ارتفاع الأسطر وتباعد الفقرات</span>
              </div>

              <!-- Line Height -->
              <div class="grid grid-cols-4 gap-1.5">
                @for (lh of [1.8, 2.2, 2.6, 3.0]; track lh) {
                  <button
                    (click)="setLineHeight(lh)"
                    [class]="settings().lineHeight === lh ? 'bg-rose-950/80 border-rose-500 text-white font-bold' : 'bg-stone-950/50 border-white/5 text-stone-300 hover:bg-stone-800'"
                    class="py-1.5 rounded-xl border text-center transition-all cursor-pointer font-mono text-[11px]"
                  >
                    {{ lh }}
                  </button>
                }
              </div>

              <!-- Paragraph Spacing -->
              <div class="flex items-center justify-between">
                <span class="text-stone-300">تباعد الفقرات:</span>
                <div class="flex items-center gap-1 bg-stone-950/60 p-1 rounded-xl border border-white/10">
                  <button
                    (click)="setParagraphSpacing('compact')"
                    [class]="settings().paragraphSpacing === 'compact' ? 'bg-rose-600 text-white font-bold' : 'text-stone-400 hover:text-white'"
                    class="px-2.5 py-1 rounded-lg text-[11px] cursor-pointer"
                  >
                    متقارب
                  </button>
                  <button
                    (click)="setParagraphSpacing('normal')"
                    [class]="(settings().paragraphSpacing || 'normal') === 'normal' ? 'bg-rose-600 text-white font-bold' : 'text-stone-400 hover:text-white'"
                    class="px-2.5 py-1 rounded-lg text-[11px] cursor-pointer"
                  >
                    معتدل
                  </button>
                  <button
                    (click)="setParagraphSpacing('relaxed')"
                    [class]="settings().paragraphSpacing === 'relaxed' ? 'bg-rose-600 text-white font-bold' : 'text-stone-400 hover:text-white'"
                    class="px-2.5 py-1 rounded-lg text-[11px] cursor-pointer"
                  >
                    فسيح
                  </button>
                </div>
              </div>

              <!-- Paragraph Indent Toggle -->
              <div class="flex items-center justify-between">
                <div>
                  <span class="text-stone-300 block">إزاحة بداية الفقرة الأدبية:</span>
                  <span class="text-[10px] text-stone-500">مسافة بادئة أنيقة لأول سطر</span>
                </div>
                <button
                  (click)="toggleParagraphIndent()"
                  [class]="settings().indentParagraphs !== false ? 'bg-rose-600 text-white' : 'bg-stone-950 border border-white/10 text-stone-400'"
                  class="px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer"
                >
                  {{ settings().indentParagraphs !== false ? 'مُمكَّن' : 'معطل' }}
                </button>
              </div>
            </div>

            <!-- SECTION 6: Reading Canvas Width (عرض مساحة القراءة) -->
            <div class="space-y-2.5 pt-2 border-t border-white/10">
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

            <!-- SECTION 7: Reading Eye Comfort & Extra Features (التشكيل، التعتيم، المسطرة) -->
            <div class="space-y-3 pt-2 border-t border-white/10">
              <!-- Screen Dimmer Slider -->
              <div class="space-y-1.5">
                <div class="flex items-center justify-between">
                  <div class="text-stone-300 flex items-center gap-1.5">
                    <mat-icon class="text-sm text-rose-400">brightness_medium</mat-icon>
                    <span>تعتيم الشاشة للقراءة الليلية:</span>
                  </div>
                  <span class="font-mono text-rose-400">{{ settings().screenDimmer || 0 }}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="60"
                  step="5"
                  [value]="settings().screenDimmer || 0"
                  (input)="onDimmerSlider($event)"
                  class="w-full accent-rose-500 cursor-pointer h-2 bg-stone-800 rounded-lg"
                />
              </div>

              <!-- Diacritics / Tashkeel Highlight -->
              <div class="flex items-center justify-between">
                <div>
                  <span class="text-stone-300 font-medium block">إبراز حركات التشكيل:</span>
                  <span class="text-[10px] text-stone-500">تلوين الحركات اللغوية ببريق قرمزي هادئ</span>
                </div>
                <button
                  (click)="toggleTashkeelHighlight()"
                  [class]="settings().highlightTashkeel ? 'bg-rose-600 text-white' : 'bg-stone-950 border border-white/10 text-stone-400'"
                  class="px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer"
                >
                  {{ settings().highlightTashkeel ? 'مُمكَّن' : 'معطل' }}
                </button>
              </div>

              <!-- Reading Focus Ruler -->
              <div class="flex items-center justify-between">
                <div>
                  <span class="text-stone-300 font-medium block">مسطرة تركيز القراءة:</span>
                  <span class="text-[10px] text-stone-500">خط تتبع لتسهيل التركيز على السطور</span>
                </div>
                <button
                  (click)="toggleReadingRuler()"
                  [class]="settings().readingRuler ? 'bg-rose-600 text-white' : 'bg-stone-950 border border-white/10 text-stone-400'"
                  class="px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer"
                >
                  {{ settings().readingRuler ? 'مُمكَّنة' : 'معطلة' }}
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
              class="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs transition-colors cursor-pointer"
            >
              تم الحفظ
            </button>
          </div>
        </div>
      }

      <!-- ========================================================================= -->
      <!-- MAIN READING CANVAS / ARTICLE (Clearly Divided, Clean, and Comfortable) -->
      <!-- ========================================================================= -->
      <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <article [class]="'mx-auto transition-all duration-300 ' + getWidthClass()">
          
          <!-- SECTION 1: ELEGANT CHAPTER HEADER & METADATA -->
          <header class="mb-8 sm:mb-12 text-center space-y-4 pb-6 border-b border-current/10">
            
            <!-- Breadcrumbs -->
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

            <!-- Literary Arabesque Ornamental Divider -->
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
                <span>{{ readingTimeMinutes() }} د للقراءة</span>
              </div>
            </div>

          </header>

          <!-- SECTION 2: CHAPTER READING BODY -->
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
            <!-- NOVEL CHAPTER PARAGRAPHS -->
            <div
              [class]="'transition-all duration-300 ' + getFontFamilyClass() + ' ' + getFontWeightClass() + ' ' + getTextAlignClass() + ' ' + getParagraphSpacingClass()"
              [style.font-size.px]="settings().fontSize"
              [style.line-height]="settings().lineHeight"
              dir="rtl"
            >
              @for (paragraph of chapterParagraphs(); track $index) {
                <p
                  [class]="getParagraphIndentClass() + ' tracking-normal transition-all'"
                  [innerHTML]="formatParagraph(paragraph)"
                ></p>
              } @empty {
                <div class="py-20 text-center opacity-60 text-sm">
                  لا يتوفر نص في هذا الفصل حالياً.
                </div>
              }
            </div>
          }

          <!-- SECTION 3: CHAPTER BOTTOM NAVIGATION & SECONDARY TOOLS -->
          <div class="mt-14 sm:mt-20 pt-8 sm:pt-10 border-t border-current/15 space-y-6">
            
            <!-- Previous & Next Chapters Grand Navigation Cards -->
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              
              <!-- Previous Chapter Button -->
              <button
                (click)="goToPrevChapter()"
                [disabled]="isFirstChapter()"
                class="group p-4 rounded-2xl border border-current/15 disabled:opacity-30 disabled:cursor-not-allowed hover:border-rose-500/40 hover:bg-current/5 transition-all cursor-pointer text-right flex items-center gap-3.5"
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

            <!-- Auxiliary Action Strip -->
            <div class="flex flex-wrap items-center justify-between gap-2.5 p-3 sm:p-4 rounded-2xl border border-current/10 bg-current/5">
              
              <div class="flex items-center gap-2">
                <button
                  (click)="toggleChapterDrawer()"
                  class="px-3 py-2 rounded-xl border border-current/10 hover:bg-current/10 transition-colors cursor-pointer text-xs flex items-center gap-1.5 font-medium"
                >
                  <mat-icon class="text-base text-rose-500">format_list_numbered_rtl</mat-icon>
                  <span>فهرس الفصول</span>
                </button>

                <button
                  (click)="toggleSettingsDrawer()"
                  class="px-3 py-2 rounded-xl border border-current/10 hover:bg-current/10 transition-colors cursor-pointer text-xs flex items-center gap-1.5 font-medium"
                >
                  <mat-icon class="text-base text-rose-500">tune</mat-icon>
                  <span>مظهر القراءة</span>
                </button>
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

          </div>

          <!-- ========================================================================= -->
          <!-- SECTION 4: CHAPTER READER COMMENTS (LAST ELEMENT OF THE PAGE - NO FOOTER!) -->
          <!-- ========================================================================= -->
          <section id="reader-comments" class="mt-14 sm:mt-20 pt-8 sm:pt-10 border-t border-current/15 space-y-6">
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-3">
                <div class="w-10 h-10 rounded-2xl bg-rose-600/20 text-rose-500 border border-rose-500/30 flex items-center justify-center">
                  <mat-icon class="text-xl">forum</mat-icon>
                </div>
                <div>
                  <h3 class="text-lg sm:text-xl font-bold font-amiri text-inherit">نقاشات وتعليقات المقاتلين</h3>
                  <p class="text-xs opacity-60">شارك انطباعك وتحليلك لأحداث هذا الفصل</p>
                </div>
              </div>

              <span class="px-3 py-1 rounded-full bg-rose-600/15 border border-rose-500/30 text-rose-400 text-xs font-bold">
                {{ store.chapterComments().length }} تعليق
              </span>
            </div>

            <!-- Write Comment Card -->
            @if (authStore.isAuthenticated()) {
              <div class="rounded-3xl p-4 sm:p-5 border border-white/10 bg-stone-900/60 backdrop-blur-md space-y-4 shadow-xl">
                <div class="flex items-center justify-between text-xs opacity-75">
                  <span>اكتب تعليقك بصفتك:</span>
                  <a routerLink="/profile" class="text-rose-400 hover:underline flex items-center gap-1 font-bold">
                    <span>إعدادات الغلاف (1500 × 800) والأيقونة</span>
                    <mat-icon class="text-xs">arrow_back</mat-icon>
                  </a>
                </div>

                <!-- Preview of current user's banner & circular avatar -->
                <div class="relative rounded-2xl overflow-hidden border border-white/10 h-24 sm:h-28 group">
                  <img
                    [src]="authStore.coverURL()"
                    alt="غلاف تعليقك"
                    referrerpolicy="no-referrer"
                    class="w-full h-full object-cover"
                  />
                  <div class="absolute inset-0 bg-gradient-to-t from-stone-950 via-stone-950/40 to-transparent pointer-events-none"></div>
                  <div class="absolute inset-0 cover-inner-shadow pointer-events-none"></div>

                  <!-- Overlapping circular avatar & username -->
                  <div class="absolute bottom-2.5 right-4 z-10 flex items-center gap-3">
                    <div class="w-11 h-11 rounded-full overflow-hidden border-2 border-rose-500 shadow-lg bg-stone-900 shrink-0">
                      @if (authStore.photoURL()) {
                        <img [src]="authStore.photoURL()" alt="صورة القارئ" referrerpolicy="no-referrer" class="w-full h-full object-cover" />
                      } @else {
                        <div class="w-full h-full bg-rose-700 flex items-center justify-center text-white font-bold text-base font-amiri">
                          {{ authStore.displayName().charAt(0) || 'ق' }}
                        </div>
                      }
                    </div>
                    <div class="drop-shadow-md">
                      <span class="text-sm font-bold text-white block font-amiri">{{ authStore.displayName() }}</span>
                      <span class="text-[10px] text-rose-300 font-sans block">غلافك وأيقونتك المخصصة تظهر مع كل تعليق</span>
                    </div>
                  </div>
                </div>

                <div class="space-y-3">
                  <textarea
                    [value]="commentTextInput()"
                    (input)="onCommentInput($event)"
                    rows="3"
                    placeholder="ما رأيك في تطورات هذا الفصل؟ أطلق العنان لمشاعرك الأدبية..."
                    class="w-full bg-stone-950/80 border border-white/15 focus:border-rose-500 rounded-2xl p-3.5 text-xs sm:text-sm text-stone-100 placeholder-stone-500 focus:outline-none transition-colors resize-none"
                  ></textarea>

                  <div class="flex items-center justify-between gap-3">
                    <span class="text-[11px] opacity-60">احرص على احترام بقية القراء وتجنب الحرق الصريح</span>
                    <button
                      type="button"
                      (click)="onPostComment()"
                      [disabled]="isPostingComment() || !commentTextInput().trim()"
                      class="px-5 py-2.5 rounded-xl bg-gradient-to-l from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 text-white font-bold text-xs shadow-md transition-all cursor-pointer flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      <mat-icon class="text-base">send</mat-icon>
                      <span>{{ isPostingComment() ? 'جاري النشر...' : 'نشر التعليق' }}</span>
                    </button>
                  </div>
                </div>
              </div>
            } @else {
              <div class="p-6 rounded-3xl border border-white/10 bg-stone-900/60 backdrop-blur-md text-center space-y-3">
                <div class="w-12 h-12 rounded-2xl bg-rose-600/15 border border-rose-500/30 flex items-center justify-center text-rose-400 mx-auto">
                  <mat-icon class="text-2xl">account_circle</mat-icon>
                </div>
                <h4 class="font-bold text-base font-amiri text-inherit">سجّل دخولك للمشاركة في نقاش الفصل</h4>
                <p class="text-xs opacity-70 max-w-md mx-auto">
                  سجّل دخولك لتظهر تعليقاتك بأيقونتك وغلافك الخلفي الخاص (1500 × 800) الذي قمت بضبطه في حسابك!
                </p>
                <a
                  routerLink="/login"
                  class="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-l from-rose-600 to-rose-700 text-white font-bold text-xs shadow-md hover:from-rose-500 transition-all cursor-pointer mt-1"
                >
                  <mat-icon class="text-sm">login</mat-icon>
                  <span>تسجيل الدخول / إنشاء حساب</span>
                </a>
              </div>
            }

            <!-- List of Comments -->
            <div class="space-y-4">
              @for (comment of store.chapterComments(); track comment.id) {
                <div class="rounded-3xl overflow-hidden border border-white/10 bg-stone-900/50 hover:border-rose-500/30 transition-all shadow-lg">
                  
                  <!-- Comment User Cover Backdrop (1500x800 Aspect with Inner Shading) -->
                  <div class="relative h-20 sm:h-24 w-full overflow-hidden">
                    <img
                      [src]="comment.userCover || authStore.coverURL()"
                      alt="غلاف المعلق"
                      referrerpolicy="no-referrer"
                      class="w-full h-full object-cover"
                    />
                    <!-- Inner shading and blending into card background -->
                    <div class="absolute inset-0 bg-gradient-to-t from-stone-950 via-stone-950/50 to-transparent pointer-events-none"></div>
                    <div class="absolute inset-0 cover-inner-shadow pointer-events-none"></div>

                    <!-- Overlapping User Circular Avatar and Name -->
                    <div class="absolute bottom-2 right-3.5 z-10 flex items-center gap-2.5">
                      <div class="w-10 h-10 rounded-full overflow-hidden border-2 border-stone-950 shadow-xl bg-stone-900 shrink-0">
                        @if (comment.userAvatar) {
                          <img [src]="comment.userAvatar" alt="{{ comment.userName }}" referrerpolicy="no-referrer" class="w-full h-full object-cover" />
                        } @else {
                          <div class="w-full h-full bg-gradient-to-br from-rose-600 to-stone-900 flex items-center justify-center text-white font-bold font-amiri text-base">
                            {{ comment.userName.charAt(0) || 'ق' }}
                          </div>
                        }
                      </div>

                      <div>
                        <div class="flex items-center gap-2">
                          <strong class="text-xs sm:text-sm font-bold font-amiri text-white drop-shadow">
                            {{ comment.userName }}
                          </strong>
                          <span class="px-2 py-0.5 rounded-full bg-rose-600/30 border border-rose-400/40 text-[10px] text-rose-200 font-bold">
                            قارئ مقاتل
                          </span>
                        </div>
                        <span class="text-[10px] text-stone-300 font-mono block drop-shadow">
                          {{ formatCommentTime(comment.createdAt) }}
                        </span>
                      </div>
                    </div>

                    <!-- Delete button if it's the current user's comment -->
                    @if (authStore.currentUser()?.uid === comment.userId) {
                      <button
                        type="button"
                        (click)="onDeleteComment(comment.id)"
                        class="absolute top-2.5 left-2.5 p-1 rounded-lg bg-black/60 hover:bg-rose-950 border border-white/10 hover:border-rose-500 text-stone-300 hover:text-rose-400 text-xs transition-colors cursor-pointer"
                        title="حذف تعليقي"
                      >
                        <mat-icon class="text-sm">delete_outline</mat-icon>
                      </button>
                    }
                  </div>

                  <!-- Comment Body & Actions -->
                  <div class="p-4 pt-3 space-y-2.5">
                    <p class="text-xs sm:text-sm text-stone-200 leading-relaxed font-sans whitespace-pre-line">
                      {{ comment.text }}
                    </p>

                    <div class="flex items-center justify-between border-t border-white/5 pt-2 text-xs">
                      <button
                        type="button"
                        (click)="onLikeComment(comment.id)"
                        class="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-white/5 hover:bg-rose-600/20 text-stone-300 hover:text-rose-300 transition-colors cursor-pointer"
                      >
                        <mat-icon class="text-sm text-rose-400">favorite</mat-icon>
                        <span class="text-xs">{{ comment.likes || 0 }}</span>
                      </button>

                      <span class="text-[10px] text-stone-500 font-mono">
                        معرف: #{{ comment.id.substring(3, 8) }}
                      </span>
                    </div>
                  </div>

                </div>
              } @empty {
                <div class="p-8 rounded-3xl border border-white/5 bg-stone-900/40 text-center space-y-2 opacity-70">
                  <mat-icon class="text-3xl text-rose-400">chat_bubble_outline</mat-icon>
                  <p class="text-xs font-amiri">كن أول من يترك بصمته الأدبية ويعلق على هذا الفصل!</p>
                </div>
              }
            </div>
          </section>

        </article>
      </main>

    </div>
  `,
})
export class NovelReader implements OnInit, OnDestroy {
  readonly store = inject(NovelStore);
  readonly authStore = inject(AuthStore);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  // Component Signals
  readonly showChapterDrawer = signal<boolean>(false);
  readonly showSettingsDrawer = signal<boolean>(false);
  readonly showToolsMenu = signal<boolean>(false);
  readonly isZenMode = signal<boolean>(false);
  readonly chapterSearchQuery = signal<string>('');
  readonly shareToast = signal<string>('');
  readonly rulerY = signal<number>(0);

  // Comment Signals
  readonly commentTextInput = signal<string>('');
  readonly isPostingComment = signal<boolean>(false);

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
    effect(() => {
      const novels = this.store.novels();
      if (!this.store.selectedNovel() && novels.length > 0) {
        this.store.selectNovel(novels[0].id);
      }
    });

    effect(() => {
      const ch = this.currentChapter();
      if (ch) {
        this.store.loadChapterComments(ch.id);
      }
    });
  }

  ngOnInit(): void {
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
  }

  ngOnDestroy(): void {
    this.stopAutoScroll();
    this.stopTts();
  }

  onMouseMove(e: MouseEvent): void {
    if (this.settings().readingRuler) {
      this.rulerY.set(e.clientY);
    }
  }

  @HostListener('window:keydown', ['$event'])
  handleKeyboardEvent(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      if (this.showChapterDrawer() || this.showSettingsDrawer() || this.showToolsMenu()) {
        this.closeDrawers();
      } else if (this.isZenMode()) {
        this.isZenMode.set(false);
      }
    }
    if (event.key === 'ArrowRight' && (event.altKey || event.ctrlKey)) {
      this.goToPrevChapter();
    }
    if (event.key === 'ArrowLeft' && (event.altKey || event.ctrlKey)) {
      this.goToNextChapter();
    }
  }

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
    return 'بداية الرواية';
  });

  readonly nextChapterTitle = computed<string>(() => {
    const novel = this.currentNovel();
    const chapter = this.currentChapter();
    if (!novel || !chapter) return 'لا يوجد فصل تالٍ';
    const idx = novel.chapters.findIndex(c => c.id === chapter.id);
    if (idx >= 0 && idx < novel.chapters.length - 1) {
      return novel.chapters[idx + 1].title;
    }
    return 'آخر فصل متوفر';
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

  scrollToComments(): void {
    if (typeof document !== 'undefined') {
      const el = document.getElementById('reader-comments');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
      }
    }
  }

  // Drawers & Modals
  toggleChapterDrawer(): void {
    this.showSettingsDrawer.set(false);
    this.showToolsMenu.set(false);
    this.showChapterDrawer.update(v => !v);
  }

  toggleSettingsDrawer(): void {
    this.showChapterDrawer.set(false);
    this.showToolsMenu.set(false);
    this.showSettingsDrawer.update(v => !v);
  }

  toggleToolsMenu(): void {
    this.showToolsMenu.update(v => !v);
  }

  closeToolsMenu(): void {
    this.showToolsMenu.set(false);
  }

  closeDrawers(): void {
    this.showChapterDrawer.set(false);
    this.showSettingsDrawer.set(false);
    this.showToolsMenu.set(false);
  }

  toggleZenMode(): void {
    this.closeDrawers();
    this.isZenMode.update(v => !v);
  }

  toggleFullscreen(): void {
    if (typeof document === 'undefined') return;
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(err => {
        console.warn('Fullscreen request failed:', err);
      });
    } else {
      document.exitFullscreen().catch(err => {
        console.warn('Exit fullscreen failed:', err);
      });
    }
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

  setFontWeight(fontWeight: ReaderWeight): void {
    this.store.updateReaderSettings({ fontWeight });
  }

  changeFontSize(delta: number): void {
    const current = this.settings().fontSize;
    const next = Math.min(38, Math.max(16, current + delta));
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

  setParagraphSpacing(paragraphSpacing: ParagraphSpacing): void {
    this.store.updateReaderSettings({ paragraphSpacing });
  }

  toggleParagraphIndent(): void {
    this.store.updateReaderSettings({ indentParagraphs: !(this.settings().indentParagraphs !== false) });
  }

  setWidth(pageWidth: ReaderWidth): void {
    this.store.updateReaderSettings({ pageWidth });
  }

  // USER REQUIREMENT:
  // "إمكانية تعديل شكل القراءة مثلاً الكتابة من المنتصف الكتابة من اليمين و من اليسار
  // بس لما تكون من اليسار لاتجعل الخط من اليسار لليمين فقط مكن الخط"
  setTextAlign(textAlign: ReaderAlign): void {
    this.store.updateReaderSettings({ textAlign });
  }

  toggleTashkeelHighlight(): void {
    this.store.updateReaderSettings({ highlightTashkeel: !this.settings().highlightTashkeel });
  }

  toggleReadingRuler(): void {
    this.store.updateReaderSettings({ readingRuler: !this.settings().readingRuler });
  }

  onDimmerSlider(event: Event): void {
    const val = Number((event.target as HTMLInputElement).value);
    this.store.updateReaderSettings({ screenDimmer: val });
  }

  resetSettings(): void {
    this.store.updateReaderSettings({
      theme: 'dark',
      fontFamily: 'amiri',
      fontSize: 21,
      lineHeight: 2.2,
      pageWidth: 'normal',
      highlightTashkeel: false,
      showDiagnostics: false,
      textAlign: 'justify',
      paragraphSpacing: 'normal',
      fontWeight: 'normal',
      indentParagraphs: true,
      screenDimmer: 0,
      readingRuler: false,
    });
  }

  // Auto Scroll Engine
  toggleAutoScroll(): void {
    if (this.isAutoScrolling()) {
      const current = this.autoScrollSpeed();
      if (current === 1) {
        this.setAutoScrollSpeed(2);
      } else if (current === 2) {
        this.setAutoScrollSpeed(3);
      } else {
        this.stopAutoScroll();
      }
    } else {
      this.isAutoScrolling.set(true);
      this.autoScrollSpeed.set(1);
      this.startAutoScroll();
    }
  }

  setAutoScrollSpeed(speed: number): void {
    const validSpeed: AutoScrollSpeed = speed === 2 ? 2 : speed === 3 ? 3 : 1;
    this.autoScrollSpeed.set(validSpeed);
    if (!this.isAutoScrolling()) {
      this.isAutoScrolling.set(true);
    }
    this.startAutoScroll();
  }

  private startAutoScroll(): void {
    this.stopAutoScrollOnly();
    if (typeof window === 'undefined') return;

    const speed = this.autoScrollSpeed();
    const intervalMs = speed === 1 ? 45 : speed === 2 ? 28 : 16;

    this.autoScrollInterval = setInterval(() => {
      window.scrollBy({ top: 1, behavior: 'smooth' });
      const doc = document.documentElement;
      if (window.scrollY + window.innerHeight >= doc.scrollHeight - 5) {
        this.stopAutoScroll();
      }
    }, intervalMs);
  }

  private stopAutoScrollOnly(): void {
    if (this.autoScrollInterval) {
      clearInterval(this.autoScrollInterval);
      this.autoScrollInterval = null;
    }
  }

  stopAutoScroll(): void {
    this.stopAutoScrollOnly();
    this.isAutoScrolling.set(false);
  }

  // Arabic TTS
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

  stopTts(): void {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    this.isSpeaking.set(false);
  }

  // Theme Helpers
  getThemeContainerClass(): string {
    switch (this.settings().theme) {
      case 'sepia':
        return 'bg-[#f7f0e0] text-[#2c2217]';
      case 'light':
        return 'bg-[#faf9f6] text-[#1c1917]';
      case 'black':
        return 'bg-black text-[#d6d2cb]';
      case 'emerald':
        return 'bg-[#0b1712] text-[#d0e6dc]';
      case 'navy':
        return 'bg-[#0a1220] text-[#d6e3f5]';
      case 'dark':
      default:
        return 'bg-[#141217] text-[#e6e2da]';
    }
  }

  getNavbarThemeClass(): string {
    switch (this.settings().theme) {
      case 'sepia':
        return 'bg-[#eee4cf]/95 border-[#decfae] text-[#2c2217] shadow-sm';
      case 'light':
        return 'bg-[#ffffff]/95 border-stone-200 text-stone-900 shadow-sm';
      case 'black':
        return 'bg-black/95 border-stone-900 text-[#d6d2cb]';
      case 'emerald':
        return 'bg-[#09140f]/95 border-[#152e22] text-[#d0e6dc] shadow-sm';
      case 'navy':
        return 'bg-[#080e1a]/95 border-[#13223d] text-[#d6e3f5] shadow-sm';
      case 'dark':
      default:
        return 'bg-[#110f14]/95 border-white/5 text-[#e6e2da] shadow-sm';
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
      case 'emerald':
        return 'واحة زمردية';
      case 'navy':
        return 'سماء كحلية';
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
      case 'naskh':
        return 'font-naskh';
      case 'kufi':
        return 'font-kufi';
      case 'system':
      default:
        return 'font-sans';
    }
  }

  getFontWeightClass(): string {
    switch (this.settings().fontWeight) {
      case 'medium':
        return 'font-medium';
      case 'bold':
        return 'font-bold';
      case 'normal':
      default:
        return 'font-normal';
    }
  }

  getWidthClass(): string {
    switch (this.settings().pageWidth) {
      case 'narrow':
        return 'max-w-2xl';
      case 'wide':
        return 'max-w-5xl';
      case 'full':
        return 'max-w-full px-2 sm:px-4';
      case 'normal':
      default:
        return 'max-w-3xl';
    }
  }

  // USER REQUIREMENT:
  // "مثلاً الكتابة من المنتصف الكتابة من اليمين و من اليسار
  // بس لما تكون من اليسار لاتجعل الخط من اليسار لليمين فقط مكن الخط."
  // Direction remains strictly RTL so Arabic script renders normally,
  // while only text-align is adjusted to right, center, left, or justify!
  getTextAlignClass(): string {
    switch (this.settings().textAlign) {
      case 'right':
        return 'text-right [direction:rtl]';
      case 'center':
        return 'text-center [direction:rtl]';
      case 'left':
        return 'text-left [direction:rtl]';
      case 'justify':
      default:
        return 'text-justify [direction:rtl]';
    }
  }

  getParagraphSpacingClass(): string {
    switch (this.settings().paragraphSpacing) {
      case 'compact':
        return 'space-y-4 sm:space-y-5';
      case 'relaxed':
        return 'space-y-8 sm:space-y-10';
      case 'normal':
      default:
        return 'space-y-6 sm:space-y-7';
    }
  }

  getParagraphIndentClass(): string {
    return this.settings().indentParagraphs !== false ? 'indent-6 sm:indent-10' : 'indent-0';
  }

  formatParagraph(text: string): string {
    if (!this.settings().highlightTashkeel) {
      return text;
    }
    return text.replace(/([\u064B-\u065F\u0670])/g, '<span class="text-rose-500 font-bold">$1</span>');
  }

  // --- COMMENTS IMPLEMENTATION ---
  onCommentInput(event: Event): void {
    const target = event.target as HTMLTextAreaElement;
    this.commentTextInput.set(target.value);
  }

  async onPostComment(): Promise<void> {
    const text = this.commentTextInput().trim();
    const novel = this.currentNovel();
    const chapter = this.currentChapter();
    if (!text || !novel || !chapter) return;

    this.isPostingComment.set(true);
    try {
      const user = {
        uid: this.authStore.currentUser()?.uid || 'guest',
        displayName: this.authStore.displayName() || 'قارئ مقاتل',
        photoURL: this.authStore.photoURL() || '',
        coverURL: this.authStore.coverURL() || '',
      };

      await this.store.addChapterComment(novel.id, chapter.id, text, user);
      this.commentTextInput.set('');
    } finally {
      this.isPostingComment.set(false);
    }
  }

  async onLikeComment(commentId: string): Promise<void> {
    const chapter = this.currentChapter();
    if (!chapter) return;
    await this.store.likeChapterComment(commentId, chapter.id);
  }

  async onDeleteComment(commentId: string): Promise<void> {
    const chapter = this.currentChapter();
    if (!chapter) return;
    await this.store.deleteChapterComment(commentId, chapter.id);
  }

  formatCommentTime(isoString: string): string {
    if (!isoString) return 'الآن';
    const diff = Date.now() - new Date(isoString).getTime();
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return 'الآن';
    if (minutes < 60) return `منذ ${minutes} دقيقة`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `منذ ${hours} ساعة`;
    const days = Math.floor(hours / 24);
    return `منذ ${days} يوم`;
  }
}
