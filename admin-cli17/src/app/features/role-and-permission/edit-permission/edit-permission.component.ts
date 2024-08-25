import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { PermissionManagementService } from '../../../core/services/permission-management.service';
import { ToastService } from '../../../core/services/toast.service';
import { Permission } from '../../../core/models/permission.model';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { SpinnerComponent } from '../../../shared/components/spinner/spinner.component';
import { ChangeDetectorRef } from '@angular/core';

@Component({
  selector: 'app-edit-permission',
  standalone: true,
  templateUrl: './edit-permission.component.html',
  styleUrls: ['./edit-permission.component.css'],
  imports: [CommonModule, ReactiveFormsModule, SpinnerComponent]
})


export class EditPermissionComponent implements OnInit {
  editPermissionForm!: FormGroup;
  permission: Permission | null = null;
  loading: boolean = false;
  private subscriptions = new Subscription();

  constructor(
    private route: ActivatedRoute,
    private formBuilder: FormBuilder,
    private permissionService: PermissionManagementService,
    private toastService: ToastService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {
    this.createEditForm();
  }

  ngOnInit(): void {
    const permissionId = this.route.snapshot.paramMap.get('id');
    if (permissionId) {
      this.fetchPermissionData(permissionId);
    } else {
      this.router.navigate(['/permissions']);
    }
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  private createEditForm() {
    this.editPermissionForm = this.formBuilder.group({
      name: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(50)]],
      action: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(50)]],
      resource: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(50)]],
    });
  }

  private fetchPermissionData(permissionId: string) {
    this.loading = true;
    this.subscriptions.add(
      this.permissionService.getPermissionById(permissionId).subscribe({
        next: (response) => {
          this.permission = response.data;
          if (this.permission) {
            this.updateFormWithPermissionData(this.permission);
          } else {
            this.router.navigate(['/permissions']);
          }
          this.loading = false;
        },
        error: (error) => {
          console.error('Error fetching permission:', error);
          this.loading = false;
          this.router.navigate(['/permissions']);
        }
      })
    );
  }



  private updateFormWithPermissionData(permission: Permission) {
    console.log('Datos recibidos para el formulario:', permission);
    this.editPermissionForm.patchValue({
      name: permission.name,
      action: permission.action,
      resource: permission.resource,
    });
    console.log('Estado del formulario:', this.editPermissionForm);
    this.cdr.detectChanges();
  }


  updatePermission() {
    if (this.editPermissionForm.invalid) {
      this.toastService.showToast('error', 'There are errors in the form. Please check the fields.');
      return;
    }

    const formData = this.editPermissionForm.value;
    const permissionId = this.permission?._id || '';

    this.loading = true;
    this.subscriptions.add(
      this.permissionService.updatePermission(permissionId, formData).subscribe({
        next: () => {
          this.toastService.showToast('success', 'Permission updated successfully.');
          this.router.navigate(['/permissions']);
        },
        error: (error) => {
          console.error('Error updating permission:', error);
          this.toastService.showToast('error', 'Update failed.');
          this.loading = false;
        }
      })
    );
  }
}
