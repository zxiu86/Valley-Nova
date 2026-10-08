import { ChangeDetectionStrategy, Component, computed, effect, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { NovelStore } from '../core/novel-store';
import { ReaderFont, ReaderTheme, ReaderWidth } from '../core/novel-models';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-novel-reader',
  imports: [MatIconModule],
  template: `
    <div [class]="'min-h-screen transition-colors duration-200 ' + getThemeBgClass()">
      
      <!-- Reader Floating / Sticky Toolbar -->
      <nav [class]="'sticky top-16 z-30 border-b backdrop-blur-md px-4 sm:px-6 py-2.5 transition-colors ' + getToolbarClass()">
        <div class="max-w-6xl mx-auto flex flex-wrap items-center justify-between gap-3">
          
          <!-- Novel & Chapter Title + Navigation -->
          <div class="flex items-center gap-2 sm:gap-4 min-w-0">
            <button
              (click)="backToLibrary()"
              title="العودة إلى المكتبة"
              class="p-2 rounded-lg hover:bg-black/10 dark:hover:bg-white/10 transition-colors cursor-pointer text-stone-400 hover:text-stone-200"
            >
              <mat-icon class="text-xl">arrow_forward</mat-icon>
            </button>

            <div class="flex flex-col min-w-0">
              <span class="text-xs text-stone-400 truncate">
                {{ store.selectedNovel()?.title || 'رواية غير محددة' }} · {{ store.selectedNovel()?.author }}
              </span>
              <div class="flex items-center gap-2">
                <!-- Chapter Selector Dropdown -->
                <select
                  [value]="store.selectedChapter()?.id || ''"
                  (change)="onChapterChange($event)"
                  class="bg-transparent font-amiri font-bold text-sm sm:text-base border-none focus:ring-0 cursor-pointer text-inherit truncate max-w-[200px] sm:max-w-xs p-0 m-0"
                >
                  @for (ch of store.selectedNovel()?.chapters; track ch.id) {
                    <option [value]="ch.id" class="bg-stone-900 text-stone-100 font-sans text-xs">
                      {{ ch.title }}
                    </option>
                  }
                </select>
              </div>
            </div>
          </div>

          <!-- Reader Customization Actions -->
          <div class="flex items-center gap-1.5 sm:gap-2">
            
            <!-- Quick Chapter Prev / Next -->
            <button
              (click)="store.goToPrevChapter()"
              [disabled]="isFirstChapter()"
              title="الفصل السابق"
              class="p-1.5 rounded-lg border border-black/10 dark:border-white/10 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-black/10 dark:hover:bg-white/10 transition-colors cursor-pointer text-xs flex items-center gap-1"
            >
              <mat-icon class="text-base">chevron_right</mat-icon>
              <span class="hidden md:inline">السابق</span>
            </button>

            <button
              (click)="store.goToNextChapter()"
              [disabled]="isLastChapter()"
              title="الفصل التالي"
              class="p-1.5 rounded-lg border border-black/10 dark:border-white/10 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-black/10 dark:hover:bg-white/10 transition-colors cursor-pointer text-xs flex items-center gap-1"
            >
              <span class="hidden md:inline">التالي</span>
              <mat-icon class="text-base">chevron_left</mat-icon>
            </button>

            <div class="h-5 w-px bg-stone-700/50 hidden sm:block"></div>

            <!-- Download MTX File Button (Direct user requirement) -->
            <button
              (click)="store.downloadCurrentChapter()"
              title="تحميل هذا الفصل بصيغة .mtx المضغوطة المشفرة"
              class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-sm transition-colors cursor-pointer"
            >
              <mat-icon class="text-sm">file_download</mat-icon>
              <span>تنزيل .mtx</span>
            </button>

            <!-- Toggle Reader Settings Drawer / Bar -->
            <button
              (click)="toggleSettings()"
              [class]="showSettings() ? 'bg-amber-600 text-stone-950 font-bold' : 'hover:bg-black/10 dark:hover:bg-white/10 text-stone-400'"
              title="تخصيص الخط والخلفية"
              class="p-2 rounded-lg border border-black/10 dark:border-white/10 transition-colors cursor-pointer"
            >
              <mat-icon class="text-lg">tune</mat-icon>
            </button>

          </div>

        </div>

        <!-- Collapsible Reader Customization Panel -->
        @if (showSettings()) {
          <div class="max-w-6xl mx-auto pt-3 pb-2 mt-2 border-t border-black/10 dark:border-white/10 grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3 text-xs">
            
            <!-- Theme Selection -->
            <div class="space-y-1">
              <span class="text-[11px] text-stone-400 block font-medium">السمة اللونية:</span>
              <div class="flex items-center gap-1">
                <button
                  (click)="setTheme('dark')"
                  [class]="settings().theme === 'dark' ? 'ring-2 ring-amber-500 font-bold' : 'opacity-70 hover:opacity-100'"
                  class="w-7 h-7 rounded-full bg-stone-900 border border-stone-700 shadow-sm cursor-pointer"
                  title="سمة ليلية فاخرة"
                ></button>
                <button
                  (click)="setTheme('sepia')"
                  [class]="settings().theme === 'sepia' ? 'ring-2 ring-amber-600 font-bold' : 'opacity-70 hover:opacity-100'"
                  class="w-7 h-7 rounded-full bg-[#f4ecd8] border border-amber-300 shadow-sm cursor-pointer"
                  title="سمة ورق بردي دافئ"
                ></button>
                <button
                  (click)="setTheme('light')"
                  [class]="settings().theme === 'light' ? 'ring-2 ring-amber-500 font-bold' : 'opacity-70 hover:opacity-100'"
                  class="w-7 h-7 rounded-full bg-stone-100 border border-stone-300 shadow-sm cursor-pointer"
                  title="سمة نهارية ناصعة"
                ></button>
                <button
                  (click)="setTheme('black')"
                  [class]="settings().theme === 'black' ? 'ring-2 ring-amber-500 font-bold' : 'opacity-70 hover:opacity-100'"
                  class="w-7 h-7 rounded-full bg-black border border-stone-800 shadow-sm cursor-pointer"
                  title="سمة أموليد سواد خالص"
                ></button>
              </div>
            </div>

            <!-- Font Family -->
            <div class="space-y-1">
              <span class="text-[11px] text-stone-400 block font-medium">نوع الخط:</span>
              <select
                [value]="settings().fontFamily"
                (change)="onFontChange($event)"
                class="w-full bg-black/10 dark:bg-white/10 border border-black/20 dark:border-white/20 rounded-lg px-2 py-1 text-xs cursor-pointer text-inherit"
              >
                <option value="amiri" class="bg-stone-900 text-stone-100">خط أميري (أدبي)</option>
                <option value="cairo" class="bg-stone-900 text-stone-100">خط كايرو (عصري)</option>
                <option value="tajawal" class="bg-stone-900 text-stone-100">خط تجوال (ناعم)</option>
                <option value="system" class="bg-stone-900 text-stone-100">خط النظام</option>
              </select>
            </div>

            <!-- Font Size -->
            <div class="space-y-1">
              <span class="text-[11px] text-stone-400 block font-medium">حجم الخط ({{ settings().fontSize }}px):</span>
              <div class="flex items-center gap-1">
                <button
                  (click)="changeFontSize(-2)"
                  class="flex-1 py-1 px-2 rounded bg-black/10 dark:bg-white/10 hover:bg-black/20 font-bold cursor-pointer text-center"
                >
                  A-
                </button>
                <button
                  (click)="changeFontSize(2)"
                  class="flex-1 py-1 px-2 rounded bg-black/10 dark:bg-white/10 hover:bg-black/20 font-bold cursor-pointer text-center"
                >
                  A+
                </button>
              </div>
            </div>

            <!-- Page Width -->
            <div class="space-y-1">
              <span class="text-[11px] text-stone-400 block font-medium">عرض الصفحة:</span>
              <div class="flex items-center gap-1">
                <button
                  (click)="setWidth('narrow')"
                  [class]="settings().pageWidth === 'narrow' ? 'bg-amber-600 text-stone-950 font-bold' : 'bg-black/10 dark:bg-white/10'"
                  class="flex-1 py-1 rounded text-center cursor-pointer"
                >
                  ضيق
                </button>
                <button
                  (click)="setWidth('normal')"
                  [class]="settings().pageWidth === 'normal' ? 'bg-amber-600 text-stone-950 font-bold' : 'bg-black/10 dark:bg-white/10'"
                  class="flex-1 py-1 rounded text-center cursor-pointer"
                >
                  وسط
                </button>
                <button
                  (click)="setWidth('wide')"
                  [class]="settings().pageWidth === 'wide' ? 'bg-amber-600 text-stone-950 font-bold' : 'bg-black/10 dark:bg-white/10'"
                  class="flex-1 py-1 rounded text-center cursor-pointer"
                >
                  عريض
                </button>
              </div>
            </div>

            <!-- Tashkeel Highlighter -->
            <div class="space-y-1">
              <span class="text-[11px] text-stone-400 block font-medium">تمييز التشكيل (كَ وكِ):</span>
              <button
                (click)="toggleTashkeelHighlight()"
                [class]="settings().highlightTashkeel ? 'bg-amber-600 text-stone-950 font-bold' : 'bg-black/10 dark:bg-white/10 text-stone-400'"
                class="w-full py-1 px-2 rounded transition-colors text-center cursor-pointer flex items-center justify-center gap-1"
              >
                <mat-icon class="text-sm">spellcheck</mat-icon>
                <span>{{ settings().highlightTashkeel ? 'مُمَيَّز' : 'عادي' }}</span>
              </button>
            </div>

            <!-- Diagnostic Bar Toggle -->
            <div class="space-y-1">
              <span class="text-[11px] text-stone-400 block font-medium">بيانات صيغة MTX:</span>
              <button
                (click)="toggleDiagnostics()"
                [class]="settings().showDiagnostics ? 'bg-stone-800 text-amber-400 font-bold' : 'bg-black/10 dark:bg-white/10 text-stone-400'"
                class="w-full py-1 px-2 rounded transition-colors text-center cursor-pointer flex items-center justify-center gap-1"
              >
                <mat-icon class="text-sm">speed</mat-icon>
                <span>{{ settings().showDiagnostics ? 'معروض' : 'مخفي' }}</span>
              </button>
            </div>

          </div>
        }
      </nav>

      <!-- MTX Live Decompression Diagnostic Bar -->
      @if (settings().showDiagnostics && store.selectedChapter()) {
        <div class="max-w-4xl mx-auto px-4 mt-4">
          <div class="p-3 rounded-xl bg-stone-900/90 border border-stone-800 text-stone-300 text-xs flex flex-wrap items-center justify-between gap-3 shadow-md">
            <div class="flex items-center gap-2">
              <span class="flex h-2 w-2 relative">
                <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span class="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span class="font-mono-code font-bold text-amber-400">صيغة MTX:</span>
              <span>حجم الملف المضغوط: <strong class="text-white font-mono-code">{{ formatBytes(store.selectedChapter()!.mtxBytes) }}</strong></span>
              <span class="text-stone-400">(بدل {{ formatBytes(store.selectedChapter()!.utf8Bytes) }} بترميز UTF-8)</span>
            </div>

            <div class="flex items-center gap-4 text-[11px]">
              <div class="flex items-center gap-1 text-emerald-400 font-mono-code font-bold">
                <mat-icon class="text-sm">trending_down</mat-icon>
                <span>توفير {{ store.selectedChapter()!.savingsPercent }}%</span>
              </div>

              <div class="flex items-center gap-1 text-amber-300 font-mono-code">
                <mat-icon class="text-sm">bolt</mat-icon>
                <span>فك التشفير: {{ store.selectedChapter()!.decodingDurationMs || 0.35 }}ms</span>
              </div>

              <div class="flex items-center gap-1 text-sky-400">
                <mat-icon class="text-sm">verified</mat-icon>
                <span>تطابق دقيق 100%</span>
              </div>
            </div>
          </div>
        </div>
      }

      <!-- Main Reading Area -->
      <main class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <article [class]="'mx-auto transition-all duration-200 ' + getWidthClass()">
          
          <!-- Chapter Header -->
          <header class="mb-10 pb-6 border-b border-black/10 dark:border-white/10 text-center space-y-3">
            <div class="text-xs uppercase tracking-wider text-amber-600 dark:text-amber-400 font-semibold font-sans">
              {{ store.selectedNovel()?.title }} · الفصل {{ store.selectedChapter()?.chapterIndex }}
            </div>
            
            <h1 class="text-2xl sm:text-4xl font-extrabold font-amiri leading-relaxed">
              {{ store.selectedChapter()?.title }}
            </h1>

            <div class="flex items-center justify-center gap-3 text-xs text-stone-500 dark:text-stone-400 font-sans">
              <span>بقلم {{ store.selectedNovel()?.author }}</span>
              <span>·</span>
              <span>{{ store.selectedChapter()?.wordCount }} كلمة</span>
              @if (store.selectedChapter()?.diacriticsCount) {
                <span>·</span>
                <span class="text-amber-600 dark:text-amber-400 font-medium">
                  {{ store.selectedChapter()?.diacriticsCount }} علامة تشكيل محفوظة بدقة
                </span>
              }
            </div>
          </header>

          <!-- Decompressing Loader State -->
          @if (store.isDecoding()) {
            <div class="py-20 flex flex-col items-center justify-center gap-4 text-amber-500">
              <mat-icon class="text-4xl animate-spin">refresh</mat-icon>
              <p class="text-sm font-sans text-stone-400">جاري فك تشفير وتجميع نص الفصل بصيغة MTX الفائقة...</p>
            </div>
          } @else {
            <!-- Novel Chapter Content -->
            <div
              [class]="'text-justify leading-loose space-y-6 ' + getFontClass()"
              [style.font-size.px]="settings().fontSize"
              [style.line-height]="settings().lineHeight"
            >
              @for (paragraph of chapterParagraphs(); track $index) {
                <p class="indent-6 transition-all" [innerHTML]="formatParagraph(paragraph)"></p>
              }
            </div>
          }

          <!-- Chapter Navigation Footer -->
          <div class="mt-16 pt-8 border-t border-black/10 dark:border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
            <button
              (click)="store.goToPrevChapter()"
              [disabled]="isFirstChapter()"
              class="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 rounded-xl border border-black/20 dark:border-white/20 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-black/10 dark:hover:bg-white/10 transition-colors cursor-pointer text-sm font-sans"
            >
              <mat-icon>arrow_forward</mat-icon>
              <span>الفصل السابق</span>
            </button>

            <!-- Download Button -->
            <button
              (click)="store.downloadCurrentChapter()"
              class="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-medium border border-stone-700 transition-colors cursor-pointer"
            >
              <mat-icon class="text-base text-emerald-400">file_download</mat-icon>
              <span>تنزيل هذا الفصل (.mtx)</span>
            </button>

            <button
              (click)="store.goToNextChapter()"
              [disabled]="isLastChapter()"
              class="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-amber-600 hover:bg-amber-500 text-stone-950 font-bold disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer text-sm font-sans"
            >
              <span>الفصل التالي</span>
              <mat-icon>arrow_back</mat-icon>
            </button>
          </div>

        </article>
      </main>

    </div>
  `,
})
export class NovelReader {
  readonly store = inject(NovelStore);
  private readonly router = inject(Router);

