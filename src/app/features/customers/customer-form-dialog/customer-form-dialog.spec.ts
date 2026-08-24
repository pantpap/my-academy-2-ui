import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideNativeDateAdapter } from '@angular/material/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { TranslocoTestingModule } from '@jsverse/transloco';

import { CustomerFormDialog, CustomerFormDialogData } from './customer-form-dialog';
import { Customer } from '../../../common/interfaces/customer';

const en = {
  common: {
    save: 'Save',
    cancel: 'Cancel',
  },
  customerDetails: {
    createTitle: 'New Customer',
    editTitle: 'Edit Customer',
    firstNameLabel: 'First Name',
    lastNameLabel: 'Last Name',
    birthDateLabel: 'Date of Birth',
    genderLabel: 'Gender',
    phoneLabel: 'Phone',
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
  paidUntil: null,
};

async function createFixture(data: CustomerFormDialogData): Promise<ComponentFixture<CustomerFormDialog>> {
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
      { provide: MatDialogRef, useValue: { close: (): void => undefined } },
    ],
  }).compileComponents();

  const fixture = TestBed.createComponent(CustomerFormDialog);
  fixture.detectChanges();
  return fixture;
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
});
