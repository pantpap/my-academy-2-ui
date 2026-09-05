import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { MatDialog } from '@angular/material/dialog';
import { MatFormField, MatLabel } from '@angular/material/form-field';
import { MatSelect, MatSelectChange } from '@angular/material/select';
import { MatOption } from '@angular/material/core';
import { MatButton } from '@angular/material/button';
import { TranslocoDirective } from '@jsverse/transloco';
import { RosterYearEntry, RosterYearMonth } from '../../../common/interfaces/payment';
import { Payments as PaymentsService } from '../../../shared/services/payment/payment';
import { PaymentsGrid, PaymentsGridCellActivated } from '../payments-grid/payments-grid';
import { PaymentFormDialog, PaymentFormDialogData } from '../payment-form-dialog/payment-form-dialog';
import { PaymentDetailDialog, PaymentDetailDialogData } from '../payment-detail-dialog/payment-detail-dialog';

const YEAR_RANGE = 2;

@Component({
  selector: 'app-payments-container',
  imports: [MatFormField, MatLabel, MatSelect, MatOption, MatButton, TranslocoDirective, PaymentsGrid],
  templateUrl: './payments-container.html',
  styleUrl: './payments-container.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PaymentsContainer {
  private readonly paymentsService = inject(PaymentsService);
  private readonly dialog = inject(MatDialog);

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

  protected onCellActivated(event: PaymentsGridCellActivated): void {
    if (event.month.paid) {
      this.openDetailDialog(event.athlete, event.month);
    } else {
      this.openRecordDialog(event.athlete, event.month);
    }
  }

  private openRecordDialog(athlete: RosterYearEntry, month: RosterYearMonth): void {
    const ref = this.dialog.open<PaymentFormDialog, PaymentFormDialogData>(PaymentFormDialog, {
      width: '480px',
      data: {
        athleteId: athlete.athleteId,
        athleteName: `${athlete.firstName} ${athlete.lastName}`,
        year: this.selectedYear(),
        initialMonth: month.month,
        months: athlete.months,
        onSaved: () => this.rosterYearResource.reload(),
      },
    });

    ref.afterClosed().subscribe((result) => {
      if (result?.success) this.rosterYearResource.reload();
    });
  }

  private openDetailDialog(athlete: RosterYearEntry, month: RosterYearMonth): void {
    const ref = this.dialog.open<PaymentDetailDialog, PaymentDetailDialogData>(PaymentDetailDialog, {
      width: '400px',
      data: {
        athleteId: athlete.athleteId,
        athleteName: `${athlete.firstName} ${athlete.lastName}`,
        payment: month,
      },
    });

    ref.afterClosed().subscribe((result) => {
      if (result?.deleted) this.rosterYearResource.reload();
    });
  }
}
