import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { NovelStore } from '../core/novel-store';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-footer',
  imports: [MatIconModule],
  template: `
    <footer class="bg-stone-950 border-t border-stone-800 text-stone-400 py-12 px-4 sm:px-6 lg:px-8 mt-16">
      <div class="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8">
        
        <!-- Brand & Vision -->
        <div class="md:col-span-2 space-y-4">
          <div class="flex items-center gap-3">
            <div class="w-8 h-8 rounded-lg bg-amber-600 flex items-center justify-center text-stone-950 font-bold">
              <mat-icon class="text-xl">auto_stories</mat-icon>
            </div>
            <span class="text-xl font-bold text-white font-amiri">روايات MTX</span>
            <span class="text-xs bg-amber-950 text-amber-400 border border-amber-800 px-2 py-0.5 rounded font-mono-code">
              Dynamic Dictionary Engine
            </span>
          </div>
          <p class="text-sm leading-relaxed text-stone-400 max-w-md">
            موقع إلكتروني لقراءة ونشر الروايات بنظام ذكي. تم ابتكار صيغة MTX (.mtx) لتقليص استهلاك البيانات بنسبة تتجاوز 75% مع فك تشفير وتجميع فوري في المتصفح، وحفظ تام لكافة الحركات والتشكيل (كَ، كِ، كُ، كْ، م، ن) دون أي فقدان للبيانات.
          </p>
          <div class="flex items-center gap-4 text-xs text-stone-500">
            <span>· نظام خفيف وسريع</span>
            <span>· بدون أي تسجيل دخول</span>
            <span>· تخزين وفك تشفير محلي 100%</span>
          </div>
        </div>

        <!-- MTX Protocol Specs -->
        <div class="space-y-3">
          <h4 class="text-sm font-semibold text-stone-200 uppercase tracking-wider flex items-center gap-1.5">
            <mat-icon class="text-amber-500 text-sm">memory</mat-icon>
            <span>مواصفات صيغة MTX</span>
          </h4>
          <ul class="space-y-2 text-xs">
            <li class="flex items-center justify-between">
              <span class="text-stone-400">توفير الحجم:</span>
              <span class="text-emerald-400 font-mono-code font-bold">70% إلى 85%</span>
            </li>
            <li class="flex items-center justify-between">
              <span class="text-stone-400">سرعة فك التشفير:</span>
              <span class="text-amber-400 font-mono-code font-bold">&lt; 0.5 مللي ثانية</span>
            </li>
            <li class="flex items-center justify-between">
              <span class="text-stone-400">دقة التشكيل (الحركات):</span>
              <span class="text-sky-400 font-bold">100% بدون فقدان (Lossless)</span>
            </li>
            <li class="flex items-center justify-between">
              <span class="text-stone-400">طبقة الأمان:</span>
              <span class="text-stone-300">تشفير XOR ديناميكي متسلسل</span>
            </li>
          </ul>
        </div>

        <!-- Quick Reset & Statistics -->
        <div class="space-y-3">
          <h4 class="text-sm font-semibold text-stone-200 uppercase tracking-wider flex items-center gap-1.5">
            <mat-icon class="text-amber-500 text-sm">analytics</mat-icon>
            <span>إحصائيات المكتبة</span>
          </h4>
          <div class="p-3 bg-stone-900 rounded-xl border border-stone-800 text-xs space-y-2">
            <div class="flex justify-between">
              <span>إجمالي الروايات:</span>
              <span class="font-bold text-white">{{ store.globalStats().totalNovels }}</span>
            </div>
            <div class="flex justify-between">
              <span>إجمالي الفصول:</span>
              <span class="font-bold text-white">{{ store.globalStats().totalChapters }}</span>
            </div>
            <div class="flex justify-between">
              <span>حجم UTF-8 الأصلي:</span>
              <span class="font-mono-code text-stone-300">{{ formatBytes(store.globalStats().totalUtf8Bytes) }}</span>
            </div>
            <div class="flex justify-between">
              <span>حجم بصيغة MTX:</span>
              <span class="font-mono-code text-emerald-400 font-bold">{{ formatBytes(store.globalStats().totalMtxBytes) }}</span>
            </div>
          </div>
          <button
            (click)="resetSampleData()"
            class="text-xs text-stone-400 hover:text-amber-400 flex items-center gap-1 transition-colors cursor-pointer pt-1"
          >
            <mat-icon class="text-sm">restart_alt</mat-icon>
            <span>استعادة الروايات الافتراضية</span>
          </button>
        </div>

      </div>

      <div class="max-w-7xl mx-auto border-t border-stone-800/80 mt-8 pt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-stone-400">
        <div>
          منصة روايات MTX · تم التطوير بأحدث تقنيات Angular ونظام التشفير الثنائي العربي.
        </div>
        <div class="mt-2 sm:mt-0 font-mono-code text-stone-400">
          Magic Header: 0x4D 0x54 0x58 0x31 [MTX1]
        </div>
      </div>
    </footer>
  `,
})
export class Footer {
  readonly store = inject(NovelStore);

  formatBytes(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    return `${(bytes / 1024).toFixed(1)} KB`;
  }

  async resetSampleData(): Promise<void> {
    if (confirm('هل ترغب في إعادة ضبط الروايات إلى حالتها الافتراضية؟')) {
      await this.store.resetToDefault();
    }
  }
}
