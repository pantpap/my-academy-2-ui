export interface SeasonOption {
  startYear: number;
  label: string;
}

export function seasonLabel(startYear: number): string {
  return `${startYear}-${String(startYear + 1).slice(-2)}`;
}

/**
 * Which season a viewer opening the grid "today" most likely wants to see.
 * Sep-Dec/Jan-Jun fall inside the season that's in progress. Jul-Aug (no
 * season in progress, summer break) defaults to the upcoming season rather
 * than the one that just ended, on the theory that staff opening the grid
 * over summer are prepping for what's about to start.
 */
export function defaultSeasonStartYear(today: Date): number {
  const month = today.getMonth() + 1;
  const year = today.getFullYear();

  if (month >= 9) return year;
  if (month <= 6) return year - 1;
  return year;
}

export function seasonOptions(centerStartYear: number, range: number): SeasonOption[] {
  return Array.from({ length: range * 2 + 1 }, (_, index) => {
    const startYear = centerStartYear - range + index;
    return { startYear, label: seasonLabel(startYear) };
  });
}
