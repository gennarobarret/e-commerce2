import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { ProductManagementService } from '../../../core/services/product-management.service';
import { CategoryManagementService } from '../../../core/services/category-management.service';
import { SubcategoryManagementService } from '../../../core/services/subcategory-management.service';
import { ToastService } from '../../../core/services/toast.service';
import { Category } from '../../../core/models/category.model';
import { Subcategory } from '../../../core/models/subcategory.model';
import { SpinnerComponent } from '../../../shared/components/spinner/spinner.component';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-add-product',
  standalone: true,
  templateUrl: './add-product.component.html',
  styleUrls: ['./add-product.component.css'],
  imports: [CommonModule, ReactiveFormsModule, RouterLink, SpinnerComponent]
})
export class AddProductComponent implements OnInit, OnDestroy {
  addProductForm!: FormGroup;
  categories: Category[] = [];
  subcategories: Subcategory[] = [];
  selectedFile: File | null = null;
  imagePreview: string | null = null;
  imageError: string | null = null;
  loading: boolean = false;
  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private productManagementService: ProductManagementService,
    private categoryManagementService: CategoryManagementService,
    private subcategoryManagementService: SubcategoryManagementService,
    private toastService: ToastService,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.addProductForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(100)]],
      description: ['', [Validators.required, Validators.minLength(10), Validators.maxLength(500)]],
      category: ['', Validators.required],
      subcategory: ['', Validators.required],
      price: ['', [Validators.required, Validators.min(0.01)]],
      stock: ['', [Validators.required, Validators.min(0)]],
      productType: ['physical', Validators.required]
    });

    this.loadCategories();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadCategories(): void {
    this.categoryManagementService.listCategories()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.categories = response.data;
        },
        error: (error) => {
          console.error('Error loading categories', error);
        }
      });
  }

  onCategoryChange(event: Event): void {
    const selectElement = event.target as HTMLSelectElement;
    const categoryId = selectElement.value;

    if (categoryId) {
      this.loadSubcategories(categoryId);
    }
  }

  loadSubcategories(categoryId: string): void {
    this.subcategoryManagementService.listSubcategoriesByCategory(categoryId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.subcategories = response.data;
        },
        error: (error) => {
          console.error('Error loading subcategories', error);
        }
      });
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.imageError = null;

    if (!input.files?.length) {
      this.imagePreview = null;
      return;
    }

    const file = input.files[0];
    if (!this.validateFile(file)) {
      this.imageError = `Please upload a valid image file (PNG, JPG, GIF, WEBP) no larger than 5MB.`;
      this.imagePreview = null;
      return;
    }

    this.selectedFile = file;
    const reader = new FileReader();
    reader.onload = () => {
      this.imagePreview = reader.result as string;
      this.imageError = null;
    };
    reader.onerror = () => {
      this.onImageError();
    };
    reader.readAsDataURL(file);
  }

  private validateFile(file: File): boolean {
    const validTypes = ['image/png', 'image/webp', 'image/jpg', 'image/gif', 'image/jpeg'];
    const maxFileSize = 5000000; // 5MB

    return validTypes.includes(file.type) && file.size <= maxFileSize;
  }

  onImageError(): void {
    this.imageError = 'Please upload a valid image file (PNG, JPG, GIF, WEBP) no larger than 5MB.';
    this.imagePreview = null; // Esto hace que se muestre el SVG de error
  }


  addProduct(): void {
    if (this.addProductForm.invalid) {
      this.markFormGroupTouched(this.addProductForm);
      this.toastService.showToast('error', 'There are errors in the form. Please check the fields.');
      return;
    }

    const formData = this.addProductForm.value;
    this.loading = true;

    this.productManagementService.createProduct(formData)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (response && response.status === 'success') {
            this.toastService.showToast(response.status, `${response.message}`);
            const productId = response.data._id;
            if (productId && this.selectedFile) {
              this.uploadProductImage(productId);
            } else {
              this.router.navigate(['/products/list']);
            }
          }
        },
        error: (error) => {
          console.error('Error creating product:', error);
          this.toastService.showToast('error', 'Error creating product. Please try again.');
          this.loading = false;
        }
      });
  }
  
  private uploadProductImage(productId: string): void {
    if (this.selectedFile) {
      this.productManagementService.uploadProductImage(productId, 'cover', [this.selectedFile]) // Asegúrate de pasar el array con un solo archivo
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (response) => {
            this.toastService.showToast('success', 'Product image uploaded successfully');
            this.router.navigate(['/products/list']);
          },
          error: (error) => {
            console.error('Error uploading product image', error);
            this.toastService.showToast('error', 'Error uploading product image');
            this.loading = false;
          }
        });
    }
  }


  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.values(formGroup.controls).forEach(control => {
      control.markAsTouched();
    });
  }

  
}
