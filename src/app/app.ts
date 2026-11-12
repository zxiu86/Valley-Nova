import { ChangeDetectionStrategy, Component, OnDestroy, OnInit, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { LibraryStateService } from './core/services/library-state.service';
import { CopyProtectionService } from './core/copy-protection/copy-protection.service';
import { MosaicTransitionOverlay } from './shared/components/mosaic-transition/mosaic-transition';
import { SiteHeader } from './shared/components/site-header/site-header';
import { SiteFooter } from './shared/components/site-footer/site-footer';
import { GlobalModals } from './shared/components/global-modals/global-modals';

export type { NovelCard, SerendipityNovel, ChapterItem, LiterarySalon } from './core/models/library.models';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-root',
  imports: [RouterOutlet, MosaicTransitionOverlay, SiteHeader, SiteFooter, GlobalModals],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App implements OnInit, OnDestroy {
  readonly lib = inject(LibraryStateService);
  private readonly copyProtection = inject(CopyProtectionService);

  // Preserved reactive form reference for suite compatibility
  readonly compressForm = this.lib.compressForm;

  ngOnInit(): void {
    void this.lib.init();
    this.copyProtection.init();
  }

  ngOnDestroy(): void {
    this.copyProtection.destroy();
    this.lib.destroy();
  }
}
