import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { MatDialog } from '@angular/material/dialog';
import { TranslocoTestingModule } from '@jsverse/transloco';
import { of, throwError } from 'rxjs';

import { PaymentsContainer } from './payments-container';
import { Payments as PaymentsService } from '../../../shared/services/payment/payment';
import { RosterYearEntry } from '../../../common/interfaces/payment';
import { PaymentFormDialog } from '../payment-form-dialog/payment-form-dialog';
import { PaymentDetailDialog } from '../payment-detail-dialog/payment-detail-dialog';

const en = {
  common: {
    loading: 'Loading...',
    error: 'An error occurred. Please try again later.',
    retry: 'Try again',
  },
  payments: {
    title: 'Payments',
    yearLabel: 'Year',
    athleteCount: 'Athletes loaded',
    athleteHeader: 'Athlete',
    summary: 'Paid',
    emptyRoster: 'No athletes are registered yet.',
    stateLabels: {
      paid: 'Paid',
      due: 'Due',
      future: 'Not yet due',
    },
    cellAriaLabel: '{{name}}, {{month}} {{year}}: {{state}}',
  },
};

describe('PaymentsContainer', () => {
  let component: PaymentsContainer;
  let fixture: ComponentFixture<PaymentsContainer>;
  let getRosterYearSpy: ReturnType<typeof vi.fn>;
  let dialogOpenSpy: ReturnType<typeof vi.fn>;

  const dueMonth = {
    month: 9,
    paid: false,
    paymentId: null,
    amount: null,
    paymentDate: null,
  };
  const paidMonth = {
    month: 5,
    paid: true,
    paymentId: 12,
    amount: 30,
    paymentDate: '2026-05-05',
  };

  const roster: RosterYearEntry[] = [
    {
      athleteId: 1,
      firstName: 'A',
      lastName: 'B',
      months: Array.from({ length: 12 }, (_, i) => {
        if (i + 1 === paidMonth.month) return paidMonth;
        if (i + 1 === dueMonth.month) return dueMonth;
        return { month: i + 1, paid: false, paymentId: null, amount: null, paymentDate: null };
      }),
    },
  ];
  const currentYear = new Date().getFullYear();

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
        { provide: PaymentsService, useValue: { getRosterYear: getRosterYearSpy } },
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
    getRosterYearSpy = vi.fn().mockReturnValue(of(roster));
  });

  it('should create', async () => {
    await createFixture();
    expect(component).toBeTruthy();
  });

  it('defaults the selected year to the current year', async () => {
    await createFixture();
    expect(component.selectedYear()).toBe(currentYear);
  });

  it('requests roster-year for the selected year on init', async () => {
    await createFixture();
    expect(getRosterYearSpy).toHaveBeenCalledWith(currentYear);
  });

  it('changing the year issues a new request with the new year', async () => {
    await createFixture();
    const nextYear = currentYear - 1;

    component.onYearChange(nextYear);
    await fixture.whenStable();

    expect(component.selectedYear()).toBe(nextYear);
    expect(getRosterYearSpy).toHaveBeenCalledWith(nextYear);
  });

  it('offers a selectable range of years around the current year', async () => {
    await createFixture();
    expect(component.years).toContain(currentYear);
    expect(component.years).toContain(currentYear - 2);
    expect(component.years).toContain(currentYear + 2);
    expect(component.years).not.toContain(currentYear - 3);
    expect(component.years).not.toContain(currentYear + 3);
  });

  it('shows an error message and a retry action when the request fails', async () => {
    getRosterYearSpy.mockReturnValue(throwError(() => new Error('boom')));
    await createFixture();

    expect(fixture.nativeElement.textContent).toContain('An error occurred');
    const retryButton = fixture.debugElement.query(By.css('button[data-testid="retry"]'));
    expect(retryButton).toBeTruthy();
  });

  it('reloads the request when retry is clicked', async () => {
    getRosterYearSpy.mockReturnValue(throwError(() => new Error('boom')));
    await createFixture();
    getRosterYearSpy.mockReturnValue(of(roster));

    const retryButton = fixture.debugElement.query(By.css('button[data-testid="retry"]'));
    retryButton.nativeElement.click();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(getRosterYearSpy).toHaveBeenCalledTimes(2);
    expect(fixture.nativeElement.textContent).not.toContain('An error occurred');
  });

  it('shows an empty-roster message when no athletes are linked to the organization', async () => {
    getRosterYearSpy.mockReturnValue(of([]));
    await createFixture();

    expect(fixture.nativeElement.textContent).toContain('No athletes are registered yet.');
  });

  it('does not show the empty-roster message when athletes are present', async () => {
    await createFixture();
    expect(fixture.nativeElement.textContent).not.toContain('No athletes are registered yet.');
  });

  describe('cell activation', () => {
    it('opens the record dialog for a due month', async () => {
      await createFixture();

      component['onCellActivated']({ athlete: roster[0], month: dueMonth });

      expect(dialogOpenSpy).toHaveBeenCalledWith(
        PaymentFormDialog,
        expect.objectContaining({
          data: expect.objectContaining({
            athleteId: 1,
            athleteName: 'A B',
            year: currentYear,
            initialMonth: 9,
            months: roster[0].months,
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
          data: expect.objectContaining({
            athleteId: 1,
            athleteName: 'A B',
            payment: paidMonth,
          }),
        }),
      );
    });

    it('reloads the roster when the record dialog closes with success', async () => {
      await createFixture();
      dialogOpenSpy.mockReturnValue({ afterClosed: () => of({ success: true }) });

      component['onCellActivated']({ athlete: roster[0], month: dueMonth });
      await fixture.whenStable();

      expect(getRosterYearSpy).toHaveBeenCalledTimes(2);
    });

    it('does not reload the roster when the record dialog is cancelled', async () => {
      await createFixture();
      dialogOpenSpy.mockReturnValue({ afterClosed: () => of(undefined) });

      component['onCellActivated']({ athlete: roster[0], month: dueMonth });
      await fixture.whenStable();

      expect(getRosterYearSpy).toHaveBeenCalledTimes(1);
    });

    it('reloads the roster when the detail dialog closes having deleted the payment', async () => {
      await createFixture();
      dialogOpenSpy.mockReturnValue({ afterClosed: () => of({ deleted: true }) });

      component['onCellActivated']({ athlete: roster[0], month: paidMonth });
      await fixture.whenStable();

      expect(getRosterYearSpy).toHaveBeenCalledTimes(2);
    });

    it('reloads the roster when the record dialog calls onSaved directly (partial-failure path)', async () => {
      await createFixture();
      dialogOpenSpy.mockImplementation((_component, config) => {
        config.data.onSaved();
        return { afterClosed: () => of(undefined) };
      });

      component['onCellActivated']({ athlete: roster[0], month: dueMonth });
      await fixture.whenStable();

      expect(getRosterYearSpy).toHaveBeenCalledTimes(2);
    });
  });
});
