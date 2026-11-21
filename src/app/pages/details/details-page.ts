import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { AccountService } from '../../core/services/account.service';
import { LibraryStateService } from '../../core/services/library-state.service';
import { WriterBadge } from '../../shared/components/writer-badge/writer-badge';

@Component({
  selector: 'app-details-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, WriterBadge],
  templateUrl: './details-page.html',
})
export class DetailsPage {
  readonly lib = inject(LibraryStateService);
  readonly accountService = inject(AccountService);
  readonly chapterSkeletons = [1, 2, 3, 4];

  isHttpUrl(value: string | undefined): boolean {
    if (!value) return false;
    const trimmed = value.trim().toLowerCase();
    return trimmed.startsWith('https://') || trimmed.startsWith('http://');
  }
}
