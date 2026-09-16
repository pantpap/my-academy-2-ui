import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { MatDialog } from '@angular/material/dialog';
import { TranslocoTestingModule } from '@jsverse/transloco';
import { of, throwError } from 'rxjs';

import { PaymentsContainer } from './payments-container';
import { Payments as PaymentsService } from '../../../shared/services/payment/payment';
import { RosterSeasonEntry, RosterSeasonMonth } from '../../../common/interfaces/payment';
import { PaymentFormDialog } from '../payment-form-dialog/payment-form-dialog';
import { PaymentDetailDialog } from '../payment-detail-dialog/payment-detail-dialog';
import { defaultSeasonStartYear, seasonLabel } from './season';

const en = {
  common: {
    loading: 'Loading...',
    error: 'An error occurred. Please try again later.',
    retry: 'Try again',
  },
  payments: {
    title: 'Payments',
    yearLabel: 'Season',
    athleteCount: 'Athletes loaded',
    athleteHeader: 'Athlete',
    summary: 'Paid',
    emptyRoster: 'No athletes are registered yet.',
    searchLabel: 'Search by name',
    noSearchResults: 'No athletes match your search.',
    stateLabels: {
      paid: 'Paid',
      partial: 'Partially paid',
      unpaid: 'Due',
      unavailable: 'Not available',
    },
    unpaidSportsTooltip: 'Not paid: {{sports}}',
    cellAriaLabel: '{{name}}, {{month}} {{year}}: {{state}}',
  },
};

const SEASON_MONTHS = [9, 10, 11, 12, 1, 2, 3, 4, 5, 6];

function blankMonth(month: number): RosterSeasonMonth {
  return {
    month,
    year: month >= 9 ? 2026 : 2027,
    status: 'unpaid',
    owedSports: [{ id: 1, name: 'Football' }],
    unpaidSports: [{ id: 1, name: 'Football' }],
    entries: [],
  };
}

