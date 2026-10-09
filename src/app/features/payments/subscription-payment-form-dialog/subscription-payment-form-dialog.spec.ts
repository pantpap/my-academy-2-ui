import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpErrorResponse } from '@angular/common/http';
import { provideNativeDateAdapter } from '@angular/material/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { TranslocoTestingModule } from '@jsverse/transloco';
import { of, throwError } from 'rxjs';
import {
  SubscriptionPaymentFormDialog,
  SubscriptionPaymentFormDialogData,
} from './subscription-payment-form-dialog';
import { Subscriptions } from '../../../shared/services/subscription/subscription';

const en = { subscriptions: { saveError: 'Could not save the payment', addPaymentTitle: 'Subscription payment: {{name}}' } };

function today(): Date {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  return date;
}

function iso(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

// SPEC-organizations-admin.md, task T19.
describe('SubscriptionPaymentFormDialog', () => {
  let fixture: ComponentFixture<SubscriptionPaymentFormDialog>;
  let component: SubscriptionPaymentFormDialog;
  let addPayment: ReturnType<typeof vi.fn>;
  let close: ReturnType<typeof vi.fn>;
  const data: SubscriptionPaymentFormDialogData = { organizationId: 4, organizationName: 'Academy' };

  beforeEach(async () => {
    addPayment = vi.fn();
    close = vi.fn();
    await TestBed.configureTestingModule({
      imports: [
        SubscriptionPaymentFormDialog,
        TranslocoTestingModule.forRoot({
          langs: { en },
          preloadLangs: true,
          translocoConfig: { availableLangs: ['en'], defaultLang: 'en' },
        }),
      ],
      providers: [
        provideNativeDateAdapter(),
        { provide: MAT_DIALOG_DATA, useValue: data },
        { provide: MatDialogRef, useValue: { close } },
        { provide: Subscriptions, useValue: { addPayment } },
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(SubscriptionPaymentFormDialog);
    component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();
  });

  const form = () => component['paymentForm'];

  it('opens with today as the payment date (Q4) and an empty amount', () => {
    expect(iso(component['model']().paymentDate!)).toBe(iso(today()));
    expect(component['model']().amount).toBeNull();
    expect(fixture.nativeElement.textContent).toContain('Academy');
  });

  it('requires a positive amount', () => {
    expect(form().amount().errors().map((e) => e.kind)).toContain('required');

    component['model'].update((m) => ({ ...m, amount: 0 }));
    expect(form().amount().errors().map((e) => e.kind)).toContain('min');

    component['model'].update((m) => ({ ...m, amount: 120 }));
    expect(form()().valid()).toBe(true);
  });

  it('requires a date that is not in the future', () => {
    const tomorrow = today();
    tomorrow.setDate(tomorrow.getDate() + 1);
    component['model'].set({ amount: 120, paymentDate: tomorrow, description: '' });
    expect(form().paymentDate().errors().map((e) => e.kind)).toContain('future');

    component['model'].set({ amount: 120, paymentDate: null, description: '' });
    expect(form().paymentDate().errors().map((e) => e.kind)).toContain('required');
  });

  it('posts the payment and closes with the overlap flag', async () => {
    addPayment.mockReturnValue(of({ payment: { id: 1 }, overlaps: true }));
    component['model'].set({ amount: 120, paymentDate: new Date(2026, 0, 10), description: '  Yearly ' });

    await component['save']();

    expect(addPayment).toHaveBeenCalledWith(4, { paymentDate: '2026-01-10', amount: 120, description: 'Yearly' });
    expect(close).toHaveBeenCalledWith({ saved: true, overlaps: true });
  });

  it('leaves out an empty description', async () => {
    addPayment.mockReturnValue(of({ payment: { id: 1 }, overlaps: false }));
    component['model'].set({ amount: 50, paymentDate: new Date(2026, 0, 10), description: ' ' });

    await component['save']();

    expect(addPayment).toHaveBeenCalledWith(4, { paymentDate: '2026-01-10', amount: 50 });
  });

  it('stays open with a message when saving fails', async () => {
    addPayment.mockReturnValue(throwError(() => new HttpErrorResponse({ status: 500 })));
    component['model'].set({ amount: 50, paymentDate: new Date(2026, 0, 10), description: '' });

    await component['save']();

    expect(close).not.toHaveBeenCalled();
    expect(component['failureMessage']()).toBe('Could not save the payment');
  });
});
