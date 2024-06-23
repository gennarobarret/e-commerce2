import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { InitialConfigService } from '../services/initial-config.service';
import { first } from 'rxjs/operators';
@Injectable({
  providedIn: 'root',
})
export class initialConfigGuard implements CanActivate {
  constructor(
    private _initialConfigService: InitialConfigService,
    private _router: Router
  ) { }
  
  canActivate(): Observable<boolean> | Promise<boolean> | boolean {
    return this._initialConfigService.InitialCheck().pipe(
      map(check => {
        if (check.setupRequired) {
          this._router.navigate(['/initial-config/step1']);
          return false;
        }
        return true;
      })
    );
  }
  
}