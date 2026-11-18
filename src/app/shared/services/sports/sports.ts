import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Http } from '../../../core/services/http/http';
import { SPORTS_API } from '../../../common/constants/endpoints';
import { Sport } from '../../../common/interfaces/sport';
import { ORGANIZATION } from '../../../common/constants/local-storage-constants';
import { Organization } from '../../../common/interfaces/organization';
import { LocalStorage } from '../../../core/services/localStorage/local-storage';

@Injectable({
  providedIn: 'root',
})
export class Sports {
  private readonly httpService = inject(Http);
  private readonly localStorageService = inject(LocalStorage);

  // Διαβάζεται σε κάθε κλήση: μετά από logout/login χωρίς reload πρέπει να στέλνεται
  // ο νέος οργανισμός (SPEC-logout.md).
  private get organizationId(): number {
    return this.localStorageService.getItem<Organization>(ORGANIZATION).id;
  }

  getSports() {
    return this.httpService.get<Sport[]>(SPORTS_API, { organizationId: this.organizationId });
  }

  // Κοινός κατάλογος αθλημάτων (SPEC-organizations-admin.md).
  catalog(): Observable<Sport[]> {
    return this.httpService.get<Sport[]>(`${SPORTS_API}/catalog`);
  }

  // 409 με message SPORT_EXISTS όταν το κανονικοποιημένο όνομα υπάρχει ήδη.
  addToCatalog(name: string): Observable<Sport> {
    return this.httpService.post<{ name: string }>(`${SPORTS_API}/catalog`, { name });
  }
}
