import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { LibraryStateService } from '../../../core/services/library-state.service';
import { ThemeService } from '../../../core/services/theme.service';
import { AuthSessionService } from '../../../core/services/auth-session.service';

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

  onEscapePress(): void {
    if (this.lib.isMobileNavOpen()) {
      this.lib.isMobileNavOpen.set(false);
    }
  }
}
