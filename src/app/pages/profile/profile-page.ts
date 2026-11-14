import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  ViewChild,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs';
import { AuthSessionService } from '../../core/services/auth-session.service';
import { AccountService, CroppedImageDraft } from '../../core/services/account.service';
import { LibraryStateService } from '../../core/services/library-state.service';
import { WriterBadge } from '../../shared/components/writer-badge/writer-badge';
import { RoleRequest, RoleRequestRole } from '../../core/models/library.models';
import {
  ROLE_REQUEST_LIMITS,
  WRITER_APPLICATION_LIMITS,
  validateRoleRequestInput,
  validateWriterApplicationInput,
} from '../../core/mtx-firebase';

const APPLICATION_GENRE_OPTIONS = [
  'الرواية التاريخية',
  'الفانتازيا الملحمية',
  'الغموض والتشويق',
  'الدراما النفسية',
  'التراث والمخطوطات',
  'الفلسفة والحكمة',
];

@Component({
  selector: 'app-profile-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, WriterBadge],
  templateUrl: './profile-page.html',
})
export class ProfilePage {
  readonly auth = inject(AuthSessionService);
  readonly account = inject(AccountService);
  readonly lib = inject(LibraryStateService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  @ViewChild('savedCarouselEl') savedCarouselEl?: ElementRef<HTMLElement>;

  readonly routeUsername = toSignal(
    this.route.paramMap.pipe(map((params) => params.get('username'))),
    { initialValue: this.route.snapshot.paramMap.get('username') }
  );

  readonly genreOptions = APPLICATION_GENRE_OPTIONS;
  readonly writerLimits = WRITER_APPLICATION_LIMITS;
  readonly roleLimits = ROLE_REQUEST_LIMITS;

  // Edit Profile Form
  readonly editForm = new FormGroup({
    displayName: new FormControl('', { nonNullable: true }),
    username: new FormControl('', { nonNullable: true }),
    bio: new FormControl('', { nonNullable: true }),
  });

  // Privacy Form
  readonly privacyForm = new FormGroup({
    isPublic: new FormControl(true, { nonNullable: true }),
    showSavedNovels: new FormControl(true, { nonNullable: true }),
    showReadingHistory: new FormControl(true, { nonNullable: true }),
    showProfileInfo: new FormControl(true, { nonNullable: true }),
  });

  // Writer Application Form
  readonly writerForm = new FormGroup({
    penName: new FormControl('', { nonNullable: true }),
    shortBio: new FormControl('', { nonNullable: true }),
    writingSample: new FormControl('', { nonNullable: true }),
  });
  readonly selectedWriterGenres = signal<string[]>(['الرواية التاريخية']);

  // Live trimmed character counters for Writer Application & Role Requests
  private readonly penNameVal = toSignal(this.writerForm.controls.penName.valueChanges, {
    initialValue: '',
  });
  private readonly shortBioVal = toSignal(this.writerForm.controls.shortBio.valueChanges, {
    initialValue: '',
  });
  private readonly writingSampleVal = toSignal(
    this.writerForm.controls.writingSample.valueChanges,
    { initialValue: '' }
  );

  readonly penNameLength = computed(() => (this.penNameVal() || '').trim().length);
  readonly shortBioLength = computed(() => (this.shortBioVal() || '').trim().length);
  readonly writingSampleLength = computed(() => (this.writingSampleVal() || '').trim().length);

  // Unified Specialty Role Requests (Auditor / Translator)
  readonly selectedSpecialtyRole = signal<RoleRequestRole>('auditor');
  readonly roleStatementControl = new FormControl('', { nonNullable: true });
  private readonly roleStatementVal = toSignal(this.roleStatementControl.valueChanges, {
    initialValue: '',
  });
  readonly roleStatementLength = computed(() => (this.roleStatementVal() || '').trim().length);

  readonly activeSpecialtyRoleRequest = computed<RoleRequest | null>(() => {
    const role = this.selectedSpecialtyRole();
    return this.account.ownRoleRequests().find((r) => r.role === role) ?? null;
  });

  readonly hasSelectedSpecialtyRole = computed<boolean>(() => {
    const role = this.selectedSpecialtyRole();
    const status = this.account.ownWriterStatus();
    if (status.isAdmin) return true;
    const record = status.roleRecord;
    if (!record || record.status !== 'active') return false;
    return record.role === role || (Array.isArray(record.roles) && record.roles.includes(role));
  });

  // Admin Review Note Control
  readonly adminNoteControl = new FormControl('', { nonNullable: true });

  private lastLoadedProfileKey: string | null = null;

  // Account Deletion & Logout Confirm States
  readonly confirmLogoutPrompt = signal<boolean>(false);
  readonly showDeleteConfirmModal = signal<boolean>(false);
  readonly deleteConfirmText = new FormControl('', { nonNullable: true });
  readonly deleteReauthPassword = new FormControl('', { nonNullable: true });
  readonly copiedProfileLink = signal<boolean>(false);

  // Interactive Image Crop/Pan/Zoom Drafts (NOT uploaded until explicit Save)
  readonly avatarDraft = signal<CroppedImageDraft | null>(null);
  readonly bannerDraft = signal<CroppedImageDraft | null>(null);
  readonly activeCropperKind = signal<'avatar' | 'banner' | null>(null);

  private dragStartX = 0;
  private dragStartY = 0;
  private dragBasePanX = 0;
  private dragBasePanY = 0;
  private isDraggingCropper = false;

  // Derived Account Page Data
  readonly savedNovelsForDisplay = computed(() => {
    if (this.account.viewedIsOwner()) {
      return this.lib.bookmarkedNovels();
    }
    return this.account.viewedVisitorSavedNovels();
  });

  readonly displaySavedCount = computed<number | null>(() => {
    const prof = this.account.viewedProfile();
    if (!prof) return 0;
    if (this.account.viewedIsOwner()) {
      return this.lib.bookmarkedIds().size;
    }
    return prof.showSavedNovels ? (prof.savedNovelsCount ?? 0) : null;
  });

  readonly displayReadChaptersCount = computed<number | null>(() => {
    const prof = this.account.viewedProfile();
    if (!prof) return 0;
    if (this.account.viewedIsOwner()) {
      return this.account.ownReadChaptersCount();
    }
    return prof.showReadingHistory ? (prof.readChaptersCount ?? 0) : null;
  });

  readonly canShowPublishedWorksSection = computed<boolean>(() => {
    const status = this.account.viewedWriterStatus();
    return Boolean((status.isWriterBadge && status.canPublish) || status.isAdmin);
  });

  readonly usesEmailPasswordProvider = computed<boolean>(() => {
    const user = this.auth.currentUser();
    if (!user) return false;
    return user.providerData.some((p) => p.providerId === 'password');
  });

  readonly activeAvatarCropperTransform = computed<string>(() => {
    const d = this.avatarDraft();
    if (!d) return 'translate(0%, 0%) scale(1)';
    return `translate(${d.panX * 22}%, ${d.panY * 22}%) scale(${d.zoom})`;
  });

  readonly activeBannerCropperTransform = computed<string>(() => {
    const d = this.bannerDraft();
    if (!d) return 'translate(0%, 0%) scale(1)';
    return `translate(${d.panX * 22}%, ${d.panY * 22}%) scale(${d.zoom})`;
  });

  constructor() {
    // Load profile whenever route param or authenticated session readiness changes
    effect(() => {
      const ready = this.auth.authReady();
      const uid = this.auth.currentUser()?.uid ?? null;
      const paramUsername = this.routeUsername() ?? null;
      if (!ready) return;

      if (!paramUsername && !uid) {
        this.lastLoadedProfileKey = null;
        void this.router.navigateByUrl('/auth');
        return;
      }

      const nextKey = `${uid || 'anon'}::${paramUsername || '@self'}`;
      if (this.lastLoadedProfileKey === nextKey && this.account.viewedState() === 'ok') {
        return;
      }
      this.lastLoadedProfileKey = nextKey;
      void this.account.openProfileView(paramUsername, uid);
    });

    // Hydrate drawer forms whenever owner's profile loads/updates
    effect(() => {
      const prof = this.account.ownProfile();
      if (!prof) return;
      this.editForm.patchValue(
        {
          displayName: prof.displayName,
          username: prof.username,
          bio: prof.bio,
        },
        { emitEvent: false }
      );
      this.privacyForm.patchValue(
        {
          isPublic: prof.isPublic,
          showSavedNovels: prof.showSavedNovels,
          showReadingHistory: prof.showReadingHistory,
          showProfileInfo: prof.showProfileInfo,
        },
        { emitEvent: false }
      );
    });

    // Hydrate rejected application into form for quick re-edit
    effect(() => {
      const app = this.account.ownApplication();
      const prof = this.account.ownProfile();
      if (app && app.status === 'rejected') {
        this.writerForm.patchValue(
          {
            penName: app.penName,
            shortBio: app.shortBio,
            writingSample: app.writingSample,
          },
          { emitEvent: false }
        );
        if (app.genres?.length) {
          this.selectedWriterGenres.set([...app.genres]);
        }
      } else if (!app && prof) {
        if (!this.writerForm.controls.penName.value) {
          this.writerForm.controls.penName.setValue(prof.displayName, { emitEvent: false });
        }
        if (!this.writerForm.controls.shortBio.value && prof.bio) {
          this.writerForm.controls.shortBio.setValue(prof.bio, { emitEvent: false });
        }
      }
    });
  }

  openSettingsDrawer(section: 'edit' | 'privacy' | 'site' | 'writer' | 'security' | 'admin' = 'edit'): void {
    this.account.settingsError.set(null);
    this.account.settingsSuccess.set(null);
    this.account.activeSettingsSection.set(section);
    this.account.isSettingsOpen.set(true);
    const prof = this.account.ownProfile();
    if (prof) {
      this.editForm.patchValue({
        displayName: prof.displayName,
        username: prof.username,
        bio: prof.bio,
      });
      this.privacyForm.patchValue({
        isPublic: prof.isPublic,
        showSavedNovels: prof.showSavedNovels,
        showReadingHistory: prof.showReadingHistory,
        showProfileInfo: prof.showProfileInfo,
      });
    }
  }

  closeSettingsDrawer(): void {
    this.account.isSettingsOpen.set(false);
    this.activeCropperKind.set(null);
    this.avatarDraft.set(null);
    this.bannerDraft.set(null);
    this.confirmLogoutPrompt.set(false);
    this.showDeleteConfirmModal.set(false);
  }

  retryLoadProfile(): void {
    const uid = this.auth.currentUser()?.uid ?? null;
    const paramUsername = this.routeUsername() ?? null;
    this.lastLoadedProfileKey = null;
    void this.account.openProfileView(paramUsername, uid);
  }

  onUsernameInput(event: Event): void {
    const val = (event.target as HTMLInputElement).value;
    const prof = this.account.ownProfile();
    this.account.scheduleUsernameCheck(val, prof?.uid, prof?.username);
  }

  applySuggestedUsername(suggestion: string): void {
    this.editForm.controls.username.setValue(suggestion);
    const prof = this.account.ownProfile();
    this.account.scheduleUsernameCheck(suggestion, prof?.uid, prof?.username);
  }

  async onSelectProfileImage(event: Event, kind: 'avatar' | 'banner'): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (!file) return;

    const allowedMimes = new Set(['image/jpeg', 'image/png', 'image/webp']);
    const isEn = this.lib.i18n.lang() === 'en';
    if (!allowedMimes.has(file.type.toLowerCase())) {
      this.account.settingsError.set(
        isEn
          ? 'Please select a valid raster image file (JPG, PNG, or WebP).'
          : 'يرجى اختيار ملف صورة صالح بصيغة JPG أو PNG أو WebP فقط.'
      );
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      this.account.settingsError.set(
        isEn
          ? 'Image size exceeds the 10 MB limit.'
          : 'حجم الصورة يتجاوز الحد المسموح به (١٠ ميغابايت).'
      );
      return;
    }

    const reader = new FileReader();
    reader.onerror = () => {
      this.account.settingsError.set(
        isEn ? 'Could not read the selected image file.' : 'تعذر قراءة ملف الصورة المختار.'
      );
    };
    reader.onload = async () => {
      const sourceUrl = typeof reader.result === 'string' ? reader.result : '';
      if (!sourceUrl) return;

      let dims: { w: number; h: number };
      try {
        dims = await new Promise<{ w: number; h: number }>((resolve, reject) => {
          const img = new Image();
          img.onload = () => {
            if (img.width <= 0 || img.height <= 0) {
              reject(new Error('INVALID_IMAGE_DIMENSIONS'));
              return;
            }
            resolve({ w: img.width, h: img.height });
          };
          img.onerror = () => reject(new Error('IMAGE_DECODE_FAILED'));
          img.src = sourceUrl;
        });
      } catch {
        this.account.settingsError.set(
          isEn
            ? 'This image could not be decoded. Please choose another JPG, PNG, or WebP image.'
            : 'تعذر فك ترميز الصورة المختارة. يرجى اختيار صورة أخرى بصيغة JPG أو PNG أو WebP.'
        );
        return;
      }

      const initialDraft: CroppedImageDraft = {
        kind,
        sourceUrl,
        naturalWidth: dims.w,
        naturalHeight: dims.h,
        panX: 0,
        panY: 0,
        zoom: 1,
        blob: null,
        previewDataUrl: sourceUrl,
      };

      try {
        const rendered = await this.account.renderCroppedImage(initialDraft);
        initialDraft.blob = rendered.blob;
        initialDraft.previewDataUrl = rendered.dataUrl;
      } catch {
        this.account.settingsError.set(
          isEn
            ? 'Failed to process this image for preview.'
            : 'تعذرت معالجة هذه الصورة للمعاينة.'
        );
        return;
      }

      if (kind === 'avatar') {
        this.avatarDraft.set(initialDraft);
      } else {
        this.bannerDraft.set(initialDraft);
      }
      this.activeCropperKind.set(kind);
      this.account.settingsError.set(null);
    };
    reader.readAsDataURL(file);
  }

