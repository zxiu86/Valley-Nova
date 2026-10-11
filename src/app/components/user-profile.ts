import {
  ChangeDetectionStrategy,
  Component,
  inject,
  signal,
} from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { SlicePipe } from '@angular/common';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthStore } from '../core/auth-store';
import { NovelStore } from '../core/novel-store';
import { RoleRequest } from '../core/novel-models';
import { RoleBadge } from './role-badge';

type ProfileTab = 'bookmarks' | 'history' | 'settings' | 'requests';

const PRESET_COVERS = [
  'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=1500&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1461360370896-922624d12aa1?q=80&w=1500&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1457369804613-52c61a468e7d?q=80&w=1500&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1507842229451-7f01be8510d2?q=80&w=1500&auto=format&fit=crop',
];

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-user-profile',
  imports: [RouterLink, ReactiveFormsModule, RoleBadge, SlicePipe],
  template: `
    <div class="min-h-screen pb-24 bg-[#131315] text-[#e5e1e4]">
      
      <!-- Top Sanctuary Banner -->
      <div class="relative h-56 sm:h-72 w-full bg-[#0e0e10] overflow-hidden border-b border-white/[0.08]">
        <img
          [src]="authStore.coverURL()"
          alt="cover"
          class="w-full h-full object-cover opacity-40 blur-xs transition-all duration-700"
          referrerpolicy="no-referrer"
        />
        <div class="absolute inset-0 bg-gradient-to-t from-[#131315] via-[#131315]/60 to-transparent"></div>
        
        <div class="absolute bottom-6 inset-x-4 sm:inset-x-12 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div class="flex items-center gap-4">
            <div
              (click)="currentTab.set('settings')"
              role="button"
              tabindex="0"
              class="relative w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-[#1c1b1d] border-2 border-[#e9c349]/50 overflow-hidden shadow-2xl flex items-center justify-center shrink-0 cursor-pointer group"
              title="تعديل الأيقونة الشخصية في الإعدادات"
            >
              @if (authStore.photoURL()) {
                <img [src]="authStore.photoURL()" alt="avatar" class="w-full h-full object-cover group-hover:scale-105 transition-transform" referrerpolicy="no-referrer" />
              } @else {
                <span class="material-symbols-outlined text-[32px] text-[#e9c349]">person</span>
              }
              <div class="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                <span class="material-symbols-outlined text-lg text-[#e9c349]">photo_camera</span>
              </div>
            </div>
            
            <div class="flex flex-col">
              <div class="flex items-center gap-2 flex-wrap">
                <h1 class="font-noto-serif text-xl sm:text-2xl font-bold text-white">
                  {{ authStore.displayName() }}
                </h1>
                @if (authStore.activeBadge()) {
                  <app-role-badge [role]="authStore.activeBadge()" />
                }
                @if (authStore.isAuthenticated()) {
                  <span class="px-2 py-0.5 rounded text-[10px] font-semibold bg-[#005039] text-[#7bd8b1]">
                    قارئ موثق
                  </span>
                }
              </div>
              <span class="text-xs text-[#debfc2]/70">{{ authStore.userEmail() }}</span>
            </div>
          </div>

          <div class="flex items-center gap-2 self-start sm:self-auto">
            @if (authStore.isAuthenticated()) {
              <button
                type="button"
                (click)="authStore.logout()"
                class="px-3.5 py-1.5 rounded-xl bg-[#2a2a2c] hover:bg-[#353437] text-xs text-[#debfc2] hover:text-white transition-all cursor-pointer flex items-center gap-1.5"
              >
                <span class="material-symbols-outlined text-[16px]">logout</span>
                <span>تسجيل الخروج</span>
              </button>
            } @else {
              <a
                routerLink="/login"
                class="px-4 py-2 rounded-xl bg-[#e9c349] hover:bg-[#ffe088] text-[#241a00] font-noto-serif text-xs font-bold transition-all shadow-md flex items-center gap-1.5"
              >
                <span class="material-symbols-outlined text-[16px]">login</span>
                <span>تسجيل الدخول للسحابة</span>
              </a>
            }
          </div>
        </div>
      </div>

      <!-- Main Navigation Tabs & Contents -->
      <main class="w-full max-w-6xl mx-auto px-4 sm:px-6 md:px-12 pt-8">
        
        <!-- Navigation Tabs -->
        <div class="flex items-center gap-2 border-b border-white/[0.08] pb-4 mb-8 overflow-x-auto scrollbar-none">
          <button
            type="button"
            (click)="currentTab.set('bookmarks')"
            class="px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center gap-1.5 cursor-pointer shrink-0"
            [class.bg-[#2a2a2c]]="currentTab() === 'bookmarks'"
            [class.text-[#e9c349]]="currentTab() === 'bookmarks'"
            [class.text-[#debfc2]/70]="currentTab() !== 'bookmarks'"
          >
            <span class="material-symbols-outlined text-[18px]">bookmark</span>
            <span>خزانة المحفوظات ({{ novelStore.bookmarkedNovels().length }})</span>
          </button>

          <button
            type="button"
            (click)="currentTab.set('history')"
            class="px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center gap-1.5 cursor-pointer shrink-0"
            [class.bg-[#2a2a2c]]="currentTab() === 'history'"
            [class.text-[#e9c349]]="currentTab() === 'history'"
            [class.text-[#debfc2]/70]="currentTab() !== 'history'"
          >
            <span class="material-symbols-outlined text-[18px]">history</span>
            <span>سجل القراءة ({{ novelStore.readHistory().length }})</span>
          </button>

          <button
            type="button"
            (click)="currentTab.set('settings')"
            class="px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center gap-1.5 cursor-pointer shrink-0"
            [class.bg-[#2a2a2c]]="currentTab() === 'settings'"
            [class.text-[#e9c349]]="currentTab() === 'settings'"
            [class.text-[#debfc2]/70]="currentTab() !== 'settings'"
          >
            <span class="material-symbols-outlined text-[18px]">manage_accounts</span>
            <span>إعدادات الحساب والمظهر</span>
          </button>

          <button
            type="button"
            (click)="currentTab.set('requests')"
            class="px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center gap-1.5 cursor-pointer shrink-0"
            [class.bg-[#2a2a2c]]="currentTab() === 'requests'"
            [class.text-[#e9c349]]="currentTab() === 'requests'"
            [class.text-[#debfc2]/70]="currentTab() !== 'requests'"
          >
            <span class="material-symbols-outlined text-[18px]">assignment_ind</span>
            <span>طلبات الانضمام والرتب الأدبية</span>
            @if (authStore.myRequests().length > 0) {
              <span class="px-1.5 py-0.2 rounded-full bg-[#af8d11]/40 text-[#e9c349] text-[10px]">
                {{ authStore.myRequests().length }}
              </span>
            }
          </button>
        </div>

        <!-- Global Action & Notification Alerts -->
        @if (authStore.actionNotice()) {
          <div class="mb-6 p-4 rounded-xl bg-[#005039]/40 border border-[#7bd8b1]/40 text-xs sm:text-sm text-[#7bd8b1] flex items-center gap-2">
            <span class="material-symbols-outlined text-[20px]">check_circle</span>
            <span>{{ authStore.actionNotice() }}</span>
          </div>
        }
        @if (authStore.authError()) {
          <div class="mb-6 p-4 rounded-xl bg-[#881337]/40 border border-[#ffb2bd]/40 text-xs sm:text-sm text-[#ffb2bd] flex items-center gap-2">
            <span class="material-symbols-outlined text-[20px]">error</span>
            <span>{{ authStore.authError() }}</span>
          </div>
        }

        <!-- TAB 1: Bookmarks -->
        @if (currentTab() === 'bookmarks') {
          <div>
            @if (novelStore.bookmarkedNovels().length === 0) {
              <div class="py-16 text-center bg-[#1c1b1d]/50 border border-white/[0.06] rounded-2xl p-8">
                <span class="material-symbols-outlined text-4xl text-[#debfc2]/40 mb-3">bookmark_border</span>
                <h3 class="font-noto-serif text-base font-bold text-white mb-1">الخزانة فارغة حالياً</h3>
                <p class="text-xs text-[#debfc2]/70 mb-4 max-w-sm mx-auto">
                  تصفح أروقة الروايات والملاحم والحكمة والتراث، واضغط على زر الحفظ لإضافة أي سفر إلى خزانة محفوظاتك الخاصة.
                </p>
                <a
                  routerLink="/"
                  class="inline-block px-5 py-2.5 rounded-xl bg-[#e9c349] text-[#241a00] text-xs font-bold hover:bg-[#ffe088] transition-all"
                >
                  استكشف الأروقة
                </a>
              </div>
            } @else {
              <div class="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                @for (novel of novelStore.bookmarkedNovels(); track novel.id) {
                  <div
                    [routerLink]="['/novel', novel.id]"
                    class="group bg-[#1c1b1d] border border-white/[0.08] hover:border-[#e9c349]/40 rounded-2xl overflow-hidden shadow-lg transition-all duration-300 hover:-translate-y-1.5 cursor-pointer"
                  >
                    <div class="w-full aspect-[1/1.55] bg-[#0e0e10] overflow-hidden relative">
                      <img
                        [src]="novel.coverImage || 'assist/img/logo.png'"
                        [alt]="novel.title"
                        class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        referrerpolicy="no-referrer"
                      />
                      <div class="absolute inset-0 bg-gradient-to-t from-[#1c1b1d] via-transparent to-transparent"></div>
                      <span class="absolute top-2.5 right-2.5 px-2 py-0.5 rounded bg-[#0e0e10]/80 text-[10px] text-[#e9c349] font-medium border border-white/10">
                        {{ novel.riwaqName }}
                      </span>
                    </div>

                    <div class="p-3.5">
                      <h4 class="font-noto-serif text-xs sm:text-sm font-bold text-white group-hover:text-[#e9c349] truncate">
                        {{ novel.title }}
                      </h4>
                      <span class="text-[11px] text-[#debfc2]/70 block truncate mt-0.5">
                        {{ novel.author }}
                      </span>
                      <div class="mt-3 flex items-center justify-between text-[10px] text-[#debfc2]/60 border-t border-white/5 pt-2">
                        <span>{{ novel.chapters.length }} فصول</span>
                        <span class="text-[#ffb2bd]">محفوظ</span>
                      </div>
                    </div>
                  </div>
                }
              </div>
            }
          </div>
        }

        <!-- TAB 2: Reading History -->
        @if (currentTab() === 'history') {
          <div>
            @if (novelStore.readHistory().length === 0) {
              <div class="py-16 text-center bg-[#1c1b1d]/50 border border-white/[0.06] rounded-2xl p-8">
                <span class="material-symbols-outlined text-4xl text-[#debfc2]/40 mb-3">auto_stories</span>
                <h3 class="font-noto-serif text-base font-bold text-white mb-1">لا توجد قراءات سابقة</h3>
                <p class="text-xs text-[#debfc2]/70 mb-4 max-w-sm mx-auto">
                  كل فصل تفتحه في القارئ المشفر بـ MTX سيتم توثيقه هنا تلقائياً لتعود إليه بسهولة.
                </p>
                <a
                  routerLink="/"
                  class="inline-block px-5 py-2.5 rounded-xl bg-[#e9c349] text-[#241a00] text-xs font-bold hover:bg-[#ffe088] transition-all"
                >
                  ابدأ القراءة الأولى
                </a>
              </div>
            } @else {
              <div class="flex flex-col gap-3">
                @for (item of novelStore.readHistory(); track item.chapterId) {
                  <div
                    [routerLink]="['/reader', item.novelId, item.chapterId]"
                    class="p-4 rounded-xl bg-[#1c1b1d] border border-white/[0.06] hover:bg-[#201f22] hover:border-[#e9c349]/30 transition-all flex items-center justify-between cursor-pointer group"
                  >
                    <div class="flex items-center gap-3 min-w-0">
                      <span class="w-8 h-8 rounded-lg bg-[#2a2a2c] text-xs font-bold text-[#e9c349] flex items-center justify-center shrink-0">
                        {{ item.chapterIndex }}
                      </span>
                      <div class="flex flex-col min-w-0">
                        <span class="font-noto-serif text-sm font-semibold text-white group-hover:text-[#e9c349] truncate">
                          {{ item.chapterTitle }}
                        </span>
                        <span class="text-xs text-[#debfc2]/70 truncate mt-0.5">
                          سفر: {{ item.novelTitle }} • {{ item.novelAuthor }}
                        </span>
                      </div>
                    </div>

                    <div class="flex items-center gap-2 text-xs text-[#e9c349] shrink-0">
                      <span>متابعة القراءة</span>
                      <span class="material-symbols-outlined text-[16px] group-hover:-translate-x-1 transition-transform">west</span>
                    </div>
                  </div>
                }
              </div>
            }
          </div>
        }

        <!-- TAB 3: Account Settings (تعديل مظهر القارئ وملفه الشخصي) -->
        @if (currentTab() === 'settings') {
          <div class="max-w-2xl mx-auto p-6 sm:p-8 rounded-2xl bg-[#1c1b1d] border border-white/[0.08] shadow-xl space-y-6">
            <div class="border-b border-white/10 pb-4">
              <h3 class="font-noto-serif text-lg font-bold text-white flex items-center gap-2">
                <span class="material-symbols-outlined text-[#e9c349]">badge</span>
                <span>إعدادات الحساب والمظهر الشخصي</span>
              </h3>
              <p class="text-xs text-[#debfc2]/70 mt-1">
                يمكنك تحديث اسمك المستعار، صورتك الرمزية وخلفية صفحتك الشخصية. التعديلات محصورة بالبيانات المصرح بها ولا تؤثر على الرتب أو الأذونات الممنوحة.
              </p>
            </div>

            <form [formGroup]="profileForm" (ngSubmit)="saveProfile()" class="space-y-6">
              
              <!-- 1. Display Name -->
              <div class="space-y-2">
                <label for="profile-display-name" class="text-xs font-semibold text-[#debfc2] flex items-center gap-1.5">
                  <span class="material-symbols-outlined text-[16px] text-[#e9c349]">person</span>
                  <span>الاسم المعروض (Display Name)</span>
                </label>
                <input
                  id="profile-display-name"
                  type="text"
                  formControlName="displayName"
                  maxlength="60"
                  class="w-full px-4 py-2.5 rounded-xl bg-[#0e0e10] border border-white/10 text-xs sm:text-sm text-white focus:outline-none focus:border-[#e9c349]/50 transition-colors"
                  placeholder="أدخل اسمك المعروض في المنصة..."
                />
                <span class="text-[11px] text-[#debfc2]/50 block">الحد الأقصى 60 حرفاً. يظهر في التعليقات وسجل القراءة.</span>
              </div>

              <!-- 2. Profile Icon / Avatar (اختيار محلي من الهاتف بدون اقتراح أيقونات) -->
              <div class="space-y-3 p-4 sm:p-5 rounded-2xl bg-[#0e0e10]/80 border border-white/10 shadow-inner">
                <div class="flex items-center justify-between">
                  <label for="avatar-file-input" class="text-xs font-semibold text-[#debfc2] flex items-center gap-1.5 cursor-pointer">
                    <span class="material-symbols-outlined text-[18px] text-[#e9c349]">account_circle</span>
                    <span>الأيقونة الشخصية (الصورة الرمزية)</span>
                  </label>
                  @if (profileForm.get('photoURL')?.value) {
                    <span class="text-[11px] text-[#7bd8b1] flex items-center gap-1 bg-[#005039]/30 px-2 py-0.5 rounded-full border border-[#7bd8b1]/30">
                      <span class="material-symbols-outlined text-[13px]">check_circle</span>
                      <span>صورة مخصصة</span>
                    </span>
                  }
                </div>

                <!-- Hidden file input for native phone camera/gallery or local files -->
                <input
                  #avatarFileInput
                  id="avatar-file-input"
                  type="file"
                  accept="image/*"
                  (change)="onAvatarFileSelected($event)"
                  class="hidden"
                />

                <div class="flex flex-col sm:flex-row items-center sm:items-start gap-4 pt-1">
                  <!-- Avatar Preview Frame with interactive click/tap to pick from phone -->
                  <div
                    role="button"
                    tabindex="0"
                    (click)="avatarFileInput.click()"
                    (keydown.enter)="avatarFileInput.click()"
                    class="relative w-24 h-24 rounded-2xl bg-[#1c1b1d] border-2 border-dashed border-white/20 overflow-hidden shrink-0 group cursor-pointer shadow-xl hover:border-[#e9c349] transition-all flex items-center justify-center"
                    title="اضغط لاختيار صورة من هاتفك"
                  >
                    @if (profileForm.get('photoURL')?.value) {
                      <img
                        [src]="profileForm.get('photoURL')?.value"
                        alt="معاينة الصورة"
                        class="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                        referrerpolicy="no-referrer"
                      />
                    } @else {
                      <div class="w-full h-full flex flex-col items-center justify-center text-[#debfc2]/40 group-hover:text-[#e9c349] p-2 text-center">
                        <span class="material-symbols-outlined text-3xl">add_a_photo</span>
                        <span class="text-[10px] mt-1 text-[#debfc2]/60">اختر صورة</span>
                      </div>
                    }

                    <!-- Hover/Active overlay for quick photo pick -->
                    <div class="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white text-[10px] gap-0.5 pointer-events-none">
                      <span class="material-symbols-outlined text-[20px] text-[#e9c349]">smartphone</span>
                      <span class="font-bold">تغيير الصورة</span>
                    </div>

                    @if (isProcessingAvatar()) {
                      <div class="absolute inset-0 bg-black/80 flex flex-col items-center justify-center gap-1">
                        <span class="material-symbols-outlined animate-spin text-[#e9c349] text-2xl">progress_activity</span>
                        <span class="text-[10px] text-[#debfc2]">جاري المعالجة...</span>
                      </div>
                    }
                  </div>

                  <!-- Actions & Explanations -->
                  <div class="flex-1 space-y-2.5 w-full text-right">
                    <div class="flex items-center gap-2 flex-wrap">
                      <button
                        type="button"
                        (click)="avatarFileInput.click()"
                        [disabled]="isProcessingAvatar()"
                        class="px-4 py-2.5 rounded-xl bg-[#e9c349] hover:bg-[#ffe088] text-[#241a00] text-xs font-bold transition-all shadow-md flex items-center gap-2 cursor-pointer disabled:opacity-50"
                      >
                        <span class="material-symbols-outlined text-[18px]">smartphone</span>
                        <span>اختيار صورة من هاتفك</span>
                      </button>

                      @if (profileForm.get('photoURL')?.value) {
                        <button
                          type="button"
                          (click)="removeAvatar()"
                          class="px-3 py-2.5 rounded-xl bg-[#2a2a2c] hover:bg-[#881337]/40 text-xs text-[#debfc2] hover:text-[#ffb2bd] transition-all border border-white/10 hover:border-[#ffb2bd]/40 flex items-center gap-1.5 cursor-pointer"
                        >
                          <span class="material-symbols-outlined text-[16px]">delete</span>
                          <span>حذف الصورة</span>
                        </button>
                      }
                    </div>

                    <p class="text-[11px] text-[#debfc2]/70 leading-relaxed">
                      اختر صورتك المفضلة محلياً مباشرة من هاتفك (الاستوديو، مكتبة الصور، أو الكاميرا). يتم تحسين أبعاد الصورة وحفظها فورياً في ملفك الشخصي.
                    </p>

                    @if (avatarFileName()) {
                      <div class="p-2 rounded-lg bg-[#005039]/20 border border-[#7bd8b1]/30 text-[11px] text-[#7bd8b1] flex items-center gap-1.5">
                        <span class="material-symbols-outlined text-[15px]">check</span>
                        <span>تم تجهيز الصورة من هاتفك: <strong>{{ avatarFileName() }}</strong></span>
                      </div>
                    }

                    @if (avatarUploadError()) {
                      <div class="p-2 rounded-lg bg-[#881337]/20 border border-[#ffb2bd]/30 text-[11px] text-[#ffb2bd] flex items-center gap-1.5">
                        <span class="material-symbols-outlined text-[15px]">error</span>
                        <span>{{ avatarUploadError() }}</span>
                      </div>
                    }
                  </div>
                </div>

                <!-- Optional direct manual URL (no preset avatars) -->
                <div class="pt-2 border-t border-white/5">
                  <button
                    type="button"
                    (click)="showManualUrlInput.set(!showManualUrlInput())"
                    class="text-[11px] text-[#debfc2]/60 hover:text-[#e9c349] transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    <span class="material-symbols-outlined text-[14px]">
                      {{ showManualUrlInput() ? 'expand_less' : 'expand_more' }}
                    </span>
                    <span>أو إدخال رابط خارجي مباشر (اختياري)</span>
                  </button>

                  @if (showManualUrlInput()) {
                    <div class="mt-2">
                      <input
                        id="profile-photo-url"
                        type="url"
                        formControlName="photoURL"
                        class="w-full px-3.5 py-2 rounded-xl bg-[#0e0e10] border border-white/10 text-xs text-white focus:outline-none focus:border-[#e9c349]/50 transition-colors"
                        placeholder="رابط مباشر للصورة (https://...)"
                      />
                    </div>
                  }
                </div>
              </div>

              <!-- 3. Profile Background / Cover Banner -->
              <div class="space-y-2">
                <label for="profile-cover-url" class="text-xs font-semibold text-[#debfc2] flex items-center gap-1.5">
                  <span class="material-symbols-outlined text-[16px] text-[#7bd8b1]">panorama</span>
                  <span>خلفية الملف الشخصي (Profile Background)</span>
                </label>
                <input
                  id="profile-cover-url"
                  type="url"
                  formControlName="coverURL"
                  class="w-full px-4 py-2.5 rounded-xl bg-[#0e0e10] border border-white/10 text-xs text-white focus:outline-none focus:border-[#e9c349]/50 transition-colors"
                  placeholder="رابط صورة الخلفية (https://...)"
                />

                <!-- Quick Cover Presets -->
                <div class="pt-1">
                  <span class="text-[11px] text-[#debfc2]/60 block mb-1.5">أو اختر خلفية صرحية مستوحاة من الأروقة:</span>
                  <div class="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    @for (cov of presetCovers; track cov) {
                      <button
                        type="button"
                        (click)="selectPresetCover(cov)"
                        class="h-14 rounded-lg overflow-hidden border-2 transition-all cursor-pointer relative group"
                        [class.border-[#e9c349]]="profileForm.get('coverURL')?.value === cov"
                        [class.border-white/15]="profileForm.get('coverURL')?.value !== cov"
                      >
                        <img [src]="cov" alt="preset cover" class="w-full h-full object-cover group-hover:scale-105 transition-transform" referrerpolicy="no-referrer" />
                        <div class="absolute inset-0 bg-black/30"></div>
                      </button>
                    }
                  </div>
                </div>
              </div>

              <!-- Security Notice -->
              <div class="p-3.5 rounded-xl bg-[#0e0e10] border border-white/5 text-[11px] text-[#debfc2]/70 leading-relaxed flex items-start gap-2">
                <span class="material-symbols-outlined text-[16px] text-[#e9c349] shrink-0 mt-0.5">verified_user</span>
                <span>
                  <strong>سياسة الأمان:</strong> تعديل بيانات الملف الشخصي يخضع للتحقق في القواعد الأمنية. لا يمكن للمستخدم تعديل رتبته أو حالة الاعتماد عبر هذا النموذج، وتقتصر التعديلات على البيانات المظهرية المصرح بها فقط.
                </span>
              </div>

              <button
                type="submit"
                [disabled]="authStore.isLoading()"
                class="w-full py-3 px-4 rounded-xl bg-[#e9c349] hover:bg-[#ffe088] text-[#241a00] font-noto-serif text-xs sm:text-sm font-bold transition-all shadow-md cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <span class="material-symbols-outlined text-[18px]">save</span>
                <span>حفظ التعديلات في السحابة</span>
              </button>
            </form>
          </div>
        }

        <!-- TAB 4: Join Requests (طلبات الانضمام والرتب الأدبية) -->
        @if (currentTab() === 'requests') {
          <div class="space-y-8">
            
            <!-- Intro Card -->
            <div class="p-6 rounded-2xl bg-[#1c1b1d] border border-white/[0.08] shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 class="font-noto-serif text-lg font-bold text-white flex items-center gap-2">
                  <span class="material-symbols-outlined text-[#e9c349]">workspace_premium</span>
                  <span>ديوان التنسيب والرتب الأدبية التخصصية</span>
                </h3>
                <p class="text-xs text-[#debfc2]/70 mt-1 max-w-2xl leading-relaxed">
                  تتيح منصة «أروقة الخلود» للقراء المتميزين وأهل الاختصاص التقديم للانضمام إلى هيئة التدقيق، أو رابطة الكُتّاب والمؤلفين، أو ديوان الترجمة الأدبية. تُدرس الطلبات وتُعتمد حصراً بقرار إداري موثق.
                </p>
              </div>

              @if (authStore.userRole()) {
                <div class="p-3 rounded-xl bg-[#0e0e10] border border-white/10 shrink-0 text-center">
                  <span class="text-[10px] text-[#debfc2]/60 block mb-1">رتبتك المعتمدة حالياً</span>
                  <app-role-badge [role]="authStore.userRole()" />
                </div>
              }
            </div>

            <!-- Role Request Selector & Conditions -->
            <div class="p-6 sm:p-8 rounded-2xl bg-[#1c1b1d] border border-white/[0.08] shadow-xl space-y-6">
              <h4 class="font-noto-serif text-base font-bold text-white">
                اختر الرتبة الأدبية المراد طلب الانضمام إليها:
              </h4>

              <!-- 3 Option Cards -->
              <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                
                <!-- Option 1: Auditor -->
                <button
                  type="button"
                  (click)="selectedRequestRole.set('auditor')"
                  class="p-4 rounded-xl border text-right transition-all cursor-pointer flex flex-col gap-3 group relative"
                  [class.bg-[#005039]/20]="selectedRequestRole() === 'auditor'"
                  [class.border-[#7bd8b1]]="selectedRequestRole() === 'auditor'"
                  [class.bg-[#0e0e10]]="selectedRequestRole() !== 'auditor'"
                  [class.border-white/10]="selectedRequestRole() !== 'auditor'"
                >
                  <div class="flex items-center justify-between">
                    <span class="material-symbols-outlined text-2xl text-[#7bd8b1]">verified_user</span>
                    @if (selectedRequestRole() === 'auditor') {
                      <span class="material-symbols-outlined text-[#7bd8b1] text-lg">check_circle</span>
                    }
                  </div>
                  <div>
                    <h5 class="font-noto-serif text-sm font-bold text-white group-hover:text-[#7bd8b1] transition-colors">
                      مدقق معتمد («auditor»)
                    </h5>
                    <p class="text-[11px] text-[#debfc2]/70 mt-1 leading-relaxed">
                      فحص ومراجعة الأعمال الأدبية وفصولها وإجازتها أو توثيق الملاحظات والشبهات.
                    </p>
                  </div>
                </button>

                <!-- Option 2: Author -->
                <button
                  type="button"
                  (click)="selectedRequestRole.set('author')"
                  class="p-4 rounded-xl border text-right transition-all cursor-pointer flex flex-col gap-3 group relative"
                  [class.bg-[#af8d11]/20]="selectedRequestRole() === 'author'"
                  [class.border-[#e9c349]]="selectedRequestRole() === 'author'"
                  [class.bg-[#0e0e10]]="selectedRequestRole() !== 'author'"
                  [class.border-white/10]="selectedRequestRole() !== 'author'"
                >
                  <div class="flex items-center justify-between">
                    <span class="material-symbols-outlined text-2xl text-[#e9c349]">history_edu</span>
                    @if (selectedRequestRole() === 'author') {
                      <span class="material-symbols-outlined text-[#e9c349] text-lg">check_circle</span>
                    }
                  </div>
                  <div>
                    <h5 class="font-noto-serif text-sm font-bold text-white group-hover:text-[#e9c349] transition-colors">
                      كاتب ومؤلف («author»)
                    </h5>
                    <p class="text-[11px] text-[#debfc2]/70 mt-1 leading-relaxed">
                      إنشاء وتدوين الأسفار والروايات والفصول في الأروقة مع الالتزام التام بالملكية الفكرية.
                    </p>
                  </div>
                </button>

                <!-- Option 3: Translator -->
                <button
                  type="button"
                  (click)="selectedRequestRole.set('translate')"
                  class="p-4 rounded-xl border text-right transition-all cursor-pointer flex flex-col gap-3 group relative"
                  [class.bg-[#881337]/30]="selectedRequestRole() === 'translate'"
                  [class.border-[#ffb2bd]]="selectedRequestRole() === 'translate'"
                  [class.bg-[#0e0e10]]="selectedRequestRole() !== 'translate'"
                  [class.border-white/10]="selectedRequestRole() !== 'translate'"
                >
                  <div class="flex items-center justify-between">
                    <span class="material-symbols-outlined text-2xl text-[#ffb2bd]">translate</span>
                    @if (selectedRequestRole() === 'translate') {
                      <span class="material-symbols-outlined text-[#ffb2bd] text-lg">check_circle</span>
                    }
                  </div>
                  <div>
                    <h5 class="font-noto-serif text-sm font-bold text-white group-hover:text-[#ffb2bd] transition-colors">
                      مترجم أدبي («translate»)
                    </h5>
                    <p class="text-[11px] text-[#debfc2]/70 mt-1 leading-relaxed">
                      تعريب ونقل الروائع العالمية بأمانة ودقة تصون السياق والشخصيات والنبرة الروائية.
                    </p>
                  </div>
                </button>

              </div>

              <!-- Conditions & Permissions Panel for selected option -->
              <div class="p-4 sm:p-5 rounded-xl bg-[#0e0e10] border border-white/10 space-y-3">
                <div class="flex items-center gap-2 text-xs font-bold" [class]="getRoleTitleColor(selectedRequestRole())">
                  <span class="material-symbols-outlined text-[18px]">gavel</span>
                  <span>الشروط والالتزامات النظامية الخاصة برتبة: {{ getRoleArabicName(selectedRequestRole()) }}</span>
                </div>

                @if (selectedRequestRole() === 'auditor') {
                  <ul class="text-xs text-[#debfc2] space-y-2 list-disc list-inside leading-relaxed">
                    <li><strong>المراجعة الموضوعية:</strong> فحص الأعمال الأدبية وفصولها وتحديد ما إذا كانت مجازة أو تحوي إشكالات.</li>
                    <li><strong>توثيق الشبهات والمراجع:</strong> عند تسجيل أي إشكال، يجب تدوين إيضاح كافٍ مع الأدلة والمراجع أو المصادر المنقول عنها.</li>
                    <li><strong>سياسة التوافق:</strong> لا يُعتد بالصمت أو التخلف عن المراجعة، بل يلزم اتفاق مدققين مستقلين اثنين على الأقل لإجازة العمل نهائياً.</li>
                    <li><strong>التبليغ عن الانتحال:</strong> الإبلاغ الفوري عن شبهات السرقة الأدبية أو النشر غير المصرح به، مما يوجب تعليق نشر العمل لحين الفصل الإداري.</li>
                    <li><strong>حدود الصلاحية:</strong> لا يجوز للمدقق تعديل رتبته بنفسه أو منح رتب للآخرين أو تحوير عمل أي كاتب بدون تفويض رسمي.</li>
                  </ul>
                } @else if (selectedRequestRole() === 'author') {
                  <ul class="text-xs text-[#debfc2] space-y-2 list-disc list-inside leading-relaxed">
                    <li><strong>إقرار الملكية والحقوق:</strong> التعهد الصريح بامتلاك العمل أو حيازة حقوق نشره وتأليفه الأصلية قانونياً.</li>
                    <li><strong>حظر الانتحال التام:</strong> منع النسخ غير المصرح به أو الادعاء الزائف للملكية الفكرية، مع تطبيق مبدأ الصفر تسامح.</li>
                    <li><strong>التعليق الاحترازي:</strong> عند ورود إبلاغ مدعوم بشبهة انتحال أو تعدٍّ على حقوق الغير، يُعلق نشر العمل مؤقتاً أثناء الفحص دون عقوبة تعسفية لحين إثبات الواقعة.</li>
                    <li><strong>الجزاءات الإدارية:</strong> في حال ثبوت المخالفة رسمياً، يحق لصاحب القرار شطب العمل وسحب امتيازات النشر أو إلغاء شارة الكاتب.</li>
                    <li><strong>حدود الصلاحية:</strong> لا يجوز للكاتب التدخل في قرارات المدققين أو التلاعب بها أو منح نفسه رتباً إضافية.</li>
                  </ul>
                } @else if (selectedRequestRole() === 'translate') {
                  <ul class="text-xs text-[#debfc2] space-y-2 list-disc list-inside leading-relaxed">
                    <li><strong>أمانة الترجمة الأدبية:</strong> النقل الدقيق الذي يحفظ المعنى والسياق وهوية الشخصيات وتسلسل الأحداث والحبكة الروائية.</li>
                    <li><strong>سلامة اللغة والاصطلاح:</strong> استخدام لغة فصيحة ومصطلحات متسقة ومراعاة نبرة النص الأصلي وروحه البلاغية.</li>
                    <li><strong>منع التحوير والتشويه:</strong> عدم إجراء تعديلات أو حذف أو إضافات جوهرية غير مرخصة تؤدي إلى تحريف العمل الأصلي.</li>
                    <li><strong>تراخيص النشر المعرب:</strong> حيازة التراخيص أو الأذونات المناسبة لترجمة العمل ونشره في المنصة.</li>
                    <li><strong>إجراءات التشويه أو الانتحال:</strong> في حال الإبلاغ عن تشويه جوهري أو سرقة ترجمة، يُعلق العمل فورياً حتى فحص الإدارة.</li>
                  </ul>
                }

                <div class="pt-2 text-[11px] text-[#e9c349]">
                  📌 <strong>ملاحظة:</strong> إرسال الطلب يسجل طلبك بحالة «معلق» (Pending) في قاعدة البيانات، ولا يمنحك الرتبة تلقائياً.
                </div>
              </div>

              <!-- Statement Input Form -->
              <div class="space-y-3">
                <label for="request-statement" class="text-xs font-semibold text-[#debfc2] block">
                  بيان الكفاءة والخبرة الأدبية / أسباب طلب الانضمام:
                </label>
                <textarea
                  id="request-statement"
                  [formControl]="statementControl"
                  rows="4"
                  placeholder="اكتب نبذة عن مسيرتك، أعمالك السابقة، أو مؤهلاتك الأدبية واللغوية الداعمة لطلبك..."
                  class="w-full px-4 py-3 rounded-xl bg-[#0e0e10] border border-white/10 text-xs sm:text-sm text-white focus:outline-none focus:border-[#e9c349]/50 transition-colors leading-relaxed"
                ></textarea>
              </div>

              <!-- Pledge Checkbox -->
              <div class="flex items-start gap-2.5">
                <input
                  id="terms-pledge"
                  type="checkbox"
                  [formControl]="pledgeControl"
                  class="mt-1 rounded bg-[#0e0e10] border-white/20 text-[#e9c349] focus:ring-0 cursor-pointer"
                />
                <label for="terms-pledge" class="text-xs text-[#debfc2]/80 leading-relaxed cursor-pointer select-none">
                  قرأت كافة الشروط والالتزامات المبينة أعلاه، وأتعهد بالامتثال التام للسياسات الأدبية وحماية حقوق الملكية الفكرية لصرح أروقة الخلود.
                </label>
              </div>

              <!-- Submit Request Button -->
              <button
                type="button"
                (click)="submitRoleRequest()"
                [disabled]="authStore.isLoading() || !pledgeControl.value || statementControl.invalid"
                class="w-full py-3 px-4 rounded-xl bg-[#e9c349] hover:bg-[#ffe088] text-[#241a00] font-noto-serif text-xs sm:text-sm font-bold transition-all shadow-md cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <span class="material-symbols-outlined text-[18px]">send</span>
                <span>إرسال طلب الانضمام الرسمي للمراجعة الإدارية</span>
              </button>
            </div>

            <!-- List of User's Submitted Requests -->
            <div class="p-6 rounded-2xl bg-[#1c1b1d] border border-white/[0.08] shadow-md space-y-4">
              <h4 class="font-noto-serif text-base font-bold text-white flex items-center gap-2">
                <span class="material-symbols-outlined text-[#e9c349]">history_toggle_off</span>
                <span>سجل طلباتك المرسلة وحالتها</span>
              </h4>

              @if (authStore.myRequests().length === 0) {
                <div class="py-8 text-center text-xs text-[#debfc2]/60">
                  لم تقدم أي طلبات انضمام سابقة حتى الآن.
                </div>
              } @else {
                <div class="divide-y divide-white/5">
                  @for (req of authStore.myRequests(); track req.id) {
                    <div class="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div class="flex flex-col gap-1">
                        <div class="flex items-center gap-2">
                          <span class="font-bold text-sm text-white">
                            طلب رتبة: {{ getRoleArabicName(req.role) }}
                          </span>
                          <span
                            class="px-2 py-0.5 rounded text-[10px] font-semibold"
                            [class.bg-[#af8d11]/30]="req.status === 'pending'"
                            [class.text-[#e9c349]]="req.status === 'pending'"
                            [class.bg-[#005039]/40]="req.status === 'approved'"
                            [class.text-[#7bd8b1]]="req.status === 'approved'"
                            [class.bg-[#881337]/40]="req.status === 'rejected'"
                            [class.text-[#ffb2bd]]="req.status === 'rejected'"
                          >
                            @switch (req.status) {
                              @case ('pending') { قيد المراجعة الإدارية }
                              @case ('approved') { معتمد ومفعل ✓ }
                              @case ('rejected') { مرفوض }
                            }
                          </span>
                        </div>
                        <span class="text-[11px] text-[#debfc2]/60">
                          تاريخ التقديم: {{ req.createdAt | slice:0:10 }}
                        </span>
                        @if (req.rejectionReason) {
                          <span class="text-[11px] text-[#ffb2bd]">
                            سبب الرفض: {{ req.rejectionReason }}
                          </span>
                        }
                      </div>

                      <div class="text-xs text-[#debfc2]/50 italic max-w-xs truncate">
                        "{{ req.statement }}"
                      </div>
                    </div>
                  }
                </div>
              }
            </div>

            <!-- Founder Management Queue (Visible exclusively to verified Founder) -->
            @if (authStore.isFounder()) {
              <div class="p-6 rounded-2xl bg-[#1c1b1d] border-2 border-[#e9c349]/40 shadow-2xl space-y-5">
                <div class="flex items-center justify-between border-b border-white/10 pb-3">
                  <div class="flex items-center gap-2">
                    <span class="material-symbols-outlined text-[#e9c349]">admin_panel_settings</span>
                    <h4 class="font-noto-serif text-base font-bold text-white">
                      ديوان القرارات الإدارية والطلبات المعلقة (صلاحية المؤسس)
                    </h4>
                  </div>
                  <button
                    type="button"
                    (click)="authStore.loadAllPendingRequests()"
                    class="text-xs text-[#e9c349] hover:underline cursor-pointer flex items-center gap-1"
                  >
                    <span class="material-symbols-outlined text-[14px]">refresh</span>
                    <span>تحديث الطلبات</span>
                  </button>
                </div>

                @if (authStore.allPendingRequests().length === 0) {
                  <div class="py-6 text-center text-xs text-[#debfc2]/60">
                    لا توجد طلبات معلقة بانتظار القرار في الوقت الحالي.
                  </div>
                } @else {
                  <div class="space-y-4">
                    @for (req of authStore.allPendingRequests(); track req.id) {
                      <div class="p-4 rounded-xl bg-[#0e0e10] border border-white/10 flex flex-col gap-3">
                        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <div class="flex items-center gap-2">
                            <span class="font-bold text-sm text-white">{{ req.userName }}</span>
                            <span class="text-xs text-[#debfc2]/70">({{ req.userEmail }})</span>
                            <span class="px-2 py-0.5 rounded text-[10px] font-semibold bg-[#af8d11]/30 text-[#e9c349]">
                              يطلب: {{ getRoleArabicName(req.role) }}
                            </span>
                          </div>
                          <span class="text-[11px] text-[#debfc2]/50">{{ req.createdAt | slice:0:16 }}</span>
                        </div>

                        <p class="text-xs text-[#debfc2] bg-[#1c1b1d] p-3 rounded-lg leading-relaxed">
                          «{{ req.statement }}»
                        </p>

                        <div class="flex items-center justify-end gap-2 pt-2 border-t border-white/5">
                          <button
                            type="button"
                            (click)="approveRequest(req)"
                            class="px-3.5 py-1.5 rounded-lg bg-[#005039] hover:bg-[#00694b] text-xs font-bold text-[#7bd8b1] transition-all cursor-pointer flex items-center gap-1"
                          >
                            <span class="material-symbols-outlined text-[16px]">check</span>
                            <span>اعتماد وتفعيل الرتبة</span>
                          </button>
                          <button
                            type="button"
                            (click)="rejectRequest(req)"
                            class="px-3.5 py-1.5 rounded-lg bg-[#881337] hover:bg-[#a31b44] text-xs font-bold text-[#ffb2bd] transition-all cursor-pointer flex items-center gap-1"
                          >
                            <span class="material-symbols-outlined text-[16px]">close</span>
                            <span>رفض الطلب</span>
                          </button>
                        </div>
                      </div>
                    }
                  </div>
                }
              </div>
            }

          </div>
        }

      </main>
    </div>
  `,
})
export class UserProfile {
  readonly authStore = inject(AuthStore);
  readonly novelStore = inject(NovelStore);
  private readonly router = inject(Router);

