// http-error.interceptor.ts
import { HttpInterceptorFn } from '@angular/common/http';
import { catchError, throwError } from 'rxjs';

export const httpErrorInterceptor: HttpInterceptorFn = (req, next) => {
  return next(req).pipe(
    catchError((error) => {
      // console.error('HTTP Error:', error);
      return throwError(() => ({
        status: error.status,
        message: error.message,
        error: error.error
      }));
    })
  );
};
