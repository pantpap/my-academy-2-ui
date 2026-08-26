import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialog } from '@angular/material/dialog';
import { TranslocoTestingModule } from '@jsverse/transloco';
import { of } from 'rxjs';

import { CustomerContainer } from './customer-container';
import { CustomerFormDialog } from '../customer-form-dialog/customer-form-dialog';
import { Customer as CustomerModel } from '../../../common/interfaces/customer';

const createdCustomer: CustomerModel = {
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

const en = {
  common: {
    add: 'Add',
  },
};

describe('CustomerContainer', () => {
  let component: CustomerContainer;
  let fixture: ComponentFixture<CustomerContainer>;
  let dialogOpenSpy: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    localStorage.setItem('CS_ACADEMY_ORGANIZATION', JSON.stringify({ id: 1 }));

    dialogOpenSpy = vi.fn().mockReturnValue({ afterClosed: () => of(undefined) });

    await TestBed.configureTestingModule({
      imports: [
        CustomerContainer,
        TranslocoTestingModule.forRoot({
          langs: { en },
          translocoConfig: {
            availableLangs: ['en', 'el'],
            defaultLang: 'en',
          },
        }),
      ],
      providers: [{ provide: MatDialog, useValue: { open: dialogOpenSpy } }],
    }).compileComponents();

    fixture = TestBed.createComponent(CustomerContainer);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  afterEach(() => {
    localStorage.removeItem('CS_ACADEMY_ORGANIZATION');
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should open the CustomerFormDialog with no data when adding a new customer', () => {
    component.addNewCustomer();
    expect(dialogOpenSpy).toHaveBeenCalledWith(CustomerFormDialog, { width: '800px', height: '500px' });
  });

  it('reloads the customer list after creating a customer', () => {
    const reloadSpy = vi.spyOn(component.dataSourceResource, 'reload').mockReturnValue(true);
    dialogOpenSpy.mockReturnValue({ afterClosed: () => of(createdCustomer) });

    component.addNewCustomer();

    expect(reloadSpy).toHaveBeenCalled();
  });

  it('does not reload the customer list when the dialog is cancelled', () => {
    const reloadSpy = vi.spyOn(component.dataSourceResource, 'reload').mockReturnValue(true);
    dialogOpenSpy.mockReturnValue({ afterClosed: () => of(undefined) });

    component.addNewCustomer();

    expect(reloadSpy).not.toHaveBeenCalled();
  });
});
