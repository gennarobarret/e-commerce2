import { Component, OnInit, OnDestroy } from '@angular/core';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { AuthService } from 'src/app/core/services/auth.service';
import { UserManagementService } from 'src/app/core/services/user-management.service';
import { FeatherIconsService } from 'src/app/core/services/feather-icons.service';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css'],
})
export class HeaderComponent implements OnInit, OnDestroy {
  isCollapsed = true;
  imageUrl!: SafeUrl;
  user: any = { data: {} };
  private subscriptions = new Subscription();

  constructor(
    private _authService: AuthService,
    private _router: Router,
    private _userManagementService: UserManagementService,
    private _featherIconsService: FeatherIconsService,
    private _sanitizer: DomSanitizer
  ) { }

  ngOnInit(): void {
    this._featherIconsService.activateFeatherIcons();
    this.subscriptions.add(
      this._userManagementService.user$.subscribe(user => {
        if (user) {
          this.user.data = user;
          if (user.profileImage) {
            if (user.profileImage.startsWith('http')) {
              this.imageUrl = this._sanitizer.bypassSecurityTrustUrl(user.profileImage);
            } else {
              this.loadUserImage(user.profileImage);
            }
          } else {
            this.setImageAsDefault();
          }
        }
      })
    );
    this._userManagementService.getUser().subscribe();
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  private loadUserImage(profileImage: string): void {
    const sub = this._userManagementService.getUserImageUrl(profileImage).subscribe(
      (blob) => {
        const objectUrl = URL.createObjectURL(blob);
        this.imageUrl = this._sanitizer.bypassSecurityTrustUrl(objectUrl);
      },
      (error) => {
        console.error('Error loading the user image:', error);
        this.setImageAsDefault();
      }
    );
    this.subscriptions.add(sub);
  }

  private setImageAsDefault(): void {
    this.imageUrl = 'assets/img/illustrations/profiles/profile-0.png';
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

  accountSetting(): void {
    this._router.navigate([`/my-account/profile/${this.user.data.userName}`]);
  }
}


// import { Component, OnInit, OnDestroy } from '@angular/core';
// import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
// import { Router } from '@angular/router';
// import { Subscription } from 'rxjs';
// import { AuthService } from 'src/app/core/services/auth.service';
// import { UserManagementService } from 'src/app/core/services/user-management.service';
// import { FeatherIconsService } from 'src/app/core/services/feather-icons.service';

// @Component({
//   selector: 'app-header',
//   templateUrl: './header.component.html',
//   styleUrls: ['./header.component.css'],
// })
// export class HeaderComponent implements OnInit, OnDestroy {
//   isCollapsed = true;
//   imageUrl!: SafeUrl;
//   user: any = { data: {} };
//   private subscriptions = new Subscription();

//   constructor(
//     private _authService: AuthService,
//     private _router: Router,
//     private _userManagementService: UserManagementService,
//     private _featherIconsService: FeatherIconsService,
//     private _sanitizer: DomSanitizer
//   ) { }

//   ngOnInit(): void {
//     this._featherIconsService.activateFeatherIcons();
//     this.fetchUserData();
//   }

//   ngOnDestroy(): void {
//     this.subscriptions.unsubscribe();
//   }

//   fetchUserData(): void {
//     const sub = this._userManagementService.getUser().subscribe(
//       (response) => {
//         if (!response || !response.data) {
//           console.error('Error: User data is missing');
//           this.logout();
//           return;
//         }
//         this.user.data = response.data;
//         if (response.data.profileImage) {
//           if (response.data.profileImage.startsWith('http')) {
//             this.imageUrl = this._sanitizer.bypassSecurityTrustUrl(response.data.profileImage);
//           } else {
//             this.loadUserImage(response.data.profileImage);
//           }
//         } else {
//           this.setImageAsDefault();
//         }
//       },
//       (error) => {
//         console.error(error);
//       }
//     );
//     this.subscriptions.add(sub);
//   }


//   private loadUserImage(profileImage: string): void {
//     const sub = this._userManagementService
//       .getUserImageUrl(profileImage)
//       .subscribe(
//         (blob) => {
//           const objectUrl = URL.createObjectURL(blob);
//           this.imageUrl = this._sanitizer.bypassSecurityTrustUrl(objectUrl);
//         },
//         (error) => {
//           console.error('Error loading the user image:', error);
//           this.setImageAsDefault();
//         }
//       );
//     this.subscriptions.add(sub);
//   }

//   private setImageAsDefault(): void {
//     this.imageUrl = 'assets/img/illustrations/profiles/profile-0.png';
//   }

//   displayFullName(): string {
//     if (!this.user || !this.user.data) {
//       return '';
//     }
//     const { firstName, lastName } = this.user.data;
//     let nameParts = [];
//     if (firstName && firstName !== 'notSpecified') {
//       nameParts.push(firstName);
//     }
//     if (lastName && lastName !== 'notSpecified') {
//       nameParts.push(lastName);
//     }
//     return nameParts.join(', ');
//   }


//   logout(): void {
//     this._authService.logout();
//   }

//   accountSetting(): void {
//     this._router.navigate([`/my-account/profile/${this.user.data.userName}`]);
//   }

// }
