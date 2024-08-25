import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { PermissionManagementService } from '../../../core/services/permission-management.service';
import { ToastService } from '../../../core/services/toast.service';
import { CommonModule } from '@angular/common';
import { SpinnerComponent } from '../../../shared/components/spinner/spinner.component';

@Component({
  selector: 'app-add-permission',
  templateUrl: './add-permission.component.html',
  styleUrls: ['./add-permission.component.css'],
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, SpinnerComponent]
})
export class AddPermissionComponent implements OnInit {
  addPermissionForm!: FormGroup;
  loading: boolean = false;
  private subscriptions = new Subscription();

  constructor(
    private formBuilder: FormBuilder,
    private permissionService: PermissionManagementService,
    private toastService: ToastService,
    private router: Router
  ) {
    this.createForm();
  }

  ngOnInit(): void {
    // Puedes cargar datos adicionales aquí si es necesario
  }

  private createForm() {
    this.addPermissionForm = this.formBuilder.group({
      permissionName: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(50)]],
      action: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(25)]],
      resource: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(50)]]
    });
  }

  addPermission() {
    if (this.addPermissionForm.invalid) {
      this.markFormGroupTouched(this.addPermissionForm);
      this.toastService.showToast('error', 'There are errors in the form. Please check the fields.');
      return;
    }

    const formData = {
      name: this.addPermissionForm.value.permissionName,
      action: this.addPermissionForm.value.action,
      resource: this.addPermissionForm.value.resource
    };

    this.loading = true;

    this.subscriptions.add(
      this.permissionService.createPermission(formData).subscribe({
        next: (response) => {
          if (response && response.status === 'success') {
            this.toastService.showToast(response.status, `${response.message}`);
            this.router.navigate(['/role-permission/permissions']);
          }
        },
        error: (error) => {
          console.error('Error creating permission:', error);
          if (error.error && error.error.status && error.error.message) {
            this.toastService.showToast(error.error.status, `${error.error.message}`);
          } else {
            this.toastService.showToast('error', 'Error creating permission. Please try again.');
          }
          this.loading = false;
        }
      })
    );
  }

  private markFormGroupTouched(formGroup: FormGroup) {
    Object.values(formGroup.controls).forEach(control => {
      control.markAsTouched();
    });
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }
}
