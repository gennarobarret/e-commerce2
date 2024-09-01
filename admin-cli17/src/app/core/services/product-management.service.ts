import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, throwError } from 'rxjs';
import { catchError, finalize, map, tap } from 'rxjs/operators';
import { ApiResponse } from '../models/api-response.model';
import { Product } from '../models/product.model';
import { SpinnerService } from './spinner.service';
import { ResponseHandlingService } from './response-handling.service';
import { ConfigService } from './config.service';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';

const API_ENDPOINTS = {
  listProducts: '/listAllProducts',
  createProduct: '/createProduct',
  updateProduct: '/updateProduct',
  deleteProduct: '/deleteProduct',
  getProductById: '/getProductById',
  uploadProductImage: '/uploadProductImage',
  deleteProductImage: '/deleteProductImage',
  getProductImage: '/getProductImage'
};

@Injectable({
  providedIn: 'root'
})
export class ProductManagementService {
  private url: string;

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

  listProducts(): Observable<ApiResponse<Product[]>> {
    const call = this.http.get<ApiResponse<Product[]>>(`${this.url}${API_ENDPOINTS.listProducts}`);
    return this.handleApiCall(call);
  }

  createProduct(data: any): Observable<ApiResponse<Product>> {
    const call = this.http.post<ApiResponse<Product>>(`${this.url}${API_ENDPOINTS.createProduct}`, data);
    return this.handleApiCall(call, response => {
      this.responseHandler.handleResponse(response);
    });
  }

  updateProduct(id: string, data: any): Observable<ApiResponse<Product>> {
    const call = this.http.put<ApiResponse<Product>>(`${this.url}${API_ENDPOINTS.updateProduct}/${id}`, data);
    return this.handleApiCall(call, response => {
      this.responseHandler.handleResponse(response);
    });
  }

  deleteProduct(id: string): Observable<ApiResponse<any>> {
    const call = this.http.delete<ApiResponse<any>>(`${this.url}${API_ENDPOINTS.deleteProduct}/${id}`);
    return this.handleApiCall(call, response => {
      this.responseHandler.handleResponse(response);
    });
  }

  getProductById(id: string): Observable<ApiResponse<Product>> {
    const call = this.http.get<ApiResponse<Product>>(`${this.url}${API_ENDPOINTS.getProductById}/${id}`);
    return this.handleApiCall(call, response => {
      this.responseHandler.handleResponse(response);
    });
  }

  // Método para subir imágenes (tanto portada como galería)
  private createFormData(files: File[], type: 'cover' | 'gallery'): FormData {
    const formData = new FormData();
    if (type === 'cover') {
      formData.append('image', files[0]);
    } else {
      files.forEach(file => formData.append('images', file));
    }
    return formData;
  }

  uploadProductImage(id: string, type: 'cover' | 'gallery', files: File[]): Observable<ApiResponse<any>> {
    const formData = this.createFormData(files, type);
    const call = this.http.post<ApiResponse<any>>(`${this.url}${API_ENDPOINTS.uploadProductImage}/${id}/${type}`, formData);
    return this.handleApiCall(call, response => {
      this.responseHandler.handleResponse(response);
    });
  }



  deleteProductImage(id: string): Observable<ApiResponse<any>> {
    const call = this.http.delete<ApiResponse<any>>(`${this.url}${API_ENDPOINTS.deleteProductImage}/${id}`);
    return this.handleApiCall(call, response => {
      this.responseHandler.handleResponse(response);
    });
  }

  getProductImage(productId: string, type: 'cover' | 'gallery', imageId?: string): Observable<SafeUrl> {
    let url = `${this.url}/getProductImage/${productId}/${type}`;
    if (type === 'gallery' && imageId) {
      url += `/${imageId}`;
    }

    return this.http.get(url, { responseType: 'blob' }).pipe(
      map(blob => {
        const objectUrl = URL.createObjectURL(blob);
        return this.sanitizer.bypassSecurityTrustUrl(objectUrl);
      }),
      catchError(error => {
        console.error('Error loading product image:', error);
        return throwError(error);
      })
    );
  }


}
