import { computed, inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Http } from '../../../core/services/http/http';
import { SPORTS_API } from '../../../common/constants/endpoints';
import { Sport } from '../../../common/interfaces/sport';
import { Session } from '../../../core/services/session/session';

@Injectable({
  providedIn: 'root',
})
export class Sports {
  private readonly httpService = inject(Http);

  private readonly session = inject(Session);

  // Από το κεντρικό Session: μετά από logout/login χωρίς reload στέλνεται ο νέος
  // οργανισμός (SPEC-logout.md). Χρησιμοποιείται μόνο όσο υπάρχει συνδεδεμένος χρήστης.
  private readonly organizationId = computed(() => this.session.organization()!.id);

  getSports() {
    return this.httpService.get<Sport[]>(SPORTS_API, { organizationId: this.organizationId() });
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