  onCropperPointerDown(event: PointerEvent, kind: 'avatar' | 'banner'): void {
    const draft = kind === 'avatar' ? this.avatarDraft() : this.bannerDraft();
    if (!draft) return;
    this.isDraggingCropper = true;
    this.dragStartX = event.clientX;
    this.dragStartY = event.clientY;
    this.dragBasePanX = draft.panX;
    this.dragBasePanY = draft.panY;
    (event.currentTarget as HTMLElement)?.setPointerCapture?.(event.pointerId);
  }

  onCropperPointerMove(event: PointerEvent, kind: 'avatar' | 'banner'): void {
    if (!this.isDraggingCropper) return;
    const draft = kind === 'avatar' ? this.avatarDraft() : this.bannerDraft();
    if (!draft) return;

    const deltaX = (event.clientX - this.dragStartX) / 110;
    const deltaY = (event.clientY - this.dragStartY) / 110;
    const nextPanX = Math.max(-1, Math.min(1, this.dragBasePanX + deltaX));
    const nextPanY = Math.max(-1, Math.min(1, this.dragBasePanY + deltaY));

    const updated: CroppedImageDraft = { ...draft, panX: nextPanX, panY: nextPanY };
    if (kind === 'avatar') {
      this.avatarDraft.set(updated);
    } else {
      this.bannerDraft.set(updated);
    }
  }

