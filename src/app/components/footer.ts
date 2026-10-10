import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { NovelStore } from '../core/novel-store';

type InfoModalType = 'about' | 'guide' | 'privacy' | 'contact' | null;

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-footer',
  imports: [RouterLink, MatIconModule, ReactiveFormsModule],
  template: `
    <footer class="relative mt-24 border-t border-rose-500/15 bg-gradient-to-b from-stone-950/80 via-stone-950 to-black text-stone-300">
      
      <!-- Subtle Crimson Ambient Backlight strictly contained -->
      <div class="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-rose-500/40 to-transparent"></div>
      <div class="absolute -top-24 right-1/4 w-72 h-40 bg-rose-900/10 rounded-full blur-3xl pointer-events-none overflow-hidden"></div>

      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-12">
        
        <!-- ========================================================================= -->
        <!-- TOP FOOTER: Interactive Newsletter Box (تشغيل حقيقي للاشتراك البريدي) -->
        <!-- ========================================================================= -->
        <div class="rounded-3xl liquid-glass border border-rose-500/20 p-6 sm:p-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl">
          <div class="space-y-1 text-center md:text-right max-w-lg">
            <span class="text-xs font-bold text-rose-400 flex items-center justify-center md:justify-start gap-1.5">
              <mat-icon class="text-sm">notifications_active</mat-icon>
              <span>نشرة مقاتل الروايات اليومية</span>
            </span>
            <h3 class="text-lg sm:text-xl font-bold font-amiri text-white">
              كن أول من يقرأ الفصول الجديدة والمترجمة فور صدورها
            </h3>
            <p class="text-xs text-stone-400 font-sans">
              اشترك مجاناً لتصلك إشعارات وتحديثات الروايات المفضلة لديك مباشرة في بريدك.
            </p>
          </div>

          <!-- Subscription Form -->
          <form [formGroup]="newsletterForm" (ngSubmit)="onSubscribeNewsletter()" class="w-full md:w-auto flex flex-col sm:flex-row items-center gap-2.5">
            <div class="relative w-full sm:w-72">
              <input
                type="email"
                dir="ltr"
                formControlName="email"
                placeholder="reader@example.com"
                class="w-full bg-stone-900/90 border border-white/10 focus:border-rose-500 rounded-2xl px-4 py-3 text-xs text-white placeholder-stone-500 focus:outline-none transition-colors text-left font-mono"
              />
            </div>
            <button
              type="submit"
              [disabled]="newsletterForm.invalid || isSubscribing()"
              class="w-full sm:w-auto px-6 py-3 rounded-2xl bg-gradient-to-l from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 text-white font-bold text-xs shadow-md transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-1.5 shrink-0"
            >
              <mat-icon class="text-sm">mark_email_read</mat-icon>
              <span>{{ isSubscribing() ? 'جاري الاشتراك...' : 'اشتراك مجاني' }}</span>
            </button>
          </form>
        </div>

        <!-- ========================================================================= -->
        <!-- MAIN FOOTER GRID (روابط وتشغيل حقيقي لكافة الأقسام) -->
        <!-- ========================================================================= -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 lg:gap-8">
          
          <!-- Column 1: Brand & Bio (2 cols wide on desktop) -->
          <div class="lg:col-span-2 space-y-4">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-2xl liquid-glass border border-rose-500/30 flex items-center justify-center p-1 shadow-md">
                <img
                  src="assist/img/logo.png"
                  alt="شعار مقاتل الروايات"
                  class="w-full h-full object-contain"
                />
              </div>
              <div class="flex flex-col">
                <span class="text-2xl font-bold font-amiri text-white tracking-wide">
                  مقاتل الروايات
                </span>
                <span class="text-[10px] text-rose-400 font-sans tracking-widest font-semibold uppercase -mt-1">
                  عالم الروايات العربية والمترجمة
                </span>
              </div>
            </div>

            <p class="text-xs sm:text-sm text-stone-400 leading-relaxed max-w-sm font-sans">
              منصة أدبية عربية حديثة تحتضن أروع الروايات الخيالية، المترجمة، والتاريخية. صُممت خصيصاً لتوفر للقارئ العربي ملاذاً بصرياً أنيقاً ومريحاً مع أفضل تجربة قراءة تفاعلية سريعة.
            </p>

            <div class="flex flex-wrap gap-2 pt-2">
              <span class="px-2.5 py-1 rounded-lg liquid-glass border border-white/5 text-[11px] text-rose-300 flex items-center gap-1">
                <mat-icon class="text-xs text-rose-400">auto_stories</mat-icon>
                <span>مكتبة متجددة</span>
              </span>
              <span class="px-2.5 py-1 rounded-lg liquid-glass border border-white/5 text-[11px] text-stone-300 flex items-center gap-1">
                <mat-icon class="text-xs text-rose-400">dark_mode</mat-icon>
                <span>وضع ليلي مريح</span>
              </span>
              <span class="px-2.5 py-1 rounded-lg liquid-glass border border-white/5 text-[11px] text-stone-300 flex items-center gap-1">
                <mat-icon class="text-xs text-rose-400">offline_bolt</mat-icon>
                <span>قراءة فورية بدون إعلانات</span>
              </span>
            </div>
          </div>

          <!-- Column 2: Categories / Genres (فلترة حقيقية فعالة) -->
          <div class="space-y-3">
            <h4 class="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2 border-b border-rose-500/15 pb-2">
              <mat-icon class="text-rose-400 text-sm">category</mat-icon>
              <span>أقسام الروايات</span>
            </h4>
            <ul class="space-y-2 text-xs text-stone-400">
              <li>
                <button
                  type="button"
                  (click)="filterCategory('all')"
                  class="hover:text-rose-300 transition-colors flex items-center gap-1.5 cursor-pointer text-right w-full"
                >
                  <span class="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                  <span>كافة الروايات المتاحة</span>
                </button>
              </li>
              <li>
                <button
                  type="button"
                  (click)="filterCategory('fantasy')"
                  class="hover:text-rose-300 transition-colors flex items-center gap-1.5 cursor-pointer text-right w-full"
                >
                  <span class="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                  <span>فانتازيا وخيال ملحمي</span>
                </button>
              </li>
              <li>
                <button
                  type="button"
                  (click)="filterCategory('translated')"
                  class="hover:text-rose-300 transition-colors flex items-center gap-1.5 cursor-pointer text-right w-full"
                >
                  <span class="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                  <span>روايات مترجمة حصرية</span>
                </button>
              </li>
              <li>
                <button
                  type="button"
                  (click)="filterCategory('mystery')"
                  class="hover:text-rose-300 transition-colors flex items-center gap-1.5 cursor-pointer text-right w-full"
                >
                  <span class="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                  <span>غموض وتشويق وسايبربانك</span>
                </button>
              </li>
              <li>
                <button
                  type="button"
                  (click)="filterCategory('history')"
                  class="hover:text-rose-300 transition-colors flex items-center gap-1.5 cursor-pointer text-right w-full"
                >
                  <span class="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                  <span>أدب وتاريخ عربي أصيل</span>
                </button>
              </li>
            </ul>
          </div>

          <!-- Column 3: Reader Navigation -->
          <div class="space-y-3">
            <h4 class="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2 border-b border-rose-500/15 pb-2">
              <mat-icon class="text-rose-400 text-sm">menu_book</mat-icon>
              <span>تجربة القارئ</span>
            </h4>
            <ul class="space-y-2 text-xs text-stone-400">
              <li>
                <a routerLink="/" class="hover:text-rose-300 transition-colors flex items-center gap-1.5">
                  <mat-icon class="text-xs text-rose-400">local_fire_department</mat-icon>
                  <span>الروايات الأكثر قراءة</span>
                </a>
              </li>
              <li>
                <a routerLink="/reader" class="hover:text-rose-300 transition-colors flex items-center gap-1.5">
                  <mat-icon class="text-xs text-rose-400">auto_stories</mat-icon>
                  <span>متابعة الفصل الحالي</span>
                </a>
              </li>
              <li>
                <a routerLink="/login" class="hover:text-rose-300 transition-colors flex items-center gap-1.5">
                  <mat-icon class="text-xs text-rose-400">account_circle</mat-icon>
                  <span>حساب القارئ وتسجيل الدخول</span>
                </a>
              </li>
              <li>
                <button
                  type="button"
                  (click)="resetSampleData()"
                  class="hover:text-rose-300 transition-colors cursor-pointer flex items-center gap-1.5 text-right w-full text-stone-400"
                >
                  <mat-icon class="text-xs text-rose-400">restore</mat-icon>
                  <span>استعادة الروايات الافتراضية</span>
                </button>
              </li>
            </ul>
          </div>

          <!-- Column 4: Platform & Support (نوافذ حوارية فعلية للمعلومات والتواصل) -->
          <div class="space-y-3">
            <h4 class="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2 border-b border-rose-500/15 pb-2">
              <mat-icon class="text-rose-400 text-sm">info</mat-icon>
              <span>عن المنصة والدعم</span>
            </h4>
            <ul class="space-y-2 text-xs text-stone-400">
              <li>
                <button
                  type="button"
                  (click)="openModal('about')"
                  class="hover:text-rose-300 transition-colors cursor-pointer flex items-center gap-1.5 text-right w-full"
                >
                  <mat-icon class="text-xs text-rose-400">shield</mat-icon>
                  <span>عن مقاتل الروايات</span>
                </button>
              </li>
              <li>
                <button
                  type="button"
                  (click)="openModal('guide')"
                  class="hover:text-rose-300 transition-colors cursor-pointer flex items-center gap-1.5 text-right w-full"
                >
                  <mat-icon class="text-xs text-rose-400">edit_note</mat-icon>
                  <span>دليل المترجمين والمؤلفين</span>
                </button>
              </li>
              <li>
                <button
                  type="button"
                  (click)="openModal('privacy')"
                  class="hover:text-rose-300 transition-colors cursor-pointer flex items-center gap-1.5 text-right w-full"
                >
                  <mat-icon class="text-xs text-rose-400">policy</mat-icon>
                  <span>سياسة الخصوصية والاستخدام</span>
                </button>
              </li>
              <li>
                <button
                  type="button"
                  (click)="openModal('contact')"
                  class="hover:text-rose-300 transition-colors cursor-pointer flex items-center gap-1.5 text-right w-full text-rose-300 font-semibold"
                >
                  <mat-icon class="text-xs text-rose-400">contact_support</mat-icon>
                  <span>اتصل بفريق المنصة</span>
                </button>
              </li>
            </ul>
          </div>

        </div>

        <!-- ========================================================================= -->
        <!-- BOTTOM COPYRIGHT BAR -->
        <!-- ========================================================================= -->
        <div class="pt-8 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-stone-500">
          <div class="flex items-center gap-2 text-center sm:text-right">
            <span>© 2026 مقاتل الروايات. جميع حقوق الأعمال الأدبية محفوظة لمؤلفيها ومترجميها.</span>
          </div>

          <div class="flex items-center gap-4 text-stone-400">
            <span>صُنع بشغف للأدب العربي المتميز</span>
            <button
              type="button"
              (click)="scrollToTop()"
              aria-label="الرجوع لأعلى الصفحة"
              class="w-9 h-9 rounded-xl liquid-glass flex items-center justify-center text-rose-300 hover:text-white border border-rose-500/20 cursor-pointer transition-all hover:scale-105 shadow-sm"
              title="الرجوع لأعلى الصفحة"
            >
              <mat-icon class="text-base">arrow_upward</mat-icon>
            </button>
          </div>
        </div>

      </div>

      <!-- ========================================================================= -->
      <!-- TOAST NOTIFICATION (تنبيه منبثق عند أي تفاعل) -->
      <!-- ========================================================================= -->
      @if (toastMessage()) {
        <div class="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-2xl liquid-glass bg-stone-900/95 border border-rose-500/40 text-white text-xs font-medium shadow-2xl flex items-center gap-2.5 animate-in fade-in slide-in-from-bottom-4">
          <mat-icon class="text-rose-400 text-base">check_circle</mat-icon>
          <span>{{ toastMessage() }}</span>
        </div>
      }

      <!-- ========================================================================= -->
      <!-- INTERACTIVE MODALS (عن المنصة · دليل المترجمين · الخصوصية · اتصل بنا) -->
      <!-- ========================================================================= -->
      @if (activeModal()) {
        <div class="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 overflow-y-auto animate-in fade-in">
          
          <div class="w-full max-w-lg liquid-glass bg-stone-950/95 border border-rose-500/30 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl relative my-auto">
            
            <!-- Modal Header -->
            <div class="flex items-center justify-between border-b border-rose-500/20 pb-4">
              <div class="flex items-center gap-2.5">
                <div class="w-9 h-9 rounded-xl bg-gradient-to-br from-rose-600 to-rose-950 flex items-center justify-center text-white shadow-sm">
                  <mat-icon class="text-lg">{{ getModalIcon() }}</mat-icon>
                </div>
                <h3 class="text-lg sm:text-xl font-bold font-amiri text-white">
                  {{ getModalTitle() }}
                </h3>
              </div>

              <button
                type="button"
                (click)="closeModal()"
                class="w-8 h-8 rounded-xl liquid-glass flex items-center justify-center text-stone-400 hover:text-white cursor-pointer"
              >
                <mat-icon class="text-lg">close</mat-icon>
              </button>
            </div>

            <!-- Modal Content Based on Selection -->
            @switch (activeModal()) {
              @case ('about') {
                <div class="space-y-4 text-xs sm:text-sm text-stone-300 leading-relaxed font-sans">
                  <p>
                    <strong>مقاتل الروايات</strong> هي منصة عربية متخصصة ومستقلة، أُنشئت بهدف توفير أرقى تجربة قراءة للأعمال الروائية الفانتازية، التاريخية، والمترجمة.
                  </p>
                  <div class="p-3.5 rounded-2xl bg-white/5 border border-white/10 space-y-2">
                    <h5 class="font-bold text-rose-300 text-xs">أبرز مزايا المنصة:</h5>
                    <ul class="list-disc list-inside space-y-1 text-xs text-stone-300">
                      <li>قراءة سلسة وتصميم متطور مريح للعينين في القراءة الليلية الطويلة.</li>
                      <li>تقنيات ضغط متقدمة للفصول توفر استهلاك البيانات وتتيح القراءة الفورية.</li>
                      <li>مزامنة سحابية لمكتبتك، مفضلتك، وتقدمك في كل فصل.</li>
                      <li>بيئة نظيفة تماماً بدون أي إعلانات منبثقة مزعجة.</li>
                    </ul>
                  </div>
                </div>
              }

              @case ('guide') {
                <div class="space-y-4 text-xs sm:text-sm text-stone-300 leading-relaxed font-sans">
                  <p>
                    نرحب بجميع المترجمين المستقلين والكتاب العرب الموهوبين لنشر وتوثيق أعمالهم في مقاتل الروايات.
                  </p>
                  <div class="p-3.5 rounded-2xl bg-white/5 border border-white/10 space-y-2 text-xs">
                    <h5 class="font-bold text-rose-300">إرشادات النشر والترجمة:</h5>
                    <ul class="list-decimal list-inside space-y-1.5 text-stone-300">
                      <li>الحفاظ على سلامة اللغة العربية والترجمة الأدبية المتقنة.</li>
                      <li>ذكر اسم المؤلف الأصلي وحفظ حقوق الملكية الفكرية.</li>
                      <li>تنسيق الفصول مع ترقيم واضح وعناوين معبرة.</li>
                      <li>احترام الذائقة العامة وتجنب المحتوى غير اللائق.</li>
                    </ul>
                  </div>
                  <p class="text-xs text-stone-400">
                    للانضمام كفريق ترجمة معتمد، يمكنك مراسلتنا مباشرة عبر قسم <strong>اتصل بفريق المنصة</strong>.
                  </p>
                </div>
              }

              @case ('privacy') {
                <div class="space-y-4 text-xs sm:text-sm text-stone-300 leading-relaxed font-sans">
                  <p>
                    نولي خصوصية قرائنا أقصى درجات الاهتمام، ونلتزم بأعلى معايير حماية البيانات الشخصية:
                  </p>
                  <ul class="space-y-2 text-xs text-stone-300">
                    <li class="flex items-start gap-2">
                      <mat-icon class="text-rose-400 text-xs mt-0.5">lock</mat-icon>
                      <span>تشفير كامل لكلمات المرور وحسابات القراء.</span>
                    </li>
                    <li class="flex items-start gap-2">
                      <mat-icon class="text-rose-400 text-xs mt-0.5">verified_user</mat-icon>
                      <span>حفظ الفصول المحفوظة والمفضلة بأمان في قاعدة بياناتك.</span>
                    </li>
                    <li class="flex items-start gap-2">
                      <mat-icon class="text-rose-400 text-xs mt-0.5">visibility_off</mat-icon>
                      <span>لا نقوم ببيع أو مشاركة أي بيانات شخصية مع أطراف ثالثة إطلاقاً.</span>
                    </li>
                  </ul>
                </div>
              }

              @case ('contact') {
                <form [formGroup]="contactForm" (ngSubmit)="onSubmitContact()" class="space-y-4">
                  <div class="space-y-1">
                    <label for="contactName" class="block text-xs font-medium text-stone-300">الاسم أو الاسم المستعار:</label>
                    <input
                      id="contactName"
                      type="text"
                      formControlName="name"
                      placeholder="اسمك الكريم"
                      class="w-full bg-stone-900 border border-white/10 focus:border-rose-500 rounded-xl px-3.5 py-2 text-xs text-white placeholder-stone-500 focus:outline-none"
                    />
                  </div>

                  <div class="space-y-1">
                    <label for="contactEmail" class="block text-xs font-medium text-stone-300">البريد الإلكتروني للرد:</label>
                    <input
                      id="contactEmail"
                      type="email"
                      dir="ltr"
                      formControlName="email"
                      placeholder="reader@example.com"
                      class="w-full bg-stone-900 border border-white/10 focus:border-rose-500 rounded-xl px-3.5 py-2 text-xs text-white placeholder-stone-500 focus:outline-none text-left font-mono"
                    />
                  </div>

                  <div class="space-y-1">
                    <label for="contactSubject" class="block text-xs font-medium text-stone-300">نوع الرسالة:</label>
                    <select
                      id="contactSubject"
                      formControlName="subject"
                      class="w-full bg-stone-900 border border-white/10 focus:border-rose-500 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                    >
                      <option value="suggest">اقتراح رواية جديدة للترجمة</option>
                      <option value="report">الإبلاغ عن خطأ في فصل أو ترجمة</option>
                      <option value="translator">طلب الانضمام كمترجم / مؤلف</option>
                      <option value="general">استفسار عام أو رسالة للفريق</option>
                    </select>
                  </div>

                  <div class="space-y-1">
                    <label for="contactMessage" class="block text-xs font-medium text-stone-300">نص الرسالة:</label>
                    <textarea
                      id="contactMessage"
                      rows="3"
                      formControlName="message"
                      placeholder="اكتب رسالتك هنا..."
                      class="w-full bg-stone-900 border border-white/10 focus:border-rose-500 rounded-xl px-3.5 py-2 text-xs text-white placeholder-stone-500 focus:outline-none resize-none"
                    ></textarea>
                  </div>

                  <button
                    type="submit"
                    [disabled]="contactForm.invalid || isSubmittingContact()"
                    class="w-full py-2.5 rounded-xl bg-gradient-to-l from-rose-600 to-rose-700 hover:from-rose-500 text-white font-bold text-xs shadow-md transition-all cursor-pointer disabled:opacity-40 flex items-center justify-center gap-1.5"
                  >
                    <mat-icon class="text-sm">send</mat-icon>
                    <span>{{ isSubmittingContact() ? 'جاري الإرسال...' : 'إرسال الرسالة الآن' }}</span>
                  </button>
                </form>
              }
            }

            <div class="pt-2 text-center">
              <button
                type="button"
                (click)="closeModal()"
                class="text-xs text-stone-400 hover:text-white transition-colors cursor-pointer"
              >
                إغلاق النافذة
              </button>
            </div>

          </div>

        </div>
      }

    </footer>
  `,
})
export class Footer {
  private readonly store = inject(NovelStore);
  private readonly router = inject(Router);

