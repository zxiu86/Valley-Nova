import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import {
  ARABIAN_FOLK_SIYAR,
  GRAND_ERA_EPICS,
  HELLENIC_WAR_EPICS,
  MESOPOTAMIAN_EASTERN_EPICS,
  MYTHIC_EPOCHS,
  RiwaqEpicItem,
  SPOTLIGHT_EPIC,
  TOP_RANKED_EPICS,
} from '../core/riwaq-epics-data';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-riwaq-epics',
  imports: [RouterLink],
  template: `
    <div class="relative w-full overflow-hidden bg-[#131315] text-[#e5e1e4] font-sans antialiased selection:bg-[#af8d11]/30 selection:text-[#ffe088] min-h-screen">
      
      <!-- Dynamic Sanctuary Ambient Glow Overlay (Bronze & Deep Night) -->
      <div class="pointer-events-none absolute -top-40 right-1/4 w-[650px] h-[650px] rounded-full bg-[#af8d11]/10 blur-[140px] -z-10"></div>
      <div class="pointer-events-none absolute top-96 -left-32 w-[520px] h-[520px] rounded-full bg-[#353437]/20 blur-[130px] -z-10"></div>
      <div class="pointer-events-none absolute top-[1600px] right-10 w-[550px] h-[550px] rounded-full bg-[#e9c349]/8 blur-[160px] -z-10"></div>

      <!-- Active Corridor Sub-Bar (رواق الملاحم - Mythic Bronze & Ancient Stone) -->
      <div class="w-full bg-[#0e0e10]/85 backdrop-blur-md px-4 sm:px-6 lg:px-12 py-3 border-b border-white/[0.06] sticky top-20 z-40 transition-all">
        <div class="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
          <div class="flex items-center gap-2">
            <span class="w-2 h-2 rounded-full bg-[#e9c349] shadow-[0_0_10px_rgba(233,195,73,0.9)] animate-pulse"></span>
            <span class="text-[13px] font-medium text-[#e9c349] tracking-widest uppercase">رواق الملاحم والحروب الأسطورية</span>
            <span class="text-white/30 text-xs font-light">|</span>
            <span class="text-[13px] text-[#debfc2] hidden sm:inline">أصداء الشرق والغرب منذ فجر التاريخ</span>
          </div>

          <!-- Mythic Filter Chips -->
          <div class="flex items-center gap-1.5 overflow-x-auto scrollbar-none py-1 max-w-full">
            <button
              type="button"
              (click)="setActiveFilter('all')"
              class="px-3 py-1 rounded-full text-xs transition-all flex items-center gap-1 shrink-0 cursor-pointer"
              [class]="activeFilter() === 'all' ? 'bg-[#e9c349]/20 text-[#e9c349] font-semibold border border-[#e9c349]/40 shadow-[0_0_12px_rgba(233,195,73,0.2)]' : 'bg-[#2a2a2c]/60 text-[#debfc2] hover:text-[#e5e1e4] hover:bg-[#353437] border border-transparent'"
            >
              <span class="material-symbols-outlined text-[15px]">auto_stories</span>
              <span>الكل (٦٢ ملحمة)</span>
            </button>
            <button
              type="button"
              (click)="scrollToSection('mesopotamian-section', 'east')"
              class="px-3 py-1 rounded-full text-xs transition-all shrink-0 cursor-pointer"
              [class]="activeFilter() === 'east' ? 'bg-[#e9c349]/20 text-[#e9c349] font-semibold border border-[#e9c349]/40' : 'bg-[#2a2a2c]/60 text-[#debfc2] hover:text-[#e5e1e4] hover:bg-[#353437] border border-transparent'"
            >
              أساطير الرافدين والشرق
            </button>
            <button
              type="button"
              (click)="scrollToSection('hellenic-section', 'med')"
              class="px-3 py-1 rounded-full text-xs transition-all shrink-0 cursor-pointer"
              [class]="activeFilter() === 'med' ? 'bg-[#e9c349]/20 text-[#e9c349] font-semibold border border-[#e9c349]/40' : 'bg-[#2a2a2c]/60 text-[#debfc2] hover:text-[#e5e1e4] hover:bg-[#353437] border border-transparent'"
            >
              البحر المتوسط والإغريق
            </button>
            <button
              type="button"
              (click)="scrollToSection('siyar-section', 'siyar')"
              class="px-3 py-1 rounded-full text-xs transition-all shrink-0 cursor-pointer"
              [class]="activeFilter() === 'siyar' ? 'bg-[#e9c349]/20 text-[#e9c349] font-semibold border border-[#e9c349]/40' : 'bg-[#2a2a2c]/60 text-[#debfc2] hover:text-[#e5e1e4] hover:bg-[#353437] border border-transparent'"
            >
              السير الشعبية وتراث الفرسان
            </button>
            <button
              type="button"
              (click)="scrollToSection('epoch-section', 'north')"
              class="px-3 py-1 rounded-full text-xs transition-all shrink-0 cursor-pointer"
              [class]="activeFilter() === 'north' ? 'bg-[#e9c349]/20 text-[#e9c349] font-semibold border border-[#e9c349]/40' : 'bg-[#2a2a2c]/60 text-[#debfc2] hover:text-[#e5e1e4] hover:bg-[#353437] border border-transparent'"
            >
              ملاحم الشمال والجليد
            </button>
          </div>
        </div>
      </div>

      <!-- 1. افتتاحية الرواق: لوح جلجامش والخلود (Monumental Mythic Feature) -->
      <section class="w-full px-4 sm:px-6 lg:px-12 pt-6 pb-10">
        <div class="max-w-7xl mx-auto">
          <div class="relative rounded-2xl overflow-hidden bg-[#0e0e10] border border-white/[0.08] shadow-[0_20px_50px_rgba(0,0,0,0.6)]">
            <!-- Background Atmospheric Illustration & Lighting -->
            <div
              class="absolute inset-0 bg-cover bg-center transition-transform duration-1000 scale-100 hover:scale-105"
              style="background-image: url('https://lh3.googleusercontent.com/aida-public/AB6AXuDER0tggkSJ75VSsepopThpnX0urMBII4Mw0WXrgylsrPNsbHARxrhHDurVap24jKTK1DaYIcwIsee3dCyEMU5pCnSnclqeFfSH2maIciBfUqKGEYD7VGjecGPotUp8bDko5GJXCmVqw0jqJBlWxEqFhMWtSh_bnnu4gSR4Frf8-2kOMnwT147XW46dSBE82kEm8o1SYmvQ8h_ryXUXnNwxZ0uKbdudo4q6eb-ZR5RDas61KcR2NW0yqA')"
            ></div>
            <div class="absolute inset-0 bg-gradient-to-t from-[#0e0e10] via-[#0e0e10]/85 to-transparent"></div>
            <div class="absolute inset-0 bg-gradient-to-l from-[#0e0e10] via-[#0e0e10]/70 to-transparent"></div>

            <!-- Feature Content Grid -->
            <div class="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-end p-6 sm:p-8 lg:p-12">
              <!-- Textual Sanctuary Column -->
              <div class="lg:col-span-8 flex flex-col gap-4">
                <div class="flex items-center gap-2 text-[#e9c349]">
                  <span class="material-symbols-outlined text-[20px]">history_edu</span>
                  <span class="text-xs uppercase tracking-widest font-semibold">{{ spotlight.badge }}</span>
                </div>

                <h1 class="font-noto-serif text-3xl sm:text-4xl lg:text-5xl font-bold text-[#e5e1e4] tracking-tight leading-tight">
                  {{ spotlight.title }}
                </h1>

                <p class="font-noto-serif text-base sm:text-lg text-[#ffe088] max-w-2xl font-light italic leading-relaxed">
                  {{ spotlight.quote }}
                </p>

                <p class="text-sm sm:text-base text-[#debfc2] max-w-2xl leading-relaxed">
                  {{ spotlight.description }}
                </p>

                <!-- Action & Relic Stats -->
                <div class="flex flex-wrap items-center gap-3 pt-2">
                  <a
                    [routerLink]="['/reader', spotlight.id]"
                    class="px-6 py-2.5 rounded-full bg-[#e9c349] text-[#241a00] text-xs font-bold tracking-wider hover:brightness-110 shadow-[0_0_24px_rgba(233,195,73,0.35)] transition-all flex items-center gap-2 cursor-pointer"
                  >
                    <span class="material-symbols-outlined text-[18px]">menu_book</span>
                    <span>ولوج الألواح الاثني عشر</span>
                  </a>

                  <button
                    type="button"
                    (click)="toggleMythicAudio()"
                    class="px-5 py-2.5 rounded-full bg-[#2a2a2c]/90 text-[#e5e1e4] text-xs font-semibold hover:bg-[#353437] transition-all flex items-center gap-2 border border-white/10 cursor-pointer"
                  >
                    <span class="material-symbols-outlined text-[18px]" [class.text-[#e9c349]]="isAudioChanting()">
                      {{ isAudioChanting() ? 'graphic_eq' : 'volume_up' }}
                    </span>
                    <span>{{ isAudioChanting() ? 'إيقاف الترتيل الملحمي' : 'الإنشاد الملحمي السومري' }}</span>
                  </button>

                  <span class="text-xs text-white/50 px-2">طول الملحمة: ٣٦٠٠ بيت شعري</span>
                </div>
              </div>

              <!-- Visual Monolith Monument (Cover Presentation) -->
              <div class="lg:col-span-4 flex justify-center lg:justify-end">
                <div
                  role="button"
                  tabindex="0"
                  aria-label="عرض تفاصيل ملحمة جلجامش"
                  (keydown.enter)="openModal(spotlight)"
                  (click)="openModal(spotlight)"
                  class="relative group cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#e9c349]/50 rounded-xl"
                >
                  <!-- Golden Ambient Aura -->
                  <div class="absolute -inset-2 rounded-2xl bg-gradient-to-t from-[#e9c349]/35 to-[#af8d11]/25 blur-xl opacity-60 group-hover:opacity-100 transition-opacity duration-500"></div>

                  <!-- Book Card Container -->
                  <div class="relative w-48 sm:w-56 rounded-xl shadow-2xl bg-[#1c1b1d] overflow-hidden transition-transform duration-500 group-hover:-translate-y-2 border border-white/10">
                    <div class="w-full aspect-[1/1.55] overflow-hidden">
                      <img
                        [src]="spotlight.coverImage"
                        [alt]="spotlight.title"
                        class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    </div>
                    <div class="p-2.5 bg-[#0e0e10] text-center border-t border-white/5">
                      <span class="font-noto-serif text-sm font-semibold text-[#e9c349] block">{{ spotlight.title }}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- 2. قسم ألواح الخلود: ملاحم العصور الكبرى (Monumental Horizontal Scroll of Grand Epics) -->
      <section class="w-full px-4 sm:px-6 lg:px-12 py-10 bg-[#0e0e10]/60 border-y border-white/[0.04]">
        <div class="max-w-7xl mx-auto flex flex-col gap-6">
          <div class="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
            <div class="flex flex-col gap-1">
              <div class="flex items-center gap-2 text-[#e9c349]">
                <span class="material-symbols-outlined text-[20px]">crown</span>
                <span class="text-xs font-semibold tracking-wider uppercase">ألواح الخلود</span>
              </div>
              <h2 class="font-noto-serif text-2xl sm:text-3xl font-bold text-[#e5e1e4]">ملاحم العصور الكبرى</h2>
              <p class="text-sm text-[#debfc2]">الأسفار المؤسسة للوعي الإنساني والوجدان الحضاري</p>
            </div>
            <div class="flex items-center gap-2 self-start sm:self-auto">
              <button
                type="button"
                aria-label="التمرير لليمين"
                (click)="scrollReel('grandEraReel', 'right')"
                class="w-9 h-9 rounded-full bg-[#201f22] flex items-center justify-center text-[#debfc2] hover:text-white hover:bg-[#2a2a2c] transition-colors border border-white/5 cursor-pointer"
              >
                <span class="material-symbols-outlined text-[18px]">chevron_right</span>
              </button>
              <button
                type="button"
                aria-label="التمرير لليسار"
                (click)="scrollReel('grandEraReel', 'left')"
                class="w-9 h-9 rounded-full bg-[#201f22] flex items-center justify-center text-[#debfc2] hover:text-white hover:bg-[#2a2a2c] transition-colors border border-white/5 cursor-pointer"
              >
                <span class="material-symbols-outlined text-[18px]">chevron_left</span>
              </button>
            </div>
          </div>

          <!-- Horizontal Cards Reel (Strict Card Size: width 80px, height 120px) -->
          <div
            id="grandEraReel"
            class="flex items-start gap-4 overflow-x-auto scrollbar-none scroll-smooth py-3 px-1 -mx-4 sm:-mx-6 lg:-mx-0"
          >
            @for (epic of grandEraEpics; track epic.id) {
              <div
                role="button"
                tabindex="0"
                [attr.aria-label]="'عرض تفاصيل ' + epic.title"
                (keydown.enter)="openModal(epic)"
                (click)="openModal(epic)"
                class="shrink-0 w-[80px] flex flex-col items-center gap-1.5 group cursor-pointer transition-transform duration-300 hover:-translate-y-1 focus:outline-none"
              >
                <div class="relative w-[80px] h-[120px] rounded-lg overflow-hidden bg-[#201f22] shadow-lg border border-white/10 group-hover:border-[#e9c349]/50 group-hover:shadow-[0_8px_20px_rgba(233,195,73,0.25)] transition-all">
                  <img
                    [src]="epic.coverImage"
                    [alt]="epic.title"
                    class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    loading="lazy"
                  />
                  <div class="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                </div>
                <h3 class="text-[11px] font-semibold text-[#e5e1e4] text-center line-clamp-2 leading-tight group-hover:text-[#e9c349] transition-colors px-0.5">
                  {{ epic.title }}
                </h3>
              </div>
            }
          </div>
        </div>
      </section>

      <!-- 3. قسم تصنيفي أول: أساطير الشرق وبلاد ما بين النهرين (Mesopotamian & Eastern Epics) -->
      <section id="mesopotamian-section" class="w-full px-4 sm:px-6 lg:px-12 py-10">
        <div class="max-w-7xl mx-auto flex flex-col gap-6">
          <div class="flex items-center justify-between gap-3">
            <div class="flex items-center gap-3">
              <div class="w-1.5 h-7 rounded-full bg-[#e9c349]"></div>
              <div>
                <h2 class="font-noto-serif text-xl sm:text-2xl font-bold text-[#e5e1e4]">أساطير الشرق وبلاد ما بين النهرين</h2>
                <p class="text-xs sm:text-sm text-[#debfc2]">الكونيات الأولى، صراع الآلهة، وقصائد الخلق البابلية والسومرية</p>
              </div>
            </div>
            
            <div class="flex items-center gap-3">
              <div class="flex items-center gap-1.5">
                <button
                  type="button"
                  aria-label="التمرير لليمين"
                  (click)="scrollReel('mesopotamianReel', 'right')"
                  class="w-8 h-8 rounded-full bg-[#201f22] flex items-center justify-center text-[#debfc2] hover:text-white hover:bg-[#2a2a2c] transition-colors border border-white/5 cursor-pointer"
                >
                  <span class="material-symbols-outlined text-[16px]">chevron_right</span>
                </button>
                <button
                  type="button"
                  aria-label="التمرير لليسار"
                  (click)="scrollReel('mesopotamianReel', 'left')"
                  class="w-8 h-8 rounded-full bg-[#201f22] flex items-center justify-center text-[#debfc2] hover:text-white hover:bg-[#2a2a2c] transition-colors border border-white/5 cursor-pointer"
                >
                  <span class="material-symbols-outlined text-[16px]">chevron_left</span>
                </button>
              </div>

              <button
                type="button"
                (click)="setActiveFilter('east')"
                class="hidden sm:inline-flex items-center gap-1 text-xs font-semibold text-[#e9c349] hover:text-[#ffe088] transition-colors cursor-pointer"
              >
                <span>استعراض أرشيف الشرق</span>
                <span class="material-symbols-outlined text-[16px]">arrow_back</span>
              </button>
            </div>
          </div>

          <!-- Horizontal Side Scroll Reel (Card: width: 80px; height: 120px) -->
          <div
            id="mesopotamianReel"
            class="flex items-start gap-4 overflow-x-auto scrollbar-none scroll-smooth py-3 px-1 -mx-4 sm:-mx-6 lg:-mx-0"
          >
            @for (epic of mesopotamianEpics; track epic.id) {
              <div
                role="button"
                tabindex="0"
                [attr.aria-label]="'عرض تفاصيل ' + epic.title"
                (keydown.enter)="openModal(epic)"
                (click)="openModal(epic)"
                class="shrink-0 w-[80px] flex flex-col items-center gap-1.5 group cursor-pointer transition-transform duration-300 hover:-translate-y-1 focus:outline-none"
              >
                <div class="relative w-[80px] h-[120px] rounded-lg overflow-hidden bg-[#201f22] shadow-lg border border-white/10 group-hover:border-[#e9c349]/50 group-hover:shadow-[0_8px_20px_rgba(233,195,73,0.25)] transition-all">
                  <img
                    [src]="epic.coverImage"
                    [alt]="epic.title"
                    class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    loading="lazy"
                  />
                  <div class="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                </div>
                <h3 class="text-[11px] font-semibold text-[#e5e1e4] text-center line-clamp-2 leading-tight group-hover:text-[#e9c349] transition-colors px-0.5">
                  {{ epic.title }}
                </h3>
              </div>
            }
          </div>
        </div>
      </section>

      <!-- 4. قسم تفاعلي خاص: بوصلة العصور الأسطورية (The Mythic Epoch Compass) -->
      <section id="epoch-section" class="w-full px-4 sm:px-6 lg:px-12 py-12 bg-[#0e0e10]/40 border-y border-white/[0.04]">
        <div class="max-w-7xl mx-auto flex flex-col gap-8">
          <div class="flex flex-col items-center text-center gap-1.5 max-w-2xl mx-auto">
            <span class="text-xs font-semibold text-[#e9c349] uppercase tracking-widest">توجيه الألواح الزمنية</span>
            <h2 class="font-noto-serif text-2xl sm:text-3xl font-bold text-[#e5e1e4]">بوصلة العصور الأسطورية</h2>
            <p class="text-sm text-[#debfc2]">انتقل عبر الحقب الكبرى التي ولدت فيها حكايات الآلهة وملاحم الأبطال</p>
          </div>

          <!-- 3 Epoch Cards (Asymmetrical Bento-style Layout) -->
          <div class="grid grid-cols-1 md:grid-cols-3 gap-5">
            @for (epoch of mythicEpochs; track epoch.id) {
              <div
                role="button"
                tabindex="0"
                [attr.aria-label]="'استكشاف ' + epoch.title"
                (keydown.enter)="selectEpoch(epoch)"
                (click)="selectEpoch(epoch)"
                class="relative rounded-xl overflow-hidden bg-[#1c1b1d] p-6 flex flex-col justify-between gap-6 group cursor-pointer border border-white/[0.08] shadow-lg hover:shadow-[0_15px_35px_rgba(0,0,0,0.5)] transition-all duration-300 hover:border-[#e9c349]/40 focus:outline-none"
              >
                <div class="absolute -top-12 -right-12 w-32 h-32 rounded-full bg-[#af8d11]/15 blur-2xl group-hover:scale-150 transition-transform"></div>
                
                <div class="flex flex-col gap-2 relative z-10">
                  <span class="text-xs text-[#e9c349] font-mono tracking-wider font-semibold">{{ epoch.era }}</span>
                  <h3 class="font-noto-serif text-lg font-bold text-[#e5e1e4] group-hover:text-[#e9c349] transition-colors">{{ epoch.title }}</h3>
                  <p class="text-xs text-[#debfc2] leading-relaxed">{{ epoch.description }}</p>
                </div>

                <div class="flex items-center justify-between pt-4 border-t border-white/[0.06] relative z-10">
                  <span class="text-xs text-white/50">{{ epoch.countBadge }}</span>
                  <span class="w-8 h-8 rounded-full bg-[#2a2a2c] flex items-center justify-center text-[#e9c349] group-hover:translate-x-[-4px] transition-transform shadow-sm">
                    <span class="material-symbols-outlined text-[16px]">arrow_back</span>
                  </span>
                </div>
              </div>
            }
          </div>
        </div>
      </section>

      <!-- 5. قسم تصنيفي ثانٍ: حروب الأساطير والإلياذة الكبرى (Hellenic & Western Epics) -->
      <section id="hellenic-section" class="w-full px-4 sm:px-6 lg:px-12 py-10">
        <div class="max-w-7xl mx-auto flex flex-col gap-6">
          <div class="flex items-center justify-between gap-3">
            <div class="flex items-center gap-3">
              <div class="w-1.5 h-7 rounded-full bg-[#e9c349]"></div>
              <div>
                <h2 class="font-noto-serif text-xl sm:text-2xl font-bold text-[#e5e1e4]">حروب الأساطير والإلياذة الكبرى</h2>
                <p class="text-xs sm:text-sm text-[#debfc2]">معارك الآلهة الإغريقية، دروع طروادة، وتيه الفرسان في البحار المظلمة</p>
              </div>
            </div>

            <div class="flex items-center gap-3">
              <div class="flex items-center gap-1.5">
                <button
                  type="button"
                  aria-label="التمرير لليمين"
                  (click)="scrollReel('hellenicReel', 'right')"
                  class="w-8 h-8 rounded-full bg-[#201f22] flex items-center justify-center text-[#debfc2] hover:text-white hover:bg-[#2a2a2c] transition-colors border border-white/5 cursor-pointer"
                >
                  <span class="material-symbols-outlined text-[16px]">chevron_right</span>
                </button>
                <button
                  type="button"
                  aria-label="التمرير لليسار"
                  (click)="scrollReel('hellenicReel', 'left')"
                  class="w-8 h-8 rounded-full bg-[#201f22] flex items-center justify-center text-[#debfc2] hover:text-white hover:bg-[#2a2a2c] transition-colors border border-white/5 cursor-pointer"
                >
                  <span class="material-symbols-outlined text-[16px]">chevron_left</span>
                </button>
              </div>

              <button
                type="button"
                (click)="setActiveFilter('med')"
                class="hidden sm:inline-flex items-center gap-1 text-xs font-semibold text-[#e9c349] hover:text-[#ffe088] transition-colors cursor-pointer"
              >
                <span>استعراض ملاحم البحر</span>
                <span class="material-symbols-outlined text-[16px]">arrow_back</span>
              </button>
            </div>
          </div>

          <!-- Horizontal Side Scroll Reel (Card: width: 80px; height: 120px) -->
          <div
            id="hellenicReel"
            class="flex items-start gap-4 overflow-x-auto scrollbar-none scroll-smooth py-3 px-1 -mx-4 sm:-mx-6 lg:-mx-0"
          >
            @for (epic of hellenicEpics; track epic.id) {
              <div
                role="button"
                tabindex="0"
                [attr.aria-label]="'عرض تفاصيل ' + epic.title"
                (keydown.enter)="openModal(epic)"
                (click)="openModal(epic)"
                class="shrink-0 w-[80px] flex flex-col items-center gap-1.5 group cursor-pointer transition-transform duration-300 hover:-translate-y-1 focus:outline-none"
              >
                <div class="relative w-[80px] h-[120px] rounded-lg overflow-hidden bg-[#201f22] shadow-lg border border-white/10 group-hover:border-[#e9c349]/50 group-hover:shadow-[0_8px_20px_rgba(233,195,73,0.25)] transition-all">
                  <img
                    [src]="epic.coverImage"
                    [alt]="epic.title"
                    class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    loading="lazy"
                  />
                  <div class="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                </div>
                <h3 class="text-[11px] font-semibold text-[#e5e1e4] text-center line-clamp-2 leading-tight group-hover:text-[#e9c349] transition-colors px-0.5">
                  {{ epic.title }}
                </h3>
              </div>
            }
          </div>
        </div>
      </section>

      <!-- 6. قسم تصنيفي ثالث: السير الشعبية وتراث الفرسان (Arabian & Folk Siyar) -->
      <section id="siyar-section" class="w-full px-4 sm:px-6 lg:px-12 py-10 bg-[#0e0e10]/60 border-y border-white/[0.04]">
        <div class="max-w-7xl mx-auto flex flex-col gap-6">
          <div class="flex items-center justify-between gap-3">
            <div class="flex items-center gap-3">
              <div class="w-1.5 h-7 rounded-full bg-[#e9c349]"></div>
              <div>
                <h2 class="font-noto-serif text-xl sm:text-2xl font-bold text-[#e5e1e4]">السير الشعبية وتراث الفرسان</h2>
                <p class="text-xs sm:text-sm text-[#debfc2]">ملاحم البطولة والشهامة، نداءات السيوف، وسجلات البداوة الشامخة</p>
              </div>
            </div>

            <div class="flex items-center gap-3">
              <div class="flex items-center gap-1.5">
                <button
                  type="button"
                  aria-label="التمرير لليمين"
                  (click)="scrollReel('folkSiyarReel', 'right')"
                  class="w-8 h-8 rounded-full bg-[#201f22] flex items-center justify-center text-[#debfc2] hover:text-white hover:bg-[#2a2a2c] transition-colors border border-white/5 cursor-pointer"
                >
                  <span class="material-symbols-outlined text-[16px]">chevron_right</span>
                </button>
                <button
                  type="button"
                  aria-label="التمرير لليسار"
                  (click)="scrollReel('folkSiyarReel', 'left')"
                  class="w-8 h-8 rounded-full bg-[#201f22] flex items-center justify-center text-[#debfc2] hover:text-white hover:bg-[#2a2a2c] transition-colors border border-white/5 cursor-pointer"
                >
                  <span class="material-symbols-outlined text-[16px]">chevron_left</span>
                </button>
              </div>

              <button
                type="button"
                (click)="setActiveFilter('siyar')"
                class="hidden sm:inline-flex items-center gap-1 text-xs font-semibold text-[#e9c349] hover:text-[#ffe088] transition-colors cursor-pointer"
              >
                <span>ديوان السير الشعبية</span>
                <span class="material-symbols-outlined text-[16px]">arrow_back</span>
              </button>
            </div>
          </div>

          <!-- Horizontal Side Scroll Reel (Card: width: 80px; height: 120px) -->
          <div
            id="folkSiyarReel"
            class="flex items-start gap-4 overflow-x-auto scrollbar-none scroll-smooth py-3 px-1 -mx-4 sm:-mx-6 lg:-mx-0"
          >
            @for (epic of arabianSiyar; track epic.id) {
              <div
                role="button"
                tabindex="0"
                [attr.aria-label]="'عرض تفاصيل ' + epic.title"
                (keydown.enter)="openModal(epic)"
                (click)="openModal(epic)"
                class="shrink-0 w-[80px] flex flex-col items-center gap-1.5 group cursor-pointer transition-transform duration-300 hover:-translate-y-1 focus:outline-none"
              >
                <div class="relative w-[80px] h-[120px] rounded-lg overflow-hidden bg-[#201f22] shadow-lg border border-white/10 group-hover:border-[#e9c349]/50 group-hover:shadow-[0_8px_20px_rgba(233,195,73,0.25)] transition-all">
                  <img
                    [src]="epic.coverImage"
                    [alt]="epic.title"
                    class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    loading="lazy"
                  />
                  <div class="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                </div>
                <h3 class="text-[11px] font-semibold text-[#e5e1e4] text-center line-clamp-2 leading-tight group-hover:text-[#e9c349] transition-colors px-0.5">
                  {{ epic.title }}
                </h3>
              </div>
            }
          </div>
        </div>
      </section>

      <!-- 7. قسم «الملاحم الأكثر تداولاً وتدويناً» (The Monumental Mythic Top 5 Index) -->
      <section class="w-full px-4 sm:px-6 lg:px-12 py-12">
        <div class="max-w-7xl mx-auto flex flex-col gap-6">
          <div class="flex flex-col sm:flex-row sm:items-baseline justify-between gap-1">
            <div>
              <span class="text-xs font-semibold text-[#e9c349] uppercase tracking-widest">مخطوطات الرواق الأثيرة</span>
              <h2 class="font-noto-serif text-2xl sm:text-3xl font-bold text-[#e5e1e4]">الملاحم الأكثر تداولاً وتدويناً</h2>
            </div>
            <span class="text-xs text-[#debfc2]">مرتبة بحسب تواتر القراءة والتأمل في بهو الملاحم</span>
          </div>

          <!-- Archaic Numbered Ranking List (١ إلى ٥) with Monolithic Editorial Elevation -->
          <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            @for (item of topRanked; track item.rank) {
              <div
                role="button"
                tabindex="0"
                [attr.aria-label]="'عرض الملحمة ' + item.title"
                (keydown.enter)="openRanked(item)"
                (click)="openRanked(item)"
                class="relative rounded-xl bg-[#1c1b1d] p-5 flex flex-col justify-between gap-5 group cursor-pointer border border-white/[0.06] transition-all hover:bg-[#201f22] hover:border-[#e9c349]/30 focus:outline-none"
              >
                <div class="flex items-start justify-between">
                  <span
                    class="font-noto-serif text-4xl sm:text-5xl leading-none select-none transition-colors"
                    [class]="item.isTop ? 'text-[#e9c349]' : 'text-white/20 group-hover:text-[#e9c349]'"
                  >
                    {{ item.rank }}
                  </span>
                  <span
                    class="material-symbols-outlined text-[20px]"
                    [class]="item.isTop ? 'text-[#e9c349] opacity-90' : 'text-white/40 group-hover:text-[#e9c349]'"
                  >
                    {{ item.icon }}
                  </span>
                </div>
                <div class="flex flex-col gap-1">
                  <h3 class="font-noto-serif text-base font-bold text-[#e5e1e4] group-hover:text-[#e9c349] transition-colors leading-snug">
                    {{ item.title }}
                  </h3>
                  <span class="text-xs text-white/50">{{ item.subtitle }}</span>
                </div>
              </div>
            }
          </div>
        </div>
      </section>

      <!-- 8. الملاذ التأملي الملحمي: ترنيمة الحجر الخالد (Editorial Sanctuary Epilogue) -->
      <section class="w-full px-4 sm:px-6 lg:px-12 py-10 mb-8">
        <div class="max-w-7xl mx-auto rounded-2xl bg-gradient-to-r from-[#0e0e10] via-[#1c1b1d] to-[#0e0e10] p-6 sm:p-8 lg:p-12 flex flex-col md:flex-row items-center justify-between gap-6 shadow-2xl relative overflow-hidden border border-white/[0.08]">
          <div class="absolute right-0 top-0 bottom-0 w-1.5 bg-gradient-to-b from-[#af8d11] via-[#e9c349] to-transparent"></div>
          
          <div class="flex flex-col gap-2 max-w-2xl">
            <span class="text-xs font-semibold text-[#e9c349] tracking-wider uppercase">ميثاق رواق الملاحم</span>
            <h3 class="font-noto-serif text-xl sm:text-2xl font-bold text-[#e5e1e4] leading-relaxed">
              «الأساطير ليست أوهاماً، بل هي الحقيقة وقد تجلببت برداء الخلود»
            </h3>
            <p class="text-xs sm:text-sm text-[#debfc2] leading-relaxed">
              كل ملحمة في هذا الرواق خضعت لتحقيق لغوي ونقدي صارم يعيد تقديم النصوص كما أنشدها الحكماء والقصاصون القدامى دون زيادة أو تشويه.
            </p>
          </div>

          <div class="shrink-0 flex items-center gap-3">
            <button
              type="button"
              (click)="openGuideModal()"
              class="px-6 py-3 rounded-full bg-[#2a2a2c] text-[#e5e1e4] text-xs font-semibold hover:bg-[#e9c349] hover:text-[#241a00] border border-white/10 transition-all cursor-pointer shadow-lg"
            >
              دليل الباحث الأسطوري
            </button>
          </div>
        </div>
      </section>

      <!-- Interactive Epic Details Modal (Preserves Immersion and Atmosphere) -->
      @if (selectedEpic(); as epic) {
        <div class="fixed inset-0 z-50 flex items-center justify-center p-4">
          <button
            type="button"
            aria-label="إغلاق النافذة المنبثقة"
            class="absolute inset-0 w-full h-full cursor-default bg-black/80 backdrop-blur-md"
            (click)="closeModal()"
          ></button>

          <div class="relative w-full max-w-lg bg-[#1c1b1d] border border-[#e9c349]/30 rounded-2xl p-6 shadow-2xl overflow-hidden flex flex-col gap-5 text-right z-10 animate-in fade-in zoom-in-95 duration-200">
            <!-- Glowing Header Accent -->
            <div class="absolute -top-16 -right-16 w-36 h-36 rounded-full bg-[#e9c349]/20 blur-3xl pointer-events-none"></div>

            <div class="flex items-start justify-between border-b border-white/10 pb-4">
              <button
                type="button"
                aria-label="إغلاق"
                (click)="closeModal()"
                class="w-8 h-8 rounded-full bg-[#2a2a2c] flex items-center justify-center text-white/70 hover:text-white hover:bg-[#353437] transition-colors cursor-pointer"
              >
                <span class="material-symbols-outlined text-[18px]">close</span>
              </button>
              
              <div class="flex items-center gap-2 text-[#e9c349]">
                <span class="text-xs font-semibold">{{ epic.category || 'رواق الملاحم والحروب الأسطورية' }}</span>
                <span class="material-symbols-outlined text-[16px]">menu_book</span>
              </div>
            </div>

            <!-- Modal Content Body -->
            <div class="flex flex-col sm:flex-row items-center sm:items-start gap-5">
              <div class="w-[80px] h-[120px] shrink-0 rounded-lg overflow-hidden bg-[#201f22] shadow-xl border border-white/10">
                <img [src]="epic.coverImage" [alt]="epic.title" class="w-full h-full object-cover" />
              </div>

              <div class="flex flex-col gap-2">
                <h3 class="font-noto-serif text-xl font-bold text-[#e5e1e4]">{{ epic.title }}</h3>
                <span class="text-xs text-[#e9c349] font-medium">{{ epic.author || 'ألواح التراث الإنساني' }}</span>
                <p class="text-xs text-[#debfc2] leading-relaxed">
                  {{ epic.description || 'ملحمة أسطورية خالدة وثيقة الصلة بالوجدان الحضاري للإنسانية في بهو الملاحم.' }}
                </p>
              </div>
            </div>

            <!-- Modal Action Buttons -->
            <div class="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
              <button
                type="button"
                (click)="closeModal()"
                class="px-4 py-2 rounded-full bg-[#2a2a2c] text-xs font-medium text-[#debfc2] hover:text-white transition-colors cursor-pointer"
              >
                إغلاق
              </button>
              <a
                [routerLink]="['/reader', epic.id]"
                (click)="closeModal()"
                class="px-6 py-2 rounded-full bg-[#e9c349] text-[#241a00] text-xs font-bold hover:brightness-110 shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <span class="material-symbols-outlined text-[16px]">auto_stories</span>
                <span>قراءة الملحمة</span>
              </a>
            </div>
          </div>
        </div>
      }

      <!-- Mythic Guide Sheet Modal -->
      @if (showGuideModal()) {
        <div class="fixed inset-0 z-50 flex items-center justify-center p-4">
          <button
            type="button"
            aria-label="إغلاق الدليل الأسطوري"
            class="absolute inset-0 w-full h-full cursor-default bg-black/80 backdrop-blur-md"
            (click)="showGuideModal.set(false)"
          ></button>

          <div class="relative w-full max-w-md bg-[#1c1b1d] border border-white/10 rounded-2xl p-6 shadow-2xl flex flex-col gap-4 text-right z-10 animate-in fade-in zoom-in-95 duration-200">
            <div class="flex items-center justify-between border-b border-white/10 pb-3">
              <button
                type="button"
                aria-label="إغلاق"
                (click)="showGuideModal.set(false)"
                class="w-7 h-7 rounded-full bg-[#2a2a2c] flex items-center justify-center text-white/70 hover:text-white cursor-pointer"
              >
                <span class="material-symbols-outlined text-[16px]">close</span>
              </button>
              <h3 class="font-noto-serif text-base font-bold text-[#e9c349]">دليل الباحث الأسطوري</h3>
            </div>
            
            <p class="text-xs text-[#debfc2] leading-relaxed">
              يرتكز رواق الملاحم على التوثيق الفيلولوجي لألواح الطين والمخطوطات الشعرية القديمة. جميع النصوص معربة وفق الأوزان السردية الأصلية ومزودة بتقنية MTX لفك الترميز الفوري.
            </p>

            <div class="bg-[#0e0e10] p-3 rounded-xl border border-white/5 flex flex-col gap-1.5 text-xs text-white/70">
              <div class="flex items-center justify-between">
                <span>عدد الألواح المترجمة:</span>
                <span class="text-[#e9c349] font-mono">٦٢ ملحمة</span>
              </div>
              <div class="flex items-center justify-between">
                <span>معدل ضغط النصوص (MTX):</span>
                <span class="text-[#7bd8b1] font-mono">٧٨.٤٪</span>
              </div>
              <div class="flex items-center justify-between">
                <span>زمن فك التشفير:</span>
                <span class="text-[#ffb2bd] font-mono">&lt; ٤ ميلي ثانية</span>
              </div>
            </div>

            <button
              type="button"
              (click)="showGuideModal.set(false)"
              class="w-full py-2.5 rounded-full bg-[#e9c349] text-[#241a00] text-xs font-bold hover:brightness-110 transition-all cursor-pointer mt-2"
            >
              فهمت، متابعة التصفح
            </button>
          </div>
        </div>
      }

    </div>
  `,
})
export class RiwaqEpics {
  private readonly router = inject(Router);

