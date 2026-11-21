import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import { LibraryStateService } from '../../../core/services/library-state.service';
import { ThemeService } from '../../../core/services/theme.service';
import { AuthSessionService } from '../../../core/services/auth-session.service';
import { AccountService } from '../../../core/services/account.service';

const DRAWER_EXIT_DURATION_MS = 260;

@Component({
  selector: 'app-site-header',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [],
  templateUrl: './site-header.html',
  host: {
    '(document:keydown.escape)': 'onEscapePress()',
  },
})
export class SiteHeader {
  readonly lib = inject(LibraryStateService);
  readonly themeService = inject(ThemeService);
  readonly auth = inject(AuthSessionService);
  readonly account = inject(AccountService);
  private readonly destroyRef = inject(DestroyRef);

  readonly drawerClosing = signal<boolean>(false);
  readonly isDrawerRendered = computed<boolean>(() => this.lib.isMobileNavOpen() || this.drawerClosing());
  readonly isDrawerExiting = computed<boolean>(() => !this.lib.isMobileNavOpen() && this.drawerClosing());

  private closeTimer: ReturnType<typeof setTimeout> | null = null;
  private hasMountedOpenDrawer = false;

  constructor() {
    effect(() => {
      const open = this.lib.isMobileNavOpen();
      if (open) {
        this.hasMountedOpenDrawer = true;
        this.clearCloseTimer();
        this.drawerClosing.set(false);
      } else if (this.hasMountedOpenDrawer) {
        this.startExitTransition();
      }
    });

    this.destroyRef.onDestroy(() => {
      this.clearCloseTimer();
    });
  }

  closeDrawer(): void {
    if (this.lib.isMobileNavOpen()) {
      this.startExitTransition();
      this.lib.isMobileNavOpen.set(false);
    }
  }

  onEscapePress(): void {
    this.closeDrawer();
  }

  private startExitTransition(): void {
    if (this.drawerClosing()) return;
    this.clearCloseTimer();
    this.drawerClosing.set(true);
    this.closeTimer = setTimeout(() => {
      this.drawerClosing.set(false);
      this.closeTimer = null;
    }, DRAWER_EXIT_DURATION_MS);
  }

  private clearCloseTimer(): void {
    if (this.closeTimer !== null) {
      clearTimeout(this.closeTimer);
      this.closeTimer = null;
    }
  }
}
