import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthStore } from '../core/auth-store';

type AuthMode = 'login' | 'register' | 'reset';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-auth-page',
  imports: [ReactiveFormsModule, RouterLink],
  template: `
    <div class="w-full min-h-[85vh] py-12 px-4 sm:px-6 flex items-center justify-center relative bg-[#131315] text-[#e5e1e4]">
      
      <!-- Ambient Lighting -->
      <div class="absolute inset-0 overflow-hidden pointer-events-none">
        <div class="absolute top-1/4 right-1/4 w-80 h-80 bg-[#881337]/15 rounded-full blur-3xl"></div>
        <div class="absolute bottom-1/4 left-1/4 w-80 h-80 bg-[#e9c349]/10 rounded-full blur-3xl"></div>
      </div>

      <div class="w-full max-w-md mx-auto relative z-10 space-y-6">
        
        <!-- Header & Logo -->
        <div class="text-center space-y-2">
          <a routerLink="/" class="inline-flex items-center justify-center group mb-2">
            <span class="font-noto-serif text-3xl font-bold text-white tracking-wide group-hover:text-[#ffb2bd] transition-colors">
              أروقة الخلود
            </span>
          </a>
          
          <h1 class="font-noto-serif text-xl sm:text-2xl font-bold text-[#e5e1e4]">
            {{ mode() === 'login' ? 'ولوج إلى صرح السرد' : mode() === 'register' ? 'انضمام إلى قراء الأروقة' : 'استعادة تذكرة الدخول' }}
          </h1>

          <p class="text-xs text-[#debfc2]/70 max-w-xs mx-auto">
            {{ mode() === 'login' ? 'ادخل بحسابك للوصول إلى خزانة محفوظاتك الخاصة' : mode() === 'register' ? 'أنشئ حسابك لحفظ قراءاتك وتأملاتك' : 'أدخل بريدك الإلكتروني لإرسال رابط الاستعادة' }}
          </p>
        </div>

        @if (authStore.isAuthenticated()) {
          <!-- Already signed in card -->
          <div class="p-6 sm:p-8 rounded-2xl bg-[#1c1b1d] border border-white/10 text-center space-y-5 shadow-2xl">
            <div class="w-16 h-16 rounded-full bg-gradient-to-br from-[#881337] to-[#e9c349]/30 border border-[#e9c349]/40 flex items-center justify-center mx-auto text-white font-bold text-xl">
              @if (authStore.photoURL()) {
                <img [src]="authStore.photoURL()" alt="avatar" class="w-full h-full object-cover rounded-full" />
              } @else {
                <span class="material-symbols-outlined text-[28px]">person</span>
              }
            </div>

            <div>
              <h2 class="font-noto-serif text-lg font-bold text-white">{{ authStore.displayName() }}</h2>
              <span class="text-xs text-[#debfc2]/70">{{ authStore.userEmail() }}</span>
            </div>

            <div class="flex flex-col gap-2.5">
              <a
                routerLink="/profile"
                class="py-3 px-4 rounded-xl bg-[#e9c349] text-[#241a00] font-noto-serif text-xs font-bold shadow-md hover:bg-[#ffe088] transition-all cursor-pointer"
              >
                الذهاب إلى خزانة المحفوظات
              </a>
              <button
                type="button"
                (click)="authStore.logout()"
                class="py-2.5 px-4 rounded-xl bg-[#2a2a2c] text-xs text-[#debfc2] hover:text-white transition-all cursor-pointer"
              >
                تسجيل الخروج
              </button>
            </div>
          </div>
        } @else {
          <!-- Auth Form Card -->
          <div class="p-6 sm:p-8 rounded-2xl bg-[#1c1b1d]/90 border border-white/[0.08] backdrop-blur-xl shadow-2xl space-y-6">
            
            <!-- Auth Mode Switcher Tabs -->
            <div class="grid grid-cols-2 p-1 rounded-xl bg-[#0e0e10] border border-white/5 text-xs font-medium">
              <button
                type="button"
                (click)="setMode('login')"
                class="py-2 rounded-lg transition-all cursor-pointer"
                [class.bg-[#2a2a2c]]="mode() === 'login'"
                [class.text-white]="mode() === 'login'"
                [class.text-[#debfc2]/70]="mode() !== 'login'"
              >
                تسجيل الدخول
              </button>
              <button
                type="button"
                (click)="setMode('register')"
                class="py-2 rounded-lg transition-all cursor-pointer"
                [class.bg-[#2a2a2c]]="mode() === 'register'"
                [class.text-white]="mode() === 'register'"
                [class.text-[#debfc2]/70]="mode() !== 'register'"
              >
                إنشاء حساب
              </button>
            </div>

            <!-- Error Notice -->
            @if (authStore.authError()) {
              <div class="p-3.5 rounded-xl bg-[#881337]/30 border border-[#ffb2bd]/30 text-xs text-[#ffb2bd] flex items-center gap-2">
                <span class="material-symbols-outlined text-[18px] shrink-0">error</span>
                <span>{{ authStore.authError() }}</span>
              </div>
            }

            <!-- Success Notice -->
            @if (authStore.actionNotice()) {
              <div class="p-3.5 rounded-xl bg-[#005039]/40 border border-[#7bd8b1]/40 text-xs text-[#7bd8b1] flex items-center gap-2">
                <span class="material-symbols-outlined text-[18px] shrink-0">check_circle</span>
                <span>{{ authStore.actionNotice() }}</span>
              </div>
            }

            <!-- Google Sign-in Button -->
            <button
              type="button"
              (click)="loginWithGoogle()"
              [disabled]="authStore.isLoading()"
              class="w-full py-3 px-4 rounded-xl bg-[#2a2a2c] hover:bg-[#353437] border border-white/10 text-xs font-semibold text-white flex items-center justify-center gap-2.5 transition-all cursor-pointer disabled:opacity-50"
            >
              <svg class="w-4 h-4" viewBox="0 0 24 24">
                <path fill="#EA4335" d="M12 5c1.6 0 3 .6 4.1 1.7l3.1-3.1C17.3 1.8 14.8 1 12 1 7.5 1 3.7 3.6 1.9 7.3l3.7 2.9C6.5 7.4 9 5 12 5z"/>
                <path fill="#4285F4" d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.8z"/>
                <path fill="#FBBC05" d="M5.6 14.8c-.2-.7-.4-1.5-.4-2.3s.2-1.6.4-2.3L1.9 7.3C.7 9.7 0 12.3 0 15.2s.7 5.5 1.9 7.9l3.7-2.9z"/>
                <path fill="#34A853" d="M12 23.5c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3 0-5.5-2.4-6.4-5.2L1.9 16.5C3.7 20.2 7.5 23.5 12 23.5z"/>
              </svg>
              <span>المتابعة عبر حساب Google</span>
            </button>

            <!-- Divider -->
            <div class="relative flex items-center justify-center">
              <div class="w-full border-t border-white/10"></div>
              <span class="absolute px-3 bg-[#1c1b1d] text-[10px] text-[#debfc2]/60 uppercase tracking-wider">
                أو بالبريد الإلكتروني
              </span>
            </div>

            <!-- Form -->
            <form [formGroup]="authForm" (ngSubmit)="onSubmit()" class="space-y-4">
              
              @if (mode() === 'register') {
                <div class="space-y-1">
                  <label for="auth-display-name" class="text-[11px] font-medium text-[#debfc2]/80">اسم العرض (الاسم المستعار)</label>
                  <input
                    id="auth-display-name"
                    type="text"
                    formControlName="displayName"
                    class="w-full px-3.5 py-2.5 rounded-xl bg-[#0e0e10] border border-white/10 text-xs text-white focus:outline-none focus:border-[#e9c349]/50 transition-colors"
                    placeholder="مثال: قارئ الأروقة"
                  />
                </div>
              }

              <div class="space-y-1">
                <label for="auth-email" class="text-[11px] font-medium text-[#debfc2]/80">البريد الإلكتروني</label>
                <input
                  id="auth-email"
                  type="email"
                  formControlName="email"
                  class="w-full px-3.5 py-2.5 rounded-xl bg-[#0e0e10] border border-white/10 text-xs text-white focus:outline-none focus:border-[#e9c349]/50 transition-colors"
                  placeholder="name@example.com"
                />
              </div>

              @if (mode() !== 'reset') {
                <div class="space-y-1">
                  <div class="flex items-center justify-between">
                    <label for="auth-password" class="text-[11px] font-medium text-[#debfc2]/80">كلمة المرور</label>
                    @if (mode() === 'login') {
                      <button
                        type="button"
                        (click)="setMode('reset')"
                        class="text-[10px] text-[#e9c349] hover:underline"
                      >
                        نسيت كلمة المرور؟
                      </button>
                    }
                  </div>
                  <input
                    id="auth-password"
                    type="password"
                    formControlName="password"
                    class="w-full px-3.5 py-2.5 rounded-xl bg-[#0e0e10] border border-white/10 text-xs text-white focus:outline-none focus:border-[#e9c349]/50 transition-colors"
                    placeholder="••••••••"
                  />
                </div>
              }

              <button
                type="submit"
                [disabled]="authStore.isLoading()"
                class="w-full py-3 px-4 rounded-xl bg-[#e9c349] hover:bg-[#ffe088] text-[#241a00] font-noto-serif text-xs font-bold shadow-lg transition-all cursor-pointer disabled:opacity-50 mt-2"
              >
                @if (authStore.isLoading()) {
                  <span>جاري المعالجة...</span>
                } @else {
                  <span>{{ mode() === 'login' ? 'دخول الأروقة' : mode() === 'register' ? 'إنشاء الحساب' : 'إرسال رابط الاستعادة' }}</span>
                }
              </button>

              @if (mode() === 'reset') {
                <div class="text-center pt-2">
                  <button
                    type="button"
                    (click)="setMode('login')"
                    class="text-xs text-[#debfc2] hover:text-[#e9c349] transition-colors"
                  >
                    ← العودة إلى تسجيل الدخول
                  </button>
                </div>
              }

            </form>

          </div>
        }

      </div>
    </div>
  `,
})
export class AuthPage {
  readonly authStore = inject(AuthStore);
  private readonly router = inject(Router);

  readonly mode = signal<AuthMode>('login');

  readonly authForm = new FormGroup({
    displayName: new FormControl(''),
    email: new FormControl('', [Validators.required, Validators.email]),
    password: new FormControl('', [Validators.required, Validators.minLength(6)]),
  });

  setMode(m: AuthMode): void {
    this.mode.set(m);
    this.authStore.clearErrors();
  }

  async loginWithGoogle(): Promise<void> {
    const ok = await this.authStore.loginWithGoogle();
    if (ok) {
      this.router.navigate(['/']);
    }
  }

  async onSubmit(): Promise<void> {
    const val = this.authForm.value;
    const email = val.email || '';
    const pass = val.password || '';
    const name = val.displayName || '';

    if (this.mode() === 'login') {
      const ok = await this.authStore.loginWithEmail(email, pass);
      if (ok) {
        this.router.navigate(['/']);
      }
    } else if (this.mode() === 'register') {
      const ok = await this.authStore.registerWithEmail(email, pass, name);
      if (ok) {
        this.router.navigate(['/']);
      }
    } else if (this.mode() === 'reset') {
      await this.authStore.resetPassword(email);
    }
  }
}
