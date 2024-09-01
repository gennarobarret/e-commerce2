import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import { CategoryManagementService } from '../../../core/services/category-management.service';
import { ToastService } from '../../../core/services/toast.service';
import { Category } from '../../../core/models/category.model';
import { SpinnerComponent } from '../../../shared/components/spinner/spinner.component';

@Component({
  selector: 'app-edit-category',
  standalone: true,
  templateUrl: './edit-category.component.html',
  styleUrls: ['./edit-category.component.css'],
  imports: [CommonModule, ReactiveFormsModule, RouterLink, SpinnerComponent]
})
  
export class EditCategoryComponent implements OnInit {
  editCategoryForm!: FormGroup;
  selectedFile: File | null = null;
  imagePreview: string | SafeUrl | null = null;
  imageError: string | null = null;
  categoryId: string | null = null;
  isLoading: boolean = false; 

  constructor(
    private fb: FormBuilder,
    private categoryService: CategoryManagementService,
    private route: ActivatedRoute,
    private router: Router,
    private toastService: ToastService,
    private sanitizer: DomSanitizer
  ) { }

  ngOnInit(): void {
    this.categoryId = this.route.snapshot.paramMap.get('id');
    if (this.categoryId) {
      this.loadCategory(this.categoryId);
    }

    this.editCategoryForm = this.fb.group({
      title: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(50)]],
      slug: ['', [Validators.required, Validators.maxLength(50)]],
      description: ['', [Validators.maxLength(200)]],
    });
  }

  loadCategory(id: string): void {
    this.isLoading = true;  // Comienza la carga
    this.categoryService.getCategoryById(id).subscribe({
      next: (response) => {
        const category: Category = response.data;
        console.log('Loaded category:', category);

        this.editCategoryForm.patchValue({
          title: category.title,
          slug: category.slug,
          description: category.description
        });

        if (category.imageUrl) {
          this.categoryService.getCategoryImage(category._id!).subscribe({
            next: (safeUrl) => {
              this.imagePreview = safeUrl;
              this.isLoading = false;  // Carga completada
            },
            error: (error) => {
              console.error('Error loading category image:', error);
              this.imagePreview = null;
              this.isLoading = false;  // Termina la carga con error
            }
          });
        } else {
          this.isLoading = false;  // No hay imagen que cargar
        }
      },
      error: (error) => {
        console.error('Error loading category', error);
        this.toastService.showToast('error', 'Error loading category');
        this.isLoading = false;  // Termina la carga con error
      }
    });
  }



  saveCategory(): void {
    if (this.editCategoryForm.invalid) {
      this.markFormGroupTouched(this.editCategoryForm);
      this.toastService.showToast('error', 'There are errors in the form. Please check the fields.');
      return;
    }

    const formData = this.editCategoryForm.value;
    if (this.categoryId) {
      this.categoryService.updateCategory(this.categoryId, formData).subscribe({
        next: (response) => {
          if (this.selectedFile) {
            if (this.categoryId) { 
              this.uploadCategoryImage(this.categoryId);
            }
          } else {
            this.toastService.showToast('success', 'Category updated successfully');
            this.router.navigate(['/products/categories/list']);
          }
        },
        error: (error) => {
          console.error('Error updating category', error);
          this.toastService.showToast('error', 'Error updating category');
        }
      });
    } else {
      console.error('Category ID is null, cannot update category.');
      this.toastService.showToast('error', 'Category ID is missing, cannot update category.');
    }
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
      this.imagePreview = this.sanitizer.bypassSecurityTrustUrl(reader.result as string);
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
    if (!categoryId) {
      return;
    }

    const formData = new FormData();
    if (this.selectedFile) {
      formData.append('image', this.selectedFile);
      this.categoryService.uploadCategoryImage(categoryId, formData).subscribe({
        next: (response) => {
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

  deleteImage(): void {
    if (!this.categoryId) {
      return;
    }

    this.categoryService.deleteCategoryImage(this.categoryId).subscribe({
      next: () => {
        this.imagePreview = null;
        this.toastService.showToast('success', 'Category image deleted successfully');
      },
      error: (error) => {
        console.error('Error deleting category image', error);
        this.toastService.showToast('error', 'Error deleting category image');
      }
    });
  }

  onImageError(): void {
    this.imageError = 'Please upload a valid image file (PNG, JPG, GIF, WEBP) no larger than 5MB.';
    this.imagePreview = null; // Esto hace que se muestre el SVG de error
  }
}
