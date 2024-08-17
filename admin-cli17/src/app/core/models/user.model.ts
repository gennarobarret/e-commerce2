// src/app/models/user.model.ts
import { UserRole } from '../types/roles.type';
import { Country } from '../interfaces';
import { State } from '../interfaces';

// Interfaz base para el usuario
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
    isActive: boolean;
    authMethod?: string;
    identification?: string;
    additionalInfo?: string;
    profileImage?: string;
    createdAt?: Date;
    updatedAt?: Date;
    twoFactor?: boolean; // Añadir esta propiedad
    privacySetting?: string; // Añadir esta propiedad (puede ser un enum si tiene valores predefinidos)
    dataSharing?: boolean; // Añadir esta propiedad
}


// Interfaz para usuario con token
export interface UserWithToken extends User {
    user: User;
    token: string;
}

// Interfaz para la respuesta de autenticación con Google
export interface GoogleAuthTokenRequest {
    credential: string;
}

// Interfaz para las credenciales de login
export interface LoginCredentials {
    userName: string;
    password: string;
}

// Interfaz para solicitar restablecimiento de contraseña
export interface ForgotPasswordRequest {
    emailAddress: string;
}

// Interfaz para reenviar email de verificación
export interface ResendVerificationEmailRequest {
    emailAddress: string;
}

// Interfaz para restablecer la contraseña
export interface ResetPasswordRequest {
    token: string;
    newPassword: string;
}

// Interfaz para verificar el código de verificación con token
export interface VerificationCodeWithTokenRequest {
    token: string;
    verificationCode: string;
}

export interface GoogleSignInResponse {
    clientId: string;
    client_id: string;
    credential: string;
    select_by: string;
}

