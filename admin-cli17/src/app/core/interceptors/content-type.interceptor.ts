// content-type.interceptor.ts
import { HttpInterceptorFn } from '@angular/common/http';

export const contentTypeInterceptor: HttpInterceptorFn = (req, next) => {
  if (!(req.body instanceof FormData)) {
    req = req.clone({
      setHeaders: {
        'Content-Type': 'application/json'
      }
    });
  }

  return next(req);
};
