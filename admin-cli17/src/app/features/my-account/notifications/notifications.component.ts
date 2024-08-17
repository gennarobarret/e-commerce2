import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { UserManagementService } from '../../../core/services';
import { User } from '../../../core/models';

@Component({
  selector: 'app-notifications',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule
  ],
  templateUrl: './notifications.component.html',
  styleUrl: './notifications.component.css'
})
export class NotificationsComponent {

  load_btn: boolean = false;
  user: User | null = null;

  constructor(
    private userService: UserManagementService,
  ) { }

  ngOnInit(): void {
    this.loadUserData();
  }


  loadUserData(): void {
    this.userService.getUser().subscribe({
      next: (response) => {
        this.user = response.data;  // Asignar la respuesta a la propiedad `user`
      },
      error: () => {
        console.error('Failed to load user data');
      }
    });
  }

}
