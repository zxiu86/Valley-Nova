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
import firebaseConfig from './firebase-applet-config.json';

export interface UserProfileData {
  id: string;
  email: string;
  displayName: string;
  photoURL?: string;
  coverURL?: string;
  createdAt: string;
  updatedAt: string;
}

const DEFAULT_COVER_URL = 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=1500&auto=format&fit=crop';

@Injectable({
  providedIn: 'root',
})
export class AuthStore {
  private readonly router = inject(Router);

  // Firebase project configuration metadata
  readonly projectId = firebaseConfig.projectId || 'bamboo-year-kn2tx';
  readonly firebaseSettingsUrl = `https://console.firebase.google.com/project/${this.projectId}/authentication/settings`;

  // Signals
  readonly user = signal<User | null>(null);
  readonly currentUser = this.user;
  readonly isLoading = signal<boolean>(true);
  readonly authError = signal<string | null>(null);
  readonly actionNotice = signal<string | null>(null);
  readonly unauthorizedDomain = signal<string | null>(null);
  readonly coverURL = signal<string>(DEFAULT_COVER_URL);
  readonly customAvatarURL = signal<string>('');

  // Derived state
  readonly isAuthenticated = computed<boolean>(() => !!this.user());
  readonly displayName = computed<string>(() => {
    const u = this.user();
    if (!u) return '';
    return u.displayName || u.email?.split('@')[0] || 'قارئ';
  });
  readonly userEmail = computed<string>(() => this.user()?.email || '');
  readonly photoURL = computed<string>(() => this.customAvatarURL() || this.user()?.photoURL || '');

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

      // Load cached local avatar & cover if available
      const localCover = typeof window !== 'undefined' ? localStorage.getItem(`muqatil_cover_${firebaseUser.uid}`) : null;
      const localAvatar = typeof window !== 'undefined' ? localStorage.getItem(`muqatil_avatar_${firebaseUser.uid}`) : null;

