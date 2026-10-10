import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { NovelStore } from '../core/novel-store';
import { AuthStore } from '../core/auth-store';
import { FormsModule } from '@angular/forms';
import { SANCTUARIES_DATA } from '../core/sample-novels';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-header',
  imports: [RouterLink, FormsModule],
  host: {
    '(window:scroll)': 'onWindowScroll()',
  },
  template: `
    <header
      class="fixed top-0 inset-x-0 z-50 transition-all duration-300 ease-in-out"
      [class.-translate-y-full]="isHeaderHidden() && !isMobileMenuOpen()"
      [class.opacity-0]="isHeaderHidden() && !isMobileMenuOpen()"
      [class.pointer-events-none]="isHeaderHidden() && !isMobileMenuOpen()"
      [class.translate-y-0]="!isHeaderHidden() || isMobileMenuOpen()"
      [class.opacity-100]="!isHeaderHidden() || isMobileMenuOpen()"
      [class.pointer-events-auto]="!isHeaderHidden() || isMobileMenuOpen()"
    >
      <!-- Ultra-high Glassmorphism Container with Deep Blur -->
      <div class="relative w-full bg-[#0a0a0c]/40 backdrop-blur-3xl border-b border-white/[0.08] shadow-[0_8px_32px_0_rgba(0,0,0,0.5)] transition-all duration-300">
        <!-- Top Crystal Specular Glass Rim -->
        <div class="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/25 to-transparent pointer-events-none"></div>

        <div class="h-20 w-full px-4 sm:px-6 md:px-12 flex items-center justify-between gap-4">
          
          <!-- RIGHT: Website Identity & Brand -->
          <div class="flex items-center gap-6 shrink-0">
            <a routerLink="/" class="flex items-baseline gap-2.5 group cursor-pointer select-none">
              <span class="font-noto-serif text-2xl font-bold text-[#e5e1e4] tracking-wide group-hover:text-[#ffb2bd] transition-colors">
                أروقة الخلود
              </span>
              <span class="hidden sm:inline-block text-[11px] font-medium text-[#e9c349] tracking-widest opacity-80 select-none">
                الصرح السردي
              </span>
            </a>
          </div>

          <!-- CENTER: Sanctuaries Navigation (Desktop Glass Bar) -->
          <nav class="hidden xl:flex items-center gap-1.5 py-1 px-2.5 bg-[#0e0e10]/60 border border-white/[0.07] rounded-full shadow-[0_2px_12px_rgba(0,0,0,0.3)] backdrop-blur-md">
            <button
              type="button"
              (click)="navigateToRiwaq('riwaq-al-riwayat')"
              class="px-4 py-1.5 rounded-full text-[13px] font-medium transition-all cursor-pointer flex items-center gap-1.5"
              [class]="activeRiwaq() === 'riwaq-al-riwayat' ? 'text-[#ffb2bd] font-semibold bg-[#2a2a2c] shadow-sm' : 'text-[#debfc2]/80 hover:text-[#e5e1e4] hover:bg-[#201f22]'"
            >
              <span class="w-1.5 h-1.5 rounded-full bg-[#ffb2bd]"></span>
              <span>رواق الروايات</span>
            </button>
            <span class="w-px h-3 bg-white/10"></span>
            <button
              type="button"
              (click)="navigateToRiwaq('riwaq-al-malahim')"
              class="px-4 py-1.5 rounded-full text-[13px] font-medium transition-all cursor-pointer flex items-center gap-1.5"
              [class]="activeRiwaq() === 'riwaq-al-malahim' ? 'text-[#e9c349] font-semibold bg-[#2a2a2c] shadow-sm' : 'text-[#debfc2]/80 hover:text-[#e5e1e4] hover:bg-[#201f22]'"
            >
              <span class="w-1.5 h-1.5 rounded-full bg-[#e9c349]"></span>
              <span>رواق الملاحم</span>
            </button>
            <span class="w-px h-3 bg-white/10"></span>
            <button
              type="button"
              (click)="navigateToRiwaq('riwaq-al-hikma')"
              class="px-4 py-1.5 rounded-full text-[13px] font-medium transition-all cursor-pointer flex items-center gap-1.5"
              [class]="activeRiwaq() === 'riwaq-al-hikma' ? 'text-white font-semibold bg-[#2a2a2c] shadow-sm' : 'text-[#debfc2]/80 hover:text-[#e5e1e4] hover:bg-[#201f22]'"
            >
              <span class="w-1.5 h-1.5 rounded-full bg-white"></span>
              <span>رواق الحكمة</span>
            </button>
            <span class="w-px h-3 bg-white/10"></span>
            <button
              type="button"
              (click)="navigateToRiwaq('riwaq-al-turath')"
              class="px-4 py-1.5 rounded-full text-[13px] font-medium transition-all cursor-pointer flex items-center gap-1.5"
              [class]="activeRiwaq() === 'riwaq-al-turath' ? 'text-[#7bd8b1] font-semibold bg-[#2a2a2c] shadow-sm' : 'text-[#debfc2]/80 hover:text-[#e5e1e4] hover:bg-[#201f22]'"
            >
              <span class="w-1.5 h-1.5 rounded-full bg-[#7bd8b1]"></span>
              <span>رواق التراث</span>
            </button>
          </nav>

          <!-- LEFT: Search, Bookmarks & Profile Actions -->
          <div class="flex items-center gap-3 shrink-0">
            
            <!-- Search Input (Desktop) -->
            <div class="relative hidden md:flex items-center">
              <span class="material-symbols-outlined absolute right-3 text-[#debfc2]/60 text-[19px] pointer-events-none">
                search
              </span>
              <input
                type="text"
                [(ngModel)]="searchQuery"
                (input)="onSearchInput()"
                (focus)="isSearchOpen.set(true)"
                class="w-48 lg:w-64 pl-3 pr-9 py-1.5 bg-[#1c1b1d]/80 text-[#e5e1e4] placeholder-[#debfc2]/50 text-xs rounded-full border border-white/[0.08] focus:outline-none focus:w-72 focus:bg-[#201f22] focus:border-[#e9c349]/40 transition-all duration-300 shadow-inner backdrop-blur-sm"
                placeholder="ابحث في الأسفار والمخطوطات..."
              />
              @if (searchQuery().trim()) {
                <button
                  type="button"
                  (click)="searchQuery.set(''); isSearchOpen.set(false)"
                  class="absolute left-2.5 text-[#debfc2]/50 hover:text-white"
                >
                  <span class="material-symbols-outlined text-[16px]">close</span>
                </button>
              }
            </div>

            <!-- Mobile Search Toggle Button -->
            <button
              type="button"
              (click)="isMobileSearchOpen.set(!isMobileSearchOpen())"
              class="md:hidden p-2 text-[#debfc2] hover:text-[#e9c349] transition-colors rounded-full hover:bg-white/5 cursor-pointer"
              aria-label="البحث"
            >
              <span class="material-symbols-outlined text-[20px]">search</span>
            </button>

            <!-- Bookmarks Button (خزانة المحفوظات) -->
            <a
              routerLink="/profile"
              class="relative p-2 text-[#debfc2] hover:text-[#ffb2bd] transition-colors rounded-full hover:bg-white/5 cursor-pointer"
              aria-label="المحفوظات الشخصية"
              title="خزانة المحفوظات والمخطوطات"
            >
              <span class="material-symbols-outlined text-[22px]">bookmark</span>
              @if (novelStore.bookmarkedNovelIds().length > 0) {
                <span class="absolute top-1 right-1 w-4 h-4 rounded-full bg-[#881337] text-[#ffb2bd] text-[9px] font-bold flex items-center justify-center border border-[#ffb2bd]/30">
                  {{ novelStore.bookmarkedNovelIds().length }}
                </span>
              }
            </a>

            <!-- Profile / Sign In Button -->
            <a
              [routerLink]="authStore.isAuthenticated() ? '/profile' : '/login'"
              class="w-9 h-9 rounded-full bg-gradient-to-br from-[#881337] to-[#201f22] border border-[#ffb2bd]/30 flex items-center justify-center shrink-0 text-[#ffb2bd] hover:border-[#ffb2bd] transition-all shadow-md overflow-hidden cursor-pointer"
              [title]="authStore.isAuthenticated() ? authStore.displayName() : 'تسجيل الدخول'"
            >
              @if (authStore.photoURL()) {
                <img [src]="authStore.photoURL()" alt="avatar" class="w-full h-full object-cover" />
              } @else {
                <span class="material-symbols-outlined text-[19px]">person</span>
              }
            </a>

            <!-- Mobile Hamburger Toggle -->
            <button
              type="button"
              (click)="isMobileMenuOpen.set(!isMobileMenuOpen())"
              class="xl:hidden p-2 text-[#debfc2] hover:text-white rounded-lg hover:bg-white/5 cursor-pointer"
              aria-label="القائمة"
            >
              <span class="material-symbols-outlined text-[24px]">
                {{ isMobileMenuOpen() ? 'close' : 'menu' }}
              </span>
            </button>
          </div>
        </div>

        <!-- Mobile Search Row -->
        @if (isMobileSearchOpen()) {
          <div class="md:hidden px-4 py-2.5 bg-[#131315]/95 backdrop-blur-2xl border-t border-white/[0.06] flex items-center gap-2">
            <span class="material-symbols-outlined text-[#debfc2]/60 text-[20px]">search</span>
            <input
              type="text"
              [(ngModel)]="searchQuery"
              (input)="onSearchInput()"
              (focus)="isSearchOpen.set(true)"
              class="flex-1 bg-transparent text-sm text-[#e5e1e4] placeholder-[#debfc2]/50 focus:outline-none"
              placeholder="ابحث في الأسفار والمخطوطات..."
            />
            @if (searchQuery().trim()) {
              <button type="button" (click)="searchQuery.set(''); isSearchOpen.set(false)" class="text-[#debfc2]">
                <span class="material-symbols-outlined text-[18px]">close</span>
              </button>
            }
          </div>
        }

        <!-- Search Live Results Dropdown -->
        @if (isSearchOpen() && searchResults().length > 0) {
          <div class="absolute top-full inset-x-0 md:inset-x-auto md:left-12 md:w-96 bg-[#1c1b1d]/95 backdrop-blur-3xl border border-white/10 rounded-b-2xl shadow-2xl p-3 max-h-96 overflow-y-auto z-50">
            <div class="text-[11px] font-semibold text-[#e9c349] mb-2 px-2 flex items-center justify-between">
              <span>نتائج البحث ({{ searchResults().length }} سفر)</span>
              <button type="button" (click)="isSearchOpen.set(false)" class="text-[#debfc2]/60 hover:text-white text-xs">
                إغلاق
              </button>
            </div>
            <div class="flex flex-col gap-1.5">
              @for (novel of searchResults(); track novel.id) {
                <a
                  [routerLink]="['/novel', novel.id]"
                  (click)="isSearchOpen.set(false); isMobileSearchOpen.set(false)"
                  class="flex items-center gap-3 p-2 rounded-xl hover:bg-white/5 transition-colors cursor-pointer group"
                >
                  <img
                    [src]="novel.coverImage || 'assist/img/logo.png'"
                    [alt]="novel.title"
                    class="w-10 h-14 rounded object-cover shadow-sm shrink-0"
                  />
                  <div class="flex flex-col min-w-0">
                    <span class="text-sm font-semibold text-[#e5e1e4] group-hover:text-[#ffb2bd] truncate">
                      {{ novel.title }}
                    </span>
                    <span class="text-xs text-[#debfc2]/70 truncate">{{ novel.author }}</span>
                    <span class="text-[10px] text-[#e9c349] mt-0.5">{{ novel.riwaqName }}</span>
                  </div>
                </a>
              }
            </div>
          </div>
        }

        <!-- Mobile Navigation Drawer -->
        @if (isMobileMenuOpen()) {
          <div class="xl:hidden bg-[#0a0a0c]/95 backdrop-blur-3xl border-t border-white/[0.08] px-5 py-6 flex flex-col gap-5 animate-in fade-in duration-200">
            
            <!-- Sanctuaries Header -->
            <div class="flex items-center justify-between">
              <div class="text-xs font-semibold text-[#e9c349] tracking-wider flex items-center gap-1.5">
                <span class="material-symbols-outlined text-[16px]">account_balance</span>
                <span>الأروقة السردية الكبرى</span>
              </div>
              <span class="text-[10px] text-[#debfc2]/60">اختر الرواق للدخول المباشر</span>
            </div>

            <!-- Sanctuary Custom Image Buttons (بتضليل واندماج مرتب) -->
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              @for (sanctuary of sanctuaries; track sanctuary.id) {
                <button
                  type="button"
                  (click)="navigateToRiwaq(sanctuary.id)"
                  class="relative h-18 rounded-xl overflow-hidden border border-white/10 hover:border-white/30 text-right p-3.5 flex items-center justify-between group cursor-pointer transition-all duration-300 shadow-md"
                >
                  <!-- Background Sanctuary Image -->
                  <div
                    class="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105 filter brightness-[0.6]"
                    [style.backgroundImage]="'url(' + sanctuary.btnBgImage + ')'"
                  ></div>

                  <!-- Dark Shading & Atmospheric Tint for Crisp Contrast -->
                  <div class="absolute inset-0 bg-gradient-to-r from-[#0a0a0c]/90 via-[#0a0a0c]/70 to-[#0a0a0c]/85"></div>

                  <!-- Right Accent Glow Stripe -->
                  <div
                    class="absolute inset-y-0 right-0 w-1"
                    [style.backgroundColor]="sanctuary.accent"
                  ></div>

                  <!-- Text Details -->
                  <div class="relative z-10 flex items-center gap-2.5 pr-1">
                    <div
                      class="w-8 h-8 rounded-lg bg-black/50 border border-white/15 flex items-center justify-center shrink-0 shadow-inner"
                      [style.color]="sanctuary.accent"
                    >
                      <span class="material-symbols-outlined text-[18px]">
                        @switch (sanctuary.id) {
                          @case ('riwaq-al-riwayat') { auto_stories }
                          @case ('riwaq-al-malahim') { swords }
                          @case ('riwaq-al-hikma') { psychology }
                          @default { history_edu }
                        }
                      </span>
                    </div>
                    <div class="flex flex-col">
                      <span class="text-xs font-bold text-white group-hover:text-[#ffd9dd] transition-colors">
                        {{ sanctuary.name }}
                      </span>
                      <span class="text-[10px] text-[#debfc2]/70 font-medium">
                        {{ sanctuary.subtitle }}
                      </span>
                    </div>
                  </div>

                  <!-- Directional Indicator Icon -->
                  <span
                    class="relative z-10 material-symbols-outlined text-[18px] transition-transform duration-300 group-hover:-translate-x-1"
                    [style.color]="sanctuary.accent"
                  >
                    west
                  </span>
                </button>
              }
            </div>

            <!-- Website Navigation Links -->
            <div class="pt-3 border-t border-white/10 flex flex-col gap-2">
              <span class="text-[11px] font-semibold text-[#e9c349] tracking-wider">
                روابط الموقع الأساسية
              </span>
              <div class="grid grid-cols-2 gap-2 text-xs">
                <a
                  routerLink="/"
                  (click)="isMobileMenuOpen.set(false)"
                  class="p-2.5 rounded-lg bg-[#1c1b1d]/80 hover:bg-white/5 border border-white/5 text-[#debfc2] hover:text-white flex items-center gap-2 transition-colors"
                >
                  <span class="material-symbols-outlined text-[16px] text-[#e9c349]">home</span>
                  <span>الرئيسية والصرح</span>
                </a>
                <a
                  routerLink="/profile"
                  (click)="isMobileMenuOpen.set(false)"
                  class="p-2.5 rounded-lg bg-[#1c1b1d]/80 hover:bg-white/5 border border-white/5 text-[#debfc2] hover:text-white flex items-center gap-2 transition-colors"
                >
                  <span class="material-symbols-outlined text-[16px] text-[#ffb2bd]">bookmark</span>
                  <span>المحفوظات ({{ novelStore.bookmarkedNovelIds().length }})</span>
                </a>
                <a
                  [routerLink]="authStore.isAuthenticated() ? '/profile' : '/login'"
                  (click)="isMobileMenuOpen.set(false)"
                  class="col-span-2 p-2.5 rounded-lg bg-[#1c1b1d]/80 hover:bg-white/5 border border-white/5 text-[#debfc2] hover:text-white flex items-center justify-between transition-colors"
                >
                  <div class="flex items-center gap-2">
                    <span class="material-symbols-outlined text-[16px] text-[#7bd8b1]">account_circle</span>
                    <span>{{ authStore.isAuthenticated() ? 'الملف الشخصي (' + authStore.displayName() + ')' : 'تسجيل الدخول للقارئ' }}</span>
                  </div>
                  <span class="material-symbols-outlined text-[14px]">arrow_back</span>
                </a>
              </div>
            </div>

          </div>
        }
      </div>
    </header>
  `,
})
export class Header {
  readonly novelStore = inject(NovelStore);
  readonly authStore = inject(AuthStore);
  private readonly router = inject(Router);

