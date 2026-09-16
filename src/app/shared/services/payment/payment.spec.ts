import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';

import { Payments, CreatePaymentResult } from './payment';
import {
  PaymentStatus,
  RosterStatusEntry,
  RosterYearEntry,
  RosterSeasonEntry,
} from '../../../common/interfaces/payment';

describe('Payments', () => {
  let service: Payments;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    localStorage.setItem('CS_ACADEMY_ORGANIZATION', JSON.stringify({ id: 7 }));

    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });

    service = TestBed.inject(Payments);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.removeItem('CS_ACADEMY_ORGANIZATION');
  });

  it('createPayment() posts months[] and sportIds[] to /payments with the current organizationId', () => {
    const created: CreatePaymentResult = {
      id: 1,
      amount: 20,
      paymentDate: '2026-09-05',
      notes: null,
      items: [{ id: 1, month: 9, year: 2026, sportId: 11 }],
      skipped: [],
    };

    let result: CreatePaymentResult | undefined;
    service
      .createPayment({
        athleteId: 3,
        amount: 20,
        paymentDate: '2026-09-05',
        months: [{ month: 9, year: 2026 }],
        sportIds: [11],
      })
      .subscribe((res) => (result = res));

    const req = httpMock.expectOne((r) => r.url.endsWith('/payments') && r.method === 'POST');
    expect(req.request.body.organizationId).toBe(7);
    expect(req.request.body.athleteId).toBe(3);
    expect(req.request.body.months).toEqual([{ month: 9, year: 2026 }]);
    expect(req.request.body.sportIds).toEqual([11]);

    req.flush(created);
    expect(result).toEqual(created);
  });

  it('getPaymentStatus() gets /payments/status scoped to organizationId and athleteId', () => {
    const status: PaymentStatus = {
      athleteId: 3,
      organizationId: 7,
      year: 2026,
      paidUntil: '2026-08-31',
      months: [],
    };

    let result: PaymentStatus | undefined;
    service.getPaymentStatus(3, 2026).subscribe((res) => (result = res));

    const req = httpMock.expectOne((r) => r.url.endsWith('/payments/status'));
    expect(req.request.method).toBe('GET');
    expect(req.request.params.get('organizationId')).toBe('7');
    expect(req.request.params.get('athleteId')).toBe('3');
    expect(req.request.params.get('year')).toBe('2026');

    req.flush(status);
    expect(result).toEqual(status);
  });

  it('getRosterStatus() gets /payments/roster-status scoped to organizationId, year, month', () => {
    const roster: RosterStatusEntry[] = [
      {
        athleteId: 3,
        firstName: 'Paid',
        lastName: 'Athlete',
        paid: true,
        paidUntil: '2026-08-31',
        lastPaymentDate: '2026-08-05',
      },
    ];

    let result: RosterStatusEntry[] | undefined;
    service.getRosterStatus(2026, 8).subscribe((res) => (result = res));

    const req = httpMock.expectOne((r) => r.url.endsWith('/payments/roster-status'));
    expect(req.request.method).toBe('GET');
    expect(req.request.params.get('organizationId')).toBe('7');
    expect(req.request.params.get('year')).toBe('2026');
    expect(req.request.params.get('month')).toBe('8');

    req.flush(roster);
    expect(result).toEqual(roster);
  });

  it('getRosterYear() gets /payments/roster-year scoped to organizationId and year', () => {
    const roster: RosterYearEntry[] = [
      {
        athleteId: 3,
        firstName: 'Paid',
        lastName: 'Athlete',
        months: [
          { month: 1, paid: true, paymentId: 12, amount: 40, paymentDate: '2026-01-05' },
          { month: 2, paid: false, paymentId: null, amount: null, paymentDate: null },
        ],
      },
    ];

    let result: RosterYearEntry[] | undefined;
    service.getRosterYear(2026).subscribe((res) => (result = res));

    const req = httpMock.expectOne((r) => r.url.endsWith('/payments/roster-year'));
    expect(req.request.method).toBe('GET');
    expect(req.request.params.get('organizationId')).toBe('7');
    expect(req.request.params.get('year')).toBe('2026');

    req.flush(roster);
    expect(result).toEqual(roster);
  });

  it('getRosterSeason() gets /payments/roster-season scoped to organizationId and startYear', () => {
    const roster: RosterSeasonEntry[] = [
      {
        athleteId: 3,
        firstName: 'Paid',
        lastName: 'Athlete',
        active: true,
        months: [
          {
            month: 9,
            year: 2026,
            status: 'paid',
            owedSports: [{ id: 11, name: 'Football' }],
            unpaidSports: [],
            entries: [],
          },
          {
            month: 1,
            year: 2027,
            status: 'unpaid',
            owedSports: [{ id: 11, name: 'Football' }],
            unpaidSports: [{ id: 11, name: 'Football' }],
            entries: [],
          },
        ],
      },
    ];

    let result: RosterSeasonEntry[] | undefined;
    service.getRosterSeason(2026).subscribe((res) => (result = res));

    const req = httpMock.expectOne((r) => r.url.endsWith('/payments/roster-season'));
    expect(req.request.method).toBe('GET');
    expect(req.request.params.get('organizationId')).toBe('7');
    expect(req.request.params.get('startYear')).toBe('2026');

    req.flush(roster);
    expect(result).toEqual(roster);
  });

  it('deleteMonth() issues DELETE /payments/months with athleteId, month, year and organizationId', () => {
    let completed = false;
    service.deleteMonth(3, 9, 2026).subscribe(() => (completed = true));

    const req = httpMock.expectOne((r) => r.url.endsWith('/payments/months'));
    expect(req.request.method).toBe('DELETE');
    expect(req.request.params.get('organizationId')).toBe('7');
    expect(req.request.params.get('athleteId')).toBe('3');
    expect(req.request.params.get('month')).toBe('9');
    expect(req.request.params.get('year')).toBe('2026');

    req.flush(null);
    expect(completed).toBe(true);
  });
});
