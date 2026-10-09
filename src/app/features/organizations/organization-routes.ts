import { Route } from '@angular/router';

export const organizationRoutes: Route[] = [
  {
    path: '',
    loadComponent: () =>
      import('./organizations-container/organizations-container').then((c) => c.OrganizationsContainer),
  },
];
