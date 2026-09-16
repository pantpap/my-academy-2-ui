import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideNativeDateAdapter } from '@angular/material/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { HttpErrorResponse } from '@angular/common/http';
import { TranslocoTestingModule } from '@jsverse/transloco';
import { of, throwError } from 'rxjs';

import { PaymentFormDialog, PaymentFormDialogData } from './payment-form-dialog';
import { Payments as PaymentsService } from '../../../shared/services/payment/payment';
import { RosterSeasonMonth } from '../../../common/interfaces/payment';

const SEASON_MONTHS = [9, 10, 11, 12, 1, 2, 3, 4, 5, 6];

const en = {
  common: { cancel: 'Cancel', save: 'Save' },
  payments: {
    recordTitle: 'Record payment for {{name}}',
    monthsLabel: 'Months',
    sportsLabel: 'Sports',
    sportsRequired: 'Select at least one sport',
    amountLabel: 'Amount',
    amountRequired: 'Amount is required',
    amountInvalid: 'Amount must be greater than 0',
    dateLabel: 'Payment date',
    dateRequired: 'Payment date is required',
    nothingToPay: 'All selected months and sports are already paid or not owed.',
    saveError: 'Something went wrong while saving. Please try again.',
  },
};

function buildMonth(overrides: Partial<RosterSeasonMonth> = {}): RosterSeasonMonth {
  const month = overrides.month ?? 9;
  return {
    month,
    year: month >= 9 ? 2026 : 2027,
    status: 'unpaid',
    owedSports: [{ id: 1, name: 'Football' }],
    unpaidSports: [{ id: 1, name: 'Football' }],
    entries: [],
    ...overrides,
  };
}

function seasonMonths(overrides: Record<number, Partial<RosterSeasonMonth>> = {}): RosterSeasonMonth[] {
  return SEASON_MONTHS.map((month) => buildMonth({ month, ...overrides[month] }));
}

function baseData(overrides: Partial<PaymentFormDialogData> = {}): PaymentFormDialogData {
  return {
    athleteId: 1,
    athleteName: 'Kostas Georgiou',
    initialMonth: 9,
    initialYear: 2026,
    months: seasonMonths(),
    ...overrides,
  };
}

async function createFixture(
  data: PaymentFormDialogData,
  options?: {
    createPayment?: ReturnType<typeof vi.fn>;
    close?: ReturnType<typeof vi.fn>;
  },
): Promise<ComponentFixture<PaymentFormDialog>> {
  await TestBed.configureTestingModule({
    imports: [
      PaymentFormDialog,
      TranslocoTestingModule.forRoot({
        langs: { en },
        translocoConfig: { availableLangs: ['en', 'el'], defaultLang: 'en' },
      }),
    ],
    providers: [
      provideNativeDateAdapter(),
      { provide: MAT_DIALOG_DATA, useValue: data },
      { provide: MatDialogRef, useValue: { close: options?.close ?? vi.fn() } },
      {
        provide: PaymentsService,
        useValue: {
          createPayment: options?.createPayment ?? vi.fn(() => of({ id: 1, items: [], skipped: [] })),
        },
      },
    ],
  }).compileComponents();

  const fixture = TestBed.createComponent(PaymentFormDialog);
  fixture.detectChanges();
  await fixture.whenStable();
  return fixture;
}

