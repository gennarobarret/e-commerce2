import { Injectable } from '@angular/core';
import { HttpResponse } from '@angular/common/http';
import { of } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ResponseHandlingService {

  constructor() { }

  public handleResponse(response: HttpResponse<any>) {
    console.log('Complete Response:', response);
    if (response.status >= 200 && response.status < 300) {
      // Respuesta exitosa
      // console.log('Successful response:', response.body);
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
      // console.warn('Response with warnings or info:', response);
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
}
