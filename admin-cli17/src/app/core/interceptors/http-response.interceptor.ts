// http-response.interceptor.ts
import { HttpInterceptorFn } from '@angular/common/http';
import { tap } from 'rxjs';

export const httpResponseInterceptor: HttpInterceptorFn = (req, next) => {
  return next(req).pipe(
    tap(event => {
      if (event.type === 4) { // HttpResponse event type
        // Puedes agregar lógica adicional si lo necesitas
        // console.log('HTTP Response received:', event); // Log adicional para depuración
      }
    })
  );
};