describe('PaymentFormDialog', () => {
  it('shows the athlete name in the title', async () => {
    const fixture = await createFixture(baseData());
    const title = fixture.nativeElement.querySelector('[mat-dialog-title]');
    expect(title.textContent).toContain('Kostas Georgiou');
  });

  it('pre-selects the initially clicked month', async () => {
    const fixture = await createFixture(baseData({ initialMonth: 11, initialYear: 2026 }));
    expect(fixture.componentInstance['selectedMonths']()).toEqual([11]);
  });

  it('locks already-fully-paid months as selected and non-submittable', async () => {
    const fixture = await createFixture(
      baseData({ months: seasonMonths({ 9: { status: 'paid' }, 10: {} }) }),
    );

    const toggles = fixture.componentInstance['monthToggles']();
    expect(toggles.find((m) => m.month === 9)?.selected).toBe(true);
    expect(fixture.componentInstance['monthsToSubmit']().some((m) => m.month === 9)).toBe(false);
  });

  it('disables unavailable months in the multi-select', async () => {
    const fixture = await createFixture(
      baseData({ months: seasonMonths({ 12: { status: 'unavailable', owedSports: [], unpaidSports: [] } }) }),
    );

    const select = fixture.nativeElement.querySelector('mat-select');
    expect(select).toBeTruthy();
    const toggle = fixture.componentInstance['monthToggles']().find((m) => m.month === 12);
    expect(toggle?.status).toBe('unavailable');
  });

  describe('sports selection', () => {
    it('hides the sports dropdown and auto-selects when only one sport is owed', async () => {
      const fixture = await createFixture(baseData());

      expect(fixture.componentInstance['showSportsSelect']()).toBe(false);
      expect(fixture.componentInstance['selectedSportIds']()).toEqual([1]);
    });

    it('shows the sports dropdown, required, when more than one sport is owed', async () => {
      const fixture = await createFixture(
        baseData({
          months: seasonMonths({
            9: {
              owedSports: [{ id: 1, name: 'Football' }, { id: 2, name: 'Basketball' }],
              unpaidSports: [{ id: 1, name: 'Football' }, { id: 2, name: 'Basketball' }],
            },
          }),
        }),
      );

      expect(fixture.componentInstance['showSportsSelect']()).toBe(true);
      expect(fixture.componentInstance['selectedSportIds']()).toEqual([]);
      expect(fixture.componentInstance['saveDisabled']()).toBe(true);
    });

    it('is the union of owedSports across every selected month', async () => {
      const fixture = await createFixture(
        baseData({
          months: seasonMonths({
            9: { owedSports: [{ id: 1, name: 'Football' }] },
            10: { owedSports: [{ id: 2, name: 'Basketball' }] },
          }),
        }),
      );

      fixture.componentInstance['onMonthsSelectionChange']([9, 10]);

      const ids = fixture.componentInstance['availableSports']().map((s) => s.id).sort();
      expect(ids).toEqual([1, 2]);
    });
  });

  describe('saving', () => {
    it('sends one POST with months[] and sportIds[], no amount prefill', async () => {
      const createPayment = vi.fn(() => of({ id: 1, items: [], skipped: [] }));
      const close = vi.fn();
      const fixture = await createFixture(baseData(), { createPayment, close });

      expect(fixture.componentInstance['model']().amount).toBeNull();

      fixture.componentInstance['onAmountInput']('40');
      await fixture.componentInstance['save']();

      expect(createPayment).toHaveBeenCalledTimes(1);
      expect(createPayment).toHaveBeenCalledWith(
        expect.objectContaining({
          athleteId: 1,
          amount: 40,
          months: [{ month: 9, year: 2026 }],
          sportIds: [1],
        }),
      );
      expect(close).toHaveBeenCalledWith({ success: true });
    });

    it('does not render a running total', async () => {
      const fixture = await createFixture(baseData());
      expect(fixture.nativeElement.textContent).not.toContain('Total');
    });

    it('shows the nothingToPay message on a 409 response', async () => {
      const createPayment = vi.fn(() =>
        throwError(() => new HttpErrorResponse({ status: 409 })),
      );
      const fixture = await createFixture(baseData(), { createPayment });

      fixture.componentInstance['onAmountInput']('40');
      await fixture.componentInstance['save']();
      fixture.detectChanges();

      expect(fixture.componentInstance['failureMessage']()).toBe(
        'All selected months and sports are already paid or not owed.',
      );
    });

    it('shows a generic save error on any other failure', async () => {
      const createPayment = vi.fn(() => throwError(() => new Error('network error')));
      const fixture = await createFixture(baseData(), { createPayment });

      fixture.componentInstance['onAmountInput']('40');
      await fixture.componentInstance['save']();

      expect(fixture.componentInstance['failureMessage']()).toBe(
        'Something went wrong while saving. Please try again.',
      );
    });

    it('is disabled until amount and date are set', async () => {
      const fixture = await createFixture(baseData());
      expect(fixture.componentInstance['saveDisabled']()).toBe(true);

      fixture.componentInstance['onAmountInput']('40');
      expect(fixture.componentInstance['saveDisabled']()).toBe(false);
    });
  });
});
