import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { LibraryStateService } from '../../core/services/library-state.service';

@Component({
  selector: 'app-reading-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule],
  templateUrl: './reading-page.html',
})
export class ReadingPage {
  readonly lib = inject(LibraryStateService);
}
