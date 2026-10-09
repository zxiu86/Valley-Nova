import { ChangeDetectionStrategy, Component, ElementRef, inject, signal, ViewChild } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { AuthStore } from '../core/auth-store';
import { NovelStore } from '../core/novel-store';

type ProfileModal = 'cropAvatar' | 'changeCover' | 'editName' | null;

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-user-profile',
  imports: [RouterLink, MatIconModule, ReactiveFormsModule],
  template: `
    <div class="min-h-screen pb-24 text-stone-100 overflow-x-hidden">
      
      <!-- ========================================================================= -->
      <!-- 1. PROFILE COVER BANNER (غلاف خلفي بطول 800 وعرض 1500 مع تظليل داخلي وحدود إجبارية) -->
      <!-- ========================================================================= -->
      <section class="max-w-6xl mx-auto px-4 sm:px-6 pt-6 sm:pt-8">
        <div class="relative w-full h-56 sm:h-72 md:h-80 rounded-3xl overflow-hidden border border-white/10 shadow-2xl group">
          
          <!-- Cover Image (1500x800 aspect ratio) -->
          <img
            [src]="authStore.coverURL()"
            alt="غلاف الملف الشخصي"
            referrerpolicy="no-referrer"
            class="w-full h-full object-cover object-center transition-transform duration-700 group-hover:scale-102"
            (error)="onCoverError($event)"
          />

          <!-- Artistic Inner Shading (تظليل داخلي ناعم يدمج الغلاف مع ألوان الموقع) -->
          <div class="absolute inset-0 bg-gradient-to-t from-stone-950 via-stone-950/40 to-black/30 pointer-events-none"></div>
          <div class="absolute inset-0 cover-inner-shadow pointer-events-none"></div>

          <!-- Top Action: Change Cover Button -->
          <div class="absolute top-4 left-4 z-20">
            <button
              type="button"
              (click)="openModal('changeCover')"
              class="px-3.5 py-2 rounded-2xl liquid-glass border border-white/20 hover:border-rose-500/50 hover:bg-black/80 text-white text-xs font-semibold flex items-center gap-2 cursor-pointer transition-all shadow-lg backdrop-blur-md"
              title="تغيير الغلاف الخلفي (1500x800)"
            >
              <mat-icon class="text-base text-rose-400">wallpaper</mat-icon>
              <span>تغيير الغلاف</span>
            </button>
          </div>

          <!-- Bottom Banner Subtle Metadata -->
          <div class="absolute bottom-4 left-6 z-20 hidden sm:flex items-center gap-2 text-[11px] text-stone-300 font-sans">
            <span class="px-2.5 py-1 rounded-xl bg-black/50 border border-white/10 backdrop-blur-sm">
              غلاف مدمج (1500 × 800)
            </span>
          </div>

        </div>
      </section>

      <!-- ========================================================================= -->
      <!-- 2. USER PROFILE HEADER & AVATAR (الأيقونة الشخصية + الاسم + شريط الإحصائيات) -->
      <!-- ========================================================================= -->
      <section class="max-w-6xl mx-auto px-4 sm:px-6 -mt-16 sm:-mt-20 relative z-30">
        <div class="flex flex-col md:flex-row items-center md:items-end justify-between gap-6 pb-8 border-b border-white/10">
          
          <!-- Avatar + Name -->
          <div class="flex flex-col sm:flex-row items-center sm:items-end gap-5 text-center sm:text-right">
            
            <!-- Circular Avatar Container with Change Button Overlay -->
            <div class="relative group/avatar">
              <!-- Avatar Display -->
              <div class="w-32 h-32 sm:w-36 sm:h-36 rounded-full overflow-hidden border-4 border-stone-950 shadow-2xl bg-stone-900 relative">
                @if (authStore.photoURL()) {
                  <img
                    [src]="authStore.photoURL()"
                    alt="الصورة الشخصية"
                    referrerpolicy="no-referrer"
                    class="w-full h-full object-cover"
                  />
                } @else {
                  <div class="w-full h-full bg-gradient-to-br from-rose-600 via-rose-800 to-stone-950 flex items-center justify-center font-amiri font-bold text-5xl text-white">
                    {{ authStore.displayName().charAt(0) || 'ق' }}
                  </div>
                }
              </div>

              <!-- Online Active Indicator -->
              <div class="absolute bottom-2 left-2 w-5 h-5 rounded-full bg-emerald-500 border-2 border-stone-950 shadow" title="قارئ متصل"></div>

              <!-- Quick Circular Crop Trigger Button Overlay -->
              <button
                type="button"
                (click)="openModal('cropAvatar')"
                class="absolute inset-0 rounded-full bg-black/60 opacity-0 group-hover/avatar:opacity-100 flex flex-col items-center justify-center text-white text-xs font-bold transition-opacity cursor-pointer backdrop-blur-xs gap-1"
                title="قص وتغيير الصورة الشخصية بشكل يدوي"
              >
                <mat-icon class="text-xl text-rose-400">crop</mat-icon>
                <span>قص الأيقونة</span>
              </button>
            </div>

            <!-- User Information -->
            <div class="space-y-1.5 pb-2">
              <div class="flex flex-wrap items-center justify-center sm:justify-start gap-2.5">
                <h1 class="text-2xl sm:text-3xl font-extrabold font-amiri text-white tracking-wide">
                  {{ authStore.displayName() || 'قارئ مقاتل' }}
                </h1>
                
                <span class="px-2.5 py-0.5 rounded-full bg-rose-600/20 border border-rose-500/40 text-rose-300 text-[11px] font-bold flex items-center gap-1">
                  <mat-icon class="text-xs">verified</mat-icon>
                  <span>قارئ مميز</span>
                </span>
              </div>

              <p class="text-xs text-stone-400 font-mono">
                {{ authStore.userEmail() }}
              </p>

              <!-- Quick Bio Quote -->
              <p class="text-xs text-stone-300 font-sans italic opacity-80 pt-1">
                "السيف يُصلب بالصقل، والقارئ يُصقل بالروايات الملحمية."
              </p>
            </div>

          </div>

          <!-- Action Buttons Bar -->
          <div class="flex flex-wrap items-center justify-center gap-2.5">
            <button
              type="button"
              (click)="openModal('editName')"
              class="px-4 py-2.5 rounded-2xl liquid-glass border border-white/10 hover:border-rose-500/40 text-stone-200 hover:text-white text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5"
            >
              <mat-icon class="text-base text-rose-400">edit</mat-icon>
              <span>إعادة تعيين الاسم</span>
            </button>

            <button
              type="button"
              (click)="openModal('cropAvatar')"
              class="px-4 py-2.5 rounded-2xl liquid-glass border border-white/10 hover:border-rose-500/40 text-stone-200 hover:text-white text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5"
            >
              <mat-icon class="text-base text-rose-400">account_circle</mat-icon>
              <span>تغيير الأيقونة</span>
            </button>

            <button
              type="button"
              (click)="onLogout()"
              class="px-4 py-2.5 rounded-2xl bg-rose-950/60 hover:bg-rose-900 border border-rose-500/30 text-rose-300 text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5"
            >
              <mat-icon class="text-base">logout</mat-icon>
              <span>تسجيل الخروج</span>
            </button>
          </div>

        </div>

        <!-- ========================================================================= -->
        <!-- 3. STATS STRIP (عدد الفصول التي قرأها المستخدم والمفضلة) -->
        <!-- ========================================================================= -->
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-4 py-8">
          
          <div class="p-4 sm:p-5 rounded-2xl liquid-glass-card border border-white/10 text-center space-y-1">
            <span class="text-2xl sm:text-3xl font-black font-mono-code text-rose-400">
              {{ novelStore.totalChaptersReadCount() }}
            </span>
            <span class="block text-xs text-stone-400 font-sans">فصول تمت قراءتها</span>
          </div>

          <div class="p-4 sm:p-5 rounded-2xl liquid-glass-card border border-white/10 text-center space-y-1">
            <span class="text-2xl sm:text-3xl font-black font-mono-code text-amber-400">
              {{ novelStore.bookmarkedNovels().length }}
            </span>
            <span class="block text-xs text-stone-400 font-sans">روايات في المفضلة</span>
          </div>

          <div class="p-4 sm:p-5 rounded-2xl liquid-glass-card border border-white/10 text-center space-y-1">
            <span class="text-2xl sm:text-3xl font-black font-mono-code text-emerald-400">
              {{ novelStore.novels().length }}
            </span>
            <span class="block text-xs text-stone-400 font-sans">روايات بالمكتبة</span>
          </div>

          <div class="p-4 sm:p-5 rounded-2xl liquid-glass-card border border-white/10 text-center space-y-1">
            <span class="text-2xl sm:text-3xl font-black font-mono-code text-rose-300">
              100%
            </span>
            <span class="block text-xs text-stone-400 font-sans">مزامنة سحابية</span>
          </div>

        </div>
      </section>

      <!-- ========================================================================= -->
      <!-- 4. CONTENT SECTIONS: (آخر الفصول المقروءة + المفضلة) -->
      <!-- ========================================================================= -->
      <section class="max-w-6xl mx-auto px-4 sm:px-6 space-y-12">
        
        <!-- SECTION A: آخر الفصول التي قرأها المستخدم -->
        <div class="space-y-6">
          <div class="flex items-center justify-between border-b border-white/10 pb-4">
            <div class="flex items-center gap-2.5">
              <div class="w-2.5 h-6 rounded-full bg-rose-500"></div>
              <h2 class="text-xl sm:text-2xl font-bold font-amiri text-white">
                آخر الفصول التي قرأتها
              </h2>
            </div>

            <span class="text-xs text-stone-400 font-sans">
              {{ novelStore.readHistory().length }} فصل محفوظ
            </span>
          </div>

          @if (novelStore.readHistory().length > 0) {
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              @for (item of novelStore.readHistory().slice(0, 9); track item.chapterId) {
                <div class="p-4 rounded-2xl liquid-glass-card border border-white/10 hover:border-rose-500/40 flex items-center justify-between gap-3 group transition-all">
                  <div class="min-w-0 flex-1 space-y-1">
                    <span class="text-[10px] text-rose-400 font-bold block truncate">
                      {{ item.novelTitle }}
                    </span>
                    <h4 class="text-sm font-bold font-amiri text-white truncate group-hover:text-rose-300 transition-colors">
                      الفصل {{ item.chapterIndex }}: {{ item.chapterTitle }}
                    </h4>
                    <span class="text-[10px] text-stone-500 block font-mono">
                      {{ formatTimeAgo(item.readAt) }}
                    </span>
                  </div>

                  <a
                    [routerLink]="['/reader', item.novelId, item.chapterId]"
                    class="p-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white transition-all cursor-pointer shadow-md shrink-0"
                    title="متابعة قراءة هذا الفصل"
                  >
                    <mat-icon class="text-base">play_arrow</mat-icon>
                  </a>
                </div>
              }
            </div>
          } @else {
            <div class="p-10 rounded-3xl liquid-glass border border-white/5 text-center space-y-3">
              <div class="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center mx-auto text-stone-500">
                <mat-icon class="text-2xl">auto_stories</mat-icon>
              </div>
              <h4 class="text-base font-bold font-amiri text-white">لم تقرأ أي فصول بعد</h4>
              <p class="text-xs text-stone-400 max-w-sm mx-auto">
                استكشف مكتبة الروايات وابدأ بقراءة أول فصل وسيتم حفظ تقدمك تلقائياً هنا!
              </p>
              <a
                routerLink="/"
                class="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition-all shadow-md mt-2"
              >
                <span>تصفح الروايات الآن</span>
                <mat-icon class="text-sm">arrow_back</mat-icon>
              </a>
            </div>
          }
        </div>

        <!-- SECTION B: المفضلة (روايات القارئ المحفوظة) -->
        <div class="space-y-6">
          <div class="flex items-center justify-between border-b border-white/10 pb-4">
            <div class="flex items-center gap-2.5">
              <div class="w-2.5 h-6 rounded-full bg-amber-500"></div>
              <h2 class="text-xl sm:text-2xl font-bold font-amiri text-white">
                رواياتي المفضلة
              </h2>
            </div>

            <span class="text-xs text-stone-400 font-sans">
              {{ novelStore.bookmarkedNovels().length }} رواية
            </span>
          </div>

          @if (novelStore.bookmarkedNovels().length > 0) {
            <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5">
              @for (novel of novelStore.bookmarkedNovels(); track novel.id) {
                <div class="rounded-2xl overflow-hidden liquid-glass-card border border-white/10 hover:border-rose-500/30 flex flex-col justify-between group transition-all">
                  
                  <div class="p-4 space-y-2.5">
                    <div [class]="'w-full h-36 rounded-xl bg-gradient-to-br ' + novel.coverGradient + ' relative overflow-hidden p-2.5 flex flex-col justify-between shadow-inner'">
                      <div class="absolute inset-0 cover-inner-shadow pointer-events-none"></div>
                      <span class="relative z-10 self-start px-2 py-0.5 rounded-md bg-black/70 text-rose-300 text-[10px] font-bold">
                        ★ {{ novel.rating || 4.9 }}
                      </span>
                      <span class="relative z-10 self-end px-2 py-0.5 rounded-md bg-black/70 text-stone-300 text-[10px]">
                        {{ novel.chapters.length }} فصول
                      </span>
                    </div>

                    <div class="space-y-1">
                      <span class="text-[10px] text-rose-400 font-semibold block truncate">
                        {{ novel.category }}
                      </span>
                      <h4 class="text-sm font-bold font-amiri text-white line-clamp-1 group-hover:text-rose-300 transition-colors">
                        {{ novel.title }}
                      </h4>
                      <p class="text-[11px] text-stone-400 truncate">
                        بقلم: {{ novel.author }}
                      </p>
                    </div>
                  </div>

                  <div class="p-3 bg-black/40 border-t border-white/5 flex items-center justify-between gap-2">
                    <a
                      [routerLink]="['/novel', novel.id]"
                      class="flex-1 py-1.5 px-3 rounded-lg bg-rose-600/30 hover:bg-rose-600 text-rose-200 hover:text-white text-xs font-semibold text-center transition-all cursor-pointer"
                    >
                      فتح الرواية
                    </a>
                    
                    <button
                      type="button"
                      (click)="removeBookmark(novel.id)"
                      class="p-1.5 rounded-lg hover:bg-white/10 text-stone-400 hover:text-rose-400 transition-colors cursor-pointer"
                      title="إزالة من المفضلة"
                    >
                      <mat-icon class="text-base">bookmark_remove</mat-icon>
                    </button>
                  </div>

                </div>
              }
            </div>
          } @else {
            <div class="p-8 rounded-3xl liquid-glass border border-white/5 text-center text-xs text-stone-400">
              لا توجد روايات في المفضلة حالياً. يمكنك الضغط على أيقونة الإشارة المرجعية لأي رواية لحفظها هنا!
            </div>
          }
        </div>

      </section>

      <!-- ========================================================================= -->
      <!-- MODAL 1: MANUAL CIRCULAR AVATAR CROPPER (نافذة قص الصورة بشكل يدوي على شكل دائري) -->
      <!-- ========================================================================= -->
      @if (activeModal() === 'cropAvatar') {
        <div class="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto animate-in fade-in">
          
          <div class="w-full max-w-md liquid-glass bg-stone-950/95 border border-rose-500/40 rounded-3xl p-6 sm:p-7 space-y-6 shadow-2xl relative my-auto">
            
            <div class="flex items-center justify-between border-b border-white/10 pb-4">
              <div class="flex items-center gap-2.5">
                <div class="w-9 h-9 rounded-xl bg-rose-600/20 text-rose-400 border border-rose-500/30 flex items-center justify-center">
                  <mat-icon class="text-lg">crop</mat-icon>
                </div>
                <div>
                  <h3 class="font-bold text-base font-amiri text-white">قص الصورة الشخصية يدوياً</h3>
                  <span class="text-[11px] text-stone-400">حرك وكبّر الصورة للقص الدائري المثالي</span>
                </div>
              </div>

              <button
                type="button"
                (click)="closeModal()"
                class="w-8 h-8 rounded-xl liquid-glass flex items-center justify-center text-stone-400 hover:text-white cursor-pointer"
              >
                <mat-icon class="text-lg">close</mat-icon>
              </button>
            </div>

            <!-- Upload File Input Trigger -->
            <div class="space-y-3">
              <label class="w-full py-2.5 px-4 rounded-xl border border-dashed border-rose-500/50 hover:border-rose-400 bg-rose-950/20 hover:bg-rose-950/40 text-rose-300 text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer transition-all">
                <mat-icon class="text-base">upload_file</mat-icon>
                <span>اختر صورة من جهازك للقص الدائري</span>
                <input
                  type="file"
                  accept="image/*"
                  class="hidden"
                  (change)="onAvatarFileSelected($event)"
                />
              </label>
            </div>

            <!-- MANUAL CIRCULAR CROP CANVAS VIEWPORT -->
            <div class="relative w-64 h-64 mx-auto rounded-3xl overflow-hidden border-2 border-rose-500/40 shadow-inner bg-black flex items-center justify-center select-none cursor-move">
              
              <!-- Canvas on which image is drawn and transformed -->
              <canvas
                #cropCanvas
                width="256"
                height="256"
                class="w-full h-full"
                (mousedown)="startPan($event)"
                (mousemove)="onPan($event)"
                (mouseup)="endPan()"
                (mouseleave)="endPan()"
                (touchstart)="startTouchPan($event)"
                (touchmove)="onTouchPan($event)"
                (touchend)="endPan()"
              ></canvas>

              <!-- CIRCULAR VIEWPORT OVERLAY MASK -->
              <div class="absolute inset-0 pointer-events-none flex items-center justify-center">
                <div class="w-52 h-52 rounded-full border-2 border-dashed border-rose-400 shadow-[0_0_0_9999px_rgba(0,0,0,0.65)] relative">
                  <div class="absolute inset-0 flex items-center justify-center opacity-30">
                    <div class="w-full h-px bg-white"></div>
                    <div class="h-full w-px bg-white absolute"></div>
                  </div>
                </div>
              </div>

            </div>

            <!-- ZOOM & POSITION CONTROLS -->
            <div class="space-y-3 p-3.5 rounded-2xl bg-white/5 border border-white/5">
              <div class="flex items-center justify-between text-xs text-stone-300">
                <span class="flex items-center gap-1">
                  <mat-icon class="text-sm text-rose-400">zoom_in</mat-icon>
                  <span>تكبير / تصغير:</span>
                </span>
                <span class="font-mono text-stone-400">{{ (zoomScale() * 100).toFixed(0) }}%</span>
              </div>

              <div class="flex items-center gap-3">
                <button
                  type="button"
                  (click)="adjustZoom(-0.1)"
                  class="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center text-white cursor-pointer font-bold"
                >
                  -
                </button>
                <input
                  type="range"
                  min="0.5"
                  max="3.0"
                  step="0.05"
                  [value]="zoomScale()"
                  (input)="onZoomChange($event)"
                  class="flex-1 accent-rose-500 cursor-pointer"
                />
                <button
                  type="button"
                  (click)="adjustZoom(0.1)"
                  class="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center text-white cursor-pointer font-bold"
                >
                  +
                </button>
              </div>

              <div class="flex items-center justify-between text-[11px] text-stone-400 pt-1">
                <span>اسحب الصورة بالفأرة/اللمس لتحديد الموقع الدائري</span>
                <button
                  type="button"
                  (click)="resetCropPosition()"
                  class="text-rose-400 hover:underline cursor-pointer"
                >
                  إعادة ضبط
                </button>
              </div>
            </div>

            <!-- PRESET ARTISTIC AVATARS OPTION -->
            <div class="space-y-2">
              <span class="text-[11px] text-stone-400 block font-sans">أو اختر أيقونة جاهزة بنقرة واحدة:</span>
              <div class="flex items-center justify-center gap-3">
                @for (preset of avatarPresets; track preset.id) {
                  <button
                    type="button"
                    (click)="selectPresetAvatar(preset.url)"
                    class="w-11 h-11 rounded-full overflow-hidden border-2 border-white/10 hover:border-rose-500 hover:scale-110 transition-all cursor-pointer relative shadow-md"
                    title="{{ preset.name }}"
                  >
                    <img [src]="preset.url" [alt]="preset.name" class="w-full h-full object-cover" />
                  </button>
                }
              </div>
            </div>

            <!-- Save Action Button -->
            <div class="pt-2 flex items-center gap-3">
              <button
                type="button"
                (click)="applyCircularCrop()"
                [disabled]="isSaving()"
                class="flex-1 py-3 px-4 rounded-xl bg-gradient-to-l from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 text-white font-bold text-xs shadow-lg shadow-rose-950/50 flex items-center justify-center gap-2 cursor-pointer transition-all disabled:opacity-40"
              >
                <mat-icon class="text-base">check</mat-icon>
                <span>{{ isSaving() ? 'جاري الحفظ...' : 'تأكيد وقص الأيقونة' }}</span>
              </button>

              <button
                type="button"
                (click)="closeModal()"
                class="py-3 px-4 rounded-xl border border-white/10 hover:bg-white/10 text-stone-400 hover:text-white text-xs transition-colors cursor-pointer"
              >
                إلغاء
              </button>
            </div>

          </div>

        </div>
      }

      <!-- ========================================================================= -->
      <!-- MODAL 2: CHANGE COVER BANNER (1500x800 مع تظليل داخلي ومعاينة) -->
      <!-- ========================================================================= -->
      @if (activeModal() === 'changeCover') {
        <div class="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto animate-in fade-in">
          
          <div class="w-full max-w-lg liquid-glass bg-stone-950/95 border border-rose-500/40 rounded-3xl p-6 sm:p-7 space-y-6 shadow-2xl relative my-auto">
            
            <div class="flex items-center justify-between border-b border-white/10 pb-4">
              <div class="flex items-center gap-2.5">
                <div class="w-9 h-9 rounded-xl bg-rose-600/20 text-rose-400 border border-rose-500/30 flex items-center justify-center">
                  <mat-icon class="text-lg">wallpaper</mat-icon>
                </div>
                <div>
                  <h3 class="font-bold text-base font-amiri text-white">تغيير الغلاف الخلفي (1500 × 800)</h3>
                  <span class="text-[11px] text-stone-400">غلاف مدمج بتظليل داخلي فاخر يظهر أيضاً عند التعليق</span>
                </div>
              </div>

              <button
                type="button"
                (click)="closeModal()"
                class="w-8 h-8 rounded-xl liquid-glass flex items-center justify-center text-stone-400 hover:text-white cursor-pointer"
              >
                <mat-icon class="text-lg">close</mat-icon>
              </button>
            </div>

            <!-- Upload Custom Cover -->
            <div class="space-y-3">
              <label class="w-full py-3 px-4 rounded-2xl border border-dashed border-rose-500/50 hover:border-rose-400 bg-rose-950/20 hover:bg-rose-950/40 text-rose-300 text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer transition-all">
                <mat-icon class="text-base">add_photo_alternate</mat-icon>
                <span>رفع صورة غلاف جديدة من جهازك (1500 × 800)</span>
                <input
                  type="file"
                  accept="image/*"
                  class="hidden"
                  (change)="onCoverFileSelected($event)"
                />
              </label>
            </div>

            <!-- Or Choose From Epic Curated Wallpapers -->
            <div class="space-y-3">
              <span class="text-xs font-bold text-stone-300 block">أو اختر من تصاميم وأغلفة مقاتل الروايات:</span>
              
              <div class="grid grid-cols-2 gap-3">
                @for (cover of coverPresets; track cover.id) {
                  <button
                    type="button"
                    (click)="selectPresetCover(cover.url)"
                    class="relative h-24 rounded-2xl overflow-hidden border-2 transition-all cursor-pointer group text-right"
                    [class]="selectedCoverPreview() === cover.url ? 'border-rose-500 shadow-md scale-102' : 'border-white/10 hover:border-white/30'"
                  >
                    <img [src]="cover.url" [alt]="cover.name" class="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                    <div class="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent"></div>
                    <span class="absolute bottom-2 right-2 text-[11px] font-bold text-white drop-shadow">
                      {{ cover.name }}
                    </span>
                  </button>
                }
              </div>
            </div>

            <!-- Save Cover Action -->
            <div class="pt-2 flex items-center gap-3">
              <button
                type="button"
                (click)="saveSelectedCover()"
                [disabled]="isSaving()"
                class="flex-1 py-3 px-4 rounded-xl bg-gradient-to-l from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 text-white font-bold text-xs shadow-lg shadow-rose-950/50 flex items-center justify-center gap-2 cursor-pointer transition-all disabled:opacity-40"
              >
                <mat-icon class="text-base">check</mat-icon>
                <span>{{ isSaving() ? 'جاري الحفظ...' : 'اعتماد هذا الغلاف' }}</span>
              </button>

              <button
                type="button"
                (click)="closeModal()"
                class="py-3 px-4 rounded-xl border border-white/10 hover:bg-white/10 text-stone-400 hover:text-white text-xs transition-colors cursor-pointer"
              >
                إلغاء
              </button>
            </div>

          </div>

        </div>
      }

      <!-- ========================================================================= -->
      <!-- MODAL 3: EDIT DISPLAY NAME (إعادة تعيين اسم المستخدم) -->
      <!-- ========================================================================= -->
      @if (activeModal() === 'editName') {
        <div class="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto animate-in fade-in">
          
          <div class="w-full max-w-sm liquid-glass bg-stone-950/95 border border-rose-500/40 rounded-3xl p-6 sm:p-7 space-y-6 shadow-2xl relative my-auto">
            
            <div class="flex items-center justify-between border-b border-white/10 pb-4">
              <div class="flex items-center gap-2.5">
                <div class="w-9 h-9 rounded-xl bg-rose-600/20 text-rose-400 border border-rose-500/30 flex items-center justify-center">
                  <mat-icon class="text-lg">edit</mat-icon>
                </div>
                <h3 class="font-bold text-base font-amiri text-white">إعادة تعيين اسم القارئ</h3>
              </div>

              <button
                type="button"
                (click)="closeModal()"
                class="w-8 h-8 rounded-xl liquid-glass flex items-center justify-center text-stone-400 hover:text-white cursor-pointer"
              >
                <mat-icon class="text-lg">close</mat-icon>
              </button>
            </div>

            <form [formGroup]="nameForm" (ngSubmit)="saveDisplayName()" class="space-y-4">
              <div class="space-y-1.5">
                <label for="newNameInput" class="block text-xs font-medium text-stone-300">الاسم المستعار الجديد:</label>
                <div class="relative">
                  <input
                    id="newNameInput"
                    type="text"
                    formControlName="name"
                    placeholder="مثلاً: صقر الروايات"
                    class="w-full bg-stone-900 border border-white/15 focus:border-rose-500 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-stone-500 focus:outline-none transition-colors pr-10"
                  />
                  <mat-icon class="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 text-base pointer-events-none">
                    badge
                  </mat-icon>
                </div>
              </div>

              <div class="pt-2 flex items-center gap-3">
                <button
                  type="submit"
                  [disabled]="nameForm.invalid || isSaving()"
                  class="flex-1 py-2.5 px-4 rounded-xl bg-gradient-to-l from-rose-600 to-rose-700 hover:from-rose-500 text-white font-bold text-xs shadow-md transition-all cursor-pointer disabled:opacity-40 flex items-center justify-center gap-1.5"
                >
                  <mat-icon class="text-sm">save</mat-icon>
                  <span>{{ isSaving() ? 'جاري الحفظ...' : 'حفظ الاسم' }}</span>
                </button>

                <button
                  type="button"
                  (click)="closeModal()"
                  class="py-2.5 px-4 rounded-xl border border-white/10 hover:bg-white/10 text-stone-400 hover:text-white text-xs transition-colors cursor-pointer"
                >
                  إلغاء
                </button>
              </div>
            </form>

          </div>

        </div>
      }

    </div>
  `,
})
export class UserProfile {
  readonly authStore = inject(AuthStore);
  readonly novelStore = inject(NovelStore);
  private readonly router = inject(Router);

