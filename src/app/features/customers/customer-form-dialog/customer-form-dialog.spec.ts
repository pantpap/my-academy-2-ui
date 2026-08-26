import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideNativeDateAdapter } from '@angular/material/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { submit } from '@angular/forms/signals';
import { TranslocoTestingModule } from '@jsverse/transloco';
import { of, throwError } from 'rxjs';

import { CustomerFormDialog, CustomerFormDialogData } from './customer-form-dialog';
import { Customer } from '../../../common/interfaces/customer';
import { Customer as CustomerService } from '../../../shared/services/customer/customer';

const en = {
  common: {
    save: 'Save',
    cancel: 'Cancel',
  },
  customerDetails: {
    createTitle: 'New Customer',
    editTitle: 'Edit Customer',
    firstNameLabel: 'First Name',
    firstNameRequired: 'First name is required',
    lastNameLabel: 'Last Name',
    lastNameRequired: 'Last name is required',
    birthDateLabel: 'Date of Birth',
    genderLabel: 'Gender',
    phoneLabel: 'Phone',
    paidUntilLabel: 'Paid Until',
    notPaid: 'Not paid',
    saveError: 'Something went wrong while saving. Please try again.',
  },
};

const existingCustomer: Customer = {
  id: 1,
  firstName: 'Jane',
  lastName: 'Doe',
  birthDate: '2000-01-01',
  gender: 'female',
  phone: '+30 6912345678',
  sportNames: [],
  sports: [],
  paidUntil: '2026-12-31',
};

async function createFixture(
  data: CustomerFormDialogData,
  options?: {
    updateCustomer?: ReturnType<typeof vi.fn>;
    createCustomer?: ReturnType<typeof vi.fn>;
    close?: ReturnType<typeof vi.fn>;
  },
): Promise<ComponentFixture<CustomerFormDialog>> {
  await TestBed.configureTestingModule({
    imports: [
      CustomerFormDialog,
      TranslocoTestingModule.forRoot({
        langs: { en },
        translocoConfig: {
          availableLangs: ['en', 'el'],
          defaultLang: 'en',
        },
      }),
    ],
    providers: [
      provideNativeDateAdapter(),
      { provide: MAT_DIALOG_DATA, useValue: data },
      { provide: MatDialogRef, useValue: { close: options?.close ?? vi.fn() } },
      {
        provide: CustomerService,
        useValue: {
          updateCustomer: options?.updateCustomer ?? vi.fn(() => of(existingCustomer)),
          createCustomer: options?.createCustomer ?? vi.fn(() => of(existingCustomer)),
        },
      },
    ],
  }).compileComponents();

  const fixture = TestBed.createComponent(CustomerFormDialog);
  fixture.detectChanges();
  return fixture;
}

// Angular disallows a plain `name` attribute on elements bound via [formField] (NG8022), so
// fields are located by their fixed rendered order instead: firstName, lastName, birthDate,
// gender, phone (matches the "renders exactly five form fields" ordering below).
const FIELD_ORDER = ['firstName', 'lastName', 'birthDate', 'gender', 'phone'] as const;

function inputByName(
  fixture: ComponentFixture<CustomerFormDialog>,
  name: (typeof FIELD_ORDER)[number],
): HTMLInputElement {
  const inputs = fixture.nativeElement.querySelectorAll('mat-form-field input') as NodeListOf<HTMLInputElement>;
  return inputs[FIELD_ORDER.indexOf(name)];
}

