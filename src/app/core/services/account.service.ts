import { Injectable, OnDestroy, PLATFORM_ID, computed, inject, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Router } from '@angular/router';
import {
  FullAccountProfile,
  NovelCard,
  PrivacySettings,
  PublishedNovelRecord,
  RoleRequest,
  RoleRequestRole,
  UsernameCheckResult,
  VerifiedWriterStatus,
  WriterApplication,
  WriterApplicationStatus,
} from '../models/library.models';
import {
  AuthorAppearance,
  checkUsernameAvailability,
  deleteAppAccountAndData,
  fetchAuthorPublishedNovels,
  fetchPendingRoleRequestsForAdmin,
  fetchPendingWriterApplicationsForAdmin,
  fetchUserRoleRequests,
  formatFirestoreErrorForUser,
  getPublicAuthorAppearance,
  getVerifiedWriterStatus,
  getWriterApplicationFromFirestore,
  invalidateAuthorAppearanceCache,
  invalidateWriterStatusCache,
  loadOwnerAccountProfile,
  loadVisitorAccountProfile,
  normalizeUsername,
  resolveUsernameToUid,
  reviewRoleRequestAsAdmin,
  reviewWriterApplicationAsAdmin,
  saveAccountProfileChanges,
  savePrivacySettingsToFirestore,
  submitRoleRequestToFirestore,
  submitWriterApplicationToFirestore,
  uploadProfileImageAsset,
} from '../mtx-firebase';

import { I18nService } from './i18n.service';

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
  roleKind: 'none',
  roleRecord: null,
};

@Injectable({ providedIn: 'root' })
export class AccountService implements OnDestroy {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly router = inject(Router);
  private readonly i18n = inject(I18nService);

  // Authoritative Verified Writer Badge & Role Cache (never trusts client profile flags)
  readonly writerBadgeCache = signal<Record<string, boolean>>({});
  readonly writerRoleCache = signal<Record<string, 'founder' | 'author' | 'none'>>({});
  private readonly pendingBadgeLookups = new Set<string>();

  // Reactive Public Author Appearance Cache (avatar photoURL & 1500x800 coverURL)
  readonly authorAppearanceCache = signal<Record<string, AuthorAppearance | null>>({});
  private readonly pendingAppearanceLookups = new Set<string>();

  // Owner Authenticated Account State
  readonly ownProfile = signal<FullAccountProfile | null>(null);
  readonly ownWriterStatus = signal<VerifiedWriterStatus>(DEFAULT_WRITER_STATUS);
  readonly ownReadChaptersCount = signal<number>(0);
  readonly ownPublishedNovels = signal<PublishedNovelRecord[]>([]);
  readonly ownApplication = signal<WriterApplication | null>(null);
  readonly pendingAdminApplications = signal<WriterApplication[]>([]);
  readonly ownRoleRequests = signal<RoleRequest[]>([]);
  readonly pendingAdminRoleRequests = signal<RoleRequest[]>([]);

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
  readonly activeSettingsSection = signal<'edit' | 'privacy' | 'site' | 'writer' | 'security' | 'admin'>('edit');
  readonly isSavingProfile = signal<boolean>(false);
  readonly isSavingPrivacy = signal<boolean>(false);
  readonly isSubmittingApplication = signal<boolean>(false);
  readonly isSubmittingRoleRequest = signal<boolean>(false);
  readonly isDeletingAccount = signal<boolean>(false);
  readonly settingsError = signal<string | null>(null);
  readonly settingsSuccess = signal<string | null>(null);
  readonly usernameCheck = signal<UsernameCheckResult>({
    status: 'idle',
    normalized: '',
    message: '',
    suggestions: [],
  });

  private readonly inFlightOwnerLoads = new Map<string, Promise<boolean>>();
  private readonly ownerAccountLoadedAt = new Map<string, number>();
  private readonly OWNER_ACCOUNT_TTL_MS = 10_000;
  private usernameCheckTimer: ReturnType<typeof setTimeout> | null = null;

