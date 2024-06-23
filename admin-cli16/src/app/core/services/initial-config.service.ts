import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { GLOBAL } from '../config/GLOBAL';
import { Observable, catchError, map, of } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class InitialConfigService {

  private url: string = GLOBAL.url;

  constructor(private _http: HttpClient, private _router: Router) { }

  InitialCheck(): Observable<{ setupRequired: boolean, verificationRequired: boolean, masterAdminRequired: boolean }> {
    console.log('Haciendo la petición a InitialCheck');

    return this._http.get<{ status: string, message: string, data: { setupRequired: boolean, verificationRequired: boolean, masterAdminRequired: boolean } }>(`${this.url}/InitialCheck`)
      .pipe(
        map(response => {
          console.log('Respuesta de InitialCheck:', response);
          return response.data;
        }),
        catchError(error => {
          console.error('Error en InitialCheck:', error);
          // Aquí simplemente retornamos valores predeterminados, pero podrías manejar el error de forma más específica.
          return of({ setupRequired: false, verificationRequired: false, masterAdminRequired: false });
        })
      );
  }

}
