import { Component, ChangeDetectionStrategy, input, ResourceRef, inject, computed } from '@angular/core';
import { MatCell, MatCellDef, MatColumnDef, MatHeaderCell, MatHeaderCellDef, MatHeaderRow,
  MatHeaderRowDef, MatRow, MatRowDef, MatTable } from '@angular/material/table';
import { Customer, CustomersPagedResponse } from '../../../common/interfaces/customer';
import { RosterStatusEntry } from '../../../common/interfaces/payment';
import { MatIcon } from '@angular/material/icon';
import { TranslocoDirective } from '@jsverse/transloco';
import { MatTooltip } from '@angular/material/tooltip';
import { Router } from '@angular/router';
import { buildPaidStatusMap } from './paid-status';

@Component({
  selector: 'app-customer-list',
  imports: [
    MatTable,
    MatColumnDef,
    MatHeaderCell,
    MatHeaderCellDef,
    MatCell,
    MatCellDef,
    MatHeaderRow,
    MatRow,
    MatHeaderRowDef,
    MatRowDef,
    MatIcon,
    TranslocoDirective,
    MatTooltip,
  ],
  templateUrl: './customer-list.html',
  styleUrl: './customer-list.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CustomerList {
  private readonly router = inject(Router)
  readonly dataSourceResourceValue =
    input.required<ResourceRef<CustomersPagedResponse | undefined>>();
  readonly rosterStatusResourceValue =
    input<ResourceRef<RosterStatusEntry[] | undefined>>();

  readonly paidStatusByAthleteId = computed(() =>
    buildPaidStatusMap(this.rosterStatusResourceValue()?.value()),
  );

  displayedColumns: string[] = ['name', 'birthDate', 'gender', 'phone', 'sport', 'paymentStatus', 'actions'];

  onEditClick(customer: Customer) {
    console.log(customer);
    this.router.navigate(['/app/customers', customer.id]);
  }
}
