import { ChangeDetectionStrategy, Component, computed, inject, input, signal } from '@angular/core';
import { CustomerList } from '../customer-list/customer-list';
import { LocalStorage } from '../../../core/services/localStorage/local-storage';
import { rxResource } from '@angular/core/rxjs-interop';
import { Customer } from '../../../shared/services/customer/customer';
import { Customer as CustomerModel } from '../../../common/interfaces/customer';
import { Payments } from '../../../shared/services/payment/payment';
import { ORGANIZATION } from '../../../common/constants/local-storage-constants';
import { Organization } from '../../../common/interfaces/organization';
import { EMPTY } from 'rxjs';
import { MatButton } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { TranslocoDirective } from '@jsverse/transloco';
import { MatIcon } from '@angular/material/icon';
import { CustomerFormDialog } from '../customer-form-dialog/customer-form-dialog';

const PAGE_SIZE_OPTIONS = [10, 25, 50] as const;
const DEFAULT_PAGE = 1;
const DEFAULT_TAKE = PAGE_SIZE_OPTIONS[0];

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
  private readonly paymentsService = inject(Payments);
  private readonly dialog = inject(MatDialog);

  readonly organizationId = signal(this.localStorageService.getItem<Organization>(ORGANIZATION).id);

  // Query params `?page=&take=` (δένονται μέσω withComponentInputBinding). Άκυρες
  // τιμές πέφτουν στα defaults χωρίς να αλλάξει το URL.
  readonly page = input<string | undefined>();
  readonly take = input<string | undefined>();

  readonly currentPage = computed(() => {
    const page = Number(this.page());
    return Number.isInteger(page) && page >= 1 ? page : DEFAULT_PAGE;
  });

  readonly currentTake = computed(() => {
    const take = Number(this.take());
    return PAGE_SIZE_OPTIONS.find((option) => option === take) ?? DEFAULT_TAKE;
  });

  dataSourceResource = rxResource({
    params: () => ({ orgId: this.organizationId(), page: this.currentPage(), take: this.currentTake() }),
    stream: ({ params: { orgId, page, take } }) => {
      if (!orgId) return EMPTY;

      return this.customerService.getCustomers(page, take);
    },
  });

  rosterStatusResource = rxResource({
    params: () => this.organizationId(),
    stream: ({ params: orgId }) => {
      if (!orgId) return EMPTY;

      const now = new Date();
      return this.paymentsService.getRosterStatus(now.getFullYear(), now.getMonth() + 1);
    },
  });

  addNewCustomer() {
    const options = {
      width: '800px',
      height: '500px',
    };
    const dialogRef = this.dialog.open(CustomerFormDialog, options);

    dialogRef.afterClosed().subscribe((saved?: CustomerModel) => {
      if (saved) {
        this.dataSourceResource.reload();
      }
    });
  }
}
