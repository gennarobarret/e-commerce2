import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, BehaviorSubject, throwError, EMPTY } from 'rxjs';
import { catchError, finalize, map, tap } from 'rxjs/operators';
import { ApiResponse } from '../models/api-response.model';
import { User, UserWithToken, LoginCredentials } from '../models/user.model';
import { SpinnerService } from './spinner.service';
import { ResponseHandlingService } from './response-handling.service';
import { ConfigService } from './config.service';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';

const API_ENDPOINTS = {
  updateProfileImage: 'updateProfileImage',
  getUser: 'getUser',
  getProfileImage: 'getProfileImage',
  getUserById: 'getUserById',
  createUser: 'createUser',
  createMasterAdmin: 'createMasterAdmin',
  updateUser: 'updateUser',
  listAllUsers: 'listAllUsers'
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
  ) { this.url = this.configService.getConfig().url; }

  private handleApiCall<T>(call: Observable<T>, tapHandler: (response: any) => void): Observable<T> {
    this.spinnerService.show();
    return call.pipe(
      tap(tapHandler),
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

  getProfileImage(imageFileName: string): Observable<SafeUrl> {
    const url = `${this.url}${API_ENDPOINTS.getProfileImage}/${imageFileName}`;
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



  updateProfileImage(userName: string, formData: FormData): Observable<any> {
    const url = `${this.url}${API_ENDPOINTS.updateProfileImage}/${userName}`;
    return this.http.put<any>(url, formData);
  }


  getUser(): Observable<ApiResponse<User>> {
    if (this.redirectToLoginIfNoToken()) return EMPTY;

    const call = this.http.get<ApiResponse<User>>(`${this.url}${API_ENDPOINTS.getUser}`);
    return this.handleApiCall(call, response => {
      if (response?.data) {
        this.userSubject.next(response.data);
      }
    });
  }

  getUserById(id: string): Observable<ApiResponse<User>> {
    if (this.redirectToLoginIfNoToken()) return EMPTY;
    
    const call = this.http.get<ApiResponse<User>>(`${this.url}${API_ENDPOINTS.getUserById}/${id}`);
    return this.handleApiCall(call, response => {
      if (response?.data) {
        this.userSubject.next(response.data);
      }
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

  updateUser(data: any, id: string): Observable<ApiResponse<User>> {
    const call = this.http.put<ApiResponse<User>>(`${this.url}${API_ENDPOINTS.updateUser}/${id}`, data);
    console.log("🚀 ~ UserManagementService ~ updateUser ~ call:", call)
    return this.handleApiCall(call, response => {
      
      this.responseHandler.handleResponse(response);
    });
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
  
}
