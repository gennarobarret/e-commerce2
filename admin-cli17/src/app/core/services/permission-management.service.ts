import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, finalize, tap } from 'rxjs/operators';
import { ApiResponse } from '../models/api-response.model';
import { Permission } from '../models/permission.model';
import { SpinnerService } from './spinner.service';
import { ResponseHandlingService } from './response-handling.service';
import { ConfigService } from './config.service';

const API_ENDPOINTS = {
  listPermissions: 'listPermissions', 
  createPermission: 'createPermission',
  updatePermission: 'updatePermission',
  deletePermission: 'deletePermission',
  getPermissionById: 'getPermissionById'
};

@Injectable({
  providedIn: 'root'
})
export class PermissionManagementService {
  private url: string;

  constructor(
    private http: HttpClient,
    private spinnerService: SpinnerService,
    private responseHandler: ResponseHandlingService,
    private configService: ConfigService
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

  listPermissions(): Observable<ApiResponse<Permission[]>> {
    const call = this.http.get<ApiResponse<Permission[]>>(`${this.url}${API_ENDPOINTS.listPermissions}`);
    return this.handleApiCall(call);
  }

  createPermission(data: any): Observable<ApiResponse<Permission>> {
    const call = this.http.post<ApiResponse<Permission>>(`${this.url}${API_ENDPOINTS.createPermission}`, data);
    return this.handleApiCall(call, response => {
      this.responseHandler.handleResponse(response);
    });
  }

  updatePermission(id: string, data: any): Observable<ApiResponse<Permission>> {
    const call = this.http.put<ApiResponse<Permission>>(`${this.url}${API_ENDPOINTS.updatePermission}/${id}`, data);
    return this.handleApiCall(call, response => {
      this.responseHandler.handleResponse(response);
    });
  }

  deletePermission(id: string): Observable<ApiResponse<any>> {
    const call = this.http.delete<ApiResponse<any>>(`${this.url}${API_ENDPOINTS.deletePermission}/${id}`);
    return this.handleApiCall(call, response => {
      this.responseHandler.handleResponse(response);
    });
  }

  getPermissionById(id: string): Observable<ApiResponse<Permission>> {
    const call = this.http.get<ApiResponse<Permission>>(`${this.url}${API_ENDPOINTS.getPermissionById}/${id}`);
    return this.handleApiCall(call, response => {
      this.responseHandler.handleResponse(response);
    });
  }
}
