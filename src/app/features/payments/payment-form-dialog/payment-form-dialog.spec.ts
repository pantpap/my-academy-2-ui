import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideNativeDateAdapter } from '@angular/material/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { HttpErrorResponse } from '@angular/common/http';
import { TranslocoTestingModule } from '@jsverse/transloco';
import { of, throwError } from 'rxjs';

import { PaymentFormDialog, PaymentFormDialogData } from './payment-form-dialog';
import { Payment, RosterSeasonMonth } from '../../../common/interfaces/payment';
import { CreatePaymentPayload, Payments as PaymentsService } from '../../../shared/services/payment/payment';

const en = {
  common: { save: 'Save', cancel: 'Cancel' },
  payments: {
    recordTitle: 'Record payment for {{name}}',
    monthsLabel: 'Months',
    amountLabel: 'Amount',
    amountRequired: 'Amount is required',
    amountInvalid: 'Amount must be greater than 0',
    dateLabel: 'Payment date',
    dateRequired: 'Payment date is required',
    runningTotal: 'Total',
    duplicateError: 'A payment for {{month}} {{year}} already exists for this athlete',
    saveError: 'Something went wrong while saving. Please try again.',
    savedMonths: 'Saved: {{months}}',
  },
};

const SEASON_MONTHS = [9, 10, 11, 12, 1, 2, 3, 4, 5, 6];

function months(paidMonths: number[] = [], startYear = 2026): RosterSeasonMonth[] {
  return SEASON_MONTHS.map((month) => {
    const year = month >= 9 ? startYear : startYear + 1;
    const paid = paidMonths.includes(month);
    return {
      month,
      year,
      paid,
      paymentId: paid ? month : null,
      amount: paid ? 30 : null,
      paymentDate: paid ? '2026-01-05' : null,
    };
  });
}

const existingPayments: Payment[] = [
  {
    id: 1,
    athleteId: 3,
    organizationId: 7,
    amount: 25,
    paymentDate: '2026-05-05',
    coveredMonth: 5,
    coveredYear: 2026,
    notes: null,
    createdAt: '2026-05-05T00:00:00.000Z',
  },
  {
    id: 2,
    athleteId: 3,
    organizationId: 7,
    amount: 30,
    paymentDate: '2026-06-05',
    coveredMonth: 6,
    coveredYear: 2026,
    notes: null,
    createdAt: '2026-06-05T00:00:00.000Z',
  },
];

async function createFixture(
  data: PaymentFormDialogData,
  options?: {
    getPayments?: ReturnType<typeof vi.fn>;
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
          getPayments: options?.getPayments ?? vi.fn(() => of(existingPayments)),
          createPayment: options?.createPayment ?? vi.fn(() => of({})),
        },
      },
    ],
  }).compileComponents();

  const fixture = TestBed.createComponent(PaymentFormDialog);
  fixture.detectChanges();
  await fixture.whenStable();
  fixture.detectChanges();
  return fixture;
}

function baseData(overrides?: Partial<PaymentFormDialogData>): PaymentFormDialogData {
  return {
    athleteId: 3,
    athleteName: 'Jane Doe',
    initialMonth: 9,
    initialYear: 2026,
    months: months(),
    onSaved: vi.fn(),
    ...overrides,
  };
}

