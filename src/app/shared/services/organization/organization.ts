import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Http } from '../../../core/services/http/http';
import { ORGANIZATIONS_API } from '../../../common/constants/endpoints';
import {
  CreateOrganizationPayload,
  OrganizationDetails,
  OrganizationsPagedResponse,
  UpdateOrganizationPayload,
} from '../../../common/interfaces/organization';

// Οργανισμοί για τον admin (SPEC-organizations-admin.md).
@Injectable({
  providedIn: 'root',
})
export class Organizations {
  private readonly httpService = inject(Http);

  // Κενό name δεν στέλνεται (το Http παραλείπει κενές τιμές).
  list(page: number, take: number, name: string): Observable<OrganizationsPagedResponse> {
    return this.httpService.get<OrganizationsPagedResponse>(ORGANIZATIONS_API, { page, take, name });
  }

  get(id: number): Observable<OrganizationDetails> {
    return this.httpService.get<OrganizationDetails>(`${ORGANIZATIONS_API}/${id}`);
  }

  create(payload: CreateOrganizationPayload): Observable<OrganizationDetails> {
    return this.httpService.post<CreateOrganizationPayload>(ORGANIZATIONS_API, payload);
  }

  update(id: number, payload: UpdateOrganizationPayload): Observable<OrganizationDetails> {
    return this.httpService.patch<UpdateOrganizationPayload>(`${ORGANIZATIONS_API}/${id}`, payload);
  }
}
