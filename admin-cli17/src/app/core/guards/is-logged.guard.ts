import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, UrlTree } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Injectable({
  providedIn: 'root'
})
export class isLoggedInGuard implements CanActivate {

  constructor(
    private authService: AuthService
  ) { }

  canActivate(
    next: ActivatedRouteSnapshot,
    state: RouterStateSnapshot): boolean | UrlTree {
    const allowedRoles = ['MasterAdministrator', 'Developer', 'Customer', 'Editor', 'Guest'];
    if (this.authService.isAuthenticated(allowedRoles)) {
      return true;
    } else {
      this.authService.logoutAndRedirect();
      return false;
    }
  }
}