  async onCropperPointerUp(kind: 'avatar' | 'banner'): Promise<void> {
    if (!this.isDraggingCropper) return;
    this.isDraggingCropper = false;
    await this.refreshCropPreview(kind);
  }

  async onCropperZoomChange(event: Event, kind: 'avatar' | 'banner'): Promise<void> {
    const zoomVal = Number((event.target as HTMLInputElement).value);
    const draft = kind === 'avatar' ? this.avatarDraft() : this.bannerDraft();
    if (!draft) return;
    const updated: CroppedImageDraft = { ...draft, zoom: zoomVal };
    if (kind === 'avatar') {
      this.avatarDraft.set(updated);
    } else {
      this.bannerDraft.set(updated);
    }
    await this.refreshCropPreview(kind);
  }

  async resetCropperFraming(kind: 'avatar' | 'banner'): Promise<void> {
    const draft = kind === 'avatar' ? this.avatarDraft() : this.bannerDraft();
    if (!draft) return;
    const updated: CroppedImageDraft = { ...draft, panX: 0, panY: 0, zoom: 1 };
    if (kind === 'avatar') {
      this.avatarDraft.set(updated);
    } else {
      this.bannerDraft.set(updated);
    }
    await this.refreshCropPreview(kind);
  }

  discardImageDraft(kind: 'avatar' | 'banner'): void {
    if (kind === 'avatar') {
      this.avatarDraft.set(null);
    } else {
      this.bannerDraft.set(null);
    }
    if (this.activeCropperKind() === kind) {
      this.activeCropperKind.set(null);
    }
  }

