import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { LibraryStateService } from '../../../core/services/library-state.service';

@Component({
  selector: 'app-site-footer',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './site-footer.html',
})
export class SiteFooter {
  readonly lib = inject(LibraryStateService);
}