describe('PaymentFormDialog', () => {
  it('should create', async () => {
    const fixture = await createFixture(baseData());
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('pre-selects the clicked month', async () => {
    const fixture = await createFixture(baseData({ initialMonth: 9, initialYear: 2026 }));
    const toggles = fixture.componentInstance['monthToggles']();
    expect(toggles.find((m) => m.month === 9)?.selected).toBe(true);
    expect(toggles.find((m) => m.month === 10)?.selected).toBe(false);
  });

  it('pre-selects by month AND year — a January toggle from the previous season is not mistaken for this season\'s January', async () => {
    // Both toggle lists contain a "month: 1" entry (this season's January, year 2027) — the
    // clicked cell's initialYear must be the tie-breaker, not month number alone.
    const fixture = await createFixture(baseData({ initialMonth: 1, initialYear: 2027 }));
    const toggles = fixture.componentInstance['monthToggles']();
    const january = toggles.find((m) => m.month === 1);
    expect(january?.year).toBe(2027);
    expect(january?.selected).toBe(true);
  });

  it('marks already-paid months as selected and disabled, and keeps them selected even if a selection-change event omits them', async () => {
    const fixture = await createFixture(baseData({ months: months([5, 6]) }));
    const toggles = fixture.componentInstance['monthToggles']();
    expect(toggles.find((m) => m.month === 5)?.paid).toBe(true);
    expect(toggles.find((m) => m.month === 5)?.selected).toBe(true);

    // Simulates a selection-change event that dropped month 5 — the component must not
    // trust it, since a disabled mat-option should never be removable by the user anyway.
    fixture.componentInstance['onMonthsSelectionChange']([9]);
    const after = fixture.componentInstance['monthToggles']();
    expect(after.find((m) => m.month === 5)?.selected).toBe(true);
  });

  it('toggles an unpaid month on and off via the multi-select', async () => {
    const fixture = await createFixture(baseData({ initialMonth: 9, initialYear: 2026 }));
    fixture.componentInstance['onMonthsSelectionChange']([9, 10]);
    expect(
      fixture.componentInstance['monthToggles']().find((m) => m.month === 10)?.selected,
    ).toBe(true);

    fixture.componentInstance['onMonthsSelectionChange']([9]);
    expect(
      fixture.componentInstance['monthToggles']().find((m) => m.month === 10)?.selected,
    ).toBe(false);
  });

  it('tracks all 10 season months, flagging the already-paid ones so the template can disable them', async () => {
    // mat-select renders its mat-options into a CDK overlay only once the panel is opened,
    // so this asserts against the data the template iterates over (as in
    // CustomerFormDialog's equivalent sports mat-select spec) rather than querying rendered
    // DOM, which would require driving the overlay open in jsdom.
    const fixture = await createFixture(baseData({ months: months([5, 6]) }));
    const toggles = fixture.componentInstance['monthToggles']();
    expect(toggles.length).toBe(10);
    expect(toggles.filter((m) => m.paid).map((m) => m.month)).toEqual([5, 6]);
  });

  it('prefills the amount from the athlete\'s most recently created payment', async () => {
    const getPayments = vi.fn(() => of(existingPayments));
    const fixture = await createFixture(baseData(), { getPayments });

    expect(getPayments).toHaveBeenCalledWith(3);
    expect(fixture.componentInstance['model']().amount).toBe(30);
  });

  it('leaves the amount empty when the athlete has no prior payments', async () => {
    const fixture = await createFixture(baseData(), { getPayments: vi.fn(() => of([])) });
    expect(fixture.componentInstance['model']().amount).toBeNull();
  });

  it('computes the running total from the typed amount and selected month count', async () => {
    const fixture = await createFixture(baseData({ initialMonth: 9, initialYear: 2026 }), {
      getPayments: vi.fn(() => of([])),
    });

    fixture.componentInstance['onAmountInput']('20');
    fixture.componentInstance['onMonthsSelectionChange']([9, 10, 11]);

    expect(fixture.componentInstance['runningTotal']()).toBe(60);
  });

  it('excludes already-paid months from the running total even though they are shown selected', async () => {
    const fixture = await createFixture(
      baseData({ initialMonth: 9, initialYear: 2026, months: months([5]) }),
    );

    fixture.componentInstance['onAmountInput']('20');
    fixture.componentInstance['onMonthsSelectionChange']([5, 9, 10]);

    expect(fixture.componentInstance['runningTotal']()).toBe(40);
  });

  it('disables save until amount and date are valid and at least one month is selected', async () => {
    const fixture = await createFixture(baseData({ initialMonth: 9, initialYear: 2026 }), {
      getPayments: vi.fn(() => of([])),
    });
    expect(fixture.componentInstance['saveDisabled']()).toBe(true);

    fixture.componentInstance['onAmountInput']('20');
    expect(fixture.componentInstance['saveDisabled']()).toBe(false);

    fixture.componentInstance['onMonthsSelectionChange']([]);
    expect(fixture.componentInstance['saveDisabled']()).toBe(true);
  });

  describe('submission', () => {
    it('posts one createPayment per selected month, sequentially, in ascending order', async () => {
      const calledMonths: number[] = [];
      const createPayment = vi.fn((payload: CreatePaymentPayload) => {
        calledMonths.push(payload.coveredMonth);
        return of({});
      });
      const close = vi.fn();
      const fixture = await createFixture(baseData({ initialMonth: 9, initialYear: 2026 }), {
        getPayments: vi.fn(() => of([])),
        createPayment,
        close,
      });

      fixture.componentInstance['onAmountInput']('20');
      fixture.componentInstance['onMonthsSelectionChange']([9, 10, 11]);

      await fixture.componentInstance['save']();

      expect(calledMonths).toEqual([9, 10, 11]);
      expect(close).toHaveBeenCalledWith({ success: true });
    });

    it('posts the correct coveredYear per month for a selection spanning the Dec/Jan boundary', async () => {
      // The single most important test in this file: a November + January selection must
      // NOT post the same coveredYear for both — November is 2026, January is 2027.
      const calls: { coveredMonth: number; coveredYear: number }[] = [];
      const createPayment = vi.fn((payload: CreatePaymentPayload) => {
        calls.push({ coveredMonth: payload.coveredMonth, coveredYear: payload.coveredYear });
        return of({});
      });
      const close = vi.fn();
      const fixture = await createFixture(baseData({ initialMonth: 11, initialYear: 2026 }), {
        getPayments: vi.fn(() => of([])),
        createPayment,
        close,
      });

      fixture.componentInstance['onAmountInput']('20');
      fixture.componentInstance['onMonthsSelectionChange']([11, 1]);

      await fixture.componentInstance['save']();

      expect(calls).toEqual([
        { coveredMonth: 11, coveredYear: 2026 },
        { coveredMonth: 1, coveredYear: 2027 },
      ]);
      expect(close).toHaveBeenCalledWith({ success: true });
    });

    it('stops at the first failure and reports which months saved vs. which did not', async () => {
      const onSaved = vi.fn();
      const createPayment = vi
        .fn()
        .mockReturnValueOnce(of({}))
        .mockReturnValueOnce(throwError(() => new Error('boom')));
      const close = vi.fn();
      const fixture = await createFixture(
        baseData({ initialMonth: 9, initialYear: 2026, onSaved }),
        {
          getPayments: vi.fn(() => of([])),
          createPayment,
          close,
        },
      );

      fixture.componentInstance['onAmountInput']('20');
      fixture.componentInstance['onMonthsSelectionChange']([9, 10]);

      await fixture.componentInstance['save']();

      expect(createPayment).toHaveBeenCalledTimes(2);
      expect(fixture.componentInstance['savedMonths']()).toEqual([9]);
      expect(fixture.componentInstance['failedMonth']()).toBe(10);
      expect(close).not.toHaveBeenCalled();
      expect(onSaved).toHaveBeenCalled();
    });

    it('renders a distinct message for a 409 duplicate-payment conflict', async () => {
      const createPayment = vi.fn(() =>
        throwError(() => new HttpErrorResponse({ status: 409 })),
      );
      const fixture = await createFixture(baseData({ initialMonth: 9, initialYear: 2026 }), {
        getPayments: vi.fn(() => of([])),
        createPayment,
      });
      fixture.componentInstance['onAmountInput']('20');

      await fixture.componentInstance['save']();
      fixture.detectChanges();

      expect(fixture.nativeElement.textContent).toContain('already exists for this athlete');
    });

    it('reports the correct month AND year in a duplicate-error on the far side of the season', async () => {
      const createPayment = vi
        .fn()
        .mockReturnValueOnce(of({}))
        .mockReturnValueOnce(throwError(() => new HttpErrorResponse({ status: 409 })));
      const fixture = await createFixture(baseData({ initialMonth: 11, initialYear: 2026 }), {
        getPayments: vi.fn(() => of([])),
        createPayment,
      });
      fixture.componentInstance['onAmountInput']('20');
      fixture.componentInstance['onMonthsSelectionChange']([11, 1]);

      await fixture.componentInstance['save']();
      fixture.detectChanges();

      // January (the failing month) is year 2027, not November's 2026.
      expect(fixture.nativeElement.textContent).toContain('2027');
      expect(fixture.nativeElement.textContent).not.toContain('A payment for January 2026');
    });

    it('shows a generic error for a non-409 failure', async () => {
      const createPayment = vi.fn(() => throwError(() => new Error('network error')));
      const fixture = await createFixture(baseData({ initialMonth: 9, initialYear: 2026 }), {
        getPayments: vi.fn(() => of([])),
        createPayment,
      });
      fixture.componentInstance['onAmountInput']('20');

      await fixture.componentInstance['save']();
      fixture.detectChanges();

      expect(fixture.nativeElement.textContent).toContain('Something went wrong while saving');
    });

    it('cannot be double-submitted while a save is in flight', async () => {
      const fixture = await createFixture(baseData({ initialMonth: 9, initialYear: 2026 }), {
        getPayments: vi.fn(() => of([])),
      });
      fixture.componentInstance['onAmountInput']('20');

      const savePromise = fixture.componentInstance['save']();
      expect(fixture.componentInstance['saveDisabled']()).toBe(true);

      await savePromise;
    });
  });
});
