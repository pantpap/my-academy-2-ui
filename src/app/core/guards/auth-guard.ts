import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { LocalStorage } from '../services/localStorage/local-storage';
import { AUTH_TOKEN } from '../../common/constants/local-storage-constants';

export const authGuard: CanActivateFn = () => {
  const localStorageService = inject(LocalStorage);
  const router = inject(Router);

  const token = localStorageService.getItem(AUTH_TOKEN);
  if(token) return true;

  return router.createUrlTree(['/login']);
};
