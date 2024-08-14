import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormGroup, FormControl, Validators } from '@angular/forms';
import { AuthService } from '../../../core/services';
import { ToastService } from '../../../core/services';

@Component({
  selector: 'app-verification-code',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink
  ],
  templateUrl: './verification-code.component.html',
  styleUrls: ['./verification-code.component.css']
})
export class VerificationCodeComponent implements OnInit {
  verificationForm: FormGroup;
  token: string | null = null;
  loading: boolean = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private authService: AuthService,
    private toastService: ToastService
  ) {
    this.verificationForm = new FormGroup({
      verificationCode: new FormControl('', [Validators.required, Validators.minLength(6)])
    });
  }

  ngOnInit(): void {
    // Obtiene el token desde los parámetros de la URL
    this.token = this.route.snapshot.paramMap.get('token');
    if (!this.token) {
      this.toastService.showToast('error', 'Invalid or missing token.');
      this.router.navigate(['/auth/login']);
    }
  }

  onSubmit(): void {
    if (this.verificationForm.valid && this.token) {
      this.loading = true;
      const verificationCode = this.verificationForm.get('verificationCode')?.value;
      console.log("🚀 ~ VerificationCodeComponent ~ onSubmit ~ verificationCode:", verificationCode);

      // Usar el método correcto para enviar el token y el código de verificación
      this.authService.verificationCode(this.token, verificationCode).subscribe({
        next: (response: any) => {  // Añade tipos explícitos
          this.toastService.showToast('success', 'Verification successful. You can now reset your password.');
          // Redirigir a la ruta 'reset-password/:token' con el token
          const resetToken = response.data.resetToken;
          console.log("/auth/reset-password", resetToken)
          this.router.navigate([`/auth/reset-password`, resetToken]);  // Pasa el token en la URL
          this.loading = false;
        },
        error: (error: any) => {  // Añade tipos explícitos
          this.toastService.showToast('error', 'Verification failed. Please try again.');
          this.loading = false;
        }
      });
    }
  }

}