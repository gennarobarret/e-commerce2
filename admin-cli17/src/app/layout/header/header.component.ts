import { Component, OnInit, OnDestroy } from '@angular/core';
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
export class HeaderComponent implements OnInit, OnDestroy {
  isCollapsed = true;
  user: any = { data: {} };
  private subscriptions = new Subscription();

  constructor(
    private _authService: AuthService,
    private _router: Router,
    private _featherIconsService: FeatherIconsService,
    private _userManagementService: UserManagementService,
  ) { }

  ngOnInit(): void {
    this._featherIconsService.activateFeatherIcons();

    // Suscribirse al BehaviorSubject user$ para recibir actualizaciones en tiempo real
    const userSubscription = this._userManagementService.user$.subscribe({
      next: (user) => {
        if (user) {
          this.user.data = user;
          console.log("Datos del usuario actualizados:", this.user.data);
        }
      },
      error: (error) => {
        console.error('Error al cargar los datos del usuario:', error);
      }
    });

    // Agregar la suscripción al grupo de suscripciones para su posterior limpieza
    this.subscriptions.add(userSubscription);
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  displayFullName(): string {
    if (!this.user || !this.user.data) {
      return '';
    }
    const { firstName, lastName } = this.user.data;
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
    this._authService.logout();
    sessionStorage.removeItem('user');
    this._router.navigate(['/login']);
  }

  accountSetting(): void {
    this._router.navigate([`/my-account/profile/${this.user.data.userName}`]);
  }
}