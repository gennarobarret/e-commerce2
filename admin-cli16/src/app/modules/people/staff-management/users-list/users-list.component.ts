import { Component } from '@angular/core';
import { FeatherIconsService } from 'src/app/core/services/feather-icons.service';
import { UserManagementService } from 'src/app/core/services/user-management.service';
import { User } from 'src/app/core/interfaces/user.interface';
import { GLOBAL } from "src/app/core/config/GLOBAL";


@Component({
  selector: 'app-users-list',
  templateUrl: './users-list.component.html',
  styleUrls: ['./users-list.component.css']
})
export class UsersListComponent {
  url = GLOBAL.url;
  users: User[] = [];
  filter = '';
  load_data = true;
  sortOrder: 'asc' | 'desc' = 'asc';
  page = 1;
  pageSize = 20;
  filterKeys: string[] = ['userName', 'emailAddress', 'role']
  selectedFilterKey: string = 'userName';
  searchText: string = '';


  constructor(
    private _featherIconsService: FeatherIconsService,
    private _userManagementService: UserManagementService
  ) { }

  ngOnInit(): void {
    this.fetchUsersData();
  }


  fetchUsersData(): void {
    this._userManagementService.listAllUsers().subscribe({
      next: (response) => {
        if (response && response.data) {
          this.users = response.data;
          this.load_data = false;
          console.log("🚀 ~ UsersListComponent ~ this._userManagementService.listAllUsers ~ this.users :", this.users);
          this._featherIconsService.activateFeatherIcons();
        }
      },
      error: (error) => {
        console.error('Failed to get users:', error);
      }
    });
  }


  getImageUrl(profileImagePath: string): string {
    if (profileImagePath.startsWith('http')) {
      return profileImagePath;
    } else {
      return `${this.url}geUserImage/${profileImagePath}`;
    }
  }



  private getPropertyValue<T, K extends keyof T>(obj: T, key: K): T[K] | string {
    const value = obj[key];
    if (typeof value === 'number' || typeof value === 'string' || value instanceof Date) {
      return value;
    }
    return '';
  }



  search() {
    this.load_data = true; // Mostrar el indicador de carga
    this._userManagementService.listAllUsers(this.selectedFilterKey, this.searchText).subscribe({
      next: (response) => {
        this.users = response.data || [];
        console.log("🚀 ~ UsersListComponent ~ this._userManagementService.listAllUsers ~ this.users:", this.users)
        this.load_data = false;
      },
      error: (error) => {
        console.error('Failed to get users:', error);
        this.load_data = false;
      }
    });
  }

  clear() {
    // this.users = '';
    this.fetchUsersData();
  }

  getBadgeClass(group: string): string {
    const baseClass = 'badge';
    switch (group) {
      case 'Sales':
        return `${baseClass} bg-green-soft text-green`;
      case 'Developers':
        return `${baseClass} bg-blue-soft text-blue`;
      case 'Marketing':
        return `${baseClass} bg-red-soft text-red`;
      case 'Managers':
        return `${baseClass} bg-purple-soft text-purple`;
      case 'Customer':
        return `${baseClass} bg-yellow-soft text-yellow`;
      default:
        return `${baseClass} bg-light text-dark`;
    }
  }


  sort(key: keyof User) {
    this.users.sort((a, b) => {
      let valueA = this.getPropertyValue(a, key);
      let valueB = this.getPropertyValue(b, key);

      // Tu lógica de comparación aquí
      if (typeof valueA === 'number' && typeof valueB === 'number') {
        return this.sortOrder === 'asc' ? valueA - valueB : valueB - valueA;
      }

      if (valueA instanceof Date && valueB instanceof Date) {
        return this.sortOrder === 'asc' ? valueA.getTime() - valueB.getTime() : valueB.getTime() - valueA.getTime();
      }

      valueA = String(valueA).toLowerCase();
      valueB = String(valueB).toLowerCase();
      if (valueA < valueB) {
        return this.sortOrder === 'asc' ? -1 : 1;
      } else if (valueA > valueB) {
        return this.sortOrder === 'asc' ? 1 : -1;
      } else {
        return 0;
      }
    });

    this.sortOrder = this.sortOrder === 'asc' ? 'desc' : 'asc';
  }

}
