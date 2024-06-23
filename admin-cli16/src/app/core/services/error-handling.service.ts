import { Injectable } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { throwError } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ErrorHandlingService {

  constructor() { }

  public handleError(error: HttpErrorResponse) {
    // console.error('Complete Error:', error);
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

