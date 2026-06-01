import { inject, Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { AUTH_TOKEN } from '../../../common/constants/local-storage-constants';
import { Credentials } from '../../../common/interfaces/credencials';
import { AUTH_LOGIN } from '../../../common/constants/endpoints';
import { SignInResponse } from '../../../common/interfaces/signInResponse';
import { Observable } from 'rxjs';
import { Http } from '../../../core/services/http/http';
import { LocalStorage } from '../../../core/services/localStorage/local-storage';

@Injectable({
  providedIn: 'root',
})
export class Auth {
  private readonly httpService = inject(Http);
  private readonly localStorageService = inject(LocalStorage);
  private readonly router = inject(Router);

  login(data: Credentials): Observable<SignInResponse> {
    return this.httpService.post<Credentials>(AUTH_LOGIN, data);
  }

  logout() {
    this.localStorageService.removeItem(AUTH_TOKEN);
    this.router.navigate(['/']);
  }
}
