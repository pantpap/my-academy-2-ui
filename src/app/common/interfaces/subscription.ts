import { BaseResponse } from './base-response';

export type SubscriptionStatus = 'paid' | 'expiring' | 'unpaid';

// Μία γραμμή του grid συνδρομών (GET /subscriptions, SPEC-organizations-admin.md).
// Οι ημερομηνίες είναι YYYY-MM-DD και το ποσό string ("120.00"), όπως τα στέλνει το backend.
export interface SubscriptionRow {
  organizationId: number;
  name: string;
  createdAt: string;
  lastPaymentDate: string | null;
  lastAmount: string | null;
  expiresAt: string | null;
  status: SubscriptionStatus;
}

export type SubscriptionsPagedResponse = BaseResponse<SubscriptionRow>;

export interface SubscriptionPayment {
  id: number;
  paymentDate: string;
  amount: string;
  description: string | null;
  expiresAt: string;
}

export interface CreateSubscriptionPaymentPayload {
  paymentDate: string;
  amount: number;
  description?: string;
}

export interface CreateSubscriptionPaymentResponse {
  payment: SubscriptionPayment;
  overlaps: boolean;
}
