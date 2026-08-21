import { BaseResponse } from './base-response';

export interface Customer {
  id: number;
  firstName: string;
  lastName: string;
  birthDate: string;
  gender: string;
  phone: string;
  sportNames: string[];
  sports: { id: number; name: string }[];
  paidUntil: string | null;
}

export type CustomersPagedResponse = BaseResponse<Customer>;
