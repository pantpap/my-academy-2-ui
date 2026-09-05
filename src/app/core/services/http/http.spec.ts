import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';

import { Http } from './http';

describe('Http', () => {
  let service: Http;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(Http);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('delete() issues a DELETE request to the given url', () => {
    let completed = false;
    service.delete('payments/5').subscribe(() => (completed = true));

    const req = httpMock.expectOne((r) => r.url.endsWith('/payments/5'));
    expect(req.request.method).toBe('DELETE');

    req.flush(null);
    expect(completed).toBe(true);
  });
});
