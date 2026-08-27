import { buildPaidStatusMap } from './paid-status';
import { RosterStatusEntry } from '../../../common/interfaces/payment';

describe('buildPaidStatusMap', () => {
  it('maps each athleteId to its paid flag', () => {
    const entries: RosterStatusEntry[] = [
      {
        athleteId: 1,
        firstName: 'Paid',
        lastName: 'Athlete',
        paid: true,
        paidUntil: '2026-08-31',
        lastPaymentDate: '2026-08-05',
      },
      {
        athleteId: 2,
        firstName: 'Unpaid',
        lastName: 'Athlete',
        paid: false,
        paidUntil: null,
        lastPaymentDate: null,
      },
    ];

    const map = buildPaidStatusMap(entries);

    expect(map.get(1)).toBe(true);
    expect(map.get(2)).toBe(false);
  });

  it('returns an empty map for undefined input (roster-status not loaded yet)', () => {
    expect(buildPaidStatusMap(undefined).size).toBe(0);
  });

  it('returns undefined for an athlete not present in the roster-status response', () => {
    const map = buildPaidStatusMap([]);
    expect(map.get(999)).toBeUndefined();
  });
});
