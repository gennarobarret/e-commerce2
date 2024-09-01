import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { SubcategoryManagementService } from '../../../core/services/subcategory-management.service';
import { CategoryManagementService } from '../../../core/services/category-management.service';
import { Subcategory } from '../../../core/models/subcategory.model';
import { Category } from '../../../core/models/category.model';
import { ToastService } from '../../../core/services/toast.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-edit-subcategory',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './edit-subcategory.component.html',
  styleUrls: ['./edit-subcategory.component.css']
})
export class EditSubcategoryComponent implements OnInit {
  subcategory: Subcategory | null = null;
  categories: Category[] = [];

  constructor(
    private route: ActivatedRoute,
    private subcategoryService: SubcategoryManagementService,
    private categoryService: CategoryManagementService,
    private router: Router,
    private toastService: ToastService
  ) { }

  ngOnInit(): void {
    this.loadCategories();
    const subcategoryId = this.route.snapshot.paramMap.get('id');
    if (subcategoryId) {
      this.loadSubcategory(subcategoryId);
    }
  }

  loadCategories(): void {
    this.categoryService.listCategories().subscribe({
      next: (response) => {
        this.categories = response.data;
        console.log('Loaded categories:', this.categories);
      },
      error: (error) => {
        console.error('Error loading categories', error);
        this.toastService.showToast('error', 'Error loading categories');
      }
    });
  }

  loadSubcategory(id: string): void {
    this.subcategoryService.getSubcategoryById(id).subscribe({
      next: (response) => {
        this.subcategory = response.data;
        if (this.subcategory && this.subcategory.category && typeof this.subcategory.category === 'object') {
          this.subcategory.category = (this.subcategory.category as any)._id;
        }
        console.log('Loaded subcategory:', this.subcategory);
      },
      error: (error) => {
        console.error('Error loading subcategory', error);
        this.toastService.showToast('error', 'Error loading subcategory');
      }
    });
  }


  saveSubcategory(): void {
    if (this.subcategory && this.subcategory._id) {
      this.subcategoryService.updateSubcategory(this.subcategory._id, this.subcategory).subscribe({
        next: () => {
          this.toastService.showToast('success', 'Subcategory updated successfully');
          this.router.navigate(['/products/subcategories']);
        },
        error: (error) => {
          console.error('Error updating subcategory', error);
          this.toastService.showToast('error', 'Error updating subcategory');
        }
      });
    }
  }
}
