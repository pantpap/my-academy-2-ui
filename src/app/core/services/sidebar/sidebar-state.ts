import { inject, Injectable, signal } from '@angular/core';
import { SIDEBAR_COLLAPSED } from '../../../common/constants/local-storage-constants';
import { LocalStorage } from '../localStorage/local-storage';

/**
 * Αν το sidebar είναι κλειστό (μόνο εικονίδια). Το αλλάζει το burger του header,
 * το διαβάζει το sidebar. Μένει στο localStorage, και μετά από logout
 * (SPEC-sidebar-collapse.md).
 */
@Injectable({ providedIn: 'root' })
export class SidebarState {
  private readonly localStorageService = inject(LocalStorage);

  private readonly collapsedSignal = signal(
    this.localStorageService.getItem(SIDEBAR_COLLAPSED) === true,
  );
  readonly collapsed = this.collapsedSignal.asReadonly();

  toggle(): void {
    this.collapsedSignal.update((value) => !value);
    this.localStorageService.setItem(SIDEBAR_COLLAPSED, this.collapsedSignal());
  }
}
