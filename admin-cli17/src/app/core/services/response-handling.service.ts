import { Injectable } from '@angular/core';
import { HttpResponse, HttpErrorResponse } from '@angular/common/http';
import { of, throwError } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ResponseHandlingService {

  constructor() { }

  public handleResponse(response: HttpResponse<any>) {
    // console.log('Complete Response:', response);
    if (response.status >= 200 && response.status < 300) {
      // Respuesta exitosa
      return of({
        response: {
          status: 'Success',
          statusCode: response.status,
          message: 'Request was successful',
          data: response.body
        }
      });
    } else {
      // Respuesta con advertencias o información
      return of({
        response: {
          status: 'Warning/Info',
          statusCode: response.status,
          message: response.statusText || 'Request completed with warnings or informational status',
          data: response.body
        }
      });
    }
  }

  public handleError(error: HttpErrorResponse) {
    console.error('Complete Error:', error);
    if (error.error instanceof ErrorEvent) {
      // Error del lado del cliente o problema de red
      console.error('Client-side error:', error.error.message);
      return throwError(() => ({
        error: {
          status: 'Client Error',
          statusCode: error.status,
          message: error.error.message,
          details: 'This error occurred on the client side.'
        }
      }));
    } else {
      // Error del lado del servidor
      console.error('Server-side error:', error);
      return throwError(() => ({
        error: {
          status: error.error.status || 'error',
          statusCode: error.error.statusCode || error.status,
          message: error.error.message || 'Unknown server error occurred',
          details: error.error.details || error.message || 'No additional details available'
        }
      }));
    }
  }
}
