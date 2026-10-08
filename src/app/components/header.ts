import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { NovelStore } from '../core/novel-store';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-header',
  imports: [RouterLink, RouterLinkActive, MatIconModule],
  template: `
    <header class="sticky top-0 z-40 bg-stone-900/95 backdrop-blur-md border-b border-stone-800 text-stone-100 shadow-md">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex items-center justify-between h-16 md:h-20">
          
          <!-- Logo & Brand -->
          <div class="flex items-center gap-3">
            <a routerLink="/library" class="flex items-center gap-3 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 rounded-lg p-1">
              <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-600 via-amber-700 to-amber-900 flex items-center justify-center shadow-md shadow-amber-950/40 text-amber-100 group-hover:scale-105 transition-transform duration-200">
                <mat-icon class="text-2xl">auto_stories</mat-icon>
              </div>
              <div class="flex flex-col">
                <div class="flex items-center gap-2">
                  <span class="text-xl font-bold tracking-tight text-white font-amiri">روايات MTX</span>
                  <span class="text-[10px] font-mono-code font-bold uppercase tracking-wider text-amber-400 bg-amber-950/80 px-1.5 py-0.5 rounded border border-amber-800/60">
                    .mtx v1.0
                  </span>
                </div>
                <span class="text-xs text-stone-400 hidden sm:inline">نظام القراءة والنشر بتقنية ضغط متقدمة 75%+</span>
              </div>
            </a>
          </div>

          <!-- Main Navigation Links -->
          <nav class="hidden md:flex items-center gap-1">
            <a
              routerLink="/library"
              routerLinkActive="bg-stone-800 text-amber-400 font-semibold"
              class="flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm text-stone-300 hover:text-white hover:bg-stone-800/60 transition-colors"
            >
              <mat-icon class="text-lg">library_books</mat-icon>
              <span>المكتبة والروايات</span>
            </a>

            <a
              routerLink="/reader"
              routerLinkActive="bg-stone-800 text-amber-400 font-semibold"
              class="flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm text-stone-300 hover:text-white hover:bg-stone-800/60 transition-colors"
            >
              <mat-icon class="text-lg">menu_book</mat-icon>
              <span>القارئ الذكي</span>
            </a>

            <a
              routerLink="/editor"
              routerLinkActive="bg-stone-800 text-amber-400 font-semibold"
              class="flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm text-stone-300 hover:text-white hover:bg-stone-800/60 transition-colors"
            >
              <mat-icon class="text-lg">edit_note</mat-icon>
              <span>استوديو الكتابة والنشر</span>
            </a>

            <a
              routerLink="/lab"
              routerLinkActive="bg-stone-800 text-amber-400 font-semibold"
              class="flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm text-stone-300 hover:text-white hover:bg-stone-800/60 transition-colors"
            >
              <mat-icon class="text-lg">psychology</mat-icon>
              <span>مختبر خوارزمية MTX</span>
            </a>
          </nav>

          <!-- Quick Stats & Actions -->
          <div class="flex items-center gap-2 sm:gap-3">
            <!-- Compression metric indicator -->
            <div class="hidden lg:flex flex-col items-end px-3 py-1 bg-stone-950/60 rounded-lg border border-stone-800 text-xs">
              <span class="text-stone-400 text-[11px]">نسبة تقليص البيانات</span>
              <span class="font-mono-code font-bold text-emerald-400">
                {{ store.globalStats().savingsPercent }}% أقل من UTF-8
              </span>
            </div>

            <!-- Upload / Import MTX file button -->
            <label class="cursor-pointer flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-medium border border-stone-700 transition-colors">
              <mat-icon class="text-base text-amber-400">upload_file</mat-icon>
              <span class="hidden sm:inline">فتح ملف .mtx</span>
              <input
                type="file"
                accept=".mtx"
                class="hidden"
                (change)="onFileSelected($event)"
              />
            </label>

            <!-- Write chapter primary button -->
            <button
              (click)="openEditor()"
              class="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-stone-950 font-bold text-xs shadow-sm transition-colors cursor-pointer"
            >
              <mat-icon class="text-base">add</mat-icon>
              <span>فصل جديد</span>
            </button>
          </div>

        </div>

        <!-- Mobile Navigation bar -->
        <div class="md:hidden flex items-center justify-around py-2 border-t border-stone-800/80 text-xs">
          <a
            routerLink="/library"
            routerLinkActive="text-amber-400 font-bold"
            class="flex flex-col items-center gap-0.5 text-stone-300 py-1 px-2"
          >
            <mat-icon class="text-xl">library_books</mat-icon>
            <span>المكتبة</span>
          </a>
          <a
            routerLink="/reader"
            routerLinkActive="text-amber-400 font-bold"
            class="flex flex-col items-center gap-0.5 text-stone-300 py-1 px-2"
          >
            <mat-icon class="text-xl">menu_book</mat-icon>
            <span>القارئ</span>
          </a>
          <a
            routerLink="/editor"
            routerLinkActive="text-amber-400 font-bold"
            class="flex flex-col items-center gap-0.5 text-stone-300 py-1 px-2"
          >
            <mat-icon class="text-xl">edit_note</mat-icon>
            <span>الكتابة</span>
          </a>
          <a
            routerLink="/lab"
            routerLinkActive="text-amber-400 font-bold"
            class="flex flex-col items-center gap-0.5 text-stone-300 py-1 px-2"
          >
            <mat-icon class="text-xl">psychology</mat-icon>
            <span>المختبر</span>
          </a>
        </div>

      </div>
    </header>
  `,
})
export class Header {
  readonly store = inject(NovelStore);
  private readonly router = inject(Router);

  openEditor(): void {
    this.router.navigate(['/editor']);
  }

  async onFileSelected(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;

    const file = input.files[0];
    const arrayBuffer = await file.arrayBuffer();
    const bytes = new Uint8Array(arrayBuffer);

    try {
      await this.store.importMtxFile(bytes, file.name);
      this.router.navigate(['/reader']);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'حدث خطأ أثناء قراءة ملف MTX.');
    } finally {
      input.value = '';
    }
  }
}
