import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import {
  MAT_DIALOG_DATA,
  MatDialogActions,
  MatDialogClose,
  MatDialogContent,
  MatDialogRef,
  MatDialogTitle,
} from '@angular/material/dialog';
import { MatFormField, MatLabel } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';
import { MatSelect } from '@angular/material/select';
import { MatOption } from '@angular/material/core';
import { MatDatepicker, MatDatepickerInput, MatDatepickerToggle } from '@angular/material/datepicker';
import { MatButton, MatIconButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { TranslocoDirective } from '@jsverse/transloco';
import { RosterSeasonMonth, RosterSeasonSport } from '../../../common/interfaces/payment';
import { Payments as PaymentsService } from '../../../shared/services/payment/payment';
import { LanguageService } from '../../../core/services/language/language.service';

export interface PaymentDetailDialogData {
  athleteId: number;
  athleteName: string;
  month: RosterSeasonMonth;
}

export interface PaymentDetailDialogResult {
  changed: boolean;
}

interface AddSportsModel {
  amount: number | null;
  paymentDate: Date | null;
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
  selector: 'app-payment-detail-dialog',
  imports: [
    MatDialogTitle,
    MatDialogContent,
    MatDialogActions,
    MatDialogClose,
    MatFormField,
    MatLabel,
    MatInput,
    MatSelect,
    MatOption,
    MatDatepicker,
    MatDatepickerInput,
    MatDatepickerToggle,
    MatButton,
    MatIconButton,
    MatIcon,
    TranslocoDirective,
  ],
  templateUrl: './payment-detail-dialog.html',
  styleUrl: './payment-detail-dialog.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PaymentDetailDialog {
  private readonly data = inject<PaymentDetailDialogData>(MAT_DIALOG_DATA);
  private readonly paymentsService = inject(PaymentsService);
  private readonly languageService = inject(LanguageService);
  private readonly dialogRef = inject(MatDialogRef<PaymentDetailDialog, PaymentDetailDialogResult>);

  protected readonly athleteName = this.data.athleteName;
  protected readonly month = this.data.month;
  protected readonly entries = this.data.month.entries;
  protected readonly isPartial = this.data.month.status === 'partial';
  protected readonly unpaidSports = this.data.month.unpaidSports;

  protected readonly monthLabel = computed(() => {
    const locale = this.languageService.language() === 'el' ? 'el-GR' : 'en-US';
    const formatter = new Intl.DateTimeFormat(locale, { month: 'long' });
    return formatter.format(new Date(2020, this.month.month - 1, 1));
  });

  // --- Add missing sports (μόνο όταν status === 'partial') ---

  protected readonly selectedSportIds = signal<number[]>([]);
  protected readonly showSportsSelect = this.unpaidSports.length > 1;

  protected readonly addModel = signal<AddSportsModel>({
    amount: null,
    paymentDate: todayAtMidnight(),
  });

  protected readonly adding = signal(false);
  protected readonly addError = signal<string | null>(null);

  protected readonly addDisabled = computed(
    () =>
      this.selectedSportIds().length === 0 ||
      this.addModel().amount === null ||
      this.addModel().amount! <= 0 ||
      !this.addModel().paymentDate ||
      this.adding(),
  );

  // --- Delete month ---

  protected readonly confirmingDelete = signal(false);
  protected readonly deleting = signal(false);
  protected readonly deleteError = signal(false);

  constructor() {
    if (this.unpaidSports.length === 1) {
      this.selectedSportIds.set([this.unpaidSports[0].id]);
    }
  }

  protected onSportIdsChange(sportIds: number[]): void {
    this.selectedSportIds.set(sportIds);
  }

  protected onAmountInput(value: string): void {
    const parsed = value === '' ? null : Number(value);
    this.addModel.update((m) => ({
      ...m,
      amount: parsed === null || Number.isNaN(parsed) ? null : parsed,
    }));
  }

  protected onDateChange(date: Date | null): void {
    this.addModel.update((m) => ({ ...m, paymentDate: date }));
  }

  protected async addSports(): Promise<void> {
    if (this.addDisabled()) return;

    this.adding.set(true);
    this.addError.set(null);

    try {
      await firstValueFrom(
        this.paymentsService.createPayment({
          athleteId: this.data.athleteId,
          amount: this.addModel().amount!,
          paymentDate: formatDateForApi(this.addModel().paymentDate),
          months: [{ month: this.month.month, year: this.month.year }],
          sportIds: this.selectedSportIds(),
        }),
      );
      this.adding.set(false);
      this.dialogRef.close({ changed: true });
    } catch {
      this.adding.set(false);
      this.addError.set('saveError');
    }
  }

  protected requestDelete(): void {
    this.confirmingDelete.set(true);
  }

  protected cancelDelete(): void {
    this.confirmingDelete.set(false);
  }

  protected async confirmDelete(): Promise<void> {
    this.deleting.set(true);
    this.deleteError.set(false);
    try {
      await firstValueFrom(
        this.paymentsService.deleteMonth(this.data.athleteId, this.month.month, this.month.year),
      );
      this.dialogRef.close({ changed: true });
    } catch {
      this.deleteError.set(true);
      this.confirmingDelete.set(false);
    } finally {
      this.deleting.set(false);
    }
  }
}
