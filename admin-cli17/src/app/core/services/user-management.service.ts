import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, BehaviorSubject, throwError, EMPTY } from 'rxjs';
import { catchError, finalize, map, switchMap, tap } from 'rxjs/operators';
import { ApiResponse } from '../models/api-response.model';
import { User, UserWithToken, LoginCredentials } from '../models/user.model';
import { SpinnerService } from './spinner.service';
import { ResponseHandlingService } from './response-handling.service';
import { ConfigService } from './config.service';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';

const API_ENDPOINTS = {
  uploadProfileImage: 'uploadProfileImage',
  getUser: 'getUser',
  getUserById: 'getUserById',
  listAllUsers: 'listAllUsers',
  createUser: 'createUser',
  createMasterAdmin: 'createMasterAdmin',
  updateUser: 'updateUser',
  resetPassword: 'resetPassword',
  deleteUser: 'deleteUser',
  updateUserActiveStatus: 'updateUserActiveStatus',
  updateMultipleUserActiveStatus: 'updateMultipleUserActiveStatus',
  getUserProfileImage: 'getUserProfileImage',  // Mantener este
  deleteUserProfileImage: 'deleteUserProfileImage',  // Mantener este
};

@Injectable({
  providedIn: 'root'
})
export class UserManagementService {
  private url: string;
  private userSubject = new BehaviorSubject<User | null>(null);
  user$ = this.userSubject.asObservable();

  constructor(
    private http: HttpClient,
    private router: Router,
    private spinnerService: SpinnerService,
    private responseHandler: ResponseHandlingService,
    private configService: ConfigService,
    private sanitizer: DomSanitizer
  ) {
    this.url = this.configService.getConfig().url;
  }

  private handleApiCall<T>(call: Observable<T>, tapHandler?: (response: any) => void): Observable<T> {
    this.spinnerService.show();
    return call.pipe(
      tap(response => {
        if (tapHandler) {
          tapHandler(response);
        }
      }),
      catchError(error => {
        this.responseHandler.handleError(error);
        return throwError(() => error);
      }),
      finalize(() => this.spinnerService.hide())
    );
  }

  private getToken(): string | null {
    return localStorage.getItem('token');
  }

  private redirectToLoginIfNoToken(): boolean {
    const token = this.getToken();
    if (!token) {
      this.router.navigate(['/auth/login']);
      return true;
    }
    return false;
  }

  setUser(user: User): void {
    this.userSubject.next(user);
  }
  getProfileImage(userId: string): Observable<SafeUrl> {
    const url = `${this.url}${API_ENDPOINTS.getUserProfileImage}/${userId}`;
    return this.http.get(url, { responseType: 'blob' }).pipe(
      map(blob => {
        const objectUrl = URL.createObjectURL(blob);
        return this.sanitizer.bypassSecurityTrustUrl(objectUrl);
      }),
      catchError(error => {
        this.responseHandler.handleError(error);
        return throwError(() => error);
      })
    );
  }



  uploadProfileImage(userId: string, formData: FormData): Observable<any> {
    const url = `${this.url}${API_ENDPOINTS.uploadProfileImage}/${userId}`;

    console.log("🚀 ~ UserManagementService ~ uploadProfileImage ~ url:", url)
    
    return this.http.post<any>(url, formData).pipe(
      switchMap(() => this.getUser()),  // Refresca los datos del usuario después de la carga
      catchError(error => {
        this.responseHandler.handleError(error);
        return throwError(() => error);
      })
    );
  }

  deleteUserProfileImage(userId: string): Observable<any> {
    const url = `${this.url}${API_ENDPOINTS.deleteUserProfileImage}/${userId}`;
    return this.http.delete<any>(url).pipe(
      switchMap(() => this.getUser()),  // Refresca los datos del usuario después de la eliminación
      catchError(error => {
        this.responseHandler.handleError(error);
        return throwError(() => error);
      })
    );
  }



  listAllUsers(filterKey?: string, filterValue?: string): Observable<ApiResponse<User[]>> {
    let params = new HttpParams();
    if (filterKey && filterValue) {
      params = params.append('type', filterKey);
      params = params.append('filter', filterValue);
    }
    const call = this.http.get<ApiResponse<User[]>>(`${this.url}${API_ENDPOINTS.listAllUsers}`, { params });
    return this.handleApiCall(call, () => { });
  }

  getUser(): Observable<ApiResponse<User>> {
    if (this.redirectToLoginIfNoToken()) return EMPTY;
    const call = this.http.get<ApiResponse<User>>(`${this.url}${API_ENDPOINTS.getUser}`);
    return this.handleApiCall(call, response => {
      if (response?.data) {
        this.setUser(response.data);
      }
    });
  }

  getUserById(id: string): Observable<ApiResponse<User>> {
    if (this.redirectToLoginIfNoToken()) return EMPTY;
    const call = this.http.get<ApiResponse<User>>(`${this.url}${API_ENDPOINTS.getUserById}/${id}`);
    return this.handleApiCall(call);
  }

  updateUser(data: any, id: string): Observable<ApiResponse<User>> {
    const call = this.http.put<ApiResponse<User>>(`${this.url}${API_ENDPOINTS.updateUser}/${id}`, data);
    return this.handleApiCall(call, response => {
      this.setUser(response.data);
    });
  }

  createUser(data: any): Observable<ApiResponse<User>> {
    const call = this.http.post<ApiResponse<User>>(`${this.url}${API_ENDPOINTS.createUser}`, data);
    return this.handleApiCall(call, response => {
      this.responseHandler.handleResponse(response);
    });
  }

  createMasterAdmin(data: any): Observable<any> {
    const call = this.http.post(`${this.url}${API_ENDPOINTS.createMasterAdmin}`, data);
    return this.handleApiCall(call, response => {
      this.responseHandler.handleResponse(response);
    });
  }

  resetPassword(token: string, newPassword: string): Observable<ApiResponse<any>> {
    const url = `${this.url}${API_ENDPOINTS.resetPassword}/${token}`;
    const body = { password: newPassword };
    const call = this.http.post<ApiResponse<any>>(url, body);
    return this.handleApiCall(call, response => {
      this.responseHandler.handleResponse(response);
    });
  }

  deleteUser(id: string): Observable<ApiResponse<any>> {
    const url = `${this.url}${API_ENDPOINTS.deleteUser}/${id}`;
    const call = this.http.delete<ApiResponse<any>>(url);
    return this.handleApiCall(call, response => {
      this.responseHandler.handleResponse(response);
    });
  }

  updateUserActiveStatus(id: string, isActive: boolean): Observable<ApiResponse<any>> {
    const url = `${this.url}${API_ENDPOINTS.updateUserActiveStatus}/${id}`;
    const body = { isActive };
    const call = this.http.patch<ApiResponse<any>>(url, body);
    return this.handleApiCall(call, response => {
      this.responseHandler.handleResponse(response);
    });
  }

  updateMultipleUserActiveStatus(userIds: string[], isActive: boolean): Observable<ApiResponse<any>> {
    const url = `${this.url}${API_ENDPOINTS.updateMultipleUserActiveStatus}`;
    const body = { userIds, isActive };
    const call = this.http.patch<ApiResponse<any>>(url, body);
    return this.handleApiCall(call, response => {
      this.responseHandler.handleResponse(response);
    });
  }
}
