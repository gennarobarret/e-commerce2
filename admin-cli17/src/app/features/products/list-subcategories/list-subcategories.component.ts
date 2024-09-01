import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { SubcategoryManagementService } from '../../../core/services/subcategory-management.service';
import { Subcategory } from '../../../core/models/subcategory.model';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-list-subcategories',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './list-subcategories.component.html',
  styleUrls: ['./list-subcategories.component.css']
})
export class ListSubcategoriesComponent implements OnInit {
  subcategories: Subcategory[] = [];
  filteredSubcategories: Subcategory[] = [];
  selectedSubcategoryId: string | null = null; // Para almacenar temporalmente el ID de la subcategoría
  page = 1;
  pageSize = 10;
  totalPages = 0;
  pageSizeOptions = [5, 10, 25, 50, 100];
  sortOrder: 'asc' | 'desc' = 'asc';
  sortKey: string = 'title';
  load_data = true;
  searchText: string = '';

  constructor(
    private subcategoryService: SubcategoryManagementService,
    private router: Router,
    private toastService: ToastService
  ) { }

  ngOnInit(): void {
    this.loadSubcategories();
  }

  loadSubcategories(): void {
    this.subcategoryService.listSubcategories().subscribe({
      next: (response) => {
        this.subcategories = response.data;
        this.applyFilter();
        this.load_data = false;
      },
      error: (error) => {
        console.error('Error loading subcategories', error);
        this.load_data = false;
      }
    });
  }

  applyFilter(): void {
    this.filteredSubcategories = this.subcategories.filter(subcategory =>
      subcategory.title.toLowerCase().includes(this.searchText.toLowerCase())
    );

    this.totalPages = Math.ceil(this.filteredSubcategories.length / this.pageSize);
    const startIndex = (this.page - 1) * this.pageSize;
    this.filteredSubcategories = this.filteredSubcategories.slice(startIndex, startIndex + this.pageSize);
  }

  sortSubcategories(key: string): void {
    this.sortKey = key;
    this.sortOrder = this.sortOrder === 'asc' ? 'desc' : 'asc';
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

  editSubcategory(subcategoryId: string): void {
    this.router.navigate([`/products/subcategories/edit/${subcategoryId}`]);
  }

  prepareDeleteSubcategory(subcategoryId: string): void {
    this.selectedSubcategoryId = subcategoryId;
    const modalElement = document.getElementById('confirmDeleteModal');
    if (modalElement) {
      const modal = new window.bootstrap.Modal(modalElement);
      modal.show();
    }
  }

  confirmDeleteSubcategory(): void {
    if (this.selectedSubcategoryId) {
      this.subcategoryService.deleteSubcategory(this.selectedSubcategoryId).subscribe({
        next: () => {
          this.toastService.showToast('success', 'Subcategory deleted successfully');
          this.loadSubcategories();
          this.selectedSubcategoryId = null; // Reiniciar la selección
        },
        error: (error) => {
          console.error('Error deleting subcategory', error);
          this.toastService.showToast('error', 'Error deleting subcategory');
        }
      });
    }
  }
}
