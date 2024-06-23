import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { ConfigService } from './config.service';
import { SocketService } from './socket.service';
import { ResponseHandlingService } from './response-handling.service';

@Injectable({
  providedIn: 'root'
})
export class AlertService {
  private url: string;

  constructor(
    private http: HttpClient,
    private configService: ConfigService,
    private socketService: SocketService,
    private responseHandlingService: ResponseHandlingService
  ) {
    this.url = `${this.configService.getConfig().url}alerts`; // Ajuste en la URL base
  }


  // Método para obtener alertas con filtros y paginación
  getAlerts(page: number = 1, limit: number = 10, filters: any = {}): Observable<any> {
    let params = { page: `${page}`, limit: `${limit}`, ...filters };
    return this.http.get<any>(`${this.url}/getAllAlerts`, { params })
      .pipe(
        map((response) => {
          console.log('Response from API:', response);
          if (response.status === 'success') {
            return response.data; // Retornamos directamente los datos
          } else {
            throw new Error('Unexpected API response structure');
          }
        }),
        catchError((error: HttpErrorResponse) => this.responseHandlingService.handleError(error))
      );
  }

  // Método para marcar una alerta como vista
  markAlertAsSeen(alertId: string): Observable<any> {
    return this.http.patch<any>(`${this.url}/markAsSeen/${alertId}`, {}) // Verifica que la URL se construye correctamente
      .pipe(
        map((response) => {
          console.log('Mark as seen response:', response);
          if (response.status === 'success') {
            return response.data;
          } else {
            throw new Error('Unexpected API response structure');
          }
        }),
        catchError((error: HttpErrorResponse) => {
          console.error('HTTP error occurred:', error);
          return this.responseHandlingService.handleError(error);
        })
      );
  }



  // Método para suscribirse a alertas en tiempo real
  getRealTimeAlerts(): Observable<any> {
    return this.socketService.onAlert();
  }
}
