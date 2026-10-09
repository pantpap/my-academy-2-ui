import { inject } from '@angular/core';
import { LocalStorage } from '../services/localStorage/local-storage';
import { ORGANIZATION } from '../../common/constants/local-storage-constants';
import { Organization, OrganizationRole } from '../../common/interfaces/organization';

// Ο ρόλος του συνδεδεμένου χρήστη, από το ORGANIZATION του login. Οργανισμός αποθηκευμένος
// πριν τους ρόλους (χωρίς role) μετρά ως 'organization', όπως και στο backend.
// Ο πραγματικός έλεγχος γίνεται στο backend· εδώ μόνο ποια σελίδα ανοίγει.
export function currentRole(): OrganizationRole {
  const organization = inject(LocalStorage).getItem<Organization | null>(ORGANIZATION);
  return organization?.role === 'admin' ? 'admin' : 'organization';
}
