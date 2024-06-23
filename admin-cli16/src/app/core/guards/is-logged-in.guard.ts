//is-logged-in.guard.ts

import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, UrlTree, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Injectable({
  providedIn: 'root'
})

export class isLoggedInGuard implements CanActivate {

  constructor(
    private authService: AuthService,
    private router: Router
  ) { }

  canActivate(
    next: ActivatedRouteSnapshot,
    state: RouterStateSnapshot): boolean | UrlTree {
    const allowedRoles = ['MasterAdministrator', 'Administrator', 'Registered', 'Editor', 'Guest'];
    if (this.authService.isAuthenticated(allowedRoles)) {
      return true;
    } else {
      return this.router.createUrlTree(['/auth/login']);
    }
  }
}

