import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideNativeDateAdapter } from '@angular/material/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { submit } from '@angular/forms/signals';
import { TranslocoTestingModule } from '@jsverse/transloco';
import { of, throwError } from 'rxjs';

import { CustomerFormDialog, CustomerFormDialogData } from './customer-form-dialog';
import { Customer } from '../../../common/interfaces/customer';
import { Customer as CustomerService } from '../../../shared/services/customer/customer';
import { Sport } from '../../../common/interfaces/sport';
import { Sports as SportsService } from '../../../shared/services/sports/sports';

const availableSports: Sport[] = [
  { id: 1, name: 'Football' },
  { id: 2, name: 'Basketball' },
];

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
    streetLabel: 'Street',
    cityLabel: 'City',
    postalCodeLabel: 'Postal Code',
    countryLabel: 'Country',
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
  street: 'Main St 1',
  city: 'Athens',
  postalCode: '11111',
  country: 'Greece',
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
    getSports?: ReturnType<typeof vi.fn>;
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
      {
        provide: SportsService,
        useValue: { getSports: options?.getSports ?? vi.fn(() => of(availableSports)) },
      },
    ],
  }).compileComponents();

  const fixture = TestBed.createComponent(CustomerFormDialog);
  fixture.detectChanges();
  await fixture.whenStable();
  return fixture;
}

// Angular disallows a plain `name` attribute on elements bound via [formField] (NG8022), so
// fields are located by their fixed rendered order instead: firstName, lastName, birthDate,
// gender, phone (matches the "renders exactly five form fields" ordering below).
const FIELD_ORDER = [
  'firstName',
  'lastName',
  'birthDate',
  'gender',
  'phone',
  'street',
  'city',
  'postalCode',
  'country',
] as const;

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

  it('should render exactly ten form fields (five profile + four address + sports)', async () => {
    const fixture = await createFixture({});
    const fields = fixture.nativeElement.querySelectorAll('mat-form-field');
    expect(fields.length).toBe(10);
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

    it('populates street, city, postalCode, and country from the passed-in customer', async () => {
      const fixture = await createFixture({ customer: existingCustomer });
      expect(inputByName(fixture, 'street').value).toBe('Main St 1');
      expect(inputByName(fixture, 'city').value).toBe('Athens');
      expect(inputByName(fixture, 'postalCode').value).toBe('11111');
      expect(inputByName(fixture, 'country').value).toBe('Greece');
    });

    it('shows address fields empty when the customer has no address data', async () => {
      const customerWithoutAddress: Customer = {
        ...existingCustomer,
        street: undefined,
        city: undefined,
        postalCode: undefined,
        country: undefined,
      };
      const fixture = await createFixture({ customer: customerWithoutAddress });
      expect(inputByName(fixture, 'street').value).toBe('');
      expect(inputByName(fixture, 'city').value).toBe('');
      expect(inputByName(fixture, 'postalCode').value).toBe('');
      expect(inputByName(fixture, 'country').value).toBe('');
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

  describe('sports assignment', () => {
    it('lists the organization\'s available sports fetched from SportsService', async () => {
      // mat-select renders its mat-options into a CDK overlay only once the panel is opened,
      // so this asserts against the resource data the template iterates over rather than
      // querying rendered DOM (which would require driving the overlay open in jsdom).
      const fixture = await createFixture({});
      expect(fixture.componentInstance['sportsResource'].value()).toEqual(availableSports);
    });

    it('pre-selects the customer\'s current sports in edit mode', async () => {
      const customerWithSports: Customer = {
        ...existingCustomer,
        sports: [{ id: 1, name: 'Football' }],
        sportNames: ['Football'],
      };
      const fixture = await createFixture({ customer: customerWithSports });

      expect(fixture.componentInstance['model']().sportIds).toEqual([1]);
      expect(fixture.nativeElement.textContent).toContain('Football');
    });

    it('starts with no sports selected in create mode', async () => {
      const fixture = await createFixture({});
      expect(fixture.componentInstance['model']().sportIds).toEqual([]);
    });

    it('includes sportIds in the payload when saving', async () => {
      const updateCustomer = vi.fn(() => of(existingCustomer));
      const fixture = await createFixture({ customer: existingCustomer }, { updateCustomer });

      fixture.componentInstance['model'].update((m) => ({ ...m, sportIds: [2] }));

      await submit(fixture.componentInstance['customerForm']);

      expect(updateCustomer).toHaveBeenCalledWith(1, expect.objectContaining({ sportIds: [2] }));
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

    it('includes the address fields in the payload when saving', async () => {
      const updateCustomer = vi.fn(() => of(existingCustomer));
      const fixture = await createFixture({ customer: existingCustomer }, { updateCustomer });

      fixture.componentInstance['model'].update((m) => ({ ...m, city: 'Thessaloniki' }));

      await submit(fixture.componentInstance['customerForm']);

      expect(updateCustomer).toHaveBeenCalledWith(
        1,
        expect.objectContaining({
          street: 'Main St 1',
          city: 'Thessaloniki',
          postalCode: '11111',
          country: 'Greece',
        }),
      );
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
      expect(inputByName(fixture, 'street').value).toBe('');
      expect(inputByName(fixture, 'city').value).toBe('');
      expect(inputByName(fixture, 'postalCode').value).toBe('');
      expect(inputByName(fixture, 'country').value).toBe('');
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
        street: 'Second Ave 2',
        city: 'Patras',
        postalCode: '22222',
        country: 'Greece',
        sportIds: [],
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
          street: 'Second Ave 2',
          city: 'Patras',
          postalCode: '22222',
          country: 'Greece',
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
        street: '',
        city: '',
        postalCode: '',
        country: '',
        sportIds: [],
      });

      await submit(fixture.componentInstance['customerForm']);
      fixture.detectChanges();

      expect(close).not.toHaveBeenCalled();
      expect(fixture.componentInstance['saveError']()).toBe(true);
      expect(fixture.nativeElement.textContent).toContain('Something went wrong while saving. Please try again.');
    });
  });
});
