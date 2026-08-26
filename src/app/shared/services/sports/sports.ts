import { inject, Injectable, signal } from '@angular/core';
import { Http } from '../../../core/services/http/http';
import { SPORTS_API } from '../../../common/constants/endpoints';
import { Sport } from '../../../common/interfaces/sport';
import { ORGANIZATION } from '../../../common/constants/local-storage-constants';
import { LocalStorage } from '../../../core/services/localStorage/local-storage';

@Injectable({
  providedIn: 'root',
})
export class Sports {
  private readonly httpService = inject(Http);
  private readonly localStorageService = inject(LocalStorage);

  readonly organizationId = signal(this.localStorageService.getItem(ORGANIZATION).id);

  getSports() {
    return this.httpService.get<Sport[]>(SPORTS_API, { organizationId: this.organizationId() });
  }
}
