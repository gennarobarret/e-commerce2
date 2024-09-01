import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { UserManagementService } from '../../../../core/services';
import { User } from '../../../../core/models';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ToastService } from '../../../../core/services';
import { DomSanitizer } from '@angular/platform-browser';
import { UserImageComponent } from '../../../my-account/profile/user-image/user-image.component';

@Component({
  selector: 'app-list-users',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, UserImageComponent],
  templateUrl: './list-users.component.html',
  styleUrls: ['./list-users.component.css']
})
export class ListUsersComponent implements OnInit {
  users: User[] = [];
  filteredUsers: User[] = [];
  page = 1;
  pageSize = 10;
  totalPages = 0;
  pageSizeOptions = [5, 10, 25, 50, 100];
  sortOrder: 'asc' | 'desc' = 'asc';
  sortKey: string = 'userName';
  load_data = true;
  selectedFilterKey: string = 'userName';
  searchText: string = '';
  filterKeys: string[] = [
    'userName',
    'emailAddress',
    'role',
    'firstName',
    'lastName',
    'authMethod',
    'organizationName',
    'additionalInfo',
    'birthday',
    'identification',
    'countryAddress.name',
    'phoneNumber',
    'isActive'
  ];

  userIdToDelete: string | null = null;
  authenticatedUserId: string | null | undefined = null;

  constructor(
    private userService: UserManagementService,
    private router: Router,
    private toastService: ToastService,
    private sanitizer: DomSanitizer
  ) { }

  ngOnInit(): void {
    this.loadUsers();

    // Subscribe to the authenticated user
    this.userService.user$.subscribe({
      next: (user: User | null) => {
        if (user) {
          this.authenticatedUserId = user._id; // Store the authenticated user's ID
        }
      },
      error: (error) => {
        console.error('Error fetching the authenticated user', error);
      }
    });
  }

  loadUsers(): void {
    this.userService.listAllUsers().subscribe({
      next: (response) => {
        this.users = response.data;
        this.applyFilter();
        this.load_data = false;
      },
      error: (error) => {
        console.error('Error loading users', error);
        this.load_data = false;
      }
    });
  }

  onImageError(user: User): void {
    user.imageUrl = 'assets/img/illustrations/profiles/profile-0.png';
  }

  applyFilter(): void {
    let filtered = this.users;

    if (this.searchText !== '') {
      filtered = filtered.filter(user => {
        const value = this.getNestedProperty(user, this.selectedFilterKey);
        return value && value.toString().toLowerCase().includes(this.searchText.toLowerCase());
      });
    }

    this.filteredUsers = filtered.sort((a, b) => {
      const valueA = this.getNestedProperty(a, this.sortKey) ?? '';
      const valueB = this.getNestedProperty(b, this.sortKey) ?? '';

      const strValueA = valueA.toString().toLowerCase();
      const strValueB = valueB.toString().toLowerCase();

      if (strValueA < strValueB) return this.sortOrder === 'asc' ? -1 : 1;
      if (strValueA > strValueB) return this.sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    this.totalPages = Math.ceil(this.filteredUsers.length / this.pageSize);
    const startIndex = (this.page - 1) * this.pageSize;
    this.filteredUsers = this.filteredUsers.slice(startIndex, startIndex + this.pageSize);
  }

  sortUsers(key: string): void {
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

  editUser(userId: string): void {
    if (userId === this.authenticatedUserId) {
      this.toastService.showToast('warning', 'You cannot edit your own account.');
    } else {
      this.router.navigate([`/users/edit/${userId}`]);
    }
  }

  prepareDeleteUser(userId: string): void {
    this.userIdToDelete = userId;
  }

  confirmDeleteUser(): void {
    if (this.userIdToDelete) {
      this.userService.deleteUser(this.userIdToDelete).subscribe({
        next: (response) => {
          console.log(`User ${this.userIdToDelete} deleted successfully`, response);

          if (response && response.status === 'success') {
            this.toastService.showToast(response.status, `${response.message}`);
          }
          this.loadUsers(); // Reload the list of users after deletion
          this.userIdToDelete = null; // Reset the variable

          // Manually close the modal
          const deleteModal = document.getElementById('deleteUserModal');
          if (deleteModal) {
            const modalInstance = window.bootstrap.Modal.getInstance(deleteModal);
            modalInstance?.hide();
          }

        },
        error: (error) => {
          console.error(`Error deleting user ${this.userIdToDelete}`, error);
          this.userIdToDelete = null; // Reset the variable
          // Show the error message from the backend
          if (error.error && error.error.status && error.error.message) {
            this.toastService.showToast(error.error.status, `${error.error.message}`);
          }
          // Manually close the modal if there is an error
          const deleteModal = document.getElementById('deleteUserModal');
          if (deleteModal) {
            const modalInstance = window.bootstrap.Modal.getInstance(deleteModal);
            modalInstance?.hide();
          }
        }
      });
    }
  }

}

// Global declaration to recognize window.bootstrap
declare global {
  interface Window {
    bootstrap: any;
  }
}
