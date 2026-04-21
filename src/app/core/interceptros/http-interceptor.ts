import { HttpInterceptorFn } from '@angular/common/http';
import { AUTH_TOKEN } from '../../common/constants/local-storage-constants';

export const httpInterceptor: HttpInterceptorFn = (req, next) => {
  const token = localStorage.getItem(AUTH_TOKEN);
  if(token){
    req = req.clone({
      setHeaders: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      }
    })
  }
  return next(req);
};