  readonly sanctuaries = SANCTUARIES_DATA;
  readonly isMobileMenuOpen = signal<boolean>(false);
  readonly isMobileSearchOpen = signal<boolean>(false);
  readonly isSearchOpen = signal<boolean>(false);
  readonly searchQuery = signal<string>('');
  readonly activeRiwaq = signal<string>('all');

  private lastScrollY = 0;
  readonly isHeaderHidden = signal<boolean>(false);

  readonly searchResults = computed(() => {
    const q = this.searchQuery().trim().toLowerCase();
    if (!q) return [];
    return this.novelStore.novels().filter(n =>
      n.title.toLowerCase().includes(q) ||
      n.author.toLowerCase().includes(q) ||
      n.category.toLowerCase().includes(q) ||
      (n.riwaqName && n.riwaqName.toLowerCase().includes(q))
    );
  });

  onWindowScroll(): void {
    if (typeof window === 'undefined') return;
    const currentY = window.scrollY || window.pageYOffset || 0;
    
    // Within the top 30px, the header is always revealed
    if (currentY <= 30) {
      this.isHeaderHidden.set(false);
    } else {
      // Past 30px:
      // When scrolling down past 30px, header disappears
      // When scrolling up, it smoothly reappears
      const diff = currentY - this.lastScrollY;
      if (diff > 5) {
        this.isHeaderHidden.set(true);
      } else if (diff < -15) {
        this.isHeaderHidden.set(false);
      }
    }
    this.lastScrollY = currentY;
  }

  onSearchInput(): void {
    if (this.searchQuery().trim()) {
      this.isSearchOpen.set(true);
    }
  }

  navigateToRiwaq(riwaqId: string): void {
    this.activeRiwaq.set(riwaqId);
    this.isMobileMenuOpen.set(false);
    this.novelStore.selectedCategoryFilter.set(riwaqId);
    
    // Smooth scroll to the target sanctuary anchor if on home, or navigate home first
    if (this.router.url === '/' || this.router.url.startsWith('/#')) {
      const el = document.getElementById(riwaqId);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    } else {
      this.router.navigate(['/']).then(() => {
        setTimeout(() => {
          const el = document.getElementById(riwaqId);
          if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
        }, 150);
      });
    }
  }
}

