import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { currentRole } from './current-role';

// Σελίδες μόνο του admin (SPEC-organizations-admin.md). Οι υπόλοιποι πάνε στο dashboard.
export const adminGuard: CanActivateFn = () => {
  const router = inject(Router);
  return currentRole() === 'admin' ? true : router.createUrlTree(['/app/dashboard']);
};
