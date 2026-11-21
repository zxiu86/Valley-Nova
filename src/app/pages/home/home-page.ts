import { ChangeDetectionStrategy, Component, computed, effect, inject, signal } from '@angular/core';
import {
  AmbientRgb,
  AdaptiveAmbientPalette,
  buildAdaptiveAmbientPalette,
  extractCoverAmbientColors,
  getCachedRawAmbientColors,
} from '../../core/cover-ambient-lighting';
import { LibraryStateService } from '../../core/services/library-state.service';
import { ThemeService } from '../../core/services/theme.service';

@Component({
  selector: 'app-home-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './home-page.html',
})
export class HomePage {
  readonly lib = inject(LibraryStateService);
  private readonly themeService = inject(ThemeService);

  private readonly rawSpotlightColors = signal<AmbientRgb[]>([]);
  readonly spotlightAmbient = computed<AdaptiveAmbientPalette>(() =>
    buildAdaptiveAmbientPalette(this.rawSpotlightColors(), this.themeService.isDark())
  );

  readonly heroRailSkeletons = [1, 2, 3, 4];
  readonly shelfSkeletons = [1, 2, 3, 4, 5];
  readonly serendipitySkeletons = [1, 2, 3];
  readonly rankedSkeletons = [1, 2, 3, 4, 5];

  constructor() {
    effect((onCleanup) => {
      const coverUrl = this.lib.featuredSpotlight()?.coverUrl?.trim();
      if (!coverUrl) {
        this.rawSpotlightColors.set([]);
        return;
      }

      const cached = getCachedRawAmbientColors(coverUrl);
      if (cached) {
        this.rawSpotlightColors.set(cached);
        return;
      }

      let cancelled = false;
      onCleanup(() => {
        cancelled = true;
      });

      void extractCoverAmbientColors(coverUrl).then((colors) => {
        if (!cancelled && this.lib.featuredSpotlight()?.coverUrl?.trim() === coverUrl) {
          this.rawSpotlightColors.set(colors);
        }
      });
    });
  }
}
