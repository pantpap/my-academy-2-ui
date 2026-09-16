import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideNativeDateAdapter } from '@angular/material/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { TranslocoTestingModule } from '@jsverse/transloco';
import { of, throwError } from 'rxjs';

import { PaymentDetailDialog, PaymentDetailDialogData } from './payment-detail-dialog';
import { Payments as PaymentsService } from '../../../shared/services/payment/payment';
import { RosterSeasonMonth } from '../../../common/interfaces/payment';

const en = {
  common: { cancel: 'Cancel', close: 'Close', delete: 'Delete' },
  payments: {
    detailTitle: 'Payment details for {{name}} — {{month}} {{year}}',
    entriesTitle: 'Payments recorded',
    dateLabel: 'Payment date',
    sportsLabel: 'Sports',
    notesLabel: 'Notes',
    amountLabel: 'Amount',
    addSportsTitle: 'Add the missing sports',
    addSportsAction: 'Add',
    deleteMonthAction: 'Delete this month',
    deleteMonthConfirm: 'This will delete every payment recorded for {{month}} {{year}}. This cannot be undone.',
    deleteError: 'Something went wrong while deleting. Please try again.',
    saveError: 'Something went wrong while saving. Please try again.',
  },
};

const paidMonth: RosterSeasonMonth = {
  month: 3,
  year: 2027,
  status: 'paid',
  owedSports: [{ id: 1, name: 'Football' }],
  unpaidSports: [],
  entries: [
    {
      paymentId: 12,
      amount: 40,
      coveredMonthsCount: 1,
      paymentDate: '2027-03-05',
      notes: 'On time',
      sports: [{ id: 1, name: 'Football' }],
    },
  ],
};

const partialMonth: RosterSeasonMonth = {
  month: 3,
  year: 2027,
  status: 'partial',
  owedSports: [{ id: 1, name: 'Football' }, { id: 2, name: 'Basketball' }],
  unpaidSports: [{ id: 2, name: 'Basketball' }],
  entries: [
    {
      paymentId: 12,
      amount: 40,
      coveredMonthsCount: 1,
      paymentDate: '2027-03-05',
      notes: null,
      sports: [{ id: 1, name: 'Football' }],
    },
  ],
};

function baseData(month: RosterSeasonMonth): PaymentDetailDialogData {
  return { athleteId: 1, athleteName: 'Kostas Georgiou', month };
}

async function createFixture(
  data: PaymentDetailDialogData,
  options?: {
    createPayment?: ReturnType<typeof vi.fn>;
    deleteMonth?: ReturnType<typeof vi.fn>;
    close?: ReturnType<typeof vi.fn>;
  },
): Promise<ComponentFixture<PaymentDetailDialog>> {
  await TestBed.configureTestingModule({
    imports: [
      PaymentDetailDialog,
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
          createPayment: options?.createPayment ?? vi.fn(() => of({ id: 2, items: [], skipped: [] })),
          deleteMonth: options?.deleteMonth ?? vi.fn(() => of(undefined)),
        },
      },
    ],
  }).compileComponents();

  const fixture = TestBed.createComponent(PaymentDetailDialog);
  fixture.detectChanges();
  await fixture.whenStable();
  return fixture;
}

describe('PaymentDetailDialog', () => {
  it('shows the athlete name and month/year in the title', async () => {
    const fixture = await createFixture(baseData(paidMonth));
    const title = fixture.nativeElement.querySelector('[mat-dialog-title]');
    expect(title.textContent).toContain('Kostas Georgiou');
    expect(title.textContent).toContain('2027');
  });

  it('lists every entry with its date, sports, and notes', async () => {
    const fixture = await createFixture(baseData(paidMonth));

    expect(fixture.nativeElement.textContent).toContain('2027-03-05');
    expect(fixture.nativeElement.textContent).toContain('Football');
    expect(fixture.nativeElement.textContent).toContain('On time');
  });

  describe('adding missing sports (partial month)', () => {
    it('shows the add-sports section listing the unpaid sports', async () => {
      const fixture = await createFixture(baseData(partialMonth));

      expect(fixture.nativeElement.textContent).toContain('Add the missing sports');
    });

    it('auto-selects when there is exactly one unpaid sport (hides the dropdown)', async () => {
      const fixture = await createFixture(baseData(partialMonth));

      expect(fixture.componentInstance['showSportsSelect']).toBe(false);
      expect(fixture.componentInstance['selectedSportIds']()).toEqual([2]);
    });

    it('does not show the add-sports section for a fully paid month', async () => {
      const fixture = await createFixture(baseData(paidMonth));
      expect(fixture.nativeElement.textContent).not.toContain('Add the missing sports');
    });

    it('posts a single-month payment for the missing sport and closes with { changed: true }', async () => {
      const createPayment = vi.fn(() => of({ id: 2, items: [], skipped: [] }));
      const close = vi.fn();
      const fixture = await createFixture(baseData(partialMonth), { createPayment, close });

      fixture.componentInstance['onAmountInput']('20');
      fixture.componentInstance['onDateChange'](new Date('2027-03-10'));
      await fixture.componentInstance['addSports']();

      expect(createPayment).toHaveBeenCalledWith(
        expect.objectContaining({
          athleteId: 1,
          amount: 20,
          months: [{ month: 3, year: 2027 }],
          sportIds: [2],
        }),
      );
      expect(close).toHaveBeenCalledWith({ changed: true });
    });
  });

  describe('deleting a month', () => {
    it('asks for confirmation before deleting', async () => {
      const deleteMonth = vi.fn(() => of(undefined));
      const fixture = await createFixture(baseData(paidMonth), { deleteMonth });

      fixture.componentInstance['requestDelete']();
      fixture.detectChanges();

      expect(fixture.nativeElement.textContent).toContain('This cannot be undone');
      expect(deleteMonth).not.toHaveBeenCalled();
    });

    it('calls deleteMonth with athleteId/month/year and closes with { changed: true } on confirm', async () => {
      const deleteMonth = vi.fn(() => of(undefined));
      const close = vi.fn();
      const fixture = await createFixture(baseData(paidMonth), { deleteMonth, close });

      fixture.componentInstance['requestDelete']();
      await fixture.componentInstance['confirmDelete']();

      expect(deleteMonth).toHaveBeenCalledWith(1, 3, 2027);
      expect(close).toHaveBeenCalledWith({ changed: true });
    });

    it('shows an error and does not close when the delete fails', async () => {
      const deleteMonth = vi.fn(() => throwError(() => new Error('boom')));
      const close = vi.fn();
      const fixture = await createFixture(baseData(paidMonth), { deleteMonth, close });

      fixture.componentInstance['requestDelete']();
      await fixture.componentInstance['confirmDelete']();
      fixture.detectChanges();

      expect(close).not.toHaveBeenCalled();
      expect(fixture.componentInstance['deleteError']()).toBe(true);
      expect(fixture.nativeElement.textContent).toContain('Something went wrong while deleting');
    });
  });
});
