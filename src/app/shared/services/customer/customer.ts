import { inject, Injectable } from '@angular/core';
import { Http } from '../../../core/services/http/http';
import { ATHLETES_API } from '../../../common/constants/endpoints';
import { CustomersPagedResponse } from '../../../common/interfaces/customer';

@Injectable({
  providedIn: 'root',
})
export class Customer {
  private readonly httpService = inject(Http);

  getCustomers(organizationId: number, page: number, take: number) {
    return this.httpService.get<CustomersPagedResponse>(ATHLETES_API, { organizationId, page, take });
  }
}
