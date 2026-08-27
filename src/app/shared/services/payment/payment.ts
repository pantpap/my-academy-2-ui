import { inject, Injectable, signal } from '@angular/core';
import { Http } from '../../../core/services/http/http';
import { PAYMENTS_API } from '../../../common/constants/endpoints';
import { Payment, PaymentStatus, RosterStatusEntry } from '../../../common/interfaces/payment';
import { ORGANIZATION } from '../../../common/constants/local-storage-constants';
import { LocalStorage } from '../../../core/services/localStorage/local-storage';

export type CreatePaymentPayload = Omit<Payment, 'id' | 'organizationId' | 'createdAt' | 'notes'> & {
  notes?: string;
};

@Injectable({
  providedIn: 'root',
})
export class Payments {
  private readonly httpService = inject(Http);
  private readonly localStorageService = inject(LocalStorage);

  readonly organizationId = signal(this.localStorageService.getItem(ORGANIZATION).id);

  createPayment(payload: CreatePaymentPayload) {
    return this.httpService.post<CreatePaymentPayload & { organizationId: number }>(PAYMENTS_API, {
      ...payload,
      organizationId: this.organizationId(),
    });
  }

  getPaymentStatus(athleteId: number, year?: number) {
    return this.httpService.get<PaymentStatus>(`${PAYMENTS_API}/status`, {
      organizationId: this.organizationId(),
      athleteId,
      ...(year !== undefined ? { year } : {}),
    });
  }

  getRosterStatus(year: number, month: number) {
    return this.httpService.get<RosterStatusEntry[]>(`${PAYMENTS_API}/roster-status`, {
      organizationId: this.organizationId(),
      year,
      month,
    });
  }
}
