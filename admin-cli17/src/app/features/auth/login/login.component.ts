import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { FormGroup, FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../core/services/toast.service';
import { SpinnerService } from '../../../core/services/spinner.service';
import { LoginCredentials } from '../../../core/models';
import { SpinnerComponent } from '../../../shared/components/spinner/spinner.component';
import { GoogleSigninComponent } from '../google-signin/google-signin.component';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    HttpClientModule,
    SpinnerComponent,
    GoogleSigninComponent
  ],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LoginComponent implements OnInit {
  isLoading$: Observable<boolean>;
  public loginForm: FormGroup;
  submitted = false;

  constructor(
    private _formBuilder: FormBuilder,
    private _authService: AuthService,
    private _router: Router,
    private _toastService: ToastService,
    public _spinnerService: SpinnerService
  ) {
    this.loginForm = this._formBuilder.group({
      userName: ['', [Validators.required]],
      password: ['', Validators.required],
    });
    this.isLoading$ = this._spinnerService.isLoading$;
  }

  get f() {
    return this.loginForm.controls;
  }

  ngOnInit(): void {
    if (this._authService.getToken()) {
      this._router.navigate(['']);
    }
  }

  login() {
    this.submitted = true;
    if (this.loginForm.valid) {
      this._authService.loginUser(this.loginForm.value as LoginCredentials)
        .subscribe({
          next: (response) => {
            if (response && response.status === 'success') {
              this._toastService.showToast(response.status, `${response.message}. Welcome ${response.data.user.userName}!`);
            }
          },
          error: (error) => {
            console.error('Authentication failed:', error);
            this._toastService.showToast(error.error.status, `${error.error.message}`);
          }
        });
    } else {
      this._toastService.showToast('error', 'Missing form data');
    }
  }
}
