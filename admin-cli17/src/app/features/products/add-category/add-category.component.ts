import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { CategoryManagementService } from '../../../core/services/category-management.service';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-add-category',
  standalone: true,
  templateUrl: './add-category.component.html',
  styleUrls: ['./add-category.component.css'],
  imports: [CommonModule, ReactiveFormsModule, RouterLink]
})
export class AddCategoryComponent implements OnInit {
  addCategoryForm!: FormGroup;
  selectedFile: File | null = null;
  imagePreview: string | null = null;  // Cambiado a solo string | null
  imageError: string | null = null;

  constructor(
    private fb: FormBuilder,
    private categoryService: CategoryManagementService,
    private router: Router,
    private toastService: ToastService
  ) { }

  ngOnInit(): void {
    this.addCategoryForm = this.fb.group({
      title: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(50)]],
      slug: ['', [Validators.required, Validators.maxLength(50)]],
      description: ['', [Validators.maxLength(200)]],
    });
  }

  saveCategory(): void {
    if (this.addCategoryForm.invalid) {
      this.markFormGroupTouched(this.addCategoryForm);
      this.toastService.showToast('error', 'There are errors in the form. Please check the fields.');
      return;
    }

    const formData = this.addCategoryForm.value;
    this.categoryService.createCategory(formData).subscribe({
      next: (response) => {
        console.log('Category created:', response);
        const categoryId = response.data._id;
        if (categoryId && this.selectedFile) {
          console.log('Uploading image for category:', categoryId);
          this.uploadCategoryImage(categoryId);
        } else {
          this.toastService.showToast('success', 'Category created successfully');
          this.router.navigate(['/products/categories/list']);
        }
      },
      error: (error) => {
        console.error('Error creating category', error);
        this.toastService.showToast('error', 'Error creating category');
      }
    });
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.imageError = null;

    if (!input.files?.length) {
      this.imagePreview = null; // Restablecer la previsualización
      return;
    }

    const file = input.files[0];
    if (!this.validateFileUpdate(file)) {
      this.imageError = `Please upload a valid image file (PNG, JPG, GIF, WEBP) no larger than 5MB.`;
      this.imagePreview = null;
      return;
    }

    this.selectedFile = file;
    const reader = new FileReader();
    reader.onload = () => {
      this.imagePreview = reader.result as string;
      this.imageError = null; // Restablecer el error
    };
    reader.onerror = () => {
      this.onImageError();
    };
    reader.readAsDataURL(file);
  }

  private validateFileUpdate(file: File | null): boolean {
    if (!file) {
      return false;
    }

    const validTypes = ['image/png', 'image/webp', 'image/jpg', 'image/gif', 'image/jpeg'];
    const maxFileSize = 5000000; // 5MB

    if (!validTypes.includes(file.type) || file.size > maxFileSize) {
      return false;
    }
    return true;
  }

  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.values(formGroup.controls).forEach(control => {
      control.markAsTouched();
    });
  }

  private uploadCategoryImage(categoryId: string): void {
    const formData = new FormData();
    if (this.selectedFile) {
      formData.append('image', this.selectedFile);
      this.categoryService.uploadCategoryImage(categoryId, formData).subscribe({
        next: (response) => {
          console.log('Image uploaded:', response);
          this.toastService.showToast('success', 'Category image uploaded successfully');
          this.router.navigate(['/products/categories/list']);
        },
        error: (error) => {
          console.error('Error uploading category image', error);
          this.toastService.showToast('error', 'Error uploading category image');
        }
      });
    }
  }

  onImageError(): void {
    this.imageError = 'Please upload a valid image file (PNG, JPG, GIF, WEBP) no larger than 5MB.';
    this.imagePreview = null; // Esto hace que se muestre el SVG de error
  }
}
