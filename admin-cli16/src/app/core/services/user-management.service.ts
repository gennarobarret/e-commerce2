import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, BehaviorSubject, throwError, EMPTY } from 'rxjs';
import { catchError, finalize, tap } from 'rxjs/operators';
import { User, UserWithToken } from '../interfaces/user.interface';
import { ApiResponse } from '../../core/interfaces';
import { GLOBAL } from '../config/GLOBAL';
import { ResponseHandlingService } from './response-handling.service';
import { ErrorHandlingService } from './error-handling.service';
import { SpinnerService } from './spinner.service';

const API_ENDPOINTS = {
  updateProfileImage: 'updateUserImage',
  getUser: 'getUser',
  getUserImageUrl: 'getUserImage',
  getUserById: 'getUserById',
  createUser: 'createUser',
  updateUser: 'updateUser',
  listAllUsers: 'listAllUsers'
};

@Injectable({
  providedIn: 'root'
})
export class UserManagementService {
  private url: string = GLOBAL.url;
  private userSubject = new BehaviorSubject<User | null>(null);
  user$ = this.userSubject.asObservable();

  constructor(
    private http: HttpClient,
    private router: Router,
    private responseHandler: ResponseHandlingService,
    private errorHandler: ErrorHandlingService,
    private spinnerService: SpinnerService
  ) { }

