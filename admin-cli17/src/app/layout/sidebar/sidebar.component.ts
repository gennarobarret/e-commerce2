import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../core/services/auth.service';
import { UIEnhancementService } from '../../core/services/uienhancement.service';
import { FeatherIconsService } from '../../core/services/feather-icons.service';
import { UserManagementService } from '../../core/services/user-management.service';
import { Subscription } from 'rxjs';
import { RouterLink } from '@angular/router';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';

@Component({
  selector: 'app-sidebar',
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.css'],
  standalone: true,
  imports: [CommonModule, RouterLink]
})
export class SidebarComponent implements OnInit, OnDestroy {
  user: any = { data: {} };
  imageUrl!: SafeUrl; // Cambiar a SafeUrl
  private subscriptions = new Subscription();

  private _authService = inject(AuthService);
  private _UIEnhancementService = inject(UIEnhancementService);
  private _featherIconsService = inject(FeatherIconsService);
  private _userManagementService = inject(UserManagementService);
  private _sanitizer = inject(DomSanitizer);

  ngOnInit(): void {
    this._UIEnhancementService.closeSideNavigationOnWidthChange();
    this._UIEnhancementService.toggleSideNavigation();
    this._featherIconsService.activateFeatherIcons();

    const userSubscription = this._userManagementService.user$.subscribe({
      next: (user) => {
        if (user) {
          this.user.data = user;
          // console.log("Datos del usuario actualizados:", this.user.data);
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

  private loadUserImage(userName: string): void {
    this.subscriptions.add(
      this._userManagementService.getProfileImage(userName).subscribe({
        next: (safeUrl) => {
          this.imageUrl = safeUrl;
        },
        error: (error) => {
          console.error('Error loading the user image:', error);
          this.setImageAsDefault();
        },
      })
    );
  }

  private setImageAsDefault(): void {
    this.imageUrl = this._sanitizer.bypassSecurityTrustUrl('assets/img/illustrations/profiles/profile-0.png');
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
    this._authService.logoutAndRedirect();
  }

}
