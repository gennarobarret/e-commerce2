import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ValidationService } from 'src/app/core/services/validation.service';
import { AuthService } from 'src/app/core/services/auth.service';
import { ToastService } from 'src/app/shared/services/toast.service';
import { User } from 'src/app/core/interfaces/user.interface';

@Component({
  selector: 'app-create-master-admin',
  templateUrl: './create-master-admin.component.html',
  styleUrls: ['./create-master-admin.component.css']
})
export class CreateMasterAdminComponent {
  createMasterAdminForm!: FormGroup;
  user: User | null = null;
  load_data: boolean = false;
  load_btn: boolean = false;
  formData: any;

  constructor(
    private _router: Router,
    private _formBuilder: FormBuilder,
    private _validationService: ValidationService,
    private _toastService: ToastService,
    private _authService: AuthService,
  ) {
    this.createMasterAdminForm = this._formBuilder.group({
      inputUserName: [
        "",
        [
          Validators.required,
          Validators.minLength(5),
          Validators.maxLength(20),
          Validators.pattern("^[a-zA-Z0-9]+$")
        ]
      ],
      inputFirstName: [
        "",
        [
          Validators.required,
          Validators.minLength(3),
          Validators.maxLength(25),
          Validators.pattern("^[a-zA-Z0-9\\sñÑ]+$")
        ]
      ],
      inputLastName: [
        "",
        [
          Validators.required,
          Validators.minLength(3),
          Validators.maxLength(25),
          Validators.pattern("^[a-zA-Z0-9\\sñÑ]+$")
        ]
      ],
      inputEmailAddress: ["", [Validators.required, Validators.email]],
      inputPassword: ["", [Validators.required, Validators.minLength(8)]],
      inputConfirmPassword: ["", [Validators.required]],
      inputRole: [{ value: 'MasterAdministrator', disabled: true }, [Validators.required]],
    }, { validator: this._validationService.mustMatch('inputPassword', 'inputConfirmPassword') });
  }

  createUserFromForm(formData: any): User {
    return {
      userName: formData.inputUserName,
      firstName: formData.inputFirstName,
      lastName: formData.inputLastName,
      emailAddress: formData.inputEmailAddress,
      role: 'MasterAdministrator',
      countryAddress: null,
      stateAddress: null,
    };
  }

  onSubmit() {
    this.load_btn = true;
    if (this.createMasterAdminForm.valid) {
      const formData = this.createMasterAdminForm.getRawValue();
      const user: User = this.createUserFromForm(formData);
      const userWithPassword = {
        ...user,
        password: formData.inputPassword,
      };
      console.log("🚀 ~ CreateMasterAdminComponent ~ onSubmit ~ userWithPassword:", userWithPassword);
      this._authService.createMasterAdmin(userWithPassword).subscribe(
        response => {
          this._toastService.showToast('success', 'An email has been sent to ' + user.emailAddress);
          this._router.navigate(['/auth/verification-pending']);
          this.load_btn = false;
        },
        error => {
          this.handleError(error);
        }
      );
    } else {
      this.markFormAsTouched();
      this.load_btn = false;
    }
  }

  markFormAsTouched() {
    Object.keys(this.createMasterAdminForm.controls).forEach(field => {
      const control = this.createMasterAdminForm.get(field);
      control?.markAsTouched({ onlySelf: true });
    });
    this._toastService.showToast('error', 'Please fill all required fields');
  }

  handleError(error: any) {
    this._router.navigate(['/auth/create-Master-Admin']);
    if (error.status === 400 && error.error.message === 'A Master Administrator is already registered.') {
      this._toastService.showToast('error', 'A Master Administrator is already registered.');
    } else {
      this._toastService.showToast('error', `Error: ${error.message}`);
    }
    this.load_btn = false;
  }
}
