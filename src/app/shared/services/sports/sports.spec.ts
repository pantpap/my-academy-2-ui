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

  // SPEC-organizations-admin.md: κοινός κατάλογος αθλημάτων.
  it('catalog() fetches the whole sports catalog', () => {
    let result: Sport[] | undefined;
    service.catalog().subscribe((res) => (result = res));

    const req = httpMock.expectOne((r) => r.url.endsWith('/sports/catalog'));
    expect(req.request.method).toBe('GET');
    req.flush([{ id: 1, name: 'Judo' }]);
    expect(result).toEqual([{ id: 1, name: 'Judo' }]);
  });

  it('addToCatalog() posts the new sport name', () => {
    let result: Sport | undefined;
    service.addToCatalog('Judo').subscribe((res) => (result = res));

    const req = httpMock.expectOne((r) => r.url.endsWith('/sports/catalog'));
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ name: 'Judo' });
    req.flush({ id: 9, name: 'Judo' });
    expect(result).toEqual({ id: 9, name: 'Judo' });
  });
});
