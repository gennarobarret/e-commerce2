import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs';
import { RoleManagementService } from '../../../core/services/role-management.service';
import { PermissionManagementService } from '../../../core/services/permission-management.service';
import { ToastService } from '../../../core/services/toast.service';
import { Role, Permission } from '../../../core/models/role.model';
import { CommonModule } from '@angular/common';
import { SpinnerComponent } from '../../../shared/components/spinner/spinner.component';

@Component({
  selector: 'app-edit-roles',
  templateUrl: './edit-roles.component.html',
  styleUrls: ['./edit-roles.component.css'],
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, SpinnerComponent]
})
export class EditRolesComponent implements OnInit, OnDestroy {
  editRoleForm!: FormGroup;
  role: Role | null = null;
  roles: Role[] = [];  // List to store available roles
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
    this.createForm();
  }

  ngOnInit(): void {
    this.loadRoles();  // Load roles on init
    this.loadPermissions();  // Load permissions on init

    // Listen for changes in role selection
    this.editRoleForm.get('roleName')?.valueChanges.subscribe(selectedRoleName => {
      this.onRoleChange(selectedRoleName);
    });
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  private createForm() {
    this.editRoleForm = this.formBuilder.group({
      roleName: ['', Validators.required],
      permissions: [[], Validators.required]
    });
  }

  private loadRoles() {
    this.subscriptions.add(
      this.roleManagementService.listRoles().subscribe({
        next: (response) => {
          if (response && response.data) {
            this.roles = response.data;
            this.loadRoleData();  // Load role data after roles are loaded
          } else {
            this.toastService.showToast('error', 'No roles found.');
          }
        },
        error: (error) => {
          console.error('Error loading roles', error);
          this.toastService.showToast('error', 'Error loading roles. Please try again.');
        }
      })
    );
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

  private loadRoleData() {
    const roleId = this.route.snapshot.paramMap.get('id');
    if (roleId) {
      this.loading = true;
      this.subscriptions.add(
        this.roleManagementService.getRoleById(roleId).subscribe({
          next: (response) => {
            const role = response.data;
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
    } else {
      this.router.navigate(['/roles']);
    }
  }

  private updateFormWithRoleData(roleData: Role) {
    this.editRoleForm.patchValue({
      roleName: roleData.name,
      permissions: roleData.permissions.map(perm => perm._id)
    });

    // Disable the permissions field if the role is "MasterAdministrator"
    if (roleData.name === 'MasterAdministrator') {
      this.editRoleForm.get('permissions')?.disable();
    } else {
      this.editRoleForm.get('permissions')?.enable();
    }
  }

  private onRoleChange(selectedRoleName: string) {
    const selectedRole = this.roles.find(role => role.name === selectedRoleName);
    if (selectedRole) {
      this.editRoleForm.patchValue({
        permissions: selectedRole.permissions.map(perm => perm._id)
      });

      // If the role is "MasterAdministrator", disable the permissions field
      if (selectedRoleName === 'MasterAdministrator') {
        this.editRoleForm.get('permissions')?.disable();
      } else {
        this.editRoleForm.get('permissions')?.enable(); // Enable the permissions field for other roles
      }
    }
  }

  updateRole() {
    if (this.editRoleForm.invalid) {
      this.markFormGroupTouched(this.editRoleForm);
      this.toastService.showToast('error', 'There are errors in the form. Please check the fields.');
      return;
    }

    const formData = {
      name: this.editRoleForm.value.roleName,
      permissions: this.editRoleForm.value.permissions
    };

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
          this.toastService.showToast('error', 'Failed to update role.');
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
