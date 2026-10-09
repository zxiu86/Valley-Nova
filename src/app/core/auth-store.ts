import { computed, inject, Injectable, signal } from '@angular/core';
import { Router } from '@angular/router';
import {
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile,
  User,
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db, handleFirestoreError, OperationType, testFirestoreConnection } from './firebase';

export interface UserProfileData {
  id: string;
  email: string;
  displayName: string;
  photoURL?: string;
  createdAt: string;
  updatedAt: string;
}

@Injectable({
  providedIn: 'root',
})
export class AuthStore {
  private readonly router = inject(Router);

  // Signals
  readonly user = signal<User | null>(null);
  readonly isLoading = signal<boolean>(true);
  readonly authError = signal<string | null>(null);
  readonly actionNotice = signal<string | null>(null);

  // Derived state
  readonly isAuthenticated = computed<boolean>(() => !!this.user());
  readonly displayName = computed<string>(() => {
    const u = this.user();
    if (!u) return '';
    return u.displayName || u.email?.split('@')[0] || 'قارئ';
  });
  readonly userEmail = computed<string>(() => this.user()?.email || '');
  readonly photoURL = computed<string>(() => this.user()?.photoURL || '');

  constructor() {
    this.init();
  }

  private init(): void {
    if (typeof window === 'undefined') {
      this.isLoading.set(false);
      return;
    }

    // Verify Firestore connection in background
    testFirestoreConnection().catch(err => {
      console.warn('Initial Firestore connection check notice:', err);
    });

    // Listen to Firebase Auth state changes
    onAuthStateChanged(
      auth,
      async (firebaseUser) => {
        this.user.set(firebaseUser);
        this.isLoading.set(false);
        this.authError.set(null);

        if (firebaseUser) {
          // Sync or create user profile in Firestore
          await this.syncUserProfile(firebaseUser);
        }
      },
      (error) => {
        console.error('Auth state change error:', error);
        this.authError.set('حدث خطأ في مزامنة جلسة المستخدم.');
        this.isLoading.set(false);
      }
    );
  }

  /**
   * Syncs user profile document in Firestore: /users/{userId}
   */
  private async syncUserProfile(firebaseUser: User): Promise<void> {
    const userDocRef = doc(db, 'users', firebaseUser.uid);
    try {
      const snap = await getDoc(userDocRef);
      const now = new Date().toISOString();

      if (!snap.exists()) {
        const profile: UserProfileData = {
          id: firebaseUser.uid,
          email: firebaseUser.email || '',
          displayName: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'قارئ مقاتل',
          photoURL: firebaseUser.photoURL || '',
          createdAt: now,
          updatedAt: now,
        };
        await setDoc(userDocRef, profile);
      } else {
        await setDoc(
          userDocRef,
          {
            updatedAt: now,
            displayName: firebaseUser.displayName || snap.data()?.['displayName'] || 'قارئ مقاتل',
            photoURL: firebaseUser.photoURL || snap.data()?.['photoURL'] || '',
          },
          { merge: true }
        );
      }
    } catch (error) {
      console.warn('Could not sync user profile to Firestore (may be offline or restricted):', error);
      if (error instanceof Error && error.message.toLowerCase().includes('permission')) {
        handleFirestoreError(error, OperationType.WRITE, `users/${firebaseUser.uid}`);
      }
    }
  }

