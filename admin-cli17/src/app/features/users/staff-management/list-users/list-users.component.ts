    import { Component, OnInit } from '@angular/core';
    import { Router } from '@angular/router';
    import { UserManagementService } from '../../../../core/services';
    import { User } from '../../../../core/models';
    import { CommonModule } from '@angular/common';
    import { FormsModule } from '@angular/forms';
    import { RouterLink } from '@angular/router';
    import { ToastService } from '../../../../core/services';
    import { DomSanitizer, SafeUrl } from '@angular/platform-browser';


    declare var window: any;


    @Component({
      selector: 'app-list-users',
      standalone: true,
      imports: [CommonModule, FormsModule, RouterLink],
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

      userIdToDelete: string | null = null; // Variable para almacenar el ID del usuario a eliminar

      constructor(
        private userService: UserManagementService,
        private router: Router,
        private toastService: ToastService,
        private sanitizer: DomSanitizer

      ) { }

      ngOnInit(): void {
        this.loadUsers();
      }

      loadUsers(): void {
        this.userService.listAllUsers().subscribe({
          next: (response) => {
            this.users = response.data;
            this.loadUserImages();
            this.applyFilter();
            this.load_data = false;
          },
          error: (error) => {
            console.error('Error loading users', error);
            this.load_data = false;
          }
        });
      }


      loadUserImages(): void {
        this.users.forEach(user => {
          if (user.profileImage) {
            if (user.profileImage.startsWith('http')) {
              user.profileImage = this.sanitizer.bypassSecurityTrustUrl(user.profileImage) as string;
            } else {
              this.userService.getProfileImage(user.profileImage).subscribe({
                next: (imageUrl: SafeUrl) => {
                  user.profileImage = imageUrl as string;
                },
                error: () => {
                  this.onImageError(user);
                }
              });
            }
          } else {
            this.onImageError(user);
          }
        });
      }


      onImageError(user: User): void {
        user.profileImage = 'assets/img/illustrations/profiles/profile-0.png';
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
        this.router.navigate([`/users/edit/${userId}`]);
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
              this.loadUsers(); // Recargar la lista de usuarios después de eliminar
              this.userIdToDelete = null; // Reinicia la variable

              // Cerrar el modal manualmente
              const deleteModal = document.getElementById('deleteUserModal');
              if (deleteModal) {
                const modalInstance = window.bootstrap.Modal.getInstance(deleteModal);
                modalInstance?.hide();
              }

            },
            error: (error) => {
              console.error(`Error deleting user ${this.userIdToDelete}`, error);
              this.userIdToDelete = null; // Reinicia la variable
              // Mostrar el mensaje de error proveniente del backend
              if (error.error && error.error.status && error.error.message) {
                this.toastService.showToast(error.error.status, `${error.error.message}`);
              }
              // Cerrar el modal manualmente si hay un error
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
