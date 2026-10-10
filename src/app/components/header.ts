import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { NovelStore } from '../core/novel-store';
import { AuthStore } from '../core/auth-store';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-header',
  imports: [RouterLink, MatIconModule],
  template: `
    <header class="sticky top-0 z-50 liquid-glass-header text-stone-100 transition-all duration-300">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex items-center justify-between h-20">
          
          <!-- RIGHT: Website Logo & Name (شعار الموقع واسم مقاتل الروايات) -->
          <div class="flex items-center gap-3">
            <a routerLink="/" (click)="closeMenu()" class="flex items-center gap-3 group cursor-pointer focus-visible:outline-none">
              
              <!-- Site Logo with multi-format fallback (PNG, SVG, ICO) -->
              <div class="relative w-11 h-11 rounded-2xl overflow-hidden liquid-glass flex items-center justify-center border border-rose-500/25 group-hover:border-rose-500/60 transition-all shadow-md p-1">
                <picture class="w-full h-full flex items-center justify-center">
                  <source srcset="assist/img/logo.png" type="image/png">
                  <source srcset="assist/img/logo.svg" type="image/svg+xml">
                  <img
                    src="assist/img/logo.ico"
                    alt="شعار مقاتل الروايات"
                    class="w-full h-full object-contain group-hover:scale-105 transition-transform"
                    (error)="onLogoError()"
                  />
                </picture>

                @if (logoFailed()) {
                  <!-- Elegant Arabic Emblem Fallback -->
                  <div class="absolute inset-0 bg-gradient-to-br from-rose-600 via-rose-800 to-stone-950 flex items-center justify-center font-amiri font-bold text-2xl text-white shadow-inner">
                    م
                  </div>
                }
              </div>

              <!-- Brand Name Typography -->
              <div class="flex flex-col">
                <span class="text-2xl sm:text-3xl font-extrabold font-amiri text-white tracking-wide group-hover:text-rose-400 transition-colors">
                  مقاتل الروايات
                </span>
                <span class="text-[10px] text-rose-400/90 font-sans tracking-widest font-bold uppercase -mt-1">
                  عالم الروايات العربية والمترجمة
                </span>
              </div>
            </a>
          </div>

          <!-- MIDDLE: Desktop Website Navigation Links (شريط تنقل موقع الويب لسطح المكتب) -->
          <nav aria-label="التنقل الرئيسي للموقع" class="hidden lg:flex items-center gap-1 xl:gap-2 mx-4">
            <a
              routerLink="/"
              class="px-3 py-2 rounded-xl text-xs xl:text-sm font-semibold text-stone-300 hover:text-white hover:bg-white/5 transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <mat-icon class="text-base text-rose-400">home</mat-icon>
              <span>الرئيسية</span>
            </a>

            <a
              routerLink="/library"
              class="px-3 py-2 rounded-xl text-xs xl:text-sm font-semibold text-stone-300 hover:text-white hover:bg-white/5 transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <mat-icon class="text-base text-rose-400">auto_stories</mat-icon>
              <span>المكتبة الشاملة</span>
            </a>

            <button
              type="button"
              (click)="scrollToSection('leaderboard')"
              class="px-3 py-2 rounded-xl text-xs xl:text-sm font-semibold text-stone-300 hover:text-white hover:bg-white/5 transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <mat-icon class="text-base text-amber-400">trending_up</mat-icon>
              <span>الأكثر قراءة</span>
            </button>

            <button
              type="button"
              (click)="scrollToSection('latest-additions')"
              class="px-3 py-2 rounded-xl text-xs xl:text-sm font-semibold text-stone-300 hover:text-white hover:bg-white/5 transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <mat-icon class="text-base text-rose-400">auto_awesome</mat-icon>
              <span>آخر الإضافات</span>
            </button>

            <button
              type="button"
              (click)="scrollToSection('latest-chapters')"
              class="px-3 py-2 rounded-xl text-xs xl:text-sm font-semibold text-stone-300 hover:text-white hover:bg-white/5 transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <mat-icon class="text-base text-emerald-400">menu_book</mat-icon>
              <span>أحدث الفصول</span>
            </button>

            <a
              routerLink="/editor"
              class="px-3 py-2 rounded-xl text-xs xl:text-sm font-semibold text-rose-300 hover:text-white hover:bg-rose-950/40 border border-rose-500/20 hover:border-rose-500/40 transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <mat-icon class="text-base text-rose-400">edit_note</mat-icon>
              <span>لوحة النشر</span>
            </a>
          </nav>

          <!-- FAR LEFT: Search + User Account + Mobile Hamburger -->
          <div class="flex items-center gap-2 sm:gap-3">
            
            <!-- Quick Desktop Search Input -->
            <div class="relative hidden xl:block w-52">
              <input
                type="text"
                placeholder="ابحث في الموقع..."
                [value]="navSearchQuery()"
                (input)="onNavSearchInput($event)"
                (keydown.enter)="onNavSearchSubmit()"
                class="w-full bg-stone-900/90 border border-white/10 focus:border-rose-500 rounded-xl pr-9 pl-3 py-1.5 text-xs text-white placeholder-stone-500 focus:outline-none transition-all shadow-inner"
              />
              <button
                type="button"
                (click)="onNavSearchSubmit()"
                class="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-rose-400 cursor-pointer"
                aria-label="بحث في الروايات"
              >
                <mat-icon class="text-base">search</mat-icon>
              </button>
            </div>

            <!-- Quick Auth Status Button in Desktop Navbar -->
            @if (authStore.isAuthenticated()) {
              <a
                routerLink="/profile"
                (click)="closeMenu()"
                class="hidden sm:flex items-center gap-2 py-1.5 px-3 rounded-2xl liquid-glass border border-rose-500/30 hover:border-rose-500/60 transition-all text-xs cursor-pointer group"
                title="الملف الشخصي وإعدادات الحساب"
              >
                @if (authStore.photoURL()) {
                  <img
                    [src]="authStore.photoURL()"
                    alt="صورة القارئ"
                    referrerpolicy="no-referrer"
                    class="w-7 h-7 rounded-full object-cover border border-rose-400"
                  />
                } @else {
                  <div class="w-7 h-7 rounded-full bg-rose-600 text-white font-bold flex items-center justify-center text-xs">
                    {{ authStore.displayName().charAt(0) || 'ق' }}
                  </div>
                }
                <span class="font-bold text-white group-hover:text-rose-400 transition-colors max-w-[100px] truncate">
                  {{ authStore.displayName() }}
                </span>
              </a>
            } @else {
              <a
                routerLink="/login"
                (click)="closeMenu()"
                class="hidden sm:flex items-center gap-1.5 py-2 px-3.5 rounded-2xl bg-gradient-to-l from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 text-white font-bold text-xs shadow-md transition-all cursor-pointer"
                title="تسجيل الدخول أو إنشاء حساب"
              >
                <mat-icon class="text-base">login</mat-icon>
                <span>دخول / تسجيل</span>
              </a>
            }

            <!-- Mobile Drawer Button (شاشات الهاتف والأجهزة اللوحية) -->
            <button
              (click)="toggleMenu()"
              aria-label="قائمة مقاتل الروايات"
              class="lg:hidden w-11 h-11 rounded-2xl liquid-glass flex items-center justify-center text-rose-200 hover:text-white hover:bg-rose-950/40 border border-white/10 hover:border-rose-500/40 shadow-sm transition-all cursor-pointer"
            >
              <mat-icon class="text-2xl transition-transform duration-300" [class.rotate-90]="isMenuOpen()">
                {{ isMenuOpen() ? 'close' : 'menu' }}
              </mat-icon>
            </button>
          </div>

        </div>
      </div>
    </header>

    <!-- Liquid Glass Slide-over Drawer / Menu with Smooth Fluid Animations -->
    <!-- Smooth Frosted Backdrop with Gentle Fade -->
    <div
      class="fixed inset-0 z-40 bg-black/80 backdrop-blur-md transition-opacity duration-300 ease-out"
      [class.opacity-100]="isMenuOpen()"
      [class.pointer-events-auto]="isMenuOpen()"
      [class.opacity-0]="!isMenuOpen()"
      [class.pointer-events-none]="!isMenuOpen()"
    >
      <button
        type="button"
        (click)="closeMenu()"
        aria-label="إغلاق القائمة"
        class="w-full h-full border-none cursor-default bg-transparent"
      ></button>
    </div>

    <!-- Fluid Slide-over Drawer with Luxurious Modern Layout -->
    <aside
      class="fixed top-0 left-0 bottom-0 z-50 w-full max-w-sm liquid-glass bg-stone-950/95 border-r border-rose-500/20 shadow-2xl flex flex-col justify-between p-5 sm:p-6 overflow-y-auto transform transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]"
      [class.translate-x-0]="isMenuOpen()"
      [class.-translate-x-full]="!isMenuOpen()"
    >
        
        <!-- Drawer Content Upper -->
        <div class="space-y-6">
          
          <!-- Drawer Header -->
          <div class="flex items-center justify-between border-b border-rose-500/15 pb-4">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-2xl liquid-glass border border-rose-500/30 flex items-center justify-center p-1 shadow-sm">
                <img
                  src="assist/img/logo.png"
                  alt="مقاتل الروايات"
                  class="w-full h-full object-contain"
                />
              </div>
              <div>
                <h3 class="text-lg font-bold font-amiri text-white">مقاتل الروايات</h3>
                <span class="text-[10px] text-rose-400">القائمة والتصفح الذكي</span>
              </div>
            </div>

            <button
              (click)="closeMenu()"
              aria-label="إغلاق القائمة"
              class="w-9 h-9 rounded-xl liquid-glass flex items-center justify-center text-stone-400 hover:text-white cursor-pointer transition-colors"
            >
              <mat-icon class="text-xl">close</mat-icon>
            </button>
          </div>

          <!-- 1. USER PROFILE SECTION (أنظف وأجمل بدون أي ذكر تقني) -->
          <div class="p-4 rounded-2xl liquid-glass border border-rose-500/20 space-y-3">
            @if (authStore.isAuthenticated()) {
              <div class="flex items-center gap-3">
                @if (authStore.photoURL()) {
                  <img
                    [src]="authStore.photoURL()"
                    alt="صورة القارئ"
                    referrerpolicy="no-referrer"
                    class="w-11 h-11 rounded-full object-cover border-2 border-rose-500 shrink-0 shadow-sm"
                  />
                } @else {
                  <div class="w-11 h-11 rounded-full bg-gradient-to-br from-rose-600 to-rose-900 border border-rose-400 text-white font-bold flex items-center justify-center text-lg shrink-0 shadow-sm">
                    {{ authStore.displayName().charAt(0) || 'ق' }}
                  </div>
                }
                <div class="min-w-0 flex-1">
                  <span class="text-sm font-bold text-white font-amiri block truncate">
                    {{ authStore.displayName() }}
                  </span>
                  <span class="text-[11px] text-stone-400 font-mono block truncate">
                    {{ authStore.userEmail() }}
                  </span>
                </div>
              </div>

              <div class="grid grid-cols-2 gap-2 pt-2 border-t border-white/10">
                <a
                  routerLink="/profile"
                  (click)="closeMenu()"
                  class="py-2 px-3 rounded-xl bg-white/10 hover:bg-white/20 text-center text-xs text-stone-200 font-medium transition-colors cursor-pointer flex items-center justify-center gap-1"
                >
                  <mat-icon class="text-sm text-rose-400">account_circle</mat-icon>
                  <span>حسابي</span>
                </a>
                <button
                  type="button"
                  (click)="authStore.logout(); closeMenu()"
                  class="py-2 px-3 rounded-xl bg-rose-950/60 hover:bg-rose-900 border border-rose-500/30 text-rose-300 text-xs transition-colors cursor-pointer flex items-center justify-center gap-1"
                >
                  <mat-icon class="text-sm">logout</mat-icon>
                  <span>تسجيل خروج</span>
                </button>
              </div>
            } @else {
              <div class="space-y-2">
                <div class="flex items-center gap-2 text-xs font-bold text-stone-200">
                  <mat-icon class="text-rose-400 text-base">person</mat-icon>
                  <span>حساب القارئ</span>
                </div>
                <p class="text-[11px] text-stone-400 leading-relaxed font-sans">
                  سجّل دخولك لحفظ تقدم القراءة، مزامنة فصولك، وتقييم رواياتك المفضلة.
                </p>
                <a
                  routerLink="/login"
                  (click)="closeMenu()"
                  class="w-full py-2.5 px-3.5 rounded-xl bg-gradient-to-l from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer mt-1"
                >
                  <mat-icon class="text-base">login</mat-icon>
                  <span>تسجيل الدخول / إنشاء حساب</span>
                </a>
              </div>
            }
          </div>

          <!-- 2. MAIN NAVIGATION SECTIONS -->
          <div class="space-y-1">
            <span class="text-[10px] font-bold text-stone-400 uppercase tracking-wider block px-2 mb-1.5">
              تصفح الأقسام والروايات
            </span>

            <a
              routerLink="/"
              (click)="closeMenu()"
              class="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium text-stone-200 hover:text-white hover:bg-rose-950/40 hover:border hover:border-rose-500/20 transition-all cursor-pointer"
            >
              <mat-icon class="text-rose-400 text-lg">auto_stories</mat-icon>
              <span>الرئيسية (استكشاف الروايات)</span>
            </a>

            <a
              routerLink="/reader"
              (click)="closeMenu()"
              class="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium text-stone-200 hover:text-white hover:bg-rose-950/40 hover:border hover:border-rose-500/20 transition-all cursor-pointer"
            >
              <mat-icon class="text-rose-400 text-lg">menu_book</mat-icon>
              <span>متابعة القراءة</span>
            </a>

            <a
              routerLink="/login"
              (click)="closeMenu()"
              class="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium text-stone-200 hover:text-white hover:bg-rose-950/40 hover:border hover:border-rose-500/20 transition-all cursor-pointer"
            >
              <mat-icon class="text-rose-400 text-lg">manage_accounts</mat-icon>
              <span>إدارة الحساب والمزامنة</span>
            </a>
          </div>

          <!-- 3. READER UTILITIES (فتح ملف رواية محلي) -->
          <div class="space-y-1.5 pt-3 border-t border-rose-500/15">
            <span class="text-[10px] font-bold text-stone-400 uppercase tracking-wider block px-2 mb-1.5">
              أدوات القارئ
            </span>

            <label class="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium text-stone-200 hover:text-white hover:bg-rose-950/40 hover:border hover:border-rose-500/20 transition-all cursor-pointer">
              <mat-icon class="text-rose-400 text-lg">file_upload</mat-icon>
              <span>فتح ملف رواية محفوظ محلياً (.mtx)</span>
              <input
                type="file"
                accept=".mtx"
                class="hidden"
                (change)="onFileSelected($event)"
              />
            </label>
          </div>

          <!-- 4. LITERARY AMBIENCE BADGE -->
          <div class="p-3.5 rounded-2xl liquid-glass border border-rose-500/15 space-y-1">
            <div class="flex items-center gap-1.5 text-xs font-bold text-rose-300">
              <mat-icon class="text-sm text-rose-400">verified</mat-icon>
              <span>منصة عربية رائدة</span>
            </div>
            <p class="text-[11px] text-stone-400 leading-relaxed font-sans">
              قراءة فورية عالية الدقة بدون إعلانات مزعجة، مع حفظ تقدمك ومفضلتك تلقائياً.
            </p>
          </div>

        </div>

        <!-- Drawer Footer -->
        <div class="pt-4 border-t border-rose-500/15 text-center text-[11px] text-stone-500">
          <span>مقاتل الروايات © 2026 · منصة القراءة العربية</span>
        </div>

      </aside>
  `,
})
export class Header {
  readonly store = inject(NovelStore);
  readonly authStore = inject(AuthStore);
  private readonly router = inject(Router);

