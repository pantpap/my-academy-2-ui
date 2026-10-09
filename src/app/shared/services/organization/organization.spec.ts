import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { Organizations } from './organization';
import { environment } from '../../../core/config/environment';

describe('Organizations service', () => {
  let service: Organizations;
  let controller: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    service = TestBed.inject(Organizations);
    controller = TestBed.inject(HttpTestingController);
  });

  afterEach(() => controller.verify());

  it('list() asks for one page, filtered by name', () => {
    service.list(2, 25, 'acad').subscribe();

    const req = controller.expectOne((r) => r.url === `${environment.apiUrl}/organizations`);
    expect(req.request.params.get('page')).toBe('2');
    expect(req.request.params.get('take')).toBe('25');
    expect(req.request.params.get('name')).toBe('acad');
    req.flush({ data: [], meta: {} });
  });

  it('list() leaves out an empty name', () => {
    service.list(1, 10, '').subscribe();

    const req = controller.expectOne((r) => r.url === `${environment.apiUrl}/organizations`);
    expect(req.request.params.has('name')).toBe(false);
    req.flush({ data: [], meta: {} });
  });
});