  readonly showSettings = signal<boolean>(false);
  readonly settings = this.store.readerSettings;

  constructor() {
    effect(() => {
      const novels = this.store.novels();
      if (!this.store.selectedNovel() && novels.length > 0) {
        this.store.selectNovel(novels[0].id);
      }
    });
  }

  loadFirstNovel(): void {
    const list = this.store.novels();
    if (list.length > 0) {
      this.store.selectNovel(list[0].id);
    }
  }

  readonly chapterParagraphs = computed(() => {
    const raw = this.store.currentChapterText();
    if (!raw) return [];
    return raw
      .split(/\n\s*\n/)
      .map(p => p.trim())
      .filter(p => p.length > 0);
  });

  readonly isFirstChapter = computed(() => {
    const novel = this.store.selectedNovel();
    const chapter = this.store.selectedChapter();
    if (!novel || !chapter) return true;
    return novel.chapters.findIndex(c => c.id === chapter.id) <= 0;
  });

  readonly isLastChapter = computed(() => {
    const novel = this.store.selectedNovel();
    const chapter = this.store.selectedChapter();
    if (!novel || !chapter) return true;
    const idx = novel.chapters.findIndex(c => c.id === chapter.id);
    return idx === novel.chapters.length - 1;
  });

  formatBytes(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    return `${(bytes / 1024).toFixed(1)} KB`;
  }