  ngOnDestroy(): void {
    if (this.usernameCheckTimer) {
      clearTimeout(this.usernameCheckTimer);
      this.usernameCheckTimer = null;
    }
  }

  /**
   * Authoritatively verifies whether a given author UID has an active writer role
   * in Firestore `/user_roles/{uid}` for the unified <app-writer-badge /> component.
   */
  verifyWriterBadge(authorUid: string | undefined): boolean {
    if (!authorUid) return false;
    const own = this.ownProfile();
    if (own && own.uid === authorUid) {
      return this.ownWriterStatus().isWriterBadge;
    }
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
          this.writerRoleCache.update((prev) => ({
            ...prev,
            [authorUid]: status.roleKind,
          }));
        })
        .catch(() => {
          this.writerBadgeCache.update((prev) => ({
            ...prev,
            [authorUid]: false,
          }));
          this.writerRoleCache.update((prev) => ({
            ...prev,
            [authorUid]: 'none',
          }));
        })
        .finally(() => {
          this.pendingBadgeLookups.delete(authorUid);
        });
    }
    return false;
  }

  getAuthorRoleKind(authorUid: string | undefined): 'founder' | 'author' | 'none' {
    if (!authorUid) return 'none';
    const own = this.ownProfile();
    if (own && own.uid === authorUid) {
      return this.ownWriterStatus().roleKind;
    }
    const roleCache = this.writerRoleCache();
    if (Object.prototype.hasOwnProperty.call(roleCache, authorUid)) {
      return roleCache[authorUid];
    }
    // Trigger lookup cleanly if not fetched yet
    this.verifyWriterBadge(authorUid);
    return 'none';
  }

  /**
   * Resolves a writer's configured avatar (photoURL) and 1500x800 cover banner (coverURL)
   * reactively from the owner's live profile or their public Firestore profile.
   */
  getAuthorAppearance(authorUid: string | undefined): AuthorAppearance | null {
    if (!authorUid) return null;

    const own = this.ownProfile();
    if (own && own.uid === authorUid) {
      return {
        photoURL: own.photoURL || '',
        coverURL: own.coverURL || '',
        displayName: own.displayName || '',
      };
    }

    const cache = this.authorAppearanceCache();
    if (Object.prototype.hasOwnProperty.call(cache, authorUid)) {
      return cache[authorUid];
    }

    if (isPlatformBrowser(this.platformId) && !this.pendingAppearanceLookups.has(authorUid)) {
      this.pendingAppearanceLookups.add(authorUid);
      void getPublicAuthorAppearance(authorUid)
        .then((appearance) => {
          this.authorAppearanceCache.update((prev) => ({
            ...prev,
            [authorUid]: appearance,
          }));
        })
        .catch(() => {
          this.authorAppearanceCache.update((prev) => ({
            ...prev,
            [authorUid]: null,
          }));
        })
        .finally(() => {
          this.pendingAppearanceLookups.delete(authorUid);
        });
    }

    return null;
  }

  async loadOwnerAccount(uid: string, forceRefresh = false): Promise<boolean> {
    if (!uid || !isPlatformBrowser(this.platformId)) return false;

    const lastLoaded = this.ownerAccountLoadedAt.get(uid) ?? 0;
    if (
      !forceRefresh &&
      this.ownProfile()?.uid === uid &&
      Date.now() - lastLoaded < this.OWNER_ACCOUNT_TTL_MS
    ) {
      return true;
    }

    const existing = !forceRefresh ? this.inFlightOwnerLoads.get(uid) : undefined;
    if (existing) {
      return existing;
    }

    const task = (async (): Promise<boolean> => {
      try {
        const [profile, writerStatus, appDoc, roleReqs] = await Promise.all([
          loadOwnerAccountProfile(uid),
          getVerifiedWriterStatus(uid, forceRefresh).catch(() => DEFAULT_WRITER_STATUS),
          getWriterApplicationFromFirestore(uid).catch(() => null),
          fetchUserRoleRequests(uid).catch(() => []),
        ]);

        if (profile) {
          this.ownProfile.set(profile);
          this.ownReadChaptersCount.set(profile.readChaptersCount ?? 0);
          this.authorAppearanceCache.update((prev) => ({
            ...prev,
            [uid]: {
              photoURL: profile.photoURL || '',
              coverURL: profile.coverURL || '',
              displayName: profile.displayName || '',
            },
          }));
        } else {
          this.ownReadChaptersCount.set(0);
        }

        this.ownWriterStatus.set(writerStatus);
        this.writerBadgeCache.update((prev) => ({
          ...prev,
          [uid]: writerStatus.isWriterBadge,
        }));
        this.writerRoleCache.update((prev) => ({
          ...prev,
          [uid]: writerStatus.roleKind,
        }));
        this.ownApplication.set(appDoc);
        this.ownRoleRequests.set(roleReqs);

        const [works, pendingApps, pendingRoleReqs] = await Promise.all([
          writerStatus.canPublish
            ? fetchAuthorPublishedNovels(uid).catch(() => [])
            : Promise.resolve<PublishedNovelRecord[]>([]),
          writerStatus.isAdmin
            ? fetchPendingWriterApplicationsForAdmin().catch(() => [])
            : Promise.resolve<WriterApplication[]>([]),
          writerStatus.isAdmin
            ? fetchPendingRoleRequestsForAdmin().catch(() => [])
            : Promise.resolve<RoleRequest[]>([]),
        ]);

        this.ownPublishedNovels.set(works);
        this.pendingAdminApplications.set(pendingApps);
        this.pendingAdminRoleRequests.set(pendingRoleReqs);

        if (profile) {
          this.ownerAccountLoadedAt.set(uid, Date.now());
        }
        return Boolean(profile);
      } catch (err) {
        console.warn('Error hydrating owner account:', err);
        return false;
      } finally {
        this.inFlightOwnerLoads.delete(uid);
      }
    })();

    this.inFlightOwnerLoads.set(uid, task);
    return task;
  }

  clearOwnerState(): void {
    this.ownProfile.set(null);
    this.ownWriterStatus.set(DEFAULT_WRITER_STATUS);
    this.ownReadChaptersCount.set(0);
    this.ownPublishedNovels.set([]);
    this.ownApplication.set(null);
    this.pendingAdminApplications.set([]);
    this.ownRoleRequests.set([]);
    this.pendingAdminRoleRequests.set([]);
    this.ownerAccountLoadedAt.clear();
    this.inFlightOwnerLoads.clear();
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
    this.writerRoleCache.update((prev) => ({
      ...prev,
      [targetUid]: writerStatus.roleKind,
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

    const isEn = this.i18n.lang() === 'en';
    this.usernameCheck.set({
      status: 'checking',
      normalized: norm,
      message: isEn ? 'Checking username availability...' : 'جارٍ التحقق من توفر اسم المستخدم...',
      suggestions: [],
    });

    const isAdmin = this.ownWriterStatus().isAdmin;
    this.usernameCheckTimer = setTimeout(() => {
      void checkUsernameAvailability(rawUsername, uid, currentUsername, isAdmin).then((result) => {
        if (isEn) {
          const translated: Record<string, string> = {
            reserved:
              result.normalized === 'zid'
                ? '@zid is reserved exclusively for official Sanctuary administration.'
                : 'This username is reserved and cannot be used.',
            invalid: 'Invalid username format (4–24 chars: a–z, 0–9, _).',
            unchanged: 'This is already your current username.',
            available: `@${result.normalized} is available.`,
            taken: `@${result.normalized} is already taken.`,
          };
          this.usernameCheck.set({
            ...result,
            message: translated[result.status] || result.message,
          });
        } else {
          this.usernameCheck.set(result);
        }
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
    const isEn = this.i18n.lang() === 'en';
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      this.settingsError.set(
        isEn
          ? 'No internet connection. Please try again once reconnected.'
          : 'لا يوجد اتصال بالإنترنت حالياً. يرجى المحاولة بعد استعادة الاتصال.'
      );
      return false;
    }

    const current = this.ownProfile();
    if (!current) {
      this.settingsError.set(
        isEn ? 'Could not locate your account profile.' : 'تعذر العثور على بيانات الحساب الحالية.'
      );
      return false;
    }

    this.isSavingProfile.set(true);
    this.settingsError.set(null);
    this.settingsSuccess.set(null);

    try {
      // Re-validate username if entered
      const nextUsernameInput = payload.username.trim();
      if (nextUsernameInput) {
        const check = await checkUsernameAvailability(
          nextUsernameInput,
          uid,
          current.username,
          this.ownWriterStatus().isAdmin
        );
        this.usernameCheck.set(check);
        if (check.status !== 'available' && check.status !== 'unchanged') {
          throw new Error(
            check.message || (isEn ? 'Username is unavailable.' : 'اسم المستخدم غير متاح.')
          );
        }
      }

      // Upload cropped images in parallel ONLY now when user explicitly confirms Save
      const [finalPhotoURL, finalCoverURL] = await Promise.all([
        payload.avatarDraft?.blob && payload.avatarDraft.previewDataUrl
          ? uploadProfileImageAsset(
              uid,
              'avatar',
              payload.avatarDraft.blob,
              payload.avatarDraft.previewDataUrl,
              current.photoURL
            )
          : Promise.resolve(current.photoURL || ''),
        payload.bannerDraft?.blob && payload.bannerDraft.previewDataUrl
          ? uploadProfileImageAsset(
              uid,
              'banner',
              payload.bannerDraft.blob,
              payload.bannerDraft.previewDataUrl,
              current.coverURL
            )
          : Promise.resolve(current.coverURL || ''),
      ]);

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

      invalidateAuthorAppearanceCache(uid);
      await this.loadOwnerAccount(uid, true);
      if (this.viewedIsOwner() && this.ownProfile()) {
        this.viewedProfile.set(this.ownProfile());
      }

      // Sync public profile URL immediately if username changed or was newly set
      if (savedUsername && savedUsername !== current.username) {
        await this.router.navigate(['/profile', savedUsername], { replaceUrl: true });
      }

      this.settingsSuccess.set(
        isEn
          ? 'Profile details and media saved successfully.'
          : 'تم حفظ بيانات الملف الشخصي والصور بنجاح.'
      );
      return true;
    } catch (err) {
      const msg = formatFirestoreErrorForUser(
        err,
        isEn ? 'en' : 'ar',
        'تعذر حفظ التغييرات، يرجى المحاولة لاحقاً.',
        'Could not save changes. Please try again later.'
      );
      this.settingsError.set(msg);
      return false;
    } finally {
      this.isSavingProfile.set(false);
    }
  }

  async savePrivacy(uid: string, privacy: PrivacySettings): Promise<boolean> {
    const isEn = this.i18n.lang() === 'en';
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      this.settingsError.set(
        isEn
          ? 'No internet connection to save privacy settings.'
          : 'لا يوجد اتصال بالإنترنت لحفظ إعدادات الخصوصية.'
      );
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
      this.settingsSuccess.set(
        isEn
          ? 'Privacy settings updated and applied.'
          : 'تم تحديث وتطبيق إعدادات الخصوصية على قاعدة البيانات.'
      );
      return true;
    } catch {
      this.settingsError.set(
        isEn
          ? 'Failed to save privacy settings. Please retry.'
          : 'فشل حفظ إعدادات الخصوصية، يرجى المحاولة مجدداً.'
      );
      return false;
    } finally {
      this.isSavingPrivacy.set(false);
    }
  }

  // ================= WRITER APPLICATION & UNIFIED ROLE REQUESTS ================= //

  async submitWriterApplication(
    uid: string,
    payload: {
      penName: string;
      shortBio: string;
      genres: string[];
      writingSample: string;
    }
  ): Promise<boolean> {
    const lang = this.i18n.lang();
    const isEn = lang === 'en';
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      this.settingsError.set(
        isEn
          ? 'Cannot submit application while offline.'
          : 'تعذر إرسال الطلب بسبب انقطاع الاتصال بالإنترنت.'
      );
      return false;
    }

    this.isSubmittingApplication.set(true);
    this.settingsError.set(null);
    this.settingsSuccess.set(null);

    try {
      const appDoc = await submitWriterApplicationToFirestore(uid, payload, lang);
      this.ownApplication.set(appDoc);
      this.ownerAccountLoadedAt.delete(uid);
      this.settingsSuccess.set(
        isEn
          ? 'Writer application submitted for editorial review.'
          : 'تم إرسال طلب الانضمام ككاتب إلى الإدارة للمراجعة بنجاح.'
      );
      return true;
    } catch (err) {
      const msg = formatFirestoreErrorForUser(
        err,
        lang,
        'تعذر إرسال الطلب حالياً. تحقق من استيفاء شروط الحقول وأعد المحاولة.',
        'Could not submit application. Check field requirements and try again.'
      );
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
    const lang = this.i18n.lang();
    const isEn = lang === 'en';
    this.settingsError.set(null);
    this.settingsSuccess.set(null);
    if (!this.ownWriterStatus().isAdmin) {
      this.settingsError.set(
        isEn
          ? 'Only official Sanctuary admins can review writer applications.'
          : 'مراجعة طلبات الكتّاب حكرٌ على المشرف الرسمي فقط.'
      );
      return false;
    }
    try {
      await reviewWriterApplicationAsAdmin(applicantUid, decision, adminUid, reviewNote);
      invalidateWriterStatusCache(applicantUid);
      this.pendingAdminApplications.update((list) =>
        list.filter((item) => item.userId !== applicantUid)
      );
      if (decision === 'approved') {
        this.writerBadgeCache.update((prev) => ({ ...prev, [applicantUid]: true }));
        this.writerRoleCache.update((prev) => ({ ...prev, [applicantUid]: 'author' }));
        if (applicantUid === this.ownProfile()?.uid) {
          await this.loadOwnerAccount(applicantUid, true);
        }
      }
      this.settingsSuccess.set(
        decision === 'approved'
          ? isEn
            ? 'Writer permission granted.'
            : 'تمت الموافقة ومنح صلاحية الكاتب بنجاح.'
          : isEn
            ? 'Application declined.'
            : 'تم رفض الطلب مع حفظ النتيجة.'
      );
      return true;
    } catch (err) {
      this.settingsError.set(
        formatFirestoreErrorForUser(
          err,
          lang,
          'تعذر تنفيذ قرار المراجعة. تحقق من الصلاحيات.',
          'Failed to process review decision. Please verify admin permissions.'
        )
      );
      return false;
    }
  }

  async submitRoleRequest(
    uid: string,
    email: string,
    displayName: string,
    payload: { role: RoleRequestRole; statement: string }
  ): Promise<boolean> {
    const lang = this.i18n.lang();
    const isEn = lang === 'en';
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      this.settingsError.set(
        isEn ? 'Cannot submit request while offline.' : 'تعذر إرسال الطلب بسبب انقطاع الاتصال بالإنترنت.'
      );
      return false;
    }

    this.isSubmittingRoleRequest.set(true);
    this.settingsError.set(null);
    this.settingsSuccess.set(null);

    try {
      const saved = await submitRoleRequestToFirestore(uid, email, displayName, payload, lang);
      this.ownRoleRequests.update((list) => {
        const rest = list.filter((r) => r.id !== saved.id);
        return [saved, ...rest];
      });
      this.settingsSuccess.set(
        isEn
          ? 'Role request submitted for official admin review.'
          : 'تم إرسال طلب الرتبة للمراجعة الإدارية بنجاح.'
      );
      return true;
    } catch (err) {
      this.settingsError.set(
        formatFirestoreErrorForUser(
          err,
          lang,
          'تعذر إرسال طلب الرتبة. تأكد من استيفاء الشروط والمحاولة مجدداً.',
          'Could not submit role request. Check input requirements and retry.'
        )
      );
      return false;
    } finally {
      this.isSubmittingRoleRequest.set(false);
    }
  }

  async reviewRoleRequest(
    request: RoleRequest,
    decision: 'approved' | 'rejected',
    adminUid: string,
    reviewNote = ''
  ): Promise<boolean> {
    const lang = this.i18n.lang();
    const isEn = lang === 'en';
    this.settingsError.set(null);
    this.settingsSuccess.set(null);

    if (!this.ownWriterStatus().isAdmin) {
      this.settingsError.set(
        isEn
          ? 'Only official Sanctuary admins can review role requests.'
          : 'مراجعة طلبات الصلاحيات حكرٌ على المشرف الرسمي فقط.'
      );
      return false;
    }

    try {
      await reviewRoleRequestAsAdmin(request, decision, adminUid, reviewNote);
      invalidateWriterStatusCache(request.userId);
      this.pendingAdminRoleRequests.update((list) =>
        list.filter((item) => item.id !== request.id)
      );
      if (decision === 'approved' && request.role === 'author') {
        this.writerBadgeCache.update((prev) => ({ ...prev, [request.userId]: true }));
        this.writerRoleCache.update((prev) => ({ ...prev, [request.userId]: 'author' }));
      }
      if (request.userId === this.ownProfile()?.uid) {
        await this.loadOwnerAccount(request.userId, true);
      }
      this.settingsSuccess.set(
        decision === 'approved'
          ? isEn
            ? 'Role approved and assigned cleanly.'
            : 'تمت الموافقة ومنح الرتبة المطلوبة بنجاح.'
          : isEn
            ? 'Role request declined.'
            : 'تم رفض طلب الرتبة مع حفظ الملاحظة.'
      );
      return true;
    } catch (err) {
      this.settingsError.set(
        formatFirestoreErrorForUser(
          err,
          lang,
          'تعذر تنفيذ قرار المراجعة. تحقق من الصلاحيات.',
          'Failed to process role request decision.'
        )
      );
      return false;
    }
  }

  // ================= PERMANENT ACCOUNT DELETION ================= //

  async deleteOwnAccount(uid: string, passwordForReauth?: string): Promise<boolean> {
    const isEn = this.i18n.lang() === 'en';
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
        this.settingsError.set(
          isEn
            ? 'Please enter your current password to confirm deletion.'
            : 'يرجى إدخال كلمة المرور لإعادة المصادقة قبل الحذف النهائي.'
        );
      } else if (msg.includes('popup-closed-by-user')) {
        this.settingsError.set(
          isEn
            ? 'Google re-verification popup cancelled. Account not deleted.'
            : 'تم إلغاء نافذة إعادة التحقق عبر Google، لم يُحذف الحساب.'
        );
      } else if (msg.includes('wrong-password') || msg.includes('invalid-credential')) {
        this.settingsError.set(isEn ? 'Incorrect password.' : 'كلمة المرور غير صحيحة.');
      } else {
        this.settingsError.set(
          isEn
            ? 'Could not complete deletion. Your data was not lost; sign in again and retry.'
            : 'تعذر إتمام حذف الحساب بالكامل دون أخطاء. لم تُفقد بياناتك، أعد المحاولة بعد إعادة تسجيل الدخول.'
        );
      }
      return false;
    } finally {
      this.isDeletingAccount.set(false);
    }
  }

  // ================= SIMPLE INTERACTIVE IMAGE CROP/PAN/ZOOM RENDERER ================= //

  async renderCroppedImage(draft: CroppedImageDraft): Promise<{ blob: Blob; dataUrl: string }> {
    const targetWidth = draft.kind === 'banner' ? 1200 : 384;
    const targetHeight = draft.kind === 'banner' ? 640 : 384;

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
    const quality = draft.kind === 'banner' ? 0.76 : 0.82;

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