  @ViewChild('cropCanvas') cropCanvasRef?: ElementRef<HTMLCanvasElement>;

  readonly activeModal = signal<ProfileModal>(null);
  readonly isSaving = signal<boolean>(false);
  readonly selectedCoverPreview = signal<string>(this.authStore.coverURL());

  // Circular Cropper State
  readonly cropperImage = signal<HTMLImageElement | null>(null);
  readonly panX = signal<number>(0);
  readonly panY = signal<number>(0);
  readonly zoomScale = signal<number>(1.0);
  private isDragging = false;
  private dragStartX = 0;
  private dragStartY = 0;

  readonly nameForm = new FormGroup({
    name: new FormControl<string>('', {
      nonNullable: true,
      validators: [Validators.required, Validators.minLength(2), Validators.maxLength(40)],
    }),
  });

  // Curated Preset Avatars
  readonly avatarPresets = [
    { id: 'p1', name: 'المقاتل الناري', url: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?q=80&w=300&auto=format&fit=crop' },
    { id: 'p2', name: 'الفارس النبيل', url: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?q=80&w=300&auto=format&fit=crop' },
    { id: 'p3', name: 'حكيم الروايات', url: 'https://images.unsplash.com/photo-1544717305-2782549b5136?q=80&w=300&auto=format&fit=crop' },
    { id: 'p4', name: 'صقر الشرق', url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=300&auto=format&fit=crop' },
  ];

  // Curated 1500x800 Profile Cover Presets
  readonly coverPresets = [
    { id: 'c1', name: 'مكتبة الأساطير الملحمية', url: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=1500&auto=format&fit=crop' },
    { id: 'c2', name: 'سماء الغسق القرمزي', url: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?q=80&w=1500&auto=format&fit=crop' },
    { id: 'c3', name: 'قصر المحاربين العتيق', url: 'https://images.unsplash.com/photo-1514565131-fce0801e5785?q=80&w=1500&auto=format&fit=crop' },
    { id: 'c4', name: 'محراب الكتب العتيق', url: 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?q=80&w=1500&auto=format&fit=crop' },
  ];

  openModal(type: ProfileModal): void {
    this.activeModal.set(type);

    if (type === 'editName') {
      this.nameForm.setValue({ name: this.authStore.displayName() });
    }

    if (type === 'cropAvatar') {
      this.initCropCanvasWithCurrentAvatar();
    }
  }

  closeModal(): void {
    this.activeModal.set(null);
  }

  onCoverError(event: Event): void {
    const img = event.target as HTMLImageElement;
    img.src = 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=1500&auto=format&fit=crop';
  }

  removeBookmark(novelId: string): void {
    this.novelStore.toggleBookmark(novelId);
  }

  async onLogout(): Promise<void> {
    await this.authStore.logout();
    this.router.navigate(['/']);
  }

  // --- CIRCULAR CROPPER IMPLEMENTATION ---

  private initCropCanvasWithCurrentAvatar(): void {
    const currentUrl = this.authStore.photoURL() || this.avatarPresets[0].url;
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      this.cropperImage.set(img);
      this.panX.set(0);
      this.panY.set(0);
      this.zoomScale.set(1.0);
      setTimeout(() => this.redrawCanvas(), 50);
    };
    img.src = currentUrl;
  }

  onAvatarFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;

    const file = input.files[0];
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        this.cropperImage.set(img);
        this.panX.set(0);
        this.panY.set(0);
        this.zoomScale.set(1.0);
        setTimeout(() => this.redrawCanvas(), 50);
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  }

  selectPresetAvatar(url: string): void {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      this.cropperImage.set(img);
      this.panX.set(0);
      this.panY.set(0);
      this.zoomScale.set(1.0);
      this.redrawCanvas();
    };
    img.src = url;
  }

  onZoomChange(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.zoomScale.set(parseFloat(target.value));
    this.redrawCanvas();
  }

  adjustZoom(delta: number): void {
    const next = Math.min(3.0, Math.max(0.5, this.zoomScale() + delta));
    this.zoomScale.set(next);
    this.redrawCanvas();
  }

  resetCropPosition(): void {
    this.panX.set(0);
    this.panY.set(0);
    this.zoomScale.set(1.0);
    this.redrawCanvas();
  }

  startPan(event: MouseEvent): void {
    this.isDragging = true;
    this.dragStartX = event.clientX - this.panX();
    this.dragStartY = event.clientY - this.panY();
  }

  onPan(event: MouseEvent): void {
    if (!this.isDragging) return;
    this.panX.set(event.clientX - this.dragStartX);
    this.panY.set(event.clientY - this.dragStartY);
    this.redrawCanvas();
  }

  startTouchPan(event: TouchEvent): void {
    if (event.touches.length === 0) return;
    this.isDragging = true;
    this.dragStartX = event.touches[0].clientX - this.panX();
    this.dragStartY = event.touches[0].clientY - this.panY();
  }

  onTouchPan(event: TouchEvent): void {
    if (!this.isDragging || event.touches.length === 0) return;
    this.panX.set(event.touches[0].clientX - this.dragStartX);
    this.panY.set(event.touches[0].clientY - this.dragStartY);
    this.redrawCanvas();
  }

  endPan(): void {
    this.isDragging = false;
  }

  private redrawCanvas(): void {
    const canvas = this.cropCanvasRef?.nativeElement;
    const img = this.cropperImage();
    if (!canvas || !img) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Calculate aspect fit scaled dimensions
    const scale = this.zoomScale();
    const aspect = img.width / img.height;
    let drawW = canvas.width * scale;
    let drawH = (canvas.width / aspect) * scale;
    if (drawH < canvas.height * scale) {
      drawH = canvas.height * scale;
      drawW = canvas.height * aspect * scale;
    }

    const drawX = (canvas.width - drawW) / 2 + this.panX();
    const drawY = (canvas.height - drawH) / 2 + this.panY();

    ctx.save();
    ctx.drawImage(img, drawX, drawY, drawW, drawH);
    ctx.restore();
  }

  async applyCircularCrop(): Promise<void> {
    const canvas = this.cropCanvasRef?.nativeElement;
    if (!canvas) return;

    this.isSaving.set(true);

    try {
      // Create a 256x256 circular cropped output canvas
      const outputCanvas = document.createElement('canvas');
      outputCanvas.width = 256;
      outputCanvas.height = 256;
      const ctx = outputCanvas.getContext('2d');

      if (ctx) {
        // Create circular clip path
        ctx.beginPath();
        ctx.arc(128, 128, 128, 0, Math.PI * 2, true);
        ctx.closePath();
        ctx.clip();

        // Copy from the cropper canvas (the centered 208px circular guide area)
        ctx.drawImage(canvas, 24, 24, 208, 208, 0, 0, 256, 256);
        const croppedDataUrl = outputCanvas.toDataURL('image/png', 0.9);

        // Update profile
        await this.authStore.updateProfileData({ photoURL: croppedDataUrl });
        this.closeModal();
      }
    } catch (e) {
      console.error('Circular crop failed:', e);
    } finally {
      this.isSaving.set(false);
    }
  }

  // --- COVER BANNER IMPLEMENTATION ---

  selectPresetCover(url: string): void {
    this.selectedCoverPreview.set(url);
  }

  onCoverFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;

    const file = input.files[0];
    const reader = new FileReader();
    reader.onload = (e) => {
      this.selectedCoverPreview.set(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  }

  async saveSelectedCover(): Promise<void> {
    this.isSaving.set(true);
    try {
      await this.authStore.updateProfileData({ coverURL: this.selectedCoverPreview() });
      this.closeModal();
    } finally {
      this.isSaving.set(false);
    }
  }

  // --- DISPLAY NAME IMPLEMENTATION ---

  async saveDisplayName(): Promise<void> {
    if (this.nameForm.invalid) return;
    this.isSaving.set(true);

    try {
      const newName = this.nameForm.controls.name.value;
      await this.authStore.updateProfileData({ displayName: newName });
      this.closeModal();
    } finally {
      this.isSaving.set(false);
    }
  }

  formatTimeAgo(isoString: string): string {
    const diff = Date.now() - new Date(isoString).getTime();
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return 'الآن';
    if (minutes < 60) return `منذ ${minutes} دقيقة`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `منذ ${hours} ساعة`;
    const days = Math.floor(hours / 24);
    return `منذ ${days} يوم`;
  }
}
