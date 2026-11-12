import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { AuthSessionService } from '../../core/services/auth-session.service';
import { LibraryStateService } from '../../core/services/library-state.service';

@Component({
  selector: 'app-auth-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule],
  templateUrl: './auth-page.html',
})
export class AuthPage {
  readonly auth = inject(AuthSessionService);
  readonly lib = inject(LibraryStateService);
}
