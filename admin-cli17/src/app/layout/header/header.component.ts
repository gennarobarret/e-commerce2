import { Component, OnInit, OnDestroy, ChangeDetectorRef, AfterViewInit } from '@angular/core';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { AuthService } from '../../core/services/auth.service';
import { FeatherIconsService } from '../../core/services/feather-icons.service';
import { UserManagementService } from '../../core/services/user-management.service';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { DropdownNotificationsComponent } from '../../features/notifications/dropdown-notifications/dropdown-notifications.component';
import { UserImageComponent } from '../../features/my-account/profile/user-image/user-image.component';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css'],
  standalone: true,
  imports: [CommonModule, RouterModule, DropdownNotificationsComponent, UserImageComponent]
})
export class HeaderComponent implements OnInit, OnDestroy, AfterViewInit {
  isCollapsed = true;
  user$ = this._userManagementService.user$;  // Usamos AsyncPipe en la plantilla
  private subscriptions = new Subscription();

  constructor(
    private _authService: AuthService,
    private _router: Router,
    private _featherIconsService: FeatherIconsService,
    private _userManagementService: UserManagementService,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit(): void {
    this.loadUserData();
  }

  ngAfterViewInit(): void {
    this._featherIconsService.activateFeatherIcons();
  }

  private loadUserData(): void {
    this.subscriptions.add(
      this._userManagementService.getUser().subscribe({
        next: (response) => {
          const user = response.data;
          if (user) {
            this._userManagementService.setUser(user);
            this.cdr.detectChanges();
          }
        },
        error: (error) => {
          console.error('Error al cargar los datos del usuario:', error);
        }
      })
    );
  }


  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }
  
  displayFullName(user: any): string {
    if (!user || !user.data) {
      return '';
    }
    const { firstName, lastName } = user.data;
    let nameParts = [];
    if (firstName && firstName !== 'notSpecified') {
      nameParts.push(firstName);
    }
    if (lastName && lastName !== 'notSpecified') {
      nameParts.push(lastName);
    }
    return nameParts.join(' ');
  }


  logout(): void {
    this._authService.logoutAndRedirect();
  }

  accountSetting(userId: string): void {
    this._router.navigate([`/my-account/profile/${userId}`]);
  }

}
