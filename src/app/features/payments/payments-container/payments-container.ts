import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { MatDialog } from '@angular/material/dialog';
import { MatFormField, MatLabel } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';
import { MatSelect, MatSelectChange } from '@angular/material/select';
import { MatOption } from '@angular/material/core';
import { MatButton } from '@angular/material/button';
import { TranslocoDirective } from '@jsverse/transloco';
import { RosterSeasonEntry, RosterSeasonMonth } from '../../../common/interfaces/payment';
import { Payments as PaymentsService } from '../../../shared/services/payment/payment';
import { PaymentsGrid, PaymentsGridCellActivated } from '../payments-grid/payments-grid';
import { PaymentFormDialog, PaymentFormDialogData } from '../payment-form-dialog/payment-form-dialog';
import { PaymentDetailDialog, PaymentDetailDialogData } from '../payment-detail-dialog/payment-detail-dialog';
import { defaultSeasonStartYear, seasonOptions, SeasonOption } from './season';

const SEASON_RANGE = 2;

@Component({
  selector: 'app-payments-container',
  imports: [
    MatFormField,
    MatLabel,
    MatInput,
    MatSelect,
    MatOption,
    MatButton,
    TranslocoDirective,
    PaymentsGrid,
  ],
  templateUrl: './payments-container.html',
  styleUrl: './payments-container.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PaymentsContainer {
  private readonly paymentsService = inject(PaymentsService);
  private readonly dialog = inject(MatDialog);

  private readonly today = new Date();

  readonly seasons: SeasonOption[] = seasonOptions(
    defaultSeasonStartYear(this.today),
    SEASON_RANGE,
  );

  readonly selectedSeasonStartYear = signal(defaultSeasonStartYear(this.today));
  readonly searchTerm = signal('');

  readonly rosterSeasonResource = rxResource({
    params: () => this.selectedSeasonStartYear(),
    stream: ({ params: startYear }) => this.paymentsService.getRosterSeason(startYear),
  });

  onSeasonChange(startYear: number): void {
    this.selectedSeasonStartYear.set(startYear);
  }

  protected onSeasonSelectionChange(event: MatSelectChange): void {
    this.onSeasonChange(event.value as number);
  }

  protected onSearchInput(event: Event): void {
    this.searchTerm.set((event.target as HTMLInputElement).value);
  }

  protected onCellActivated(event: PaymentsGridCellActivated): void {
    if (event.month.paid) {
      this.openDetailDialog(event.athlete, event.month);
    } else {
      this.openRecordDialog(event.athlete, event.month);
    }
  }

  private openRecordDialog(athlete: RosterSeasonEntry, month: RosterSeasonMonth): void {
    const ref = this.dialog.open<PaymentFormDialog, PaymentFormDialogData>(PaymentFormDialog, {
      width: '480px',
      data: {
        athleteId: athlete.athleteId,
        athleteName: `${athlete.firstName} ${athlete.lastName}`,
        initialMonth: month.month,
        initialYear: month.year,
        months: athlete.months,
        onSaved: () => this.rosterSeasonResource.reload(),
      },
    });

    ref.afterClosed().subscribe((result) => {
      if (result?.success) this.rosterSeasonResource.reload();
    });
  }

  private openDetailDialog(athlete: RosterSeasonEntry, month: RosterSeasonMonth): void {
    const ref = this.dialog.open<PaymentDetailDialog, PaymentDetailDialogData>(PaymentDetailDialog, {
      width: '400px',
      data: {
        athleteId: athlete.athleteId,
        athleteName: `${athlete.firstName} ${athlete.lastName}`,
        payment: month,
      },
    });

    ref.afterClosed().subscribe((result) => {
      if (result?.deleted) this.rosterSeasonResource.reload();
    });
  }
}
