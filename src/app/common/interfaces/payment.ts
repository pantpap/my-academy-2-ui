export interface Payment {
  id: number;
  athleteId: number;
  organizationId: number;
  amount: number;
  paymentDate: string;
  coveredMonth: number;
  coveredYear: number;
  notes: string | null;
  createdAt: string;
}

export interface RosterStatusEntry {
  athleteId: number;
  firstName: string;
  lastName: string;
  paid: boolean;
  paidUntil: string | null;
  lastPaymentDate: string | null;
}

export interface PaymentStatusMonth {
  month: number;
  monthName: string;
  paid: boolean;
  amount: number | null;
  paymentDate: string | null;
  paymentId: number | null;
}

export interface PaymentStatus {
  athleteId: number;
  organizationId: number;
  year: number;
  paidUntil: string | null;
  months: PaymentStatusMonth[];
}
