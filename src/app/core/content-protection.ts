import { Injectable } from '@angular/core';

/**
 * ContentProtectionService
 * نظام مركزي شامل لحماية المحتوى التحريري وإغلاق النسخ والتحديد في كافة صفحات ومكونات الموقع.
 * يمنع:
 * 1. تحديد النصوص (user-select: none & selectstart)
 * 2. النسخ والقص (copy & cut events)
 * 3. سحب العناصر والصور (dragstart)
 * 4. القائمة المنبثقة للزر الأيمن (contextmenu)
 * 5. اختصارات لوحة المفاتيح (Ctrl+C, Ctrl+A, Ctrl+X, Ctrl+U, Ctrl+S, Ctrl+P)
 * مع استثناء آمن لحقول الإدخال والبحث المخصصة للمستخدم.
 */
@Injectable({
  providedIn: 'root',
})
export class ContentProtectionService {
  private isInitialized = false;

  init(): void {
    if (this.isInitialized || typeof window === 'undefined') return;
    this.isInitialized = true;

    const isInteractiveInput = (target: EventTarget | null): boolean => {
      if (!target || !(target instanceof HTMLElement)) return false;
      const tag = target.tagName.toUpperCase();
      return tag === 'INPUT' || tag === 'TEXTAREA' || target.isContentEditable;
    };

    // 1. منع بدء تحديد النصوص برمجياً (selectstart)
    document.addEventListener(
      'selectstart',
      (e) => {
        if (!isInteractiveInput(e.target)) {
          e.preventDefault();
          return false;
        }
        return true;
      },
      { capture: true }
    );

    // 2. منع قائمة الزر الأيمن (Context Menu)
    document.addEventListener(
      'contextmenu',
      (e) => {
        if (!isInteractiveInput(e.target)) {
          e.preventDefault();
          return false;
        }
        return true;
      },
      { capture: true }
    );

    // 3. منع النسخ والقص وسحب العناصر
    document.addEventListener(
      'copy',
      (e) => {
        if (!isInteractiveInput(e.target)) {
          e.preventDefault();
          return false;
        }
        return true;
      },
      { capture: true }
    );

    document.addEventListener(
      'cut',
      (e) => {
        if (!isInteractiveInput(e.target)) {
          e.preventDefault();
          return false;
        }
        return true;
      },
      { capture: true }
    );

    document.addEventListener(
      'dragstart',
      (e) => {
        e.preventDefault();
        return false;
      },
      { capture: true }
    );

    // 4. منع اختصارات لوحة المفاتيح الشائعة للنسخ وتحديد الكل وحفظ الصفحة (Ctrl+C, Ctrl+A, Ctrl+X, Ctrl+U, Ctrl+S, Ctrl+P)
    document.addEventListener(
      'keydown',
      (e) => {
        if (isInteractiveInput(e.target)) {
          return true;
        }

        if (
          (e.ctrlKey || e.metaKey) &&
          (e.key === 'c' ||
            e.key === 'C' ||
            e.key === 'a' ||
            e.key === 'A' ||
            e.key === 'x' ||
            e.key === 'X' ||
            e.key === 'u' ||
            e.key === 'U' ||
            e.key === 's' ||
            e.key === 'S' ||
            e.key === 'p' ||
            e.key === 'P')
        ) {
          e.preventDefault();
          return false;
        }
        return true;
      },
      { capture: true }
    );
  }
}

/**
 * دالة مساعدة عامة يمكن استدعاؤها في أي مكان لضمان تفعيل الحماية
 */
export function enforceContentProtection(): void {
  if (typeof window !== 'undefined') {
    const service = new ContentProtectionService();
    service.init();
  }
}
