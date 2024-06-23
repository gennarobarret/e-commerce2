import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { GLOBAL } from '../config/GLOBAL';

@Injectable({
  providedIn: 'root'
})
export class BusinessConfigService {

  private url: string = GLOBAL.url;

  constructor(private _http: HttpClient) { }

  // Obtener la configuración actual del negocio
  getBusinessConfig(): Observable<any> {
    return this._http.get(`${this.url}/getBusinessConfig`).pipe(
      map(response => response),
      catchError(error => {
        console.error('Error getting business config:', error);
        return of(null);
      })
    );
  }

  // Crear o actualizar la configuración del negocio
  saveBusinessConfig(configData: any): Observable<any> {
    return this._http.post(`${this.url}/saveBusinessConfig`, configData).pipe(
      catchError(error => {
        console.error('Error saving business config:', error);
        return of(null);
      })
    );
  }

  // Ejemplo de método para actualizar la configuración del negocio, si decides separar la creación de la actualización
  updateBusinessConfig(businessConfigId: string, configData: any): Observable<any> {
    return this._http.put(`${this.url}/updateBusinessConfig/${businessConfigId}`, configData).pipe(
      catchError(error => {
        console.error('Error updating business config:', error);
        return of(null);
      })
    );
  }
}