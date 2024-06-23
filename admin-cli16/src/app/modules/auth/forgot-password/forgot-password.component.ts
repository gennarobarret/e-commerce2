import { Component } from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { AuthService } from 'src/app/core/services/auth.service';
import { ToastService } from 'src/app/shared/services/toast.service';


@Component({
  selector: 'app-forgot-password',
  templateUrl: './forgot-password.component.html',
  styleUrls: ['./forgot-password.component.css']
})
export class ForgotPasswordComponent {
  forgotPasswordForm = new FormGroup({
    inputForgotEmailAddress: new FormControl('', [Validators.required, Validators.email]),
  });

  load_btn: boolean = false;

  constructor(
    private _authService: AuthService,
    private _toastService: ToastService
  ) { }

  onSubmit(): void {
    this.load_btn = true;
    if (this.forgotPasswordForm.valid) {
      const emailAddress = this.forgotPasswordForm.get('inputForgotEmailAddress')?.value;

      if (emailAddress) {
        this._authService.forgotPassword({ emailAddress }).subscribe({
          next: (response) => {
            if (response && response.status === 'success') {
              this._toastService.showToast(response.status, `${response.message}`);
              this.forgotPasswordForm.reset();
            } else {
              this._toastService.showToast('success', `${response.message}`);
            }
            this.load_btn = false;
          },
          error: (error) => {
            console.log("forgot password failed", error)
            this._toastService.showToast(error.error.status, `${error.error.message}`);
            this.load_btn = false;
          }
        });
      }
    } else {
      this.load_btn = false;
      this._toastService.showToast('error', 'Please enter a valid email address.');
    }
  }
}
