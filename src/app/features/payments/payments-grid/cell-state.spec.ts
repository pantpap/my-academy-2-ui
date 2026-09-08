import { cellState } from './cell-state';

describe('cellState', () => {
  it('is "paid" when the month is marked paid', () => {
    expect(cellState(true)).toBe('paid');
  });

  it('is "due" when the month is unpaid — regardless of whether it is chronologically past or future', () => {
    expect(cellState(false)).toBe('due');
  });
});
