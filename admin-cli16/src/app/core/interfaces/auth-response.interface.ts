// login-credentials.interface
export interface LoginCredentials {
    userName: string;
    password: string;
}

// google-auth-token.interface
export interface GoogleAuthTokenRequest {
    credential: string;
}

// forgot-password.interface
export interface ForgotPasswordRequest {
    emailAddress: string;
}

// resend-verification-email.interface
export interface ResendVerificationEmailRequest {
    emailAddress: string;
}

// reset-password.interface
export interface ResetPasswordRequest {
    token: string;
    newPassword: string;
}

// verification-code.interface
export interface VerificationCodeWithTokenRequest {
    token: string;
    verificationCode: string;
}