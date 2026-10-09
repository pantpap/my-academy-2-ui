import { BaseResponse } from './base-response';
import { Sport } from './sport';

export type OrganizationRole = 'admin' | 'organization';

export interface Organization {
  id: number;
  name: string;
  email: string;
  displayName: string;
  isActive: boolean;
  role: OrganizationRole;
}

// Μία γραμμή του grid οργανισμών (GET /organizations, SPEC-organizations-admin.md).
export interface OrganizationListItem {
  id: number;
  name: string;
  email: string;
  vatNumber: string | null;
  address: string | null;
  isActive: boolean;
}

export type OrganizationsPagedResponse = BaseResponse<OrganizationListItem>;

// GET /organizations/:id: με τα ενεργά αθλήματα του οργανισμού.
export interface OrganizationDetails extends OrganizationListItem {
  sports: Sport[];
}

export interface CreateOrganizationPayload {
  name: string;
  email: string;
  password: string;
  vatNumber?: string;
  address?: string;
  sportIds: number[];
}

// Ο κωδικός δεν αλλάζει από τη φόρμα επεξεργασίας (SPEC-organizations-admin.md).
export interface UpdateOrganizationPayload {
  name?: string;
  email?: string;
  vatNumber?: string;
  address?: string;
  isActive?: boolean;
  sportIds?: number[];
}
