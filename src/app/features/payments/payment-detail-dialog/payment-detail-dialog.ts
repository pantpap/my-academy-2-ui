import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import {
  MAT_DIALOG_DATA,
  MatDialogActions,
  MatDialogClose,
  MatDialogContent,
  MatDialogRef,
  MatDialogTitle,
} from '@angular/material/dialog';
import { MatButton } from '@angular/material/button';
import { TranslocoDirective } from '@jsverse/transloco';
import { RosterSeasonMonth } from '../../../common/interfaces/payment';
import { Payments as PaymentsService } from '../../../shared/services/payment/payment';

export interface PaymentDetailDialogData {
  athleteId: number;
  athleteName: string;
  payment: RosterSeasonMonth;
}

export interface PaymentDetailDialogResult {
  deleted: boolean;
}

@Component({
  selector: 'app-payment-detail-dialog',
  imports: [
    MatDialogTitle,
    MatDialogContent,
    MatDialogActions,
    MatDialogClose,
    MatButton,
    TranslocoDirective,
  ],
  templateUrl: './payment-detail-dialog.html',
  styleUrl: './payment-detail-dialog.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PaymentDetailDialog {
  private readonly data = inject<PaymentDetailDialogData>(MAT_DIALOG_DATA);
  private readonly paymentsService = inject(PaymentsService);
  private readonly dialogRef = inject(MatDialogRef<PaymentDetailDialog, PaymentDetailDialogResult>);

  protected readonly athleteName = this.data.athleteName;
  protected readonly amount = this.data.payment.amount;
  protected readonly paymentDate = this.data.payment.paymentDate;

  protected readonly notes = signal<string | null>(null);
  protected readonly confirmingDelete = signal(false);
  protected readonly deleting = signal(false);
  protected readonly deleteError = signal(false);

  constructor() {
    this.loadNotes();
  }

  private async loadNotes(): Promise<void> {
    try {
      const payments = await firstValueFrom(this.paymentsService.getPayments(this.data.athleteId));
      const match = payments.find((payment) => payment.id === this.data.payment.paymentId);
      this.notes.set(match?.notes ?? null);
    } catch {
      this.notes.set(null);
    }
  }

  protected requestDelete(): void {
    this.confirmingDelete.set(true);
  }

  protected cancelDelete(): void {
    this.confirmingDelete.set(false);
  }

  protected async confirmDelete(): Promise<void> {
    const paymentId = this.data.payment.paymentId;
    if (paymentId === null) return;

    this.deleting.set(true);
    this.deleteError.set(false);
    try {
      await firstValueFrom(this.paymentsService.deletePayment(paymentId));
      this.dialogRef.close({ deleted: true });
    } catch {
      this.deleteError.set(true);
      this.confirmingDelete.set(false);
    } finally {
      this.deleting.set(false);
    }
  }
}
