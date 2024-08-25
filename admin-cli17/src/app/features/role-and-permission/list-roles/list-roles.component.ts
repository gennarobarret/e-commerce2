import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { RoleManagementService } from '../../../core/services/role-management.service';
import { Role } from '../../../core/models/role.model';
import { ApiResponse } from '../../../core/models';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-list-roles',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './list-roles.component.html',
  styleUrls: ['./list-roles.component.css']
})
export class ListRolesComponent implements OnInit {
  roles: Role[] = [];
  filteredRoles: Role[] = [];
  page = 1;
  pageSize = 10;
  totalPages = 0;
  pageSizeOptions = [5, 10, 25, 50, 100];
  sortOrder: 'asc' | 'desc' = 'asc';
  sortKey: string = 'name';
  load_data = true;
  searchText: string = '';
  selectedFilterKey: string = 'name';
  filterKeys: string[] = ['name'];
  roleIdToDelete: string | null = null;

  constructor(private roleService: RoleManagementService, private router: Router) { }

  ngOnInit(): void {
    this.loadRoles();
  }

  loadRoles(): void {
    this.roleService.listRoles().subscribe({
      next: (response: ApiResponse<Role[]>) => {
        this.roles = response.data;
        console.log("🚀 ~ ListRolesComponent ~ this.roleService.listRoles ~ this.role:", this.roles)
        this.applyFilter();
        this.load_data = false;
      },
      error: (error) => {
        console.error('Error al cargar roles', error);
        this.load_data = false;
      }
    });
  }


  applyFilter(): void {
    let filtered = this.roles; // Asegúrate de que this.roles es un array

    if (this.searchText !== '') {
      filtered = filtered.filter(role => {
        const value = this.getNestedProperty(role, this.selectedFilterKey);
        return value && value.toString().toLowerCase().includes(this.searchText.toLowerCase());
      });
    }

    this.filteredRoles = filtered.sort((a, b) => {
      const valueA = this.getNestedProperty(a, this.sortKey) ?? '';
      const valueB = this.getNestedProperty(b, this.sortKey) ?? '';

      const strValueA = valueA.toString().toLowerCase();
      const strValueB = valueB.toString().toLowerCase();

      if (strValueA < strValueB) return this.sortOrder === 'asc' ? -1 : 1;
      if (strValueA > strValueB) return this.sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    this.totalPages = Math.ceil(this.filteredRoles.length / this.pageSize);
    const startIndex = (this.page - 1) * this.pageSize;
    this.filteredRoles = this.filteredRoles.slice(startIndex, startIndex + this.pageSize);
  }



  sortRoles(key: string): void {
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

  editRole(roleId: string | undefined): void {
    if (roleId) {
      this.router.navigate([`/role-permission/roles/edit/${roleId}`]);
    } else {
      console.error('Role ID is undefined.');
    }
  }



  prepareDeleteRole(roleId: string): void {
    this.roleIdToDelete = roleId; 
  }

  confirmDeleteRole(): void {
    if (this.roleIdToDelete) {
      this.roleService.deleteRole(this.roleIdToDelete).subscribe({
        next: (response) => {
          console.log(`Role ${this.roleIdToDelete} deleted successfully`, response);
          this.loadRoles(); // Recargar la lista de roles después de eliminar
          this.roleIdToDelete = null; // Reinicia la variable
        },
        error: (error) => {
          console.error(`Error deleting role ${this.roleIdToDelete}`, error);
          this.roleIdToDelete = null; // Reinicia la variable
        }
      });
    }
  }
}
