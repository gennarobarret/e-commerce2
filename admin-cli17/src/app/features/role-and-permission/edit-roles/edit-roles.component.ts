import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs';
import { RoleManagementService } from '../../../core/services/role-management.service';
import { PermissionManagementService } from '../../../core/services/permission-management.service';
import { ToastService } from '../../../core/services/toast.service';
import { Role, Permission } from '../../../core/models/role.model';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { SpinnerComponent } from '../../../shared/components/spinner/spinner.component';

@Component({
  selector: 'app-edit-roles',
  standalone: true,
  templateUrl: './edit-roles.component.html',
  styleUrls: ['./edit-roles.component.css'],
  imports: [CommonModule, ReactiveFormsModule, SpinnerComponent]
})
export class EditRolesComponent implements OnInit {
  editRoleForm!: FormGroup;
  role: Role | null = null;
  permissions: Permission[] = [];
  loading: boolean = false;
  private subscriptions = new Subscription();

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private formBuilder: FormBuilder,
    private roleManagementService: RoleManagementService,
    private permissionService: PermissionManagementService,
    private toastService: ToastService
  ) {
    this.createEditForm();
  }

  ngOnInit(): void {
    const roleId = this.route.snapshot.paramMap.get('id');
    if (roleId) {
      this.fetchRoleData(roleId);
      this.loadPermissions();
    } else {
      this.router.navigate(['/roles']);
    }
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  private fetchRoleData(roleId: string) {
    this.loading = true;
    this.subscriptions.add(
      this.roleManagementService.getRoleById(roleId).subscribe({
        next: (response) => {
          const role = response.data; // Accede directamente a data en la respuesta
          if (role) {
            this.role = role;
            this.updateFormWithRoleData(this.role);
          } else {
            this.router.navigate(['/roles']);
          }
          this.loading = false;
        },
        error: (error) => {
          console.error('Error fetching role:', error);
          this.loading = false;
          this.router.navigate(['/roles']);
        }
      })
    );
  }

  private updateFormWithRoleData(roleData: any) {
    const role = roleData;

    this.editRoleForm.patchValue({
      roleName: role.name,
      permissions: role.permissions.map((perm: any) => perm._id)
    });

    // Si el rol es "MasterAdministrator", deshabilitar todos los campos del formulario
    if (role.name === 'MasterAdministrator') {
      this.editRoleForm.disable(); // Deshabilitar todos los campos del formulario
    }
  }

  private loadPermissions() {
    this.subscriptions.add(
      this.permissionService.listPermissions().subscribe({
        next: (response) => {
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

  private createEditForm() {
    this.editRoleForm = this.formBuilder.group({
      roleName: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(25)]],
      permissions: [[], Validators.required]
    });
  }

  updateRole() {
    if (this.editRoleForm.invalid) {
      this.markFormGroupTouched(this.editRoleForm);
      this.toastService.showToast('error', 'There are errors in the form. Please check the fields.');
      return;
    }

    const formData = this.editRoleForm.value;
    const roleId = this.role?._id || '';

    this.loading = true;
    this.subscriptions.add(
      this.roleManagementService.updateRole(roleId, formData).subscribe({
        next: (response) => {
          this.toastService.showToast('success', 'Role updated successfully.');
          this.router.navigate(['/roles']);
        },
        error: (error) => {
          console.error('Error updating role:', error);
          this.toastService.showToast('error', 'Update failed');
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
}
