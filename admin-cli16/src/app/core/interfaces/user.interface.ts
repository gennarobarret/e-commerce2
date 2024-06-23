import { UserRole } from '../types/roles.type';
import { UserGroups } from '../types/groups.type';
import { Country } from './country.interface';
import { State } from './state.interface';


export interface User {
  _id?: string;
  userName: string;
  firstName: string;
  lastName: string;
  organizationName?: string;
  countryAddress: Country | null;
  stateAddress: State | null;
  emailAddress: string;
  phoneNumber?: string;
  birthday?: Date;
  role: UserRole;
  groups?: UserGroups;
  authMethod?: string;
  identification?: string;
  additionalInfo?: string;
  profileImage?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface UserWithToken extends User {
  user: User;
  token: string;
}