      if (!snap.exists()) {
        const profile: UserProfileData = {
          id: firebaseUser.uid,
          email: firebaseUser.email || '',
          displayName: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'قارئ مقاتل',
          photoURL: localAvatar || firebaseUser.photoURL || '',
          coverURL: localCover || DEFAULT_COVER_URL,
          createdAt: now,
          updatedAt: now,
        };
        await setDoc(userDocRef, profile);
        this.coverURL.set(profile.coverURL || DEFAULT_COVER_URL);
        if (profile.photoURL) this.customAvatarURL.set(profile.photoURL);
      } else {
        const data = snap.data();
        const effectiveCover = data?.['coverURL'] || localCover || DEFAULT_COVER_URL;
        const effectiveAvatar = data?.['photoURL'] || localAvatar || firebaseUser.photoURL || '';

        this.coverURL.set(effectiveCover);
        if (effectiveAvatar) this.customAvatarURL.set(effectiveAvatar);

        await setDoc(
          userDocRef,
          {
            updatedAt: now,
            displayName: firebaseUser.displayName || data?.['displayName'] || 'قارئ مقاتل',
            photoURL: effectiveAvatar,
            coverURL: effectiveCover,
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
   * Updates display name, circular cropped avatar, and cover banner
   */
  async updateProfileData(params: { displayName?: string; photoURL?: string; coverURL?: string }): Promise<boolean> {
    const u = this.user();
    if (!u) return false;

    this.isLoading.set(true);
    this.authError.set(null);

    try {
      const authUpdates: { displayName?: string; photoURL?: string } = {};
      if (params.displayName !== undefined && params.displayName.trim()) {
        authUpdates.displayName = params.displayName.trim();
      }

      if (params.photoURL !== undefined) {
        if (!params.photoURL.startsWith('data:') || params.photoURL.length < 2048) {
          authUpdates.photoURL = params.photoURL;
        }
        this.customAvatarURL.set(params.photoURL);
        if (typeof window !== 'undefined') {
          try {
            localStorage.setItem(`muqatil_avatar_${u.uid}`, params.photoURL);
          } catch {
            // ignore
          }
        }
      }

      if (Object.keys(authUpdates).length > 0 && auth.currentUser) {
        await updateProfile(auth.currentUser, authUpdates);
      }

      if (params.coverURL !== undefined) {
        this.coverURL.set(params.coverURL);
        if (typeof window !== 'undefined') {
          try {
            localStorage.setItem(`muqatil_cover_${u.uid}`, params.coverURL);
          } catch {
            // ignore
          }
        }
      }

      // Sync to Firestore doc /users/{userId}
      const userDocRef = doc(db, 'users', u.uid);
      const firestoreData: Record<string, unknown> = {
        updatedAt: new Date().toISOString(),
      };
      if (params.displayName !== undefined) firestoreData['displayName'] = params.displayName.trim();
      if (params.photoURL !== undefined) firestoreData['photoURL'] = params.photoURL;
      if (params.coverURL !== undefined) firestoreData['coverURL'] = params.coverURL;

      await setDoc(userDocRef, firestoreData, { merge: true });

      // Refresh local user signal
      if (auth.currentUser) {
        this.user.set({ ...auth.currentUser } as User);
      }
      this.actionNotice.set('تم حفظ بيانات الحساب والمظهر بنجاح!');
      setTimeout(() => this.actionNotice.set(null), 3500);
      return true;
    } catch (err) {
      console.error('Failed to update profile data:', err);
      this.authError.set('تعذر حفظ التعديلات في الوقت الحالي.');
      return false;
    } finally {
      this.isLoading.set(false);
    }
  }

  /**
   * Login with Google Popup
   */
  async loginWithGoogle(): Promise<boolean> {
    this.isLoading.set(true);
    this.authError.set(null);
    this.unauthorizedDomain.set(null);

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
    this.unauthorizedDomain.set(null);
  }

  /**
   * User-friendly Arabic error message translator
   */
  private mapAuthErrorMessage(error: unknown): string {
    const code = (error as { code?: string })?.code || '';
    const message = (error as Error)?.message || '';

    // Handle unauthorized domain for OAuth / Google sign-in
    if (code === 'auth/unauthorized-domain' || message.includes('unauthorized-domain')) {
      return 'تسجيل الدخول عبر Google غير متاح حالياً على هذا النطاق. يمكنك استخدام البريد الإلكتروني وكلمة المرور فوراً للمتابعة دون انقطاع.';
    }

    switch (code) {
      case 'auth/user-not-found':
      case 'auth/wrong-password':
      case 'auth/invalid-credential':
        return 'البريد الإلكتروني أو كلمة المرور غير صحيحة.';
      case 'auth/email-already-in-use':
        return 'هذا البريد الإلكتروني مسجل مسبقاً. يرجى اختيار تسجيل الدخول.';
      case 'auth/invalid-email':
        return 'صيغة البريد الإلكتروني غير صالحة.';
      case 'auth/weak-password':
        return 'كلمة المرور ضعيفة. يرجى اختيار كلمة مرور مكوّنة من 6 خانات على الأقل.';
      case 'auth/popup-closed-by-user':
        return 'تم إغلاق نافذة الدخول قبل إتمام العملية.';
      case 'auth/popup-blocked':
        return 'المتصفح حظر النافذة المنبثقة. يرجى السماح بالنوافذ المنبثقة.';
      case 'auth/too-many-requests':
        return 'تم إجراء عدة محاولات متتالية. يرجى الانتظار دقيقة والمحاولة مجدداً.';
      case 'auth/network-request-failed':
        return 'تعذر الاتصال بالخادم. يرجى التحقق من اتصالك بالإنترنت.';
      default:
        return 'تعذر إتمام العملية في الوقت الحالي. يرجى التحقق من البيانات والمحاولة مجدداً.';
    }
  }
}
