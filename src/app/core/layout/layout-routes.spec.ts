import { Route } from '@angular/router';
import { layoutRoutes } from './layout-routes';
import { organizationGuard } from '../guards/organization-guard';

// Q6 (SPEC-organizations-admin.md): οι σελίδες μόνο του οργανισμού μπλοκάρονται για τον admin.
describe('layoutRoutes', () => {
  const children = layoutRoutes[0].children as Route[];
  const byPath = (path: string) => children.find((route) => route.path === path)!;

  it.each(['customers', 'events'])('guards %s with organizationGuard', (path) => {
    expect(byPath(path).canActivate).toContain(organizationGuard);
  });

  it.each(['dashboard', 'payments'])('leaves %s open to both roles', (path) => {
    expect(byPath(path).canActivate ?? []).not.toContain(organizationGuard);
  });
});
