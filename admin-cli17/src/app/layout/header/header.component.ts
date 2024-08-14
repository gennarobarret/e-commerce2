import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { AuthService } from '../../core/services/auth.service';
import { FeatherIconsService } from '../../core/services/feather-icons.service';
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
  ) { }

  ngOnInit(): void {
    this._featherIconsService.activateFeatherIcons();
    const userData = sessionStorage.getItem('userData');
    if (userData) {
      this.user.data = JSON.parse(userData);
      // console.log("Profile Image URL:", this.user.data.profileImage);
    }
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
    sessionStorage.removeItem('user'); 
  }

  accountSetting(): void {
    this._router.navigate([`/my-account/profile/${this.user.data.userName}`]);
  }
}
