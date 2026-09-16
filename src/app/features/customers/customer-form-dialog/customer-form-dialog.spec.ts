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
    registrationDateLabel: 'Registration Date',
    registrationDateRequired: 'Registration date is required',
    activeLabel: 'Active',
    inactiveSince: 'Inactive since {{date}}',
    startDateLabel: 'Start Date',
    endDateLabel: 'End Date',
    leavingLabel: 'Leaving',
    deletePeriod: 'Delete this period',
    historyTitle: 'Sport history',
    startBeforeRegistration: 'Start date cannot be before the registration date',
    endBeforeStart: 'End date must be after the start date',
    endDateRequired: 'End date is required',
    overlappingPeriods: 'This overlaps with another period for the same sport',
    sportsLabel: 'Sports',
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
  registrationDate: '2026-01-01',
  active: true,
  inactiveSince: null,
  enrollments: [],
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

function todayAtMidnight(): Date {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  return date;
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

    it('shows the registration date as read-only text, not an input', async () => {
      const fixture = await createFixture({ customer: existingCustomer });
      expect(fixture.nativeElement.textContent).toContain('2026-01-01');
    });

    it('shows paidUntil as read-only text, not an input', async () => {
      const fixture = await createFixture({ customer: existingCustomer });
      expect(fixture.nativeElement.textContent).toContain('2026-12-31');
    });

    it('shows the "not paid" fallback when paidUntil is null', async () => {
      const fixture = await createFixture({ customer: { ...existingCustomer, paidUntil: null } });
      expect(fixture.nativeElement.textContent).toContain('Not paid');
    });
  });

  describe('registration date (create mode)', () => {
    it('defaults to today', async () => {
      const fixture = await createFixture({});
      const registrationDate = fixture.componentInstance['model']().registrationDate;
      expect(registrationDate?.getTime()).toBe(todayAtMidnight().getTime());
    });

    it('disables save when cleared', async () => {
      const fixture = await createFixture({});
      fixture.componentInstance['onRegistrationDateChange'](null);
      fixture.detectChanges();

      expect(fixture.componentInstance['saveDisabled']()).toBe(true);
    });
  });

  describe('active toggle', () => {
    it('defaults to active in create mode and is included in the payload', async () => {
      const createCustomer = vi.fn(() => of(existingCustomer));
      const fixture = await createFixture({}, { createCustomer });

      fixture.componentInstance['model'].update((m) => ({
        ...m,
        firstName: 'Alex',
        lastName: 'Smith',
        birthDate: new Date('1990-05-05'),
        gender: 'male',
        phone: '+30 6911111111',
      }));

      await submit(fixture.componentInstance['customerForm']);

      expect(createCustomer).toHaveBeenCalledWith(expect.objectContaining({ active: true }));
    });

    it('sends active: false when toggled off', async () => {
      const updateCustomer = vi.fn(() => of(existingCustomer));
      const fixture = await createFixture({ customer: existingCustomer }, { updateCustomer });

      fixture.componentInstance['onActiveChange'](false);
      await submit(fixture.componentInstance['customerForm']);

      expect(updateCustomer).toHaveBeenCalledWith(1, expect.objectContaining({ active: false }));
    });

    it('shows "Inactive since …" when the athlete is inactive', async () => {
      const fixture = await createFixture({
        customer: { ...existingCustomer, active: false, inactiveSince: '2027-02-01' },
      });
      fixture.detectChanges();

      expect(fixture.nativeElement.textContent).toContain('Inactive since 2027-02-01');
    });
  });

  describe('sport enrollment — create mode', () => {
    it('starts with no enrollment rows', async () => {
      const fixture = await createFixture({});
      expect(fixture.componentInstance['activePeriods']()).toEqual([]);
    });

    it('selecting two sports creates two rows starting on the registration date', async () => {
      const fixture = await createFixture({});
      const registrationDate = fixture.componentInstance['model']().registrationDate;

      fixture.componentInstance['onSportIdsChange']({ value: [1, 2] } as any);

      const rows = fixture.componentInstance['activePeriods']();
      expect(rows.map((r) => r.sportId).sort()).toEqual([1, 2]);
      expect(rows.every((r) => r.startDate?.getTime() === registrationDate?.getTime())).toBe(true);
    });

    it('rows the user has not touched follow a changed registration date', async () => {
      const fixture = await createFixture({});
      fixture.componentInstance['onSportIdsChange']({ value: [1] } as any);

      const newDate = new Date('2026-10-01');
      fixture.componentInstance['onRegistrationDateChange'](newDate);
      fixture.detectChanges();

      expect(fixture.componentInstance['activePeriods']()[0].startDate?.getTime()).toBe(newDate.getTime());
    });

    it('includes sportId and startDate (no id) in the create payload', async () => {
      const createCustomer = vi.fn(() => of(existingCustomer));
      const fixture = await createFixture({}, { createCustomer });

      fixture.componentInstance['model'].update((m) => ({
        ...m,
        firstName: 'Alex',
        lastName: 'Smith',
        birthDate: new Date('1990-05-05'),
        gender: 'male',
        phone: '+30 6911111111',
      }));
      fixture.componentInstance['onSportIdsChange']({ value: [1] } as any);

      await submit(fixture.componentInstance['customerForm']);

      expect(createCustomer).toHaveBeenCalledWith(
        expect.objectContaining({
          enrollments: [expect.objectContaining({ sportId: 1, startDate: expect.any(String) })],
        }),
      );
      const payload = (createCustomer.mock.calls[0] as any[])[0];
      expect(payload.enrollments[0].id).toBeUndefined();
    });

    it('does not send registrationDate on update', async () => {
      const updateCustomer = vi.fn(() => of(existingCustomer));
      const fixture = await createFixture({ customer: existingCustomer }, { updateCustomer });

      await submit(fixture.componentInstance['customerForm']);

      const payload = (updateCustomer.mock.calls[0] as any[])[1];
      expect(payload.registrationDate).toBeUndefined();
    });
  });

  describe('sport enrollment — edit mode', () => {
    const withFootball: Customer = {
      ...existingCustomer,
      enrollments: [
        { id: 10, sportId: 1, sportName: 'Football', startDate: '2026-01-01', endDate: null },
      ],
    };

    it('pre-populates the active period for an enrolled sport', async () => {
      const fixture = await createFixture({ customer: withFootball });
      const rows = fixture.componentInstance['activePeriods']();
      expect(rows).toEqual([
        expect.objectContaining({ id: 10, sportId: 1, sportName: 'Football' }),
      ]);
    });

    it('a newly added sport defaults its start date to today', async () => {
      const fixture = await createFixture({ customer: withFootball });

      fixture.componentInstance['onSportIdsChange']({ value: [1, 2] } as any);

      const newRow = fixture.componentInstance['activePeriods']().find((r) => r.sportId === 2)!;
      expect(newRow.startDate?.getTime()).toBe(todayAtMidnight().getTime());
      expect(newRow.id).toBeNull();
    });

    it('deselecting an existing period marks it "removing" and keeps the row', async () => {
      const fixture = await createFixture({ customer: withFootball });

      fixture.componentInstance['onSportIdsChange']({ value: [] } as any);

      const rows = fixture.componentInstance['activePeriods']();
      expect(rows).toHaveLength(1);
      expect(rows[0].removing).toBe(true);
    });

    it('re-selecting a removing sport cancels the removal', async () => {
      const fixture = await createFixture({ customer: withFootball });

      fixture.componentInstance['onSportIdsChange']({ value: [] } as any);
      fixture.componentInstance['onSportIdsChange']({ value: [1] } as any);

      const rows = fixture.componentInstance['activePeriods']();
      expect(rows).toHaveLength(1);
      expect(rows[0].removing).toBe(false);
    });

    it('deselecting an unsaved new row just removes it', async () => {
      const fixture = await createFixture({ customer: existingCustomer });

      fixture.componentInstance['onSportIdsChange']({ value: [1] } as any);
      fixture.componentInstance['onSportIdsChange']({ value: [] } as any);

      expect(fixture.componentInstance['activePeriods']()).toEqual([]);
    });

    it('requires an end date before a removing row can be saved', async () => {
      const fixture = await createFixture({ customer: withFootball });
      fixture.componentInstance['onSportIdsChange']({ value: [] } as any);
      fixture.detectChanges();

      expect(fixture.componentInstance['saveDisabled']()).toBe(true);

      const row = fixture.componentInstance['activePeriods']()[0];
      fixture.componentInstance['onActiveRowEndDateChange'](row, new Date('2027-01-20'));
      fixture.detectChanges();

      expect(fixture.componentInstance['saveDisabled']()).toBe(false);
    });

    it('sends the ended period as an update with id/startDate/endDate', async () => {
      const updateCustomer = vi.fn(() => of(existingCustomer));
      const fixture = await createFixture({ customer: withFootball }, { updateCustomer });

      fixture.componentInstance['onSportIdsChange']({ value: [] } as any);
      const row = fixture.componentInstance['activePeriods']()[0];
      fixture.componentInstance['onActiveRowEndDateChange'](row, new Date('2027-01-20'));

      await submit(fixture.componentInstance['customerForm']);

      expect(updateCustomer).toHaveBeenCalledWith(
        1,
        expect.objectContaining({
          enrollments: [{ id: 10, sportId: 1, startDate: '2026-01-01', endDate: '2027-01-20' }],
        }),
      );
    });

    it('a deletion button on an active row removes it from the payload entirely', async () => {
      const updateCustomer = vi.fn(() => of(existingCustomer));
      const fixture = await createFixture({ customer: withFootball }, { updateCustomer });

      const row = fixture.componentInstance['activePeriods']()[0];
      fixture.componentInstance['deleteActivePeriod'](row);

      await submit(fixture.componentInstance['customerForm']);

      expect(updateCustomer).toHaveBeenCalledWith(1, expect.objectContaining({ enrollments: [] }));
    });
  });

  describe('sport history (edit mode)', () => {
    const withHistory: Customer = {
      ...existingCustomer,
      enrollments: [
        { id: 10, sportId: 1, sportName: 'Football', startDate: '2026-01-01', endDate: null },
        { id: 11, sportId: 2, sportName: 'Basketball', startDate: '2025-09-01', endDate: '2025-12-31' },
      ],
    };

    it('lists only ended periods in the history, not the active one', async () => {
      const fixture = await createFixture({ customer: withHistory });
      const history = fixture.componentInstance['historyPeriods']();

      expect(history).toEqual([
        expect.objectContaining({ id: 11, sportId: 2, sportName: 'Basketball' }),
      ]);
    });

    it('does not render the history section when there is nothing ended', async () => {
      const fixture = await createFixture({ customer: existingCustomer });
      expect(fixture.nativeElement.textContent).not.toContain('Sport history');
    });

    it('renders the history section when a period has ended', async () => {
      const fixture = await createFixture({ customer: withHistory });
      fixture.detectChanges();
      expect(fixture.nativeElement.textContent).toContain('Sport history');
    });

    it('editing history dates updates the row', async () => {
      const fixture = await createFixture({ customer: withHistory });
      const row = fixture.componentInstance['historyPeriods']()[0];

      fixture.componentInstance['onHistoryRowEndDateChange'](row, new Date('2025-12-15'));

      expect(fixture.componentInstance['historyPeriods']()[0].endDate).toEqual(new Date('2025-12-15'));
    });

    it('deleting a history row removes it from the payload', async () => {
      const updateCustomer = vi.fn(() => of(existingCustomer));
      const fixture = await createFixture({ customer: withHistory }, { updateCustomer });

      const row = fixture.componentInstance['historyPeriods']()[0];
      fixture.componentInstance['deleteHistoryPeriod'](row);

      await submit(fixture.componentInstance['customerForm']);

      const payload = (updateCustomer.mock.calls[0] as any[])[1];
      expect(payload.enrollments.find((e: any) => e.id === 11)).toBeUndefined();
    });
  });

  describe('enrollment validation', () => {
    it('flags a start date before the registration date and disables save', async () => {
      const fixture = await createFixture({});
      fixture.componentInstance['onSportIdsChange']({ value: [1] } as any);
      const row = fixture.componentInstance['activePeriods']()[0];

      fixture.componentInstance['onActiveRowStartDateChange'](row, new Date('2020-01-01'));
      fixture.detectChanges();

      expect(fixture.componentInstance['saveDisabled']()).toBe(true);
    });

    it('flags an end date at or before the start date', async () => {
      const withFootball: Customer = {
        ...existingCustomer,
        enrollments: [
          { id: 10, sportId: 1, sportName: 'Football', startDate: '2026-09-01', endDate: null },
        ],
      };
      const fixture = await createFixture({ customer: withFootball });

      fixture.componentInstance['onSportIdsChange']({ value: [] } as any);
      const row = fixture.componentInstance['activePeriods']()[0];
      fixture.componentInstance['onActiveRowEndDateChange'](row, new Date('2026-09-01'));
      fixture.detectChanges();

      expect(fixture.componentInstance['saveDisabled']()).toBe(true);
    });

    it('flags overlapping periods for the same sport', async () => {
      const withHistory: Customer = {
        ...existingCustomer,
        enrollments: [
          { id: 10, sportId: 1, sportName: 'Football', startDate: '2026-09-01', endDate: null },
          { id: 11, sportId: 1, sportName: 'Football', startDate: '2025-01-01', endDate: '2025-06-01' },
        ],
      };
      const fixture = await createFixture({ customer: withHistory });

      // Move the history period so it overlaps the active one.
      const historyRow = fixture.componentInstance['historyPeriods']()[0];
      fixture.componentInstance['onHistoryRowEndDateChange'](historyRow, new Date('2026-10-01'));
      fixture.detectChanges();

      expect(fixture.componentInstance['saveDisabled']()).toBe(true);
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
      registrationDate: '2026-09-16',
      active: true,
      inactiveSince: null,
      enrollments: [],
    };

    it('shows all inputs empty and no paidUntil line', async () => {
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

      fixture.componentInstance['model'].update((m) => ({
        ...m,
        firstName: 'Alex',
        lastName: 'Smith',
        birthDate: new Date('1990-05-05'),
        gender: 'male',
        phone: '+30 6911111111',
        street: 'Second Ave 2',
        city: 'Patras',
        postalCode: '22222',
        country: 'Greece',
      }));

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

      fixture.componentInstance['model'].update((m) => ({
        ...m,
        firstName: 'Alex',
        lastName: 'Smith',
        birthDate: new Date('1990-05-05'),
        gender: 'male',
        phone: '+30 6911111111',
        street: '',
        city: '',
        postalCode: '',
        country: '',
      }));

      await submit(fixture.componentInstance['customerForm']);
      fixture.detectChanges();

      expect(close).not.toHaveBeenCalled();
      expect(fixture.componentInstance['saveError']()).toBe(true);
      expect(fixture.nativeElement.textContent).toContain('Something went wrong while saving. Please try again.');
    });
  });
});
