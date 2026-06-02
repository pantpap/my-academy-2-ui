import { Component, ChangeDetectionStrategy, input, ResourceRef } from '@angular/core';
import { MatCell, MatCellDef, MatColumnDef, MatHeaderCell, MatHeaderCellDef, MatHeaderRow,
  MatHeaderRowDef, MatRow, MatRowDef, MatTable } from '@angular/material/table';
import { Customer, CustomersPagedResponse } from '../../../common/interfaces/customer';
import { MatIcon } from '@angular/material/icon';

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
  ],
  templateUrl: './customer-list.html',
  styleUrl: './customer-list.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CustomerList {
  readonly dataSourceResourceValue =
    input.required<ResourceRef<CustomersPagedResponse | undefined>>();

  displayedColumns: string[] = ['name', 'birthDate', 'gender', 'phone', 'sport', 'actions'];

  onRowClick(customer: Customer) {
    console.log(customer);
  //   TODO: navigate to customer details using id

  }
}
