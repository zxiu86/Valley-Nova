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
        await ensureUserDocumentsOnLogin(initialUser);
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
        getUserProfileFromFirestore(userId),
        getUserBookmarksFromFirestore(userId),
        this.accountService.loadOwnerAccount(userId),
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
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes('user-not-found') || msg.includes('invalid-credential') || msg.includes('wrong-password')) {
        this.authError.set('البريد الإلكتروني أو كلمة المرور غير صحيحة');
      } else if (msg.includes('invalid-email')) {
        this.authError.set('صيغة البريد الإلكتروني غير صالحة');
      } else {
        this.authError.set('تعذر تسجيل الدخول، يرجى التحقق من صحة البيانات أو المحاولة لاحقاً');
      }
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
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes('email-already-in-use')) {
        this.authError.set('هذا البريد الإلكتروني مسجل مسبقاً، يمكنك تسجيل الدخول بدلاً من ذلك');
      } else {
        this.authError.set('تعذر إنشاء الحساب، يرجى المحاولة لاحقاً');
      }
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
      const msg = err instanceof Error ? err.message : String(err);
      if (!msg.includes('popup-closed-by-user')) {
        this.authError.set('تعذر تسجيل الدخول عبر جوجل، يرجى المحاولة لاحقاً');
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
