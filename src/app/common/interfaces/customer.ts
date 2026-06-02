import { BaseResponse } from './base-response';

export interface Customer {
  id: number;
  name: string;
  surname: string;
  birthDate: string;
  phone: string;
}

export type CustomersPagedResponse = BaseResponse<Customer>
