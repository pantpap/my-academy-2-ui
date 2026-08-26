import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';

import { Sports } from './sports';
import { Sport } from '../../../common/interfaces/sport';

describe('Sports', () => {
  let service: Sports;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    localStorage.setItem('CS_ACADEMY_ORGANIZATION', JSON.stringify({ id: 7 }));

    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });

    service = TestBed.inject(Sports);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.removeItem('CS_ACADEMY_ORGANIZATION');
  });

  it('fetches sports scoped to the current organization', () => {
    const sports: Sport[] = [
      { id: 1, name: 'Football' },
      { id: 2, name: 'Basketball' },
    ];

    let result: Sport[] | undefined;
    service.getSports().subscribe((res) => (result = res));

    const req = httpMock.expectOne((r) => r.url.endsWith('/sports'));
    expect(req.request.method).toBe('GET');
    expect(req.request.params.get('organizationId')).toBe('7');

    req.flush(sports);
    expect(result).toEqual(sports);
  });
});
