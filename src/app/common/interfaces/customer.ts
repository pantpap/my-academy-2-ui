import { BaseResponse } from './base-response';

export interface Customer {
  id: number;
  firstName: string;
  lastName: string;
  birthDate: string;
  gender: string;
  phone: string;
}

export type CustomersPagedResponse = BaseResponse<Customer>
