import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';

import { Payments } from './payment';
import {
  Payment,
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

  it('createPayment() posts to /payments with the current organizationId', () => {
    const created: Payment = {
      id: 1,
      athleteId: 3,
      organizationId: 7,
      amount: 20,
      paymentDate: '2026-08-05',
      coveredMonth: 8,
      coveredYear: 2026,
      notes: null,
      createdAt: '2026-08-05T00:00:00.000Z',
    };

    let result: Payment | undefined;
    service
      .createPayment({
        athleteId: 3,
        amount: 20,
        paymentDate: '2026-08-05',
        coveredMonth: 8,
        coveredYear: 2026,
      })
      .subscribe((res) => (result = res));

    const req = httpMock.expectOne((r) => r.url.endsWith('/payments'));
    expect(req.request.method).toBe('POST');
    expect(req.request.body.organizationId).toBe(7);
    expect(req.request.body.athleteId).toBe(3);

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

  it('getPayments() gets /payments scoped to organizationId and athleteId', () => {
    const payments: Payment[] = [
      {
        id: 1,
        athleteId: 3,
        organizationId: 7,
        amount: 20,
        paymentDate: '2026-08-05',
        coveredMonth: 8,
        coveredYear: 2026,
        notes: null,
        createdAt: '2026-08-05T00:00:00.000Z',
      },
    ];

    let result: Payment[] | undefined;
    service.getPayments(3).subscribe((res) => (result = res));

    const req = httpMock.expectOne((r) => r.url.endsWith('/payments') && r.method === 'GET');
    expect(req.request.params.get('organizationId')).toBe('7');
    expect(req.request.params.get('athleteId')).toBe('3');

    req.flush(payments);
    expect(result).toEqual(payments);
  });

  it('deletePayment() deletes /payments/:id', () => {
    let completed = false;
    service.deletePayment(9).subscribe(() => (completed = true));

    const req = httpMock.expectOne((r) => r.url.endsWith('/payments/9'));
    expect(req.request.method).toBe('DELETE');

    req.flush(null);
    expect(completed).toBe(true);
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
        months: [
          { month: 9, year: 2026, paid: true, paymentId: 12, amount: 40, paymentDate: '2026-09-05' },
          { month: 1, year: 2027, paid: false, paymentId: null, amount: null, paymentDate: null },
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
});