  readonly spotlight = SPOTLIGHT_EPIC;
  readonly grandEraEpics = GRAND_ERA_EPICS;
  readonly mesopotamianEpics = MESOPOTAMIAN_EASTERN_EPICS;
  readonly hellenicEpics = HELLENIC_WAR_EPICS;
  readonly arabianSiyar = ARABIAN_FOLK_SIYAR;
  readonly topRanked = TOP_RANKED_EPICS;
  readonly mythicEpochs = MYTHIC_EPOCHS;

  readonly activeFilter = signal<string>('all');
  readonly selectedEpic = signal<RiwaqEpicItem | null>(null);
  readonly showGuideModal = signal<boolean>(false);
  readonly isAudioChanting = signal<boolean>(false);

  private audioCtx: AudioContext | null = null;
  private oscillatorNodes: OscillatorNode[] = [];
  private gainNode: GainNode | null = null;

  setActiveFilter(filter: string): void {
    this.activeFilter.set(filter);
  }

  scrollToSection(sectionId: string, filterName: string): void {
    this.activeFilter.set(filterName);
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  scrollReel(reelId: string, direction: 'left' | 'right'): void {
    const el = document.getElementById(reelId);
    if (!el) return;
    // In RTL: scrolling to right is positive, left is negative
    const step = 280;
    const delta = direction === 'right' ? step : -step;
    el.scrollBy({ left: delta, behavior: 'smooth' });
  }

  selectEpoch(epoch: { id: string; title: string }): void {
    if (epoch.id === 'epoch-bronze') {
      this.scrollToSection('mesopotamian-section', 'east');
    } else if (epoch.id === 'epoch-classical') {
      this.scrollToSection('hellenic-section', 'med');
    } else {
      this.scrollToSection('siyar-section', 'siyar');
    }
  }

  openModal(epic: RiwaqEpicItem): void {
    this.selectedEpic.set(epic);
  }

  closeModal(): void {
    this.selectedEpic.set(null);
  }

  openRanked(item: { id: string }): void {
    const found = [
      this.spotlight,
      ...this.grandEraEpics,
      ...this.mesopotamianEpics,
      ...this.hellenicEpics,
      ...this.arabianSiyar,
    ].find(e => e.id === item.id);
    if (found) {
      this.openModal(found);
    } else {
      this.router.navigate(['/reader', item.id]);
    }
  }

  openGuideModal(): void {
    this.showGuideModal.set(true);
  }

  toggleMythicAudio(): void {
    if (this.isAudioChanting()) {
      this.stopChant();
    } else {
      this.startChant();
    }
  }

  private startChant(): void {
    try {
      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioContextClass) return;

      this.audioCtx = new AudioContextClass();
      if (this.audioCtx.state === 'suspended') {
        this.audioCtx.resume();
      }

      this.gainNode = this.audioCtx.createGain();
      this.gainNode.gain.setValueAtTime(0.001, this.audioCtx.currentTime);
      this.gainNode.gain.exponentialRampToValueAtTime(0.12, this.audioCtx.currentTime + 2.5);
      this.gainNode.connect(this.audioCtx.destination);

      // Ancient Bronze Age modal overtone frequencies (D2, A2, D3, F#3 harmonic fifths)
      const frequencies = [73.42, 110.0, 146.83, 220.0];
      this.oscillatorNodes = frequencies.map((freq, index) => {
        const osc = this.audioCtx!.createOscillator();
        osc.type = index % 2 === 0 ? 'triangle' : 'sine';
        osc.frequency.setValueAtTime(freq, this.audioCtx!.currentTime);

        const subGain = this.audioCtx!.createGain();
        subGain.gain.setValueAtTime(1 / (index + 1), this.audioCtx!.currentTime);
        osc.connect(subGain);
        subGain.connect(this.gainNode!);

        osc.start();
        return osc;
      });

      this.isAudioChanting.set(true);
    } catch (err) {
      console.debug('Web Audio init skipped:', err);
      this.isAudioChanting.set(false);
    }
  }

  private stopChant(): void {
    if (this.gainNode && this.audioCtx) {
      try {
        this.gainNode.gain.exponentialRampToValueAtTime(0.0001, this.audioCtx.currentTime + 1.2);
        setTimeout(() => {
          this.oscillatorNodes.forEach(osc => {
            try {
              osc.stop();
              osc.disconnect();
            } catch (e) {
              console.debug(e);
            }
          });
          this.oscillatorNodes = [];
          if (this.audioCtx) {
            this.audioCtx.close().catch((e) => {
              console.debug(e);
            });
            this.audioCtx = null;
          }
        }, 1300);
      } catch (err) {
        console.debug(err);
        this.audioCtx = null;
      }
    }
    this.isAudioChanting.set(false);
  }
}
