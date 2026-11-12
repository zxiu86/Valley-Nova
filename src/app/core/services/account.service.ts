import { Injectable, PLATFORM_ID, computed, inject, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Router } from '@angular/router';
import {
  FullAccountProfile,
  NovelCard,
  PrivacySettings,
  PublishedNovelRecord,
  UsernameCheckResult,
  VerifiedWriterStatus,
  WriterApplication,
  WriterApplicationStatus,
} from '../models/library.models';
import {
  checkUsernameAvailability,
  deleteAppAccountAndData,
  fetchAuthorPublishedNovels,
  fetchPendingWriterApplicationsForAdmin,
  getUserReadChaptersCount,
  getVerifiedWriterStatus,
  getWriterApplicationFromFirestore,
  loadOwnerAccountProfile,
  loadVisitorAccountProfile,
  normalizeUsername,
  resolveUsernameToUid,
  reviewWriterApplicationAsAdmin,
  saveAccountProfileChanges,
  savePrivacySettingsToFirestore,
  submitWriterApplicationToFirestore,
  uploadProfileImageAsset,
} from '../mtx-firebase';

export type ViewedProfileState = 'loading' | 'ok' | 'private' | 'not_found' | 'error';

export interface CroppedImageDraft {
  kind: 'avatar' | 'banner';
  sourceUrl: string;
  naturalWidth: number;
  naturalHeight: number;
  panX: number; // -1 to 1 normalized offset
  panY: number; // -1 to 1 normalized offset
  zoom: number; // 1.0 to 3.0
  blob: Blob | null;
  previewDataUrl: string;
}

const DEFAULT_WRITER_STATUS: VerifiedWriterStatus = {
  isWriterBadge: false,
  canPublish: false,
  isAdmin: false,
  roleRecord: null,
};

@Injectable({ providedIn: 'root' })
export class AccountService {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly router = inject(Router);

  // Authoritative Verified Writer Badge Cache (never trusts client profile flags)
  readonly writerBadgeCache = signal<Record<string, boolean>>({});
  private readonly pendingBadgeLookups = new Set<string>();

  // Owner Authenticated Account State
  readonly ownProfile = signal<FullAccountProfile | null>(null);
  readonly ownWriterStatus = signal<VerifiedWriterStatus>(DEFAULT_WRITER_STATUS);
  readonly ownReadChaptersCount = signal<number>(0);
  readonly ownPublishedNovels = signal<PublishedNovelRecord[]>([]);
  readonly ownApplication = signal<WriterApplication | null>(null);
  readonly pendingAdminApplications = signal<WriterApplication[]>([]);

  readonly ownApplicationStatus = computed<WriterApplicationStatus>(() => {
    return this.ownApplication()?.status ?? 'none';
  });

  readonly isOwnProfileIncomplete = computed(() => {
    const prof = this.ownProfile();
    if (!prof) return false;
    return !prof.username || !prof.bio;
  });

  // Currently Viewed Profile Page State (/profile or /profile/:username)
  readonly viewedState = signal<ViewedProfileState>('loading');
  readonly viewedProfile = signal<FullAccountProfile | null>(null);
  readonly viewedIsOwner = signal<boolean>(false);
  readonly viewedWriterStatus = signal<VerifiedWriterStatus>(DEFAULT_WRITER_STATUS);
  readonly viewedPublishedNovels = signal<PublishedNovelRecord[]>([]);
  readonly viewedVisitorSavedNovels = signal<NovelCard[]>([]);

  // Settings Drawer & Async Operation States
  readonly isSettingsOpen = signal<boolean>(false);
  readonly activeSettingsSection = signal<'edit' | 'privacy' | 'writer' | 'security' | 'admin'>('edit');
  readonly isSavingProfile = signal<boolean>(false);
  readonly isSavingPrivacy = signal<boolean>(false);
  readonly isSubmittingApplication = signal<boolean>(false);
  readonly isDeletingAccount = signal<boolean>(false);
  readonly settingsError = signal<string | null>(null);
  readonly settingsSuccess = signal<string | null>(null);
  readonly usernameCheck = signal<UsernameCheckResult>({
    status: 'idle',
    normalized: '',
    message: '',
    suggestions: [],
  });

  private usernameCheckTimer: ReturnType<typeof setTimeout> | null = null;

