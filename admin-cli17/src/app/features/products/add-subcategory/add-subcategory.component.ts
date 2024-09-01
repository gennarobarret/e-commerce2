import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { SubcategoryManagementService } from '../../../core/services/subcategory-management.service';
import { CategoryManagementService } from '../../../core/services/category-management.service';
import { Subcategory } from '../../../core/models/subcategory.model';
import { Category } from '../../../core/models/category.model';
import { ToastService } from '../../../core/services/toast.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-add-subcategory',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './add-subcategory.component.html',
  styleUrls: ['./add-subcategory.component.css']
})
export class AddSubcategoryComponent implements OnInit {
  addSubcategoryForm!: FormGroup;
  categories: Category[] = [];

  constructor(
    private formBuilder: FormBuilder,
    private subcategoryService: SubcategoryManagementService,
    private categoryService: CategoryManagementService,
    private router: Router,
    private toastService: ToastService
  ) {
    this.createForm();
  }

  ngOnInit(): void {
    this.loadCategories();
  }

  private createForm() {
    this.addSubcategoryForm = this.formBuilder.group({
      title: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(50)]],
      category: ['', Validators.required],
      description: ['', Validators.maxLength(200)]
    });
  }

  loadCategories(): void {
    this.categoryService.listCategories().subscribe({
      next: (response) => {
        this.categories = response.data;
      },
      error: (error) => {
        console.error('Error loading categories', error);
        this.toastService.showToast('error', 'Error loading categories');
      }
    });
  }

  saveSubcategory(): void {
    if (this.addSubcategoryForm.invalid) {
      this.markFormGroupTouched(this.addSubcategoryForm);
      this.toastService.showToast('error', 'There are errors in the form. Please check the fields.');
      return;
    }

    const formData = this.addSubcategoryForm.value;
    this.subcategoryService.createSubcategory(formData).subscribe({
      next: () => {
        this.toastService.showToast('success', 'Subcategory created successfully');
        this.router.navigate(['/products/subcategories']);
      },
      error: (error) => {
        console.error('Error creating subcategory', error);
        this.toastService.showToast('error', 'Error creating subcategory');
      }
    });
  }

  private markFormGroupTouched(formGroup: FormGroup) {
    Object.values(formGroup.controls).forEach(control => {
      control.markAsTouched();
    });
  }
}
