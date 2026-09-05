import { Route } from '@angular/router';

export const paymentRoutes: Route[] = [
  {
    path: '',
    loadComponent: () =>
      import('./payments-container/payments-container').then((c) => c.PaymentsContainer),
  },
];
