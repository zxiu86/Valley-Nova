import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { NovelStore } from '../core/novel-store';
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

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-novel-details',
  imports: [RouterLink],
  template: `
    <div class="min-h-screen bg-[#131315] text-[#e5e1e4] pb-24 pt-4">
      @if (currentNovel(); as novel) {
        
        <!-- Navigation breadcrumbs -->
        <div class="w-full px-4 sm:px-6 md:px-12 py-4">
          <div class="flex items-center justify-between border-b border-white/[0.06] pb-4">
            <div class="flex items-center gap-2 text-xs text-[#debfc2]/70 font-medium">
              <a routerLink="/" class="hover:text-[#e9c349] transition-colors flex items-center gap-1">
                <span class="material-symbols-outlined text-[16px]">home</span>
                <span>الرئيسية</span>
              </a>
              <span>/</span>
              <span class="text-[#e9c349]">{{ novel.riwaqName || novel.category }}</span>
              <span>/</span>
              <span class="text-white font-semibold truncate max-w-[200px] sm:max-w-md">
                {{ novel.title }}
              </span>
            </div>

            <button
              type="button"
              (click)="goBack()"
              class="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#1c1b1d] border border-white/10 text-xs text-[#debfc2] hover:text-white hover:bg-[#201f22] transition-all cursor-pointer"
            >
              <span>العودة للأروقة</span>
              <span class="material-symbols-outlined text-[15px]">arrow_back</span>
            </button>
          </div>
        </div>

        <!-- Book Showcase Main Section -->
        <main class="w-full px-4 sm:px-6 md:px-12 py-8">
          <div class="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
            
            <!-- Left: Book Cover Jacket Column -->
            <div class="lg:col-span-4 flex flex-col items-center sm:items-start space-y-5">
              <div class="relative w-64 sm:w-72 lg:w-full aspect-[1/1.55] rounded-2xl overflow-hidden bg-[#0e0e10] border border-white/15 shadow-2xl group mx-auto">
                <img
                  [src]="novel.coverImage || 'assist/img/logo.png'"
                  [alt]="novel.title"
                  class="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <div class="absolute inset-0 bg-gradient-to-t from-[#0e0e10]/80 via-transparent to-transparent"></div>
                <div class="absolute bottom-4 right-4 left-4 flex items-center justify-between text-xs">
                  <span class="px-2.5 py-1 rounded-md bg-[#0e0e10]/80 backdrop-blur-md text-[#e9c349] font-medium border border-white/10">
                    {{ novel.riwaqName }}
                  </span>
                  <span class="px-2.5 py-1 rounded-md bg-[#881337]/80 text-[#ffb2bd] font-medium border border-white/10">
                    مشفر بـ MTX
                  </span>
                </div>
              </div>

              <!-- Quick Action Buttons -->
              <div class="w-full flex flex-col gap-2.5 sm:max-w-xs mx-auto lg:max-w-none">
                @if (novel.chapters.length > 0) {
                  <button
                    type="button"
                    (click)="readChapter(novel.chapters[0])"
                    class="w-full py-3.5 px-4 rounded-xl bg-[#e9c349] text-[#241a00] font-noto-serif text-sm font-bold flex items-center justify-center gap-2 shadow-lg hover:bg-[#ffe088] transition-all cursor-pointer"
                  >
                    <span class="material-symbols-outlined text-[20px]">auto_stories</span>
                    <span>ابدأ القراءة الآن</span>
                  </button>
                }

                <div class="flex items-center gap-2">
                  <button
                    type="button"
                    (click)="toggleBookmark(novel.id)"
                    class="flex-1 py-2.5 px-3 rounded-xl bg-[#1c1b1d] border border-white/10 hover:border-[#ffb2bd]/50 text-xs font-medium text-[#e5e1e4] flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                  >
                    <span
                      class="material-symbols-outlined text-[18px]"
                      [class.text-[#ffb2bd]]="isBookmarked(novel.id)"
                    >
                      {{ isBookmarked(novel.id) ? 'bookmark_added' : 'bookmark' }}
                    </span>
                    <span>{{ isBookmarked(novel.id) ? 'محفوظ في الخزانة' : 'احفظ في المحفوظات' }}</span>
                  </button>

                  <button
                    type="button"
                    (click)="novelStore.toggleSoundscape()"
                    class="py-2.5 px-3 rounded-xl bg-[#1c1b1d] border border-white/10 hover:border-[#e9c349]/50 text-xs text-[#e9c349] flex items-center justify-center gap-1 transition-all cursor-pointer"
                    title="الخلفية الصوتية التأملية"
                  >
                    <span class="material-symbols-outlined text-[18px]">graphic_eq</span>
                  </button>
                </div>
              </div>
            </div>

            <!-- Right: Book Lore, Specs & Chapters Directory -->
            <div class="lg:col-span-8 flex flex-col gap-6">
              <div>
                <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#2a2a2c] text-[11px] text-[#e9c349] font-medium mb-3">
                  <span>{{ novel.riwaqName }}</span>
                  <span>•</span>
                  <span>{{ novel.category }}</span>
                </div>
                <h1 class="font-noto-serif text-3xl sm:text-4xl lg:text-5xl font-bold text-[#e5e1e4] mb-2 leading-tight">
                  {{ novel.title }}
                </h1>
                <p class="text-sm sm:text-base text-[#debfc2]/90 font-medium">
                  بقلم: <span class="text-white font-semibold">{{ novel.author }}</span>
                </p>
              </div>

              <!-- Book Lore & Description -->
              <div class="p-6 rounded-2xl bg-[#1c1b1d]/80 border border-white/[0.08]">
                <h3 class="font-noto-serif text-base font-bold text-[#e9c349] mb-2 flex items-center gap-1.5">
                  <span class="material-symbols-outlined text-[18px]">menu_book</span>
                  <span>عن هذا السفر</span>
                </h3>
                <p class="text-sm text-[#debfc2] leading-relaxed">
                  {{ novel.description }}
                </p>
                @if (novel.authorBio) {
                  <p class="text-xs text-[#debfc2]/70 mt-3 pt-3 border-t border-white/[0.06]">
                    {{ novel.authorBio }}
                  </p>
                }
              </div>

              <!-- MTX Pure Text Engine Status Card -->
              <div class="p-4 rounded-xl bg-[#0e0e10]/80 border border-white/[0.08] flex items-center justify-between flex-wrap gap-3">
                <div class="flex items-center gap-3">
                  <span class="material-symbols-outlined text-[#7bd8b1] text-[24px]">verified</span>
                  <div class="flex flex-col">
                    <span class="text-xs font-bold text-white">ترميز MTX النقي بدون فقدان</span>
                    <span class="text-[11px] text-[#debfc2]/70">تخزين سريع جداً وفك تشفير محلي في ٠٫٥ ميلي ثانية</span>
                  </div>
                </div>
                <div class="flex items-center gap-2 text-xs">
                  <span class="px-2.5 py-1 rounded bg-[#201f22] text-[#e9c349] font-mono">
                    {{ novel.chapters.length }} فصول مجهزة
                  </span>
                </div>
              </div>

              <!-- Chapters Index (فهرس فصول السفر) -->
              <div>
                <h3 class="font-noto-serif text-lg font-bold text-[#e5e1e4] mb-3 flex items-center gap-2">
                  <span class="material-symbols-outlined text-[20px] text-[#e9c349]">format_list_bulleted</span>
                  <span>فهرس الفصول</span>
                </h3>

                <div class="flex flex-col gap-2.5">
                  @for (chapter of novel.chapters; track chapter.id) {
                    <button
                      type="button"
                      (click)="readChapter(chapter)"
                      class="group w-full text-right p-4 rounded-xl bg-[#1c1b1d] border border-white/[0.06] hover:bg-[#201f22] hover:border-[#e9c349]/40 transition-all flex items-center justify-between cursor-pointer"
                    >
                      <div class="flex items-center gap-3 min-w-0">
                        <span class="w-8 h-8 rounded-lg bg-[#2a2a2c] text-xs font-bold text-[#e9c349] flex items-center justify-center shrink-0">
                          {{ chapter.chapterIndex }}
                        </span>
                        <div class="flex flex-col min-w-0">
                          <span class="font-noto-serif text-sm font-semibold text-[#e5e1e4] group-hover:text-[#e9c349] transition-colors truncate">
                            {{ chapter.title }}
                          </span>
                          <span class="text-[11px] text-[#debfc2]/60 font-mono mt-0.5">
                            {{ chapter.wordCount }} كلمة • توفير MTX {{ chapter.savingsPercent }}%
                          </span>
                        </div>
                      </div>

                      <div class="flex items-center gap-2 text-xs text-[#debfc2] group-hover:text-[#e9c349] shrink-0">
                        <span class="hidden sm:inline-block">اقرأ</span>
                        <span class="material-symbols-outlined text-[16px] transition-transform group-hover:-translate-x-1">west</span>
                      </div>
                    </button>
                  }
                </div>
              </div>

              <!-- Related Sanctuary Books (Horizontal side-scroll on mobile!) -->
              <div class="pt-6 border-t border-white/[0.08]">
                <div class="flex items-center justify-between mb-4">
                  <h3 class="font-noto-serif text-base font-bold text-[#e5e1e4]">
                    أسفار أخرى من {{ novel.riwaqName }}
                  </h3>
                  <span class="lg:hidden text-[11px] text-[#debfc2]/60 flex items-center gap-1">
                    <span>اسحب جانباً</span>
                    <span class="material-symbols-outlined text-[12px]">swipe_left</span>
                  </span>
                </div>

                <div class="flex overflow-x-auto gap-4 pb-2 scrollbar-none snap-x snap-mandatory">
                  @for (other of relatedBooks(); track other.id) {
                    <button
                      type="button"
                      (click)="openBook(other.id)"
                      class="flex flex-col items-center group cursor-pointer shrink-0 w-28 min-w-[112px] sm:w-32 sm:min-w-[128px] snap-start transition-transform hover:-translate-y-1 bg-transparent border-0 p-0 text-inherit"
                    >
                      <div class="w-full aspect-[1/1.55] rounded-xl overflow-hidden bg-[#201f22] border border-white/10 group-hover:border-[#e9c349]/50 shadow-md">
                        <img
                          [src]="other.coverImage"
                          [alt]="other.title"
                          class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                          loading="lazy"
                        />
                      </div>
                      <span class="font-noto-serif text-xs font-semibold text-[#e5e1e4] mt-2 text-center line-clamp-1 group-hover:text-[#e9c349]">
                        {{ other.title }}
                      </span>
                    </button>
                  }
                </div>
              </div>

            </div>

          </div>
        </main>
      } @else {
        <div class="min-h-[50vh] flex flex-col items-center justify-center p-8 text-center">
          <span class="material-symbols-outlined text-4xl text-[#e9c349] mb-3">auto_stories</span>
          <h2 class="font-noto-serif text-xl font-bold text-white mb-2">جاري استحضار السفر...</h2>
          <p class="text-xs text-[#debfc2]/70 mb-4">يتم فك تشفير بيانات المخطوطة من الخزانة</p>
          <a routerLink="/" class="text-xs text-[#e9c349] hover:underline">العودة إلى صرح أروقة الخلود</a>
        </div>
      }
    </div>
  `,
})
export class NovelDetails {
  readonly novelStore = inject(NovelStore);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  private readonly novelIdParam = signal<string>('');

