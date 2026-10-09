import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { Subscriptions } from './subscription';
import { environment } from '../../../core/config/environment';

describe('Subscriptions service', () => {
  let service: Subscriptions;
  let controller: HttpTestingController;
  const url = `${environment.apiUrl}/subscriptions`;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    service = TestBed.inject(Subscriptions);
    controller = TestBed.inject(HttpTestingController);
  });

  afterEach(() => controller.verify());

  it('list() asks for one page, filtered by name', () => {
    service.list(3, 20, 'acad').subscribe();

    const req = controller.expectOne((r) => r.url === url);
    expect(req.request.params.get('page')).toBe('3');
    expect(req.request.params.get('take')).toBe('20');
    expect(req.request.params.get('name')).toBe('acad');
    req.flush({ data: [], meta: {} });
  });

  it('payments() loads the payments of one organization', () => {
    service.payments(4).subscribe();

    controller.expectOne(`${url}/4/payments`).flush([]);
  });

  it('addPayment() posts the payment of one organization', () => {
    const payload = { paymentDate: '2026-01-10', amount: 120, description: 'Yearly' };
    service.addPayment(4, payload).subscribe();

    const req = controller.expectOne(`${url}/4/payments`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(payload);
    req.flush({ payment: {}, overlaps: false });
  });
});
