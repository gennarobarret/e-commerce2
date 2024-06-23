import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../core/services/auth.service';
import { UIEnhancementService } from '../../core/services/uienhancement.service';
import { UserManagementService } from '../../core/services/user-management.service';
import { FeatherIconsService } from '../../core/services/feather-icons.service';
import { Subscription } from 'rxjs';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-sidebar',
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.css'],
  standalone: true,
  imports: [CommonModule, RouterLink]
})
export class SidebarComponent implements OnInit, OnDestroy {
  user: any = { data: {} };
  private subscriptions = new Subscription();

  private _authService = inject(AuthService);
  private _UIEnhancementService = inject(UIEnhancementService);
  private _userManagementService = inject(UserManagementService);
  private _featherIconsService = inject(FeatherIconsService);

  ngOnInit(): void {
    this._UIEnhancementService.closeSideNavigationOnWidthChange();
    this._UIEnhancementService.toggleSideNavigation();
    this._featherIconsService.activateFeatherIcons();
    this.subscriptions.add(
      this._userManagementService.user$.subscribe(user => {
        if (user) {
          this.user.data = user;
        }
      })
    );
    this._userManagementService.getUser().subscribe();
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
    return nameParts.join(', ');
  }

  logout(): void {
    this._authService.logout();
  }
}