  private async refreshCropPreview(kind: 'avatar' | 'banner'): Promise<void> {
    const draft = kind === 'avatar' ? this.avatarDraft() : this.bannerDraft();
    if (!draft) return;
    try {
      const rendered = await this.account.renderCroppedImage(draft);
      const next: CroppedImageDraft = {
        ...draft,
        blob: rendered.blob,
        previewDataUrl: rendered.dataUrl,
      };
      if (kind === 'avatar') {
        this.avatarDraft.set(next);
      } else {
        this.bannerDraft.set(next);
      }
    } catch {
      // Non-fatal preview refresh
    }
  }

  async saveProfileChanges(): Promise<void> {
    const uid = this.auth.currentUser()?.uid;
    if (!uid) return;

    // Ensure cropped image buffers match current sliders/pan before saving
    if (this.avatarDraft()) await this.refreshCropPreview('avatar');
    if (this.bannerDraft()) await this.refreshCropPreview('banner');

    const raw = this.editForm.getRawValue();
    const ok = await this.account.saveProfileEdits(uid, {
      displayName: raw.displayName,
      username: raw.username,
      bio: raw.bio,
      avatarDraft: this.avatarDraft(),
      bannerDraft: this.bannerDraft(),
    });

    if (ok) {
      this.avatarDraft.set(null);
      this.bannerDraft.set(null);
      this.activeCropperKind.set(null);
      this.lib.showToast(
        this.lib.i18n.lang() === 'en'
          ? 'Profile updated cleanly'
          : 'تم حفظ بيانات الملف الشخصي بنجاح'
      );
    }
  }

