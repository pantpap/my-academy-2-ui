import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideNativeDateAdapter } from '@angular/material/core';
import { MatDialog } from '@angular/material/dialog';
import { TranslocoTestingModule } from '@jsverse/transloco';
import { of } from 'rxjs';

import { CustomerDetails } from './customer-details';
import { CustomerFormDialog } from '../customer-form-dialog/customer-form-dialog';
import { Customer as CustomerModel } from '../../../common/interfaces/customer';

const en = {
  common: {
    loading: 'Loading...',
    error: 'An error occurred. Please try again later.',
    save: 'Save',
  },
  customerDetails: {
    createTitle: 'New Customer',
    editTitle: 'Edit Customer',
    firstNameLabel: 'First Name',
    firstNameRequired: 'First name is required',
    lastNameLabel: 'Last Name',
    lastNameRequired: 'Last name is required',
    birthDateLabel: 'Date of Birth',
    birthDateRequired: 'Date of birth is required',
    genderLabel: 'Gender',
    genderRequired: 'Gender is required',
    phoneLabel: 'Phone',
    phoneRequired: 'Phone number is required',
    phoneInvalid: 'Please enter a valid phone number',
    createSuccess: 'Customer created successfully.',
    updateSuccess: 'Customer updated successfully.',
    saveError: 'Something went wrong while saving. Please try again.',
    editButton: 'Edit',
  },
};

const existingCustomer: CustomerModel = {
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

describe('CustomerDetails', () => {
  let component: CustomerDetails;
  let fixture: ComponentFixture<CustomerDetails>;
  let dialogOpenSpy: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    localStorage.setItem('CS_ACADEMY_ORGANIZATION', JSON.stringify({ id: 1 }));

    dialogOpenSpy = vi.fn().mockReturnValue({ afterClosed: () => of(undefined) });

    await TestBed.configureTestingModule({
      imports: [
        CustomerDetails,
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
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: MatDialog, useValue: { open: dialogOpenSpy } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(CustomerDetails);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  afterEach(() => {
    localStorage.removeItem('CS_ACADEMY_ORGANIZATION');
    TestBed.inject(HttpTestingController).verify();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should default to create mode when no id is bound', () => {
    expect(component['isEditMode']()).toBe(false);
  });

  it('should open the edit dialog with the loaded customer when the edit button is clicked', async () => {
    fixture.componentRef.setInput('id', '1');
    fixture.detectChanges();

    const req = TestBed.inject(HttpTestingController).expectOne('http://localhost:3000/athletes/1');
    req.flush(existingCustomer);
    await fixture.whenStable();

    component['openEditDialog']();

    expect(dialogOpenSpy).toHaveBeenCalledWith(CustomerFormDialog, {
      data: { customer: existingCustomer },
    });
  });

  it('should not render the edit button while the customer is still loading', () => {
    fixture.componentRef.setInput('id', '1');
    fixture.detectChanges();

    const editButton: HTMLButtonElement | null = fixture.nativeElement.querySelector('button[type="button"]');
    expect(editButton).toBeNull();

    TestBed.inject(HttpTestingController).expectOne('http://localhost:3000/athletes/1').flush(existingCustomer);
  });

  it('reloads the customer details after a successful edit', async () => {
    fixture.componentRef.setInput('id', '1');
    fixture.detectChanges();

    const httpMock = TestBed.inject(HttpTestingController);
    httpMock.expectOne('http://localhost:3000/athletes/1').flush(existingCustomer);
    await fixture.whenStable();

    const updatedCustomer: CustomerModel = { ...existingCustomer, phone: '+30 6900000000' };
    dialogOpenSpy.mockReturnValue({ afterClosed: () => of(updatedCustomer) });

    component['openEditDialog']();
    fixture.detectChanges();

    httpMock.expectOne('http://localhost:3000/athletes/1').flush(updatedCustomer);
    await fixture.whenStable();
    fixture.detectChanges();

    expect(component['customerDetailsResource'].value()?.phone).toBe('+30 6900000000');
  });

  it('does not reload the customer details when the dialog is cancelled', async () => {
    fixture.componentRef.setInput('id', '1');
    fixture.detectChanges();

    const httpMock = TestBed.inject(HttpTestingController);
    httpMock.expectOne('http://localhost:3000/athletes/1').flush(existingCustomer);
    await fixture.whenStable();

    dialogOpenSpy.mockReturnValue({ afterClosed: () => of(undefined) });

    component['openEditDialog']();
    await fixture.whenStable();

    httpMock.expectNone('http://localhost:3000/athletes/1');
  });
});