  /**
   * Login with Google Popup
   */
  async loginWithGoogle(): Promise<boolean> {
    this.isLoading.set(true);
    this.authError.set(null);

    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });
      const cred = await signInWithPopup(auth, provider);
      await this.syncUserProfile(cred.user);
      this.actionNotice.set('تم تسجيل الدخول بنجاح عبر حساب Google!');
      setTimeout(() => this.actionNotice.set(null), 4000);
      return true;
    } catch (err: unknown) {
      console.error('Google Sign-in failed:', err);
      const msg = this.mapAuthErrorMessage(err);
      this.authError.set(msg);
      return false;
    } finally {
      this.isLoading.set(false);
    }
  }

  /**
   * Login with Email and Password
   */
  async loginWithEmail(email: string, pass: string): Promise<boolean> {
    this.isLoading.set(true);
    this.authError.set(null);

    try {
      const cred = await signInWithEmailAndPassword(auth, email.trim(), pass);
      await this.syncUserProfile(cred.user);
      this.actionNotice.set('مرحباً بك! تم تسجيل الدخول بنجاح.');
      setTimeout(() => this.actionNotice.set(null), 4000);
      return true;
    } catch (err: unknown) {
      console.error('Email Sign-in failed:', err);
      const msg = this.mapAuthErrorMessage(err);
      this.authError.set(msg);
      return false;
    } finally {
      this.isLoading.set(false);
    }
  }

  /**
   * Register with Email, Password and Display Name
   */
  async registerWithEmail(email: string, pass: string, displayName: string): Promise<boolean> {
    this.isLoading.set(true);
    this.authError.set(null);

    try {
      const cred = await createUserWithEmailAndPassword(auth, email.trim(), pass);
      if (displayName.trim()) {
        await updateProfile(cred.user, { displayName: displayName.trim() });
      }
      await this.syncUserProfile(cred.user);
      this.actionNotice.set('تم إنشاء حسابك الجديد بنجاح في مقاتل الروايات!');
      setTimeout(() => this.actionNotice.set(null), 4000);
      return true;
    } catch (err: unknown) {
      console.error('Email Registration failed:', err);
      const msg = this.mapAuthErrorMessage(err);
      this.authError.set(msg);
      return false;
    } finally {
      this.isLoading.set(false);
    }
  }

  /**
   * Send Password Reset Email
   */
  async resetPassword(email: string): Promise<boolean> {
    if (!email.trim()) {
      this.authError.set('يرجى إدخال البريد الإلكتروني لإرسال رابط الاستعادة.');
      return false;
    }

    this.isLoading.set(true);
    this.authError.set(null);

    try {
      await sendPasswordResetEmail(auth, email.trim());
      this.actionNotice.set('تم إرسال رابط إعادة تعيين كلمة المرور إلى بريدك الإلكتروني.');
      setTimeout(() => this.actionNotice.set(null), 5000);
      return true;
    } catch (err: unknown) {
      console.error('Password reset failed:', err);
      const msg = this.mapAuthErrorMessage(err);
      this.authError.set(msg);
      return false;
    } finally {
      this.isLoading.set(false);
    }
  }

  /**
   * Sign Out
   */
  async logout(): Promise<void> {
    try {
      await signOut(auth);
      this.user.set(null);
      this.actionNotice.set('تم تسجيل الخروج بنجاح.');
      setTimeout(() => this.actionNotice.set(null), 3000);
      this.router.navigate(['/']);
    } catch (err) {
      console.error('Sign-out error:', err);
    }
  }

  clearErrors(): void {
    this.authError.set(null);
    this.actionNotice.set(null);
  }

  /**
   * User-friendly Arabic error message translator
   */
  private mapAuthErrorMessage(error: unknown): string {
    const code = (error as { code?: string })?.code || '';
    switch (code) {
      case 'auth/user-not-found':
      case 'auth/wrong-password':
      case 'auth/invalid-credential':
        return 'البريد الإلكتروني أو كلمة المرور غير صحيحة.';
      case 'auth/email-already-in-use':
        return 'هذا البريد الإلكتروني مسجل بالفعل. يمكنك تسجيل الدخول بدلاً من ذلك.';
      case 'auth/invalid-email':
        return 'صيغة البريد الإلكتروني غير صالحة.';
      case 'auth/weak-password':
        return 'كلمة المرور ضعيفة جداً. يرجى اختيار كلمة مرور أطول من 6 أحرف.';
      case 'auth/popup-closed-by-user':
        return 'تم إغلاق نافذة تسجيل الدخول قبل إتمام العملية.';
      case 'auth/popup-blocked':
        return 'تم حظر النافذة المنبثقة من قبل المتصفح. يرجى السماح بالنوافذ المنبثقة.';
      case 'auth/too-many-requests':
        return 'تم إجراء محاولات كثيرة خاطئة. يرجى المحاولة بعد قليل.';
      case 'auth/network-request-failed':
        return 'تعذر الاتصال بالشبكة. يرجى التحقق من اتصال الإنترنت.';
      default:
        return 'حدث خطأ أثناء المصادقة: ' + ((error as Error)?.message || 'يرجى المحاولة مجدداً');
    }
  }
}