describe('PaymentsContainer', () => {
  let component: PaymentsContainer;
  let fixture: ComponentFixture<PaymentsContainer>;
  let getRosterSeasonSpy: ReturnType<typeof vi.fn>;
  let dialogOpenSpy: ReturnType<typeof vi.fn>;

  const unpaidMonth: RosterSeasonMonth = blankMonth(11);
  const partialMonth: RosterSeasonMonth = {
    month: 3,
    year: 2027,
    status: 'partial',
    owedSports: [{ id: 1, name: 'Football' }, { id: 2, name: 'Basketball' }],
    unpaidSports: [{ id: 2, name: 'Basketball' }],
    entries: [
      {
        paymentId: 5,
        amount: 30,
        coveredMonthsCount: 1,
        paymentDate: '2027-03-05',
        notes: null,
        sports: [{ id: 1, name: 'Football' }],
      },
    ],
  };
  const paidMonth: RosterSeasonMonth = {
    month: 4,
    year: 2027,
    status: 'paid',
    owedSports: [{ id: 1, name: 'Football' }],
    unpaidSports: [],
    entries: [
      {
        paymentId: 12,
        amount: 30,
        coveredMonthsCount: 1,
        paymentDate: '2027-04-05',
        notes: null,
        sports: [{ id: 1, name: 'Football' }],
      },
    ],
  };
  const unavailableWithEntry: RosterSeasonMonth = {
    month: 5,
    year: 2027,
    status: 'unavailable',
    owedSports: [],
    unpaidSports: [],
    entries: [
      {
        paymentId: 20,
        amount: 30,
        coveredMonthsCount: 1,
        paymentDate: '2027-05-05',
        notes: null,
        sports: [{ id: 1, name: 'Football' }],
      },
    ],
  };

  const roster: RosterSeasonEntry[] = [
    {
      athleteId: 1,
      firstName: 'A',
      lastName: 'B',
      active: true,
      months: SEASON_MONTHS.map((month) => {
        if (month === unpaidMonth.month) return unpaidMonth;
        if (month === partialMonth.month) return partialMonth;
        if (month === paidMonth.month) return paidMonth;
        if (month === unavailableWithEntry.month) return unavailableWithEntry;
        return blankMonth(month);
      }),
    },
  ];
  const currentSeasonStartYear = defaultSeasonStartYear(new Date());

  async function createFixture() {
    dialogOpenSpy = vi.fn().mockReturnValue({ afterClosed: () => of(undefined) });

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
      providers: [
        { provide: PaymentsService, useValue: { getRosterSeason: getRosterSeasonSpy } },
        { provide: MatDialog, useValue: { open: dialogOpenSpy } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(PaymentsContainer);
    component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  }

  beforeEach(() => {
    getRosterSeasonSpy = vi.fn().mockReturnValue(of(roster));
  });

  it('should create', async () => {
    await createFixture();
    expect(component).toBeTruthy();
  });

  it('defaults the selected season to the season in progress (or upcoming, over summer)', async () => {
    await createFixture();
    expect(component.selectedSeasonStartYear()).toBe(currentSeasonStartYear);
  });

  it('requests roster-season for the selected season on init', async () => {
    await createFixture();
    expect(getRosterSeasonSpy).toHaveBeenCalledWith(currentSeasonStartYear);
  });

  it('changing the season issues a new request with the new startYear', async () => {
    await createFixture();
    const nextSeason = currentSeasonStartYear - 1;

    component.onSeasonChange(nextSeason);
    await fixture.whenStable();

    expect(component.selectedSeasonStartYear()).toBe(nextSeason);
    expect(getRosterSeasonSpy).toHaveBeenCalledWith(nextSeason);
  });

  it('offers a selectable range of seasons around the current one, labeled "YYYY-YY"', async () => {
    await createFixture();
    const startYears = component.seasons.map((season) => season.startYear);

    expect(startYears).toContain(currentSeasonStartYear);
    expect(startYears).toContain(currentSeasonStartYear - 2);
    expect(startYears).toContain(currentSeasonStartYear + 2);
    expect(startYears).not.toContain(currentSeasonStartYear - 3);
    expect(startYears).not.toContain(currentSeasonStartYear + 3);

    const current = component.seasons.find((s) => s.startYear === currentSeasonStartYear)!;
    expect(current.label).toBe(seasonLabel(currentSeasonStartYear));
  });

  it('shows an error message and a retry action when the request fails', async () => {
    getRosterSeasonSpy.mockReturnValue(throwError(() => new Error('boom')));
    await createFixture();

    expect(fixture.nativeElement.textContent).toContain('An error occurred');
    const retryButton = fixture.debugElement.query(By.css('button[data-testid="retry"]'));
    expect(retryButton).toBeTruthy();
  });

  it('reloads the request when retry is clicked', async () => {
    getRosterSeasonSpy.mockReturnValue(throwError(() => new Error('boom')));
    await createFixture();
    getRosterSeasonSpy.mockReturnValue(of(roster));

    const retryButton = fixture.debugElement.query(By.css('button[data-testid="retry"]'));
    retryButton.nativeElement.click();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(getRosterSeasonSpy).toHaveBeenCalledTimes(2);
    expect(fixture.nativeElement.textContent).not.toContain('An error occurred');
  });

  it('shows an empty-roster message when no athletes are linked to the organization', async () => {
    getRosterSeasonSpy.mockReturnValue(of([]));
    await createFixture();

    expect(fixture.nativeElement.textContent).toContain('No athletes are registered yet.');
  });

  it('does not show the empty-roster message when athletes are present', async () => {
    await createFixture();
    expect(fixture.nativeElement.textContent).not.toContain('No athletes are registered yet.');
  });

  describe('cell activation', () => {
    it('opens the record dialog for an unpaid month', async () => {
      await createFixture();

      component['onCellActivated']({ athlete: roster[0], month: unpaidMonth });

      expect(dialogOpenSpy).toHaveBeenCalledWith(
        PaymentFormDialog,
        expect.objectContaining({
          data: expect.objectContaining({
            athleteId: 1,
            athleteName: 'A B',
            initialMonth: 11,
            initialYear: 2026,
            months: roster[0].months,
          }),
        }),
      );
    });

    it('opens the detail dialog for a partial month', async () => {
      await createFixture();

      component['onCellActivated']({ athlete: roster[0], month: partialMonth });

      expect(dialogOpenSpy).toHaveBeenCalledWith(
        PaymentDetailDialog,
        expect.objectContaining({
          data: expect.objectContaining({
            athleteId: 1,
            athleteName: 'A B',
            month: partialMonth,
          }),
        }),
      );
    });

    it('opens the detail dialog for a paid month', async () => {
      await createFixture();

      component['onCellActivated']({ athlete: roster[0], month: paidMonth });

      expect(dialogOpenSpy).toHaveBeenCalledWith(
        PaymentDetailDialog,
        expect.objectContaining({
          data: expect.objectContaining({ month: paidMonth }),
        }),
      );
    });

    it('opens the detail dialog for an unavailable month that has entries', async () => {
      await createFixture();

      component['onCellActivated']({ athlete: roster[0], month: unavailableWithEntry });

      expect(dialogOpenSpy).toHaveBeenCalledWith(
        PaymentDetailDialog,
        expect.objectContaining({
          data: expect.objectContaining({ month: unavailableWithEntry }),
        }),
      );
    });

    it('reloads the roster when the record dialog closes with success', async () => {
      await createFixture();
      dialogOpenSpy.mockReturnValue({ afterClosed: () => of({ success: true }) });

      component['onCellActivated']({ athlete: roster[0], month: unpaidMonth });
      await fixture.whenStable();

      expect(getRosterSeasonSpy).toHaveBeenCalledTimes(2);
    });

    it('does not reload the roster when the record dialog is cancelled', async () => {
      await createFixture();
      dialogOpenSpy.mockReturnValue({ afterClosed: () => of(undefined) });

      component['onCellActivated']({ athlete: roster[0], month: unpaidMonth });
      await fixture.whenStable();

      expect(getRosterSeasonSpy).toHaveBeenCalledTimes(1);
    });

    it('reloads the roster when the detail dialog closes having changed something', async () => {
      await createFixture();
      dialogOpenSpy.mockReturnValue({ afterClosed: () => of({ changed: true }) });

      component['onCellActivated']({ athlete: roster[0], month: paidMonth });
      await fixture.whenStable();

      expect(getRosterSeasonSpy).toHaveBeenCalledTimes(2);
    });

    it('does not reload the roster when the detail dialog is closed without a change', async () => {
      await createFixture();
      dialogOpenSpy.mockReturnValue({ afterClosed: () => of(undefined) });

      component['onCellActivated']({ athlete: roster[0], month: paidMonth });
      await fixture.whenStable();

      expect(getRosterSeasonSpy).toHaveBeenCalledTimes(1);
    });
  });

  describe('search', () => {
    const secondAthlete: RosterSeasonEntry = {
      athleteId: 2,
      firstName: 'Nikos',
      lastName: 'Papas',
      active: true,
      months: SEASON_MONTHS.map((month) => blankMonth(month)),
    };

    it('narrows the rendered roster to the athlete matching the typed search term', async () => {
      getRosterSeasonSpy.mockReturnValue(of([...roster, secondAthlete]));
      await createFixture();

      const input = fixture.debugElement.query(By.css('input[data-testid="payments-search"]'));
      input.nativeElement.value = 'nikos';
      input.nativeElement.dispatchEvent(new Event('input'));
      fixture.detectChanges();
      await fixture.whenStable();
      fixture.detectChanges();

      expect(fixture.nativeElement.textContent).toContain('Papas Nikos');
      expect(fixture.nativeElement.textContent).not.toContain('B A');
    });

    it('shows the full roster again when the search term is cleared', async () => {
      getRosterSeasonSpy.mockReturnValue(of([...roster, secondAthlete]));
      await createFixture();

      const input = fixture.debugElement.query(By.css('input[data-testid="payments-search"]'));
      input.nativeElement.value = 'nikos';
      input.nativeElement.dispatchEvent(new Event('input'));
      fixture.detectChanges();
      await fixture.whenStable();
      fixture.detectChanges();

      input.nativeElement.value = '';
      input.nativeElement.dispatchEvent(new Event('input'));
      fixture.detectChanges();
      await fixture.whenStable();
      fixture.detectChanges();

      expect(fixture.nativeElement.textContent).toContain('Papas Nikos');
      expect(fixture.nativeElement.textContent).toContain('B A');
    });
  });
});
