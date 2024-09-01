import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, finalize, map, tap } from 'rxjs/operators';
import { ApiResponse } from '../models/api-response.model';
import { Category } from '../models/category.model';
import { SpinnerService } from './spinner.service';
import { ResponseHandlingService } from './response-handling.service';
import { ConfigService } from './config.service';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser'; // Importar SafeUrl

const API_ENDPOINTS = {
  listCategories: '/listAllCategories',
  createCategory: '/createCategory',
  updateCategory: '/updateCategory',
  deleteCategory: '/deleteCategory',
  getCategoryById: '/getCategoryById',
  uploadCategoryImage: '/uploadCategoryImage',
  getCategoryImage: '/getCategoryImage',
  deleteCategoryImage: '/deleteCategoryImage'
};

@Injectable({
  providedIn: 'root'
})
export class CategoryManagementService {
  private url: string;

  constructor(
    private http: HttpClient,
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

  listCategories(): Observable<ApiResponse<Category[]>> {
    const call = this.http.get<ApiResponse<Category[]>>(`${this.url}${API_ENDPOINTS.listCategories}`);
    return this.handleApiCall(call);
  }

  createCategory(data: any): Observable<ApiResponse<Category>> {
    const call = this.http.post<ApiResponse<Category>>(`${this.url}${API_ENDPOINTS.createCategory}`, data);
    return this.handleApiCall(call, response => {
      this.responseHandler.handleResponse(response);
    });
  }

  updateCategory(id: string, data: any): Observable<ApiResponse<Category>> {
    const call = this.http.put<ApiResponse<Category>>(`${this.url}${API_ENDPOINTS.updateCategory}/${id}`, data);
    return this.handleApiCall(call, response => {
      this.responseHandler.handleResponse(response);
    });
  }

  deleteCategory(id: string): Observable<ApiResponse<any>> {
    const call = this.http.delete<ApiResponse<any>>(`${this.url}${API_ENDPOINTS.deleteCategory}/${id}`);
    return this.handleApiCall(call, response => {
      this.responseHandler.handleResponse(response);
    });
  }

  getCategoryById(id: string): Observable<ApiResponse<Category>> {
    const call = this.http.get<ApiResponse<Category>>(`${this.url}${API_ENDPOINTS.getCategoryById}/${id}`);
    return this.handleApiCall(call, response => {
      this.responseHandler.handleResponse(response);
    });
  }

  uploadCategoryImage(id: string, imageData: FormData): Observable<ApiResponse<any>> {
    const call = this.http.post<ApiResponse<any>>(`${this.url}${API_ENDPOINTS.uploadCategoryImage}/${id}`, imageData);
    return this.handleApiCall(call, response => {
      this.responseHandler.handleResponse(response);
    });
  }

  getCategoryImage(categoryId: string): Observable<SafeUrl> {
    const url = `${this.url}${API_ENDPOINTS.getCategoryImage}/${categoryId}`;
    return this.http.get(url, { responseType: 'blob' }).pipe(
      map(blob => {
        const objectUrl = URL.createObjectURL(blob);
        return this.sanitizer.bypassSecurityTrustUrl(objectUrl);
      }),
      catchError(error => {
        console.error('Error loading category image:', error);
        return throwError(error);
      })
    );
  }

  deleteCategoryImage(id: string): Observable<ApiResponse<any>> {
    const call = this.http.delete<ApiResponse<any>>(`${this.url}${API_ENDPOINTS.deleteCategoryImage}/${id}`);
    return this.handleApiCall(call, response => {
      this.responseHandler.handleResponse(response);
    });
  }
}
