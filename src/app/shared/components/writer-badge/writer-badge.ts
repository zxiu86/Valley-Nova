import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { AccountService } from '../../../core/services/account.service';
import { I18nService } from '../../../core/services/i18n.service';

@Component({
  selector: 'app-writer-badge',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (isVerifiedWriter()) {
      @let badgeText = i18n.copy().writerBadge.label;
      <span
        [title]="badgeText"
        [attr.aria-label]="badgeText"
        [class]="
          compact()
            ? 'inline-flex items-center justify-center align-middle shrink-0 text-[#9A7209] dark:text-[#E9C349]'
            : 'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg bg-[#9A7209]/10 dark:bg-[#E9C349]/15 border border-[#9A7209]/35 dark:border-[#E9C349]/35 text-[#9A7209] dark:text-[#E9C349] text-[11px] font-bold align-middle shrink-0 shadow-xs'
        "
      >
        <svg
          [class]="compact() ? 'w-4 h-4' : 'w-4 h-4'"
          viewBox="0 0 24 24"
          fill="none"
          aria-hidden="true"
        >
          <!-- Geometric Octagonal Literary Seal -->
          <polygon
            points="12,1.5 19.4,4.6 22.5,12 19.4,19.4 12,22.5 4.6,19.4 1.5,12 4.6,4.6"
            stroke="currentColor"
            stroke-width="1.6"
            fill="currentColor"
            fill-opacity="0.14"
          />
          <!-- Open Book Icon -->
          <path
            d="M12 8.2C10.5 7.4 8.6 7.3 7.2 7.8V15.4C8.6 14.9 10.5 15 12 15.8M12 8.2C13.5 7.4 15.4 7.3 16.8 7.8V15.4C15.4 14.9 13.5 15 12 15.8M12 8.2V15.8"
            stroke="currentColor"
            stroke-width="1.5"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        </svg>
        @if (!compact()) {
          <span>{{ badgeText }}</span>
        }
      </span>
    }
  `,
})
export class WriterBadge {
  private readonly accountService = inject(AccountService);
  readonly i18n = inject(I18nService);

  readonly authorId = input<string | undefined>(undefined);
  readonly compact = input<boolean>(false);

  readonly isVerifiedWriter = computed(() => {
    const uid = this.authorId();
    if (!uid) return false;
    // Subscribe to reactive cache updates
    this.accountService.writerBadgeCache();
    return this.accountService.verifyWriterBadge(uid);
  });
}
