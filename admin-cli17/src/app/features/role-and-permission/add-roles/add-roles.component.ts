import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { RoleManagementService } from '../../../core/services/role-management.service';
import { PermissionManagementService } from '../../../core/services/permission-management.service';
import { ToastService } from '../../../core/services/toast.service';
import { Permission } from '../../../core/models/permission.model';
import { CommonModule } from '@angular/common';
import { SpinnerComponent } from '../../../shared/components/spinner/spinner.component';

@Component({
  selector: 'app-add-roles',
  templateUrl: './add-roles.component.html',
  styleUrls: ['./add-roles.component.css'],
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, SpinnerComponent]
})
export class AddRolesComponent implements OnInit {
  addRoleForm!: FormGroup;
  loading: boolean = false;
  permissions: Permission[] = [];  // Lista para almacenar los permisos obtenidos
  private subscriptions = new Subscription();

  constructor(
    private formBuilder: FormBuilder,
    private roleManagementService: RoleManagementService,
    private permissionService: PermissionManagementService,  // Inyectar el servicio de permisos
    private toastService: ToastService,
    private router: Router
  ) {
    this.createForm();
  }

  ngOnInit(): void {
    this.loadPermissions();  // Cargar los permisos al iniciar
  }

  private createForm() {
    this.addRoleForm = this.formBuilder.group({
      roleName: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(25)]],
      permissions: [[], Validators.required]  // Cambiar a un array para múltiples permisos
    });
  }

  private loadPermissions() {
    this.subscriptions.add(
      this.permissionService.listPermissions().subscribe({
        next: (response) => {
          console.log("🚀 ~ AddRolesComponent ~ this.permissionService.listPermissions ~ response:", response)
          if (response && response.data) {
            this.permissions = response.data;
          } else {
            this.toastService.showToast('error', 'No permissions found.');
          }
        },
        error: (error) => {
          console.error('Error loading permissions', error);
          this.toastService.showToast('error', 'Error loading permissions. Please try again.');
        }
      })
    );
  }


  addRole() {
    if (this.addRoleForm.invalid) {
      this.markFormGroupTouched(this.addRoleForm);
      this.toastService.showToast('error', 'There are errors in the form. Please check the fields.');
      return;
    }

    const formData = {
      name: this.addRoleForm.value.roleName,
      permissions: this.addRoleForm.value.permissions
    };

    this.loading = true;

    this.subscriptions.add(
      this.roleManagementService.createRole(formData).subscribe({
        next: (response) => {
          if (response && response.status === 'success') {
            this.toastService.showToast(response.status, `${response.message}`);
            this.router.navigate(['/roles/list']);
          }
        },
        error: (error) => {
          console.error('Error creating role:', error);
          if (error.error && error.error.status && error.error.message) {
            this.toastService.showToast(error.error.status, `${error.error.message}`);
          } else {
            this.toastService.showToast('error', 'Error creating role. Please try again.');
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