  private handleApiCall<T>(call: Observable<T>, tapHandler: (response: any) => void): Observable<T> {
    this.spinnerService.show();
    return call.pipe(
      tap(tapHandler),
      catchError(error => {
        this.errorHandler.handleError(error);
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

  getUserImageUrl(profileImage: string): Observable<Blob> {
    const call = this.http.get<Blob>(`${this.url}${API_ENDPOINTS.getUserImageUrl}/${profileImage}`, { responseType: 'blob' as 'json' });
    return this.handleApiCall(call, response => {
      this.responseHandler.handleResponse(response);
    });
  }

  updateProfileImage(userId: string, formData: FormData): Observable<any> {
    const url = `${this.url}${API_ENDPOINTS.updateProfileImage}/${userId}`;
    const call = this.http.put<any>(url, formData);
    return this.handleApiCall(call, response => {
      this.responseHandler.handleResponse(response);
    });
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


  createUser(data: FormData): Observable<ApiResponse<User>> {
    const call = this.http.post<ApiResponse<User>>(`${this.url}${API_ENDPOINTS.createUser}`, data);
    return this.handleApiCall(call, response => {
      this.responseHandler.handleResponse(response);
    });
  }

  updateUser(data: FormData, id: string): Observable<ApiResponse<User>> {
    const call = this.http.put<ApiResponse<User>>(`${this.url}${API_ENDPOINTS.updateUser}/${id}`, data);
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

// import { Injectable } from '@angular/core';
// import { HttpClient, HttpParams } from '@angular/common/http';
// import { Router } from '@angular/router';
// import { Observable, BehaviorSubject, throwError, EMPTY } from 'rxjs';
// import { catchError, finalize, tap } from 'rxjs/operators';
// import { User, UserWithToken } from '../interfaces/user.interface';
// import { ApiResponse } from '../../core/interfaces';
// import { GLOBAL } from '../config/GLOBAL';
// import { ResponseHandlingService } from './response-handling.service';
// import { ErrorHandlingService } from './error-handling.service';
// import { SpinnerService } from './spinner.service';

// const API_ENDPOINTS = {
//   updateProfileImage: 'updateUserImage',
//   getUser: 'getUser',
//   getUserImageUrl: 'getUserImage',
//   getUserById: 'getUserById',
//   createUser: 'createUser',
//   updateUser: 'updateUser',
//   listAllUsers: 'listAllUsers'
// };

// @Injectable({
//   providedIn: 'root'
// })
// export class UserManagementService {
//   private url: string = GLOBAL.url;
//   private userSubject = new BehaviorSubject<User | null>(null);
//   user$ = this.userSubject.asObservable();

//   constructor(
//     private _http: HttpClient,
//     private _router: Router,
//     private _responseHandler: ResponseHandlingService,
//     private _errorHandler: ErrorHandlingService,
//     private _spinnerService: SpinnerService
//   ) { }

//   private handleApiCall<T>(call: Observable<T>, tapHandler: (response: any) => void): Observable<T> {
//     this._spinnerService.show();
//     return call.pipe(
//       tap(tapHandler),
//       catchError(error => {
//         this._errorHandler.handleError(error);
//         return throwError(() => error);
//       }),
//       finalize(() => this._spinnerService.hide())
//     );
//   }

//   private getToken(): string | null {
//     return localStorage.getItem('token');
//   }

//   getUserImageUrl(profileImage: string): Observable<Blob> {
//     const call = this._http.get<Blob>(`${this.url}${API_ENDPOINTS.getUserImageUrl}/${profileImage}`, { responseType: 'blob' as 'json' });
//     return this.handleApiCall(call, response => {
//       this._responseHandler.handleResponse(response);
//     });
//   }

//   updateProfileImage(userId: string, formData: FormData): Observable<any> {
//     const url = `${this.url}${API_ENDPOINTS.updateProfileImage}/${userId}`;
//     const call = this._http.put<any>(url, formData);
//     return this.handleApiCall(call, response => {
//       this._responseHandler.handleResponse(response);
//     });
//   }

//   getUser(): Observable<ApiResponse<User>> {
//     const token = this.getToken();
//     if (!token) {
//       this._router.navigate(['/auth/login']);
//       return EMPTY;
//     }
//     const call = this._http.get<ApiResponse<User>>(`${this.url}${API_ENDPOINTS.getUser}`);
//     return this.handleApiCall(call, response => {
//       if (response && response.data) {
//         this.userSubject.next(response.data);
//       }
//     });
//   }

//   getUserById(id: string): Observable<ApiResponse<User>> {
//     const token = this.getToken();
//     if (!token) {
//       this._router.navigate(['/auth/login']);
//       return EMPTY;
//     }
//     const call = this._http.get<ApiResponse<User>>(`${this.url}${API_ENDPOINTS.getUserById}/${id}`);
//     return this.handleApiCall(call, () => { });
//   }

//   createUser(data: FormData): Observable<ApiResponse<User>> {
//     const call = this._http.post<ApiResponse<User>>(`${this.url}${API_ENDPOINTS.createUser}`, data);
//     return this.handleApiCall(call, response => {
//       this._responseHandler.handleResponse(response);
//     });
//   }

//   updateUser(data: FormData, id: string): Observable<ApiResponse<User>> {
//     const call = this._http.put<ApiResponse<User>>(`${this.url}${API_ENDPOINTS.updateUser}/${id}`, data);
//     return this.handleApiCall(call, response => {
//       this._responseHandler.handleResponse(response);
//     });
//   }

//   listAllUsers(filterKey?: string, filterValue?: string): Observable<ApiResponse<User[]>> {
//     let params = new HttpParams();
//     if (filterKey && filterValue) {
//       params = params.append('type', filterKey);
//       params = params.append('filter', filterValue);
//     }
//     const call = this._http.get<ApiResponse<User[]>>(`${this.url}${API_ENDPOINTS.listAllUsers}`, { params });
//     return this.handleApiCall(call, () => { });
//   }
// }


// // // Angular core and related imports
// // import { Injectable } from '@angular/core';
// // import { HttpClient, HttpParams } from '@angular/common/http';
// // import { Router } from '@angular/router';

// // // RxJS imports
// // import { Observable, Subject, catchError, finalize, tap, throwError, EMPTY } from 'rxjs';

// // // Application-specific interfaces
// // import { User, UserWithToken } from '../interfaces/user.interface';
// // import { ApiResponse } from '../../core/interfaces';

// // // Configuration and services
// // import { GLOBAL } from '../config/GLOBAL';
// // import { ResponseHandlingService } from './response-handling.service';
// // import { ErrorHandlingService } from './error-handling.service';
// // import { SpinnerService } from './spinner.service';

// // // Helper to manage API endpoints in a centralized way
// // const API_ENDPOINTS = {
// //   updateProfileImage: 'updateUserImage',
// //   getUser: 'getUser',
// //   getUserImageUrl: 'getUserImage',
// //   getUserById: 'getUserById',
// //   createUser: 'createUser',
// //   updateUser: 'updateUser',
// //   listAllUsers: 'listAllUsers'
// // };

// // @Injectable({
// //   providedIn: 'root'
// // })
// // export class UserManagementService {
// //   private url: string = GLOBAL.url;

// //   constructor(
// //     private _http: HttpClient,
// //     private _router: Router,
// //     private _responseHandler: ResponseHandlingService,
// //     private _errorHandler: ErrorHandlingService,
// //     private _spinnerService: SpinnerService
// //   ) { }

// //   private handleApiCall<T>(call: Observable<T>, tapHandler: (response: any) => void): Observable<T> {
// //     this._spinnerService.show();
// //     return call.pipe(
// //       tap(tapHandler),
// //       catchError(error => {
// //         this._errorHandler.handleError(error);
// //         return throwError(() => error);
// //       }),
// //       finalize(() => this._spinnerService.hide())
// //     );
// //   }

// //   private getToken(): string | null {
// //     return localStorage.getItem('token');
// //   }


// //   getUserImageUrl(profileImage: string): Observable<Blob> {
// //     const call = this._http.get<Blob>(`${this.url}${API_ENDPOINTS.getUserImageUrl}/${profileImage}`, { responseType: 'blob' as 'json' });
// //     return this.handleApiCall(call, response => {
// //       this._responseHandler.handleResponse(response);
// //     });
// //   }


// //   updateProfileImage(userId: string, formData: FormData): Observable<any> {
// //     const url = `${this.url}${API_ENDPOINTS.updateProfileImage}/${userId}`;
// //     const call = this._http.put<any>(url, formData);
// //     return this.handleApiCall(call, response => {
// //       this._responseHandler.handleResponse(response);
// //     });
// //   }


// //   getUser(): Observable<ApiResponse<User>> {
// //     const token = this.getToken();
// //     if (!token) {
// //       this._router.navigate(['/auth/login']);
// //       return EMPTY;
// //     }
// //     const call = this._http.get<ApiResponse<User>>(`${this.url}${API_ENDPOINTS.getUser}`);
// //     return this.handleApiCall(call, () => { });
// //   }


// //   getUserById(id: string): Observable<ApiResponse<User>> {
// //     const token = this.getToken();
// //     if (!token) {
// //       this._router.navigate(['/auth/login']);
// //       return EMPTY;
// //     }
// //     const call = this._http.get<ApiResponse<User>>(`${this.url}${API_ENDPOINTS.getUserById}/${id}`);
// //     return this.handleApiCall(call, () => { });
// //   }

// //   createUser(data: FormData): Observable<ApiResponse<User>> {
// //     const call = this._http.post<ApiResponse<User>>(`${this.url}${API_ENDPOINTS.createUser}`, data);
// //     return this.handleApiCall(call, response => {
// //       this._responseHandler.handleResponse(response);
// //     });
// //   }

// //   updateUser(data: FormData, id: string): Observable<ApiResponse<User>> {
// //     const call = this._http.put<ApiResponse<User>>(`${this.url}${API_ENDPOINTS.updateUser}/${id}`, data);
// //     return this.handleApiCall(call, response => {
// //       this._responseHandler.handleResponse(response);
// //     });
// //   }


// //   listAllUsers(filterKey?: string, filterValue?: string): Observable<ApiResponse<User[]>> {
// //     let params = new HttpParams();
// //     if (filterKey && filterValue) {
// //       params = params.append('type', filterKey);
// //       params = params.append('filter', filterValue);
// //     }
// //     const call = this._http.get<ApiResponse<User[]>>(`${this.url}${API_ENDPOINTS.listAllUsers}`, { params });
// //     return this.handleApiCall(call, () => { });
// //   }
// // }
