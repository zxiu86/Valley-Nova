import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { NovelStore } from '../core/novel-store';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-footer',
  imports: [RouterLink, MatIconModule],
  template: `
    <footer class="relative mt-24 border-t border-rose-500/15 bg-gradient-to-b from-stone-950/80 via-stone-950 to-black text-stone-300">
      
      <!-- Subtle Crimson Ambient Backlight -->
      <div class="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-rose-500/40 to-transparent"></div>
      <div class="absolute -top-24 right-1/4 w-72 h-40 bg-rose-900/10 rounded-full blur-3xl pointer-events-none"></div>

      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 lg:gap-8">
          
          <!-- Column 1: Brand & Bio (2 cols wide on desktop) -->
          <div class="lg:col-span-2 space-y-4">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-2xl bg-gradient-to-br from-rose-600 via-rose-800 to-stone-950 flex items-center justify-center font-amiri font-bold text-white text-xl shadow-md border border-rose-500/30">
                م
              </div>
              <div class="flex flex-col">
                <span class="text-2xl font-bold font-amiri text-white tracking-wide">
                  مقاتل الروايات
                </span>
                <span class="text-[10px] text-rose-400 font-sans tracking-widest font-semibold uppercase -mt-1">
                  Muqatil Al-Riwayat
                </span>
              </div>
            </div>

            <p class="text-xs sm:text-sm text-stone-400 leading-relaxed max-w-sm font-sans">
              منصة أدبية عربية حديثة تحتضن أروع الروايات الخيالية، المترجمة، والتاريخية. صُممت خصيصاً لتوفر للقارئ العربي ملاذاً بصرياً أنيقاً ومريحاً مع أفضل تجربة قراءة تفاعلية.
            </p>

            <div class="flex flex-wrap gap-2 pt-2">
              <span class="px-2.5 py-1 rounded-lg liquid-glass border border-white/5 text-[11px] text-rose-300 flex items-center gap-1">
                <mat-icon class="text-xs text-rose-400">auto_stories</mat-icon>
                <span>مكتبة متجددة</span>
              </span>
              <span class="px-2.5 py-1 rounded-lg liquid-glass border border-white/5 text-[11px] text-stone-300 flex items-center gap-1">
                <mat-icon class="text-xs text-rose-400">dark_mode</mat-icon>
                <span>وضع ليلي مريح</span>
              </span>
              <span class="px-2.5 py-1 rounded-lg liquid-glass border border-white/5 text-[11px] text-stone-300 flex items-center gap-1">
                <mat-icon class="text-xs text-rose-400">offline_bolt</mat-icon>
                <span>قراءة فورية بدون انتظار</span>
              </span>
            </div>
          </div>

          <!-- Column 2: Categories / Genres -->
          <div class="space-y-3">
            <h4 class="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2 border-b border-rose-500/15 pb-2">
              <mat-icon class="text-rose-400 text-sm">category</mat-icon>
              <span>أقسام الروايات</span>
            </h4>
            <ul class="space-y-2 text-xs text-stone-400">
              <li>
                <a routerLink="/" class="hover:text-rose-300 transition-colors flex items-center gap-1.5">
                  <span class="w-1 h-1 rounded-full bg-rose-500"></span>
                  <span>فانتازيا وخيال ملحمي</span>
                </a>
              </li>
              <li>
                <a routerLink="/" class="hover:text-rose-300 transition-colors flex items-center gap-1.5">
                  <span class="w-1 h-1 rounded-full bg-rose-500"></span>
                  <span>روايات مترجمة حصرية</span>
                </a>
              </li>
              <li>
                <a routerLink="/" class="hover:text-rose-300 transition-colors flex items-center gap-1.5">
                  <span class="w-1 h-1 rounded-full bg-rose-500"></span>
                  <span>غموض وتشويق</span>
                </a>
              </li>
              <li>
                <a routerLink="/" class="hover:text-rose-300 transition-colors flex items-center gap-1.5">
                  <span class="w-1 h-1 rounded-full bg-rose-500"></span>
                  <span>أدب وتاريخ عربي</span>
                </a>
              </li>
              <li>
                <a routerLink="/" class="hover:text-rose-300 transition-colors flex items-center gap-1.5">
                  <span class="w-1 h-1 rounded-full bg-rose-500"></span>
                  <span>خيال علمي وسايبربانك</span>
                </a>
              </li>
            </ul>
          </div>

          <!-- Column 3: Reader Navigation -->
          <div class="space-y-3">
            <h4 class="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2 border-b border-rose-500/15 pb-2">
              <mat-icon class="text-rose-400 text-sm">menu_book</mat-icon>
              <span>تجربة القارئ</span>
            </h4>
            <ul class="space-y-2 text-xs text-stone-400">
              <li>
                <a routerLink="/" class="hover:text-rose-300 transition-colors">
                  الروايات الأكثر قراءة
                </a>
              </li>
              <li>
                <a routerLink="/reader" class="hover:text-rose-300 transition-colors">
                  متابعة الفصل الحالي
                </a>
              </li>
              <li>
                <a routerLink="/login" class="hover:text-rose-300 transition-colors">
                  حساب القارئ وتسجيل الدخول
                </a>
              </li>
              <li>
                <button
                  type="button"
                  (click)="resetSampleData()"
                  class="text-left hover:text-rose-300 transition-colors cursor-pointer flex items-center gap-1"
                >
                  <mat-icon class="text-xs">restore</mat-icon>
                  <span>استعادة الروايات الافتراضية</span>
                </button>
              </li>
            </ul>
          </div>

          <!-- Column 4: Platform & Support -->
          <div class="space-y-3">
            <h4 class="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2 border-b border-rose-500/15 pb-2">
              <mat-icon class="text-rose-400 text-sm">info</mat-icon>
              <span>عن المنصة</span>
            </h4>
            <ul class="space-y-2 text-xs text-stone-400">
              <li class="hover:text-rose-300 transition-colors cursor-pointer">
                عن مقاتل الروايات
              </li>
              <li class="hover:text-rose-300 transition-colors cursor-pointer">
                دليل المترجمين والمؤلفين
              </li>
              <li class="hover:text-rose-300 transition-colors cursor-pointer">
                سياسة الخصوصية والاستخدام
              </li>
              <li class="hover:text-rose-300 transition-colors cursor-pointer">
                اتصل بفريق المنصة
              </li>
            </ul>
          </div>

        </div>

        <!-- Bottom Copyright Bar -->
        <div class="mt-14 pt-8 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-stone-500">
          <div class="flex items-center gap-2">
            <span>© 2026 مقاتل الروايات. جميع حقوق الأعمال الأدبية محفوظة لمؤلفيها ومترجميها.</span>
          </div>

          <div class="flex items-center gap-4 text-stone-400">
            <span>صُنع بشغف للأدب العربي</span>
            <button
              type="button"
              (click)="scrollToTop()"
              aria-label="الرجوع لأعلى الصفحة"
              class="w-8 h-8 rounded-xl liquid-glass flex items-center justify-center text-rose-300 hover:text-white border border-rose-500/20 cursor-pointer transition-all"
            >
              <mat-icon class="text-sm">arrow_upward</mat-icon>
            </button>
          </div>
        </div>

      </div>
    </footer>
  `,
})
export class Footer {
  private readonly store = inject(NovelStore);

  resetSampleData(): void {
    if (confirm('هل تريد استعادة الروايات الافتراضية في المكتبة؟')) {
      this.store.resetToDefault();
    }
  }

  scrollToTop(): void {
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }
}
