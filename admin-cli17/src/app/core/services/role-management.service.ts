import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, throwError } from 'rxjs';
import { catchError, finalize, tap } from 'rxjs/operators';
import { ApiResponse } from '../models/api-response.model';
import { Role } from '../models/role.model';
import { SpinnerService } from './spinner.service';
import { ResponseHandlingService } from './response-handling.service';
import { ConfigService } from './config.service';

const API_ENDPOINTS = {
  listRoles: 'listRoles',
  createRole: 'createRole',
  updateRole: 'updateRole',
  deleteRole: 'deleteRole',
  getRoleById: 'getRoleById'
};

@Injectable({
  providedIn: 'root'
})
export class RoleManagementService {
  private url: string;

  constructor(
    private http: HttpClient,
    private router: Router,
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

  listRoles(): Observable<ApiResponse<Role[]>> {
    const call = this.http.get<ApiResponse<Role[]>>(`${this.url}${API_ENDPOINTS.listRoles}`);
    return this.handleApiCall(call);
  }

  createRole(data: any): Observable<ApiResponse<Role>> {
    const call = this.http.post<ApiResponse<Role>>(`${this.url}${API_ENDPOINTS.createRole}`, data);
    return this.handleApiCall(call, response => {
      this.responseHandler.handleResponse(response);
    });
  }

  updateRole(id: string, data: any): Observable<ApiResponse<Role>> {
    const call = this.http.put<ApiResponse<Role>>(`${this.url}${API_ENDPOINTS.updateRole}/${id}`, data);
    return this.handleApiCall(call, response => {
      this.responseHandler.handleResponse(response);
    });
  }

  deleteRole(id: string): Observable<ApiResponse<any>> {
    const call = this.http.delete<ApiResponse<any>>(`${this.url}${API_ENDPOINTS.deleteRole}/${id}`);
    return this.handleApiCall(call, response => {
      this.responseHandler.handleResponse(response);
    });
  }

  getRoleById(id: string): Observable<ApiResponse<Role>> {
    const call = this.http.get<ApiResponse<Role>>(`${this.url}${API_ENDPOINTS.getRoleById}/${id}`);
    return this.handleApiCall(call, response => {
      this.responseHandler.handleResponse(response);
    });
  }
}