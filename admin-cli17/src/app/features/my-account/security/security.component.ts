import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { UserManagementService } from '../../../core/services';
import { ToastService } from '../../../core/services';
import { RouterModule, Router } from '@angular/router';
import { User } from '../../../core/models';

@Component({
  selector: 'app-security',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule // Para utilizar [routerLink] en la navegación
  ],
  templateUrl: './security.component.html',
  styleUrls: ['./security.component.css']
})
export class SecurityComponent implements OnInit {
  securityForm!: FormGroup;
  load_btn: boolean = false;
  user: User | null = null;

  constructor(
    private formBuilder: FormBuilder,
    private userService: UserManagementService,
    private toastService: ToastService,
    private router: Router // Asegurarse de inyectar el Router para la redirección
  ) { }

  ngOnInit(): void {
    this.initializeForm();
    this.loadUserData();
  }

  initializeForm(): void {
    this.securityForm = this.formBuilder.group({
      currentPassword: ['', Validators.required],
      newPassword: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', Validators.required],
      twoFactor: ['off', Validators.required],
      smsNumber: ['', Validators.pattern(/^[0-9]+$/)],
      privacySetting: ['public', Validators.required],
      dataSharing: ['yes', Validators.required]
    }, {
      validator: this.passwordsMustMatch('newPassword', 'confirmPassword')
    });
  }

  loadUserData(): void {
    this.userService.getUser().subscribe({
      next: (response) => {
        this.user = response.data;  // Asignar la respuesta a la propiedad `user`

        // Si el método de autenticación no es 'local', deshabilitar el formulario de cambio de contraseña
        if (this.user.authMethod !== 'local') {
          this.securityForm.get('currentPassword')?.disable();
          this.securityForm.get('newPassword')?.disable();
          this.securityForm.get('confirmPassword')?.disable();
          this.toastService.showToast('warning', 'Password change is disabled for users authenticated with external providers.');
        }
      },
      error: () => {
        console.error('Failed to load user data');
      }
    });
  }


  passwordsMustMatch(password: string, confirmPassword: string) {
    return (formGroup: FormGroup) => {
      const passControl = formGroup.controls[password];
      const confirmPassControl = formGroup.controls[confirmPassword];

      if (confirmPassControl.errors && !confirmPassControl.errors['mustMatch']) {
        return;
      }

      if (passControl.value !== confirmPassControl.value) {
        confirmPassControl.setErrors({ mustMatch: true });
      } else {
        confirmPassControl.setErrors(null);
      }
    };
  }

  onChangePassword(): void {
    if (this.securityForm.invalid) {
      this.toastService.showToast('error', 'Please fill in the required fields correctly.');
      return;
    }

    const { currentPassword, newPassword } = this.securityForm.value;
    this.load_btn = true;

    this.userService.resetPassword(currentPassword, newPassword).subscribe({
      next: () => {
        this.toastService.showToast('success', 'Password changed successfully');
        this.load_btn = false;
      },
      error: () => {
        this.toastService.showToast('error', 'Failed to change password');
        this.load_btn = false;
      }
    });
  }

  onConfirmDelete(): void {
    if (!this.user || !this.user._id) {
      this.toastService.showToast('error', 'User information is missing.');
      return;
    }

    this.load_btn = true;

    this.userService.deleteUser(this.user._id).subscribe({
      next: () => {
        this.toastService.showToast('success', 'Your account has been deleted successfully.');
        this.load_btn = false;
        this.router.navigate(['/login']);  // Redirigir al usuario después de eliminar la cuenta
      },
      error: () => {
        this.toastService.showToast('error', 'Failed to delete the account.');
        this.load_btn = false;
      }
    });
  }
}
