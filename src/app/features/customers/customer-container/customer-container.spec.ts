import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialog } from '@angular/material/dialog';
import { TranslocoTestingModule } from '@jsverse/transloco';

import { CustomerContainer } from './customer-container';
import { CustomerFormDialog } from '../customer-form-dialog/customer-form-dialog';

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

    dialogOpenSpy = vi.fn();

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
    expect(dialogOpenSpy).toHaveBeenCalledWith(CustomerFormDialog);
  });
});
