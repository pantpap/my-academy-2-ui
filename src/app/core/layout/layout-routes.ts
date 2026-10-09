import { Routes } from '@angular/router';
import { organizationGuard } from '../guards/organization-guard';
import { adminGuard } from '../guards/admin-guard';

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
        canActivate: [organizationGuard],
        loadChildren: () =>
          import('../../features/customers/customer-routes').then((m) => m.customerRoutes),
      },
      {
        path: 'organizations',
        canActivate: [adminGuard],
        loadChildren: () =>
          import('../../features/organizations/organization-routes').then((m) => m.organizationRoutes),
      },
      {
        path: 'payments',
        loadChildren: () =>
          import('../../features/payments/payment-routes').then((m) => m.paymentRoutes),
      },
      {
        path: 'events',
        canActivate: [organizationGuard],
        loadComponent: () =>
          import('../../features/events/events').then((c) => c.Events),
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
