export type CellState = 'paid' | 'due' | 'future';

/**
 * A month is "due" the moment it arrives and stays due until paid — there is
 * no separate overdue state. Every unpaid month in a past year is due;
 * every month in a future year is future, since it hasn't arrived yet.
 */
export function cellState(
  month: number,
  paid: boolean,
  selectedYear: number,
  today: Date,
): CellState {
  if (paid) {
    return 'paid';
  }

  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth() + 1;

  if (selectedYear < currentYear) {
    return 'due';
  }
  if (selectedYear > currentYear) {
    return 'future';
  }
  return month <= currentMonth ? 'due' : 'future';
}
