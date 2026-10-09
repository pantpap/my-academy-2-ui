import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Http } from '../../../core/services/http/http';
import { SUBSCRIPTIONS_API } from '../../../common/constants/endpoints';
import {
  CreateSubscriptionPaymentPayload,
  CreateSubscriptionPaymentResponse,
  SubscriptionPayment,
  SubscriptionsPagedResponse,
} from '../../../common/interfaces/subscription';

// Ετήσιες συνδρομές των οργανισμών, μόνο για τον admin (SPEC-organizations-admin.md).
@Injectable({
  providedIn: 'root',
})
export class Subscriptions {
  private readonly httpService = inject(Http);

  // Κενό name δεν στέλνεται (το Http παραλείπει κενές τιμές).
  list(page: number, take: number, name: string): Observable<SubscriptionsPagedResponse> {
    return this.httpService.get<SubscriptionsPagedResponse>(SUBSCRIPTIONS_API, { page, take, name });
  }

  payments(organizationId: number): Observable<SubscriptionPayment[]> {
    return this.httpService.get<SubscriptionPayment[]>(`${SUBSCRIPTIONS_API}/${organizationId}/payments`);
  }

  addPayment(
    organizationId: number,
    payload: CreateSubscriptionPaymentPayload,
  ): Observable<CreateSubscriptionPaymentResponse> {
    return this.httpService.post<CreateSubscriptionPaymentPayload>(
      `${SUBSCRIPTIONS_API}/${organizationId}/payments`,
      payload,
    );
  }
}
