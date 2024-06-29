import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { catchError, finalize, tap } from 'rxjs/operators';
import { ApiResponse } from '../models/api-response.model';
import { SpinnerService } from './spinner.service';
import { ResponseHandlingService } from './response-handling.service';
import { ConfigService } from './config.service';
import { Notification } from '../models';

const API_ENDPOINTS = {
  getNotifications: 'notifications',
  markAsViewed: 'notifications/:id/view',
  deleteNotification: 'notifications/:id',
  deleteAllViewed: 'notifications/viewed/all'
};

@Injectable({
  providedIn: 'root',
})
export class NotificationService {

  private url: string;

  constructor(
    private _http: HttpClient,
    private _spinnerService: SpinnerService,
    private _responseHandler: ResponseHandlingService,
    private _configService: ConfigService
  ) {
    this.url = this._configService.getConfig().url;
  }

  private handleApiCall<T>(call: Observable<T>, tapHandler: (response: any) => void): Observable<T> {
    this._spinnerService.show();
    return call.pipe(
      tap(tapHandler),
      catchError(error => this._responseHandler.handleError(error)),
      finalize(() => this._spinnerService.hide())
    );
  }

  getNotifications(): Observable<ApiResponse<{ notifications: Notification[] }>> {
    const call = this._http.get<ApiResponse<{ notifications: Notification[] }>>(`${this.url}${API_ENDPOINTS.getNotifications}`);
    return this.handleApiCall(call, response => {
      if (response.status === 'success' && Array.isArray(response.data.notifications)) {
        // console.log('Notifications retrieved successfully:', response.data.notifications);
      } else {
        throw new Error('Failed to retrieve notifications');
      }
    });
  }

  markAsViewed(notificationId: string): Observable<ApiResponse<Notification>> {
    const url = `${this.url}${API_ENDPOINTS.markAsViewed.replace(':id', notificationId)}`;
    const call = this._http.patch<ApiResponse<Notification>>(url, {});
    return this.handleApiCall(call, response => {
      if (response.status === 'success') {
        // console.log('Notification marked as viewed:', response.data);
      } else {
        throw new Error('Failed to mark notification as viewed');
      }
    });
  }

  deleteNotification(notificationId: string): Observable<ApiResponse<null>> {
    const url = `${this.url}${API_ENDPOINTS.deleteNotification.replace(':id', notificationId)}`;
    const call = this._http.delete<ApiResponse<null>>(url);
    return this.handleApiCall(call, response => {
      if (response.status === 'success') {
        console.log('Notification deleted:', response.data);
      } else {
        throw new Error('Failed to delete notification');
      }
    });
  }

  deleteAllViewed(): Observable<ApiResponse<null>> {
    const call = this._http.delete<ApiResponse<null>>(`${this.url}${API_ENDPOINTS.deleteAllViewed}`);
    return this.handleApiCall(call, response => {
      if (response.status === 'success') {
        console.log('All viewed notifications deleted:', response.data);
      } else {
        throw new Error('Failed to delete all viewed notifications');
      }
    });
  }
}
