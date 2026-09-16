import { inject, Injectable, signal } from '@angular/core';
import { Http } from '../../../core/services/http/http';
import { ATHLETES_API } from '../../../common/constants/endpoints';
import { Customer as CustomerModel, CustomersPagedResponse } from '../../../common/interfaces/customer';
import { ORGANIZATION } from '../../../common/constants/local-storage-constants';
import { Organization } from '../../../common/interfaces/organization';
import { LocalStorage } from '../../../core/services/localStorage/local-storage';

// Μία γραμμή περιόδου αθλήματος στο payload. Χωρίς `id`: νέα περίοδος. Με
// `id`: ενημέρωση υπάρχουσας. Το `startDate` λείπει μόνο στο create, όπου
// προεπιλέγεται στο BE στην ημερομηνία εγγραφής όταν δεν δίνεται.
export interface CustomerEnrollmentPayload {
  id?: number;
  sportId: number;
  startDate?: string;
  endDate?: string | null;
}

export interface CustomerPayload {
  firstName: string;
  lastName: string;
  birthDate: string;
  gender: string;
  phone: string;
  street: string;
  city: string;
  postalCode: string;
  country: string;
  // Μόνο στο create — στο update δεν στέλνεται καθόλου, γιατί το BE δεν το
  // δέχεται (η ημερομηνία εγγραφής δεν αλλάζει μετά τη δημιουργία).
  registrationDate?: string;
  active: boolean;
  enrollments: CustomerEnrollmentPayload[];
}

@Injectable({
  providedIn: 'root',
})
export class Customer {
  private readonly httpService = inject(Http);
  private readonly localStorageService = inject(LocalStorage);

  readonly organizationId = signal(this.localStorageService.getItem<Organization>(ORGANIZATION).id);

  getCustomers(page: number, take: number) {
    return this.httpService.get<CustomersPagedResponse>(ATHLETES_API, {
      organizationId: this.organizationId(),
      page,
      take,
    });
  }

  getCustomer(id: number) {
    return this.httpService.get<CustomerModel>(`${ATHLETES_API}/${id}`);
  }

  createCustomer(payload: CustomerPayload) {
    return this.httpService.post<CustomerPayload & { organizationId: number }>(ATHLETES_API, {
      ...payload,
      organizationId: this.organizationId(),
    });
  }

  updateCustomer(id: number, payload: CustomerPayload) {
    return this.httpService.put<CustomerPayload & { organizationId: number }>(
      `${ATHLETES_API}/${id}`,
      {
        ...payload,
        organizationId: this.organizationId(),
      },
    );
  }
}
