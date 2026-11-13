import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { ThemeService } from '../../../core/services/theme.service';

@Component({
  selector: 'app-mosaic-transition',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (themeService.isPaperRevealActive()) {
      <div
        aria-hidden="true"
        class="fixed inset-0 z-[9998] pointer-events-none overflow-hidden"
        [style.contain]="'strict'"
      >
        <div
          class="absolute -translate-x-1/2 -translate-y-1/2 rounded-full will-change-[transform,opacity]"
          [style.left.px]="themeService.revealOriginX()"
          [style.top.px]="themeService.revealOriginY()"
          [style.width.px]="haloDiameter()"
          [style.height.px]="haloDiameter()"
          [style.background]="haloGradient()"
          [style.transition-property]="'transform, opacity'"
          [style.transition-duration]="'520ms'"
          [style.transition-timing-function]="'cubic-bezier(0.22, 1, 0.36, 1)'"
          [style.transform]="haloTransform()"
          [style.opacity]="haloOpacity()"
        ></div>
      </div>
    }
  `,
})
export class MosaicTransitionOverlay {
  readonly themeService = inject(ThemeService);

  readonly haloDiameter = computed(() => Math.max(this.themeService.revealEndRadius() * 1.4, 720));

  readonly haloGradient = computed(() => {
    const edge = this.themeService.paperRevealEdgeColor();
    return `radial-gradient(circle, ${edge} 0%, transparent 62%)`;
  });

  readonly haloTransform = computed(() => {
    return this.themeService.paperRevealPeeling() ? 'scale(1.15)' : 'scale(0.08)';
  });

  readonly haloOpacity = computed(() => {
    if (this.themeService.usingViewTransition()) {
      return this.themeService.paperRevealPeeling() ? '0' : '0.45';
    }
    return this.themeService.paperRevealPeeling() ? '0' : '0.6';
  });
}
