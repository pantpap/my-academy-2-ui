export interface PaymentItem {
  month: number;
  year: number;
  sportId: number;
  sportName: string;
}

export interface Payment {
  id: number;
  athleteId: number;
  organizationId: number;
  amount: number;
  paymentDate: string;
  notes: string | null;
  createdAt: string;
  items: PaymentItem[];
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

export interface RosterYearMonth {
  month: number;
  paid: boolean;
  paymentId: number | null;
  amount: number | null;
  paymentDate: string | null;
}

export interface RosterYearEntry {
  athleteId: number;
  firstName: string;
  lastName: string;
  months: RosterYearMonth[];
}

export type CellStatus = 'paid' | 'partial' | 'unpaid' | 'unavailable';

export interface RosterSeasonSport {
  id: number;
  name: string;
}

export interface RosterSeasonPaymentEntry {
  paymentId: number;
  amount: number;
  coveredMonthsCount: number;
  paymentDate: string;
  notes: string | null;
  sports: RosterSeasonSport[];
}

export interface RosterSeasonMonth {
  month: number;
  year: number;
  status: CellStatus;
  owedSports: RosterSeasonSport[];
  unpaidSports: RosterSeasonSport[];
  entries: RosterSeasonPaymentEntry[];
}

export interface RosterSeasonEntry {
  athleteId: number;
  firstName: string;
  lastName: string;
  active: boolean;
  months: RosterSeasonMonth[];
}
