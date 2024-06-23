import { Injectable } from '@angular/core';
import { Observable, BehaviorSubject, throwError } from 'rxjs';
import { tap, catchError, map, finalize } from 'rxjs/operators';
import { HttpClient, HttpResponse } from '@angular/common/http';
import { GLOBAL } from 'src/app/core/config/GLOBAL';
import { Country } from 'src/app/core/interfaces/country.interface';
import { State } from 'src/app/core/interfaces/state.interface';
import { ErrorHandlingService } from 'src/app/core/services/error-handling.service';
import { SpinnerService } from 'src/app/core/services/spinner.service';
import { ResponseHandlingService } from 'src/app/core/services/response-handling.service';

const API_ENDPOINTS = {
  getCountries: 'countries',
  getStates: 'states',
  getStatesByCountry: 'states/country'
};

@Injectable({
  providedIn: 'root'
})
export class GeoInfoService {
  private url = GLOBAL.url;
  private countriesSubject = new BehaviorSubject<Country[]>([]);
  private statesSubject = new BehaviorSubject<State[]>([]);
  countries$ = this.countriesSubject.asObservable();
  states$ = this.statesSubject.asObservable();

  constructor(
    private http: HttpClient,
    private errorHandler: ErrorHandlingService,
    private spinnerService: SpinnerService,
    private responseHandler: ResponseHandlingService
  ) { }

  private handleApiCall<T>(call: Observable<T>, tapHandler: (response: any) => void): Observable<T> {
    this.spinnerService.show();
    return call.pipe(
      tap(tapHandler),
      catchError(error => {
        this.errorHandler.handleError(error);
        return throwError(() => error);
      }),
      finalize(() => this.spinnerService.hide())
    );
  }

  getCountries(): Observable<Country[]> {
    if (this.countriesSubject.getValue().length > 0) {
      return this.countries$;
    } else {
      const call = this.http.get<{ data: Country[] }>(`${this.url}${API_ENDPOINTS.getCountries}`).pipe(
        map(response => response.data)
      );
      return this.handleApiCall(call, data => {
        if (Array.isArray(data)) {
          this.countriesSubject.next(data);
          this.responseHandler.handleResponse(new HttpResponse({
            status: 200,
            body: data
          }));
        } else {
          console.error('Error: Countries data is not an array');
          this.countriesSubject.next([]);
          this.responseHandler.handleResponse(new HttpResponse({
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
      const call = this.http.get<{ data: State[] }>(`${this.url}${API_ENDPOINTS.getStates}`).pipe(
        map(response => response.data)
      );
      return this.handleApiCall(call, data => {
        if (Array.isArray(data)) {
          this.statesSubject.next(data);
          this.responseHandler.handleResponse(new HttpResponse({
            status: 200,
            body: data
          }));
        } else {
          console.error('Error: States data is not an array');
          this.statesSubject.next([]);
          this.responseHandler.handleResponse(new HttpResponse({
            status: 200,
            body: []
          }));
        }
      });
    }
  }

  getStatesByCountry(countryId: string): Observable<State[]> {
    const call = this.http.get<{ data: State[] }>(`${this.url}${API_ENDPOINTS.getStatesByCountry}/${countryId}`).pipe(
      map(response => response.data)
    );
    return this.handleApiCall(call, data => {
      if (Array.isArray(data)) {
        this.statesSubject.next(data);
        this.responseHandler.handleResponse(new HttpResponse({
          status: 200,
          body: data
        }));
      } else {
        console.error('Error: States data is not an array');
        this.statesSubject.next([]);
        this.responseHandler.handleResponse(new HttpResponse({
          status: 200,
          body: []
        }));
      }
    });
  }
}
