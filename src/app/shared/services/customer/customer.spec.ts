import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';

import { Customer } from './customer';

describe('Customer', () => {
  let service: Customer;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    localStorage.setItem('CS_ACADEMY_ORGANIZATION', JSON.stringify({ id: 7 }));

    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });

    service = TestBed.inject(Customer);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.removeItem('CS_ACADEMY_ORGANIZATION');
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  // SPEC-logout.md: μετά από logout/login χωρίς reload στέλνεται ο νέος οργανισμός.
  it('uses the organization currently in localStorage, not the one at creation', () => {
    localStorage.setItem('CS_ACADEMY_ORGANIZATION', JSON.stringify({ id: 9 }));

    service.getCustomers(1, 10).subscribe();

    const req = httpMock.expectOne((r) => r.url.endsWith('/athletes'));
    expect(req.request.params.get('organizationId')).toBe('9');
    req.flush({});
  });
});
