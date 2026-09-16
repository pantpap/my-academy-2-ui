import { ChangeDetectionStrategy, Component, computed, effect, inject, signal, untracked } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { firstValueFrom } from 'rxjs';
import { form, required, minLength, maxLength, pattern, FormField, FormRoot, ValidationError } from '@angular/forms/signals';
import {
  MAT_DIALOG_DATA,
  MatDialogActions,
  MatDialogClose,
  MatDialogContent,
  MatDialogRef,
  MatDialogTitle,
} from '@angular/material/dialog';
import { MatFormField, MatLabel, MatError, MatSuffix } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';
import { MatSelect, MatSelectChange } from '@angular/material/select';
import { MatOption } from '@angular/material/core';
import { MatDatepicker, MatDatepickerInput, MatDatepickerToggle } from '@angular/material/datepicker';
import { MatButton, MatIconButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { MatSlideToggle } from '@angular/material/slide-toggle';
import { TranslocoDirective } from '@jsverse/transloco';
import { Customer as CustomerModel } from '../../../common/interfaces/customer';
import {
  Customer as CustomerService,
  CustomerEnrollmentPayload,
  CustomerPayload,
} from '../../../shared/services/customer/customer';
import { Sports as SportsService } from '../../../shared/services/sports/sports';

export interface CustomerFormDialogData {
  customer?: CustomerModel;
}

interface CustomerFormModel {
  firstName: string;
  lastName: string;
  birthDate: Date | null;
  gender: string;
  phone: string;
  street: string;
  city: string;
  postalCode: string;
  country: string;
  registrationDate: Date | null;
  active: boolean;
}

// Μία γραμμή αθλήματος στο multi-select: υπάρχουσα (id != null) ή νέα (id ==
// null). `removing` σημαίνει ότι ο χρήστης αποεπέλεξε ΥΠΑΡΧΟΝ άθλημα — η
// γραμμή μένει και ζητά ημερομηνία λήξης, αντί να εξαφανιστεί.
interface ActivePeriodRow {
  key: string;
  id: number | null;
  sportId: number;
  sportName: string;
  startDate: Date | null;
  startDateTouched: boolean;
  removing: boolean;
  endDateForRemoval: Date | null;
}

// Περίοδοι που έχουν ήδη λήξει (endDate < σήμερα) — μόνο στην επεξεργασία.
interface HistoryPeriodRow {
  key: string;
  id: number;
  sportId: number;
  sportName: string;
  startDate: Date | null;
  endDate: Date | null;
  deleted: boolean;
}

interface RowError {
  startBeforeRegistration?: boolean;
  endBeforeStart?: boolean;
  endRequired?: boolean;
  overlapping?: boolean;
}

let rowKeySeq = 0;
function nextRowKey(): string {
  rowKeySeq += 1;
  return `row-${rowKeySeq}`;
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

function periodsOverlap(a: { start: string; end: string | null }, b: { start: string; end: string | null }): boolean {
  const aEnd = a.end ?? '9999-12-31';
  const bEnd = b.end ?? '9999-12-31';
  return a.start <= bEnd && b.start <= aEnd;
}

function toFormModel(customer?: CustomerModel): CustomerFormModel {
  return {
    firstName: customer?.firstName ?? '',
    lastName: customer?.lastName ?? '',
    birthDate: customer?.birthDate ? new Date(customer.birthDate) : null,
    gender: customer?.gender ?? '',
    phone: customer?.phone ?? '',
    street: customer?.street ?? '',
    city: customer?.city ?? '',
    postalCode: customer?.postalCode ?? '',
    country: customer?.country ?? '',
    registrationDate: customer?.registrationDate ? new Date(customer.registrationDate) : todayAtMidnight(),
    active: customer?.active ?? true,
  };
}

// "Δεν έχει λήξει" — ίδιος κανόνας με το BE (endDate IS NULL ή endDate >= σήμερα).
function isCurrentlyActive(endDate: string | null, today: Date): boolean {
  return endDate === null || new Date(endDate) >= today;
}

function buildInitialActivePeriods(customer: CustomerModel | undefined, today: Date): ActivePeriodRow[] {
  if (!customer) return [];
  return customer.enrollments
    .filter((e) => isCurrentlyActive(e.endDate, today))
    .map((e) => ({
      key: nextRowKey(),
      id: e.id,
      sportId: e.sportId,
      sportName: e.sportName,
      startDate: new Date(e.startDate),
      startDateTouched: true,
      removing: false,
      endDateForRemoval: null,
    }));
}

function buildInitialHistoryPeriods(customer: CustomerModel | undefined, today: Date): HistoryPeriodRow[] {
  if (!customer) return [];
  return customer.enrollments
    .filter((e) => !isCurrentlyActive(e.endDate, today))
    .map((e) => ({
      key: nextRowKey(),
      id: e.id,
      sportId: e.sportId,
      sportName: e.sportName,
      startDate: new Date(e.startDate),
      endDate: e.endDate ? new Date(e.endDate) : null,
      deleted: false,
    }));
}

function buildEnrollmentsPayload(
  activePeriods: ActivePeriodRow[],
  historyPeriods: HistoryPeriodRow[],
): CustomerEnrollmentPayload[] {
  const entries: CustomerEnrollmentPayload[] = [];

  for (const row of activePeriods) {
    if (row.removing) {
      if (row.id !== null) {
        entries.push({
          id: row.id,
          sportId: row.sportId,
          startDate: formatDateForApi(row.startDate),
          endDate: formatDateForApi(row.endDateForRemoval),
        });
      }
      continue;
    }
    entries.push(
      row.id !== null
        ? { id: row.id, sportId: row.sportId, startDate: formatDateForApi(row.startDate) }
        : { sportId: row.sportId, startDate: formatDateForApi(row.startDate) },
    );
  }

  for (const row of historyPeriods) {
    if (row.deleted) continue;
    entries.push({
      id: row.id,
      sportId: row.sportId,
      startDate: formatDateForApi(row.startDate),
      endDate: formatDateForApi(row.endDate),
    });
  }

  return entries;
}

const PHONE_PATTERN = /^[0-9+()\-\s]{7,20}$/;

@Component({
  selector: 'app-customer-form-dialog',
  imports: [
    FormField,
    FormRoot,
    MatDialogTitle,
    MatDialogContent,
    MatDialogActions,
    MatDialogClose,
    MatFormField,
    MatLabel,
    MatError,
    MatSuffix,
    MatInput,
    MatSelect,
    MatOption,
    MatDatepicker,
    MatDatepickerInput,
    MatDatepickerToggle,
    MatButton,
    MatIconButton,
    MatIcon,
    MatSlideToggle,
    TranslocoDirective,
  ],
  templateUrl: './customer-form-dialog.html',
  styleUrl: './customer-form-dialog.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CustomerFormDialog {
  private readonly data = inject<CustomerFormDialogData | null>(MAT_DIALOG_DATA, {
    optional: true,
  });
  private readonly customerService = inject(CustomerService);
  private readonly sportsService = inject(SportsService);
  private readonly dialogRef = inject(MatDialogRef<CustomerFormDialog, CustomerModel>);

  protected readonly isEditMode = !!this.data?.customer;
  protected readonly paidUntil = this.data?.customer?.paidUntil ?? null;
  protected readonly inactiveSince = this.data?.customer?.inactiveSince ?? null;
  protected readonly registrationDateDisplay = this.data?.customer?.registrationDate ?? null;

  protected readonly sportsResource = rxResource({
    stream: () => this.sportsService.getSports(),
  });

  private readonly today = todayAtMidnight();

  protected readonly model = signal<CustomerFormModel>(toFormModel(this.data?.customer));
  protected readonly saveError = signal(false);

  protected readonly activePeriods = signal<ActivePeriodRow[]>(
    buildInitialActivePeriods(this.data?.customer, this.today),
  );
  protected readonly historyPeriods = signal<HistoryPeriodRow[]>(
    buildInitialHistoryPeriods(this.data?.customer, this.today),
  );

  protected readonly selectedSportIds = computed(() =>
    this.activePeriods()
      .filter((row) => !row.removing)
      .map((row) => row.sportId),
  );

  protected readonly enrollmentErrors = computed<Map<string, RowError>>(() => {
    const registrationDate = formatDateForApi(this.model().registrationDate);
    const errors = new Map<string, RowError>();
    const setError = (key: string, patch: RowError) =>
      errors.set(key, { ...errors.get(key), ...patch });

    type Period = { key: string; sportId: number; start: string; end: string | null };
    const periods: Period[] = [];

    for (const row of this.activePeriods()) {
      if (row.removing) {
        if (!row.endDateForRemoval) {
          setError(row.key, { endRequired: true });
          continue;
        }
        const start = formatDateForApi(row.startDate);
        const end = formatDateForApi(row.endDateForRemoval);
        if (registrationDate && start < registrationDate) setError(row.key, { startBeforeRegistration: true });
        if (end <= start) setError(row.key, { endBeforeStart: true });
        periods.push({ key: row.key, sportId: row.sportId, start, end });
      } else {
        if (!row.startDate) continue;
        const start = formatDateForApi(row.startDate);
        if (registrationDate && start < registrationDate) setError(row.key, { startBeforeRegistration: true });
        periods.push({ key: row.key, sportId: row.sportId, start, end: null });
      }
    }

    for (const row of this.historyPeriods()) {
      if (row.deleted) continue;
      if (!row.startDate || !row.endDate) {
        setError(row.key, { endRequired: true });
        continue;
      }
      const start = formatDateForApi(row.startDate);
      const end = formatDateForApi(row.endDate);
      if (registrationDate && start < registrationDate) setError(row.key, { startBeforeRegistration: true });
      if (end <= start) setError(row.key, { endBeforeStart: true });
      periods.push({ key: row.key, sportId: row.sportId, start, end });
    }

    const bySport = new Map<number, Period[]>();
    for (const period of periods) {
      const list = bySport.get(period.sportId) ?? [];
      list.push(period);
      bySport.set(period.sportId, list);
    }
    for (const list of bySport.values()) {
      for (let i = 0; i < list.length; i++) {
        for (let j = i + 1; j < list.length; j++) {
          if (periodsOverlap(list[i], list[j])) {
            setError(list[i].key, { overlapping: true });
            setError(list[j].key, { overlapping: true });
          }
        }
      }
    }

    return errors;
  });

  protected readonly hasEnrollmentErrors = computed(() => this.enrollmentErrors().size > 0);

  protected readonly customerForm = form(
    this.model,
    (customer) => {
      required(customer.firstName);
      minLength(customer.firstName, 2);
      maxLength(customer.firstName, 50);

      required(customer.lastName);
      minLength(customer.lastName, 2);
      maxLength(customer.lastName, 50);

      required(customer.birthDate);

      required(customer.gender);
      maxLength(customer.gender, 30);

      required(customer.phone);
      pattern(customer.phone, PHONE_PATTERN);

      required(customer.registrationDate);
    },
    {
      submission: {
        action: async (field) => {
          const value = field().value();
          const payload = this.toCustomerPayload(value);
          const customerId = this.data?.customer?.id;

          try {
            const saved =
              customerId === undefined
                ? await firstValueFrom(this.customerService.createCustomer(payload))
                : await firstValueFrom(this.customerService.updateCustomer(customerId, payload));

            this.saveError.set(false);
            this.dialogRef.close(saved);
          } catch {
            this.saveError.set(true);
          }
          return undefined;
        },
      },
    },
  );

  protected readonly saveDisabled = computed(
    () => this.customerForm().invalid() || this.hasEnrollmentErrors(),
  );

  constructor() {
    // Στη δημιουργία, οι γραμμές αθλημάτων που ο χρήστης δεν έχει πειράξει
    // ακολουθούν την ημερομηνία εγγραφής όσο αλλάζει.
    effect(() => {
      const registrationDate = this.model().registrationDate;
      if (this.isEditMode) return;
      untracked(() => {
        this.activePeriods.update((rows) =>
          rows.map((row) => (row.startDateTouched ? row : { ...row, startDate: registrationDate })),
        );
      });
    });
  }

  private toCustomerPayload(value: CustomerFormModel): CustomerPayload {
    const payload: CustomerPayload = {
      firstName: value.firstName,
      lastName: value.lastName,
      birthDate: formatDateForApi(value.birthDate),
      gender: value.gender,
      phone: value.phone,
      street: value.street,
      city: value.city,
      postalCode: value.postalCode,
      country: value.country,
      active: value.active,
      enrollments: buildEnrollmentsPayload(this.activePeriods(), this.historyPeriods()),
    };
    if (!this.isEditMode) {
      payload.registrationDate = formatDateForApi(value.registrationDate);
    }
    return payload;
  }

  protected hasError(errors: readonly ValidationError.WithFieldTree[], kind: string): boolean {
    return errors.some((e) => e.kind === kind);
  }

  protected onBirthDateChange(date: Date | null): void {
    this.model.update((m) => ({ ...m, birthDate: date }));
  }

  protected onRegistrationDateChange(date: Date | null): void {
    this.model.update((m) => ({ ...m, registrationDate: date }));
  }

  protected onActiveChange(active: boolean): void {
    this.model.update((m) => ({ ...m, active }));
  }

  protected onSportIdsChange(event: MatSelectChange): void {
    const newSelectedIds = event.value as number[];

    this.activePeriods.update((rows) => {
      const currentSelectedIds = rows.filter((r) => !r.removing).map((r) => r.sportId);
      const added = newSelectedIds.filter((id) => !currentSelectedIds.includes(id));
      const removed = currentSelectedIds.filter((id) => !newSelectedIds.includes(id));

      let next = rows;

      for (const sportId of removed) {
        const rowIndex = next.findIndex((r) => r.sportId === sportId && !r.removing);
        if (rowIndex === -1) continue;
        const row = next[rowIndex];
        if (row.id === null) {
          // Δεν έχει αποθηκευτεί ακόμα — η αποεπιλογή απλά αφαιρεί τη γραμμή.
          next = next.filter((_, i) => i !== rowIndex);
        } else {
          next = next.map((r, i) =>
            i === rowIndex ? { ...r, removing: true, endDateForRemoval: null } : r,
          );
        }
      }

      for (const sportId of added) {
        const removingIndex = next.findIndex((r) => r.sportId === sportId && r.removing);
        if (removingIndex !== -1) {
          // Ξαναεπιλογή πριν την αποθήκευση: ακυρώνει την αποχώρηση.
          next = next.map((r, i) =>
            i === removingIndex ? { ...r, removing: false, endDateForRemoval: null } : r,
          );
          continue;
        }
        const sport = this.sportsResource.value()?.find((s) => s.id === sportId);
        next = [
          ...next,
          {
            key: nextRowKey(),
            id: null,
            sportId,
            sportName: sport?.name ?? '',
            startDate: this.isEditMode ? todayAtMidnight() : this.model().registrationDate,
            startDateTouched: false,
            removing: false,
            endDateForRemoval: null,
          },
        ];
      }

      return next;
    });
  }

  protected onActiveRowStartDateChange(row: ActivePeriodRow, date: Date | null): void {
    this.activePeriods.update((rows) =>
      rows.map((r) => (r.key === row.key ? { ...r, startDate: date, startDateTouched: true } : r)),
    );
  }

  protected onActiveRowEndDateChange(row: ActivePeriodRow, date: Date | null): void {
    this.activePeriods.update((rows) =>
      rows.map((r) => (r.key === row.key ? { ...r, endDateForRemoval: date } : r)),
    );
  }

  protected deleteActivePeriod(row: ActivePeriodRow): void {
    // Περίοδος που μπήκε κατά λάθος (Q-F) — διαφορετικό από την αποχώρηση.
    this.activePeriods.update((rows) => rows.filter((r) => r.key !== row.key));
  }

  protected onHistoryRowStartDateChange(row: HistoryPeriodRow, date: Date | null): void {
    this.historyPeriods.update((rows) =>
      rows.map((r) => (r.key === row.key ? { ...r, startDate: date } : r)),
    );
  }

  protected onHistoryRowEndDateChange(row: HistoryPeriodRow, date: Date | null): void {
    this.historyPeriods.update((rows) =>
      rows.map((r) => (r.key === row.key ? { ...r, endDate: date } : r)),
    );
  }

  protected deleteHistoryPeriod(row: HistoryPeriodRow): void {
    this.historyPeriods.update((rows) => rows.filter((r) => r.key !== row.key));
  }

  protected rowError(key: string): RowError | undefined {
    return this.enrollmentErrors().get(key);
  }
}
