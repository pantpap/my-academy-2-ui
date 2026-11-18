import { computed, inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Http } from '../../../core/services/http/http';
import { PAYMENTS_API } from '../../../common/constants/endpoints';
import {
  PaymentStatus,
  RosterStatusEntry,
  RosterYearEntry,
  RosterSeasonEntry,
} from '../../../common/interfaces/payment';
import { Session } from '../../../core/services/session/session';

export interface CreatePaymentPayload {
  athleteId: number;
  amount: number;
  paymentDate: string;
  notes?: string;
  months: { month: number; year: number }[];
  sportIds: number[];
}

export interface CreatePaymentSkipped {
  month: number;
  year: number;
  sportId: number;
  reason: 'already_paid' | 'not_owed';
}

export interface CreatePaymentResult {
  id: number;
  amount: number;
  paymentDate: string;
  notes: string | null;
  items: { id: number; month: number; year: number; sportId: number }[];
  skipped: CreatePaymentSkipped[];
}

@Injectable({
  providedIn: 'root',
})
export class Payments {
  private readonly httpService = inject(Http);

  private readonly session = inject(Session);

  // Από το κεντρικό Session: μετά από logout/login χωρίς reload στέλνεται ο νέος
  // οργανισμός (SPEC-logout.md). Χρησιμοποιείται μόνο όσο υπάρχει συνδεδεμένος χρήστης.
  private readonly organizationId = computed(() => this.session.organization()!.id);

  createPayment(payload: CreatePaymentPayload): Observable<CreatePaymentResult> {
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

  getRosterYear(year: number) {
    return this.httpService.get<RosterYearEntry[]>(`${PAYMENTS_API}/roster-year`, {
      organizationId: this.organizationId(),
      year,
    });
  }

  getRosterSeason(startYear: number, searchTerm: string) {
    return this.httpService.get<RosterSeasonEntry[]>(`${PAYMENTS_API}/roster-season`, {
      organizationId: this.organizationId(),
      startYear,
      searchTerm,
    });
  }

  // Διαγράφει (soft delete) όλες τις καταχωρήσεις ενός μήνα για έναν αθλητή —
  // βλ. DELETE /payments/months στο SPEC-payments-sports-api.md.
  deleteMonth(athleteId: number, month: number, year: number) {
    return this.httpService.delete<void>(`${PAYMENTS_API}/months`, {
      organizationId: this.organizationId(),
      athleteId,
      month,
      year,
    });
  }
}
