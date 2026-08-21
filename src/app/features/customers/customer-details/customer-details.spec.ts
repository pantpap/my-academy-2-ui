import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideNativeDateAdapter } from '@angular/material/core';
import { TranslocoTestingModule } from '@jsverse/transloco';

import { CustomerDetails } from './customer-details';

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
  },
};

describe('CustomerDetails', () => {
  let component: CustomerDetails;
  let fixture: ComponentFixture<CustomerDetails>;

  beforeEach(async () => {
    localStorage.setItem('CS_ACADEMY_ORGANIZATION', JSON.stringify({ id: 1 }));

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
      providers: [provideNativeDateAdapter()],
    }).compileComponents();

    fixture = TestBed.createComponent(CustomerDetails);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  afterEach(() => {
    localStorage.removeItem('CS_ACADEMY_ORGANIZATION');
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should default to create mode when no id is bound', () => {
    expect(component['isEditMode']()).toBe(false);
  });

  it('should have an invalid form when required fields are empty', () => {
    expect(component['customerForm']().valid()).toBe(false);
  });

  it('should be valid once all required fields are filled', () => {
    component['model'].set({
      firstName: 'Jane',
      lastName: 'Doe',
      birthDate: new Date('2000-01-01'),
      gender: 'female',
      phone: '+30 6912345678',
    });
    expect(component['customerForm']().valid()).toBe(true);
  });
});
