import { ChangeDetectionStrategy, Component, computed, inject, input, signal } from '@angular/core';
import { AccountService } from '../../../core/services/account.service';
import { I18nService } from '../../../core/services/i18n.service';

@Component({
  selector: 'app-writer-badge',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '(document:keydown.escape)': 'closePopover()',
  },
  template: `
    @if (roleKind() === 'founder') {
      @let wb = i18n.copy().writerBadge;
      <span class="relative inline-flex items-center align-middle shrink-0">
        <button
          type="button"
          (click)="togglePopover($event)"
          [title]="wb.founderCompactTitle"
          [attr.aria-label]="wb.founderCompactTitle"
          [attr.aria-expanded]="isPopoverOpen()"
          [class]="
            compact()
              ? 'founder-seal-card inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-extrabold tracking-wide cursor-pointer transition-transform hover:scale-[1.03] active:scale-[0.98]'
              : 'founder-seal-card inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[11px] font-extrabold tracking-wide cursor-pointer transition-transform hover:scale-[1.03] active:scale-[0.98]'
          "
        >
          <svg
            [class]="compact() ? 'w-3.5 h-3.5 shrink-0' : 'w-4 h-4 shrink-0'"
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden="true"
          >
            <!-- Outer Sovereign Seal Ring -->
            <circle
              cx="12"
              cy="12"
              r="10.2"
              stroke="currentColor"
              stroke-width="1.4"
              fill="currentColor"
              fill-opacity="0.14"
            />
            <!-- Crown Apex -->
            <path
              d="M7.2 9.4L8.6 5.8L12 8.2L15.4 5.8L16.8 9.4H7.2Z"
              stroke="currentColor"
              stroke-width="1.35"
              fill="currentColor"
              fill-opacity="0.28"
              stroke-linejoin="round"
            />
            <!-- Open Literary Book -->
            <path
              d="M12 11.4C10.5 10.8 8.7 10.7 7.4 11.2V16.8C8.7 16.3 10.5 16.4 12 17.1M12 11.4C13.5 10.8 15.3 10.7 16.6 11.2V16.8C15.3 16.3 13.5 16.4 12 17.1M12 11.4V17.1"
              stroke="currentColor"
              stroke-width="1.4"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>
          <span class="font-mono tracking-wider">{{ wb.founderCode }}</span>
          @if (!compact()) {
            <span class="opacity-70">·</span>
            <span>{{ wb.founderTitle }}</span>
          }
        </button>

        @if (isPopoverOpen()) {
          <button
            type="button"
            class="fixed inset-0 z-40 cursor-default bg-transparent border-none"
            [attr.aria-label]="i18n.copy().modals.close"
            (click)="closePopover($event)"
          ></button>

          <div
            role="dialog"
            [attr.aria-label]="wb.founderLabel"
            (click)="$event.stopPropagation()"
            (keydown)="$event.stopPropagation()"
            class="liquid-glass-card absolute top-full mt-2 start-0 z-50 w-72 sm:w-80 p-4 rounded-2xl border border-[#e9c349]/45 shadow-2xl text-start space-y-2.5 animate-fadeIn"
          >
            <div class="flex items-center justify-between gap-2">
              <div class="flex items-center gap-2 min-w-0">
                <span class="founder-seal-card px-2 py-0.5 rounded-md text-[10px] font-mono font-extrabold shrink-0">
                  {{ wb.founderCode }}
                </span>
                <span class="text-xs font-extrabold text-on-surface truncate">{{ wb.founderTitle }}</span>
              </div>
              <span class="text-[11px] font-mono text-secondary shrink-0">{{ wb.founderHandle }}</span>
            </div>

            <div class="text-[11px] font-semibold text-secondary">
              {{ wb.founderAdminRole }}
            </div>

            <p class="text-[11px] text-on-surface-variant leading-relaxed">
              {{ wb.founderVerifiedNote }}
            </p>
          </div>
        }
      </span>
    } @else if (roleKind() === 'author') {
      @let wb = i18n.copy().writerBadge;
      <span
        [title]="wb.writerVerifiedNote"
        [attr.aria-label]="wb.label"
        [class]="
          compact()
            ? 'inline-flex items-center justify-center align-middle shrink-0 text-[#9A7209] dark:text-[#E9C349]'
            : 'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg bg-[#9A7209]/10 dark:bg-[#E9C349]/15 border border-[#9A7209]/35 dark:border-[#E9C349]/35 text-[#9A7209] dark:text-[#E9C349] text-[11px] font-bold align-middle shrink-0 shadow-xs'
        "
      >
        <svg class="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <polygon
            points="12,1.5 19.4,4.6 22.5,12 19.4,19.4 12,22.5 4.6,19.4 1.5,12 4.6,4.6"
            stroke="currentColor"
            stroke-width="1.6"
            fill="currentColor"
            fill-opacity="0.14"
          />
          <path
            d="M12 8.2C10.5 7.4 8.6 7.3 7.2 7.8V15.4C8.6 14.9 10.5 15 12 15.8M12 8.2C13.5 7.4 15.4 7.3 16.8 7.8V15.4C15.4 14.9 13.5 15 12 15.8M12 8.2V15.8"
            stroke="currentColor"
            stroke-width="1.5"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        </svg>
        @if (!compact()) {
          <span>{{ wb.label }}</span>
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
  readonly isPopoverOpen = signal<boolean>(false);

  readonly roleKind = computed<'founder' | 'author' | 'none'>(() => {
    const uid = this.authorId();
    if (!uid) return 'none';
    this.accountService.writerBadgeCache();
    this.accountService.writerRoleCache();
    const role = this.accountService.getAuthorRoleKind(uid);
    if (role !== 'none') return role;
    return this.accountService.verifyWriterBadge(uid) ? 'author' : 'none';
  });

  togglePopover(event?: Event): void {
    if (event) {
      event.stopPropagation();
      event.preventDefault();
    }
    this.isPopoverOpen.update((v) => !v);
  }

  closePopover(event?: Event): void {
    if (event) {
      event.stopPropagation();
    }
    this.isPopoverOpen.set(false);
  }
}
