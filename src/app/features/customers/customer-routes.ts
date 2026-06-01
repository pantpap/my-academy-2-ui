import { Route } from '@angular/router';

export const customerRoutes: Route[] = [
  {
    path: '',
    loadComponent: () => import('./customer-list/customer-list').then((c) => c.CustomerList),
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
