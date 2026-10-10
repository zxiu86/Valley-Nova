import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { NovelStore } from '../core/novel-store';
import { ReaderTheme, ReaderFont } from '../core/novel-models';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-novel-reader',
  imports: [RouterLink],
  template: `
    <div
      class="min-h-screen transition-colors duration-300 relative text-[#e5e1e4]"
      [class]="getThemeContainerClass()"
    >
      <!-- Reader Header Bar -->
      @if (!isZenMode()) {
        <header class="sticky top-0 z-40 bg-[#0e0e10]/90 backdrop-blur-xl border-b border-white/[0.08] px-4 sm:px-6 py-3 transition-all duration-300">
          <div class="max-w-5xl mx-auto flex items-center justify-between gap-4">
            
            <!-- Right: Back & Chapter Info -->
            <div class="flex items-center gap-3 min-w-0">
              <button
                type="button"
                (click)="goBack()"
                class="p-2 rounded-full hover:bg-white/5 text-[#debfc2] hover:text-[#e9c349] transition-colors shrink-0"
                title="العودة لبيانات السفر"
              >
                <span class="material-symbols-outlined text-[20px]">arrow_forward</span>
              </button>
              
              <div class="flex flex-col min-w-0">
                <span class="font-noto-serif text-sm sm:text-base font-bold text-white truncate">
                  {{ novel()?.title || 'أروقة الخلود' }}
                </span>
                <span class="text-xs text-[#debfc2]/70 truncate">
                  {{ chapter()?.title || 'الفصل الجاري' }}
                </span>
              </div>
            </div>

            <!-- Left: Reading Controls & Tools -->
            <div class="flex items-center gap-1.5 sm:gap-2 shrink-0">
              
              <!-- Font size - -->
              <button
                type="button"
                (click)="adjustFontSize(-2)"
                class="w-8 h-8 rounded-lg bg-[#1c1b1d] border border-white/10 hover:border-white/30 text-xs font-bold text-[#e5e1e4] flex items-center justify-center transition-all cursor-pointer"
                title="تصغير الخط"
              >
                A-
              </button>

              <!-- Font size + -->
              <button
                type="button"
                (click)="adjustFontSize(2)"
                class="w-8 h-8 rounded-lg bg-[#1c1b1d] border border-white/10 hover:border-white/30 text-xs font-bold text-[#e5e1e4] flex items-center justify-center transition-all cursor-pointer"
                title="تكبير الخط"
              >
                A+
              </button>

              <!-- Settings menu toggle -->
              <button
                type="button"
                (click)="showSettings.set(!showSettings())"
                class="p-2 rounded-lg bg-[#1c1b1d] border border-white/10 hover:border-[#e9c349]/40 text-[#debfc2] hover:text-[#e9c349] transition-all cursor-pointer"
                title="تخصيص القراءة"
              >
                <span class="material-symbols-outlined text-[18px]">tune</span>
              </button>

              <!-- Soundscape Audio Toggle -->
              <button
                type="button"
                (click)="novelStore.toggleSoundscape()"
                class="p-2 rounded-lg bg-[#1c1b1d] border border-white/10 hover:border-[#e9c349]/40 transition-all cursor-pointer"
                [class.text-[#e9c349]]="novelStore.soundscapeActive()"
                [class.text-[#debfc2]]="!novelStore.soundscapeActive()"
                title="الخلفية الصوتية التأملية"
              >
                <span class="material-symbols-outlined text-[18px]">graphic_eq</span>
              </button>

              <!-- Zen Mode Toggle -->
              <button
                type="button"
                (click)="isZenMode.set(true)"
                class="hidden sm:flex p-2 rounded-lg bg-[#1c1b1d] border border-white/10 hover:border-white/30 text-[#debfc2] hover:text-white transition-all cursor-pointer"
                title="وضع الخلوة التامة (شاشة كاملة)"
              >
                <span class="material-symbols-outlined text-[18px]">fullscreen</span>
              </button>
            </div>
          </div>

          <!-- Quick Settings Dropdown -->
          @if (showSettings()) {
            <div class="max-w-5xl mx-auto mt-3 p-4 bg-[#1c1b1d] border border-white/10 rounded-2xl flex flex-wrap items-center justify-between gap-4 animate-in fade-in duration-200">
              
              <!-- Themes -->
              <div class="flex items-center gap-2">
                <span class="text-xs text-[#debfc2]/70">المظهر:</span>
                <div class="flex items-center gap-1.5">
                  <button
                    type="button"
                    (click)="setTheme('dark')"
                    class="w-6 h-6 rounded-full bg-[#131315] border-2 transition-all"
                    [class.border-[#e9c349]]="settings().theme === 'dark'"
                    [class.border-transparent]="settings().theme !== 'dark'"
                    title="الوضع الداكن"
                  ></button>
                  <button
                    type="button"
                    (click)="setTheme('black')"
                    class="w-6 h-6 rounded-full bg-black border-2 transition-all"
                    [class.border-[#e9c349]]="settings().theme === 'black'"
                    [class.border-transparent]="settings().theme !== 'black'"
                    title="الوضع الأسود التام"
                  ></button>
                  <button
                    type="button"
                    (click)="setTheme('sepia')"
                    class="w-6 h-6 rounded-full bg-[#241e17] border-2 transition-all"
                    [class.border-[#e9c349]]="settings().theme === 'sepia'"
                    [class.border-transparent]="settings().theme !== 'sepia'"
                    title="المخطوطة القديمة"
                  ></button>
                </div>
              </div>

              <!-- Fonts -->
              <div class="flex items-center gap-2">
                <span class="text-xs text-[#debfc2]/70">الخط:</span>
                <div class="flex items-center gap-1 text-xs">
                  <button
                    type="button"
                    (click)="setFont('amiri')"
                    class="px-2.5 py-1 rounded-lg border font-amiri"
                    [class.bg-[#2a2a2c]]="settings().fontFamily === 'amiri'"
                    [class.border-[#e9c349]]="settings().fontFamily === 'amiri'"
                    [class.border-white/10]="settings().fontFamily !== 'amiri'"
                  >
                    أميري
                  </button>
                  <button
                    type="button"
                    (click)="setFont('naskh')"
                    class="px-2.5 py-1 rounded-lg border font-naskh"
                    [class.bg-[#2a2a2c]]="settings().fontFamily === 'naskh'"
                    [class.border-[#e9c349]]="settings().fontFamily === 'naskh'"
                    [class.border-white/10]="settings().fontFamily !== 'naskh'"
                  >
                    نسخ
                  </button>
                  <button
                    type="button"
                    (click)="setFont('cairo')"
                    class="px-2.5 py-1 rounded-lg border font-cairo"
                    [class.bg-[#2a2a2c]]="settings().fontFamily === 'cairo'"
                    [class.border-[#e9c349]]="settings().fontFamily === 'cairo'"
                    [class.border-white/10]="settings().fontFamily !== 'cairo'"
                  >
                    القاهرة
                  </button>
                </div>
              </div>

              <!-- Tashkeel toggle -->
              <div class="flex items-center gap-2">
                <button
                  type="button"
                  (click)="toggleTashkeel()"
                  class="px-3 py-1 rounded-lg border text-xs font-medium transition-all"
                  [class.bg-[#e9c349]/20]="settings().highlightTashkeel"
                  [class.text-[#e9c349]]="settings().highlightTashkeel"
                  [class.border-[#e9c349]/50]="settings().highlightTashkeel"
                  [class.border-white/10]="!settings().highlightTashkeel"
                >
                  إبراز التشكيل
                </button>
              </div>

            </div>
          }
        </header>
      }

      <!-- Floating Exit Zen Button -->
      @if (isZenMode()) {
        <button
          type="button"
          (click)="isZenMode.set(false)"
          class="fixed top-4 left-4 z-50 p-2.5 rounded-full bg-[#1c1b1d]/80 border border-white/15 text-[#debfc2] hover:text-white backdrop-blur-md shadow-xl transition-all"
          title="الخروج من وضع الخلوة"
        >
          <span class="material-symbols-outlined text-[20px]">fullscreen_exit</span>
        </button>
      }

      <!-- Main Reading Stage -->
      <main class="max-w-3xl mx-auto px-5 sm:px-8 py-10 sm:py-16">
        
        <!-- Chapter Header Title -->
        <div class="text-center pb-8 border-b border-white/[0.08] mb-10">
          <span class="text-xs font-semibold text-[#e9c349] tracking-widest uppercase block mb-1">
            {{ novel()?.riwaqName || 'أروقة الخلود' }}
          </span>
          <h1 class="font-noto-serif text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-3 leading-snug">
            {{ chapter()?.title }}
          </h1>
          <span class="text-xs text-[#debfc2]/70 font-medium">
            سفر: {{ novel()?.title }} • بقلم: {{ novel()?.author }}
          </span>

          <!-- MTX Decoded Status Pill -->
          @if (chapter(); as ch) {
            <div class="mt-4 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#0e0e10] border border-white/10 text-[11px] text-[#7bd8b1] font-mono">
              <span class="w-1.5 h-1.5 rounded-full bg-[#7bd8b1]"></span>
              <span>MTX Lossless: فُك التشفير في {{ ch.decodingDurationMs || 0.4 }} ms</span>
              <span>•</span>
              <span>توفير الحجم: {{ ch.savingsPercent }}%</span>
            </div>
          }
        </div>

        <!-- Decompressing Loading Spinner -->
        @if (novelStore.isDecoding()) {
          <div class="py-20 flex flex-col items-center justify-center text-center">
            <div class="w-10 h-10 border-2 border-[#e9c349] border-t-transparent rounded-full animate-spin mb-4"></div>
            <span class="font-noto-serif text-sm text-[#e9c349]">يتم فك تشفير النص من صيغة MTX...</span>
          </div>
        } @else {
          <!-- Pure Chapter Literary Content -->
          <article
            class="reading-content transition-all leading-loose text-justify"
            [class]="getFontClass()"
            [style.fontSize.px]="settings().fontSize"
            [style.lineHeight]="settings().lineHeight"
          >
            @for (para of paragraphs(); track $index) {
              <p class="mb-6 whitespace-pre-wrap selection:bg-[#881337] selection:text-[#ffd9dd]">
                {{ para }}
              </p>
            }
          </article>
        }

        <!-- Bottom Chapter Navigation -->
        <div class="mt-14 pt-8 border-t border-white/[0.08] flex items-center justify-between gap-4">
          <button
            type="button"
            (click)="prevChapter()"
            [disabled]="!hasPrevChapter()"
            class="px-4 py-2.5 rounded-xl bg-[#1c1b1d] border border-white/10 hover:border-white/30 text-xs font-semibold flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
          >
            <span class="material-symbols-outlined text-[16px]">east</span>
            <span>الفصل السابق</span>
          </button>

          <a
            [routerLink]="['/novel', novel()?.id]"
            class="text-xs text-[#e9c349] hover:underline font-medium text-center"
          >
            فهرس السفر
          </a>

          <button
            type="button"
            (click)="nextChapter()"
            [disabled]="!hasNextChapter()"
            class="px-4 py-2.5 rounded-xl bg-[#e9c349] text-[#241a00] hover:bg-[#ffe088] text-xs font-bold flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer shadow-md"
          >
            <span>الفصل التالي</span>
            <span class="material-symbols-outlined text-[16px]">west</span>
          </button>
        </div>

      </main>
    </div>
  `,
})
export class NovelReader implements OnInit {
  readonly novelStore = inject(NovelStore);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  readonly isZenMode = signal<boolean>(false);
  readonly showSettings = signal<boolean>(false);

