import { inject, Injectable, signal } from '@angular/core';
import { LocalStorage } from '../localStorage/local-storage';
import { ORGANIZATION } from '../../../common/constants/local-storage-constants';
import { Organization } from '../../../common/interfaces/organization';

// Ο οργανισμός του συνδεδεμένου χρήστη, σε ένα κεντρικό signal (SPEC-logout.md).
// Αποθηκεύεται και στο localStorage ώστε να αντέχει σε refresh. Το login τον γράφει,
// το logout τον σβήνει· όποιος τον χρειάζεται τον διαβάζει (π.χ. με computed).
@Injectable({
  providedIn: 'root',
})
export class Session {
  private readonly localStorageService = inject(LocalStorage);

  private readonly _organization = signal(
    this.localStorageService.getItem<Organization | null>(ORGANIZATION),
  );
  readonly organization = this._organization.asReadonly();

  setOrganization(organization: Organization): void {
    this.localStorageService.setItem(ORGANIZATION, organization);
    this._organization.set(organization);
  }

  clear(): void {
    this.localStorageService.removeItem(ORGANIZATION);
    this._organization.set(null);
  }
}
