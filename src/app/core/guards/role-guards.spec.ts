import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, CanActivateFn, Router, RouterStateSnapshot, UrlTree } from '@angular/router';
import { LocalStorage } from '../services/localStorage/local-storage';
import { adminGuard } from './admin-guard';
import { organizationGuard } from './organization-guard';

// SPEC-organizations-admin.md, Κομμάτι 5 και Q6.
describe('role guards', () => {
  let stored: unknown;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [{ provide: LocalStorage, useValue: { getItem: () => stored } }],
    });
  });

  function run(guard: CanActivateFn) {
    return TestBed.runInInjectionContext(() =>
      guard({} as ActivatedRouteSnapshot, {} as RouterStateSnapshot),
    );
  }

  function dashboard(): UrlTree {
    return TestBed.inject(Router).createUrlTree(['/app/dashboard']);
  }

  describe('adminGuard', () => {
    it('lets the admin through', () => {
      stored = { id: 1, role: 'admin' };
      expect(run(adminGuard)).toBe(true);
    });

    it.each([
      ['an organization', { id: 1, role: 'organization' }],
      ['a stored organization without role', { id: 1 }],
      ['nothing stored', null],
    ])('sends %s to the dashboard', (_label, value) => {
      stored = value;
      expect((run(adminGuard) as UrlTree).toString()).toBe(dashboard().toString());
    });
  });

  describe('organizationGuard', () => {
    it.each([
      ['an organization', { id: 1, role: 'organization' }],
      ['a stored organization without role', { id: 1 }],
    ])('lets %s through', (_label, value) => {
      stored = value;
      expect(run(organizationGuard)).toBe(true);
    });

    it('sends the admin to the dashboard', () => {
      stored = { id: 1, role: 'admin' };
      expect((run(organizationGuard) as UrlTree).toString()).toBe(dashboard().toString());
    });
  });
});
