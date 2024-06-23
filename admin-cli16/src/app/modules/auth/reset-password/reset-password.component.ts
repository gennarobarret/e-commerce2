import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthService } from 'src/app/core/services/auth.service';
import { ValidationService } from 'src/app/core/services/validation.service';
import { ToastService } from 'src/app/shared/services/toast.service';
import { FeatherIconsService } from 'src/app/core/services/feather-icons.service';


@Component({
  selector: 'app-reset-password',
  templateUrl: './reset-password.component.html',
  styleUrls: ['./reset-password.component.css']
})
export class ResetPasswordComponent implements OnInit {
  resetPasswordForm!: FormGroup;
  load_btn: boolean = false;
  token?: string;

  minLengthValid = false;
  requiresDigitValid = false;
  requiresUppercaseValid = false;
  requiresLowercaseValid = false;
  requiresSpecialCharsValid = false;


  constructor(
    private _router: Router,
    private _route: ActivatedRoute,
    private _formBuilder: FormBuilder,
    private _validationService: ValidationService,
    private _toastService: ToastService,
    private _authService: AuthService,
  ) { }

  ngOnInit(): void {
    this.token = this._route.snapshot.paramMap.get('token') ?? undefined;
    if (!this.token) {
      console.warn('No reset token available');
      // Redirige o maneja el caso de ausencia del token como prefieras
    }
    this.resetPasswordForm = this._formBuilder.group({
      inputNewPassword: ['', [Validators.required, Validators.minLength(8), Validators.maxLength(25), this._validationService.passwordValidator]],
      inputConfirmPassword: ['', [Validators.required]]
    }, { validator: this._validationService.mustMatch('inputNewPassword', 'inputConfirmPassword') });

    this.resetPasswordForm.get('inputNewPassword')!.valueChanges.subscribe(password => {
      this.minLengthValid = password.length >= 8;
      this.requiresDigitValid = /\d/.test(password);
      this.requiresUppercaseValid = /[A-Z]/.test(password);
      this.requiresLowercaseValid = /[a-z]/.test(password);
      this.requiresSpecialCharsValid = /[!@#$%^&*(),.?":{}|<>]/.test(password);
    });
  }

  get showValidationRules(): boolean {
    const control = this.resetPasswordForm.get('inputNewPassword');
    // Retorna false como valor predeterminado si la expresión es undefined.
    return (control?.touched && !!control?.value) || false;
  }

  onSubmit(): void {
    if (this.resetPasswordForm.invalid || !this.token) {
      this._toastService.showToast('error', 'Form is invalid or no reset token is available');
      console.log('Form is invalid or no reset token is available');
      return;
    }
    this.load_btn = true;
    const newPassword = this.resetPasswordForm.controls['inputNewPassword'].value;
    this._authService.resetPassword(this.token, newPassword).subscribe({
      next: (response) => {
        if (response && response.status === 'success') {
          this._toastService.showToast(response.status, `${response.message}`);
          this.load_btn = false;
          this._router.navigate(['/login']);
        }
      },
      error: (error) => {
        console.error('reset password failed:', error);
        this._toastService.showToast(error.error.status, `${error.error.message}`);
        this.load_btn = false;
      }
    });
  }

}