describe('CustomerFormDialog', () => {
  it('should create in create mode when no customer is provided', async () => {
    const fixture = await createFixture({});
    expect(fixture.componentInstance).toBeTruthy();
    expect(fixture.componentInstance['isEditMode']).toBe(false);
  });

  it('should switch to edit mode when a customer is provided', async () => {
    const fixture = await createFixture({ customer: existingCustomer });
    expect(fixture.componentInstance['isEditMode']).toBe(true);
  });

  it('should show the create title when no customer is provided', async () => {
    const fixture = await createFixture({});
    const title = fixture.nativeElement.querySelector('[mat-dialog-title]');
    expect(title?.textContent?.trim()).toBe('New Customer');
  });

  it('should show the edit title when a customer is provided', async () => {
    const fixture = await createFixture({ customer: existingCustomer });
    const title = fixture.nativeElement.querySelector('[mat-dialog-title]');
    expect(title?.textContent?.trim()).toBe('Edit Customer');
  });

  it('should render exactly five form fields', async () => {
    const fixture = await createFixture({});
    const fields = fixture.nativeElement.querySelectorAll('mat-form-field');
    expect(fields.length).toBe(5);
  });

  it('should render cancel and save actions', async () => {
    const fixture = await createFixture({});
    const buttons: HTMLButtonElement[] = Array.from(
      fixture.nativeElement.querySelectorAll('mat-dialog-actions button'),
    );
    const labels = buttons.map((b) => b.textContent?.trim());
    expect(labels).toContain('Cancel');
    expect(labels).toContain('Save');
  });

  describe('edit mode population', () => {
    it('populates firstName, lastName, gender, and phone from the passed-in customer', async () => {
      const fixture = await createFixture({ customer: existingCustomer });
      expect(inputByName(fixture, 'firstName').value).toBe('Jane');
      expect(inputByName(fixture, 'lastName').value).toBe('Doe');
      expect(inputByName(fixture, 'gender').value).toBe('female');
      expect(inputByName(fixture, 'phone').value).toBe('+30 6912345678');
    });

    it('populates birthDate as a real Date from the passed-in customer', async () => {
      const fixture = await createFixture({ customer: existingCustomer });
      const birthDate = fixture.componentInstance['model']().birthDate;
      expect(birthDate).toBeInstanceOf(Date);
      expect(birthDate?.toISOString().slice(0, 10)).toBe('2000-01-01');
    });

    it('shows paidUntil as read-only text, not an input', async () => {
      const fixture = await createFixture({ customer: existingCustomer });
      expect(fixture.nativeElement.textContent).toContain('2026-12-31');
      expect(fixture.nativeElement.querySelector('input[name="paidUntil"]')).toBeNull();
    });

    it('shows the "not paid" fallback when paidUntil is null', async () => {
      const fixture = await createFixture({ customer: { ...existingCustomer, paidUntil: null } });
      expect(fixture.nativeElement.textContent).toContain('Not paid');
    });
  });

  describe('saving an edit', () => {
    it('calls updateCustomer with the customer id and the mapped payload, then closes with the result', async () => {
      const updateCustomer = vi.fn(() => of({ ...existingCustomer, phone: '+30 6999999999' }));
      const close = vi.fn();
      const fixture = await createFixture({ customer: existingCustomer }, { updateCustomer, close });

      fixture.componentInstance['model'].update((m) => ({ ...m, phone: '+30 6999999999' }));

      const result = await submit(fixture.componentInstance['customerForm']);

      expect(result).toBe(true);
      expect(updateCustomer).toHaveBeenCalledWith(
        1,
        expect.objectContaining({
          firstName: 'Jane',
          lastName: 'Doe',
          gender: 'female',
          phone: '+30 6999999999',
          birthDate: '2000-01-01',
        }),
      );
      expect(close).toHaveBeenCalledWith(expect.objectContaining({ phone: '+30 6999999999' }));
    });

    it('does not call updateCustomer or close when a required field is empty', async () => {
      const updateCustomer = vi.fn(() => of(existingCustomer));
      const close = vi.fn();
      const fixture = await createFixture({ customer: existingCustomer }, { updateCustomer, close });

      fixture.componentInstance['model'].update((m) => ({ ...m, firstName: '' }));

      const result = await submit(fixture.componentInstance['customerForm']);

      expect(result).toBe(false);
      expect(updateCustomer).not.toHaveBeenCalled();
      expect(close).not.toHaveBeenCalled();
      expect(
        fixture.componentInstance['customerForm'].firstName().errors().some((e) => e.kind === 'required'),
      ).toBe(true);
    });

    it('renders an inline required-field error after a failed submission', async () => {
      const fixture = await createFixture({ customer: existingCustomer });
      fixture.componentInstance['model'].update((m) => ({ ...m, firstName: '' }));

      await submit(fixture.componentInstance['customerForm']);
      fixture.detectChanges();

      expect(fixture.nativeElement.textContent).toContain('First name is required');
    });

    it('shows an inline error and does not close when updateCustomer fails', async () => {
      const updateCustomer = vi.fn(() => throwError(() => new Error('network error')));
      const close = vi.fn();
      const fixture = await createFixture({ customer: existingCustomer }, { updateCustomer, close });

      await submit(fixture.componentInstance['customerForm']);
      fixture.detectChanges();

      expect(close).not.toHaveBeenCalled();
      expect(fixture.componentInstance['saveError']()).toBe(true);
      expect(fixture.nativeElement.textContent).toContain('Something went wrong while saving. Please try again.');
    });
  });

  describe('create mode', () => {
    const newCustomer: Customer = {
      id: 5,
      firstName: 'Alex',
      lastName: 'Smith',
      birthDate: '1990-05-05',
      gender: 'male',
      phone: '+30 6911111111',
      sportNames: [],
      sports: [],
      paidUntil: null,
    };

    it('shows all five inputs empty and no paidUntil line', async () => {
      const fixture = await createFixture({});

      expect(inputByName(fixture, 'firstName').value).toBe('');
      expect(inputByName(fixture, 'lastName').value).toBe('');
      expect(inputByName(fixture, 'gender').value).toBe('');
      expect(inputByName(fixture, 'phone').value).toBe('');
      expect(fixture.componentInstance['model']().birthDate).toBeNull();
      expect(fixture.nativeElement.textContent).not.toContain('Paid Until');
    });

    it('calls createCustomer (not updateCustomer) with the mapped payload, then closes with the created customer', async () => {
      const createCustomer = vi.fn(() => of(newCustomer));
      const updateCustomer = vi.fn(() => of(existingCustomer));
      const close = vi.fn();
      const fixture = await createFixture({}, { createCustomer, updateCustomer, close });

      fixture.componentInstance['model'].set({
        firstName: 'Alex',
        lastName: 'Smith',
        birthDate: new Date('1990-05-05'),
        gender: 'male',
        phone: '+30 6911111111',
      });

      const result = await submit(fixture.componentInstance['customerForm']);

      expect(result).toBe(true);
      expect(createCustomer).toHaveBeenCalledWith(
        expect.objectContaining({
          firstName: 'Alex',
          lastName: 'Smith',
          gender: 'male',
          phone: '+30 6911111111',
          birthDate: '1990-05-05',
        }),
      );
      expect(updateCustomer).not.toHaveBeenCalled();
      expect(close).toHaveBeenCalledWith(newCustomer);
    });

    it('does not call createCustomer or close when a required field is empty', async () => {
      const createCustomer = vi.fn(() => of(newCustomer));
      const close = vi.fn();
      const fixture = await createFixture({}, { createCustomer, close });

      const result = await submit(fixture.componentInstance['customerForm']);

      expect(result).toBe(false);
      expect(createCustomer).not.toHaveBeenCalled();
      expect(close).not.toHaveBeenCalled();
    });

    it('shows an inline error and does not close when createCustomer fails', async () => {
      const createCustomer = vi.fn(() => throwError(() => new Error('network error')));
      const close = vi.fn();
      const fixture = await createFixture({}, { createCustomer, close });

      fixture.componentInstance['model'].set({
        firstName: 'Alex',
        lastName: 'Smith',
        birthDate: new Date('1990-05-05'),
        gender: 'male',
        phone: '+30 6911111111',
      });

      await submit(fixture.componentInstance['customerForm']);
      fixture.detectChanges();

      expect(close).not.toHaveBeenCalled();
      expect(fixture.componentInstance['saveError']()).toBe(true);
      expect(fixture.nativeElement.textContent).toContain('Something went wrong while saving. Please try again.');
    });
  });
});
