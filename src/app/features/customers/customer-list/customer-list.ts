import { Component, ChangeDetectionStrategy, input, output, ResourceRef, inject, computed } from '@angular/core';
import { MatCell, MatCellDef, MatColumnDef, MatHeaderCell, MatHeaderCellDef, MatHeaderRow,
  MatHeaderRowDef, MatRow, MatRowDef, MatTable } from '@angular/material/table';
import { Customer, CustomersPagedResponse } from '../../../common/interfaces/customer';
import { RosterStatusEntry } from '../../../common/interfaces/payment';
import { MatIcon } from '@angular/material/icon';
import { TranslocoDirective } from '@jsverse/transloco';
import { MatTooltip } from '@angular/material/tooltip';
import { Router } from '@angular/router';
import { buildPaidStatusMap } from './paid-status';
import { DatePipe } from '@angular/common';
import { MatPaginator, PageEvent } from '@angular/material/paginator';
import { MatProgressBar } from '@angular/material/progress-bar';

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
    DatePipe,
    MatPaginator,
    MatProgressBar,
  ],
  templateUrl: './customer-list.html',
  styleUrl: './customer-list.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CustomerList {
  private readonly router = inject(Router);
  readonly dataSourceResourceValue =
    input.required<ResourceRef<CustomersPagedResponse | undefined>>();

  readonly rosterStatusResourceValue = input<ResourceRef<RosterStatusEntry[] | undefined>>();

  readonly pageChange = output<PageEvent>();

  readonly pageSizeOptions = [10, 25, 50];

  readonly paidStatusByAthleteId = computed(() =>
    buildPaidStatusMap(this.rosterStatusResourceValue()?.value()),
  );

  displayedColumns: string[] = [
    'name',
    'birthDate',
    'gender',
    'phone',
    'sport',
    'active',
    'paymentStatus',
    'actions',
  ];

  onEditClick(customer: Customer) {
    this.router.navigate(['/app/customers', customer.id]);
  }
}
