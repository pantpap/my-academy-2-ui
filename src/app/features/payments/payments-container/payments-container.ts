import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { MatFormField, MatLabel } from '@angular/material/form-field';
import { MatSelect, MatSelectChange } from '@angular/material/select';
import { MatOption } from '@angular/material/core';
import { TranslocoDirective } from '@jsverse/transloco';
import { Payments as PaymentsService } from '../../../shared/services/payment/payment';

const YEAR_RANGE = 2;

@Component({
  selector: 'app-payments-container',
  imports: [MatFormField, MatLabel, MatSelect, MatOption, TranslocoDirective],
  templateUrl: './payments-container.html',
  styleUrl: './payments-container.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PaymentsContainer {
  private readonly paymentsService = inject(PaymentsService);

  private readonly currentYear = new Date().getFullYear();

  readonly years = Array.from(
    { length: YEAR_RANGE * 2 + 1 },
    (_, index) => this.currentYear - YEAR_RANGE + index,
  );

  readonly selectedYear = signal(this.currentYear);

  readonly rosterYearResource = rxResource({
    params: () => this.selectedYear(),
    stream: ({ params: year }) => this.paymentsService.getRosterYear(year),
  });

  onYearChange(year: number): void {
    this.selectedYear.set(year);
  }

  protected onYearSelectionChange(event: MatSelectChange): void {
    this.onYearChange(event.value as number);
  }
}
