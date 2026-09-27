import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute, provideRouter, Router, withComponentInputBinding } from '@angular/router';
import { By } from '@angular/platform-browser';
import { PageEvent } from '@angular/material/paginator';
import { RouterTestingHarness } from '@angular/router/testing';
import { TranslocoTestingModule } from '@jsverse/transloco';
import { of } from 'rxjs';

import { CustomerContainer } from './customer-container';
import { CustomerFormDialog } from '../customer-form-dialog/customer-form-dialog';
import { CustomerList } from '../customer-list/customer-list';
import { Customer as CustomerModel, CustomersPagedResponse } from '../../../common/interfaces/customer';
import { Customer } from '../../../shared/services/customer/customer';
import { Payments } from '../../../shared/services/payment/payment';

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
  registrationDate: '2026-01-01',
  active: true,
  inactiveSince: null,
  enrollments: [],
};

const emptyPage: CustomersPagedResponse = {
  data: [],
  meta: { page: 1, take: 10, itemCount: 0, pageCount: 0, hasPreviousPage: false, hasNextPage: false },
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
  let getCustomersSpy: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    localStorage.setItem('CS_ACADEMY_ORGANIZATION', JSON.stringify({ id: 1 }));

    dialogOpenSpy = vi.fn().mockReturnValue({ afterClosed: () => of(undefined) });
    getCustomersSpy = vi.fn().mockReturnValue(of(emptyPage));

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
      providers: [
        provideRouter([{ path: 'customers', component: CustomerContainer }], withComponentInputBinding()),
        { provide: MatDialog, useValue: { open: dialogOpenSpy } },
        { provide: Customer, useValue: { getCustomers: getCustomersSpy } },
        { provide: Payments, useValue: { getRosterStatus: vi.fn().mockReturnValue(of([])) } },
      ],
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

  describe('page/take query params', () => {
    async function setParams(page?: string, take?: string) {
      getCustomersSpy.mockClear();
      fixture.componentRef.setInput('page', page);
      fixture.componentRef.setInput('take', take);
      await fixture.whenStable();
    }

    it('fetches page 1 with 10 items when there are no query params', () => {
      expect(getCustomersSpy).toHaveBeenLastCalledWith(1, 10);
    });

    it('fetches the requested page and size', async () => {
      await setParams('3', '25');
      expect(getCustomersSpy).toHaveBeenLastCalledWith(3, 25);
    });

    it('falls back to 1/10 for non-numeric page and unsupported take', async () => {
      await setParams('3', '25');
      await setParams('abc', '7');
      expect(getCustomersSpy).toHaveBeenLastCalledWith(1, 10);
    });

    it.each(['-1', '0', '2.5'])('falls back to page 1 for page=%s', async (page) => {
      await setParams('3', '50');
      await setParams(page, '50');
      expect(getCustomersSpy).toHaveBeenLastCalledWith(1, 50);
    });

    it('binds page/take from the URL query params', async () => {
      getCustomersSpy.mockClear();
      const harness = await RouterTestingHarness.create();
      await harness.navigateByUrl('/customers?page=2&take=50', CustomerContainer);
      await harness.fixture.whenStable();
      expect(getCustomersSpy).toHaveBeenLastCalledWith(2, 50);
    });
  });

  describe('page changes', () => {
    it('navigates to the new page/take with replaceUrl when the list pages', () => {
      const navigateSpy = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
      const event: PageEvent = { pageIndex: 2, previousPageIndex: 1, pageSize: 25, length: 100 };

      fixture.debugElement.query(By.directive(CustomerList)).triggerEventHandler('pageChange', event);

      expect(navigateSpy).toHaveBeenCalledWith([], {
        relativeTo: TestBed.inject(ActivatedRoute),
        queryParams: { page: 3, take: 25 },
        queryParamsHandling: 'merge',
        replaceUrl: true,
      });
    });

    it('reloads the same page/take after adding a customer', async () => {
      fixture.componentRef.setInput('page', '3');
      fixture.componentRef.setInput('take', '25');
      await fixture.whenStable();
      getCustomersSpy.mockClear();
      dialogOpenSpy.mockReturnValue({ afterClosed: () => of(createdCustomer) });

      component.addNewCustomer();
      await fixture.whenStable();

      expect(getCustomersSpy).toHaveBeenCalledTimes(1);
      expect(getCustomersSpy).toHaveBeenLastCalledWith(3, 25);
    });
  });
});
