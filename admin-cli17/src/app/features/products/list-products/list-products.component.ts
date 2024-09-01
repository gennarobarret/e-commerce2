import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ProductManagementService } from '../../../core/services/product-management.service';
import { Product } from '../../../core/models/product.model';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ToastService } from '../../../core/services';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import { SpinnerComponent } from '../../../shared/components/spinner/spinner.component';

@Component({
  selector: 'app-list-products',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, SpinnerComponent],
  templateUrl: './list-products.component.html',
  styleUrls: ['./list-products.component.css']
})
export class ListProductsComponent implements OnInit {
  products: Product[] = [];
  filteredProducts: Product[] = [];
  selectedProductId: string | null = null;
  page = 1;
  pageSize = 10;
  totalPages = 0;
  pageSizeOptions = [5, 10, 25, 50, 100];
  sortOrder: 'asc' | 'desc' = 'asc';
  sortKey: string = 'name';

  load_data = true;
  searchText: string = '';
  isLoading = false;
  selectedFilterKey: keyof Product = 'name';
  filterKeys: (keyof Product | 'category.name' | 'subcategory.name' | 'manufacturer.name')[] = [
    'name',
    'category.name',
    'subcategory.name',
    'price',
    'manufacturer.name',
    'isActive'
  ];

  constructor(
    private productService: ProductManagementService,
    private router: Router,
    private toastService: ToastService,
    private sanitizer: DomSanitizer
  ) { }

  ngOnInit(): void {
    this.loadProducts();
  }

  loadProducts(): void {
    this.productService.listProducts().subscribe({
      next: (response) => {
        console.log("🚀 ~ ListProductsComponent ~ this.productService.listProducts ~ response:", response)
        this.products = response.data.map(product => {
          product.coverImageUrl = undefined; // Inicializa coverImageUrl como undefined
          product.galleryImages = []; // Inicializa la galería como un array vacío
          return product;
        });
        this.load_data = false;
        this.products.forEach(product => {
          this.loadProductImage(product, 'cover'); // Carga la imagen de portada
          product.gallery?.forEach(image => {
            this.loadProductImage(product, 'gallery', image.imageUrl); // Carga cada imagen de la galería
          });
        });
        this.applyFilter();
      },
      error: (error) => {
        console.error('Error loading products', error);
        this.load_data = false;
      }
    });
  }

  private loadProductImage(product: Product, type: 'cover' | 'gallery', imageId?: string): void {
    this.productService.getProductImage(product._id!, type, imageId).subscribe({
      next: (safeUrl: SafeUrl) => {
        if (type === 'cover') {
          product.coverImageUrl = safeUrl; // Asigna la URL segura de la imagen de portada
        } else if (type === 'gallery') {
          product.galleryImages?.push({ imageUrl: safeUrl as string }); // Agrega la imagen a la galería
        }
      },
      error: (error: any) => {
        console.error(`Error loading ${type} image for product ${product._id}`, error);
      }
    });
  }

  applyFilter(): void {
    let filtered = this.products;

    if (this.searchText !== '') {
      filtered = filtered.filter(product => {
        const value = this.getNestedProperty(product, this.selectedFilterKey);
        return value && value.toString().toLowerCase().includes(this.searchText.toLowerCase());
      });
    }

    this.filteredProducts = filtered.sort((a, b) => {
      const valueA = this.getNestedProperty(a, this.sortKey) ?? '';
      const valueB = this.getNestedProperty(b, this.sortKey) ?? '';

      const strValueA = valueA.toString().toLowerCase();
      const strValueB = valueB.toString().toLowerCase();

      if (strValueA < strValueB) return this.sortOrder === 'asc' ? -1 : 1;
      if (strValueA > strValueB) return this.sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    this.totalPages = Math.ceil(this.filteredProducts.length / this.pageSize);
    const startIndex = (this.page - 1) * this.pageSize;
    this.filteredProducts = this.filteredProducts.slice(startIndex, startIndex + this.pageSize);
  }

  sortProducts(key: string): void {
    this.sortKey = key;
    this.sortOrder = this.sortOrder === 'asc' ? 'desc' : 'asc';
    this.applyFilter();
  }

  getNestedProperty(object: any, path: string): any {
    return path.split('.').reduce((o, p) => (o ? o[p] : null), object);
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

  editProduct(productId: string): void {
    this.router.navigate([`/products/edit/${productId}`]);
  }

  prepareDeleteProduct(productId: string): void {
    this.selectedProductId = productId;
    const modalElement = document.getElementById('confirmDeleteModal');
    if (modalElement) {
      let modal = window.bootstrap.Modal.getInstance(modalElement);
      if (!modal) {
        modal = new window.bootstrap.Modal(modalElement);
      }
      modal.show();
    }
  }

  confirmDeleteProduct(): void {
    if (this.selectedProductId) {
      this.productService.deleteProduct(this.selectedProductId).subscribe({
        next: () => {
          this.toastService.showToast('success', 'Product deleted successfully');
          this.loadProducts();

          const modalElement = document.getElementById('confirmDeleteModal');
          if (modalElement) {
            const modalInstance = window.bootstrap.Modal.getInstance(modalElement);
            if (modalInstance) {
              modalInstance.hide();
            }
          }
        },
        error: (error) => {
          console.error('Error deleting product', error);
          this.toastService.showToast('error', 'Error deleting product');
        }
      });
    }
  }

  getCategoryName(product: Product): string {
    return product.category?.title || '';  // Obtiene el nombre de la categoría si existe
  }

  getSubcategoryName(product: Product): string {
    return product.subcategory?.title || '';  // Obtiene el nombre de la subcategoría si existe
  }

  reset(): void {
    this.searchText = '';
    this.page = 1;
    this.applyFilter();
  }
}