  async savePrivacySettings(): Promise<void> {
    const uid = this.auth.currentUser()?.uid;
    if (!uid) return;
    const val = this.privacyForm.getRawValue();
    const ok = await this.account.savePrivacy(uid, {
      isPublic: val.isPublic,
      showSavedNovels: val.showSavedNovels,
      showReadingHistory: val.showReadingHistory,
      showProfileInfo: val.showProfileInfo,
    });
    if (ok) {
      this.lib.showToast(
        this.lib.i18n.lang() === 'en'
          ? 'Privacy settings saved and applied'
          : 'تم حفظ وتطبيق إعدادات الخصوصية'
      );
    }
  }

  toggleWriterGenre(genre: string): void {
    this.selectedWriterGenres.update((list) => {
      if (list.includes(genre)) {
        return list.length > 1 ? list.filter((g) => g !== genre) : list;
      }
      return list.length < 3 ? [...list, genre] : list;
    });
  }

  async submitWriterRequest(): Promise<void> {
    const uid = this.auth.currentUser()?.uid;
    if (!uid) return;

    const lang = this.lib.i18n.lang();
    const val = this.writerForm.getRawValue();
    const check = validateWriterApplicationInput(
      {
        penName: val.penName,
        shortBio: val.shortBio,
        genres: this.selectedWriterGenres(),
        writingSample: val.writingSample,
      },
      lang
    );

    if (!check.valid) {
      this.account.settingsError.set(
        check.message ||
          (lang === 'en'
            ? 'Please ensure all writer application fields meet the minimum lengths.'
            : 'يرجى التأكد من استيفاء الحد الأدنى لطول الحقول المطلوبة.')
      );
      return;
    }

    const ok = await this.account.submitWriterApplication(uid, {
      penName: val.penName,
      shortBio: val.shortBio,
      genres: this.selectedWriterGenres(),
      writingSample: val.writingSample,
    });
    if (ok) {
      this.lib.showToast(
        lang === 'en'
          ? 'Writer application submitted for review'
          : 'تم إرسال طلب الانضمام ككاتب للمراجعة بنجاح'
      );
    }
  }

  selectSpecialtyRole(role: RoleRequestRole): void {
    this.selectedSpecialtyRole.set(role);
    const existing = this.account.ownRoleRequests().find((r) => r.role === role);
    if (existing && existing.status === 'rejected') {
      this.roleStatementControl.setValue(existing.statement || '');
    } else if (!existing) {
      this.roleStatementControl.setValue('');
    }
    this.account.settingsError.set(null);
  }

  async submitSpecialtyRoleRequest(): Promise<void> {
    const uid = this.auth.currentUser()?.uid;
    if (!uid) return;

    const lang = this.lib.i18n.lang();
    const role = this.selectedSpecialtyRole();
    const statement = this.roleStatementControl.value;
    const check = validateRoleRequestInput({ role, statement }, lang);
    if (!check.valid) {
      this.account.settingsError.set(
        check.message ||
          (lang === 'en'
            ? 'Please enter at least 10 characters explaining your qualifications.'
            : 'يرجى كتابة نبذة لا تقل عن ١٠ أحرف عن مؤهلاتك وخبرتك.')
      );
      return;
    }

    const email = this.auth.displayEmail();
    const displayName = this.account.ownProfile()?.displayName || this.auth.displayName();
    const ok = await this.account.submitRoleRequest(uid, email, displayName, {
      role,
      statement,
    });
    if (ok) {
      this.lib.showToast(
        lang === 'en'
          ? 'Specialty role request sent for review'
          : 'تم إرسال طلب الرتبة التخصصية للمراجعة بنجاح'
      );
    }
  }

