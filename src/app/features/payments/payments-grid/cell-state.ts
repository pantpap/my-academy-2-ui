import { RosterSeasonMonth } from '../../../common/interfaces/payment';

export type CellState = 'paid' | 'partial' | 'unpaid' | 'unavailable';

// Η κατάσταση του κελιού έρχεται έτοιμη από το API (RosterSeasonMonth.status)
// — δεν υπολογίζεται στο FE (βλ. SPEC-payments-sports-grid.md § Boundaries).
export function cellState(month: RosterSeasonMonth): CellState {
  return month.status;
}

// Ένας μη διαθέσιμος μήνας πατιέται μόνο αν έχει τουλάχιστον μία καταχώρηση
// (π.χ. πληρώθηκε πριν ο αθλητής γίνει inactive) — αλλιώς δεν έχει τι να δείξει.
export function isClickable(month: RosterSeasonMonth): boolean {
  return month.status !== 'unavailable' || month.entries.length > 0;
}
