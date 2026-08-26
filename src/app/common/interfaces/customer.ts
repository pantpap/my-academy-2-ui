import { BaseResponse } from './base-response';

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
}

export type CustomersPagedResponse = BaseResponse<Customer>;
