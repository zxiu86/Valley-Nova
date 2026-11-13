import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { ThemeService } from '../../../core/services/theme.service';

@Component({
  selector: 'app-mosaic-transition',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (themeService.isPaperRevealActive()) {
      <div
        aria-hidden="true"
        class="fixed inset-0 z-[9999] pointer-events-none overflow-hidden"
        [style.contain]="'strict'"
      >
        <div
          class="absolute inset-0 will-change-[transform,opacity]"
          [style.background-color]="themeService.paperRevealOutgoingBg()"
          [style.box-shadow]="paperShadow()"
          [style.backface-visibility]="'hidden'"
          [style.transition-property]="'transform, opacity'"
          [style.transition-duration]="'440ms'"
          [style.transition-timing-function]="'cubic-bezier(0.22, 1, 0.36, 1)'"
          [style.opacity]="themeService.paperRevealPeeling() ? '0' : '1'"
          [style.transform]="paperTransform()"
        >
          <div
            class="absolute inset-y-0 w-10 pointer-events-none"
            [class.left-0]="themeService.paperRevealDirection() === 'to-light'"
            [class.right-0]="themeService.paperRevealDirection() === 'to-dark'"
            [style.background]="'linear-gradient(to right, transparent, ' + themeService.paperRevealEdgeColor() + ', transparent)'"
          ></div>
        </div>
      </div>
    }
  `,
})
export class MosaicTransitionOverlay {
  readonly themeService = inject(ThemeService);

  readonly paperTransform = computed(() => {
    if (!this.themeService.paperRevealPeeling()) {
      return 'translate3d(0, 0, 0)';
    }
    return this.themeService.paperRevealDirection() === 'to-light'
      ? 'translate3d(104%, 0, 0)'
      : 'translate3d(-104%, 0, 0)';
  });

  readonly paperShadow = computed(() => {
    return this.themeService.paperRevealDirection() === 'to-light'
      ? '-24px 0 48px rgba(0, 0, 0, 0.26)'
      : '24px 0 48px rgba(0, 0, 0, 0.22)';
  });
}
