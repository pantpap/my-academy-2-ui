import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { CustomerList } from '../customer-list/customer-list';
import { LocalStorage } from '../../../core/services/localStorage/local-storage';
import { rxResource } from '@angular/core/rxjs-interop';
import { Customer } from '../../../shared/services/customer/customer';
import { ORGANIZATION } from '../../../common/constants/local-storage-constants';
import { EMPTY } from 'rxjs';

@Component({
  selector: 'app-customer-container',
  imports: [CustomerList],
  templateUrl: './customer-container.html',
  styleUrl: './customer-container.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CustomerContainer {
  private readonly localStorageService = inject(LocalStorage);
  private readonly customerService = inject(Customer);

  readonly organizationId = signal(this.localStorageService.getItem(ORGANIZATION).id);

  dataSourceResource = rxResource({
    params: () => this.organizationId(),
    stream: ({ params: orgId }) => {
      if (!orgId) return EMPTY;

      return this.customerService.getCustomers(orgId, 1, 10);
    },
  });
}
