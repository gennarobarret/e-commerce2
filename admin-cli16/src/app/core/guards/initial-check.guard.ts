import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, Router } from '@angular/router';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { AuthService } from '../services/auth.service'; // Ajusta la ruta de importación según corresponda
import { InitialConfigService } from '../services/initial-config.service';
@Injectable({
  providedIn: 'root',
})
export class InitialCheckGuard implements CanActivate {
  constructor(
    private _authService: AuthService,
    private _router: Router,
    private _initialConfigService: InitialConfigService
  ) { }

  canActivate(
    next: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean> | Promise<boolean> | boolean {
    return this._initialConfigService.InitialCheck().pipe(
      map((response) => {
        const path = next.routeConfig && next.routeConfig.path ? next.routeConfig.path : '';
        

        const { setupRequired, verificationRequired, masterAdminRequired } = response;

        if (!masterAdminRequired) {
          this._router.navigate(['']);
          return false;
        }
        if (setupRequired) {
          this._router.navigate(['/initial-config/step1']);
          return false;
        }
        if (!verificationRequired) {
          this._router.navigate(['/auth/verification-pending']);
          return false;
        }
        return true;
      }),
      catchError(() => {
        this._router.navigate(['']);
        return of(false);
      })
    );
  }
}
