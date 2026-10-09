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

type ProfileTab = 'history' | 'favorites' | 'settings';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-user-profile',
  imports: [RouterLink, MatIconModule, ReactiveFormsModule],
  template: `
    <div class="min-h-screen pb-24 text-stone-100 overflow-x-hidden selection:bg-rose-500/30 bg-stone-950">

      <!-- Hidden File Inputs (مباشرة لرفع الصور من الجهاز بدون نوافذ وسيطة) -->
      <input
        type="file"
        accept="image/*"
        class="hidden"
        #avatarFileInput
        (change)="onAvatarFileSelected($event)"
      />
      <input
        type="file"
        accept="image/*"
        class="hidden"
        #coverFileInput
        (change)="onCoverFileSelected($event)"
      />

      <!-- ========================================================================= -->
      <!-- GUEST NOTICE (تنبيه لطيف للزائر) -->
      <!-- ========================================================================= -->
      @if (!authStore.isAuthenticated()) {
        <div class="w-full bg-amber-950/60 border-b border-amber-500/30 px-4 py-2.5 text-xs text-amber-200">
          <div class="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-center sm:text-right">
            <div class="flex items-center gap-2">
              <mat-icon class="text-amber-400 text-sm">info</mat-icon>
              <span>أنت تتصفح كزائر — التعديلات تُحفظ على جهازك. سجّل الدخول لحفظها بشكل دائم في السحابة.</span>
            </div>
            <a
              routerLink="/login"
              class="px-3 py-1 rounded-lg bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs shrink-0 transition-colors inline-flex items-center gap-1 cursor-pointer"
            >
              <mat-icon class="text-xs">login</mat-icon>
              <span>تسجيل الدخول</span>
            </a>
          </div>
        </div>
      }

      <!-- ========================================================================= -->
      <!-- 1. FULL-BLEED COVER BANNER (غلاف خلفي بلا حواف لحدود الشاشة وبتظليل خفيف) -->
      <!-- ========================================================================= -->
      <section class="relative w-full h-52 sm:h-72 md:h-80 lg:h-96 overflow-hidden bg-stone-900 select-none">
        <!-- Cover Image (ملء كامل للشاشة من الحافة للحافة) -->
        <img
          [src]="authStore.coverURL()"
          alt="غلاف الملف الشخصي"
          referrerpolicy="no-referrer"
          class="w-full h-full object-cover object-center"
          (error)="onCoverError($event)"
        />

        <!-- تظليل خفيف ناعم يدمج الغلاف بسلاسة مع خلفية الصفحة الداكنة ليعملهم كجزء واحد -->
        <div class="absolute inset-x-0 bottom-0 h-32 sm:h-40 bg-gradient-to-t from-stone-950 via-stone-950/40 to-transparent pointer-events-none"></div>

        <!-- زر وحيد وأنيق لتغيير الغلاف مباشرة من الجهاز -->
        <div class="absolute top-4 left-4 z-20">
          <button
            type="button"
            (click)="coverFileInput.click()"
            class="px-3 py-2 rounded-xl bg-black/60 hover:bg-black/85 text-white border border-white/20 hover:border-rose-500/50 text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-all backdrop-blur-md shadow-lg active:scale-95"
            title="اختيار غلاف جديد من جهازك"
          >
            <mat-icon class="text-base text-rose-400">photo_camera</mat-icon>
            <span class="hidden sm:inline">تغيير الغلاف</span>
          </button>
        </div>
      </section>

      <!-- ========================================================================= -->
      <!-- 2. PROFILE HEADER (الأيقونة الشخصية + الاسم + الترتيب الذكي) -->
      <!-- ========================================================================= -->
      <div class="max-w-5xl mx-auto px-4 sm:px-6 relative z-30">
        <div class="flex flex-col md:flex-row items-center md:items-end justify-between gap-6 -mt-16 sm:-mt-20 pb-6 border-b border-white/10">

          <!-- Avatar & Details -->
          <div class="flex flex-col sm:flex-row items-center sm:items-end gap-5 text-center sm:text-right">

            <!-- Circular Avatar with direct local upload trigger -->
            <div class="relative group/avatar shrink-0">
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

              <!-- زر الكاميرا على الأيقونة لرفع صورة من الجهاز مباشرة وفتح نافذة القص -->
              <button
                type="button"
                (click)="avatarFileInput.click()"
                class="absolute bottom-1 left-1 w-9 h-9 rounded-full bg-rose-600 hover:bg-rose-500 text-white border-2 border-stone-950 shadow-lg flex items-center justify-center cursor-pointer transition-all hover:scale-105 active:scale-95"
                title="تغيير الأيقونة من جهازك"
              >
                <mat-icon class="text-base">photo_camera</mat-icon>
              </button>
            </div>

            <!-- Username & Rank -->
            <div class="space-y-1 pb-1">
              <div class="flex flex-wrap items-center justify-center sm:justify-start gap-2.5">
                <h1 class="text-2xl sm:text-3xl font-extrabold font-amiri text-white tracking-wide">
                  {{ authStore.displayName() || 'قارئ مقاتل' }}
                </h1>

                <span class="px-2.5 py-0.5 rounded-full bg-rose-600/20 border border-rose-500/40 text-rose-300 text-[11px] font-bold flex items-center gap-1 shadow-sm">
                  <mat-icon class="text-xs">military_tech</mat-icon>
                  <span>{{ readerRank() }}</span>
                </span>
              </div>

              @if (authStore.userEmail()) {
                <div class="text-xs text-stone-400 font-mono">
                  {{ authStore.userEmail() }}
                </div>
              }
            </div>

          </div>

          <!-- Profile Actions (بدون أزرار مكررة: فقط التبديل للإعدادات أو تسجيل الخروج) -->
          <div class="flex items-center gap-2.5">
            <button
              type="button"
              (click)="setTab('settings')"
              [class.bg-white/15]="activeTab() === 'settings'"
              class="px-4 py-2.5 rounded-xl liquid-glass border border-white/10 hover:border-rose-500/40 text-stone-200 hover:text-white text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 active:scale-95"
            >
              <mat-icon class="text-base text-rose-400">tune</mat-icon>
              <span>إعدادات الحساب</span>
            </button>

            @if (authStore.isAuthenticated()) {
              <button
                type="button"
                (click)="onLogout()"
                class="px-3.5 py-2.5 rounded-xl bg-rose-950/40 hover:bg-rose-900/60 border border-rose-500/30 text-rose-300 hover:text-rose-100 text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 active:scale-95"
                title="تسجيل الخروج من الحساب"
              >
                <mat-icon class="text-base">logout</mat-icon>
                <span>خروج</span>
              </button>
            } @else {
              <a
                routerLink="/login"
                class="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-md active:scale-95"
              >
                <mat-icon class="text-base">login</mat-icon>
                <span>تسجيل الدخول</span>
              </a>
            }
          </div>

        </div>

        <!-- ========================================================================= -->
        <!-- 3. STATS STRIP (إحصائيات واضحة ومختصرة) -->
        <!-- ========================================================================= -->
        <div class="grid grid-cols-3 gap-3 sm:gap-4 py-6">
          <div class="p-3.5 sm:p-4 rounded-2xl liquid-glass-card border border-white/10 text-center space-y-0.5">
            <span class="text-2xl sm:text-3xl font-black font-mono text-rose-400 block">
              {{ novelStore.totalChaptersReadCount() }}
            </span>
            <span class="text-[11px] sm:text-xs text-stone-400">فصول مقروءة</span>
          </div>

          <div class="p-3.5 sm:p-4 rounded-2xl liquid-glass-card border border-white/10 text-center space-y-0.5">
            <span class="text-2xl sm:text-3xl font-black font-mono text-amber-400 block">
              {{ novelStore.bookmarkedNovels().length }}
            </span>
            <span class="text-[11px] sm:text-xs text-stone-400">روايات بالمفضلة</span>
          </div>

          <div class="p-3.5 sm:p-4 rounded-2xl liquid-glass-card border border-white/10 text-center space-y-0.5">
            <span class="text-2xl sm:text-3xl font-black font-mono text-emerald-400 block">
              {{ novelStore.novels().length }}
            </span>
            <span class="text-[11px] sm:text-xs text-stone-400">روايات بالمكتبة</span>
          </div>
        </div>

        <!-- ========================================================================= -->
        <!-- 4. SMART TABS BAR (توزيع ذكي ومرتب للمحتوى بتبويبات سريعة) -->
        <!-- ========================================================================= -->
        <div class="flex items-center gap-2 border-b border-white/10 mb-8 overflow-x-auto pb-1 scrollbar-none">
          <button
            type="button"
            (click)="setTab('history')"
            class="px-4 py-2.5 rounded-t-xl text-xs sm:text-sm font-bold flex items-center gap-2 cursor-pointer transition-all border-b-2"
            [class]="activeTab() === 'history' ? 'border-rose-500 text-rose-400 bg-white/5' : 'border-transparent text-stone-400 hover:text-stone-200'"
          >
            <mat-icon class="text-base">auto_stories</mat-icon>
            <span>آخر الفصول التي قرأتها</span>
            <span class="px-1.5 py-0.2 rounded-full text-[10px] bg-white/10 text-stone-300 font-mono">
              {{ novelStore.readHistory().length }}
            </span>
          </button>

          <button
            type="button"
            (click)="setTab('favorites')"
            class="px-4 py-2.5 rounded-t-xl text-xs sm:text-sm font-bold flex items-center gap-2 cursor-pointer transition-all border-b-2"
            [class]="activeTab() === 'favorites' ? 'border-rose-500 text-rose-400 bg-white/5' : 'border-transparent text-stone-400 hover:text-stone-200'"
          >
            <mat-icon class="text-base">bookmarks</mat-icon>
            <span>المفضلة</span>
            <span class="px-1.5 py-0.2 rounded-full text-[10px] bg-white/10 text-stone-300 font-mono">
              {{ novelStore.bookmarkedNovels().length }}
            </span>
          </button>

          <button
            type="button"
            (click)="setTab('settings')"
            class="px-4 py-2.5 rounded-t-xl text-xs sm:text-sm font-bold flex items-center gap-2 cursor-pointer transition-all border-b-2"
            [class]="activeTab() === 'settings' ? 'border-rose-500 text-rose-400 bg-white/5' : 'border-transparent text-stone-400 hover:text-stone-200'"
          >
            <mat-icon class="text-base">settings</mat-icon>
            <span>إعدادات الحساب</span>
          </button>
        </div>

        <!-- ========================================================================= -->
        <!-- TAB 1: READING HISTORY (آخر الفصول المقروءة) -->
        <!-- ========================================================================= -->
        @if (activeTab() === 'history') {
          <div class="space-y-4">
            <div class="flex items-center justify-between pb-2">
              <h2 class="text-base font-bold font-amiri text-white flex items-center gap-2">
                <div class="w-2 h-4 rounded-full bg-rose-500"></div>
                <span>سجل القراءة الحديث</span>
              </h2>

              @if (novelStore.readHistory().length > 0) {
                <button
                  type="button"
                  (click)="clearHistory()"
                  class="text-xs text-rose-400 hover:text-rose-300 hover:underline cursor-pointer flex items-center gap-1"
                >
                  <mat-icon class="text-xs">delete_sweep</mat-icon>
                  <span>مسح السجل</span>
                </button>
              }
            </div>

            @if (novelStore.readHistory().length > 0) {
              <div class="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                @for (item of novelStore.readHistory(); track item.chapterId) {
                  <div class="p-4 rounded-2xl liquid-glass border border-white/10 hover:border-rose-500/30 flex items-center justify-between gap-3 transition-all">
                    <div class="flex items-center gap-3 min-w-0">
                      <div [class]="'w-12 h-16 rounded-xl bg-gradient-to-br ' + (item.novelCoverGradient || 'from-rose-600 to-stone-900') + ' shrink-0 overflow-hidden relative border border-white/10 shadow-sm flex items-center justify-center'">
                        <mat-icon class="text-white/40 text-lg">auto_stories</mat-icon>
                      </div>
                      <div class="min-w-0 space-y-0.5">
                        <span class="text-xs text-rose-400 font-semibold block truncate">
                          {{ item.novelTitle }}
                        </span>
                        <h4 class="text-sm font-bold text-white truncate font-amiri">
                          {{ item.chapterTitle }}
                        </h4>
                        <span class="text-[11px] text-stone-400 flex items-center gap-1">
                          <mat-icon class="text-xs">schedule</mat-icon>
                          <span>{{ formatTimeAgo(item.readAt) }}</span>
                        </span>
                      </div>
                    </div>

                    <a
                      [routerLink]="['/reader', item.novelId, item.chapterId]"
                      class="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shrink-0 flex items-center gap-1 transition-colors cursor-pointer shadow-sm"
                    >
                      <span>متابعة</span>
                      <mat-icon class="text-xs">arrow_back</mat-icon>
                    </a>
                  </div>
                }
              </div>
            } @else {
              <div class="p-12 rounded-2xl liquid-glass border border-white/5 text-center space-y-3">
                <mat-icon class="text-4xl text-stone-500">menu_book</mat-icon>
                <p class="text-xs sm:text-sm text-stone-400">لم تقرأ أي فصول بعد. تصفح المكتبة وابدأ مغامرتك الآن!</p>
                <a
                  routerLink="/"
                  class="inline-flex items-center gap-1 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition-colors cursor-pointer shadow-md"
                >
                  <span>استكشاف الروايات</span>
                  <mat-icon class="text-xs">explore</mat-icon>
                </a>
              </div>
            }
          </div>
        }

        <!-- ========================================================================= -->
        <!-- TAB 2: FAVORITES (المفضلة) -->
        <!-- ========================================================================= -->
        @if (activeTab() === 'favorites') {
          <div class="space-y-4">
            <div class="flex items-center justify-between pb-2">
              <h2 class="text-base font-bold font-amiri text-white flex items-center gap-2">
                <div class="w-2 h-4 rounded-full bg-rose-500"></div>
                <span>الروايات المحفوظة في المفضلة</span>
              </h2>
            </div>

            @if (novelStore.bookmarkedNovels().length > 0) {
              <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3.5">
                @for (novel of novelStore.bookmarkedNovels(); track novel.id) {
                  <div class="rounded-2xl liquid-glass border border-white/10 overflow-hidden flex flex-col group transition-all hover:border-rose-500/40">
                    <a [routerLink]="['/novel', novel.id]" class="relative aspect-[3/4] block overflow-hidden">
                      @if (novel.coverImage) {
                        <img
                          [src]="novel.coverImage"
                          [alt]="novel.title"
                          class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      } @else {
                        <div [class]="'w-full h-full bg-gradient-to-br ' + novel.coverGradient + ' flex items-center justify-center p-3 text-center'">
                          <span class="font-amiri font-bold text-sm text-white drop-shadow">{{ novel.title }}</span>
                        </div>
                      }
                      <div class="absolute inset-0 bg-gradient-to-t from-stone-950 via-transparent to-transparent"></div>
                      <span class="absolute bottom-2 right-2 text-[10px] px-2 py-0.5 rounded-md bg-black/70 text-rose-300 font-bold border border-white/10">
                        {{ novel.category }}
                      </span>
                    </a>

                    <div class="p-3 flex-1 flex flex-col justify-between gap-2">
                      <a [routerLink]="['/novel', novel.id]" class="font-amiri font-bold text-xs sm:text-sm text-white line-clamp-1 hover:text-rose-400 transition-colors">
                        {{ novel.title }}
                      </a>

                      <div class="flex items-center justify-between pt-1 border-t border-white/5">
                        <span class="text-[11px] text-stone-400 font-mono">
                          {{ novel.chapters.length }} فصل
                        </span>
                        <button
                          type="button"
                          (click)="removeBookmark(novel.id)"
                          class="p-1 rounded-lg text-stone-400 hover:text-rose-400 hover:bg-white/10 transition-colors cursor-pointer"
                          title="إزالة من المفضلة"
                        >
                          <mat-icon class="text-sm">bookmark_remove</mat-icon>
                        </button>
                      </div>
                    </div>
                  </div>
                }
              </div>
            } @else {
              <div class="p-12 rounded-2xl liquid-glass border border-white/5 text-center space-y-3">
                <mat-icon class="text-4xl text-stone-500">bookmark_border</mat-icon>
                <p class="text-xs sm:text-sm text-stone-400">لا توجد روايات في المفضلة. يمكنك إضافة أي رواية بنقرة واحدة من صفحة الرواية!</p>
              </div>
            }
          </div>
        }

        <!-- ========================================================================= -->
        <!-- TAB 3: ACCOUNT SETTINGS (إعدادات الحساب بتصميم ذكي ومرتب بدون حشو) -->
        <!-- ========================================================================= -->
        @if (activeTab() === 'settings') {
          <div class="max-w-2xl mx-auto space-y-6">

            <!-- Card 1: Change Display Name -->
            <div class="p-5 rounded-2xl liquid-glass border border-white/10 space-y-4">
              <div class="flex items-center justify-between border-b border-white/10 pb-3">
                <div class="flex items-center gap-2">
                  <mat-icon class="text-rose-400 text-lg">badge</mat-icon>
                  <h3 class="font-bold text-sm text-white font-amiri">تعديل الاسم المستعار</h3>
                </div>
                <span class="text-[11px] text-stone-400">يظهر في تعليقات الفصول</span>
              </div>

              <form [formGroup]="nameForm" (ngSubmit)="saveDisplayName()" class="space-y-3">
                <div class="flex gap-2">
                  <input
                    type="text"
                    formControlName="name"
                    placeholder="اكتب اسمك المستعار الجديد..."
                    class="flex-1 bg-stone-900 border border-white/15 focus:border-rose-500 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-white placeholder-stone-500 focus:outline-none transition-colors"
                  />
                  <button
                    type="submit"
                    [disabled]="nameForm.invalid || isSaving()"
                    class="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shrink-0 disabled:opacity-40 transition-colors cursor-pointer"
                  >
                    @if (isSaving()) {
                      <span>جاري الحفظ...</span>
                    } @else {
                      <span>حفظ الاسم</span>
                    }
                  </button>
                </div>
              </form>
            </div>

            <!-- Card 2: Change Avatar & Cover (Direct file picker triggers) -->
            <div class="p-5 rounded-2xl liquid-glass border border-white/10 space-y-4">
              <div class="flex items-center justify-between border-b border-white/10 pb-3">
                <div class="flex items-center gap-2">
                  <mat-icon class="text-rose-400 text-lg">image</mat-icon>
                  <h3 class="font-bold text-sm text-white font-amiri">الصور والمظهر</h3>
                </div>
                <span class="text-[11px] text-stone-400">رفع مباشر من جهازك</span>
              </div>

              <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <!-- Avatar Upload Button -->
                <button
                  type="button"
                  (click)="avatarFileInput.click()"
                  class="p-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-rose-500/40 text-right space-y-2 transition-all cursor-pointer group"
                >
                  <div class="flex items-center justify-between">
                    <mat-icon class="text-rose-400">account_circle</mat-icon>
                    <span class="text-[10px] text-rose-300 px-2 py-0.5 rounded-md bg-rose-950/60 border border-rose-500/30">قص دائري</span>
                  </div>
                  <h4 class="text-sm font-bold text-white font-amiri group-hover:text-rose-300">تغيير الصورة الشخصية</h4>
                  <p class="text-[11px] text-stone-400">اختر صورة من جهازك لقصها يدوياً بشكل دائري.</p>
                </button>

                <!-- Cover Upload Button -->
                <button
                  type="button"
                  (click)="coverFileInput.click()"
                  class="p-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-rose-500/40 text-right space-y-2 transition-all cursor-pointer group"
                >
                  <div class="flex items-center justify-between">
                    <mat-icon class="text-rose-400">wallpaper</mat-icon>
                    <span class="text-[10px] text-rose-300 px-2 py-0.5 rounded-md bg-rose-950/60 border border-rose-500/30">1500 × 800</span>
                  </div>
                  <h4 class="text-sm font-bold text-white font-amiri group-hover:text-rose-300">تغيير الغلاف الخلفي</h4>
                  <p class="text-[11px] text-stone-400">اختر صورة غلاف من جهازك تُدمج تلقائياً مع خلفية الموقع.</p>
                </button>
              </div>
            </div>

            <!-- Card 3: Account Information & Logout -->
            <div class="p-5 rounded-2xl liquid-glass border border-white/10 space-y-4">
              <div class="flex items-center justify-between border-b border-white/10 pb-3">
                <div class="flex items-center gap-2">
                  <mat-icon class="text-rose-400 text-lg">manage_accounts</mat-icon>
                  <h3 class="font-bold text-sm text-white font-amiri">معلومات الحساب</h3>
                </div>
              </div>

              <div class="space-y-2 text-xs text-stone-300">
                <div class="flex items-center justify-between py-1 border-b border-white/5">
                  <span class="text-stone-400">البريد الإلكتروني:</span>
                  <span class="font-mono text-white">{{ authStore.userEmail() || 'زائر غير مسجل' }}</span>
                </div>
                <div class="flex items-center justify-between py-1 border-b border-white/5">
                  <span class="text-stone-400">المزامنة السحابية:</span>
                  <span class="text-emerald-400 font-bold">{{ authStore.isAuthenticated() ? 'مفعّلة سحابياً' : 'محلية على جهازك' }}</span>
                </div>
              </div>

              <div class="pt-2">
                @if (authStore.isAuthenticated()) {
                  <button
                    type="button"
                    (click)="onLogout()"
                    class="w-full py-2.5 rounded-xl bg-rose-950/60 hover:bg-rose-900 border border-rose-500/30 text-rose-300 font-bold text-xs transition-colors cursor-pointer flex items-center justify-center gap-2"
                  >
                    <mat-icon class="text-base">logout</mat-icon>
                    <span>تسجيل الخروج من الحساب</span>
                  </button>
                } @else {
                  <a
                    routerLink="/login"
                    class="w-full py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs transition-colors cursor-pointer flex items-center justify-center gap-2"
                  >
                    <mat-icon class="text-base">login</mat-icon>
                    <span>تسجيل الدخول / إنشاء حساب جديد</span>
                  </a>
                }
              </div>
            </div>

          </div>
        }

      </div>

      <!-- ========================================================================= -->
      <!-- TOAST FEEDBACK NOTIFICATION -->
      <!-- ========================================================================= -->
      @if (toastMessage()) {
        <div class="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-2xl bg-stone-900/95 border border-rose-500/50 text-white text-xs font-bold shadow-2xl flex items-center gap-2.5 backdrop-blur-xl">
          <mat-icon class="text-rose-400 text-base">check_circle</mat-icon>
          <span>{{ toastMessage() }}</span>
        </div>
      }

      <!-- ========================================================================= -->
      <!-- ONLY MODAL: CLEAN CIRCULAR AVATAR CROPPER (فقط القص وخلاص تم بدون أي حشو) -->
      <!-- ========================================================================= -->
      @if (isCropModalOpen()) {
        <div class="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <button
            type="button"
            aria-label="إغلاق النافذة"
            (click)="closeCropModal()"
            class="fixed inset-0 w-full h-full bg-transparent border-0 cursor-default"
          ></button>

          <div
            class="relative z-10 w-full max-w-sm liquid-glass bg-stone-950/98 border border-rose-500/40 rounded-3xl p-5 sm:p-6 space-y-4 shadow-2xl my-auto"
          >
            <!-- Header -->
            <div class="flex items-center justify-between border-b border-white/10 pb-3">
              <div class="flex items-center gap-2">
                <mat-icon class="text-rose-400 text-lg">crop</mat-icon>
                <h3 class="font-bold text-base font-amiri text-white">قص الصورة الشخصية</h3>
              </div>

              <button
                type="button"
                (click)="closeCropModal()"
                class="w-7 h-7 rounded-lg liquid-glass flex items-center justify-center text-stone-400 hover:text-white cursor-pointer"
              >
                <mat-icon class="text-base">close</mat-icon>
              </button>
            </div>

            <p class="text-[11px] text-stone-400 text-center">
              حرّك واسحب الصورة، وتحكم بالتكبير لاختيار الجزء الدائري المطلوب.
            </p>

            <!-- INTERACTIVE CROP CANVAS (with mouse/touch drag and wheel zoom) -->
            <div
              class="relative w-64 h-64 mx-auto rounded-3xl overflow-hidden border-2 border-rose-500/50 bg-black flex items-center justify-center select-none cursor-move shrink-0 shadow-inner"
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

              <!-- CIRCULAR MASK OVERLAY -->
              <div class="absolute inset-0 pointer-events-none flex items-center justify-center">
                <div class="w-48 h-48 rounded-full border-2 border-dashed border-rose-400 shadow-[0_0_0_9999px_rgba(0,0,0,0.65)]"></div>
              </div>
            </div>

            <!-- ZOOM SLIDER & RESET -->
            <div class="space-y-2 pt-1">
              <div class="flex items-center justify-between text-xs text-stone-300">
                <span class="flex items-center gap-1 text-[11px]">
                  <mat-icon class="text-xs text-rose-400">zoom_in</mat-icon>
                  <span>التكبير:</span>
                </span>
                <button
                  type="button"
                  (click)="resetCropPosition()"
                  class="text-[11px] text-rose-400 hover:underline cursor-pointer"
                >
                  إعادة ضبط
                </button>
              </div>

              <div class="flex items-center gap-2">
                <button
                  type="button"
                  (click)="adjustZoom(-0.1)"
                  class="w-7 h-7 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center text-white cursor-pointer font-bold text-sm"
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
                  class="flex-1 accent-rose-500 cursor-pointer h-1.5 bg-stone-800 rounded-lg"
                />
                <button
                  type="button"
                  (click)="adjustZoom(0.1)"
                  class="w-7 h-7 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center text-white cursor-pointer font-bold text-sm"
                >
                  +
                </button>
              </div>
            </div>

            <!-- ACTION BUTTONS: قص وحفظ وخلاص تم -->
            <div class="pt-2 flex items-center gap-2.5">
              <button
                type="button"
                (click)="applyCircularCrop()"
                [disabled]="isSaving()"
                class="flex-1 py-3 px-4 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-lg shadow-rose-950/50 flex items-center justify-center gap-1.5 cursor-pointer transition-all disabled:opacity-40 active:scale-98"
              >
                @if (isSaving()) {
                  <div class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>جاري الحفظ...</span>
                } @else {
                  <mat-icon class="text-base">check</mat-icon>
                  <span>قص وحفظ</span>
                }
              </button>

              <button
                type="button"
                (click)="closeCropModal()"
                class="py-3 px-4 rounded-xl border border-white/10 hover:bg-white/10 text-stone-400 hover:text-white text-xs transition-colors cursor-pointer"
              >
                إلغاء
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

  readonly activeTab = signal<ProfileTab>('history');
  readonly isCropModalOpen = signal<boolean>(false);
  readonly isSaving = signal<boolean>(false);
  readonly toastMessage = signal<string | null>(null);

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

  constructor() {
    this.nameForm.setValue({ name: this.authStore.displayName() });
  }

  setTab(tab: ProfileTab): void {
    this.activeTab.set(tab);
    if (tab === 'settings') {
      this.nameForm.setValue({ name: this.authStore.displayName() });
    }
  }

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

  @HostListener('window:keydown.escape')
  onEscapeKey(): void {
    if (this.isCropModalOpen()) {
      this.closeCropModal();
    }
  }

  showToast(msg: string): void {
    this.toastMessage.set(msg);
    setTimeout(() => this.toastMessage.set(null), 3500);
  }

  onCoverError(event: Event): void {
    const img = event.target as HTMLImageElement;
    img.src = 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=1500&auto=format&fit=crop';
  }

  removeBookmark(novelId: string): void {
    this.novelStore.toggleBookmark(novelId);
    this.showToast('تمت إزالة الرواية من المفضلة.');
  }

  clearHistory(): void {
    this.novelStore.clearReadHistory();
    this.showToast('تم مسح سجل القراءة.');
  }

  async onLogout(): Promise<void> {
    await this.authStore.logout();
    this.showToast('تم تسجيل الخروج بنجاح.');
    this.router.navigate(['/']);
  }

  // --- LOCAL AVATAR FILE UPLOAD & CROP (مباشرة يفتح نافذة القص البسيطة) ---

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
        this.isCropModalOpen.set(true);
        setTimeout(() => this.redrawCanvas(), 50);
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);

    // Reset input so re-selecting same file triggers change
    input.value = '';
  }

  closeCropModal(): void {
    this.isCropModalOpen.set(false);
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
      // 200x200 circular clipped output
      const outputCanvas = document.createElement('canvas');
      outputCanvas.width = 200;
      outputCanvas.height = 200;
      const ctx = outputCanvas.getContext('2d');

      if (ctx) {
        ctx.beginPath();
        ctx.arc(100, 100, 100, 0, Math.PI * 2, true);
        ctx.closePath();
        ctx.clip();

        // 192px centered circular guide within 240px canvas
        ctx.drawImage(canvas, 24, 24, 192, 192, 0, 0, 200, 200);
        const croppedDataUrl = outputCanvas.toDataURL('image/png', 0.85);

        await this.authStore.updateProfileData({ photoURL: croppedDataUrl });
        this.closeCropModal();
        this.showToast('تم حفظ وقص الأيقونة الشخصية بنجاح!');
      }
    } catch (e) {
      console.error('Circular crop failed:', e);
      this.showToast('حدث خطأ أثناء قص الصورة.');
    } finally {
      this.isSaving.set(false);
    }
  }

  // --- LOCAL COVER UPLOAD (مباشرة من الجهاز وتُحفظ بدون نوافذ وسيطة) ---

  async onCoverFileSelected(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;
    const file = input.files[0];

    this.isSaving.set(true);
    this.showToast('جاري معالجة وحفظ الغلاف...');

    try {
      const compressedDataUrl = await this.compressImageTo1500x800(file);
      await this.authStore.updateProfileData({ coverURL: compressedDataUrl });
      this.showToast('تم تحديث الغلاف بنجاح!');
    } catch {
      this.showToast('تعذر معالجة صورة الغلاف.');
    } finally {
      this.isSaving.set(false);
      input.value = '';
    }
  }

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

  // --- DISPLAY NAME INLINE SAVE ---

  async saveDisplayName(): Promise<void> {
    if (this.nameForm.invalid) return;
    this.isSaving.set(true);

    try {
      const newName = this.nameForm.controls.name.value;
      await this.authStore.updateProfileData({ displayName: newName });
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
