import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from 'src/app/core/services/auth.service';
import { ToastService } from 'src/app/shared/services/toast.service';


@Component({
  selector: 'app-verification-code',
  templateUrl: './verification-code.component.html',
  styleUrls: ['./verification-code.component.css']
})
export class VerificationCodeComponent {
  verificationForm = new FormGroup({
    digit1: new FormControl('', Validators.required),
    digit2: new FormControl('', Validators.required),
    digit3: new FormControl('', Validators.required),
    digit4: new FormControl('', Validators.required),
    digit5: new FormControl('', Validators.required),
    digit6: new FormControl('', Validators.required)
  });

  @ViewChild('input1') input1?: ElementRef<HTMLInputElement>;
  @ViewChild('input2') input2?: ElementRef<HTMLInputElement>;
  @ViewChild('input3') input3?: ElementRef<HTMLInputElement>;
  @ViewChild('input4') input4?: ElementRef<HTMLInputElement>;
  @ViewChild('input5') input5?: ElementRef<HTMLInputElement>;
  @ViewChild('input6') input6?: ElementRef<HTMLInputElement>;


  token: string | null = null;

  constructor(
    private _route: ActivatedRoute,
    private _router: Router,
    private _authService: AuthService,
    private _toastService: ToastService
  ) { }

  ngOnInit(): void {
    this.token = this._route.snapshot.paramMap.get('token');
  }


  goToNextInput(event: KeyboardEvent, nextInputName: string): void {
    if (event.target) {
      const inputElement: HTMLInputElement = event.target as HTMLInputElement;
      if (inputElement.value.length > 0) {
        if (nextInputName === 'input2') {
          this.input2?.nativeElement.focus();
        } else if (nextInputName === 'input3') {
          this.input3?.nativeElement.focus();
        } else if (nextInputName === 'input4') {
          this.input4?.nativeElement.focus();
        } else if (nextInputName === 'input5') {
          this.input5?.nativeElement.focus();
        } else if (nextInputName === 'input6') {
          this.input6?.nativeElement.focus();
        } else if (nextInputName === 'submit') {
          // Aquí puedes elegir enfocar el botón de enviar, o simplemente dejar que el usuario presione Enter para enviar el formulario
          // Por ejemplo: this.submitButton?.nativeElement.focus();
        }
      }
    }
  }

  
  verifyCode(): void {
    if (this.token && this.verificationForm.valid) {
      const verificationCode = Object.values(this.verificationForm.value).join('');
      this._authService.verificationCode(this.token, verificationCode).subscribe({
        next: (response) => {
          if (response && response.status === 'success') {
            console.log('Verification successful', response);
            if (response.data) {
              console.log("🚀 ~ VerificationCodeComponent ~ this._authService.verificationCode ~ response.data:", response.data)
              const newResetToken = response.data.resetToken;
              console.log("🚀 ~ VerificationCodeComponent ~ this._authService.verificationCode ~ newResetToken:", newResetToken);
              this._toastService.showToast(response.status, `${response.message}`);
              this._router.navigate([`/auth/reset-password/${newResetToken}`]);
            } else {
              this._toastService.showToast('error', `${response.message}. Something goes wrong!`);
            }
          }
        },
        error: (error) => {
          console.error('Verification failed', error);
          this._toastService.showToast(error.error.status, `${error.error.message}`);
        }
      });
    } else {
      console.log('Token is null or form is not valid');
      // Maneja el caso de que el token sea null o el formulario inválido
    }
  }
}
