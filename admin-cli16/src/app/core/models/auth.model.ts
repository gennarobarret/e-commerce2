export interface BaseAuthRequest {
    emailAddress?: string;
    token?: string;
}

export interface BaseAuthResponse {
    message: string;
    status?: string;
}

export interface BaseTokenRequest extends BaseAuthRequest {
    token: string;
}
export interface ForgotPasswordRequest extends BaseAuthRequest {
    emailAddress: string;
}

export interface ResetPasswordRequest extends BaseTokenRequest {
    newPassword: string;
}

export interface VerificationCodeRequest extends BaseTokenRequest {
    verificationCode: string;
}

export interface GoogleAuthTokenRequest extends BaseAuthRequest {
    token: string;
}

export interface ApiResponse<T = any> extends BaseAuthResponse {
    data?: T;
}
