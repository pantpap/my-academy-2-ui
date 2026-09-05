import { cellState } from './cell-state';

describe('cellState', () => {
  const today = new Date(2026, 5, 15); // June 15, 2026 (month is 0-indexed in Date)

  it('is "paid" whenever the month is marked paid, regardless of month or year', () => {
    expect(cellState(1, true, 2026, today)).toBe('paid');
    expect(cellState(12, true, 2026, today)).toBe('paid');
    expect(cellState(12, true, 2030, today)).toBe('paid'); // paid ahead, future year
    expect(cellState(1, true, 2020, today)).toBe('paid'); // paid, past year
  });

  it('is "due" for every unpaid month in a past year', () => {
    expect(cellState(1, false, 2025, today)).toBe('due');
    expect(cellState(12, false, 2025, today)).toBe('due');
  });

  it('is "future" for every unpaid month in a future year', () => {
    expect(cellState(1, false, 2027, today)).toBe('future');
    expect(cellState(12, false, 2027, today)).toBe('future');
  });

  describe('current year (today = June 2026)', () => {
    it('is "due" for a month before the current month', () => {
      expect(cellState(5, false, 2026, today)).toBe('due');
      expect(cellState(1, false, 2026, today)).toBe('due');
    });

    it('is "due" for the current month itself', () => {
      expect(cellState(6, false, 2026, today)).toBe('due');
    });

    it('is "future" for a month after the current month', () => {
      expect(cellState(7, false, 2026, today)).toBe('future');
      expect(cellState(12, false, 2026, today)).toBe('future');
    });
  });

  describe('edges at the year boundary', () => {
    it('treats December of the current year as due when today is December', () => {
      const december = new Date(2026, 11, 31);
      expect(cellState(12, false, 2026, december)).toBe('due');
    });

    it('treats January of the current year as due when today is January', () => {
      const january = new Date(2026, 0, 1);
      expect(cellState(1, false, 2026, january)).toBe('due');
      expect(cellState(2, false, 2026, january)).toBe('future');
    });
  });
});
