import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TranslocoTestingModule } from '@jsverse/transloco';
import { of } from 'rxjs';

import { PaymentsContainer } from './payments-container';
import { Payments as PaymentsService } from '../../../shared/services/payment/payment';
import { RosterYearEntry } from '../../../common/interfaces/payment';

const en = {
  common: {
    loading: 'Loading...',
    error: 'An error occurred. Please try again later.',
  },
  payments: {
    title: 'Payments',
    yearLabel: 'Year',
    athleteCount: 'Athletes loaded',
  },
};

describe('PaymentsContainer', () => {
  let component: PaymentsContainer;
  let fixture: ComponentFixture<PaymentsContainer>;
  let getRosterYearSpy: ReturnType<typeof vi.fn>;

  const roster: RosterYearEntry[] = [{ athleteId: 1, firstName: 'A', lastName: 'B', months: [] }];
  const currentYear = new Date().getFullYear();

  beforeEach(async () => {
    getRosterYearSpy = vi.fn().mockReturnValue(of(roster));

    await TestBed.configureTestingModule({
      imports: [
        PaymentsContainer,
        TranslocoTestingModule.forRoot({
          langs: { en },
          translocoConfig: {
            availableLangs: ['en', 'el'],
            defaultLang: 'en',
          },
        }),
      ],
      providers: [{ provide: PaymentsService, useValue: { getRosterYear: getRosterYearSpy } }],
    }).compileComponents();

    fixture = TestBed.createComponent(PaymentsContainer);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('defaults the selected year to the current year', () => {
    expect(component.selectedYear()).toBe(currentYear);
  });

  it('requests roster-year for the selected year on init', () => {
    expect(getRosterYearSpy).toHaveBeenCalledWith(currentYear);
  });

  it('changing the year issues a new request with the new year', async () => {
    const nextYear = currentYear - 1;

    component.onYearChange(nextYear);
    await fixture.whenStable();

    expect(component.selectedYear()).toBe(nextYear);
    expect(getRosterYearSpy).toHaveBeenCalledWith(nextYear);
  });

  it('offers a selectable range of years around the current year', () => {
    expect(component.years).toContain(currentYear);
    expect(component.years).toContain(currentYear - 2);
    expect(component.years).toContain(currentYear + 2);
    expect(component.years).not.toContain(currentYear - 3);
    expect(component.years).not.toContain(currentYear + 3);
  });
});
