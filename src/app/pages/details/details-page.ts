import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { LibraryStateService } from '../../core/services/library-state.service';

@Component({
  selector: 'app-details-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule],
  templateUrl: './details-page.html',
})
export class DetailsPage {
  readonly lib = inject(LibraryStateService);
}
