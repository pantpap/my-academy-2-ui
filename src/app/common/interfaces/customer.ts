import { BaseResponse } from './base-response';

export interface EnrollmentPeriod {
  id: number;
  sportId: number;
  sportName: string;
  startDate: string;
  endDate: string | null;
}

export interface Customer {
  id: number;
  firstName: string;
  lastName: string;
  birthDate: string;
  gender: string;
  phone: string;
  street?: string | null;
  city?: string | null;
  postalCode?: string | null;
  country?: string | null;
  sportNames: string[];
  sports: { id: number; name: string }[];
  paidUntil: string | null;
  registrationDate: string;
  active: boolean;
  inactiveSince: string | null;
  enrollments: EnrollmentPeriod[];
}

export type CustomersPagedResponse = BaseResponse<Customer>;
