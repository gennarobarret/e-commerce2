import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CategoryManagementService } from '../../../core/services/category-management.service';
import { Category } from '../../../core/models/category.model';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ToastService } from '../../../core/services';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import { SpinnerComponent } from '../../../shared/components/spinner/spinner.component';

@Component({
  selector: 'app-list-categories',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, SpinnerComponent],
  templateUrl: './list-categories.component.html',
  styleUrls: ['./list-categories.component.css']
})
export class ListCategoriesComponent implements OnInit {
  categories: Category[] = [];
  filteredCategories: Category[] = [];
  selectedCategoryId: string | null = null;
  page = 1;
  pageSize = 10;
  totalPages = 0;
  pageSizeOptions = [5, 10, 25, 50, 100];
  sortOrder: 'asc' | 'desc' = 'asc';
  sortKey: keyof Category = 'title';
  load_data = true;
  searchText: string = '';
  isLoading = false;
  selectedFilterKey: keyof Category = 'title';  // Tipado como keyof Category
  filterKeys: (keyof Category)[] = ['title', 'description', 'slug', 'createdAt', 'updatedAt'];
  startDate: string = '';
  endDate: string = '';

  constructor(
    private categoryService: CategoryManagementService,
    private router: Router,
    private toastService: ToastService,
    private sanitizer: DomSanitizer
  ) { }

  ngOnInit(): void {
    this.loadCategories();
  }

  loadCategories(): void {
    this.categoryService.listCategories().subscribe({
      next: (response) => {
        this.categories = response.data.map(category => {
          category.imageUrl = null; // Inicializa imageUrl como null
          return category;
        });
        this.applyFilter();
        this.load_data = false;
        this.categories.forEach(category => {
          this.loadCategoryImage(category);
        });
      },
      error: (error) => {
        console.error('Error loading categories', error);
        this.load_data = false;
      }
    });
  }

  private loadCategoryImage(category: Category): void {
    if (category._id) {
      this.isLoading = true; // Esto asegura que se muestre el spinner
      this.categoryService.getCategoryImage(category._id).subscribe({
        next: (safeUrl: SafeUrl) => {
          category.imageUrl = safeUrl;
          this.isLoading = false; // Oculta el spinner cuando se cargue la imagen
        },
        error: (error: any) => {
          console.error('Error loading category image:', error);
          this.isLoading = false; // Oculta el spinner si hay un error
        }
      });
    } else {
      console.error('Category ID is undefined.');
    }
  }


  sortCategories(key: keyof Category): void {
    this.sortKey = key;
    this.filteredCategories = this.filteredCategories.sort((a, b) => {
      const aValue = a[key] as string | Date;
      const bValue = b[key] as string | Date;

      let compare = 0;

      if (aValue < bValue) {
        compare = -1;
      } else if (aValue > bValue) {
        compare = 1;
      }

      return this.sortOrder === 'asc' ? compare : -compare;
    });

    this.sortOrder = this.sortOrder === 'asc' ? 'desc' : 'asc';
  }

  applyFilter(): void {
    let filtered = this.categories;

    // Filtrado por texto general en campos string
    if (['title', 'description', 'slug'].includes(this.selectedFilterKey)) {
      filtered = filtered.filter(category =>
        (category[this.selectedFilterKey as keyof Category] as string)
          ?.toLowerCase()
          .includes(this.searchText.toLowerCase())
      );
    }

    // Filtrado por fecha
    if (['createdAt', 'updatedAt'].includes(this.selectedFilterKey)) {
      const start = this.startDate ? new Date(this.startDate) : null;
      const end = this.endDate ? new Date(this.endDate) : null;

      filtered = filtered.filter(category => {
        const date = new Date(category[this.selectedFilterKey as keyof Category] as string);
        if (start && end) {
          return date >= start && date <= end;
        } else if (start) {
          return date >= start;
        } else if (end) {
          return date <= end;
        }
        return true;
      });
    }

    // Actualizar `filteredCategories` con los datos filtrados
    this.filteredCategories = filtered;

    // Ordenar los datos
    this.sortCategories(this.sortKey);

    // Aplicar paginación
    this.totalPages = Math.ceil(this.filteredCategories.length / this.pageSize);
    const startIndex = (this.page - 1) * this.pageSize;
    this.filteredCategories = this.filteredCategories.slice(startIndex, startIndex + this.pageSize);
  }

  reset(): void {
    this.searchText = '';
    this.startDate = '';
    this.endDate = '';
    this.page = 1;
    this.applyFilter();
  }

  setPage(pageNumber: number): void {
    this.page = pageNumber;
    this.applyFilter();
  }

  previousPage(): void {
    if (this.page > 1) {
      this.page--;
      this.applyFilter();
    }
  }

  nextPage(): void {
    if (this.page < this.totalPages) {
      this.page++;
      this.applyFilter();
    }
  }

  onPageSizeChange(event: any): void {
    this.pageSize = +event.target.value;
    this.page = 1;
    this.applyFilter();
  }

  editCategory(categoryId: string): void {
    this.router.navigate([`/products/categories/edit/${categoryId}`]);
  }

  prepareDeleteCategory(categoryId: string): void {
    this.selectedCategoryId = categoryId;
    const modalElement = document.getElementById('confirmDeleteModal');
    if (modalElement) {
      let modal = window.bootstrap.Modal.getInstance(modalElement);
      if (!modal) {
        modal = new window.bootstrap.Modal(modalElement);
      }
      modal.show();
    }
  }

  confirmDeleteCategory(): void {
    if (this.selectedCategoryId) {
      this.categoryService.deleteCategory(this.selectedCategoryId).subscribe({
        next: () => {
          this.toastService.showToast('success', 'Category deleted successfully');
          this.loadCategories();

          const modalElement = document.getElementById('confirmDeleteModal');
          if (modalElement) {
            const modalInstance = window.bootstrap.Modal.getInstance(modalElement);
            if (modalInstance) {
              modalInstance.hide();
            }
          }
        },
        error: (error) => {
          console.error('Error deleting category', error);
          this.toastService.showToast('error', 'Error deleting category');
        }
      });
    }
  }




}
