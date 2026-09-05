import { Routes } from '@angular/router';

export const layoutRoutes: Routes = [
  {
    path: '',
    loadComponent: () => import('./layout').then((m) => m.Layout),
    children: [
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full',
      },
      {
        path: 'dashboard',
        loadComponent: () => import('../../features/dashboard/dashboard').then((c) => c.Dashboard),
      },
      {
        path: 'customers',
        loadChildren: () =>
          import('../../features/customers/customer-routes').then((m) => m.customerRoutes),
      },
      {
        path: 'payments',
        loadChildren: () =>
          import('../../features/payments/payment-routes').then((m) => m.paymentRoutes),
      },
      // {
      //   path: 'profile',
      //   loadComponent: () => import('../user-profile/user-profile').then((c) => c.UserProfile),
      // },

      // {
      //   path: 'customer-details',
      //   loadComponent: () =>
      //     import('../customer-details/customer-details').then((c) => c.CustomerDetails),
      // },
    ],
  },
];
