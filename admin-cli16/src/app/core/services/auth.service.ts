// Angular core and related imports
import { Injectable } from '@angular/core';
import { HttpClient, HttpResponse } from '@angular/common/http';
import { Router } from '@angular/router';

// Third-party libraries
import { JwtHelperService } from '@auth0/angular-jwt';

// RxJS imports
import { Observable, Subject, catchError, finalize, tap, throwError } from 'rxjs';

// Application-specific interfaces
import { UserWithToken } from '../interfaces/user.interface';
import { LoginCredentials } from '../../core/interfaces';
import { ApiResponse } from '../../core/interfaces';
import { ForgotPasswordRequest } from '../../core/interfaces';
import { VerificationCodeWithTokenRequest } from '../../core/interfaces';
import { ResetPasswordRequest } from '../../core/interfaces';
import { GoogleAuthTokenRequest } from '../../core/interfaces';
import { ResendVerificationEmailRequest } from '../../core/interfaces';

// Configuration and services
import { GLOBAL } from '../config/GLOBAL';
import { ResponseHandlingService } from './response-handling.service';
import { ErrorHandlingService } from './error-handling.service';
import { SpinnerService } from './spinner.service';

// Helper to manage API endpoints in a centralized way
const API_ENDPOINTS = {
  loginUser: 'loginUser',
  authenticateGoogle: 'auth/google',
  forgotPassword: 'forgotPassword',
  createMasterAdmin: 'createMasterAdmin',
  activation: 'activation/',
  verificationCode: 'verification-code/',
  resetPassword: 'resetPassword/',
  resendVerificationEmail: 'resendVerificationEmail'
};

@Injectable({
  providedIn: 'root',
})
export class AuthService {

  private url: string = GLOBAL.url;
  private loginSuccessSubject = new Subject<boolean>();
  public loginSuccessObservable = this.loginSuccessSubject.asObservable();

  constructor(
    private _http: HttpClient,
    private _router: Router,
    private _responseHandler: ResponseHandlingService,
    private _errorHandler: ErrorHandlingService,
    private _spinnerService: SpinnerService
  ) { }

  private storeToken(token: string): void {
    localStorage.setItem('token', token);
  }

  private removeToken(): void {
    localStorage.removeItem('token');
    sessionStorage.removeItem('userData');
    this._router.navigate(['/auth/login']);
  }

  getToken(): string | null {
    return localStorage.getItem('token');
  }

  logout(): void {
    this.removeToken();
  }

  handleApiCall<T>(call: Observable<T>, tapHandler: (response: any) => void): Observable<T> {
    this._spinnerService.show();
    return call.pipe(
      tap(tapHandler),
      catchError(error => {
        this._errorHandler.handleError(error);
        return throwError(() => error);
      }),
      finalize(() => this._spinnerService.hide())
    );
  }

  loginUser(credentials: LoginCredentials): Observable<ApiResponse<UserWithToken>> {
    const call = this._http.post<ApiResponse<UserWithToken>>(`${this.url}${API_ENDPOINTS.loginUser}`, credentials);
    return this.handleApiCall(call, response => {
      if (response.data && response.data.token) {
        this.storeToken(response.data.token);
        this._router.navigate(['/dashboard']);
        this.loginSuccessSubject.next(true);
      } else {
        throw new Error('Authentication failed: No token received');
      }
    });
  }

  authenticateWithGoogle(token: string): Observable<ApiResponse<UserWithToken>> {
    const call = this._http.post<ApiResponse<UserWithToken>>(`${this.url}${API_ENDPOINTS.authenticateGoogle}`, { token });
    return this.handleApiCall(call, response => {
      if (response.data && response.data.token) {
        this.storeToken(response.data.token);
        this._router.navigate(['/dashboard']);
        this.loginSuccessSubject.next(true);
      } else {
        throw new Error('Authentication failed: No token received');
      }
    });
  }

  activateAccount(token: string): Observable<any> {
    const call = this._http.get<any>(`${this.url}${API_ENDPOINTS.activation}${token}`);
    return this.handleApiCall(call, response => {
      this._responseHandler.handleResponse(new HttpResponse({
        status: 200,
        body: response
      }));
    });
  }


  forgotPassword(emailAddress: ForgotPasswordRequest): Observable<ApiResponse<null>> {
    const call = this._http.post<ApiResponse<null>>(`${this.url}${API_ENDPOINTS.forgotPassword}`, emailAddress);
    return this.handleApiCall(call, response => {
      this._responseHandler.handleResponse(new HttpResponse({
        status: 200,
        body: response
      }));
    });
  }

  verificationCode(token: string, verificationCode: string): Observable<any> {
    const call = this._http.post<any>(`${this.url}${API_ENDPOINTS.verificationCode}${token}`, { token, verificationCode });
    return this.handleApiCall(call, response => {
      this._responseHandler.handleResponse(new HttpResponse({
        status: 200,
        body: response
      }));
    });
  }

  resetPassword(token: string, newPassword: string): Observable<ApiResponse<null>> {
    const call = this._http.post<ApiResponse<null>>(`${this.url}${API_ENDPOINTS.resetPassword}${token}`, { token, newPassword });
    return this.handleApiCall(call, response => {
      this._responseHandler.handleResponse(new HttpResponse({
        status: 200,
        body: response
      }));
    });
  }

  resendVerificationEmail(emailAddress: ResendVerificationEmailRequest): Observable<ApiResponse<null>> {
    const call = this._http.post<ApiResponse<null>>(`${this.url}${API_ENDPOINTS.resendVerificationEmail}`, { emailAddress });
    return this.handleApiCall(call, response => {
      this._responseHandler.handleResponse(new HttpResponse({
        status: 200,
        body: response
      }));
    });
  }

  isAuthenticated(allowedRoles: string[]): boolean {
    try {
      const token = this.getToken();
      if (!token) return false;
      const helper = new JwtHelperService();
      const decodedToken = helper.decodeToken(token);
      const isExpired = helper.isTokenExpired(token);
      if (isExpired) {
        this.logout();
        return false;
      }

      if (!decodedToken || !decodedToken.role) {
        this.logout();
        return false;
      }

      sessionStorage.setItem('userData', JSON.stringify({
        id: decodedToken.sub,
        userName: decodedToken.userName,
        firstName: decodedToken.firstName,
        lastName: decodedToken.lastName,
        emailAddress: decodedToken.emailAddress,
        profileImage: decodedToken.profileImage,
        role: decodedToken.role,
      }));

      return allowedRoles.includes(decodedToken.role);
    } catch (error) {
      console.error("Authentication Error: ", error);
      this.logout();
      return false;
    }
  }

  createMasterAdmin(data: any): Observable<any> {
    const call = this._http.post(`${this.url}${API_ENDPOINTS.createMasterAdmin}`, data);
    return this.handleApiCall(call, response => {
      this._responseHandler.handleResponse(new HttpResponse({
        status: 200,
        body: response
      }));
    });
  }
}
