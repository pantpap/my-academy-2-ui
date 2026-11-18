import { inject, Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { AUTH_TOKEN } from '../../../common/constants/local-storage-constants';
import { Credentials } from '../../../common/interfaces/credencials';
import { AUTH_LOGIN } from '../../../common/constants/endpoints';
import { SignInResponse } from '../../../common/interfaces/signInResponse';
import { Observable } from 'rxjs';
import { Http } from '../../../core/services/http/http';
import { LocalStorage } from '../../../core/services/localStorage/local-storage';
import { Session } from '../../../core/services/session/session';

@Injectable({
  providedIn: 'root',
})
export class Auth {
  private readonly httpService = inject(Http);
  private readonly localStorageService = inject(LocalStorage);
  private readonly router = inject(Router);
  private readonly session = inject(Session);

  login(data: Credentials): Observable<SignInResponse> {
    return this.httpService.post<Credentials>(AUTH_LOGIN, data);
  }

  // Μόνο στον client, χωρίς κλήση στο API (SPEC-logout.md). Το THEME και η γλώσσα μένουν.
  logout(): void {
    this.localStorageService.removeItem(AUTH_TOKEN);
    this.session.clear();
    this.router.navigate(['/login']);
  }
}