  readonly currentNovel = computed<Novel | null>(() => {
    const id = this.novelIdParam();
    if (!id) return this.novelStore.novels()[0] || null;
    const found = this.novelStore.novels().find(n => n.id === id);
    if (found) return found;

    // Check if it's one of the Riwaq books
    const allRiwaq = [
      SPOTLIGHT_BOOK,
      ...FEATURED_SELECTION_BOOKS,
      ...FANTASY_BOOKS,
      ...MYSTERY_BOOKS,
      ...SCIFI_BOOKS,
      ...ALL_SERENDIPITY_POOL,
      ...MOST_READ_BOOKS.map(m => m.book),
    ];
    const riwaqItem = allRiwaq.find(b => b.id === id);
    if (riwaqItem) {
      const fallbackChapters = this.novelStore.novels()[0]?.chapters || [];
      return {
        id: riwaqItem.id,
        title: riwaqItem.title,
        author: riwaqItem.author || 'أديب الأروقة',
        authorBio: 'كاتب ومحقق نصوص بارز في صرح أروقة الخلود.',
        category: riwaqItem.category || 'رواية سيكولوجية غامضة',
        riwaqId: 'riwaq-al-riwayat',
        riwaqName: 'رواق الروايات',
        coverGradient: 'from-rose-950 via-stone-900 to-black',
        coverImage: riwaqItem.coverImage,
        accentColor: '#ffb2bd',
        rating: 4.9,
        ratingCount: 2340,
        views: '120K',
        description: riwaqItem.description || riwaqItem.quote || 'سفرٌ سردي من نفائس رواق الروايات، حيث يرقد الحرف ليعاود النهوض حياً في ضمير القارئ.',
        chapters: fallbackChapters,
      } as Novel;
    }

    return this.novelStore.novels()[0] || null;
  });

  readonly relatedBooks = computed<Novel[]>(() => {
    const current = this.currentNovel();
    if (!current) return [];
    return this.novelStore.novels().filter(n => n.riwaqId === current.riwaqId && n.id !== current.id);
  });

  constructor() {
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id) {
        this.novelIdParam.set(id);
      }
    });
  }

  isBookmarked(novelId: string): boolean {
    return this.novelStore.bookmarkedNovelIds().includes(novelId);
  }

  toggleBookmark(novelId: string): void {
    this.novelStore.toggleBookmark(novelId);
  }

  readChapter(chapter: ChapterSummary): void {
    const n = this.currentNovel();
    if (n) {
      this.novelStore.selectNovel(n.id);
      this.novelStore.selectChapter(n.id, chapter.id);
      this.router.navigate(['/reader', n.id, chapter.id]);
    }
  }

  openBook(bookId: string): void {
    this.novelIdParam.set(bookId);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  goBack(): void {
    this.router.navigate(['/']);
  }
}
