import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { CustomerList } from '../customer-list/customer-list';
import { LocalStorage } from '../../../core/services/localStorage/local-storage';
import { rxResource } from '@angular/core/rxjs-interop';
import { Customer } from '../../../shared/services/customer/customer';
import { ORGANIZATION } from '../../../common/constants/local-storage-constants';
import { EMPTY } from 'rxjs';
import { MatButton } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { TranslocoDirective } from '@jsverse/transloco';
import { MatIcon } from '@angular/material/icon';
import { CustomerFormDialog } from '../customer-form-dialog/customer-form-dialog';

@Component({
  selector: 'app-customer-container',
  imports: [CustomerList, MatButton, TranslocoDirective, MatIcon],
  templateUrl: './customer-container.html',
  styleUrl: './customer-container.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CustomerContainer {
  private readonly localStorageService = inject(LocalStorage);
  private readonly customerService = inject(Customer);
  private readonly dialog = inject(MatDialog);

  readonly organizationId = signal(this.localStorageService.getItem(ORGANIZATION).id);

  dataSourceResource = rxResource({
    params: () => this.organizationId(),
    stream: ({ params: orgId }) => {
      if (!orgId) return EMPTY;

      return this.customerService.getCustomers(1, 10);
    },
  });

  addNewCustomer(){
    this.dialog.open(CustomerFormDialog);
  }
}
