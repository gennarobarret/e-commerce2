import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, throwError } from 'rxjs';
import { catchError, finalize, tap } from 'rxjs/operators';
import { ApiResponse } from '../models/api-response.model';
import { Subcategory } from '../models/subcategory.model';
import { SpinnerService } from './spinner.service';
import { ResponseHandlingService } from './response-handling.service';
import { ConfigService } from './config.service';

const API_ENDPOINTS = {
  listSubcategories: '/listAllSubcategories',
  listSubcategoriesByCategory: '/listSubcategoriesByCategory',
  createSubcategory: '/createSubcategory',
  updateSubcategory: '/updateSubcategory',
  deleteSubcategory: '/deleteSubcategory',
  getSubcategoryById: '/getSubcategoryById'
};

@Injectable({
  providedIn: 'root'
})
export class SubcategoryManagementService {
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

  listSubcategories(): Observable<ApiResponse<Subcategory[]>> {
    const call = this.http.get<ApiResponse<Subcategory[]>>(`${this.url}${API_ENDPOINTS.listSubcategories}`);
    return this.handleApiCall(call);
  }

  listSubcategoriesByCategory(categoryId: string): Observable<ApiResponse<Subcategory[]>> {
    const call = this.http.get<ApiResponse<Subcategory[]>>(`${this.url}${API_ENDPOINTS.listSubcategoriesByCategory}/${categoryId}`);
    return this.handleApiCall(call);
  }

  createSubcategory(data: any): Observable<ApiResponse<Subcategory>> {
    const call = this.http.post<ApiResponse<Subcategory>>(`${this.url}${API_ENDPOINTS.createSubcategory}`, data);
    return this.handleApiCall(call, response => {
      this.responseHandler.handleResponse(response);
    });
  }

  updateSubcategory(id: string, data: any): Observable<ApiResponse<Subcategory>> {
    const call = this.http.put<ApiResponse<Subcategory>>(`${this.url}${API_ENDPOINTS.updateSubcategory}/${id}`, data);
    return this.handleApiCall(call, response => {
      this.responseHandler.handleResponse(response);
    });
  }

  deleteSubcategory(id: string): Observable<ApiResponse<any>> {
    const call = this.http.delete<ApiResponse<any>>(`${this.url}${API_ENDPOINTS.deleteSubcategory}/${id}`);
    return this.handleApiCall(call, response => {
      this.responseHandler.handleResponse(response);
    });
  }

  getSubcategoryById(id: string): Observable<ApiResponse<Subcategory>> {
    const call = this.http.get<ApiResponse<Subcategory>>(`${this.url}${API_ENDPOINTS.getSubcategoryById}/${id}`);
    return this.handleApiCall(call, response => {
      this.responseHandler.handleResponse(response);
    });
  }
}
