import { Component, OnInit, OnDestroy } from '@angular/core';
import { AuthService } from 'src/app/core/services/auth.service';
import { UIBootstrapService } from 'src/app/core/services/uibootstrap.service';
import { UserManagementService } from "src/app/core/services/user-management.service";
import { FeatherIconsService } from 'src/app/core/services/feather-icons.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-sidebar',
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.css']
})
export class SidebarComponent implements OnInit, OnDestroy {
  user: any = { data: {} };
  private subscriptions = new Subscription();

  constructor(
    private _authService: AuthService,
    private _uiBootstrapService: UIBootstrapService,
    private _userManagementService: UserManagementService,
    private _featherIconsService: FeatherIconsService
  ) { }

  ngOnInit(): void {
    this._uiBootstrapService.closeSideNavigationOnWidthChange();
    this._uiBootstrapService.toggleSideNavigation();
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
