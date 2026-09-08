import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';
import { form, required, min, ValidationError } from '@angular/forms/signals';
import {
  MAT_DIALOG_DATA,
  MatDialogActions,
  MatDialogClose,
  MatDialogContent,
  MatDialogRef,
  MatDialogTitle,
} from '@angular/material/dialog';
import { MatFormField, MatLabel, MatError } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';
import { MatSelect } from '@angular/material/select';
import { MatOption } from '@angular/material/core';
import { MatDatepicker, MatDatepickerInput, MatDatepickerToggle } from '@angular/material/datepicker';
import { MatButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { TranslocoDirective, TranslocoService } from '@jsverse/transloco';
import { RosterSeasonMonth } from '../../../common/interfaces/payment';
import { Payments as PaymentsService } from '../../../shared/services/payment/payment';
import { LanguageService } from '../../../core/services/language/language.service';

export interface PaymentFormDialogData {
  athleteId: number;
  athleteName: string;
  initialMonth: number;
  initialYear: number;
  months: RosterSeasonMonth[];
  onSaved: () => void;
}

export interface PaymentFormDialogResult {
  success: boolean;
}

interface PaymentFormModel {
  amount: number | null;
  paymentDate: Date | null;
}

interface MonthToggle {
  month: number;
  year: number;
  label: string;
  paid: boolean;
  selected: boolean;
}

function todayAtMidnight(): Date {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  return date;
}

function formatDateForApi(date: Date | null): string {
  if (!date) return '';
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

@Component({
  selector: 'app-payment-form-dialog',
  imports: [
    MatDialogTitle,
    MatDialogContent,
    MatDialogActions,
    MatDialogClose,
    MatFormField,
    MatLabel,
    MatError,
    MatInput,
    MatSelect,
    MatOption,
    MatDatepicker,
    MatDatepickerInput,
    MatDatepickerToggle,
    MatButton,
    MatIcon,
    TranslocoDirective,
  ],
  templateUrl: './payment-form-dialog.html',
  styleUrl: './payment-form-dialog.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PaymentFormDialog {
  private readonly data = inject<PaymentFormDialogData>(MAT_DIALOG_DATA);
  private readonly paymentsService = inject(PaymentsService);
  private readonly translocoService = inject(TranslocoService);
  private readonly languageService = inject(LanguageService);
  private readonly dialogRef = inject(MatDialogRef<PaymentFormDialog, PaymentFormDialogResult>);

  protected readonly athleteName = this.data.athleteName;

  protected readonly monthToggles = signal<MonthToggle[]>(this.buildMonthToggles());

  protected readonly selectedMonths = computed(() =>
    this.monthToggles()
      .filter((month) => month.selected)
      .map((month) => month.month),
  );

  // Chronological order within the season, not raw month-number order — Sep(9)..Dec(12)
  // come before Jan(1)..Jun(6) of the *next* calendar year, so sorting by year first (then
  // month) is required once a selection can span the Dec/Jan boundary.
  protected readonly monthsToSubmit = computed(() =>
    this.monthToggles()
      .filter((month) => month.selected && !month.paid)
      .map((month) => ({ month: month.month, year: month.year }))
      .sort((a, b) => a.year - b.year || a.month - b.month),
  );

  protected readonly selectedCount = computed(() => this.monthsToSubmit().length);

  protected readonly model = signal<PaymentFormModel>({
    amount: null,
    paymentDate: todayAtMidnight(),
  });

  protected readonly paymentForm = form(this.model, (payment) => {
    required(payment.amount);
    min(payment.amount, 0.01);
    required(payment.paymentDate);
  });

  protected readonly runningTotal = computed(() => {
    const amount = this.model().amount;
    if (amount === null || amount <= 0) return 0;
    return Math.round(amount * this.selectedCount() * 100) / 100;
  });

  protected readonly submitting = signal(false);
  protected readonly savedMonths = signal<number[]>([]);
  protected readonly failedMonth = signal<number | null>(null);
  protected readonly failureMessage = signal<string | null>(null);

  protected readonly savedMonthLabels = computed(() =>
    this.savedMonths()
      .map((month) => this.monthToggles().find((m) => m.month === month)?.label ?? String(month))
      .join(', '),
  );

  protected readonly saveDisabled = computed(
    () => this.paymentForm().invalid() || this.selectedCount() === 0 || this.submitting(),
  );

  constructor() {
    this.prefillAmount();
  }

  private buildMonthToggles(): MonthToggle[] {
    const locale = this.languageService.language() === 'el' ? 'el-GR' : 'en-US';
    const formatter = new Intl.DateTimeFormat(locale, { month: 'long' });
    return this.data.months.map((month) => ({
      month: month.month,
      year: month.year,
      label: formatter.format(new Date(2020, month.month - 1, 1)),
      paid: month.paid,
      selected:
        month.paid ||
        (month.month === this.data.initialMonth && month.year === this.data.initialYear),
    }));
  }

  private async prefillAmount(): Promise<void> {
    try {
      const payments = await firstValueFrom(this.paymentsService.getPayments(this.data.athleteId));
      const latest = payments.reduce<(typeof payments)[number] | null>(
        (acc, payment) => (acc === null || payment.id > acc.id ? payment : acc),
        null,
      );
      if (latest) {
        this.model.update((m) => ({ ...m, amount: Number(latest.amount) }));
      }
    } catch {
      // Prefill is a convenience, not a requirement — leave the amount empty on failure.
    }
  }

  protected hasError(errors: readonly ValidationError.WithFieldTree[], kind: string): boolean {
    return errors.some((e) => e.kind === kind);
  }

  protected onAmountInput(value: string): void {
    const parsed = value === '' ? null : Number(value);
    this.model.update((m) => ({
      ...m,
      amount: parsed === null || Number.isNaN(parsed) ? null : parsed,
    }));
  }

  protected onDateChange(date: Date | null): void {
    this.model.update((m) => ({ ...m, paymentDate: date }));
  }

  protected onMonthsSelectionChange(months: number[]): void {
    this.monthToggles.update((toggles) =>
      toggles.map((m) => ({ ...m, selected: m.paid ? true : months.includes(m.month) })),
    );
  }

  protected async save(): Promise<void> {
    if (this.saveDisabled()) return;

    const amount = this.model().amount!;
    const paymentDate = formatDateForApi(this.model().paymentDate);
    const monthsToSave = this.monthsToSubmit();

    this.submitting.set(true);
    this.savedMonths.set([]);
    this.failedMonth.set(null);
    this.failureMessage.set(null);

    for (const entry of monthsToSave) {
      try {
        await firstValueFrom(
          this.paymentsService.createPayment({
            athleteId: this.data.athleteId,
            amount,
            paymentDate,
            coveredMonth: entry.month,
            coveredYear: entry.year,
          }),
        );
        this.savedMonths.update((saved) => [...saved, entry.month]);
      } catch (error) {
        this.failedMonth.set(entry.month);
        const monthLabel =
          this.monthToggles().find((m) => m.month === entry.month)?.label ?? String(entry.month);
        if (error instanceof HttpErrorResponse && error.status === 409) {
          this.failureMessage.set(
            this.translocoService.translate('payments.duplicateError', {
              month: monthLabel,
              year: entry.year,
            }),
          );
        } else {
          this.failureMessage.set(this.translocoService.translate('payments.saveError'));
        }
        break;
      }
    }

    this.submitting.set(false);

    if (this.failedMonth() !== null) {
      if (this.savedMonths().length > 0) {
        this.data.onSaved();
      }
    } else {
      this.dialogRef.close({ success: true });
    }
  }
}
