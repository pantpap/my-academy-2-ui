import { RosterStatusEntry } from '../../../common/interfaces/payment';

export function buildPaidStatusMap(
  entries: RosterStatusEntry[] | undefined,
): Map<number, boolean> {
  return new Map((entries ?? []).map((entry) => [entry.athleteId, entry.paid]));
}