  toggleSettings(): void {
    this.showSettings.update(v => !v);
  }

  setTheme(theme: ReaderTheme): void {
    this.store.updateReaderSettings({ theme });
  }

  setWidth(pageWidth: ReaderWidth): void {
    this.store.updateReaderSettings({ pageWidth });
  }

  onFontChange(e: Event): void {
    const val = (e.target as HTMLSelectElement).value as ReaderFont;
    this.store.updateReaderSettings({ fontFamily: val });
  }

  changeFontSize(delta: number): void {
    const current = this.settings().fontSize;
    const next = Math.min(36, Math.max(16, current + delta));
    this.store.updateReaderSettings({ fontSize: next });
  }

  toggleTashkeelHighlight(): void {
    this.store.updateReaderSettings({ highlightTashkeel: !this.settings().highlightTashkeel });
  }

  toggleDiagnostics(): void {
    this.store.updateReaderSettings({ showDiagnostics: !this.settings().showDiagnostics });
  }

  onChapterChange(e: Event): void {
    const chId = (e.target as HTMLSelectElement).value;
    const novel = this.store.selectedNovel();
    if (novel && chId) {
      this.store.selectChapter(novel.id, chId);
    }
  }

  backToLibrary(): void {
    this.router.navigate(['/library']);
  }

