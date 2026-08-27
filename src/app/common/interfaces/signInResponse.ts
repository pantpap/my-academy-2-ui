import { Organization } from './organization';

export interface SignInResponse {
  accessToken: string;
  organization: Organization;
}
