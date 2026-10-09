import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { AuthStore } from '../core/auth-store';

type AuthMode = 'login' | 'register' | 'reset';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-auth-page',
  imports: [ReactiveFormsModule, RouterLink, MatIconModule],
  template: `
    <div class="min-h-[85vh] py-12 px-4 sm:px-6 lg:px-8 flex items-center justify-center relative">
      
      <!-- Background Ambient Glows -->
      <div class="absolute top-1/4 -right-20 w-96 h-96 bg-rose-600/10 rounded-full blur-3xl pointer-events-none"></div>
      <div class="absolute bottom-1/4 -left-20 w-96 h-96 bg-amber-600/5 rounded-full blur-3xl pointer-events-none"></div>

      <div class="w-full max-w-md relative z-10 space-y-8">
        
        <!-- Top Logo & Title -->
        <div class="text-center space-y-3">
          <div class="inline-flex w-16 h-16 rounded-2xl liquid-glass border border-rose-500/30 items-center justify-center shadow-lg shadow-rose-950/40">
            <span class="font-amiri font-black text-3xl text-rose-500">م</span>
          </div>
          
          <h1 class="text-2xl sm:text-3xl font-extrabold font-amiri text-white tracking-wide">
            {{ getPageHeading() }}
          </h1>

          <p class="text-xs sm:text-sm text-stone-400">
            {{ getPageSubheading() }}
          </p>
        </div>

        <!-- IF USER IS ALREADY LOGGED IN: Show Profile Summary Card -->
        @if (authStore.isAuthenticated()) {
          <div class="liquid-glass rounded-3xl p-6 sm:p-8 border border-white/10 space-y-6 text-center">
            
            <div class="relative inline-block">
              @if (authStore.photoURL()) {
                <img
                  [src]="authStore.photoURL()"
                  alt="صورة المستخدم"
                  referrerpolicy="no-referrer"
                  class="w-20 h-20 rounded-full border-2 border-rose-500 shadow-md object-cover mx-auto"
                />
              } @else {
                <div class="w-20 h-20 rounded-full bg-gradient-to-br from-rose-600 to-rose-900 border-2 border-rose-500/50 flex items-center justify-center text-white font-bold text-2xl mx-auto shadow-md">
                  {{ authStore.displayName().charAt(0) || 'ق' }}
                </div>
              }
              <div class="absolute bottom-0 left-1 w-5 h-5 rounded-full bg-emerald-500 border-2 border-stone-900" title="متصل"></div>
            </div>

            <div class="space-y-1">
              <h2 class="text-xl font-bold font-amiri text-white">
                {{ authStore.displayName() }}
              </h2>
              <p class="text-xs text-stone-400 font-mono">
                {{ authStore.userEmail() }}
              </p>
            </div>

            <div class="p-3.5 rounded-2xl bg-white/5 border border-white/10 text-xs text-stone-300 space-y-1">
              <div class="flex items-center justify-between">
                <span>حالة الحساب:</span>
                <span class="text-emerald-400 font-bold flex items-center gap-1">
                  <mat-icon class="text-xs">check_circle</mat-icon>
                  <span>نشط وموثق</span>
                </span>
              </div>
              <div class="flex items-center justify-between">
                <span>معرف القارئ:</span>
                <span class="font-mono text-[11px] text-stone-500 truncate max-w-[180px]">
                  {{ authStore.user()?.uid }}
                </span>
              </div>
            </div>

            <div class="flex flex-col gap-3 pt-2">
              <a
                routerLink="/"
                class="w-full py-3 px-4 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs sm:text-sm transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
              >
                <mat-icon class="text-base">auto_stories</mat-icon>
                <span>الانتقال إلى مكتبة الروايات</span>
              </a>

              <button
                type="button"
                (click)="authStore.logout()"
                class="w-full py-2.5 px-4 rounded-xl border border-white/10 hover:bg-white/10 text-stone-300 hover:text-white text-xs transition-colors cursor-pointer flex items-center justify-center gap-1.5"
              >
                <mat-icon class="text-base text-rose-400">logout</mat-icon>
                <span>تسجيل الخروج من الحساب</span>
              </button>
            </div>

          </div>
        } @else {
          <!-- AUTHENTICATION FORM CARD -->
          <div class="liquid-glass rounded-3xl p-6 sm:p-8 border border-white/10 shadow-2xl space-y-6">
            
            <!-- Tab Mode Switcher (تسجيل دخول / إنشاء حساب) -->
            <div class="grid grid-cols-2 gap-1 p-1 bg-black/40 rounded-2xl border border-white/5 text-xs">
              <button
                type="button"
                (click)="setMode('login')"
                [class]="mode() === 'login' ? 'bg-rose-600 text-white font-bold shadow-sm' : 'text-stone-400 hover:text-white'"
                class="py-2.5 rounded-xl transition-all cursor-pointer text-center"
              >
                تسجيل الدخول
              </button>

              <button
                type="button"
                (click)="setMode('register')"
                [class]="mode() === 'register' ? 'bg-rose-600 text-white font-bold shadow-sm' : 'text-stone-400 hover:text-white'"
                class="py-2.5 rounded-xl transition-all cursor-pointer text-center"
              >
                إنشاء حساب جديد
              </button>
            </div>

            <!-- GOOGLE ONE-CLICK SIGN IN -->
            <div class="space-y-2">
              <button
                type="button"
                (click)="onGoogleLogin()"
                [disabled]="authStore.isLoading()"
                class="w-full py-3 px-4 rounded-2xl liquid-glass border border-white/15 hover:border-rose-500/40 hover:bg-white/10 text-white font-medium text-xs sm:text-sm transition-all flex items-center justify-center gap-3 cursor-pointer shadow-sm group disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <svg class="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                </svg>
                <span>تسجيل الدخول السريع عبر Google</span>
              </button>

              <div class="flex items-center justify-between px-1">
                <span class="text-[10px] text-stone-400">
                  يتطلب إضافة النطاق في لوحة تحكم Firebase
                </span>
                <button
                  type="button"
                  (click)="toggleDomainHelp()"
                  class="text-[10px] text-amber-400 hover:text-amber-300 underline cursor-pointer flex items-center gap-0.5"
                >
                  <mat-icon class="text-[11px]">help_outline</mat-icon>
                  <span>شرح حل خطأ النطاق</span>
                </button>
              </div>
            </div>

            <!-- UNAUTHORIZED DOMAIN RESOLUTION CARD (يظهر عند ظهور خطأ auth/unauthorized-domain أو عند الضغط على المساعدة) -->
            @if (authStore.unauthorizedDomain() || showDomainHelp()) {
              <div class="p-4 sm:p-5 rounded-2xl bg-amber-950/40 border border-amber-500/40 text-xs text-amber-200/90 space-y-3.5 animate-in fade-in">
                
                <div class="flex items-start gap-2.5">
                  <div class="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0 mt-0.5">
                    <mat-icon class="text-lg">shield</mat-icon>
                  </div>
                  <div class="space-y-1">
                    <h4 class="font-bold text-amber-300 text-sm font-amiri">
                      حل مشكلة خطأ النطاق (auth/unauthorized-domain)
                    </h4>
                    <p class="text-[11px] text-amber-200/80 leading-relaxed font-sans">
                      هذه ليست مشكلة برمجية في الموقع، بل حماية أمنية إلزامية من Google لحظر تسجيل الدخول بجوجل إلا من النطاقات المصرح بها يدوياً في لوحة تحكم مشروعك في Firebase.
                    </p>
                  </div>
                </div>

                <!-- Solution 1: Immediate & 100% Working Right Now -->
                <div class="p-3.5 rounded-xl bg-stone-900/90 border border-emerald-500/30 space-y-2">
                  <div class="flex items-center gap-1.5 text-emerald-400 font-bold text-xs">
                    <mat-icon class="text-sm">verified</mat-icon>
                    <span>الحل الفوري (يعمل 100% الآن دون أي تعديل في فايربيس):</span>
                  </div>
                  <p class="text-[11px] text-stone-300 leading-relaxed">
                    أنشئ حساباً أو سجّل دخولك باستخدام <strong>البريد الإلكتروني وكلمة المرور</strong> بالأسفل. نظام البريد يعمل فوراً على جميع النطاقات دون أي قيود!
                  </p>
                  <div class="flex flex-wrap gap-2 pt-1">
                    <button
                      type="button"
                      (click)="setMode('register')"
                      class="py-1.5 px-3 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold text-[11px] transition-colors cursor-pointer flex items-center gap-1"
                    >
                      <mat-icon class="text-xs">person_add</mat-icon>
                      <span>الانتقال لإنشاء حساب بالبريد</span>
                    </button>

                    <button
                      type="button"
                      (click)="fillDemoUser()"
                      class="py-1.5 px-3 rounded-lg bg-white/10 hover:bg-white/20 text-stone-200 text-[11px] transition-colors cursor-pointer flex items-center gap-1"
                    >
                      <mat-icon class="text-xs">bolt</mat-icon>
                      <span>تعبئة وتجربة حساب سريع</span>
                    </button>
                  </div>
                </div>

                <!-- Solution 2: Whitelist Domain in Firebase Console -->
                <div class="p-3.5 rounded-xl bg-stone-900/90 border border-amber-500/25 space-y-2.5">
                  <div class="flex items-center justify-between">
                    <div class="flex items-center gap-1.5 text-amber-400 font-bold text-xs">
                      <mat-icon class="text-sm">settings</mat-icon>
                      <span>لتفعيل تسجيل دخول Google (خطوات سريعة):</span>
                    </div>
                    <span class="text-[10px] text-stone-400 font-mono">Firebase Console</span>
                  </div>

                  <!-- Hostname Box with Copy Button -->
                  <div class="space-y-1">
                    <span class="text-[10px] text-stone-400 block">نطاق موقعك الحالي المطلوب إضافته:</span>
                    <div class="flex items-center justify-between bg-black/70 p-2 rounded-lg border border-white/10 font-mono text-[11px]">
                      <span class="truncate text-amber-300 select-all font-semibold pl-2">
                        {{ currentHostname() || 'نطاق الموقع الحالي' }}
                      </span>
                      <button
                        type="button"
                        (click)="copyHostname()"
                        class="px-2.5 py-1 rounded bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 text-[11px] shrink-0 flex items-center gap-1 cursor-pointer transition-colors"
                      >
                        <mat-icon class="text-xs">{{ hasCopiedHostname() ? 'check' : 'content_copy' }}</mat-icon>
                        <span>{{ hasCopiedHostname() ? 'تم النسخ!' : 'نسخ النطاق' }}</span>
                      </button>
                    </div>
                  </div>

                  <!-- Steps List -->
                  <ol class="list-decimal list-inside space-y-1.5 text-[11px] text-stone-300 pt-1 leading-relaxed">
                    <li>
                      افتح
                      <a
                        [href]="authStore.firebaseSettingsUrl"
                        target="_blank"
                        rel="noopener noreferrer"
                        class="text-amber-400 hover:text-amber-300 underline font-bold inline-flex items-center gap-0.5 mx-1"
                      >
                        إعدادات مصادقة Firebase
                        <mat-icon class="text-[10px]">open_in_new</mat-icon>
                      </a>
                    </li>
                    <li>
                      في تبويب <strong>Settings (الإعدادات)</strong>، انزل إلى قسم <strong>Authorized domains (النطاقات المصرح بها)</strong>.
                    </li>
                    <li>
                      اضغط <strong>Add domain (إضافة نطاق)</strong>، والصق النطاق المنسوخ أعلاه، ثم اضغط <strong>Save</strong>.
                    </li>
                  </ol>
                  <p class="text-[10px] text-emerald-400/90 pt-1 flex items-center gap-1">
                    <mat-icon class="text-xs">check</mat-icon>
                    <span>بمجرد الحفظ، سيعمل تسجيل الدخول بـ Google فوراً دون الحاجة لتحديث الكود!</span>
                  </p>
                </div>

              </div>
            }

            <!-- Divider -->
            <div class="relative flex items-center justify-center">
              <div class="border-t border-white/10 w-full"></div>
              <span class="bg-stone-900 px-3 text-[11px] text-stone-400 absolute">أو بالبريد الإلكتروني وكلمة المرور</span>
            </div>

            <!-- Feedback / Error Notice -->
            @if (authStore.authError() && !authStore.unauthorizedDomain()) {
              <div class="p-3.5 rounded-2xl bg-rose-950/60 border border-rose-500/40 text-rose-300 text-xs flex items-center gap-2 animate-in fade-in">
                <mat-icon class="text-base text-rose-400 shrink-0">error_outline</mat-icon>
                <span>{{ authStore.authError() }}</span>
              </div>
            }

            @if (authStore.actionNotice()) {
              <div class="p-3.5 rounded-2xl bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-2 animate-in fade-in">
                <mat-icon class="text-base text-emerald-400 shrink-0">check_circle</mat-icon>
                <span>{{ authStore.actionNotice() }}</span>
              </div>
            }

            <!-- FORM FIELDS -->
            <form [formGroup]="authForm" (ngSubmit)="onSubmit()" class="space-y-4">
              
              <!-- Display Name (Only in Register Mode) -->
              @if (mode() === 'register') {
                <div class="space-y-1.5">
                  <label for="displayNameInput" class="block text-xs font-medium text-stone-300">
                    الاسم المستعار (اسم القارئ):
                  </label>
                  <div class="relative">
                    <input
                      id="displayNameInput"
                      type="text"
                      formControlName="displayName"
                      placeholder="مثلاً: صقر الروايات"
                      class="w-full bg-stone-950/80 border border-white/10 focus:border-rose-500 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-stone-500 focus:outline-none transition-colors pr-10"
                    />
                    <mat-icon class="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 text-base pointer-events-none">
                      person
                    </mat-icon>
                  </div>
                </div>
              }

              <!-- Email Field -->
              <div class="space-y-1.5">
                <label for="emailInput" class="block text-xs font-medium text-stone-300">
                  البريد الإلكتروني:
                </label>
                <div class="relative">
                  <input
                    id="emailInput"
                    type="email"
                    dir="ltr"
                    formControlName="email"
                    placeholder="name@example.com"
                    class="w-full bg-stone-950/80 border border-white/10 focus:border-rose-500 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-stone-500 focus:outline-none transition-colors pr-10 text-left font-mono"
                  />
                  <mat-icon class="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 text-base pointer-events-none">
                    mail
                  </mat-icon>
                </div>
              </div>

              <!-- Password Field (Hidden in Reset Mode) -->
              @if (mode() !== 'reset') {
                <div class="space-y-1.5">
                  <div class="flex items-center justify-between">
                    <label for="passwordInput" class="block text-xs font-medium text-stone-300">
                      كلمة المرور:
                    </label>
                    @if (mode() === 'login') {
                      <button
                        type="button"
                        (click)="setMode('reset')"
                        class="text-[11px] text-rose-400 hover:text-rose-300 transition-colors cursor-pointer"
                      >
                        نسيت كلمة المرور؟
                      </button>
                    }
                  </div>
                  <div class="relative">
                    <input
                      id="passwordInput"
                      [type]="showPassword() ? 'text' : 'password'"
                      dir="ltr"
                      formControlName="password"
                      placeholder="••••••••"
                      class="w-full bg-stone-950/80 border border-white/10 focus:border-rose-500 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-stone-500 focus:outline-none transition-colors pr-10 pl-10 text-left font-mono"
                    />
                    <mat-icon class="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 text-base pointer-events-none">
                      lock
                    </mat-icon>
                    <button
                      type="button"
                      (click)="togglePasswordVisibility()"
                      class="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-white transition-colors cursor-pointer"
                      [title]="showPassword() ? 'إخفاء كلمة المرور' : 'إظهار كلمة المرور'"
                    >
                      <mat-icon class="text-base">{{ showPassword() ? 'visibility_off' : 'visibility' }}</mat-icon>
                    </button>
                  </div>
                </div>
              }

              <!-- SUBMIT BUTTON -->
              <button
                type="submit"
                [disabled]="authStore.isLoading() || authForm.invalid"
                class="w-full py-3 px-4 rounded-2xl bg-gradient-to-l from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 text-white font-bold text-xs sm:text-sm transition-all shadow-lg shadow-rose-950/50 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed mt-2"
              >
                @if (authStore.isLoading()) {
                  <mat-icon class="text-base animate-spin">refresh</mat-icon>
                  <span>جاري المعالجة...</span>
                } @else {
                  <mat-icon class="text-base">{{ getSubmitButtonIcon() }}</mat-icon>
                  <span>{{ getSubmitButtonText() }}</span>
                }
              </button>

              <!-- Reset Password Back Link -->
              @if (mode() === 'reset') {
                <div class="text-center pt-2">
                  <button
                    type="button"
                    (click)="setMode('login')"
                    class="text-xs text-stone-400 hover:text-white transition-colors cursor-pointer flex items-center justify-center gap-1 mx-auto"
                  >
                    <mat-icon class="text-sm">arrow_forward</mat-icon>
                    <span>العودة لتسجيل الدخول</span>
                  </button>
                </div>
              }

            </form>

            <!-- Bottom Disclaimer -->
            <div class="pt-2 text-center text-[11px] text-stone-500 border-t border-white/5">
              <span>تسجيلك يعني موافقتك على شروط استخدام مقاتل الروايات وسياسة الخصوصية.</span>
            </div>

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
  readonly showPassword = signal<boolean>(false);
  readonly currentHostname = signal<string>('');
  readonly hasCopiedHostname = signal<boolean>(false);
  readonly showDomainHelp = signal<boolean>(false);

  readonly authForm = new FormGroup({
    displayName: new FormControl<string>(''),
    email: new FormControl<string>('', {
      nonNullable: true,
      validators: [Validators.required, Validators.email],
    }),
    password: new FormControl<string>('', {
      nonNullable: true,
      validators: [Validators.required, Validators.minLength(6)],
    }),
  });

  constructor() {
    if (typeof window !== 'undefined') {
      this.currentHostname.set(window.location.hostname || window.location.host);
    }
  }

  toggleDomainHelp(): void {
    this.showDomainHelp.update((v) => !v);
  }

  async copyHostname(): Promise<void> {
    const host = this.currentHostname();
    if (!host) return;
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(host);
      } else {
        // Fallback
        const textarea = document.createElement('textarea');
        textarea.value = host;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }
      this.hasCopiedHostname.set(true);
      setTimeout(() => this.hasCopiedHostname.set(false), 3000);
    } catch (err) {
      console.error('Failed to copy hostname:', err);
    }
  }

  fillDemoUser(): void {
    this.setMode('login');
    this.authForm.patchValue({
      email: 'reader@mokatel.com',
      password: 'password123',
      displayName: 'قارئ مقاتل',
    });
  }

  setMode(mode: AuthMode): void {
    this.mode.set(mode);
    this.authStore.clearErrors();

    // Adjust validation based on mode
    if (mode === 'reset') {
      this.authForm.controls.password.clearValidators();
    } else {
      this.authForm.controls.password.setValidators([Validators.required, Validators.minLength(6)]);
    }
    this.authForm.controls.password.updateValueAndValidity();
  }

  togglePasswordVisibility(): void {
    this.showPassword.update(v => !v);
  }

  async onGoogleLogin(): Promise<void> {
    const success = await this.authStore.loginWithGoogle();
    if (success) {
      this.router.navigate(['/']);
    }
  }

  async onSubmit(): Promise<void> {
    if (this.authForm.invalid) return;

    const email = this.authForm.controls.email.value;
    const password = this.authForm.controls.password.value;
    const displayName = this.authForm.controls.displayName.value || '';

    if (this.mode() === 'login') {
      const success = await this.authStore.loginWithEmail(email, password);
      if (success) {
        this.router.navigate(['/']);
      }
    } else if (this.mode() === 'register') {
      const success = await this.authStore.registerWithEmail(email, password, displayName);
      if (success) {
        this.router.navigate(['/']);
      }
    } else if (this.mode() === 'reset') {
      await this.authStore.resetPassword(email);
    }
  }

  getPageHeading(): string {
    if (this.authStore.isAuthenticated()) {
      return 'حساب القارئ الشخصي';
    }
    switch (this.mode()) {
      case 'register':
        return 'انضم إلى مقاتل الروايات';
      case 'reset':
        return 'استعادة كلمة المرور';
      case 'login':
      default:
        return 'تسجيل الدخول إلى حسابك';
    }
  }

  getPageSubheading(): string {
    if (this.authStore.isAuthenticated()) {
      return 'مرحباً بك مجدداً! حسابك موثق ومتصل بقاعدة بيانات فايربيس.';
    }
    switch (this.mode()) {
      case 'register':
        return 'أنشئ حسابك لمزامنة الفصول المحفوظة، التقييمات، ومتابعة القراءة.';
      case 'reset':
        return 'أدخل بريدك الإلكتروني وسنرسل لك رابطاً لإعادة تعيين كلمة المرور.';
      case 'login':
      default:
        return 'سجّل دخولك لمزامنة مكتبتك ومتابعة قراءة رواياتك المفضلة.';
    }
  }

  getSubmitButtonText(): string {
    switch (this.mode()) {
      case 'register':
        return 'إنشاء الحساب الآن';
      case 'reset':
        return 'إرسال رابط الاستعادة';
      case 'login':
      default:
        return 'دخول إلى الحساب';
    }
  }

  getSubmitButtonIcon(): string {
    switch (this.mode()) {
      case 'register':
        return 'person_add';
      case 'reset':
        return 'send';
      case 'login':
      default:
        return 'login';
    }
  }
}