  readonly currentTab = signal<ProfileTab>('bookmarks');
  readonly selectedRequestRole = signal<'auditor' | 'author' | 'translate'>('auditor');

  readonly presetCovers = PRESET_COVERS;

  readonly avatarFileName = signal<string>('');
  readonly isProcessingAvatar = signal<boolean>(false);
  readonly avatarUploadError = signal<string>('');
  readonly showManualUrlInput = signal<boolean>(false);

  readonly profileForm = new FormGroup({
    displayName: new FormControl(this.authStore.displayName(), [Validators.maxLength(60)]),
    photoURL: new FormControl(this.authStore.photoURL()),
    coverURL: new FormControl(this.authStore.coverURL()),
  });

  readonly statementControl = new FormControl('', [Validators.required, Validators.minLength(10)]);
  readonly pledgeControl = new FormControl(false, [Validators.requiredTrue]);

  /**
   * اختيار صورة الأيقونة الشخصية محلياً من هاتف المستخدم أو جهازه
   * مع ضغط وضبط الأبعاد لتناسب العرض فائق الجودة والسرعة
   */
  onAvatarFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;

    const file = input.files[0];
    if (!file.type.startsWith('image/')) {
      this.avatarUploadError.set('يرجى اختيار ملف صورة صالح (JPG, PNG, WebP).');
      return;
    }

