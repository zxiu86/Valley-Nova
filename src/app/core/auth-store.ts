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
import { collection, doc, getDoc, getDocs, query, setDoc, where } from 'firebase/firestore';
import { auth, db, testFirestoreConnection } from './firebase';
import { AppRole, RoleRequest, UserRoleRecord } from './novel-models';
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

  // Roles & Permissions state
  readonly userRole = signal<AppRole | null>(null);
  readonly userRoleStatus = signal<'active' | 'revoked' | 'none'>('none');
  readonly myRequests = signal<RoleRequest[]>([]);
  readonly allPendingRequests = signal<RoleRequest[]>([]);

  readonly guestDisplayName = signal<string>(
    typeof window !== 'undefined' ? localStorage.getItem('muqatil_guest_name') || 'قارئ مقاتل' : 'قارئ مقاتل'
  );
  readonly coverURL = signal<string>(
    typeof window !== 'undefined' ? localStorage.getItem('muqatil_guest_cover') || DEFAULT_COVER_URL : DEFAULT_COVER_URL
  );
  readonly customAvatarURL = signal<string>(
    typeof window !== 'undefined' ? localStorage.getItem('muqatil_guest_avatar') || '' : ''
  );

  // Derived state
  readonly isAuthenticated = computed<boolean>(() => !!this.user());
  readonly isFounder = computed<boolean>(() => this.userRole() === 'founder');
  readonly isAuditor = computed<boolean>(() => this.userRole() === 'auditor' || this.isFounder());
  readonly isAuthor = computed<boolean>(() => this.userRole() === 'author' || this.isFounder());
  readonly isTranslator = computed<boolean>(() => this.userRole() === 'translate' || this.isFounder());

  // Visible badge: founder has NO visible badge!
  readonly activeBadge = computed<AppRole | null>(() => {
    const role = this.userRole();
    if (!role || role === 'founder') return null;
    return role;
  });

  readonly displayName = computed<string>(() => {
    const u = this.user();
    if (!u) return this.guestDisplayName();
    return u.displayName || u.email?.split('@')[0] || this.guestDisplayName();
  });
  readonly userEmail = computed<string>(() => this.user()?.email || 'غير مسجل (وضع زائر)');
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
          await this.syncUserProfile(firebaseUser);
          await this.resolveUserRole(firebaseUser);
          await this.loadMyRequests(firebaseUser.uid);
          if (this.isFounder()) {
            await this.loadAllPendingRequests();
          }
        } else {
          this.userRole.set(null);
          this.userRoleStatus.set('none');
          this.myRequests.set([]);
          this.allPendingRequests.set([]);
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
   * Strictly permits only display name, avatar, cover and timestamps
   */
  private async syncUserProfile(firebaseUser: User): Promise<void> {
    const userDocRef = doc(db, 'users', firebaseUser.uid);
    try {
      const snap = await getDoc(userDocRef);
      const now = new Date().toISOString();

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
      console.warn('Could not sync user profile to Firestore:', error);
    }
  }

  /**
   * Resolves user role from trusted Firestore collection /user_roles/{userId}
   * and verifies founder setup with server
   */
  async resolveUserRole(firebaseUser: User): Promise<void> {
    try {
      // 1. Check founder setup with server-side endpoint
      try {
        const res = await fetch('/api/founder/verify-setup', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: firebaseUser.email, uid: firebaseUser.uid }),
        });
        if (res.ok) {
          const json = await res.json();
          if (json.isFounder) {
            // Seed founder record if not present
            const now = new Date().toISOString();
            await setDoc(doc(db, 'founders', firebaseUser.uid), {
              userId: firebaseUser.uid,
              createdAt: now,
            }, { merge: true }).catch((e) => { console.warn(e); });

            await setDoc(doc(db, 'user_roles', firebaseUser.uid), {
              userId: firebaseUser.uid,
              role: 'founder',
              status: 'active',
              assignedAt: now,
            }, { merge: true }).catch((e) => { console.warn(e); });

            this.userRole.set('founder');
            this.userRoleStatus.set('active');
            return;
          }
        }
      } catch {
        // Fallback to checking Firestore directly
      }

      // 2. Check /founders/{uid}
      const founderDoc = await getDoc(doc(db, 'founders', firebaseUser.uid)).catch(() => null);
      if (founderDoc && founderDoc.exists()) {
        this.userRole.set('founder');
        this.userRoleStatus.set('active');
        return;
      }

      // 3. Check /user_roles/{uid}
      const roleDoc = await getDoc(doc(db, 'user_roles', firebaseUser.uid)).catch(() => null);
      if (roleDoc && roleDoc.exists()) {
        const data = roleDoc.data() as UserRoleRecord;
        if (data.status === 'active') {
          this.userRole.set(data.role);
          this.userRoleStatus.set('active');
          return;
        } else if (data.status === 'revoked') {
          this.userRole.set(null);
          this.userRoleStatus.set('revoked');
          return;
        }
      }

      this.userRole.set(null);
      this.userRoleStatus.set('none');
    } catch (e) {
      console.warn('Error resolving user role:', e);
      this.userRole.set(null);
      this.userRoleStatus.set('none');
    }
  }

  /**
   * Updates display name, circular cropped avatar, and cover banner
   * Validates inputs. Users may edit only permitted profile fields.
   */
  async updateProfileData(params: { displayName?: string; photoURL?: string; coverURL?: string }): Promise<boolean> {
    const u = this.user();

    // Validation
    if (params.displayName !== undefined) {
      const trimmed = params.displayName.trim();
      if (trimmed.length > 60) {
        this.authError.set('الاسم يجب ألا يتجاوز 60 حرفاً.');
        return false;
      }
    }

    if (!u) {
      if (params.displayName !== undefined && params.displayName.trim()) {
        this.guestDisplayName.set(params.displayName.trim());
        if (typeof window !== 'undefined') localStorage.setItem('muqatil_guest_name', params.displayName.trim());
      }
      if (params.photoURL !== undefined) {
        this.customAvatarURL.set(params.photoURL);
        if (typeof window !== 'undefined') localStorage.setItem('muqatil_guest_avatar', params.photoURL);
      }
      if (params.coverURL !== undefined) {
        this.coverURL.set(params.coverURL);
        if (typeof window !== 'undefined') localStorage.setItem('muqatil_guest_cover', params.coverURL);
      }
      this.actionNotice.set('تم حفظ بيانات المظهر بنجاح!');
      setTimeout(() => this.actionNotice.set(null), 3500);
      return true;
    }

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

      // Sync strictly permitted fields only to Firestore doc /users/{userId}
      const userDocRef = doc(db, 'users', u.uid);
      const firestoreData: Record<string, unknown> = {
        updatedAt: new Date().toISOString(),
      };
      if (params.displayName !== undefined) firestoreData['displayName'] = params.displayName.trim();
      if (params.photoURL !== undefined) firestoreData['photoURL'] = params.photoURL;
      if (params.coverURL !== undefined) firestoreData['coverURL'] = params.coverURL;

      await setDoc(userDocRef, firestoreData, { merge: true });

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
   * Submit a Join Request ("auditor" | "author" | "translate")
   * Requests are stored with 'pending' status. Users cannot approve their own requests.
   */
  async submitRoleRequest(role: 'auditor' | 'author' | 'translate', statement: string): Promise<boolean> {
    const u = this.user();
    if (!u) {
      this.authError.set('يرجى تسجيل الدخول أولاً لتقديم طلب الانضمام.');
      return false;
    }

    // Check if user already has an active role
    if (this.userRole() === role) {
      this.authError.set('أنت تحمل هذه الرتبة بالفعل.');
      return false;
    }

    // Check if user already has a pending request for this role
    const existing = this.myRequests().find(r => r.role === role && r.status === 'pending');
    if (existing) {
      this.authError.set('لديك طلب معلق قيد المراجعة لهذه الرتبة بالفعل.');
      return false;
    }

    this.isLoading.set(true);
    this.authError.set(null);

    try {
      const requestId = `req_${u.uid}_${role}_${Date.now()}`;
      const newRequest: RoleRequest = {
        id: requestId,
        userId: u.uid,
        userEmail: u.email || '',
        userName: this.displayName(),
        role,
        statement: statement.trim(),
        status: 'pending',
        createdAt: new Date().toISOString(),
      };

      await setDoc(doc(db, 'role_requests', requestId), newRequest);
      this.myRequests.update(list => [newRequest, ...list]);
      this.actionNotice.set('تم إرسال طلب الانضمام بنجاح! سيتم فحصه من قِبل الإدارة.');
      setTimeout(() => this.actionNotice.set(null), 4500);
      return true;
    } catch (e) {
      console.error('Failed to submit role request:', e);
      this.authError.set('تعذر إرسال الطلب في الوقت الحالي.');
      return false;
    } finally {
      this.isLoading.set(false);
    }
  }

  /**
   * Load current user's role requests
   */
  async loadMyRequests(uid: string): Promise<void> {
    try {
      const q = query(collection(db, 'role_requests'), where('userId', '==', uid));
      const snap = await getDocs(q);
      const list: RoleRequest[] = [];
      snap.forEach(d => list.push(d.data() as RoleRequest));
      list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      this.myRequests.set(list);
    } catch (e) {
      console.warn('Could not load user role requests:', e);
    }
  }

  /**
   * Load all pending requests (Founder only)
   */
  async loadAllPendingRequests(): Promise<void> {
    if (!this.isFounder()) return;
    try {
      const q = query(collection(db, 'role_requests'), where('status', '==', 'pending'));
      const snap = await getDocs(q);
      const list: RoleRequest[] = [];
      snap.forEach(d => list.push(d.data() as RoleRequest));
      list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      this.allPendingRequests.set(list);
    } catch (e) {
      console.warn('Could not load all pending role requests:', e);
    }
  }

  /**
   * Founder decision on a role request
   */
  async reviewRoleRequest(
    request: RoleRequest,
    decision: 'approved' | 'rejected',
    reason?: string
  ): Promise<boolean> {
    if (!this.isFounder()) return false;
    const u = this.user();
    if (!u) return false;

    this.isLoading.set(true);
    try {
      const now = new Date().toISOString();
      const updatedReq: Partial<RoleRequest> = {
        status: decision,
        reviewedAt: now,
        reviewedBy: u.uid,
        rejectionReason: reason || '',
      };

      await setDoc(doc(db, 'role_requests', request.id), updatedReq, { merge: true });

      if (decision === 'approved') {
        // Activate role in /user_roles/{userId}
        const roleRecord: UserRoleRecord = {
          userId: request.userId,
          role: request.role,
          status: 'active',
          assignedBy: u.uid,
          assignedAt: now,
        };
        await setDoc(doc(db, 'user_roles', request.userId), roleRecord);
      }

      // Record in moderation logs
      const logId = `log_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      await setDoc(doc(db, 'moderation_logs', logId), {
        id: logId,
        targetType: 'request',
        targetId: request.id,
        action: `role_request_${decision}`,
        reason: reason || (decision === 'approved' ? 'استيفاء شروط الانضمام وتوثيق التعهد' : 'عدم استيفاء الشروط'),
        decidedBy: u.uid,
        createdAt: now,
      });

      this.allPendingRequests.update(list => list.filter(r => r.id !== request.id));
      this.actionNotice.set(`تم ${decision === 'approved' ? 'اعتماد' : 'رفض'} الطلب وتحديث السجل.`);
      setTimeout(() => this.actionNotice.set(null), 3500);
      return true;
    } catch (e) {
      console.error('Failed to review role request:', e);
      this.authError.set('تعذر تسجيل القرار في الوقت الحالي.');
      return false;
    } finally {
      this.isLoading.set(false);
    }
  }

  /**
   * Revoke an assigned user role (Founder only)
   */
  async revokeUserRole(userId: string, reason: string): Promise<boolean> {
    if (!this.isFounder()) return false;
    const u = this.user();
    if (!u) return false;

    try {
      const now = new Date().toISOString();
      await setDoc(
        doc(db, 'user_roles', userId),
        {
          status: 'revoked',
          revokedAt: now,
          revokedBy: u.uid,
        },
        { merge: true }
      );

      const logId = `log_revoke_${Date.now()}`;
      await setDoc(doc(db, 'moderation_logs', logId), {
        id: logId,
        targetType: 'user_role',
        targetId: userId,
        action: 'revoke_role',
        reason,
        decidedBy: u.uid,
        createdAt: now,
      });

      this.actionNotice.set('تم سحب الرتبة وتوثيق السبب في السجل الإداري.');
      setTimeout(() => this.actionNotice.set(null), 3500);
      return true;
    } catch (e) {
      console.error('Failed to revoke role:', e);
      return false;
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
      await this.resolveUserRole(cred.user);
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
      await this.resolveUserRole(cred.user);
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
      await this.resolveUserRole(cred.user);
      this.actionNotice.set('تم إنشاء حسابك الجديد بنجاح في صرح أروقة الخلود!');
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
      this.userRole.set(null);
      this.userRoleStatus.set('none');
      this.myRequests.set([]);
      this.allPendingRequests.set([]);
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

  private mapAuthErrorMessage(error: unknown): string {
    const code = (error as { code?: string })?.code || '';
    const message = (error as Error)?.message || '';

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