  readonly novel = computed(() => this.novelStore.selectedNovel());
  readonly chapter = computed(() => this.novelStore.selectedChapter());
  readonly settings = computed(() => this.novelStore.readerSettings());

  readonly paragraphs = computed(() => {
    const text = this.novelStore.currentChapterText();
    if (!text) return [];
    return text.split('\n\n').filter(p => p.trim().length > 0);
  });

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      const novelId = params.get('novelId');
      const chapterId = params.get('chapterId');

      if (novelId) {
        if (chapterId) {
          this.novelStore.selectChapter(novelId, chapterId);
        } else {
          this.novelStore.selectNovel(novelId);
        }
      } else {
        const novels = this.novelStore.novels();
        if (novels.length > 0) {
          this.novelStore.selectNovel(novels[0].id);
        }
      }
    });
  }

  getThemeContainerClass(): string {
    switch (this.settings().theme) {
      case 'sepia':
        return 'bg-[#1e1914] text-[#ede3d8]';
      case 'black':
        return 'bg-black text-[#e0e0e0]';
      case 'dark':
      default:
        return 'bg-[#131315] text-[#e5e1e4]';
    }
  }

  getFontClass(): string {
    switch (this.settings().fontFamily) {
      case 'naskh':
        return 'font-naskh';
      case 'cairo':
        return 'font-cairo';
      case 'tajawal':
        return 'font-tajawal';
      case 'amiri':
      default:
        return 'font-amiri';
    }
  }

  adjustFontSize(delta: number): void {
    const current = this.settings().fontSize;
    const next = Math.min(36, Math.max(16, current + delta));
    this.novelStore.updateReaderSettings({ fontSize: next });
  }

  setTheme(theme: ReaderTheme): void {
    this.novelStore.updateReaderSettings({ theme });
  }

  setFont(fontFamily: ReaderFont): void {
    this.novelStore.updateReaderSettings({ fontFamily });
  }

  toggleTashkeel(): void {
    this.novelStore.updateReaderSettings({
      highlightTashkeel: !this.settings().highlightTashkeel,
    });
  }

  hasPrevChapter(): boolean {
    const n = this.novel();
    const ch = this.chapter();
    if (!n || !ch) return false;
    const idx = n.chapters.findIndex(c => c.id === ch.id);
    return idx > 0;
  }

  hasNextChapter(): boolean {
    const n = this.novel();
    const ch = this.chapter();
    if (!n || !ch) return false;
    const idx = n.chapters.findIndex(c => c.id === ch.id);
    return idx >= 0 && idx < n.chapters.length - 1;
  }

  prevChapter(): void {
    this.novelStore.goToPrevChapter();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  nextChapter(): void {
    this.novelStore.goToNextChapter();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  goBack(): void {
    const n = this.novel();
    if (n) {
      this.router.navigate(['/novel', n.id]);
    } else {
      this.router.navigate(['/']);
    }
  }
}
