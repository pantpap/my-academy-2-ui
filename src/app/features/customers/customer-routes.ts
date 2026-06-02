import { Route } from '@angular/router';

export const customerRoutes: Route[] = [
  {
    path: '',
    loadComponent: () => import('./customer-container/customer-container').then((c) => c.CustomerContainer),
  },
  {
    path: ':id',
    loadComponent: () => import('./customer-details/customer-details').then((c) => c.CustomerDetails),
  },
  {
    path: 'new',
    loadComponent: () => import('./customer-details/customer-details').then((c) => c.CustomerDetails),
  }
]
