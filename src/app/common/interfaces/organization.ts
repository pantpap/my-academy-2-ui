import { BaseResponse } from './base-response';

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
