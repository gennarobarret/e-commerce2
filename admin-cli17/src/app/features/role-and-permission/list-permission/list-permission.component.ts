import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { PermissionManagementService } from '../../../core/services/permission-management.service';
import { Permission } from '../../../core/models/permission.model';
import { ApiResponse } from '../../../core/models';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-list-permission',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './list-permission.component.html',
  styleUrls: ['./list-permission.component.css']
})
export class ListPermissionComponent implements OnInit {
  permissions: Permission[] = [];
  filteredPermissions: Permission[] = [];
  page = 1;
  pageSize = 10;
  totalPages = 0;
  pageSizeOptions = [5, 10, 25, 50, 100];
  sortOrder: 'asc' | 'desc' = 'asc';
  sortKey: string = 'name';
  load_data = true;
  searchText: string = '';
  selectedFilterKey: string = 'name';
  filterKeys: string[] = ['name', 'action', 'resource'];
  permissionIdToDelete: string | null = null;

  constructor(
    private permissionService: PermissionManagementService,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.loadPermissions();
  }

  loadPermissions(): void {
    this.load_data = true;
    this.permissionService.listPermissions().subscribe({
      next: (response: ApiResponse<Permission[]>) => {
        this.permissions = response.data;
        this.applyFilter();
        this.load_data = false;
      },
      error: (error) => {
        console.error('Error al cargar permisos', error);
        this.load_data = false;
      }
    });
  }

  applyFilter(): void {
    let filtered = this.permissions;

    if (this.searchText) {
      filtered = filtered.filter(permission => {
        const value = this.getNestedProperty(permission, this.selectedFilterKey);
        return value && value.toString().toLowerCase().includes(this.searchText.toLowerCase());
      });
    }

    this.sortAndPaginate(filtered);
  }

  sortAndPaginate(filtered: Permission[]): void {
    this.filteredPermissions = filtered.sort((a, b) => {
      const valueA = this.getNestedProperty(a, this.sortKey) ?? '';
      const valueB = this.getNestedProperty(b, this.sortKey) ?? '';

      const strValueA = valueA.toString().toLowerCase();
      const strValueB = valueB.toString().toLowerCase();

      return strValueA < strValueB ? (this.sortOrder === 'asc' ? -1 : 1) :
        strValueA > strValueB ? (this.sortOrder === 'asc' ? 1 : -1) : 0;
    });

    this.totalPages = Math.ceil(this.filteredPermissions.length / this.pageSize);
    const startIndex = (this.page - 1) * this.pageSize;
    this.filteredPermissions = this.filteredPermissions.slice(startIndex, startIndex + this.pageSize);
  }

  sortPermissions(key: string): void {
    this.sortKey = key;
    this.sortOrder = this.sortOrder === 'asc' ? 'desc' : 'asc';
    this.applyFilter();
  }

  getNestedProperty(object: any, path: string): any {
    return path.split('.').reduce((o, p) => (o ? o[p] : null), object);
  }

  setPage(pageNumber: number): void {
    if (pageNumber >= 1 && pageNumber <= this.totalPages) {
      this.page = pageNumber;
      this.applyFilter();
    }
  }

  previousPage(): void {
    this.setPage(this.page - 1);
  }

  nextPage(): void {
    this.setPage(this.page + 1);
  }

  onPageSizeChange(event: any): void {
    this.pageSize = +event.target.value;
    this.page = 1;
    this.applyFilter();
  }

  editPermission(permissionId: string | undefined): void {
    if (permissionId) {
      this.router.navigate([`/role-permission/permissions/edit/${permissionId}`]);
    } else {
      console.error('Permission ID is undefined.');
    }
  }

  prepareDeletePermission(permissionId: string): void {
    this.permissionIdToDelete = permissionId;
  }

  confirmDeletePermission(): void {
    if (this.permissionIdToDelete) {
      this.permissionService.deletePermission(this.permissionIdToDelete).subscribe({
        next: () => {
          console.log(`Permission ${this.permissionIdToDelete} deleted successfully`);
          this.loadPermissions();
          this.permissionIdToDelete = null;
        },
        error: (error) => {
          console.error(`Error deleting permission ${this.permissionIdToDelete}`, error);
          this.permissionIdToDelete = null;
        }
      });
    }
  }
}
