 import { inject, Injectable, signal } from '@angular/core';
import { Http } from '../../../core/services/http/http';
import { ATHLETES_API } from '../../../common/constants/endpoints';
import { Customer as CustomerModel, CustomersPagedResponse } from '../../../common/interfaces/customer';
import { ORGANIZATION } from '../../../common/constants/local-storage-constants';
import { LocalStorage } from '../../../core/services/localStorage/local-storage';

@Injectable({
  providedIn: 'root',
})
export class Customer {
  private readonly httpService = inject(Http);
  private readonly localStorageService = inject(LocalStorage);

  readonly organizationId = signal(this.localStorageService.getItem(ORGANIZATION).id);

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

  createCustomer(payload: Omit<CustomerModel, 'id'>) {
    return this.httpService.post<Omit<CustomerModel, 'id'> & { organizationId: number }>(ATHLETES_API, {
      ...payload,
      organizationId: this.organizationId(),
    });
  }

  updateCustomer(id: number, payload: Omit<CustomerModel, 'id'>) {
    return this.httpService.put<Omit<CustomerModel, 'id'>>(`${ATHLETES_API}/${id}`, payload);
  }
}
