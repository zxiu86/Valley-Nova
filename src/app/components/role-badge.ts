import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { AppRole } from '../core/novel-models';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-role-badge',
  template: `
    @if (role() === 'auditor') {
      <span
        class="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-[#005039]/80 text-[#7bd8b1] border border-[#7bd8b1]/30 shadow-xs select-none"
        title="مدقق معتمد"
      >
        <span class="material-symbols-outlined text-[12px]">verified_user</span>
        <span>مدقق</span>
      </span>
    } @else if (role() === 'author') {
      <span
        class="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-[#af8d11]/30 text-[#e9c349] border border-[#e9c349]/30 shadow-xs select-none"
        title="كاتب ومؤلف معتمد"
      >
        <span class="material-symbols-outlined text-[12px]">history_edu</span>
        <span>كاتب</span>
      </span>
    } @else if (role() === 'translate') {
      <span
        class="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-[#881337]/60 text-[#ffb2bd] border border-[#ffb2bd]/30 shadow-xs select-none"
        title="مترجم معتمد"
      >
        <span class="material-symbols-outlined text-[12px]">translate</span>
        <span>مترجم</span>
      </span>
    }
    <!-- Founder role explicitly receives NO visible badge -->
  `,
})
export class RoleBadge {
  readonly role = input<AppRole | string | null | undefined>(null);
}
