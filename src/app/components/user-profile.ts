import {
  ChangeDetectionStrategy,
  Component,
  inject,
  signal,
} from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { AuthStore } from '../core/auth-store';
import { NovelStore } from '../core/novel-store';

type ProfileTab = 'bookmarks' | 'history' | 'settings';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-user-profile',
  imports: [RouterLink, ReactiveFormsModule],
  template: `
    <div class="min-h-screen pb-24 bg-[#131315] text-[#e5e1e4]">
      
      <!-- Top Sanctuary Banner -->
      <div class="relative h-48 sm:h-64 w-full bg-[#0e0e10] overflow-hidden border-b border-white/[0.08]">
        <img
          [src]="authStore.coverURL()"
          alt="cover"
          class="w-full h-full object-cover opacity-40 blur-xs"
        />
        <div class="absolute inset-0 bg-gradient-to-t from-[#131315] via-[#131315]/60 to-transparent"></div>
        
        <div class="absolute bottom-6 inset-x-4 sm:inset-x-12 flex items-end justify-between gap-4">
          <div class="flex items-center gap-4">
            <div class="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-[#1c1b1d] border-2 border-[#e9c349]/50 overflow-hidden shadow-2xl flex items-center justify-center shrink-0">
              @if (authStore.photoURL()) {
                <img [src]="authStore.photoURL()" alt="avatar" class="w-full h-full object-cover" />
              } @else {
                <span class="material-symbols-outlined text-[32px] text-[#e9c349]">person</span>
              }
            </div>
            
            <div class="flex flex-col">
              <div class="flex items-center gap-2">
                <h1 class="font-noto-serif text-xl sm:text-2xl font-bold text-white">
                  {{ authStore.displayName() }}
                </h1>
                @if (authStore.isAuthenticated()) {
                  <span class="px-2 py-0.5 rounded text-[10px] font-semibold bg-[#005039] text-[#7bd8b1]">
                    قارئ موثق
                  </span>
                }
              </div>
              <span class="text-xs text-[#debfc2]/70">{{ authStore.userEmail() }}</span>
            </div>
          </div>

          @if (authStore.isAuthenticated()) {
            <button
              type="button"
              (click)="authStore.logout()"
              class="px-3.5 py-1.5 rounded-xl bg-[#2a2a2c] hover:bg-[#353437] text-xs text-[#debfc2] hover:text-white transition-all cursor-pointer"
            >
              تسجيل الخروج
            </button>
          } @else {
            <a
              routerLink="/login"
              class="px-4 py-2 rounded-xl bg-[#e9c349] hover:bg-[#ffe088] text-[#241a00] font-noto-serif text-xs font-bold transition-all shadow-md"
            >
              تسجيل الدخول للسحابة
            </a>
          }
        </div>
      </div>

      <!-- Main Navigation Tabs & Contents -->
      <main class="w-full max-w-6xl mx-auto px-4 sm:px-6 md:px-12 pt-8">
        
        <!-- Navigation Tabs -->
        <div class="flex items-center gap-2 border-b border-white/[0.08] pb-4 mb-8">
          <button
            type="button"
            (click)="currentTab.set('bookmarks')"
            class="px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center gap-1.5 cursor-pointer"
            [class.bg-[#2a2a2c]]="currentTab() === 'bookmarks'"
            [class.text-[#e9c349]]="currentTab() === 'bookmarks'"
            [class.text-[#debfc2]/70]="currentTab() !== 'bookmarks'"
          >
            <span class="material-symbols-outlined text-[18px]">bookmark</span>
            <span>خزانة المحفوظات ({{ novelStore.bookmarkedNovels().length }})</span>
          </button>

          <button
            type="button"
            (click)="currentTab() !== 'history' && currentTab.set('history')"
            class="px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center gap-1.5 cursor-pointer"
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
            class="px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center gap-1.5 cursor-pointer"
            [class.bg-[#2a2a2c]]="currentTab() === 'settings'"
            [class.text-[#e9c349]]="currentTab() === 'settings'"
            [class.text-[#debfc2]/70]="currentTab() !== 'settings'"
          >
            <span class="material-symbols-outlined text-[18px]">manage_accounts</span>
            <span>بيانات القارئ</span>
          </button>
        </div>

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
              <!-- Bookmarked Books Shelf -->
              <!-- Responsive: On mobile, horizontal side scroll with full size covers, or grid on larger screens -->
              <div class="flex overflow-x-auto gap-4 pb-4 sm:grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 sm:overflow-visible scrollbar-none snap-x">
                @for (novel of novelStore.bookmarkedNovels(); track novel.id) {
                  <div
                    [routerLink]="['/novel', novel.id]"
                    class="group bg-[#1c1b1d] border border-white/[0.08] hover:border-[#e9c349]/40 rounded-2xl overflow-hidden shadow-lg transition-all duration-300 hover:-translate-y-1.5 shrink-0 w-36 min-w-[144px] sm:w-auto sm:min-w-0 snap-start cursor-pointer"
                  >
                    <div class="w-full aspect-[1/1.55] bg-[#0e0e10] overflow-hidden relative">
                      <img
                        [src]="novel.coverImage || 'assist/img/logo.png'"
                        [alt]="novel.title"
                        class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
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

        <!-- TAB 3: Settings -->
        @if (currentTab() === 'settings') {
          <div class="max-w-xl mx-auto p-6 sm:p-8 rounded-2xl bg-[#1c1b1d] border border-white/[0.08] shadow-xl space-y-6">
            <h3 class="font-noto-serif text-lg font-bold text-white mb-4">
              تعديل مظهر القارئ وملفه الشخصي
            </h3>

            @if (authStore.actionNotice()) {
              <div class="p-3.5 rounded-xl bg-[#005039]/40 border border-[#7bd8b1]/40 text-xs text-[#7bd8b1] flex items-center gap-2">
                <span class="material-symbols-outlined text-[18px]">check_circle</span>
                <span>{{ authStore.actionNotice() }}</span>
              </div>
            }

            <form [formGroup]="profileForm" (ngSubmit)="saveProfile()" class="space-y-4">
              <div class="space-y-1">
                <label for="profile-display-name" class="text-[11px] font-medium text-[#debfc2]/80">الاسم المستعار للقارئ</label>
                <input
                  id="profile-display-name"
                  type="text"
                  formControlName="displayName"
                  class="w-full px-3.5 py-2.5 rounded-xl bg-[#0e0e10] border border-white/10 text-xs text-white focus:outline-none focus:border-[#e9c349]/50 transition-colors"
                />
              </div>

              <div class="space-y-1">
                <label for="profile-photo-url" class="text-[11px] font-medium text-[#debfc2]/80">رابط الصورة الرمزية (Avatar URL)</label>
                <input
                  id="profile-photo-url"
                  type="text"
                  formControlName="photoURL"
                  class="w-full px-3.5 py-2.5 rounded-xl bg-[#0e0e10] border border-white/10 text-xs text-white focus:outline-none focus:border-[#e9c349]/50 transition-colors"
                  placeholder="https://..."
                />
              </div>

              <button
                type="submit"
                [disabled]="authStore.isLoading()"
                class="w-full py-3 px-4 rounded-xl bg-[#e9c349] hover:bg-[#ffe088] text-[#241a00] font-noto-serif text-xs font-bold transition-all shadow-md cursor-pointer disabled:opacity-50"
              >
                حفظ التعديلات
              </button>
            </form>
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

  readonly profileForm = new FormGroup({
    displayName: new FormControl(this.authStore.displayName()),
    photoURL: new FormControl(this.authStore.photoURL()),
  });

  async saveProfile(): Promise<void> {
    const val = this.profileForm.value;
    await this.authStore.updateProfileData({
      displayName: val.displayName || undefined,
      photoURL: val.photoURL || undefined,
    });
  }
}
