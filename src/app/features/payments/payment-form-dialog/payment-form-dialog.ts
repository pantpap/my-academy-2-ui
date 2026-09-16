import { ChangeDetectionStrategy, Component, computed, effect, inject, signal, untracked } from '@angular/core';
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
import { RosterSeasonMonth, RosterSeasonSport, CellStatus } from '../../../common/interfaces/payment';
import { Payments as PaymentsService } from '../../../shared/services/payment/payment';
import { LanguageService } from '../../../core/services/language/language.service';

export interface PaymentFormDialogData {
  athleteId: number;
  athleteName: string;
  initialMonth: number;
  initialYear: number;
  months: RosterSeasonMonth[];
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
  status: CellStatus;
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
  // month) is required once a selection can span the Dec/Jan boundary. Already-fully-paid
  // months are excluded — nothing left to submit for them.
  protected readonly monthsToSubmit = computed(() =>
    this.monthToggles()
      .filter((month) => month.selected && month.status !== 'paid')
      .map((month) => ({ month: month.month, year: month.year }))
      .sort((a, b) => a.year - b.year || a.month - b.month),
  );

  protected readonly selectedCount = computed(() => this.monthsToSubmit().length);

  // Ένωση των owedSports όλων των επιλεγμένων (προς πληρωμή) μηνών — Q-D(α):
  // περιλαμβάνει και αθλήματα που έχουν λήξει, αν κάποιος επιλεγμένος μήνας τα οφείλει ακόμα.
  protected readonly availableSports = computed<RosterSeasonSport[]>(() => {
    const selected = this.monthsToSubmit();
    const bySport = new Map<number, RosterSeasonSport>();
    for (const { month, year } of selected) {
      const original = this.data.months.find((m) => m.month === month && m.year === year);
      for (const sport of original?.owedSports ?? []) {
        bySport.set(sport.id, sport);
      }
    }
    return Array.from(bySport.values());
  });

  protected readonly showSportsSelect = computed(() => this.availableSports().length > 1);

  protected readonly selectedSportIds = signal<number[]>([]);

  protected readonly model = signal<PaymentFormModel>({
    amount: null,
    paymentDate: todayAtMidnight(),
  });

  protected readonly paymentForm = form(this.model, (payment) => {
    required(payment.amount);
    min(payment.amount, 0.01);
    required(payment.paymentDate);
  });

  protected readonly submitting = signal(false);
  protected readonly failureMessage = signal<string | null>(null);

  protected readonly saveDisabled = computed(
    () =>
      this.paymentForm().invalid() ||
      this.selectedCount() === 0 ||
      this.selectedSportIds().length === 0 ||
      this.submitting(),
  );

  constructor() {
    // Αυτόματη επιλογή όταν μένει ένα μόνο άθλημα (και αφαίρεση αθλημάτων που
    // έπαψαν να είναι διαθέσιμα μετά από αλλαγή στην επιλογή μηνών).
    effect(() => {
      const sports = this.availableSports();
      untracked(() => {
        if (sports.length === 1) {
          this.selectedSportIds.set([sports[0].id]);
        } else {
          const availableIds = new Set(sports.map((s) => s.id));
          this.selectedSportIds.update((ids) => ids.filter((id) => availableIds.has(id)));
        }
      });
    });
  }

  private buildMonthToggles(): MonthToggle[] {
    const locale = this.languageService.language() === 'el' ? 'el-GR' : 'en-US';
    const formatter = new Intl.DateTimeFormat(locale, { month: 'long' });
    return this.data.months.map((month) => ({
      month: month.month,
      year: month.year,
      label: formatter.format(new Date(2020, month.month - 1, 1)),
      status: month.status,
      selected:
        month.status === 'paid' ||
        (month.month === this.data.initialMonth && month.year === this.data.initialYear),
    }));
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
      toggles.map((m) => ({
        ...m,
        selected: m.status === 'paid' ? true : months.includes(m.month),
      })),
    );
  }

  protected onSportIdsChange(sportIds: number[]): void {
    this.selectedSportIds.set(sportIds);
  }

  protected async save(): Promise<void> {
    if (this.saveDisabled()) return;

    const amount = this.model().amount!;
    const paymentDate = formatDateForApi(this.model().paymentDate);
    const months = this.monthsToSubmit();
    const sportIds = this.selectedSportIds();

    this.submitting.set(true);
    this.failureMessage.set(null);

    try {
      await firstValueFrom(
        this.paymentsService.createPayment({
          athleteId: this.data.athleteId,
          amount,
          paymentDate,
          months,
          sportIds,
        }),
      );
      this.submitting.set(false);
      this.dialogRef.close({ success: true });
    } catch (error) {
      this.submitting.set(false);
      if (error instanceof HttpErrorResponse && error.status === 409) {
        this.failureMessage.set(this.translocoService.translate('payments.nothingToPay'));
      } else {
        this.failureMessage.set(this.translocoService.translate('payments.saveError'));
      }
    }
  }
}
