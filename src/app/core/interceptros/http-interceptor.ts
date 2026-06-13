import { HttpInterceptorFn } from '@angular/common/http';
import { AUTH_TOKEN } from '../../common/constants/local-storage-constants';
import { inject } from '@angular/core';
import { LocalStorage } from '../services/localStorage/local-storage';

export const httpInterceptor: HttpInterceptorFn = (req, next) => {
  const localStorageService = inject(LocalStorage);
  const token = localStorageService.getItem(AUTH_TOKEN);
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