  readonly activeModal = signal<InfoModalType>(null);
  readonly toastMessage = signal<string | null>(null);
  readonly isSubscribing = signal<boolean>(false);
  readonly isSubmittingContact = signal<boolean>(false);

  readonly newsletterForm = new FormGroup({
    email: new FormControl<string>('', {
      nonNullable: true,
      validators: [Validators.required, Validators.email],
    }),
  });

  readonly contactForm = new FormGroup({
    name: new FormControl<string>('', {
      nonNullable: true,
      validators: [Validators.required, Validators.minLength(2)],
    }),
    email: new FormControl<string>('', {
      nonNullable: true,
      validators: [Validators.required, Validators.email],
    }),
    subject: new FormControl<string>('suggest', { nonNullable: true }),
    message: new FormControl<string>('', {
      nonNullable: true,
      validators: [Validators.required, Validators.minLength(5)],
    }),
  });

  openModal(type: InfoModalType): void {
    this.activeModal.set(type);
  }

  closeModal(): void {
    this.activeModal.set(null);
  }

  getModalTitle(): string {
    switch (this.activeModal()) {
      case 'about':
        return 'عن منصة مقاتل الروايات';
      case 'guide':
        return 'دليل المترجمين والمؤلفين';
      case 'privacy':
        return 'سياسة الخصوصية وحماية البيانات';
      case 'contact':
        return 'اتصل بفريق مقاتل الروايات';
      default:
        return '';
    }
  }

