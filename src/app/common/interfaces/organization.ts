export type OrganizationRole = 'admin' | 'organization';

export interface Organization {
  id: number;
  name: string;
  email: string;
  displayName: string;
  isActive: boolean;
  role: OrganizationRole;
}