  /**
   * Authoritatively verifies whether a given author UID has an active writer role
   * in Firestore `/user_roles/{uid}` for the unified <app-writer-badge /> component.
   */
  verifyWriterBadge(authorUid: string | undefined): boolean {
    if (!authorUid) return false;
    const cache = this.writerBadgeCache();
    if (Object.prototype.hasOwnProperty.call(cache, authorUid)) {
      return cache[authorUid];
    }

    if (isPlatformBrowser(this.platformId) && !this.pendingBadgeLookups.has(authorUid)) {
      this.pendingBadgeLookups.add(authorUid);
      void getVerifiedWriterStatus(authorUid)
        .then((status) => {
          this.writerBadgeCache.update((prev) => ({
            ...prev,
            [authorUid]: status.isWriterBadge,
          }));
        })
        .catch(() => {
          this.writerBadgeCache.update((prev) => ({
            ...prev,
            [authorUid]: false,
          }));
        })
        .finally(() => {
          this.pendingBadgeLookups.delete(authorUid);
        });
    }
    return false;
  }

  async loadOwnerAccount(uid: string): Promise<boolean> {
    if (!uid || !isPlatformBrowser(this.platformId)) return false;

    try {
      const [profile, writerStatus, readCount, appDoc] = await Promise.all([
        loadOwnerAccountProfile(uid),
        getVerifiedWriterStatus(uid).catch(() => DEFAULT_WRITER_STATUS),
        getUserReadChaptersCount(uid).catch(() => 0),
        getWriterApplicationFromFirestore(uid).catch(() => null),
      ]);

      if (profile) {
        this.ownProfile.set(profile);
      }
      this.ownWriterStatus.set(writerStatus);
      this.writerBadgeCache.update((prev) => ({
        ...prev,
        [uid]: writerStatus.isWriterBadge,
      }));
      this.ownReadChaptersCount.set(readCount);
      this.ownApplication.set(appDoc);

      if (writerStatus.canPublish) {
        const works = await fetchAuthorPublishedNovels(uid).catch(() => []);
        this.ownPublishedNovels.set(works);
      } else {
        this.ownPublishedNovels.set([]);
      }

      if (writerStatus.isAdmin) {
        const pending = await fetchPendingWriterApplicationsForAdmin().catch(() => []);
        this.pendingAdminApplications.set(pending);
      } else {
        this.pendingAdminApplications.set([]);
      }

      return Boolean(profile);
    } catch (err) {
      console.warn('Error hydrating owner account:', err);
      return false;
    }
  }

  clearOwnerState(): void {
    this.ownProfile.set(null);
    this.ownWriterStatus.set(DEFAULT_WRITER_STATUS);
    this.ownReadChaptersCount.set(0);
    this.ownPublishedNovels.set([]);
    this.ownApplication.set(null);
    this.pendingAdminApplications.set([]);
    this.isSettingsOpen.set(false);
    this.settingsError.set(null);
    this.settingsSuccess.set(null);
  }

