// models/user.model.ts
import { UserRole } from '../types/roles.type';
import { UserGroups } from '../types/groups.type';

export class User {
    constructor(
        public userName: string,
        public firstName: string,
        public lastName: string,
        public emailAddress: string,
        public role: UserRole
    ) { }

    get fullName(): string {
        return `${this.firstName} ${this.lastName}`;
    }

    isValidEmail(): boolean {
        return /^\S+@\S+\.\S+$/.test(this.emailAddress);
    }
}


export interface BaseUser {
    _id?: string;
    userName: string;
    firstName: string;
    lastName: string;
    countryAddress: string;
    stateAddress: string;
    emailAddress: string;
    role: UserRole; 
}

export interface DetailedUser extends BaseUser {
    organizationName?: string;
    phoneNumber?: string;
    birthday?: Date;
    groups?: UserGroups;
    authMethod?: string;
    identification?: string;
    additionalInfo?: string;
    profileImage?: string;
    createdAt?: Date;
    updatedAt?: Date;
}