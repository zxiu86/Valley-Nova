import { Injectable, PLATFORM_ID, computed, inject, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { FormControl, FormGroup } from '@angular/forms';
import type { User, Unsubscribe } from 'firebase/auth';
import {
  StoredUserProfile,
  ensureUserDocumentsOnLogin,
  getUserBookmarksFromFirestore,
  getUserProfileFromFirestore,
  loginWithEmail,
  loginWithGoogle,
  logoutFirebaseUser,
  refreshAuthTokenIfNeeded,
  registerWithEmail,
  subscribeToAuthState,
  subscribeToTokenState,
  verifyFirestoreConnection,
  waitForAuthSessionReady,
} from '../mtx-firebase';
import { AccountService } from './account.service';

const AUTH_HINT_KEY = 'mtx_auth_display_hint';

export interface AuthDisplayHint {
  uid: string;
  displayName: string;
  email: string;
  photoURL: string;
}

export function extractFirebaseErrorCode(err: unknown): string {
  if (
    err &&
    typeof err === 'object' &&
    'code' in err &&
    typeof (err as { code?: unknown }).code === 'string'
  ) {
    return (err as { code: string }).code.toLowerCase();
  }
  const msg = err instanceof Error ? err.message : String(err ?? '');
  const match = msg.match(/auth\/[a-z0-9-]+/i);
  return match ? match[0].toLowerCase() : '';
}

export function mapGoogleAuthErrorMessage(err: unknown, hostname = ''): string | null {
  const code = extractFirebaseErrorCode(err);
  const msg = err instanceof Error ? err.message : String(err ?? '');

  if (code === 'auth/popup-closed-by-user' || msg.includes('popup-closed-by-user')) {
    return null;
  }
  if (code === 'auth/cancelled-popup-request' || msg.includes('cancelled-popup-request')) {
    return 'تم إلغاء نافذة تسجيل الدخول السابقة، يرجى الضغط مرة أخرى والمتابعة من النافذة الجديدة.';
  }
  if (code === 'auth/unauthorized-domain' || msg.includes('unauthorized-domain')) {
    const hostSuffix = hostname ? ` (${hostname})` : '';
    return `النطاق الحالي${hostSuffix} غير مضاف ضمن النطاقات المصرح بها في Firebase. أضفه من لوحة Firebase: Authentication ← Settings ← Authorized domains.`;
  }
  if (code === 'auth/operation-not-allowed' || msg.includes('operation-not-allowed')) {
    return 'تسجيل الدخول عبر Google غير مفعّل في مشروع Firebase. يرجى تفعيله من: Authentication ← Sign-in method ← Google.';
  }
  if (code === 'auth/popup-blocked' || msg.includes('popup-blocked')) {
    return 'تم حظر النافذة المنبثقة لتسجيل الدخول عبر جوجل من قِبل المتصفح. يرجى السماح بالنوافذ المنبثقة لهذا الموقع ثم المحاولة مجدداً.';
  }
  if (
    code === 'auth/account-exists-with-different-credential' ||
    msg.includes('account-exists-with-different-credential')
  ) {
    return 'هذا البريد الإلكتروني مسجل مسبقاً بكلمة مرور. يرجى تسجيل الدخول عبر البريد الإلكتروني وكلمة المرور.';
  }
  if (code === 'auth/network-request-failed' || msg.includes('network-request-failed')) {
    return 'تعذر الاتصال بخوادم جوجل، يرجى التحقق من اتصالك بالإنترنت والمحاولة مجدداً.';
  }
  if (
    code === 'auth/invalid-api-key' ||
    code === 'auth/api-key-not-valid' ||
    msg.includes('api-key-not-valid')
  ) {
    return 'مفتاح Firebase API مقيّد لنطاق آخر أو غير صالح في إعدادات Google Cloud Console.';
  }

  const codeTag = code ? ` (${code})` : '';
  return `تعذر تسجيل الدخول عبر جوجل${codeTag}، يرجى المحاولة لاحقاً.`;
}

export function mapEmailAuthErrorMessage(err: unknown, mode: 'login' | 'register'): string {
  const code = extractFirebaseErrorCode(err);
  const msg = err instanceof Error ? err.message : String(err ?? '');

  if (
    code === 'auth/user-not-found' ||
    code === 'auth/invalid-credential' ||
    code === 'auth/wrong-password' ||
    msg.includes('user-not-found') ||
    msg.includes('invalid-credential') ||
    msg.includes('wrong-password')
  ) {
    return 'البريد الإلكتروني أو كلمة المرور غير صحيحة';
  }
  if (code === 'auth/invalid-email' || msg.includes('invalid-email')) {
    return 'صيغة البريد الإلكتروني غير صالحة';
  }
  if (code === 'auth/email-already-in-use' || msg.includes('email-already-in-use')) {
    return 'هذا البريد الإلكتروني مسجل مسبقاً، يمكنك تسجيل الدخول بدلاً من ذلك';
  }
  if (code === 'auth/weak-password' || msg.includes('weak-password')) {
    return 'كلمة المرور ضعيفة جداً، يرجى اختيار كلمة مرور من ٦ أحرف على الأقل';
  }
  if (code === 'auth/too-many-requests' || msg.includes('too-many-requests')) {
    return 'تم تقييد المحاولات مؤقتاً لكثرة الطلبات، يرجى الانتظار قليلاً ثم المحاولة';
  }
  if (code === 'auth/network-request-failed' || msg.includes('network-request-failed')) {
    return 'تعذر الاتصال بخوادم المصادقة، يرجى التحقق من اتصال الإنترنت';
  }

  return mode === 'login'
    ? 'تعذر تسجيل الدخول، يرجى التحقق من صحة البيانات أو المحاولة لاحقاً'
    : 'تعذر إنشاء الحساب، يرجى المحاولة لاحقاً';
}

@Injectable({ providedIn: 'root' })
export class AuthSessionService {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly accountService = inject(AccountService);

  readonly authReady = signal<boolean>(false);
  readonly currentUser = signal<User | null>(null);
  readonly userProfile = signal<StoredUserProfile | null>(null);
  readonly authHint = signal<AuthDisplayHint | null>(null);
  readonly authMode = signal<'login' | 'register'>('login');
  readonly authLoading = signal<boolean>(false);
  readonly authError = signal<string | null>(null);

  readonly isAuthenticated = computed(() => Boolean(this.currentUser()));

  readonly displayName = computed(() => {
    return (
      this.accountService.ownProfile()?.displayName ||
      this.userProfile()?.displayName ||
      this.currentUser()?.displayName ||
      this.authHint()?.displayName ||
      'قارئ أروقة الخلود'
    );
  });

  readonly displayEmail = computed(() => {
    return (
      this.accountService.ownProfile()?.email ||
      this.userProfile()?.email ||
      this.currentUser()?.email ||
      this.authHint()?.email ||
      ''
    );
  });

  readonly photoUrl = computed(() => {
    return (
      this.accountService.ownProfile()?.photoURL ||
      this.userProfile()?.photoURL ||
      this.currentUser()?.photoURL ||
      this.authHint()?.photoURL ||
      ''
    );
  });

  readonly authLoginForm = new FormGroup({
    email: new FormControl('', { nonNullable: true }),
    password: new FormControl('', { nonNullable: true }),
  });

  readonly authRegisterForm = new FormGroup({
    displayName: new FormControl('', { nonNullable: true }),
    email: new FormControl('', { nonNullable: true }),
    password: new FormControl('', { nonNullable: true }),
  });

  private authUnsubscribe: Unsubscribe | null = null;
  private tokenUnsubscribe: Unsubscribe | null = null;
  private initialized = false;
  private onBookmarksSyncedCallback: ((ids: string[]) => void) | null = null;
  private onAuthRestoredCallback: ((user: User | null) => void) | null = null;

  registerSyncCallbacks(options: {
    onBookmarksSynced?: (ids: string[]) => void;
    onAuthRestored?: (user: User | null) => void;
  }): void {
    this.onBookmarksSyncedCallback = options.onBookmarksSynced || null;
    this.onAuthRestoredCallback = options.onAuthRestored || null;
  }

  async init(): Promise<void> {
    if (this.initialized || !isPlatformBrowser(this.platformId)) return;
    this.initialized = true;

    this.restoreDisplayHint();
    verifyFirestoreConnection().catch(() => false);

    try {
      const initialUser = await waitForAuthSessionReady();
      this.currentUser.set(initialUser);

      if (initialUser) {
        this.saveDisplayHint(initialUser);
        await refreshAuthTokenIfNeeded(initialUser);
        await ensureUserDocumentsOnLogin(initialUser).catch((err) => {
          console.warn('Initial user Firestore doc sync warning:', err);
        });
        await this.loadUserData(initialUser.uid);
      } else {
        this.clearDisplayHint();
        this.accountService.clearOwnerState();
      }
      this.authReady.set(true);
      this.onAuthRestoredCallback?.(initialUser);
    } catch (err) {
      console.warn('Auth initialization readiness warning:', err);
      this.authReady.set(true);
    }

    try {
      this.authUnsubscribe = subscribeToAuthState(async (user) => {
        this.currentUser.set(user);
        this.authReady.set(true);
        if (user) {
          this.saveDisplayHint(user);
          await this.loadUserData(user.uid);
        } else {
          this.userProfile.set(null);
          this.clearDisplayHint();
          this.accountService.clearOwnerState();
        }
      });

      this.tokenUnsubscribe = subscribeToTokenState(async (user) => {
        if (user) {
          await refreshAuthTokenIfNeeded(user);
        }
      });
    } catch (e) {
      console.warn('Firebase Auth state listener warning:', e);
    }
  }

  destroy(): void {
    if (this.authUnsubscribe) {
      this.authUnsubscribe();
      this.authUnsubscribe = null;
    }
    if (this.tokenUnsubscribe) {
      this.tokenUnsubscribe();
      this.tokenUnsubscribe = null;
    }
    this.initialized = false;
  }

  async loadUserData(userId: string): Promise<void> {
    try {
      const [profile, bookmarks] = await Promise.all([
        getUserProfileFromFirestore(userId).catch(() => null),
        getUserBookmarksFromFirestore(userId).catch(() => []),
        this.accountService.loadOwnerAccount(userId).catch(() => false),
      ]);
      if (profile) {
        this.userProfile.set(profile);
      }
      if (bookmarks && bookmarks.length > 0 && this.onBookmarksSyncedCallback) {
        this.onBookmarksSyncedCallback(bookmarks);
      }
    } catch (err) {
      console.warn('Error loading user data from Firestore:', err);
    }
  }

  async loginWithEmailForm(): Promise<User | null> {
    const email = this.authLoginForm.controls.email.value.trim();
    const pass = this.authLoginForm.controls.password.value;
    if (!email || !pass) {
      this.authError.set('يرجى إدخال البريد الإلكتروني وكلمة المرور');
      return null;
    }

    this.authLoading.set(true);
    this.authError.set(null);
    try {
      const user = await loginWithEmail(email, pass);
      this.currentUser.set(user);
      this.saveDisplayHint(user);
      await this.loadUserData(user.uid);
      this.authLoginForm.reset();
      return user;
    } catch (err: unknown) {
      this.authError.set(mapEmailAuthErrorMessage(err, 'login'));
      return null;
    } finally {
      this.authLoading.set(false);
    }
  }

  async registerWithEmailForm(): Promise<User | null> {
    const name = this.authRegisterForm.controls.displayName.value.trim();
    const email = this.authRegisterForm.controls.email.value.trim();
    const pass = this.authRegisterForm.controls.password.value;
    if (!email || !pass) {
      this.authError.set('يرجى ملء جميع الحقول المطلوبة');
      return null;
    }
    if (pass.length < 6) {
      this.authError.set('كلمة المرور يجب أن لا تقل عن ٦ أحرف');
      return null;
    }

    this.authLoading.set(true);
    this.authError.set(null);
    try {
      const user = await registerWithEmail(email, pass, name || 'قارئ أروقة الخلود');
      this.currentUser.set(user);
      this.saveDisplayHint(user);
      await this.loadUserData(user.uid);
      this.authRegisterForm.reset();
      return user;
    } catch (err: unknown) {
      this.authError.set(mapEmailAuthErrorMessage(err, 'register'));
      return null;
    } finally {
      this.authLoading.set(false);
    }
  }

  async loginWithGoogleProvider(): Promise<User | null> {
    this.authLoading.set(true);
    this.authError.set(null);
    try {
      const user = await loginWithGoogle();
      this.currentUser.set(user);
      this.saveDisplayHint(user);
      await this.loadUserData(user.uid);
      return user;
    } catch (err: unknown) {
      const code = extractFirebaseErrorCode(err);
      console.error('Google Sign-In error:', code || 'unknown', err);
      const hostname =
        isPlatformBrowser(this.platformId) && typeof window !== 'undefined'
          ? window.location.hostname
          : '';
      const mapped = mapGoogleAuthErrorMessage(err, hostname);
      if (mapped) {
        this.authError.set(mapped);
      }
      return null;
    } finally {
      this.authLoading.set(false);
    }
  }

  async logout(): Promise<void> {
    try {
      await logoutFirebaseUser();
    } finally {
      this.currentUser.set(null);
      this.userProfile.set(null);
      this.clearDisplayHint();
      this.accountService.clearOwnerState();
    }
  }

  private saveDisplayHint(user: User): void {
    const hint: AuthDisplayHint = {
      uid: user.uid,
      displayName: user.displayName || 'قارئ أروقة الخلود',
      email: user.email || '',
      photoURL: user.photoURL || '',
    };
    this.authHint.set(hint);
    try {
      localStorage.setItem(AUTH_HINT_KEY, JSON.stringify(hint));
    } catch {
      // Ignore storage error
    }
  }

  private restoreDisplayHint(): void {
    try {
      const raw = localStorage.getItem(AUTH_HINT_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as AuthDisplayHint;
        if (parsed && parsed.uid) {
          this.authHint.set(parsed);
        }
      }
    } catch {
      // Ignore storage parse error
    }
  }

  private clearDisplayHint(): void {
    this.authHint.set(null);
    try {
      localStorage.removeItem(AUTH_HINT_KEY);
    } catch {
      // Ignore storage error
    }
  }
}