  async openProfileView(
    usernameParam: string | null,
    currentUid: string | null
  ): Promise<void> {
    this.viewedState.set('loading');
    this.viewedVisitorSavedNovels.set([]);
    this.viewedPublishedNovels.set([]);

    if (!isPlatformBrowser(this.platformId)) {
      this.viewedState.set('not_found');
      return;
    }

    // 1. Bare /profile route -> show authenticated owner's profile
    if (!usernameParam) {
      if (!currentUid) {
        this.viewedState.set('not_found');
        return;
      }
      const ok = await this.loadOwnerAccount(currentUid);
      const prof = this.ownProfile();
      if (!ok || !prof) {
        this.viewedState.set('error');
        return;
      }
      this.viewedIsOwner.set(true);
      this.viewedProfile.set(prof);
      this.viewedWriterStatus.set(this.ownWriterStatus());
      this.viewedPublishedNovels.set(this.ownPublishedNovels());
      this.viewedState.set('ok');
      return;
    }

    // 2. /profile/:username route -> resolve username (with legacy redirect support)
    const normalized = normalizeUsername(usernameParam);
    let resolved: { uid: string | null; redirectedTo?: string };
    try {
      resolved = await resolveUsernameToUid(normalized);
    } catch {
      this.viewedIsOwner.set(false);
      this.viewedProfile.set(null);
      this.viewedState.set('error');
      return;
    }

    if (!resolved.uid) {
      this.viewedIsOwner.set(false);
      this.viewedProfile.set(null);
      this.viewedState.set('not_found');
      return;
    }

    if (resolved.redirectedTo && resolved.redirectedTo !== normalized) {
      await this.router.navigate(['/profile', resolved.redirectedTo], { replaceUrl: true });
      return;
    }

    const targetUid = resolved.uid;
    const isOwner = Boolean(currentUid && currentUid === targetUid);
    this.viewedIsOwner.set(isOwner);

    if (isOwner) {
      const ok = await this.loadOwnerAccount(targetUid);
      const prof = this.ownProfile();
      if (!ok || !prof) {
        this.viewedState.set('error');
        return;
      }
      this.viewedProfile.set(prof);
      this.viewedWriterStatus.set(this.ownWriterStatus());
      this.viewedPublishedNovels.set(this.ownPublishedNovels());
      this.viewedState.set('ok');
      return;
    }

    // 3. Visitor viewing another user's public/private profile
    const [visitorRes, writerStatus] = await Promise.all([
      loadVisitorAccountProfile(targetUid),
      getVerifiedWriterStatus(targetUid).catch(() => DEFAULT_WRITER_STATUS),
    ]);

    this.viewedWriterStatus.set(writerStatus);
    this.writerBadgeCache.update((prev) => ({
      ...prev,
      [targetUid]: writerStatus.isWriterBadge,
    }));

    if (visitorRes.state !== 'ok' || !visitorRes.profile) {
      this.viewedProfile.set(null);
      this.viewedState.set(visitorRes.state);
      return;
    }

    this.viewedProfile.set(visitorRes.profile);
    this.viewedVisitorSavedNovels.set(visitorRes.savedNovels || []);

    if (writerStatus.canPublish) {
      const works = await fetchAuthorPublishedNovels(targetUid).catch(() => []);
      this.viewedPublishedNovels.set(works);
    }

    this.viewedState.set('ok');
  }

  // ================= USERNAME AVAILABILITY CHECK ================= //

  scheduleUsernameCheck(rawUsername: string, uid?: string, currentUsername?: string): void {
    if (this.usernameCheckTimer) {
      clearTimeout(this.usernameCheckTimer);
      this.usernameCheckTimer = null;
    }

    const norm = normalizeUsername(rawUsername);
    if (!norm) {
      this.usernameCheck.set({ status: 'idle', normalized: '', message: '', suggestions: [] });
      return;
    }

    this.usernameCheck.set({
      status: 'checking',
      normalized: norm,
      message: 'جارٍ التحقق من توفر اسم المستخدم...',
      suggestions: [],
    });

    this.usernameCheckTimer = setTimeout(() => {
      void checkUsernameAvailability(rawUsername, uid, currentUsername).then((result) => {
        this.usernameCheck.set(result);
      });
    }, 320);
  }

  // ================= INLINE PROFILE & IMAGE SAVE ================= //

  async saveProfileEdits(
    uid: string,
    payload: {
      displayName: string;
      username: string;
      bio: string;
      avatarDraft: CroppedImageDraft | null;
      bannerDraft: CroppedImageDraft | null;
    }
  ): Promise<boolean> {
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      this.settingsError.set('لا يوجد اتصال بالإنترنت حالياً. يرجى المحاولة بعد استعادة الاتصال.');
      return false;
    }

    const current = this.ownProfile();
    if (!current) {
      this.settingsError.set('تعذر العثور على بيانات الحساب الحالية.');
      return false;
    }

    this.isSavingProfile.set(true);
    this.settingsError.set(null);
    this.settingsSuccess.set(null);

