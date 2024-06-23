import { Component, OnInit, NgZone } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../core/services/toast.service';
import { GoogleSignInResponse } from '../../../core/models';
import { environment } from '../../../environments/environment';

declare const google: any;

@Component({
  selector: 'app-google-signin',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    HttpClientModule
  ],
  templateUrl: './google-signin.component.html',
  styleUrls: ['./google-signin.component.css']
})
export class GoogleSigninComponent implements OnInit {

  constructor(
    private _router: Router,
    private _authService: AuthService,
    private _ngZone: NgZone,
    private _toastService: ToastService
  ) { }

  ngOnInit(): void {
    this.initializeGoogleSignIn();
  }

  initializeGoogleSignIn() {
    google.accounts.id.initialize({
      client_id: environment.googleClientId,
      callback: (response: any) => this.onSignIn(response),  // Utiliza una arrow function aquí
      ux_mode: 'popup',
      login_uri: environment.loginUri,
      auto_prompt: false,
      auto_select: false
    });

    google.accounts.id.renderButton(
      document.getElementById('g_id_onload'),
      {
        theme: 'outline',
        size: 'large',
        text: 'continue_with',
        shape: 'rectangular',
        logo_alignment: 'left'
      }
    );

    // google.accounts.id.prompt();
  }

  onSignIn(response: GoogleSignInResponse) {
    if (!response || !response.credential) {
      console.error('Failed to receive credential from Google');
      this._toastService.showToast('error', 'Google authentication failed: No credentials received');
      return;
    }
    this._ngZone.run(() => {
      this._authService.authenticateWithGoogle(response.credential)
        .subscribe({
          next: (response) => {
            if (response && response.status === 'success') {
              this._toastService.showToast(response.status, `${response.message}. Welcome ${response.data.user.userName}!`);
            }
          },
          error: (error) => {
            console.error('Authentication failed:', error);
            this._toastService.showToast('error', error.message);
          }
        });
    });
  }
}
