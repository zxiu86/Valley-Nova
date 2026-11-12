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

  // Admin Review Note Control
  readonly adminNoteControl = new FormControl('', { nonNullable: true });

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
    return Boolean(status.isWriterBadge && status.canPublish);
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
        void this.router.navigateByUrl('/auth');
        return;
      }

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

  openSettingsDrawer(section: 'edit' | 'privacy' | 'writer' | 'security' | 'admin' = 'edit'): void {
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

    if (!file.type.startsWith('image/')) {
      this.account.settingsError.set('يرجى اختيار ملف صورة صالح (JPG أو PNG أو WebP).');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      this.account.settingsError.set('حجم الصورة يتجاوز الحد المسموح به (١٠ ميغابايت).');
      return;
    }

    const reader = new FileReader();
    reader.onload = async () => {
      const sourceUrl = typeof reader.result === 'string' ? reader.result : '';
      if (!sourceUrl) return;

      const dims = await new Promise<{ w: number; h: number }>((resolve) => {
        const img = new Image();
        img.onload = () => resolve({ w: img.width, h: img.height });
        img.onerror = () => resolve({ w: 1500, h: 800 });
        img.src = sourceUrl;
      });

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
        // Fallback keeps original
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
      this.lib.showToast('تم حفظ بيانات الملف الشخصي بنجاح');
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
      this.lib.showToast('تم حفظ وتطبيق إعدادات الخصوصية');
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

    const val = this.writerForm.getRawValue();
    if (!val.penName.trim() || !val.shortBio.trim() || !val.writingSample.trim()) {
      this.account.settingsError.set('يرجى تعبئة الاسم الأدبي، والنبذة، ونموذج الكتابة بالكامل.');
      return;
    }

    const ok = await this.account.submitWriterApplication(uid, {
      penName: val.penName,
      shortBio: val.shortBio,
      genres: this.selectedWriterGenres(),
      writingSample: val.writingSample,
    });
    if (ok) {
      this.lib.showToast('تم إرسال طلب الانضمام ككاتب للمراجعة بنجاح');
    }
  }

  async handleAdminReview(applicantUid: string, decision: 'approved' | 'rejected'): Promise<void> {
    const adminUid = this.auth.currentUser()?.uid;
    if (!adminUid) return;
    const note = this.adminNoteControl.value.trim();
    const ok = await this.account.reviewApplication(applicantUid, decision, adminUid, note);
    if (ok) {
      this.adminNoteControl.setValue('');
      this.lib.showToast(
        decision === 'approved' ? 'تمت الموافقة ومنح شارة الكاتب' : 'تم رفض الطلب'
      );
    }
  }

  async confirmPermanentAccountDeletion(): Promise<void> {
    const uid = this.auth.currentUser()?.uid;
    if (!uid) return;
    if (this.deleteConfirmText.value.trim() !== 'حذف') {
      this.account.settingsError.set('يرجى كتابة كلمة «حذف» للتأكيد قبل الإجراء النهائي.');
      return;
    }

    const pass = this.deleteReauthPassword.value || undefined;
    const ok = await this.account.deleteOwnAccount(uid, pass);
    if (ok) {
      this.showDeleteConfirmModal.set(false);
      this.closeSettingsDrawer();
      this.lib.showToast('تم حذف حسابك وجميع بياناته من المنصة نهائياً');
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
    this.lib.showToast(`تم نسخ رابط الحساب: /profile/${username}`);
    setTimeout(() => this.copiedProfileLink.set(false), 2200);
  }

  scrollSavedCarousel(direction: 'prev' | 'next'): void {
    const el = this.savedCarouselEl?.nativeElement;
    if (!el) return;
    const step = Math.max(260, Math.round(el.clientWidth * 0.72));
    // RTL aware scroll
    const delta = direction === 'next' ? -step : step;
    el.scrollBy({ left: delta, behavior: 'smooth' });
  }
}
