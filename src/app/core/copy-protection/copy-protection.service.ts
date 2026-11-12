import { Injectable, PLATFORM_ID, inject, signal } from '@angular/core';
import { isPlatformBrowser, DOCUMENT } from '@angular/common';

@Injectable({ providedIn: 'root' })
export class CopyProtectionService {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly document = inject(DOCUMENT);

  readonly isEnabled = signal<boolean>(true);
  private initialized = false;
  private cleanupFns: (() => void)[] = [];

  init(): void {
    if (this.initialized || !isPlatformBrowser(this.platformId)) return;
    this.initialized = true;

    const root = this.document.documentElement;
    root.classList.add('mtx-copy-protected');

    const onCopyOrCut = (event: ClipboardEvent) => {
      if (!this.isEnabled()) return;
      if (this.isExemptTarget(event.target)) return;
      event.preventDefault();
    };

    const onContextMenu = (event: MouseEvent) => {
      if (!this.isEnabled()) return;
      if (this.isExemptTarget(event.target)) return;
      event.preventDefault();
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (!this.isEnabled()) return;
      if (this.isExemptTarget(event.target)) return;

      const isModifier = event.ctrlKey || event.metaKey;
      if (!isModifier) return;

      const key = event.key.toLowerCase();
      if (key === 'c' || key === 'x' || key === 'a' || key === 's' || key === 'u') {
        event.preventDefault();
      }
    };

    const onSelectStart = (event: Event) => {
      if (!this.isEnabled()) return;
      if (this.isExemptTarget(event.target)) return;
      event.preventDefault();
    };

    this.document.addEventListener('copy', onCopyOrCut, true);
    this.document.addEventListener('cut', onCopyOrCut, true);
    this.document.addEventListener('contextmenu', onContextMenu, true);
    this.document.addEventListener('keydown', onKeyDown, true);
    this.document.addEventListener('selectstart', onSelectStart, true);

    this.cleanupFns = [
      () => this.document.removeEventListener('copy', onCopyOrCut, true),
      () => this.document.removeEventListener('cut', onCopyOrCut, true),
      () => this.document.removeEventListener('contextmenu', onContextMenu, true),
      () => this.document.removeEventListener('keydown', onKeyDown, true),
      () => this.document.removeEventListener('selectstart', onSelectStart, true),
    ];
  }

  destroy(): void {
    if (!this.initialized || !isPlatformBrowser(this.platformId)) return;
    this.document.documentElement.classList.remove('mtx-copy-protected');
    this.cleanupFns.forEach((fn) => fn());
    this.cleanupFns = [];
    this.initialized = false;
  }

  private isExemptTarget(target: EventTarget | null): boolean {
    if (!(target instanceof HTMLElement)) {
      const parent = (target as Node | null)?.parentElement;
      return parent ? this.isExemptElement(parent) : false;
    }
    return this.isExemptElement(target);
  }

  private isExemptElement(el: HTMLElement): boolean {
    const tag = el.tagName;
    if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || tag === 'OPTION') {
      return true;
    }
    if (el.isContentEditable || el.getAttribute('contenteditable') === 'true' || el.getAttribute('contenteditable') === '') {
      return true;
    }
    if (el.closest('input, textarea, select, [contenteditable="true"], [contenteditable=""], [data-allow-copy="true"], .allow-text-select')) {
      return true;
    }
    return false;
  }
}