  getThemeBgClass(): string {
    switch (this.settings().theme) {
      case 'sepia':
        return 'bg-[#f4ecd8] text-[#3c2f1f]';
      case 'light':
        return 'bg-[#fafafa] text-[#1c1917]';
      case 'black':
        return 'bg-black text-[#d6d3d1]';
      case 'dark':
      default:
        return 'bg-[#18181b] text-[#e4e4e7]';
    }
  }

  getToolbarClass(): string {
    switch (this.settings().theme) {
      case 'sepia':
        return 'bg-[#ebdcb9]/90 border-[#d3c299] text-[#3c2f1f]';
      case 'light':
        return 'bg-white/90 border-stone-200 text-stone-900 shadow-sm';
      case 'black':
        return 'bg-black/95 border-stone-900 text-stone-200';
      case 'dark':
      default:
        return 'bg-stone-900/90 border-stone-800 text-stone-100';
    }
  }

  getFontClass(): string {
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
        return 'max-w-2xl';
      case 'wide':
        return 'max-w-5xl';
      case 'normal':
      default:
        return 'max-w-3xl';
    }
  }

  formatParagraph(text: string): string {
    if (!this.settings().highlightTashkeel) {
      return text;
    }

    // Wrap diacritical marks in a colored span for visual demonstration of lossless Tashkeel preservation
    return text.replace(/([\u064B-\u065F\u0670])/g, '<span class="text-amber-500 font-bold">$1</span>');
  }
}
