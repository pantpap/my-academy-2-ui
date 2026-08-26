import { ChangeDetectionStrategy, Component, computed, inject, input, linkedSignal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { EMPTY } from 'rxjs';
import { MatCard, MatCardContent } from '@angular/material/card';
import { MatButton } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatIcon } from '@angular/material/icon';
import { TranslocoDirective } from '@jsverse/transloco';
import { Customer as CustomerService } from '../../../shared/services/customer/customer';
import { Customer as CustomerModel } from '../../../common/interfaces/customer';
import { CustomerFormDialog } from '../customer-form-dialog/customer-form-dialog';

@Component({
  selector: 'app-customer-details',
  imports: [MatCard, MatCardContent, MatButton, MatIcon, TranslocoDirective],
  templateUrl: './customer-details.html',
  styleUrl: './customer-details.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CustomerDetails {
  private readonly customerService = inject(CustomerService);
  private readonly dialog = inject(MatDialog);

  readonly id = input<string>();

  private readonly routeId = computed(() => {
    const id = this.id();
    return id ? Number(id) : undefined;
  });


  // Decoupled from routeId so a successful create flips into edit mode without
  // re-triggering a GET (avoids a loading flicker right after saving).
  protected readonly activeId = linkedSignal<number | undefined>(() => this.routeId());
  protected readonly isEditMode = computed(() => this.activeId() !== undefined);

  protected readonly customerDetailsResource = rxResource({
    params: () => this.routeId(),
    stream: ({ params: customerId }) =>
      customerId === undefined ? EMPTY : this.customerService.getCustomer(customerId),
  });

  protected openEditDialog() {
    const dialogRef = this.dialog.open(CustomerFormDialog, {
      data: { customer: this.customerDetailsResource.value() },
    });

    dialogRef.afterClosed().subscribe((saved?: CustomerModel) => {
      if (saved) {
        this.activeId.set(saved.id);
        this.customerDetailsResource.reload();
      }
    });
  }
}
