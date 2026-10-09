import { Route } from '@angular/router';

export const organizationRoutes: Route[] = [
  {
    path: '',
    loadComponent: () =>
      import('./organizations-container/organizations-container').then((c) => c.OrganizationsContainer),
  },
  {
    path: 'new',
    loadComponent: () => import('./organization-form/organization-form').then((c) => c.OrganizationForm),
  },
  {
    path: ':id',
    loadComponent: () => import('./organization-form/organization-form').then((c) => c.OrganizationForm),
  },
];
