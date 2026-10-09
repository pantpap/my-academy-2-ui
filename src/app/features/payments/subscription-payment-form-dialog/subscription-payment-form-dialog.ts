import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { form, min, required, validate, ValidationError } from '@angular/forms/signals';
import {
  MAT_DIALOG_DATA,
  MatDialogActions,
  MatDialogClose,
  MatDialogContent,
  MatDialogRef,
  MatDialogTitle,
} from '@angular/material/dialog';
import { MatError, MatFormField, MatLabel } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';
import { MatDatepicker, MatDatepickerInput, MatDatepickerToggle } from '@angular/material/datepicker';
import { MatButton, MatIconButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { TranslocoDirective, TranslocoService } from '@jsverse/transloco';
import { Subscriptions } from '../../../shared/services/subscription/subscription';
import { CreateSubscriptionPaymentPayload } from '../../../common/interfaces/subscription';

export interface SubscriptionPaymentFormDialogData {
  organizationId: number;
  organizationName: string;
}

export interface SubscriptionPaymentFormDialogResult {
  saved: true;
  overlaps: boolean;
}

interface SubscriptionPaymentFormModel {
  amount: number | null;
  paymentDate: Date | null;
  description: string;
}

function todayAtMidnight(): Date {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  return date;
}

function formatDateForApi(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Καταχώρηση πληρωμής συνδρομής από τον admin (SPEC-organizations-admin.md). Η
// ημερομηνία ανοίγει με τη σημερινή (Q4) και δεν δέχεται μελλοντική.
@Component({
  selector: 'app-subscription-payment-form-dialog',
  imports: [
    MatDialogTitle,
    MatDialogContent,
    MatDialogActions,
    MatDialogClose,
    MatFormField,
    MatLabel,
    MatError,
    MatInput,
    MatDatepicker,
    MatDatepickerInput,
    MatDatepickerToggle,
    MatButton,
    MatIconButton,
    MatIcon,
    TranslocoDirective,
  ],
  templateUrl: './subscription-payment-form-dialog.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SubscriptionPaymentFormDialog {
  protected readonly data = inject<SubscriptionPaymentFormDialogData>(MAT_DIALOG_DATA);
  private readonly dialogRef =
    inject<MatDialogRef<SubscriptionPaymentFormDialog, SubscriptionPaymentFormDialogResult>>(MatDialogRef);
  private readonly subscriptionsService = inject(Subscriptions);
  private readonly transloco = inject(TranslocoService);

  protected readonly today = todayAtMidnight();

  protected readonly model = signal<SubscriptionPaymentFormModel>({
    amount: null,
    paymentDate: todayAtMidnight(),
    description: '',
  });

  protected readonly paymentForm = form(this.model, (payment) => {
    required(payment.amount);
    min(payment.amount, 0.01);
    required(payment.paymentDate);
    validate(payment.paymentDate, ({ value }) => {
      const date = value();
      return date && date > this.today ? { kind: 'future' } : undefined;
    });
  });

  protected readonly submitting = signal(false);
  protected readonly failureMessage = signal<string | null>(null);

  protected readonly saveDisabled = computed(() => this.paymentForm().invalid() || this.submitting());

  protected hasError(errors: readonly ValidationError.WithFieldTree[], kind: string): boolean {
    return errors.some((e) => e.kind === kind);
  }

  protected onAmountInput(value: string): void {
    const parsed = value === '' ? null : Number(value);
    this.model.update((m) => ({ ...m, amount: parsed === null || Number.isNaN(parsed) ? null : parsed }));
  }

  protected onDateChange(date: Date | null): void {
    this.model.update((m) => ({ ...m, paymentDate: date }));
  }

  protected onDescriptionInput(value: string): void {
    this.model.update((m) => ({ ...m, description: value }));
  }

  protected async save(): Promise<void> {
    if (this.saveDisabled()) return;

    const { amount, paymentDate, description } = this.model();
    const payload: CreateSubscriptionPaymentPayload = {
      paymentDate: formatDateForApi(paymentDate!),
      amount: amount!,
      ...(description.trim() ? { description: description.trim() } : {}),
    };

    this.submitting.set(true);
    this.failureMessage.set(null);
    try {
      const { overlaps } = await firstValueFrom(
        this.subscriptionsService.addPayment(this.data.organizationId, payload),
      );
      this.dialogRef.close({ saved: true, overlaps });
    } catch {
      this.failureMessage.set(this.transloco.translate('subscriptions.saveError'));
    } finally {
      this.submitting.set(false);
    }
  }
}