    if (file.size > 15 * 1024 * 1024) {
      this.avatarUploadError.set('حجم الصورة كبير جداً، يرجى اختيار صورة أقل من 15 ميغابايت.');
      return;
    }

    this.isProcessingAvatar.set(true);
    this.avatarUploadError.set('');

    const reader = new FileReader();
    reader.onload = (loadEvent) => {
      const dataUrl = loadEvent.target?.result as string;
      if (!dataUrl) {
        this.isProcessingAvatar.set(false);
        this.avatarUploadError.set('تعذر قراءة الصورة من هاتفك.');
        return;
      }

      const img = new Image();
      img.onload = () => {
        try {
          // تقليص أبعاد الصورة إلى أبعاد مناسبة للأيقونة مع الحفاظ على التناسب
          const maxDim = 320;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > maxDim) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            }
          } else {
            if (height > maxDim) {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }

          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            const optimized = canvas.toDataURL('image/jpeg', 0.88);
            this.profileForm.patchValue({ photoURL: optimized });
            this.avatarFileName.set(file.name);
          } else {
            this.profileForm.patchValue({ photoURL: dataUrl });
            this.avatarFileName.set(file.name);
          }
        } catch {
          this.profileForm.patchValue({ photoURL: dataUrl });
          this.avatarFileName.set(file.name);
        } finally {
          this.isProcessingAvatar.set(false);
          input.value = '';
        }
      };

      img.onerror = () => {
        this.isProcessingAvatar.set(false);
        this.avatarUploadError.set('تعذر فك ترميز ملف الصورة.');
        input.value = '';
      };

      img.src = dataUrl;
    };

    reader.onerror = () => {
      this.isProcessingAvatar.set(false);
      this.avatarUploadError.set('حدث خطأ أثناء قراءة الملف من هاتفك.');
      input.value = '';
    };

    reader.readAsDataURL(file);
  }

  removeAvatar(): void {
    this.profileForm.patchValue({ photoURL: '' });
    this.avatarFileName.set('');
    this.avatarUploadError.set('');
  }

  selectPresetCover(url: string): void {
    this.profileForm.patchValue({ coverURL: url });
  }

  async saveProfile(): Promise<void> {
    const val = this.profileForm.value;
    await this.authStore.updateProfileData({
      displayName: val.displayName || undefined,
      photoURL: val.photoURL || undefined,
      coverURL: val.coverURL || undefined,
    });
  }

  async submitRoleRequest(): Promise<void> {
    const statement = this.statementControl.value || '';
    const success = await this.authStore.submitRoleRequest(this.selectedRequestRole(), statement);
    if (success) {
      this.statementControl.reset('');
      this.pledgeControl.setValue(false);
    }
  }

  async approveRequest(req: RoleRequest): Promise<void> {
    await this.authStore.reviewRoleRequest(req, 'approved', 'تم الاعتماد بعد مراجعة الكفاءة واستيفاء الشروط');
  }

  async rejectRequest(req: RoleRequest): Promise<void> {
    await this.authStore.reviewRoleRequest(req, 'rejected', 'لم يستوفِ الشروط والخبرات اللازمة في الوقت الراهن');
  }

  getRoleArabicName(role: string): string {
    switch (role) {
      case 'auditor': return 'مدقق معتمد';
      case 'author': return 'كاتب ومؤلف';
      case 'translate': return 'مترجم أدبي';
      default: return role;
    }
  }

  getRoleTitleColor(role: string): string {
    switch (role) {
      case 'auditor': return 'text-[#7bd8b1]';
      case 'author': return 'text-[#e9c349]';
      case 'translate': return 'text-[#ffb2bd]';
      default: return 'text-white';
    }
  }
}
