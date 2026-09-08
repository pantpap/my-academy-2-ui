import { defaultSeasonStartYear, seasonLabel, seasonOptions } from './season';

describe('seasonLabel', () => {
  it('formats a start year as "YYYY-YY"', () => {
    expect(seasonLabel(2026)).toBe('2026-27');
    expect(seasonLabel(1999)).toBe('1999-00');
  });
});

describe('defaultSeasonStartYear', () => {
  it('returns this calendar year when today falls in Sep-Dec (season in progress)', () => {
    expect(defaultSeasonStartYear(new Date(2026, 8, 1))).toBe(2026); // Sep 1, 2026
    expect(defaultSeasonStartYear(new Date(2026, 11, 31))).toBe(2026); // Dec 31, 2026
  });

  it('returns last calendar year when today falls in Jan-Jun (season in progress, second half)', () => {
    expect(defaultSeasonStartYear(new Date(2027, 0, 1))).toBe(2026); // Jan 1, 2027
    expect(defaultSeasonStartYear(new Date(2027, 5, 30))).toBe(2026); // Jun 30, 2027
  });

  it('returns this calendar year (the upcoming season) when today falls in Jul-Aug (no season in progress)', () => {
    expect(defaultSeasonStartYear(new Date(2026, 6, 15))).toBe(2026); // Jul 15, 2026
    expect(defaultSeasonStartYear(new Date(2026, 7, 31))).toBe(2026); // Aug 31, 2026
  });
});

describe('seasonOptions', () => {
  it('builds a range of seasons centered on the given start year', () => {
    const options = seasonOptions(2026, 2);

    expect(options).toEqual([
      { startYear: 2024, label: '2024-25' },
      { startYear: 2025, label: '2025-26' },
      { startYear: 2026, label: '2026-27' },
      { startYear: 2027, label: '2027-28' },
      { startYear: 2028, label: '2028-29' },
    ]);
  });
});
