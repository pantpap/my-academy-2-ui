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

  const url = `${environment.apiUrl}/organizations`;

  it('get() loads one organization with its sports', () => {
    service.get(4).subscribe();

    const req = controller.expectOne(`${url}/4`);
    expect(req.request.method).toBe('GET');
    req.flush({});
  });

  it('create() posts the organization with its sportIds', () => {
    const payload = {
      name: 'Academy',
      email: 'a@x.gr',
      password: '1234',
      vatNumber: '1',
      address: 'Street',
      sportIds: [1, 2],
    };
    service.create(payload).subscribe();

    const req = controller.expectOne(url);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(payload);
    req.flush({});
  });

  it('update() patches the organization', () => {
    const payload = { name: 'Academy', isActive: false, sportIds: [2] };
    service.update(4, payload).subscribe();

    const req = controller.expectOne(`${url}/4`);
    expect(req.request.method).toBe('PATCH');
    expect(req.request.body).toEqual(payload);
    req.flush({});
  });
});
