export type CellState = 'paid' | 'due';

/**
 * A season month is either paid or due — there is no "future" lockout. Staff
 * can record a payment for any month in the shown season regardless of
 * whether it's chronologically past or future relative to today.
 */
export function cellState(paid: boolean): CellState {
  return paid ? 'paid' : 'due';
}
