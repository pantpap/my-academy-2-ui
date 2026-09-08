import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { TranslocoTestingModule } from '@jsverse/transloco';
import { of, throwError } from 'rxjs';

import { PaymentDetailDialog, PaymentDetailDialogData } from './payment-detail-dialog';
import { Payment, RosterSeasonMonth } from '../../../common/interfaces/payment';
import { Payments as PaymentsService } from '../../../shared/services/payment/payment';

const en = {
  common: { close: 'Close', cancel: 'Cancel', delete: 'Delete' },
  payments: {
    detailTitle: 'Payment details for {{name}}',
    amountLabel: 'Amount',
    dateLabel: 'Payment date',
    notesLabel: 'Notes',
    deleteConfirm: 'Are you sure you want to delete this payment? This cannot be undone.',
    deleteError: 'Something went wrong while deleting. Please try again.',
  },
};

const paidMonth: RosterSeasonMonth = {
  month: 5,
  year: 2027,
  paid: true,
  paymentId: 12,
  amount: 30,
  paymentDate: '2026-05-05',
};

const fullPayments: Payment[] = [
  {
    id: 12,
    athleteId: 3,
    organizationId: 7,
    amount: 30,
    paymentDate: '2026-05-05',
    coveredMonth: 5,
    coveredYear: 2026,
    notes: 'Paid in cash',
    createdAt: '2026-05-05T00:00:00.000Z',
  },
];

async function createFixture(
  data: PaymentDetailDialogData,
  options?: {
    getPayments?: ReturnType<typeof vi.fn>;
    deletePayment?: ReturnType<typeof vi.fn>;
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
      { provide: MAT_DIALOG_DATA, useValue: data },
      { provide: MatDialogRef, useValue: { close: options?.close ?? vi.fn() } },
      {
        provide: PaymentsService,
        useValue: {
          getPayments: options?.getPayments ?? vi.fn(() => of(fullPayments)),
          deletePayment: options?.deletePayment ?? vi.fn(() => of(undefined)),
        },
      },
    ],
  }).compileComponents();

  const fixture = TestBed.createComponent(PaymentDetailDialog);
  fixture.detectChanges();
  await fixture.whenStable();
  fixture.detectChanges();
  return fixture;
}

function baseData(overrides?: Partial<PaymentDetailDialogData>): PaymentDetailDialogData {
  return {
    athleteId: 3,
    athleteName: 'Jane Doe',
    payment: paidMonth,
    ...overrides,
  };
}

describe('PaymentDetailDialog', () => {
  it('should create', async () => {
    const fixture = await createFixture(baseData());
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('shows the amount and payment date', async () => {
    const fixture = await createFixture(baseData());
    expect(fixture.nativeElement.textContent).toContain('30');
    expect(fixture.nativeElement.textContent).toContain('2026-05-05');
  });

  it('shows notes fetched from the full payment record', async () => {
    const fixture = await createFixture(baseData());
    expect(fixture.nativeElement.textContent).toContain('Paid in cash');
  });

  it('does not show a notes line when there are none', async () => {
    const fixture = await createFixture(baseData(), {
      getPayments: vi.fn(() => of([{ ...fullPayments[0], notes: null }])),
    });
    expect(fixture.nativeElement.textContent).not.toContain('Notes');
  });

  it('requires an explicit confirmation step before deleting', async () => {
    const deletePayment = vi.fn(() => of(undefined));
    const fixture = await createFixture(baseData(), { deletePayment });

    expect(fixture.nativeElement.textContent).toContain('Delete');
    expect(deletePayment).not.toHaveBeenCalled();

    fixture.componentInstance['requestDelete']();
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Are you sure');
    expect(deletePayment).not.toHaveBeenCalled();
  });

  it('deletes and closes with { deleted: true } on confirm', async () => {
    const deletePayment = vi.fn(() => of(undefined));
    const close = vi.fn();
    const fixture = await createFixture(baseData(), { deletePayment, close });

    fixture.componentInstance['requestDelete']();
    await fixture.componentInstance['confirmDelete']();

    expect(deletePayment).toHaveBeenCalledWith(12);
    expect(close).toHaveBeenCalledWith({ deleted: true });
  });

  it('shows a translated error and does not close when delete fails', async () => {
    const deletePayment = vi.fn(() => throwError(() => new Error('boom')));
    const close = vi.fn();
    const fixture = await createFixture(baseData(), { deletePayment, close });

    fixture.componentInstance['requestDelete']();
    await fixture.componentInstance['confirmDelete']();
    fixture.detectChanges();

    expect(close).not.toHaveBeenCalled();
    expect(fixture.nativeElement.textContent).toContain('Something went wrong while deleting');
  });
});
