import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { LibraryStateService } from '../../core/services/library-state.service';
import { WriterBadge } from '../../shared/components/writer-badge/writer-badge';

@Component({
  selector: 'app-explore-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, WriterBadge],
  templateUrl: './explore-page.html',
})
export class ExplorePage {
  readonly lib = inject(LibraryStateService);
}
