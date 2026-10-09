import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  HostListener,
  inject,
  signal,
  ViewChild,
} from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { AuthStore } from '../core/auth-store';
import { NovelStore } from '../core/novel-store';

type ProfileModal = 'cropAvatar' | 'changeCover' | 'editName' | 'clearHistoryConfirm' | null;

interface PresetWallpaper {
  id: string;
  name: string;
  url: string;
  category: string;
}

interface PresetAvatar {
  id: string;
  name: string;
  url: string;
}

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-user-profile',
  imports: [RouterLink, MatIconModule, ReactiveFormsModule],
  template: `
    <div class="min-h-screen pb-24 text-stone-100 overflow-x-hidden selection:bg-rose-500/30">

      <!-- ========================================================================= -->
      <!-- GUEST / SYNC BANNER (إذا كان المستخدم غير مسجل دخول يتم توضيحه بسلاسة) -->
      <!-- ========================================================================= -->
      @if (!authStore.isAuthenticated()) {
        <div class="max-w-6xl mx-auto px-4 sm:px-6 pt-4">
          <div class="p-3.5 sm:p-4 rounded-2xl bg-amber-950/40 border border-amber-500/30 text-amber-200 text-xs sm:text-sm flex flex-col sm:flex-row items-center justify-between gap-3 shadow-lg backdrop-blur-md">
            <div class="flex items-center gap-2.5 text-center sm:text-right">
              <mat-icon class="text-amber-400 text-xl shrink-0">info</mat-icon>
              <span>
                أنت تتصفح الحساب بوضع <strong>الزائر</strong> — التعديلات تُحفظ محلياً على جهازك. سجّل دخولك لمزامنة أيقونتك وغلافك وفصولك سحابياً!
              </span>
            </div>
            <a
              routerLink="/login"
              class="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs shrink-0 transition-colors shadow-md flex items-center gap-1.5 cursor-pointer"
            >
              <mat-icon class="text-sm">login</mat-icon>
              <span>تسجيل الدخول / إنشاء حساب</span>
            </a>
          </div>
        </div>
      }

      <!-- ========================================================================= -->
      <!-- 1. PROFILE COVER BANNER (غلاف خلفي بنسبة 1500 × 800 مع تظليل داخلي وحدود إجبارية) -->
      <!-- ========================================================================= -->
      <section class="max-w-6xl mx-auto px-4 sm:px-6 pt-5 sm:pt-7">
        <div
          class="relative w-full max-w-5xl mx-auto aspect-[15/8] max-h-[380px] min-h-[200px] rounded-3xl overflow-hidden border border-white/10 shadow-2xl group transition-all"
        >
          <!-- Cover Image (1500x800 aspect fit & center) -->
          <img
            [src]="authStore.coverURL()"
            alt="غلاف الملف الشخصي"
            referrerpolicy="no-referrer"
            class="w-full h-full object-cover object-center transition-transform duration-700 group-hover:scale-102"
            (error)="onCoverError($event)"
          />

          <!-- Artistic Inner Shading (تظليل داخلي فاخر يدمج الغلاف مع ألوان الموقع الداكنة) -->
          <div class="absolute inset-0 bg-gradient-to-t from-stone-950 via-stone-950/45 to-black/25 pointer-events-none"></div>
          <div class="absolute inset-0 cover-inner-shadow pointer-events-none"></div>

          <!-- Top-Left Action: Change Cover Button -->
          <div class="absolute top-4 left-4 z-20">
            <button
              type="button"
              (click)="openModal('changeCover')"
              class="px-3.5 py-2 rounded-2xl liquid-glass border border-white/20 hover:border-rose-500/50 hover:bg-black/85 text-white text-xs font-semibold flex items-center gap-2 cursor-pointer transition-all shadow-xl backdrop-blur-md active:scale-95"
              title="تغيير الغلاف الخلفي (1500 × 800)"
            >
              <mat-icon class="text-base text-rose-400">wallpaper</mat-icon>
              <span>تغيير الغلاف (1500 × 800)</span>
            </button>
          </div>

          <!-- Bottom Banner Metadata Label -->
          <div class="absolute bottom-3.5 left-5 z-20 hidden sm:flex items-center gap-2 text-[11px] text-stone-300 font-sans">
            <span class="px-2.5 py-1 rounded-xl bg-black/60 border border-white/10 backdrop-blur-md shadow">
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

          <!-- Avatar + Name + Badges -->
          <div class="flex flex-col sm:flex-row items-center sm:items-end gap-5 text-center sm:text-right">

            <!-- Circular Avatar Container with Hover Overlay -->
            <div class="relative group/avatar">
              <!-- Avatar Display -->
              <div class="w-32 h-32 sm:w-36 sm:h-36 rounded-full overflow-hidden border-4 border-stone-950 shadow-2xl bg-stone-900 relative ring-2 ring-rose-500/40">
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

              <!-- Online Active Status Dot -->
              <div
                class="absolute bottom-2 left-2 w-5 h-5 rounded-full bg-emerald-500 border-2 border-stone-950 shadow"
                title="قارئ متصل"
              ></div>

              <!-- Quick Circular Crop Trigger Button Overlay -->
              <button
                type="button"
                (click)="openModal('cropAvatar')"
                class="absolute inset-0 rounded-full bg-black/65 opacity-0 group-hover/avatar:opacity-100 flex flex-col items-center justify-center text-white text-xs font-bold transition-opacity cursor-pointer backdrop-blur-xs gap-1"
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

                <!-- Reading Rank Badge -->
                <span class="px-2.5 py-0.5 rounded-full bg-rose-600/20 border border-rose-500/40 text-rose-300 text-[11px] font-bold flex items-center gap-1 shadow-sm">
                  <mat-icon class="text-xs">military_tech</mat-icon>
                  <span>{{ readerRank() }}</span>
                </span>
              </div>

              <div class="flex items-center justify-center sm:justify-start gap-2 text-xs text-stone-400 font-mono">
                <mat-icon class="text-sm text-stone-500">alternate_email</mat-icon>
                <span>{{ authStore.userEmail() }}</span>
              </div>

              <!-- Quick Quote / Bio -->
              <p class="text-xs text-stone-300 font-sans italic opacity-85 pt-1">
                "السيف يُصلب بالصقل، والقارئ يُصقل بالروايات الملحمية."
              </p>
            </div>

          </div>

          <!-- Action Buttons Bar -->
          <div class="flex flex-wrap items-center justify-center gap-2.5">
            <button
              type="button"
              (click)="openModal('editName')"
              class="px-4 py-2.5 rounded-2xl liquid-glass border border-white/10 hover:border-rose-500/40 text-stone-200 hover:text-white text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 active:scale-95 shadow-sm"
            >
              <mat-icon class="text-base text-rose-400">edit</mat-icon>
              <span>إعادة تعيين الاسم</span>
            </button>

            <button
              type="button"
              (click)="openModal('cropAvatar')"
              class="px-4 py-2.5 rounded-2xl liquid-glass border border-white/10 hover:border-rose-500/40 text-stone-200 hover:text-white text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 active:scale-95 shadow-sm"
            >
              <mat-icon class="text-base text-rose-400">account_circle</mat-icon>
              <span>تغيير الأيقونة</span>
            </button>

            <button
              type="button"
              (click)="openModal('changeCover')"
              class="px-4 py-2.5 rounded-2xl liquid-glass border border-white/10 hover:border-rose-500/40 text-stone-200 hover:text-white text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 active:scale-95 shadow-sm"
            >
              <mat-icon class="text-base text-rose-400">wallpaper</mat-icon>
              <span>تغيير الغلاف</span>
            </button>

            @if (authStore.isAuthenticated()) {
              <button
                type="button"
                (click)="onLogout()"
                class="px-4 py-2.5 rounded-2xl bg-rose-950/60 hover:bg-rose-900 border border-rose-500/30 text-rose-300 text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 active:scale-95 shadow-sm"
              >
                <mat-icon class="text-base">logout</mat-icon>
                <span>تسجيل الخروج</span>
              </button>
            } @else {
              <a
                routerLink="/login"
                class="px-4 py-2.5 rounded-2xl bg-gradient-to-l from-rose-600 to-rose-700 hover:from-rose-500 text-white text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-md active:scale-95"
              >
                <mat-icon class="text-base">login</mat-icon>
                <span>تسجيل الدخول</span>
              </a>
            }
          </div>

        </div>

        <!-- ========================================================================= -->
        <!-- 3. STATS STRIP (عدد الفصول التي قرأها المستخدم، المفضلة، والمزامنة) -->
        <!-- ========================================================================= -->
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-4 py-8">

          <div class="p-4 sm:p-5 rounded-2xl liquid-glass-card border border-white/10 text-center space-y-1 group">
            <span class="text-2xl sm:text-3xl font-black font-mono text-rose-400 group-hover:scale-105 transition-transform block">
              {{ novelStore.totalChaptersReadCount() }}
            </span>
            <span class="block text-xs text-stone-400 font-sans">فصول تمت قراءتها</span>
          </div>

          <div class="p-4 sm:p-5 rounded-2xl liquid-glass-card border border-white/10 text-center space-y-1 group">
            <span class="text-2xl sm:text-3xl font-black font-mono text-amber-400 group-hover:scale-105 transition-transform block">
              {{ novelStore.bookmarkedNovels().length }}
            </span>
            <span class="block text-xs text-stone-400 font-sans">روايات في المفضلة</span>
          </div>

          <div class="p-4 sm:p-5 rounded-2xl liquid-glass-card border border-white/10 text-center space-y-1 group">
            <span class="text-2xl sm:text-3xl font-black font-mono text-emerald-400 group-hover:scale-105 transition-transform block">
              {{ novelStore.novels().length }}
            </span>
            <span class="block text-xs text-stone-400 font-sans">روايات بالمكتبة</span>
          </div>

          <div class="p-4 sm:p-5 rounded-2xl liquid-glass-card border border-white/10 text-center space-y-1 group">
            <span class="text-2xl sm:text-3xl font-black font-mono text-rose-300 group-hover:scale-105 transition-transform block">
              {{ authStore.isAuthenticated() ? 'مفعّلة' : 'محلية' }}
            </span>
            <span class="block text-xs text-stone-400 font-sans">حالة المزامنة السحابية</span>
          </div>

        </div>

        <!-- ========================================================================= -->
        <!-- 4. QUICK SETTINGS CARDS (إعدادات الحساب والمظهر بتصميم أنيق وسريع) -->
        <!-- ========================================================================= -->
        <div class="mb-10 p-5 sm:p-6 rounded-3xl liquid-glass border border-white/10 space-y-4">
          <div class="flex items-center justify-between border-b border-white/10 pb-3">
            <div class="flex items-center gap-2">
              <mat-icon class="text-rose-400 text-lg">tune</mat-icon>
              <h3 class="font-bold text-sm sm:text-base font-amiri text-white">إعدادات الحساب وتخصيص المظهر</h3>
            </div>
            <span class="text-[11px] text-stone-400">تعديلات سريعة بنقرة واحدة</span>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-3 gap-3.5 pt-1">
            <!-- Quick Setting 1: Avatar -->
            <button
              type="button"
              (click)="openModal('cropAvatar')"
              class="p-4 rounded-2xl bg-white/5 hover:bg-rose-950/30 border border-white/10 hover:border-rose-500/40 text-right space-y-1.5 transition-all cursor-pointer group"
            >
              <div class="flex items-center justify-between">
                <mat-icon class="text-rose-400">crop</mat-icon>
                <span class="text-[10px] text-rose-300 px-2 py-0.5 rounded-md bg-rose-950/60 border border-rose-500/30">قص دائري</span>
              </div>
              <h4 class="text-sm font-bold text-white font-amiri group-hover:text-rose-300 transition-colors">تعديل الأيقونة</h4>
              <p class="text-[11px] text-stone-400 leading-relaxed">قص يدوي دائري لأي صورة من جهازك أو اختيار أيقونة جاهزة.</p>
            </button>

            <!-- Quick Setting 2: Cover -->
            <button
              type="button"
              (click)="openModal('changeCover')"
              class="p-4 rounded-2xl bg-white/5 hover:bg-rose-950/30 border border-white/10 hover:border-rose-500/40 text-right space-y-1.5 transition-all cursor-pointer group"
            >
              <div class="flex items-center justify-between">
                <mat-icon class="text-rose-400">wallpaper</mat-icon>
                <span class="text-[10px] text-rose-300 px-2 py-0.5 rounded-md bg-rose-950/60 border border-rose-500/30">1500 × 800</span>
              </div>
              <h4 class="text-sm font-bold text-white font-amiri group-hover:text-rose-300 transition-colors">تعديل الغلاف الخلفي</h4>
              <p class="text-[11px] text-stone-400 leading-relaxed">غلاف مدمج بتظليل داخلي يظهر في الحساب والتعليقات على الفصول.</p>
            </button>

            <!-- Quick Setting 3: Name -->
            <button
              type="button"
              (click)="openModal('editName')"
              class="p-4 rounded-2xl bg-white/5 hover:bg-rose-950/30 border border-white/10 hover:border-rose-500/40 text-right space-y-1.5 transition-all cursor-pointer group"
            >
              <div class="flex items-center justify-between">
                <mat-icon class="text-rose-400">badge</mat-icon>
                <span class="text-[10px] text-rose-300 px-2 py-0.5 rounded-md bg-rose-950/60 border border-rose-500/30">اسم مستعار</span>
              </div>
              <h4 class="text-sm font-bold text-white font-amiri group-hover:text-rose-300 transition-colors">إعادة تسمية الحساب</h4>
              <p class="text-[11px] text-stone-400 leading-relaxed">تغيير الاسم الذي يظهر لبقية القراء عند مشاركتك التعليق على الفصول.</p>
            </button>
          </div>
        </div>

      </section>

      <!-- ========================================================================= -->
      <!-- 5. CONTENT SECTIONS: (آخر الفصول المقروءة + المفضلة) -->
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

            <div class="flex items-center gap-3">
              <span class="text-xs text-stone-400 font-sans">
                {{ novelStore.readHistory().length }} فصل محفوظ
              </span>

              @if (novelStore.readHistory().length > 0) {
                <button
                  type="button"
                  (click)="openModal('clearHistoryConfirm')"
                  class="text-[11px] text-rose-400 hover:text-rose-300 hover:underline cursor-pointer flex items-center gap-1"
                >
                  <mat-icon class="text-xs">delete_sweep</mat-icon>
                  <span>مسح السجل</span>
                </button>
              }
            </div>
          </div>

          @if (novelStore.readHistory().length > 0) {
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              @for (item of novelStore.readHistory().slice(0, 9); track item.chapterId) {
                <div class="p-4 rounded-2xl liquid-glass-card border border-white/10 hover:border-rose-500/40 flex items-center justify-between gap-3 group transition-all shadow-md">
                  <div class="min-w-0 flex-1 space-y-1">
                    <span class="text-[10px] text-rose-400 font-bold block truncate">
                      {{ item.novelTitle }}
                    </span>
                    <h4 class="text-sm font-bold font-amiri text-white truncate group-hover:text-rose-300 transition-colors">
                      الفصل {{ item.chapterIndex }}: {{ item.chapterTitle }}
                    </h4>
                    <span class="text-[10px] text-stone-400 block font-mono">
                      {{ formatTimeAgo(item.readAt) }}
                    </span>
                  </div>

                  <a
                    [routerLink]="['/reader', item.novelId, item.chapterId]"
                    class="p-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white transition-all cursor-pointer shadow-md shrink-0 active:scale-95"
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
                <div class="rounded-2xl overflow-hidden liquid-glass-card border border-white/10 hover:border-rose-500/30 flex flex-col justify-between group transition-all shadow-md">

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
      <!-- TOAST NOTIFICATION FEEDBACK -->
      <!-- ========================================================================= -->
      @if (toastMessage()) {
        <div class="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-2xl bg-stone-900/95 border border-rose-500/50 text-white text-xs font-bold shadow-2xl flex items-center gap-2.5 backdrop-blur-xl animate-in fade-in slide-in-from-bottom-3">
          <mat-icon class="text-rose-400 text-base">check_circle</mat-icon>
          <span>{{ toastMessage() }}</span>
        </div>
      }

      <!-- ========================================================================= -->
      <!-- MODAL 1: MANUAL CIRCULAR AVATAR CROPPER (نافذة قص الصورة يدوياً المحسّنة) -->
      <!-- ========================================================================= -->
      @if (activeModal() === 'cropAvatar') {
        <div class="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in">
          <button
            type="button"
            aria-label="إغلاق النافذة"
            (click)="closeModal()"
            class="fixed inset-0 w-full h-full bg-transparent border-0 cursor-default"
          ></button>
          <div
            class="relative z-10 w-full max-w-lg liquid-glass bg-stone-950/95 border border-rose-500/40 rounded-3xl p-5 sm:p-7 space-y-5 shadow-2xl my-auto max-h-[92vh] overflow-y-auto"
          >
            <!-- Modal Header -->
            <div class="flex items-center justify-between border-b border-white/10 pb-3.5">
              <div class="flex items-center gap-2.5">
                <div class="w-9 h-9 rounded-xl bg-rose-600/20 text-rose-400 border border-rose-500/30 flex items-center justify-center">
                  <mat-icon class="text-lg">crop</mat-icon>
                </div>
                <div>
                  <h3 class="font-bold text-base font-amiri text-white">قص الصورة الشخصية يدوياً</h3>
                  <span class="text-[11px] text-stone-400">حرّك واسحب وكبّر الصورة للقص الدائري الدقيق</span>
                </div>
              </div>

              <button
                type="button"
                (click)="closeModal()"
                class="w-8 h-8 rounded-xl liquid-glass flex items-center justify-center text-stone-400 hover:text-white cursor-pointer transition-colors"
                title="إغلاق (Esc)"
              >
                <mat-icon class="text-lg">close</mat-icon>
              </button>
            </div>

            <!-- Upload File Drop Area -->
            <div
              (dragover)="onDragOver($event)"
              (dragleave)="onDragLeave($event)"
              (drop)="onFileDrop($event, 'avatar')"
              [class.border-rose-400]="isDraggingFile()"
              [class.bg-rose-950]="isDraggingFile()"
              class="w-full py-3 px-4 rounded-2xl border-2 border-dashed border-rose-500/40 hover:border-rose-400 bg-rose-950/20 text-rose-300 text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer transition-all"
            >
              <mat-icon class="text-base">upload_file</mat-icon>
              <span>اختر صورة من جهازك أو اسحبها هنا للقص الدائري</span>
              <input
                type="file"
                accept="image/*"
                class="hidden"
                #avatarFileInput
                (change)="onAvatarFileSelected($event)"
              />
              <button
                type="button"
                (click)="avatarFileInput.click()"
                class="sr-only"
              >
                رفع
              </button>
            </div>

            <!-- CROP WORKSPACE: Canvas + Live Circular Preview -->
            <div class="flex flex-col sm:flex-row items-center justify-center gap-4">

              <!-- INTERACTIVE CROP CANVAS (with mouse wheel + drag) -->
              <div
                class="relative w-60 h-60 rounded-3xl overflow-hidden border-2 border-rose-500/50 shadow-inner bg-black flex items-center justify-center select-none cursor-move shrink-0"
                title="اسحب بالفأرة أو بإصبعك، واستخدم عجلة الفأرة للتكبير"
                (wheel)="onCanvasWheel($event)"
              >
                <canvas
                  #cropCanvas
                  width="240"
                  height="240"
                  class="w-full h-full block"
                  (mousedown)="startPan($event)"
                  (mousemove)="onPan($event)"
                  (mouseup)="endPan()"
                  (mouseleave)="endPan()"
                  (touchstart)="startTouchPan($event)"
                  (touchmove)="onTouchPan($event)"
                  (touchend)="endPan()"
                ></canvas>

                <!-- CIRCULAR MASK OVERLAY GUIDELINE -->
                <div class="absolute inset-0 pointer-events-none flex items-center justify-center">
                  <div class="w-48 h-48 rounded-full border-2 border-dashed border-rose-400 shadow-[0_0_0_9999px_rgba(0,0,0,0.65)] relative">
                    <div class="absolute inset-0 flex items-center justify-center opacity-30">
                      <div class="w-full h-px bg-white"></div>
                      <div class="h-full w-px bg-white absolute"></div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- LIVE CIRCULAR PREVIEW CARD (معاينة حية للمظهر) -->
              <div class="flex flex-row sm:flex-col items-center justify-center gap-3 p-3.5 rounded-2xl bg-white/5 border border-white/5 sm:w-36 text-center">
                <span class="text-[11px] text-stone-400 block font-sans">معاينة حية:</span>

                <div class="w-16 h-16 rounded-full overflow-hidden border-2 border-rose-500 shadow-xl bg-stone-900 relative">
                  @if (livePreviewUrl()) {
                    <img [src]="livePreviewUrl()" alt="معاينة" class="w-full h-full object-cover" />
                  } @else {
                    <div class="w-full h-full bg-rose-900/60 flex items-center justify-center text-xs text-rose-300">
                      معاينة
                    </div>
                  }
                </div>

                <div class="w-9 h-9 rounded-full overflow-hidden border border-rose-400 shadow-sm bg-stone-900">
                  @if (livePreviewUrl()) {
                    <img [src]="livePreviewUrl()" alt="صغيرة" class="w-full h-full object-cover" />
                  }
                </div>
              </div>

            </div>

            <!-- ZOOM & POSITION CONTROLS -->
            <div class="space-y-2.5 p-3.5 rounded-2xl bg-white/5 border border-white/5">
              <div class="flex items-center justify-between text-xs text-stone-300">
                <span class="flex items-center gap-1">
                  <mat-icon class="text-sm text-rose-400">zoom_in</mat-icon>
                  <span>التكبير والتحجيم:</span>
                </span>
                <span class="font-mono text-stone-400">{{ (zoomScale() * 100).toFixed(0) }}%</span>
              </div>

              <div class="flex items-center gap-2">
                <button
                  type="button"
                  (click)="adjustZoom(-0.1)"
                  class="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center text-white cursor-pointer font-bold text-base"
                  title="تصغير"
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
                  class="flex-1 accent-rose-500 cursor-pointer h-2 bg-stone-800 rounded-lg"
                />
                <button
                  type="button"
                  (click)="adjustZoom(0.1)"
                  class="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center text-white cursor-pointer font-bold text-base"
                  title="تكبير"
                >
                  +
                </button>
              </div>

              <!-- Quick Presets for Zoom -->
              <div class="flex items-center justify-between gap-1 pt-1">
                <div class="flex items-center gap-1.5 text-[11px]">
                  <button
                    type="button"
                    (click)="setExactZoom(1.0)"
                    class="px-2 py-0.5 rounded-md bg-white/10 hover:bg-white/20 text-stone-300 cursor-pointer"
                  >
                    100%
                  </button>
                  <button
                    type="button"
                    (click)="setExactZoom(1.5)"
                    class="px-2 py-0.5 rounded-md bg-white/10 hover:bg-white/20 text-stone-300 cursor-pointer"
                  >
                    150%
                  </button>
                  <button
                    type="button"
                    (click)="setExactZoom(2.0)"
                    class="px-2 py-0.5 rounded-md bg-white/10 hover:bg-white/20 text-stone-300 cursor-pointer"
                  >
                    200%
                  </button>
                </div>

                <button
                  type="button"
                  (click)="resetCropPosition()"
                  class="text-[11px] text-rose-400 hover:underline cursor-pointer flex items-center gap-0.5"
                >
                  <mat-icon class="text-xs">restart_alt</mat-icon>
                  <span>إعادة التوسيط</span>
                </button>
              </div>
            </div>

            <!-- PRESET ARTISTIC AVATARS GALLERY -->
            <div class="space-y-2">
              <span class="text-[11px] text-stone-400 block font-sans">أو اختر أيقونة جاهزة بنقرة سريعة:</span>
              <div class="grid grid-cols-4 gap-2.5">
                @for (preset of avatarPresets; track preset.id) {
                  <button
                    type="button"
                    (click)="selectPresetAvatar(preset.url)"
                    class="w-full aspect-square rounded-2xl overflow-hidden border-2 transition-all cursor-pointer relative shadow-sm hover:scale-105 group"
                    [class]="selectedPresetAvatarUrl() === preset.url ? 'border-rose-500 ring-2 ring-rose-500/50' : 'border-white/10 hover:border-white/30'"
                    title="{{ preset.name }}"
                  >
                    <img [src]="preset.url" [alt]="preset.name" class="w-full h-full object-cover" />
                    <span class="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-[10px] text-white font-bold p-1 text-center">
                      {{ preset.name }}
                    </span>
                  </button>
                }
              </div>
            </div>

            <!-- Action Buttons -->
            <div class="pt-2 flex items-center gap-3">
              <button
                type="button"
                (click)="applyCircularCrop()"
                [disabled]="isSaving()"
                class="flex-1 py-3 px-4 rounded-xl bg-gradient-to-l from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 text-white font-bold text-xs shadow-lg shadow-rose-950/50 flex items-center justify-center gap-2 cursor-pointer transition-all disabled:opacity-40 active:scale-98"
              >
                @if (isSaving()) {
                  <div class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>جاري الحفظ والقص...</span>
                } @else {
                  <mat-icon class="text-base">check</mat-icon>
                  <span>تأكيد وقص الأيقونة</span>
                }
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
      <!-- MODAL 2: CHANGE COVER BANNER (1500x800 مع تظليل داخلي ومعاينة دقيقة) -->
      <!-- ========================================================================= -->
      @if (activeModal() === 'changeCover') {
        <div class="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in">
          <button
            type="button"
            aria-label="إغلاق النافذة"
            (click)="closeModal()"
            class="fixed inset-0 w-full h-full bg-transparent border-0 cursor-default"
          ></button>
          <div
            class="relative z-10 w-full max-w-xl liquid-glass bg-stone-950/95 border border-rose-500/40 rounded-3xl p-5 sm:p-7 space-y-5 shadow-2xl my-auto max-h-[92vh] overflow-y-auto"
          >
            <!-- Modal Header -->
            <div class="flex items-center justify-between border-b border-white/10 pb-3.5">
              <div class="flex items-center gap-2.5">
                <div class="w-9 h-9 rounded-xl bg-rose-600/20 text-rose-400 border border-rose-500/30 flex items-center justify-center">
                  <mat-icon class="text-lg">wallpaper</mat-icon>
                </div>
                <div>
                  <h3 class="font-bold text-base font-amiri text-white">تغيير الغلاف الخلفي (1500 × 800)</h3>
                  <span class="text-[11px] text-stone-400">غلاف مدمج بتظليل داخلي فاخر يظهر في الحساب والتعليقات</span>
                </div>
              </div>

              <button
                type="button"
                (click)="closeModal()"
                class="w-8 h-8 rounded-xl liquid-glass flex items-center justify-center text-stone-400 hover:text-white cursor-pointer transition-colors"
                title="إغلاق (Esc)"
              >
                <mat-icon class="text-lg">close</mat-icon>
              </button>
            </div>

            <!-- LIVE COVER BANNER PREVIEW (معاينة الغلاف بالأبعاد الحقيقية 1500x800) -->
            <div class="space-y-1.5">
              <span class="text-[11px] text-stone-400 font-sans block">معاينة الغلاف الحالي المختار:</span>
              <div class="relative w-full aspect-[15/8] max-h-48 rounded-2xl overflow-hidden border border-white/15 shadow-inner">
                <img
                  [src]="selectedCoverPreview()"
                  alt="معاينة الغلاف"
                  class="w-full h-full object-cover"
                />
                <div class="absolute inset-0 bg-gradient-to-t from-stone-950 via-stone-950/40 to-transparent pointer-events-none"></div>
                <div class="absolute inset-0 cover-inner-shadow pointer-events-none"></div>

                <!-- Mock Avatar Overlay for realism -->
                <div class="absolute bottom-2.5 right-3.5 flex items-center gap-2 z-10 pointer-events-none">
                  <div class="w-9 h-9 rounded-full overflow-hidden border-2 border-stone-950 shadow-md bg-stone-900">
                    @if (authStore.photoURL()) {
                      <img [src]="authStore.photoURL()" alt="أيقونة" class="w-full h-full object-cover" />
                    }
                  </div>
                  <span class="text-xs font-bold text-white drop-shadow font-amiri">
                    {{ authStore.displayName() }}
                  </span>
                </div>
              </div>
            </div>

            <!-- Upload Custom File from Device -->
            <div
              (dragover)="onDragOver($event)"
              (dragleave)="onDragLeave($event)"
              (drop)="onFileDrop($event, 'cover')"
              [class.border-rose-400]="isDraggingFile()"
              class="w-full py-3 px-4 rounded-2xl border-2 border-dashed border-rose-500/40 hover:border-rose-400 bg-rose-950/20 text-rose-300 text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer transition-all"
            >
              <mat-icon class="text-base">add_photo_alternate</mat-icon>
              <span>اختر صورة من جهازك للغلاف (يتم ضغطها تلقائياً إلى 1500 × 800)</span>
              <input
                type="file"
                accept="image/*"
                class="hidden"
                #coverFileInput
                (change)="onCoverFileSelected($event)"
              />
              <button
                type="button"
                (click)="coverFileInput.click()"
                class="sr-only"
              >
                رفع الغلاف
              </button>
            </div>

            <!-- Direct URL Paste Input Option -->
            <div class="space-y-1.5 p-3 rounded-2xl bg-white/5 border border-white/5">
              <span class="text-[11px] text-stone-300 block">أو الصق رابط صورة مباشر:</span>
              <div class="flex items-center gap-2">
                <input
                  type="url"
                  placeholder="https://example.com/wallpaper.jpg"
                  [value]="coverUrlInput()"
                  (input)="onCoverUrlInput($event)"
                  class="flex-1 bg-stone-900 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-stone-500 focus:outline-none focus:border-rose-500 transition-colors"
                />
                <button
                  type="button"
                  (click)="applyCoverFromUrl()"
                  [disabled]="!coverUrlInput().trim()"
                  class="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-stone-200 text-xs font-semibold disabled:opacity-40 cursor-pointer transition-colors"
                >
                  معاينة
                </button>
              </div>
            </div>

            <!-- Curated Wallpapers Presets Gallery -->
            <div class="space-y-2">
              <span class="text-xs font-bold text-stone-300 block">أو اختر من أغلفة مقاتل الروايات الملحمية:</span>

              <div class="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                @for (cover of coverPresets; track cover.id) {
                  <button
                    type="button"
                    (click)="selectPresetCover(cover.url)"
                    class="relative h-20 rounded-2xl overflow-hidden border-2 transition-all cursor-pointer group text-right shadow-sm"
                    [class]="selectedCoverPreview() === cover.url ? 'border-rose-500 ring-2 ring-rose-500/50 scale-102' : 'border-white/10 hover:border-white/30'"
                  >
                    <img [src]="cover.url" [alt]="cover.name" class="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                    <div class="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent"></div>
                    <span class="absolute bottom-1.5 right-2 text-[10px] font-bold text-white drop-shadow truncate block max-w-[90%]">
                      {{ cover.name }}
                    </span>
                    @if (selectedCoverPreview() === cover.url) {
                      <div class="absolute top-1.5 left-1.5 w-4 h-4 rounded-full bg-rose-500 flex items-center justify-center text-white text-[10px]">
                        ✓
                      </div>
                    }
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
                class="flex-1 py-3 px-4 rounded-xl bg-gradient-to-l from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 text-white font-bold text-xs shadow-lg shadow-rose-950/50 flex items-center justify-center gap-2 cursor-pointer transition-all disabled:opacity-40 active:scale-98"
              >
                @if (isSaving()) {
                  <div class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>جاري اعتماد الغلاف...</span>
                } @else {
                  <mat-icon class="text-base">check</mat-icon>
                  <span>اعتماد وحفظ هذا الغلاف</span>
                }
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
      <!-- MODAL 3: EDIT DISPLAY NAME (إعادة تعيين اسم المستخدم المستعار) -->
      <!-- ========================================================================= -->
      @if (activeModal() === 'editName') {
        <div class="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in">
          <button
            type="button"
            aria-label="إغلاق النافذة"
            (click)="closeModal()"
            class="fixed inset-0 w-full h-full bg-transparent border-0 cursor-default"
          ></button>
          <div
            class="relative z-10 w-full max-w-md liquid-glass bg-stone-950/95 border border-rose-500/40 rounded-3xl p-5 sm:p-7 space-y-5 shadow-2xl my-auto"
          >
            <!-- Modal Header -->
            <div class="flex items-center justify-between border-b border-white/10 pb-3.5">
              <div class="flex items-center gap-2.5">
                <div class="w-9 h-9 rounded-xl bg-rose-600/20 text-rose-400 border border-rose-500/30 flex items-center justify-center">
                  <mat-icon class="text-lg">edit</mat-icon>
                </div>
                <div>
                  <h3 class="font-bold text-base font-amiri text-white">إعادة تعيين اسم القارئ</h3>
                  <span class="text-[11px] text-stone-400">الاسم يظهر في ملفك الشخصي وعند التعليق على الفصول</span>
                </div>
              </div>

              <button
                type="button"
                (click)="closeModal()"
                class="w-8 h-8 rounded-xl liquid-glass flex items-center justify-center text-stone-400 hover:text-white cursor-pointer transition-colors"
                title="إغلاق (Esc)"
              >
                <mat-icon class="text-lg">close</mat-icon>
              </button>
            </div>

            <form [formGroup]="nameForm" (ngSubmit)="saveDisplayName()" class="space-y-4">
              <div class="space-y-1.5">
                <div class="flex items-center justify-between text-xs font-medium text-stone-300">
                  <label for="newNameInput">الاسم المستعار الجديد:</label>
                  <span class="text-[11px] font-mono text-stone-400">
                    {{ nameForm.controls.name.value.length }} / 40
                  </span>
                </div>

                <div class="relative">
                  <input
                    id="newNameInput"
                    type="text"
                    formControlName="name"
                    placeholder="مثلاً: صقر الروايات"
                    class="w-full bg-stone-900 border border-white/15 focus:border-rose-500 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-white placeholder-stone-500 focus:outline-none transition-colors pr-10"
                  />
                  <mat-icon class="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 text-base pointer-events-none">
                    badge
                  </mat-icon>
                </div>

                @if (nameForm.controls.name.touched && nameForm.controls.name.invalid) {
                  <span class="text-[11px] text-rose-400 block pt-0.5">
                    يرجى إدخال اسم صحيح بين حرفين و 40 حرفاً.
                  </span>
                }
              </div>

              <!-- Quick Name Suggestions Tags -->
              <div class="space-y-1.5">
                <span class="text-[11px] text-stone-400 block font-sans">اقتراحات ألقاب سريعة:</span>
                <div class="flex flex-wrap gap-1.5">
                  @for (suggest of nameSuggestions; track suggest) {
                    <button
                      type="button"
                      (click)="pickNameSuggestion(suggest)"
                      class="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-rose-950/40 border border-white/5 hover:border-rose-500/30 text-stone-300 hover:text-white text-[11px] transition-colors cursor-pointer"
                    >
                      {{ suggest }}
                    </button>
                  }
                </div>
              </div>

              <!-- Action Buttons -->
              <div class="pt-2 flex items-center gap-3">
                <button
                  type="submit"
                  [disabled]="nameForm.invalid || isSaving()"
                  class="flex-1 py-2.5 px-4 rounded-xl bg-gradient-to-l from-rose-600 to-rose-700 hover:from-rose-500 text-white font-bold text-xs shadow-md transition-all cursor-pointer disabled:opacity-40 flex items-center justify-center gap-1.5 active:scale-98"
                >
                  @if (isSaving()) {
                    <div class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>جاري الحفظ...</span>
                  } @else {
                    <mat-icon class="text-sm">save</mat-icon>
                    <span>حفظ الاسم</span>
                  }
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

      <!-- ========================================================================= -->
      <!-- MODAL 4: CONFIRM CLEAR HISTORY (تأكيد مسح سجل القراءة) -->
      <!-- ========================================================================= -->
      @if (activeModal() === 'clearHistoryConfirm') {
        <div class="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in">
          <button
            type="button"
            aria-label="إغلاق النافذة"
            (click)="closeModal()"
            class="fixed inset-0 w-full h-full bg-transparent border-0 cursor-default"
          ></button>
          <div
            class="relative z-10 w-full max-w-sm liquid-glass bg-stone-950/95 border border-rose-500/40 rounded-3xl p-5 sm:p-6 space-y-4 shadow-2xl my-auto text-center"
          >
            <div class="w-12 h-12 rounded-2xl bg-rose-600/20 text-rose-400 border border-rose-500/30 flex items-center justify-center mx-auto">
              <mat-icon class="text-2xl">delete_sweep</mat-icon>
            </div>

            <div class="space-y-1">
              <h3 class="font-bold text-base font-amiri text-white">مسح سجل القراءة؟</h3>
              <p class="text-xs text-stone-400 leading-relaxed">
                هل أنت متأكد من مسح جميع الفصول التي قرأتها من سجلك؟ لن يؤثر هذا على رواياتك في المفضلة.
              </p>
            </div>

            <div class="pt-2 flex items-center gap-3">
              <button
                type="button"
                (click)="confirmClearHistory()"
                class="flex-1 py-2.5 px-4 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-md transition-all cursor-pointer"
              >
                نعم، مسح السجل
              </button>

              <button
                type="button"
                (click)="closeModal()"
                class="flex-1 py-2.5 px-4 rounded-xl border border-white/10 hover:bg-white/10 text-stone-300 hover:text-white text-xs transition-colors cursor-pointer"
              >
                تراجع
              </button>
            </div>
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
  readonly selectedPresetAvatarUrl = signal<string>('');
  readonly coverUrlInput = signal<string>('');
  readonly toastMessage = signal<string | null>(null);
  readonly isDraggingFile = signal<boolean>(false);

  // Live Circular Preview
  readonly livePreviewUrl = signal<string>('');

  // Circular Cropper Coordinates State
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

  // Name suggestions for reader titles
  readonly nameSuggestions = [
    'صقر الروايات',
    'فارس الحكايات',
    'حكيم المخطوطات',
    'مقاتل الظلال',
    'سيف الأساطير',
    'قارئ النخبة',
  ];

  // 8 Curated Artistic Preset Avatars
  readonly avatarPresets: PresetAvatar[] = [
    { id: 'p1', name: 'المقاتل الناري', url: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?q=80&w=300&auto=format&fit=crop' },
    { id: 'p2', name: 'الفارس النبيل', url: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?q=80&w=300&auto=format&fit=crop' },
    { id: 'p3', name: 'حكيم الروايات', url: 'https://images.unsplash.com/photo-1544717305-2782549b5136?q=80&w=300&auto=format&fit=crop' },
    { id: 'p4', name: 'صقر الشرق', url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=300&auto=format&fit=crop' },
    { id: 'p5', name: 'فارسة الظلال', url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=300&auto=format&fit=crop' },
    { id: 'p6', name: 'سيد الحكمة', url: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?q=80&w=300&auto=format&fit=crop' },
    { id: 'p7', name: 'أمير المعارك', url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=300&auto=format&fit=crop' },
    { id: 'p8', name: 'ساحر المخطوطات', url: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?q=80&w=300&auto=format&fit=crop' },
  ];

  // 6 Curated 1500x800 Epic Cover Wallpapers for Muqatil Al-Riwayat
  readonly coverPresets: PresetWallpaper[] = [
    { id: 'c1', name: 'مكتبة الأساطير الملحمية', url: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=1500&auto=format&fit=crop', category: 'مكتبة' },
    { id: 'c2', name: 'سماء الغسق القرمزي', url: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?q=80&w=1500&auto=format&fit=crop', category: 'غسق' },
    { id: 'c3', name: 'قصر المحاربين العتيق', url: 'https://images.unsplash.com/photo-1514565131-fce0801e5785?q=80&w=1500&auto=format&fit=crop', category: 'قصر' },
    { id: 'c4', name: 'محراب الكتب العتيق', url: 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?q=80&w=1500&auto=format&fit=crop', category: 'محراب' },
    { id: 'c5', name: 'معبد شعلة التنين', url: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?q=80&w=1500&auto=format&fit=crop', category: 'معبد' },
    { id: 'c6', name: 'غابة الأرواح الملحمية', url: 'https://images.unsplash.com/photo-1448375240586-882707db888b?q=80&w=1500&auto=format&fit=crop', category: 'طبيعة' },
  ];

  // Reader rank computation based on total chapters read
  readerRank(): string {
    const count = this.novelStore.totalChaptersReadCount();
    if (count >= 100) return 'أسطورة الروايات الملحمية';
    if (count >= 50) return 'حكيم المخطوطات';
    if (count >= 25) return 'مقاتل الفصول';
    if (count >= 10) return 'فارس الحكايات';
    if (count >= 3) return 'متدرب الروايات';
    return 'قارئ مبتدئ';
  }

  // Keyboard shortcut listener to close modals
  @HostListener('window:keydown.escape')
  onEscapeKey(): void {
    if (this.activeModal()) {
      this.closeModal();
    }
  }

  openModal(type: ProfileModal): void {
    this.activeModal.set(type);

    if (type === 'editName') {
      this.nameForm.setValue({ name: this.authStore.displayName() });
    }

    if (type === 'changeCover') {
      this.selectedCoverPreview.set(this.authStore.coverURL());
    }

    if (type === 'cropAvatar') {
      this.initCropCanvasWithCurrentAvatar();
    }
  }

  closeModal(): void {
    this.activeModal.set(null);
  }

  showToast(msg: string): void {
    this.toastMessage.set(msg);
    setTimeout(() => this.toastMessage.set(null), 3500);
  }

  onCoverError(event: Event): void {
    const img = event.target as HTMLImageElement;
    img.src = this.coverPresets[0].url;
  }

  removeBookmark(novelId: string): void {
    this.novelStore.toggleBookmark(novelId);
    this.showToast('تمت إزالة الرواية من المفضلة.');
  }

  confirmClearHistory(): void {
    this.novelStore.clearReadHistory();
    this.closeModal();
    this.showToast('تم مسح سجل القراءة بنجاح.');
  }

  pickNameSuggestion(name: string): void {
    this.nameForm.setValue({ name });
  }

  async onLogout(): Promise<void> {
    await this.authStore.logout();
    this.showToast('تم تسجيل الخروج بنجاح.');
    this.router.navigate(['/']);
  }

  // Drag and drop event handlers
  onDragOver(event: DragEvent): void {
    event.preventDefault();
    this.isDraggingFile.set(true);
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    this.isDraggingFile.set(false);
  }

  onFileDrop(event: DragEvent, type: 'avatar' | 'cover'): void {
    event.preventDefault();
    this.isDraggingFile.set(false);
    if (!event.dataTransfer?.files || event.dataTransfer.files.length === 0) return;
    const file = event.dataTransfer.files[0];
    if (type === 'avatar') {
      this.loadAvatarFromFile(file);
    } else {
      this.loadCoverFromFile(file);
    }
  }

  // --- CIRCULAR CROPPER IMPLEMENTATION ---

  private initCropCanvasWithCurrentAvatar(): void {
    const currentUrl = this.authStore.photoURL() || this.avatarPresets[0].url;
    this.loadImageForCropper(currentUrl);
  }

  private loadImageForCropper(url: string): void {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      this.cropperImage.set(img);
      this.panX.set(0);
      this.panY.set(0);
      this.zoomScale.set(1.0);
      setTimeout(() => this.redrawCanvas(), 30);
    };
    img.src = url;
  }

  onAvatarFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;
    this.loadAvatarFromFile(input.files[0]);
  }

  private loadAvatarFromFile(file: File): void {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        this.cropperImage.set(img);
        this.panX.set(0);
        this.panY.set(0);
        this.zoomScale.set(1.0);
        setTimeout(() => this.redrawCanvas(), 30);
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  }

  selectPresetAvatar(url: string): void {
    this.selectedPresetAvatarUrl.set(url);
    this.loadImageForCropper(url);
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

  setExactZoom(level: number): void {
    this.zoomScale.set(level);
    this.redrawCanvas();
  }

  resetCropPosition(): void {
    this.panX.set(0);
    this.panY.set(0);
    this.zoomScale.set(1.0);
    this.redrawCanvas();
  }

  onCanvasWheel(event: WheelEvent): void {
    event.preventDefault();
    const delta = event.deltaY < 0 ? 0.08 : -0.08;
    this.adjustZoom(delta);
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

    // Update live preview thumbnail in real time
    this.updateLivePreview(canvas);
  }

  private updateLivePreview(sourceCanvas: HTMLCanvasElement): void {
    try {
      const previewCanvas = document.createElement('canvas');
      previewCanvas.width = 120;
      previewCanvas.height = 120;
      const pCtx = previewCanvas.getContext('2d');
      if (pCtx) {
        pCtx.beginPath();
        pCtx.arc(60, 60, 60, 0, Math.PI * 2);
        pCtx.closePath();
        pCtx.clip();
        // The circular mask guide is centered inside the 240px canvas with diameter 192px (w-48 = 192px, offset 24px)
        pCtx.drawImage(sourceCanvas, 24, 24, 192, 192, 0, 0, 120, 120);
        this.livePreviewUrl.set(previewCanvas.toDataURL('image/png', 0.8));
      }
    } catch {
      // ignore
    }
  }

  async applyCircularCrop(): Promise<void> {
    const canvas = this.cropCanvasRef?.nativeElement;
    if (!canvas) return;

    this.isSaving.set(true);

    try {
      // Create a 200x200 circular cropped output canvas (optimized size ~35KB)
      const outputCanvas = document.createElement('canvas');
      outputCanvas.width = 200;
      outputCanvas.height = 200;
      const ctx = outputCanvas.getContext('2d');

      if (ctx) {
        ctx.beginPath();
        ctx.arc(100, 100, 100, 0, Math.PI * 2, true);
        ctx.closePath();
        ctx.clip();

        // Copy centered 192px circular guide area to 200x200 canvas
        ctx.drawImage(canvas, 24, 24, 192, 192, 0, 0, 200, 200);
        const croppedDataUrl = outputCanvas.toDataURL('image/png', 0.85);

        // Update profile in store & Firestore
        await this.authStore.updateProfileData({ photoURL: croppedDataUrl });
        this.closeModal();
        this.showToast('تم حفظ وقص الأيقونة الشخصية بنجاح!');
      }
    } catch (e) {
      console.error('Circular crop failed:', e);
      this.showToast('حدث خطأ أثناء قص الصورة.');
    } finally {
      this.isSaving.set(false);
    }
  }

  // --- COVER BANNER IMPLEMENTATION (1500x800) ---

  selectPresetCover(url: string): void {
    this.selectedCoverPreview.set(url);
  }

  onCoverUrlInput(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.coverUrlInput.set(target.value);
  }

  applyCoverFromUrl(): void {
    const url = this.coverUrlInput().trim();
    if (url) {
      this.selectedCoverPreview.set(url);
    }
  }

  async onCoverFileSelected(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;
    await this.loadCoverFromFile(input.files[0]);
  }

  private async loadCoverFromFile(file: File): Promise<void> {
    try {
      const compressedDataUrl = await this.compressImageTo1500x800(file);
      this.selectedCoverPreview.set(compressedDataUrl);
    } catch {
      this.showToast('تعذر معالجة صورة الغلاف.');
    }
  }

  // Client-side image compressor: fits to max 1500x800 and compresses cleanly (~120KB)
  private compressImageTo1500x800(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const maxW = 1500;
          const maxH = 800;
          let w = img.width;
          let h = img.height;

          if (w > maxW || h > maxH) {
            const ratio = Math.min(maxW / w, maxH / h);
            w = Math.round(w * ratio);
            h = Math.round(h * ratio);
          }

          const canvas = document.createElement('canvas');
          canvas.width = w;
          canvas.height = h;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            resolve(e.target?.result as string);
            return;
          }
          ctx.drawImage(img, 0, 0, w, h);
          resolve(canvas.toDataURL('image/jpeg', 0.85));
        };
        img.onerror = reject;
        img.src = e.target?.result as string;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  async saveSelectedCover(): Promise<void> {
    this.isSaving.set(true);
    try {
      await this.authStore.updateProfileData({ coverURL: this.selectedCoverPreview() });
      this.closeModal();
      this.showToast('تم اعتماد وتحديث الغلاف الخلفي بنجاح!');
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
      this.showToast('تم تحديث الاسم المستعار بنجاح!');
    } finally {
      this.isSaving.set(false);
    }
  }

  formatTimeAgo(isoString: string): string {
    if (!isoString) return 'الآن';
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
