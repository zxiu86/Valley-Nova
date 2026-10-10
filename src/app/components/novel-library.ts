import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { NovelStore } from '../core/novel-store';
import { Novel } from '../core/novel-models';
import { SANCTUARIES_DATA } from '../core/sample-novels';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-novel-library',
  imports: [RouterLink],
  template: `
    <div class="flex flex-col w-full bg-[#131315] min-h-screen text-[#e5e1e4]">
      
      <!-- Top Ambient Dramatic Lighting System -->
      <div class="relative w-full overflow-hidden">
        <div class="absolute -top-32 right-1/4 w-[550px] h-[550px] bg-[#881337]/20 rounded-full blur-[140px] pointer-events-none mix-blend-screen"></div>
        <div class="absolute -top-20 left-1/4 w-[600px] h-[600px] bg-[#e9c349]/10 rounded-full blur-[160px] pointer-events-none mix-blend-screen"></div>
        <div class="absolute top-96 right-10 w-[450px] h-[450px] bg-[#005039]/20 rounded-full blur-[130px] pointer-events-none mix-blend-screen"></div>

        <!-- ========================================== -->
        <!-- SECTION 1: HERO PROLOGUE & GRAND VISUAL FACADE -->
        <!-- ========================================== -->
        <section class="relative w-full px-4 sm:px-6 md:px-12 pt-10 sm:pt-14 pb-20 sm:pb-24 flex flex-col items-center text-center">
          
          <!-- Royal Overline & Sigil -->
          <div class="inline-flex items-center gap-2 px-4 py-1 rounded-full bg-[#2a2a2c]/70 border border-white/[0.08] backdrop-blur-md mb-6 shadow-sm select-none">
            <span class="w-1.5 h-1.5 rounded-full bg-[#e9c349] animate-pulse"></span>
            <span class="text-xs font-semibold text-[#e9c349] tracking-widest">بوابة الأكوان الأدبية الخالدة</span>
            <span class="text-[#debfc2]/40 text-xs">✦</span>
            <span class="text-[11px] font-medium text-[#debfc2]/80">العدد الافتتاحي المعماري</span>
          </div>

          <!-- Monumental Title -->
          <h1 class="font-noto-serif text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-[#e5e1e4] max-w-5xl tracking-tight leading-tight mb-4 select-none">
            أَرْوِقَـةُ الخُـلُـود
          </h1>

          <!-- Subtitle of Architectural Scale -->
          <p class="font-noto-serif text-lg sm:text-xl md:text-2xl text-[#debfc2]/90 max-w-3xl mb-8 leading-relaxed font-normal">
            ملاذٌ بصريٌ وسينمائي تلتقي فيه أزمنة الأدب العربي والإنساني بتجربة جمالية متفردة
          </p>

          <!-- Classical Epigraph Card -->
          <div class="relative max-w-2xl w-full p-6 sm:p-8 mb-10 bg-[#0e0e10]/85 border border-white/[0.08] backdrop-blur-2xl rounded-2xl shadow-2xl flex flex-col items-center">
            <div class="absolute -top-3 right-8 px-3 py-0.5 bg-[#2a2a2c] border border-white/10 rounded-md text-[#e9c349] text-[11px] font-semibold">
              مأثور السرد
            </div>
            <p class="font-noto-serif text-base sm:text-lg text-[#e5e1e4] italic text-center leading-loose">
              «إنّ من البيان لسحراً، وإنّ في طيّات المخطوطات أرواحاً تأبى الفناء... هنا يرقد الحرف ليعاود النهوض حياً في ضمير القارئ.»
            </p>
            <span class="text-xs text-[#e9c349]/80 font-medium mt-3">سفر التكوين السردي • ديوان الخلود</span>
          </div>

          <!-- Live Constellation Metrics (The Architectural Cosmos) -->
          <div class="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 max-w-5xl w-full mb-10">
            <!-- Metric 1 -->
            <div class="bg-[#1c1b1d]/80 border border-white/[0.06] backdrop-blur-md p-4 sm:p-5 rounded-xl flex flex-col items-center justify-center text-center shadow-sm hover:bg-[#201f22] transition-all">
              <span class="font-noto-serif text-3xl sm:text-4xl text-[#ffb2bd] font-bold">٤</span>
              <span class="font-noto-serif text-base sm:text-lg text-[#e5e1e4] font-semibold mt-1">عوالم مغمورة</span>
              <span class="text-[11px] text-[#debfc2]/70 mt-1">أروقة متباينة الطابع</span>
            </div>

            <!-- Metric 2 -->
            <div class="bg-[#1c1b1d]/80 border border-white/[0.06] backdrop-blur-md p-4 sm:p-5 rounded-xl flex flex-col items-center justify-center text-center shadow-sm hover:bg-[#201f22] transition-all">
              <span class="font-noto-serif text-3xl sm:text-4xl text-[#e9c349] font-bold">+١٢,٠٠٠</span>
              <span class="font-noto-serif text-base sm:text-lg text-[#e5e1e4] font-semibold mt-1">مصنّف ومخطوطة</span>
              <span class="text-[11px] text-[#debfc2]/70 mt-1">نفائس الخزائن المحققة</span>
            </div>

            <!-- Metric 3 -->
            <div class="bg-[#1c1b1d]/80 border border-white/[0.06] backdrop-blur-md p-4 sm:p-5 rounded-xl flex flex-col items-center justify-center text-center shadow-sm hover:bg-[#201f22] transition-all">
              <span class="font-noto-serif text-3xl sm:text-4xl text-[#7bd8b1] font-bold">١٠٠٪</span>
              <span class="font-noto-serif text-base sm:text-lg text-[#e5e1e4] font-semibold mt-1">نصوص نقية</span>
              <span class="text-[11px] text-[#debfc2]/70 mt-1">محايدة وتأملية بالكامل</span>
            </div>

            <!-- Metric 4 -->
            <div class="bg-[#1c1b1d]/80 border border-white/[0.06] backdrop-blur-md p-4 sm:p-5 rounded-xl flex flex-col items-center justify-center text-center shadow-sm hover:bg-[#201f22] transition-all">
              <span class="material-symbols-outlined text-[32px] text-[#ffd9dd] mb-1">visibility_off</span>
              <span class="font-noto-serif text-base sm:text-lg text-[#e5e1e4] font-semibold">صفر تشتيت</span>
              <span class="text-[11px] text-[#debfc2]/70 mt-1">بلا أسعار أو تقييمات صاخبة</span>
            </div>
          </div>

          <!-- Directive Callout -->
          <div class="flex items-center gap-2 text-[#debfc2]/80 select-none">
            <span class="material-symbols-outlined text-[#e9c349] text-[20px] animate-bounce">expand_more</span>
            <span class="text-xs sm:text-sm font-medium tracking-wide">
              اختر بوابتك إلى عوالم السرد والفكر — أربعة أروقة، لكلٍّ منها عالمه وذاكرته
            </span>
            <span class="material-symbols-outlined text-[#e9c349] text-[20px] animate-bounce">expand_more</span>
          </div>
        </section>

        <!-- ========================================== -->
        <!-- SECTION 2: THE FOUR SANCTUARIES MONUMENTAL PORTAL -->
        <!-- ========================================== -->
        <section id="sanctuaries-section" class="w-full px-4 sm:px-6 md:px-12 py-12 relative">
          
          <!-- Section Title Header -->
          <div class="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-4">
            <div>
              <div class="flex items-center gap-1.5 text-[#e9c349] mb-1.5">
                <span class="material-symbols-outlined text-[18px]">account_balance</span>
                <span class="text-xs font-semibold tracking-wider">الصروح الأربعة الكبرى</span>
              </div>
              <h2 class="font-noto-serif text-2xl sm:text-3xl md:text-4xl text-[#e5e1e4] font-bold">
                بوابات العوالم السردية
              </h2>
            </div>
            <p class="text-sm text-[#debfc2]/80 max-w-md leading-relaxed">
              تجلَّ في أروقة تم تشييد كل منها بنظام لوني وهندسي ونغمي فريد يجسد روح المكتوب.
            </p>
          </div>

          <!-- 4 Pillars Grid (Responsive: 1 col on mobile, 4 cols on lg) -->
          <div class="grid grid-cols-1 lg:grid-cols-4 gap-6 w-full">
            @for (sanctuary of sanctuaries; track sanctuary.id) {
              <article
                [id]="sanctuary.id"
                class="group relative flex flex-col justify-between bg-[#1c1b1d]/90 border border-white/[0.08] rounded-2xl overflow-hidden shadow-xl transition-all duration-500 hover:-translate-y-1.5 hover:shadow-2xl"
              >
                <!-- Top Atmospheric Cover Banner -->
                <div class="relative h-60 sm:h-64 w-full overflow-hidden shrink-0">
                  <div
                    class="w-full h-full bg-cover bg-center transition-transform duration-700 group-hover:scale-105"
                    [style.backgroundImage]="'url(' + sanctuary.bgImage + ')'"
                  ></div>
                  <div class="absolute inset-0 bg-gradient-to-t from-[#1c1b1d] via-[#1c1b1d]/40 to-transparent"></div>
                  
                  <!-- Sanctuary Tag Badge -->
                  <div class="absolute top-4 right-4 flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#0e0e10]/85 border border-white/10 backdrop-blur-md">
                    <span
                      class="w-2 h-2 rounded-full"
                      [class.bg-[#ffb2bd]]="sanctuary.id === 'riwaq-al-riwayat'"
                      [class.animate-ping]="sanctuary.id === 'riwaq-al-riwayat'"
                      [class.bg-[#e9c349]]="sanctuary.id === 'riwaq-al-malahim'"
                      [class.bg-[#e5e1e4]]="sanctuary.id === 'riwaq-al-hikma'"
                      [class.bg-[#7bd8b1]]="sanctuary.id === 'riwaq-al-turath'"
                    ></span>
                    <span class="text-[11px] font-semibold text-[#e5e1e4]">
                      {{ sanctuary.subtitle }}
                    </span>
                  </div>

                  <div class="absolute bottom-4 right-4">
                    <span class="text-[11px] text-[#debfc2]/80 font-medium block">
                      {{ sanctuary.badge }}
                    </span>
                    <h3 class="font-noto-serif text-2xl text-[#e5e1e4] font-bold">
                      {{ sanctuary.name }}
                    </h3>
                  </div>
                </div>

                <!-- Middle Body: Lore & Quote -->
                <div class="relative p-5 sm:p-6 flex flex-col flex-1 gap-4">
                  <p class="text-xs sm:text-sm text-[#debfc2]/80 leading-relaxed min-h-[48px]">
                    {{ sanctuary.lore }}
                  </p>

                  <blockquote class="bg-[#0e0e10]/70 border-r-2 border-[#e9c349]/50 p-3.5 rounded-lg shadow-inner">
                    <p class="text-xs italic leading-relaxed text-[#e5e1e4]/90 font-noto-serif">
                      {{ sanctuary.quote }}
                    </p>
                  </blockquote>

                  <!-- Featured Books Showcase -->
                  <div class="flex flex-col gap-2 mt-1">
                    <div class="flex items-center justify-between">
                      <span class="text-xs font-semibold text-[#e9c349]">أبرز الأسفار المعروضة:</span>
                      <!-- Mobile swipe hint icon -->
                      <span class="lg:hidden text-[10px] text-[#debfc2]/60 flex items-center gap-1">
                        <span>اسحب جانبياً</span>
                        <span class="material-symbols-outlined text-[12px]">swipe_left</span>
                      </span>
                    </div>

                    <!-- BOOKS SHELF: Responsive Rule! -->
                    <!-- Desktop: 3-column grid -->
                    <!-- Mobile: Horizontal smooth side-scroll with full-size covers! -->
                    <div class="flex overflow-x-auto gap-3.5 pb-2 pt-1 lg:grid lg:grid-cols-3 lg:gap-2.5 lg:overflow-visible scrollbar-none snap-x snap-mandatory">
                      @for (book of getSanctuaryBooks(sanctuary.id); track book.id) {
                        <button
                          type="button"
                          (click)="openBook(book.id)"
                          class="flex flex-col items-center group/book cursor-pointer shrink-0 w-28 min-w-[112px] sm:w-32 sm:min-w-[128px] lg:w-auto lg:min-w-0 snap-start transition-transform hover:-translate-y-1 bg-transparent border-0 p-0 text-inherit"
                        >
                          <div class="w-full aspect-[1/1.55] bg-[#353437] rounded-lg overflow-hidden border border-white/10 shadow-md group-hover/book:shadow-lg group-hover/book:border-[#e9c349]/50 transition-all">
                            <img
                              [src]="book.coverImage"
                              [alt]="book.title"
                              class="w-full h-full object-cover transition-transform duration-500 group-hover/book:scale-105"
                              loading="lazy"
                            />
                          </div>
                          <span class="font-noto-serif text-xs font-semibold text-[#e5e1e4] mt-2 text-center line-clamp-1 group-hover/book:text-[#e9c349] transition-colors">
                            {{ book.title }}
                          </span>
                        </button>
                      }
                    </div>
                  </div>
                </div>

                <!-- Bottom Action Gate Button with Sanctuary Image & Shading -->
                <div class="relative p-5 sm:p-6 pt-0">
                  <button
                    type="button"
                    (click)="filterBySanctuary(sanctuary.id)"
                    class="relative w-full h-14 rounded-xl overflow-hidden border border-white/10 hover:border-white/30 transition-all duration-300 group/btn shadow-lg cursor-pointer flex items-center justify-between px-4 sm:px-5 text-right"
                  >
                    <!-- Background Sanctuary Image -->
                    <div
                      class="absolute inset-0 bg-cover bg-center transition-transform duration-700 ease-out group-hover/btn:scale-110 filter brightness-[0.7]"
                      [style.backgroundImage]="'url(' + sanctuary.btnBgImage + ')'"
                    ></div>

                    <!-- Shading & Atmospheric Gradient Layer for Crisp Legibility -->
                    <div class="absolute inset-0 bg-gradient-to-r from-[#0a0a0c]/90 via-[#0a0a0c]/70 to-[#0a0a0c]/85"></div>

                    <!-- Sanctuary Unique Color Glow Strip on Right -->
                    <div
                      class="absolute inset-y-0 right-0 w-1.5 transition-all duration-300"
                      [style.backgroundColor]="sanctuary.accent"
                    ></div>

                    <!-- Button Content & Thematic Icon -->
                    <div class="relative z-10 flex items-center gap-3">
                      <div
                        class="w-8 h-8 rounded-lg flex items-center justify-center border border-white/15 bg-black/50 backdrop-blur-md shadow-inner text-sm font-bold"
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
                        <span class="font-noto-serif text-sm font-bold text-[#e5e1e4] group-hover/btn:text-white transition-colors">
                          {{ sanctuary.actionText }}
                        </span>
                        <span class="text-[10px] text-[#debfc2]/70 font-medium">
                          {{ sanctuary.subtitle }}
                        </span>
                      </div>
                    </div>

                    <!-- Directional Arrow -->
                    <span
                      class="relative z-10 material-symbols-outlined text-[20px] transition-transform duration-300 group-hover/btn:-translate-x-1.5"
                      [style.color]="sanctuary.accent"
                    >
                      west
                    </span>
                  </button>
                </div>
              </article>
            }
          </div>
        </section>

        <!-- ========================================== -->
        <!-- SECTION 3: CURATED GUIDED PATHWAYS (MOOD-BASED) -->
        <!-- ========================================== -->
        <section class="w-full px-4 sm:px-6 md:px-12 py-16 relative">
          <div class="w-full max-w-6xl mx-auto bg-[#0e0e10]/90 border border-white/[0.08] backdrop-blur-2xl rounded-2xl p-6 sm:p-10 shadow-2xl">
            
            <div class="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-6 border-b border-white/[0.06]">
              <div>
                <div class="flex items-center gap-1.5 text-[#e9c349] mb-1">
                  <span class="material-symbols-outlined text-[20px]">explore</span>
                  <span class="text-xs font-semibold tracking-widest">بوصلة القارئ الذاتية</span>
                </div>
                <h2 class="font-noto-serif text-2xl sm:text-3xl text-[#e5e1e4] font-bold">
                  كيف تودّ أن تبدأ رحلتك اليوم؟
                </h2>
              </div>
              <p class="text-xs sm:text-sm text-[#debfc2]/80 max-w-sm leading-relaxed">
                اختر الحالة الشعورية أو الغاية الفكرية التي تنشدها، لنرشدك مباشرة إلى الرواق الملائم لصفاء ذهنك.
              </p>
            </div>

            <!-- 4 Distinct Mood Tracks -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4 pt-6">
              
              <!-- Mood 1: الحكمة -->
              <button
                type="button"
                (click)="filterBySanctuary('riwaq-al-hikma')"
                class="group w-full text-right flex items-center justify-between p-4 bg-[#1c1b1d] border border-white/[0.06] rounded-xl shadow-sm hover:bg-[#201f22] hover:border-white/20 transition-all duration-300 cursor-pointer"
              >
                <div class="flex items-center gap-4">
                  <div class="w-12 h-12 rounded-xl bg-[#39393b] flex items-center justify-center shrink-0 text-[#e5e1e4] group-hover:bg-[#e5e1e4] group-hover:text-[#131315] transition-colors">
                    <span class="material-symbols-outlined text-[24px]">psychology</span>
                  </div>
                  <div class="flex flex-col">
                    <span class="font-noto-serif text-sm sm:text-base font-semibold text-[#e5e1e4] group-hover:text-[#e9c349] transition-colors">
                      الباحث عن المعنى والتأمل العقلي
                    </span>
                    <span class="text-xs text-[#debfc2]/70">
                      الأسئلة الوجودية، نقاء الفلسفة، وحوارات الحكماء
                    </span>
                  </div>
                </div>
                <span class="material-symbols-outlined text-[#debfc2] group-hover:text-[#e9c349] group-hover:-translate-x-1 transition-all">arrow_back</span>
              </button>

              <!-- Mood 2: الملاحم -->
              <button
                type="button"
                (click)="filterBySanctuary('riwaq-al-malahim')"
                class="group w-full text-right flex items-center justify-between p-4 bg-[#1c1b1d] border border-white/[0.06] rounded-xl shadow-sm hover:bg-[#201f22] hover:border-[#e9c349]/30 transition-all duration-300 cursor-pointer"
              >
                <div class="flex items-center gap-4">
                  <div class="w-12 h-12 rounded-xl bg-[#af8d11]/30 flex items-center justify-center shrink-0 text-[#e9c349] group-hover:bg-[#e9c349] group-hover:text-[#241a00] transition-colors">
                    <span class="material-symbols-outlined text-[24px]">swords</span>
                  </div>
                  <div class="flex flex-col">
                    <span class="font-noto-serif text-sm sm:text-base font-semibold text-[#e5e1e4] group-hover:text-[#e9c349] transition-colors">
                      المأخوذ ببطولات الأقدمين وأساطيرهم
                    </span>
                    <span class="text-xs text-[#debfc2]/70">
                      صراع الآلهة والبشر، ملاحم الخلود، وتاريخ الطين
                    </span>
                  </div>
                </div>
                <span class="material-symbols-outlined text-[#debfc2] group-hover:text-[#e9c349] group-hover:-translate-x-1 transition-all">arrow_back</span>
              </button>

              <!-- Mood 3: الروايات -->
              <button
                type="button"
                (click)="filterBySanctuary('riwaq-al-riwayat')"
                class="group w-full text-right flex items-center justify-between p-4 bg-[#1c1b1d] border border-white/[0.06] rounded-xl shadow-sm hover:bg-[#201f22] hover:border-[#ffb2bd]/30 transition-all duration-300 cursor-pointer"
              >
                <div class="flex items-center gap-4">
                  <div class="w-12 h-12 rounded-xl bg-[#881337]/40 flex items-center justify-center shrink-0 text-[#ffb2bd] group-hover:bg-[#ffb2bd] group-hover:text-[#670024] transition-colors">
                    <span class="material-symbols-outlined text-[24px]">theater_comedy</span>
                  </div>
                  <div class="flex flex-col">
                    <span class="font-noto-serif text-sm sm:text-base font-semibold text-[#e5e1e4] group-hover:text-[#ffb2bd] transition-colors">
                      الغارق في تفاصيل السرد والشخصيات
                    </span>
                    <span class="text-xs text-[#debfc2]/70">
                      الحبكات المعقدة، التحليل النفسي، ودراما الأزمنة
                    </span>
                  </div>
                </div>
                <span class="material-symbols-outlined text-[#debfc2] group-hover:text-[#ffb2bd] group-hover:-translate-x-1 transition-all">arrow_back</span>
              </button>

              <!-- Mood 4: التراث -->
              <button
                type="button"
                (click)="filterBySanctuary('riwaq-al-turath')"
                class="group w-full text-right flex items-center justify-between p-4 bg-[#1c1b1d] border border-white/[0.06] rounded-xl shadow-sm hover:bg-[#201f22] hover:border-[#7bd8b1]/30 transition-all duration-300 cursor-pointer"
              >
                <div class="flex items-center gap-4">
                  <div class="w-12 h-12 rounded-xl bg-[#005039]/40 flex items-center justify-center shrink-0 text-[#7bd8b1] group-hover:bg-[#7bd8b1] group-hover:text-[#003827] transition-colors">
                    <span class="material-symbols-outlined text-[24px]">auto_stories</span>
                  </div>
                  <div class="flex flex-col">
                    <span class="font-noto-serif text-sm sm:text-base font-semibold text-[#e5e1e4] group-hover:text-[#7bd8b1] transition-colors">
                      المولع بفخامة الحرف العربي والرقوق
                    </span>
                    <span class="text-xs text-[#debfc2]/70">
                      معلقات الشعر، مجالس الأدب القديم، وزخارف الرق
                    </span>
                  </div>
                </div>
                <span class="material-symbols-outlined text-[#debfc2] group-hover:text-[#7bd8b1] group-hover:-translate-x-1 transition-all">arrow_back</span>
              </button>

            </div>
          </div>
        </section>

        <!-- ========================================== -->
        <!-- SECTION 4: THE SANCTUARY CHARTER & PHILOSOPHY -->
        <!-- ========================================== -->
        <section id="sanctuary-charter" class="w-full px-4 sm:px-6 md:px-12 py-16 relative">
          <div class="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            
            <!-- Text Manifest -->
            <div class="lg:col-span-6 flex flex-col gap-4">
              <div class="inline-flex items-center gap-1.5 text-[#e9c349]">
                <span class="material-symbols-outlined text-[20px]">verified</span>
                <span class="text-xs font-semibold tracking-wider">ميثاق التجربة التحريرية</span>
              </div>
              <h2 class="font-noto-serif text-3xl sm:text-4xl text-[#e5e1e4] leading-tight font-bold">
                عمارة سردية رقمية تتسامى عن الضجيج
              </h2>
              <p class="text-base text-[#debfc2]/85 leading-relaxed">
                أنشئت «أروقة الخلود» لتكون مضاداً حيوياً للسطحية الرقمية السريعة. نحن نلغي كل مشتتات التجارة والتقييمات الاستهلاكية لنعيدك إلى قدسية الورقة الأولى وهيبة الكلمة المكتوبة.
              </p>

              <!-- 3 Pillars of Charter -->
              <div class="flex flex-col gap-4 mt-2">
                <div class="flex items-start gap-3.5">
                  <span class="material-symbols-outlined text-[#e9c349] text-[24px] mt-0.5 shrink-0">filter_vintage</span>
                  <div>
                    <h3 class="font-noto-serif text-base font-semibold text-[#e5e1e4]">
                      النقاء التحريري الكامل (قاعدة الغلاف والعنوان فقط)
                    </h3>
                    <p class="text-xs text-[#debfc2]/75 mt-1 leading-relaxed">
                      تُعرض الأعمال في نسختها الأصيلة دون تشويه بالأوسمة أو النجوم أو الشارات الإعلانية.
                    </p>
                  </div>
                </div>

                <div class="flex items-start gap-3.5">
                  <span class="material-symbols-outlined text-[#ffb2bd] text-[24px] mt-0.5 shrink-0">palette</span>
                  <div>
                    <h3 class="font-noto-serif text-base font-semibold text-[#e5e1e4]">
                      هوية بصرية ومعمارية مخصصة لكل رواق
                    </h3>
                    <p class="text-xs text-[#debfc2]/75 mt-1 leading-relaxed">
                      نظام إضاءة وألوان يتفاعل مع نبض الرواق؛ من توتر الروايات المسرحي إلى صدى الملاحم وسكينة الفلسفة العاجية.
                    </p>
                  </div>
                </div>

                <div class="flex items-start gap-3.5">
                  <span class="material-symbols-outlined text-[#7bd8b1] text-[24px] mt-0.5 shrink-0">history_edu</span>
                  <div>
                    <h3 class="font-noto-serif text-base font-semibold text-[#e5e1e4]">
                      التحول السردي السلس
                    </h3>
                    <p class="text-xs text-[#debfc2]/75 mt-1 leading-relaxed">
                      انتقال بصري منساب يغيّر الهوية اللونية للمنصة بالكامل بمجرد تخطي عتبة الرواق الجديد.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <!-- Visual Exhibit of Architectural Purity -->
            <div class="lg:col-span-6 relative">
              <div class="relative w-full aspect-[4/3] rounded-2xl overflow-hidden shadow-2xl bg-[#0e0e10] border border-white/[0.08]">
                <div
                  class="w-full h-full bg-cover bg-center"
                  style="background-image: url('https://lh3.googleusercontent.com/aida-public/AB6AXuAY-GsF0V8cf0yxzKkj56O6fI8V1taxwmK1ptxStiyxfnhgfJcHQ_8wHjS1l1usz6mgkMXfJLiUh6Gz2_6WAykcxr_buot3zIyHtan_h2MDymTHIHcTsBzPyZYcVqTPGfV4e4pzogMGEuS9f0jnUoC48nF02jvyzbWYaxRvfYWG3PCwlHISGcQV_7PnH9hkQUOeiH57Yi25iaTwK54DLdUGoZTlRj8tWkcLWfoEHBaX-2kKygBl8DaVpg')"
                ></div>
                <div class="absolute inset-0 bg-gradient-to-t from-[#0e0e10] via-transparent to-transparent"></div>
                
                <!-- Inlaid Quotation Pill -->
                <div class="absolute bottom-4 inset-x-4 p-4 bg-[#1c1b1d]/90 border border-white/10 backdrop-blur-xl rounded-xl flex items-center justify-between gap-4">
                  <div class="flex items-center gap-2.5 min-w-0">
                    <span class="material-symbols-outlined text-[#e9c349] text-[22px] shrink-0">menu_book</span>
                    <span class="text-xs sm:text-sm text-[#e5e1e4] font-semibold truncate font-noto-serif">
                      «الكلمة الصادقة كنز لا يبلى، وعمارة لا تتهدم.»
                    </span>
                  </div>
                  <button
                    type="button"
                    (click)="showCharterDetails.set(!showCharterDetails())"
                    class="text-xs text-[#e9c349] hover:underline shrink-0 font-medium"
                  >
                    اقرأ الميثاق الكامل ←
                  </button>
                </div>
              </div>
            </div>

          </div>

          <!-- Charter Details Modal / Accordion -->
          @if (showCharterDetails()) {
            <div class="mt-8 p-6 bg-[#0e0e10]/95 border border-[#e9c349]/30 rounded-2xl animate-in fade-in duration-300">
              <div class="flex items-center justify-between mb-4">
                <span class="font-noto-serif text-lg font-bold text-[#e9c349]">دستور أروقة الخلود وميثاق التحرير</span>
                <button type="button" (click)="showCharterDetails.set(false)" class="text-[#debfc2] hover:text-white">
                  <span class="material-symbols-outlined text-[20px]">close</span>
                </button>
              </div>
              <p class="text-sm text-[#debfc2] leading-relaxed mb-3">
                تلتزم منصة أروقة الخلود بحفظ النصوص الأصلية لعيون الأدب والتراث العالمي والإنساني، دون اختصار أو تشويه. كل حرف يتم تخزينه وضغطه بدقة خوارزمية MTX المتطورة فائقة السرعة، مما يتيح تجربة قراءة أسرع بعشر مرات وبدون استهلاك للبيانات، مع الحفاظ الكامل على الحركات وعلامات التشكيل.
              </p>
              <div class="text-xs text-[#e9c349]/80 font-mono">
                MTX Text Architecture • Lossless Arabic Script Encoding • Zero Distraction Policy
              </div>
            </div>
          }
        </section>

        <!-- ========================================== -->
        <!-- SECTION 5: THE GRAND INVITATION STRIP -->
        <!-- ========================================== -->
        <section class="w-full px-4 sm:px-6 md:px-12 pb-20 relative">
          <div class="relative w-full rounded-2xl overflow-hidden bg-gradient-to-r from-[#881337]/25 via-[#201f22] to-[#af8d11]/25 border border-white/[0.08] p-6 sm:p-10 flex flex-col md:flex-row items-center justify-between gap-6 shadow-2xl">
            <div class="flex flex-col gap-1.5 text-center md:text-right">
              <span class="text-xs font-semibold text-[#e9c349] tracking-widest uppercase">
                تذكرة العبور إلى أروقة الخلود
              </span>
              <h2 class="font-noto-serif text-2xl sm:text-3xl text-[#e5e1e4] font-bold">
                هل أنت مستعد لمغادرة صخب العالم الرقمي؟
              </h2>
              <p class="text-sm text-[#debfc2]/85 max-w-xl leading-relaxed">
                انضم إلى قراء الصرح لتخوض تجارب القراءة التأملية غير المنقطعة، وتحفظ مقتطفاتك في خزانة مخطوطاتك الخاصة.
              </p>
            </div>
            
            <div class="flex items-center gap-3 shrink-0">
              <button
                type="button"
                (click)="scrollToSanctuaries()"
                class="px-6 py-3 rounded-full bg-[#e9c349] text-[#241a00] font-noto-serif text-sm font-bold shadow-lg hover:bg-[#ffe088] transition-all cursor-pointer"
              >
                استكشف الخزانة
              </button>
              <a
                routerLink="/profile"
                class="px-6 py-3 rounded-full bg-[#2a2a2c] text-[#e5e1e4] border border-white/10 text-xs font-medium hover:bg-[#39393b] transition-all cursor-pointer"
              >
                المحفوظات
              </a>
            </div>
          </div>
        </section>

      </div>
    </div>
  `,
})
export class NovelLibrary {
  readonly novelStore = inject(NovelStore);
  private readonly router = inject(Router);

  readonly sanctuaries = SANCTUARIES_DATA;
  readonly showCharterDetails = signal<boolean>(false);

  getSanctuaryBooks(sanctuaryId: string): Novel[] {
    return this.novelStore.getNovelsByRiwaq(sanctuaryId);
  }

  openBook(bookId: string): void {
    this.router.navigate(['/novel', bookId]);
  }

  filterBySanctuary(sanctuaryId: string): void {
    const el = document.getElementById(sanctuaryId);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }

  scrollToSanctuaries(): void {
    const el = document.getElementById('sanctuaries-section');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }
}
