import { cellState, isClickable } from './cell-state';
import { RosterSeasonMonth } from '../../../common/interfaces/payment';

function month(overrides: Partial<RosterSeasonMonth> = {}): RosterSeasonMonth {
  return {
    month: 9,
    year: 2026,
    status: 'unpaid',
    owedSports: [],
    unpaidSports: [],
    entries: [],
    ...overrides,
  };
}

describe('cellState', () => {
  it('mirrors the API status for paid', () => {
    expect(cellState(month({ status: 'paid' }))).toBe('paid');
  });

  it('mirrors the API status for partial', () => {
    expect(cellState(month({ status: 'partial' }))).toBe('partial');
  });

  it('mirrors the API status for unpaid', () => {
    expect(cellState(month({ status: 'unpaid' }))).toBe('unpaid');
  });

  it('mirrors the API status for unavailable', () => {
    expect(cellState(month({ status: 'unavailable' }))).toBe('unavailable');
  });
});

describe('isClickable', () => {
  it('is true for paid, partial, and unpaid regardless of entries', () => {
    expect(isClickable(month({ status: 'paid' }))).toBe(true);
    expect(isClickable(month({ status: 'partial' }))).toBe(true);
    expect(isClickable(month({ status: 'unpaid' }))).toBe(true);
  });

  it('is false for unavailable with no entries', () => {
    expect(isClickable(month({ status: 'unavailable', entries: [] }))).toBe(false);
  });

  it('is true for unavailable with at least one entry', () => {
    const entry = {
      paymentId: 1,
      amount: 40,
      coveredMonthsCount: 1,
      paymentDate: '2026-09-05',
      notes: null,
      sports: [{ id: 1, name: 'Football' }],
    };
    expect(isClickable(month({ status: 'unavailable', entries: [entry] }))).toBe(true);
  });
});
