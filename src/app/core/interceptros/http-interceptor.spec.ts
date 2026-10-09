import { TestBed } from '@angular/core/testing';
import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { Router } from '@angular/router';
import { TranslocoTestingModule } from '@jsverse/transloco';

import { httpInterceptor } from './http-interceptor';
import { NotificationService } from '../services/notification/notification.service';
import { LocalStorage } from '../services/localStorage/local-storage';
import { AUTH_TOKEN } from '../../common/constants/local-storage-constants';

const en = { errors: { ORGANIZATION_INACTIVE: 'Your organization is inactive' } };

describe('httpInterceptor', () => {
  let http: HttpClient;
  let controller: HttpTestingController;
  let notification: { error: ReturnType<typeof vi.fn>; success: ReturnType<typeof vi.fn> };
  let router: { navigate: ReturnType<typeof vi.fn> };
  let localStorage: { getItem: ReturnType<typeof vi.fn>; removeItem: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    notification = { error: vi.fn(), success: vi.fn() };
    router = { navigate: vi.fn() };
    localStorage = { getItem: vi.fn().mockReturnValue('the-token'), removeItem: vi.fn() };
    TestBed.configureTestingModule({
      imports: [
        TranslocoTestingModule.forRoot({
          langs: { en },
          preloadLangs: true,
          translocoConfig: { availableLangs: ['en'], defaultLang: 'en' },
        }),
      ],
      providers: [
        provideHttpClient(withInterceptors([httpInterceptor])),
        provideHttpClientTesting(),
        { provide: NotificationService, useValue: notification },
        { provide: Router, useValue: router },
        { provide: LocalStorage, useValue: localStorage },
      ],
    });
    http = TestBed.inject(HttpClient);
    controller = TestBed.inject(HttpTestingController);
  });

  afterEach(() => controller.verify());

  it('adds the bearer token', () => {
    http.get('/api/x').subscribe();

    const req = controller.expectOne('/api/x');
    expect(req.request.headers.get('Authorization')).toBe('Bearer the-token');
    req.flush({});
  });

  it('on 401 shows the translated backend message, without logging out or redirecting', () => {
    const errors: unknown[] = [];
    http.get('/api/x').subscribe({ error: (e) => errors.push(e) });

    controller
      .expectOne('/api/x')
      .flush({ message: 'ORGANIZATION_INACTIVE' }, { status: 401, statusText: 'Unauthorized' });

    expect(notification.error).toHaveBeenCalledWith('Your organization is inactive');
    expect(errors).toHaveLength(1);
    expect(router.navigate).not.toHaveBeenCalled();
    expect(localStorage.removeItem).not.toHaveBeenCalled();
  });

  it('on 401 shows the backend message as is when there is no translation for it', () => {
    http.get('/api/x').subscribe({ error: () => undefined });

    controller
      .expectOne('/api/x')
      .flush({ message: 'Unauthorized' }, { status: 401, statusText: 'Unauthorized' });

    expect(notification.error).toHaveBeenCalledWith('Unauthorized');
  });

  it('leaves other errors to the caller', () => {
    http.get('/api/x').subscribe({ error: () => undefined });

    controller
      .expectOne('/api/x')
      .flush({ message: 'nope' }, { status: 403, statusText: 'Forbidden' });

    expect(notification.error).not.toHaveBeenCalled();
  });
});