  getModalIcon(): string {
    switch (this.activeModal()) {
      case 'about':
        return 'shield';
      case 'guide':
        return 'edit_note';
      case 'privacy':
        return 'policy';
      case 'contact':
        return 'contact_support';
      default:
        return 'info';
    }
  }

  filterCategory(genreId: string): void {
    this.store.selectedCategoryFilter.set(genreId);
    this.router.navigate(['/']);
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 400, behavior: 'smooth' });
    }
    this.showToast(`تم تفعيل تصنيف: ${this.getCategoryLabel(genreId)}`);
  }

  private getCategoryLabel(id: string): string {
    switch (id) {
      case 'fantasy':
        return 'فانتازيا وخيال ملحمي';
      case 'translated':
        return 'روايات مترجمة حصرية';
      case 'mystery':
        return 'غموض وتشويق';
      case 'history':
        return 'أدب وتاريخ عربي';
      default:
        return 'كافة الروايات';
    }
  }

  onSubscribeNewsletter(): void {
    if (this.newsletterForm.invalid) return;

    this.isSubscribing.set(true);
    const email = this.newsletterForm.controls.email.value;

    setTimeout(() => {
      this.isSubscribing.set(false);
      this.newsletterForm.reset();
      this.showToast(`شكراً لاشتراكك! ستصلك أحدث الفصول على: ${email}`);
    }, 600);
  }

  onSubmitContact(): void {
    if (this.contactForm.invalid) return;

    this.isSubmittingContact.set(true);
    setTimeout(() => {
      this.isSubmittingContact.set(false);
      this.contactForm.reset({ subject: 'suggest' });
      this.closeModal();
      this.showToast('تم إرسال رسالتك بنجاح إلى فريق مقاتل الروايات، وسنتواصل معك قريباً!');
    }, 700);
  }

  resetSampleData(): void {
    if (confirm('هل ترغب في استعادة الروايات الافتراضية وإعادة ضبط الفصول الأولية؟')) {
      this.store.resetToDefault();
      this.showToast('تمت استعادة الروايات الافتراضية بنجاح.');
    }
  }

  scrollToTop(): void {
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  private showToast(msg: string): void {
    this.toastMessage.set(msg);
    setTimeout(() => {
      if (this.toastMessage() === msg) {
        this.toastMessage.set(null);
      }
    }, 4000);
  }
}
