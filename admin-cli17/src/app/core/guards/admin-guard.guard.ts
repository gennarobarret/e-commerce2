import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { AuthService } from '../services';
import { ToastService } from '../services/toast.service'; // Ensure you import the Toast service

@Injectable({
  providedIn: 'root'
})
export class AdminGuard implements CanActivate {

  constructor(
    private authService: AuthService,
    private router: Router,
    private toastService: ToastService // Inject the Toast service
  ) { }

  canActivate(): boolean {
    const isAuthorized = this.authService.isAuthenticated(['MasterAdministrator']);
    if (!isAuthorized) {
      // Display a warning message using the Toast service
      this.toastService.showToast('warning', 'You do not have permission to access this page.');
      // Optionally, you could redirect if needed, but based on your requirement, only the toast is shown
    }
    return isAuthorized;
  }
}
