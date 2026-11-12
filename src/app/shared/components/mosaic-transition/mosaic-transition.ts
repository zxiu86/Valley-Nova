import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ThemeService } from '../../../core/services/theme.service';

@Component({
  selector: 'app-mosaic-transition',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (themeService.isMosaicActive()) {
      <div
        aria-hidden="true"
        class="fixed inset-0 z-[9999] pointer-events-none overflow-hidden grid"
        [style.grid-template-columns]="'repeat(' + themeService.mosaicCols() + ', minmax(0, 1fr))'"
        [style.grid-template-rows]="'repeat(' + themeService.mosaicRows() + ', minmax(0, 1fr))'"
      >
        @for (tile of themeService.mosaicTiles(); track tile.id) {
          <div
            class="w-full h-full will-change-transform"
            [style.background-color]="tile.bgColor"
            [style.border]="'1px solid ' + tile.borderColor"
            [style.transition-property]="'transform, opacity'"
            [style.transition-duration]="'380ms'"
            [style.transition-timing-function]="'cubic-bezier(0.22, 1, 0.36, 1)'"
            [style.transition-delay.ms]="tile.delayMs"
            [style.opacity]="themeService.mosaicDispersing() ? 0 : 1"
            [style.transform]="
              themeService.mosaicDispersing()
                ? 'translate3d(' + tile.disperseX + 'px, ' + tile.disperseY + 'px, 0) scale(0.08) rotate(' + tile.rotateDeg + 'deg)'
                : 'translate3d(0, 0, 0) scale(1) rotate(0deg)'
            "
          ></div>
        }
      </div>
    }
  `,
})
export class MosaicTransitionOverlay {
  readonly themeService = inject(ThemeService);
}
