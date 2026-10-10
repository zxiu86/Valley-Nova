import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-footer',
  imports: [RouterLink],
  template: `
    <footer class="w-full bg-[#0e0e10] border-t border-white/[0.06] text-[#e5e1e4] transition-colors">
      <div class="w-full px-4 sm:px-6 md:px-12 py-12">
        <div class="grid grid-cols-1 md:grid-cols-12 gap-10 pb-10 border-b border-white/[0.06]">
          
          <!-- Column 1: Brand & Lore -->
          <div class="md:col-span-5 flex flex-col gap-3">
            <div class="flex items-baseline gap-2">
              <span class="font-noto-serif text-2xl font-bold text-[#e5e1e4]">أروقة الخلود</span>
              <span class="w-1.5 h-1.5 rounded-full bg-[#e9c349] inline-block shadow-[0_0_8px_rgba(233,195,73,0.8)]"></span>
            </div>
            <p class="text-sm text-[#debfc2]/80 leading-relaxed max-w-md">
              معبد بصري وسينمائي تلتقي فيه أزمنة الأدب العربي والإنساني بتجربة جمالية نقية. نلغي الضجيج الرقمي لنفسح المجال أمام جلال النص وعظمة التراث.
            </p>
            <blockquote class="font-noto-serif text-sm text-[#debfc2]/90 italic border-r-2 border-[#e9c349]/60 pr-3 mt-2">
              «والحرفُ يبقى بعد موتِ رواتهِ دهراً، وتفنى في الترابِ العظامُ»
            </blockquote>
          </div>

          <!-- Column 2: The Four Sanctuaries -->
          <div class="md:col-span-4 flex flex-col gap-3">
            <span class="text-xs font-bold text-[#e9c349] tracking-wider uppercase">الأروقة الأربعة</span>
            <div class="flex flex-col gap-2 text-sm">
              <a
                routerLink="/riwaq-al-riwayat"
                class="text-[#debfc2]/80 hover:text-[#ffb2bd] transition-colors cursor-pointer"
              >
                رواق الروايات (Crimson Noir)
              </a>
              <a
                routerLink="/"
                fragment="riwaq-al-malahim"
                class="text-[#debfc2]/80 hover:text-[#e9c349] transition-colors cursor-pointer"
              >
                رواق الملاحم (Mythic Bronze)
              </a>
              <a
                routerLink="/"
                fragment="riwaq-al-hikma"
                class="text-[#debfc2]/80 hover:text-white transition-colors cursor-pointer"
              >
                رواق الحكمة (Ivory Sanctuary)
              </a>
              <a
                routerLink="/"
                fragment="riwaq-al-turath"
                class="text-[#debfc2]/80 hover:text-[#7bd8b1] transition-colors cursor-pointer"
              >
                رواق التراث (Manuscript Emerald)
              </a>
            </div>
          </div>

          <!-- Column 3: The Charter & Archives -->
          <div class="md:col-span-3 flex flex-col gap-3">
            <span class="text-xs font-bold text-[#e9c349] tracking-wider uppercase">الميثاق التحريري</span>
            <div class="flex flex-col gap-2 text-sm">
              <a
                routerLink="/"
                fragment="sanctuary-charter"
                class="text-[#debfc2]/80 hover:text-[#e5e1e4] transition-colors cursor-pointer"
              >
                فلسفة الصرح وميثاقه
              </a>
              <a
                routerLink="/profile"
                class="text-[#debfc2]/80 hover:text-[#e5e1e4] transition-colors cursor-pointer"
              >
                خزانة المخطوطات والمحفوظات
              </a>
              <span class="text-xs text-[#debfc2]/50">
                قراءة نقية مشفرة بـ MTX فائقة السرعة
              </span>
            </div>
          </div>
        </div>

        <!-- Bottom Copyright Row -->
        <div class="pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#debfc2]/60">
          <span>جميع الحقوق محفوظة لصرح أروقة الخلود © 2025</span>
          <div class="flex items-center gap-4">
            <span class="opacity-75">عمارة سردية رقمية فاخرة</span>
            <span class="w-1 h-1 rounded-full bg-[#e9c349]"></span>
            <span>تقنية ضغط MTX المدمجة</span>
          </div>
        </div>
      </div>
    </footer>
  `,
})
export class Footer {}
