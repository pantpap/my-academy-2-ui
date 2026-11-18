import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { Router } from '@angular/router';

import { Auth } from './auth';
import { Session } from '../../../core/services/session/session';

describe('Auth', () => {
  let service: Auth;
  let router: { navigate: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    router = { navigate: vi.fn() };
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: Router, useValue: router },
      ],
    });
    service = TestBed.inject(Auth);
  });

  afterEach(() => {
    localStorage.removeItem('CS_ACADEMY_TOKEN');
    localStorage.removeItem('CS_ACADEMY_ORGANIZATION');
    localStorage.removeItem('CS_ACADEMY_THEME');
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  // SPEC-logout.md
  describe('logout()', () => {
    beforeEach(() => {
      localStorage.setItem('CS_ACADEMY_TOKEN', JSON.stringify('t'));
      localStorage.setItem('CS_ACADEMY_THEME', JSON.stringify('dark'));
      TestBed.inject(Session).setOrganization({ id: 7 } as never);
    });

    it('removes the token and clears the organization from Session and localStorage', () => {
      service.logout();

      expect(localStorage.getItem('CS_ACADEMY_TOKEN')).toBeNull();
      expect(localStorage.getItem('CS_ACADEMY_ORGANIZATION')).toBeNull();
      expect(TestBed.inject(Session).organization()).toBeNull();
    });

    it('keeps the theme', () => {
      service.logout();

      expect(localStorage.getItem('CS_ACADEMY_THEME')).toBe(JSON.stringify('dark'));
    });

    it('navigates to /login', () => {
      service.logout();

      expect(router.navigate).toHaveBeenCalledWith(['/login']);
    });

    it('does not call the API', () => {
      service.logout();

      TestBed.inject(HttpTestingController).verify();
    });
  });
});
