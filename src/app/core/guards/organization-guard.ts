import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { currentRole } from './current-role';

// Σελίδες μόνο του οργανισμού (SPEC-organizations-admin.md, Q6). Ο admin πάει στο dashboard.
export const organizationGuard: CanActivateFn = () => {
  const router = inject(Router);
  return currentRole() === 'organization' ? true : router.createUrlTree(['/app/dashboard']);
};
