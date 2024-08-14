import { Injectable } from '@angular/core';
import { Observable, BehaviorSubject, throwError } from 'rxjs';
import { tap, catchError, map, finalize } from 'rxjs/operators';
import { HttpClient, HttpResponse } from '@angular/common/http';
import { ConfigService } from './config.service';
import { Country } from '../interfaces';
import { State } from '../interfaces';
import { SpinnerService } from './spinner.service';
import { ResponseHandlingService } from './response-handling.service';

const API_ENDPOINTS = {
  getCountries: 'countries',
  getStates: 'states',
  getStatesByCountry: 'states/country'
};

@Injectable({
  providedIn: 'root'
})
export class LocationDataService {

  private url: string;
  private countriesSubject = new BehaviorSubject<Country[]>([]);
  private statesSubject = new BehaviorSubject<State[]>([]);
  countries$ = this.countriesSubject.asObservable();
  states$ = this.statesSubject.asObservable();

  constructor(
    private _http: HttpClient,
    private _spinnerService: SpinnerService,
    private _responseHandler: ResponseHandlingService,
    private _configService: ConfigService
  ) { this.url = this._configService.getConfig().url; }

  private handleApiCall<T>(call: Observable<T>, tapHandler: (response: any) => void): Observable<T> {
    this._spinnerService.show();
    return call.pipe(
      tap(tapHandler),
      catchError(error => this._responseHandler.handleError(error)),
      finalize(() => this._spinnerService.hide())
    );
  }

  getCountries(): Observable<Country[]> {
    if (this.countriesSubject.getValue().length > 0) {
      return this.countries$;
    } else {
      const call = this._http.get<{ data: Country[] }>(`${this.url}${API_ENDPOINTS.getCountries}`).pipe(
        map(response => response.data)
      );
      return this.handleApiCall(call, data => {
        if (Array.isArray(data)) {
          this.countriesSubject.next(data);
          this._responseHandler.handleResponse(new HttpResponse({
            status: 200,
            body: data
          }));
        } else {
          console.error('Error: Countries data is not an array');
          this.countriesSubject.next([]);
          this._responseHandler.handleResponse(new HttpResponse({
            status: 200,
            body: []
          }));
        }
      });
    }
  }

  getStates(): Observable<State[]> {
    if (this.statesSubject.getValue().length > 0) {
      return this.states$;
    } else {
      const call = this._http.get<{ data: State[] }>(`${this.url}${API_ENDPOINTS.getStates}`).pipe(
        map(response => response.data)
      );
      return this.handleApiCall(call, data => {
        if (Array.isArray(data)) {
          this.statesSubject.next(data);
          this._responseHandler.handleResponse(new HttpResponse({
            status: 200,
            body: data
          }));
        } else {
          console.error('Error: States data is not an array');
          this.statesSubject.next([]);
          this._responseHandler.handleResponse(new HttpResponse({
            status: 200,
            body: []
          }));
        }
      });
    }
  }

  getStatesByCountry(countryId: string): Observable<State[]> {
    const call = this._http.get<{ data: State[] }>(`${this.url}${API_ENDPOINTS.getStatesByCountry}/${countryId}`).pipe(
      map(response => response.data)
    );
    return this.handleApiCall(call, data => {
      if (Array.isArray(data)) {
        this.statesSubject.next(data);
        this._responseHandler.handleResponse(new HttpResponse({
          status: 200,
          body: data
        }));
      } else {
        console.error('Error: States data is not an array');
        this.statesSubject.next([]);
        this._responseHandler.handleResponse(new HttpResponse({
          status: 200,
          body: []
        }));
      }
    });
  }
}
