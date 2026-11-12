import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { LibraryStateService } from '../../../core/services/library-state.service';

@Component({
  selector: 'app-global-modals',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule],
  templateUrl: './global-modals.html',
})
export class GlobalModals {
  readonly lib = inject(LibraryStateService);
}