  readonly isMenuOpen = signal<boolean>(false);
  readonly logoFailed = signal<boolean>(false);
  readonly navSearchQuery = signal<string>('');

  onNavSearchInput(e: Event): void {
    const val = (e.target as HTMLInputElement).value;
    this.navSearchQuery.set(val);
  }

  onNavSearchSubmit(): void {
    const q = this.navSearchQuery().trim();
    if (q) {
      this.router.navigate(['/library'], { queryParams: { q } });
    }
  }

  scrollToSection(sectionId: string): void {
    this.closeMenu();
    const currentUrl = this.router.url;
    if (currentUrl === '/' || currentUrl.startsWith('/#')) {
      const el = document.getElementById(sectionId);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        return;
      }
    }
    this.router.navigate(['/'], { fragment: sectionId }).then(() => {
      setTimeout(() => {
        const el = document.getElementById(sectionId);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 150);
    });
  }

  toggleMenu(): void {
    this.isMenuOpen.update(v => !v);
  }

  closeMenu(): void {
    this.isMenuOpen.set(false);
  }

  onLogoError(): void {
    this.logoFailed.set(true);
  }

  async onFileSelected(e: Event): Promise<void> {
    const input = e.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;

    const file = input.files[0];
    try {
      const buffer = await file.arrayBuffer();
      const bytes = new Uint8Array(buffer);
      await this.store.importMtxFile(bytes, file.name);
      this.closeMenu();
      this.router.navigate(['/reader']);
    } catch (err) {
      console.error('Error importing novel file:', err);
    } finally {
      input.value = '';
    }
  }
}
