import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { AUTH_TOKEN } from '../../common/constants/local-storage-constants';
import { inject } from '@angular/core';
import { TranslocoService } from '@jsverse/transloco';
import { catchError, throwError } from 'rxjs';
import { LocalStorage } from '../services/localStorage/local-storage';
import { NotificationService } from '../services/notification/notification.service';

export const httpInterceptor: HttpInterceptorFn = (req, next) => {
  const localStorageService = inject(LocalStorage);
  const notification = inject(NotificationService);
  const transloco = inject(TranslocoService);
  const token = localStorageService.getItem(AUTH_TOKEN);
  if(token){
    req = req.clone({
      setHeaders: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      }
    })
  }
  // 401: notification με το message του backend (μεταφρασμένο, αν είναι γνωστός
  // κωδικός όπως ORGANIZATION_INACTIVE). Χωρίς logout ή redirect (SPEC-organizations-admin.md).
  return next(req).pipe(
    catchError((error: unknown) => {
      if (error instanceof HttpErrorResponse && error.status === 401) {
        const message: string = error.error?.message ?? error.message;
        const key = `errors.${message}`;
        const translated = transloco.translate(key);
        notification.error(translated === key ? message : translated);
      }
      return throwError(() => error);
    }),
  );
};
