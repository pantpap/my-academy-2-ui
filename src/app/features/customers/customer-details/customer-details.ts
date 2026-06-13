import { Component, inject, input } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { EMPTY } from 'rxjs';
import { Customer } from '../../../shared/services/customer/customer';
import { JsonPipe } from '@angular/common';

@Component({
  selector: 'app-customer-details',
  imports: [JsonPipe],
  templateUrl: './customer-details.html',
  styleUrl: './customer-details.scss',
})
export class CustomerDetails {
  private readonly customerService = inject(Customer);

  readonly id = input.required<number>();

  readonly customerDetailsResource = rxResource({
    params: () => this.id(),
    stream: ({ params: customerId }) => {
      if (!customerId) return EMPTY;
      return this.customerService.getCustomer(customerId);
    },
  });

  //   Implement a signal form to display customer details and allow editing of customer details.
}