    try {
      // Re-validate username if entered
      const nextUsernameInput = payload.username.trim();
      if (nextUsernameInput) {
        const check = await checkUsernameAvailability(nextUsernameInput, uid, current.username);
        this.usernameCheck.set(check);
        if (check.status !== 'available' && check.status !== 'unchanged') {
          throw new Error(check.message || 'اسم المستخدم غير متاح.');
        }
      }

      // Upload cropped images ONLY now when user explicitly confirms Save
      let finalPhotoURL = current.photoURL || '';
      if (payload.avatarDraft?.blob && payload.avatarDraft.previewDataUrl) {
        finalPhotoURL = await uploadProfileImageAsset(
          uid,
          'avatar',
          payload.avatarDraft.blob,
          payload.avatarDraft.previewDataUrl,
          current.photoURL
        );
      }

      let finalCoverURL = current.coverURL || '';
      if (payload.bannerDraft?.blob && payload.bannerDraft.previewDataUrl) {
        finalCoverURL = await uploadProfileImageAsset(
          uid,
          'banner',
          payload.bannerDraft.blob,
          payload.bannerDraft.previewDataUrl,
          current.coverURL
        );
      }

      const privacy: PrivacySettings = {
        isPublic: current.isPublic,
        showSavedNovels: current.showSavedNovels,
        showReadingHistory: current.showReadingHistory,
        showProfileInfo: current.showProfileInfo,
      };

      const { savedUsername } = await saveAccountProfileChanges(
        uid,
        {
          displayName: payload.displayName,
          username: nextUsernameInput,
          bio: payload.bio,
          photoURL: finalPhotoURL,
          coverURL: finalCoverURL,
        },
        current.username,
        privacy
      );

      await this.loadOwnerAccount(uid);
      if (this.viewedIsOwner() && this.ownProfile()) {
        this.viewedProfile.set(this.ownProfile());
      }

      // Sync public profile URL immediately if username changed or was newly set
      if (savedUsername && savedUsername !== current.username) {
        await this.router.navigate(['/profile', savedUsername], { replaceUrl: true });
      }

      this.settingsSuccess.set('تم حفظ بيانات الملف الشخصي والصور بنجاح.');
      return true;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'تعذر حفظ التغييرات، يرجى المحاولة لاحقاً.';
      this.settingsError.set(msg);
      return false;
    } finally {
      this.isSavingProfile.set(false);
    }
  }

  async savePrivacy(uid: string, privacy: PrivacySettings): Promise<boolean> {
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      this.settingsError.set('لا يوجد اتصال بالإنترنت لحفظ إعدادات الخصوصية.');
      return false;
    }

    const current = this.ownProfile();
    if (!current) return false;

    this.isSavingPrivacy.set(true);
    this.settingsError.set(null);
    this.settingsSuccess.set(null);

    try {
      await savePrivacySettingsToFirestore(uid, privacy, current.username);
      const updated: FullAccountProfile = {
        ...current,
        ...privacy,
        updatedAt: new Date().toISOString(),
      };
      this.ownProfile.set(updated);
      if (this.viewedIsOwner()) {
        this.viewedProfile.set(updated);
      }
      this.settingsSuccess.set('تم تحديث وتطبيق إعدادات الخصوصية على قاعدة البيانات.');
      return true;
    } catch {
      this.settingsError.set('فشل حفظ إعدادات الخصوصية، يرجى المحاولة مجدداً.');
      return false;
    } finally {
      this.isSavingPrivacy.set(false);
    }
  }

  // ================= WRITER APPLICATION ================= //

  async submitWriterApplication(
    uid: string,
    payload: {
      penName: string;
      shortBio: string;
      genres: string[];
      writingSample: string;
    }
  ): Promise<boolean> {
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      this.settingsError.set('تعذر إرسال الطلب بسبب انقطاع الاتصال بالإنترنت.');
      return false;
    }

    this.isSubmittingApplication.set(true);
    this.settingsError.set(null);
    this.settingsSuccess.set(null);

    try {
      const appDoc = await submitWriterApplicationToFirestore(uid, payload);
      this.ownApplication.set(appDoc);
      this.settingsSuccess.set('تم إرسال طلب الانضمام ككاتب إلى الإدارة للمراجعة بنجاح.');
      return true;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'تعذر إرسال الطلب حالياً.';
      this.settingsError.set(msg);
      return false;
    } finally {
      this.isSubmittingApplication.set(false);
    }
  }

  async reviewApplication(
    applicantUid: string,
    decision: 'approved' | 'rejected',
    adminUid: string,
    reviewNote = ''
  ): Promise<boolean> {
    this.settingsError.set(null);
    this.settingsSuccess.set(null);
    try {
      await reviewWriterApplicationAsAdmin(applicantUid, decision, adminUid, reviewNote);
      this.pendingAdminApplications.update((list) =>
        list.filter((item) => item.userId !== applicantUid)
      );
      if (decision === 'approved') {
        this.writerBadgeCache.update((prev) => ({ ...prev, [applicantUid]: true }));
        if (applicantUid === this.ownProfile()?.uid) {
          await this.loadOwnerAccount(applicantUid);
        }
      }
      this.settingsSuccess.set(
        decision === 'approved' ? 'تمت الموافقة ومنح صلاحية الكاتب بنجاح.' : 'تم رفض الطلب مع حفظ النتيجة.'
      );
      return true;
    } catch {
      this.settingsError.set('تعذر تنفيذ قرار المراجعة. تحقق من الصلاحيات.');
      return false;
    }
  }

  // ================= PERMANENT ACCOUNT DELETION ================= //

  async deleteOwnAccount(uid: string, passwordForReauth?: string): Promise<boolean> {
    const profile = this.ownProfile();
    this.isDeletingAccount.set(true);
    this.settingsError.set(null);

    try {
      await deleteAppAccountAndData(uid, {
        username: profile?.username,
        photoURL: profile?.photoURL,
        coverURL: profile?.coverURL,
        passwordForReauth,
      });

      this.clearOwnerState();
      this.viewedProfile.set(null);
      try {
        localStorage.removeItem('mtx_auth_display_hint');
        localStorage.removeItem('mtx_local_bookmarks');
        localStorage.removeItem('mtx_nav_state_v1');
      } catch {
        // Ignore storage error
      }
      return true;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg === 'PASSWORD_REQUIRED') {
        this.settingsError.set('يرجى إدخال كلمة المرور لإعادة المصادقة قبل الحذف النهائي.');
      } else if (msg.includes('popup-closed-by-user')) {
        this.settingsError.set('تم إلغاء نافذة إعادة التحقق عبر Google، لم يُحذف الحساب.');
      } else if (msg.includes('wrong-password') || msg.includes('invalid-credential')) {
        this.settingsError.set('كلمة المرور غير صحيحة.');
      } else {
        this.settingsError.set('تعذر إتمام حذف الحساب بالكامل دون أخطاء. لم تُفقد بياناتك، أعد المحاولة بعد إعادة تسجيل الدخول.');
      }
      return false;
    } finally {
      this.isDeletingAccount.set(false);
    }
  }

  // ================= SIMPLE INTERACTIVE IMAGE CROP/PAN/ZOOM RENDERER ================= //

  async renderCroppedImage(draft: CroppedImageDraft): Promise<{ blob: Blob; dataUrl: string }> {
    const targetWidth = draft.kind === 'banner' ? 1500 : 512;
    const targetHeight = draft.kind === 'banner' ? 800 : 512;

    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = () => reject(new Error('تعذر قراءة ملف الصورة المختار.'));
      el.src = draft.sourceUrl;
    });

    const canvas = document.createElement('canvas');
    canvas.width = targetWidth;
    canvas.height = targetHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('المتصفح لا يدعم معالجة الصور.');
    }

    const baseScale = Math.max(targetWidth / img.width, targetHeight / img.height);
    const totalScale = baseScale * Math.max(1, Math.min(3, draft.zoom));
    const drawWidth = img.width * totalScale;
    const drawHeight = img.height * totalScale;

    const maxOffsetX = Math.max(0, (drawWidth - targetWidth) / 2);
    const maxOffsetY = Math.max(0, (drawHeight - targetHeight) / 2);

    const clampedPanX = Math.max(-1, Math.min(1, draft.panX));
    const clampedPanY = Math.max(-1, Math.min(1, draft.panY));

    const drawX = (targetWidth - drawWidth) / 2 + clampedPanX * maxOffsetX;
    const drawY = (targetHeight - drawHeight) / 2 + clampedPanY * maxOffsetY;

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(img, drawX, drawY, drawWidth, drawHeight);

    const mimeType = 'image/webp';
    const quality = draft.kind === 'banner' ? 0.8 : 0.85;

    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (b) => {
          if (b) resolve(b);
          else reject(new Error('تعذر ضغط الصورة المحددة.'));
        },
        mimeType,
        quality
      );
    });

    const dataUrl = canvas.toDataURL(mimeType, quality);
    return { blob, dataUrl };
  }
}