  async handleAdminReview(applicantUid: string, decision: 'approved' | 'rejected'): Promise<void> {
    const adminUid = this.auth.currentUser()?.uid;
    if (!adminUid) return;
    const note = this.adminNoteControl.value.trim();
    const ok = await this.account.reviewApplication(applicantUid, decision, adminUid, note);
    if (ok) {
      this.adminNoteControl.setValue('');
      const isEn = this.lib.i18n.lang() === 'en';
      this.lib.showToast(
        decision === 'approved'
          ? isEn
            ? 'Author approved and verified badge granted'
            : 'تمت الموافقة ومنح شارة الكاتب'
          : isEn
            ? 'Application declined'
            : 'تم رفض الطلب'
      );
    }
  }

  async handleAdminRoleRequestReview(
    request: RoleRequest,
    decision: 'approved' | 'rejected'
  ): Promise<void> {
    const adminUid = this.auth.currentUser()?.uid;
    if (!adminUid) return;
    const note = this.adminNoteControl.value.trim();
    const ok = await this.account.reviewRoleRequest(request, decision, adminUid, note);
    if (ok) {
      this.adminNoteControl.setValue('');
      const isEn = this.lib.i18n.lang() === 'en';
      this.lib.showToast(
        decision === 'approved'
          ? isEn
            ? 'Specialty role approved'
            : 'تم اعتماد الرتبة بنجاح'
          : isEn
            ? 'Role request declined'
            : 'تم رفض طلب الرتبة'
      );
    }
  }

  async confirmPermanentAccountDeletion(): Promise<void> {
    const uid = this.auth.currentUser()?.uid;
    if (!uid) return;
    const confirmInput = this.deleteConfirmText.value.trim();
    const expectedWord = this.lib.i18n.copy().profile.deleteConfirmWord;
    if (confirmInput !== 'حذف' && confirmInput.toUpperCase() !== expectedWord.toUpperCase()) {
      this.account.settingsError.set(
        this.lib.i18n.lang() === 'en'
          ? 'Please type "DELETE" to confirm permanent account deletion.'
          : 'يرجى كتابة كلمة «حذف» للتأكيد قبل الإجراء النهائي.'
      );
      return;
    }

    const pass = this.deleteReauthPassword.value || undefined;
    const ok = await this.account.deleteOwnAccount(uid, pass);
    if (ok) {
      this.showDeleteConfirmModal.set(false);
      this.closeSettingsDrawer();
      this.lib.showToast(
        this.lib.i18n.lang() === 'en'
          ? 'Your account and all its data have been permanently deleted'
          : 'تم حذف حسابك وجميع بياناته من المنصة نهائياً'
      );
      await this.router.navigateByUrl('/');
    }
  }

  async performLogout(): Promise<void> {
    this.closeSettingsDrawer();
    await this.lib.handleLogout();
  }

  copyProfileUrl(username: string): void {
    if (!username || typeof window === 'undefined') return;
    const fullUrl = `${window.location.origin}/#/profile/${username}`;
    if (navigator?.clipboard) {
      navigator.clipboard.writeText(fullUrl).catch(() => false);
    }
    this.copiedProfileLink.set(true);
    this.lib.showToast(
      this.lib.i18n.lang() === 'en'
        ? `Copied profile URL: /profile/${username}`
        : `تم نسخ رابط الحساب: /profile/${username}`
    );
    setTimeout(() => this.copiedProfileLink.set(false), 2200);
  }

  scrollSavedCarousel(direction: 'prev' | 'next'): void {
    const el = this.savedCarouselEl?.nativeElement;
    if (!el) return;
    const step = Math.max(260, Math.round(el.clientWidth * 0.72));
    const sign = this.lib.i18n.isRtl()
      ? direction === 'next'
        ? -1
        : 1
      : direction === 'next'
        ? 1
        : -1;
    el.scrollBy({ left: sign * step, behavior: 'smooth' });
  }
}
