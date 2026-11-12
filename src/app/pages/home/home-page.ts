import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { LibraryStateService } from '../../core/services/library-state.service';

@Component({
  selector: 'app-home-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './home-page.html',
})
export class HomePage {
  readonly lib = inject(LibraryStateService);
}
