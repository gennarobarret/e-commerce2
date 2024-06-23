import { Component, OnInit, Input, Output, EventEmitter, ViewChild, ElementRef, OnDestroy } from '@angular/core';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import { ToastService } from 'src/app/shared/services/toast.service';
import { UserManagementService } from 'src/app/core/services/user-management.service';
import { AuthService } from 'src/app/core/services/auth.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-user-image',
  templateUrl: './user-image.component.html',
  styleUrls: ['./user-image.component.css']
})
export class UserImageComponent implements OnInit, OnDestroy {
  @Input() profileImage!: string;
  @Output() imageUpdated = new EventEmitter<void>();
  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;

  imageUrl!: SafeUrl;
  selectedFile: File | null = null;
  userName: string = '';
  user: any = { data: {} };
  private subscriptions = new Subscription();

  constructor(
    private _toastService: ToastService,
    private _userManagementService: UserManagementService,
    private _sanitizer: DomSanitizer,
    private _authService: AuthService,
  ) { }

  ngOnInit(): void {
    this.subscriptions.add(
      this._userManagementService.user$.subscribe(user => {
        if (user) {
          this.user.data = user;
          this.userName = user.userName;
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

  fileChangeEvent(event: Event): void {
    const element = event.target as HTMLInputElement;
    const file = element.files ? element.files[0] : null;
    if (file && this.validateFileUpdate(file)) {
      this.selectedFile = file;
      this.uploadImage();
    }
  }

  private validateFileUpdate(file: File): boolean {
    const validTypes = ['image/png', 'image/webp', 'image/jpg', 'image/gif', 'image/jpeg'];
    if (!validTypes.includes(file.type) || file.size > 4000000) {
      this.showErrorMessage('Please upload a valid image file (PNG, JPG, GIF, WEBP) no larger than 5MB.');
      return false;
    }
    return true;
  }

  uploadImage(): void {
    if (!this.selectedFile) {
      this._toastService.showToast('error', 'Please select an image to upload and ensure user is loaded.');
      return;
    }
    const formData = new FormData();
    formData.append('profileImage', this.selectedFile, this.selectedFile.name);
    this._userManagementService.updateProfileImage(this.userName, formData).subscribe({
      next: response => {
        this.imageUpdated.emit();
        this.loadUserImage(response.data.profileImage);
      },
      error: error => this._toastService.showToast('error', error.message)
    });
  }

  private showErrorMessage(message: string): void {
    this._toastService.showToast('error', message);
  }

  logout(): void {
    this._authService.logout();
  }
}


// import { Component, OnInit, Input, Output, EventEmitter, ViewChild, ElementRef, OnDestroy } from '@angular/core';
// import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
// import { ToastService } from 'src/app/shared/services/toast.service';
// import { UserManagementService } from 'src/app/core/services/user-management.service';
// import { AuthService } from 'src/app/core/services/auth.service';
// import { Subscription } from 'rxjs';

// @Component({
//   selector: 'app-user-image',
//   templateUrl: './user-image.component.html',
//   styleUrls: ['./user-image.component.css']
// })
// export class UserImageComponent implements OnInit, OnDestroy {
//   @Input() profileImage!: string;
//   @Output() imageUpdated = new EventEmitter<void>();
//   @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;

//   imageUrl!: SafeUrl;
//   selectedFile: File | null = null;
//   userName: string = '';
//   user: any = { data: {} };
//   private subscriptions = new Subscription();

//   constructor(
//     private _toastService: ToastService,
//     private _userManagementService: UserManagementService,
//     private _sanitizer: DomSanitizer,
//     private _authService: AuthService,
//   ) { }

//   ngOnInit(): void {
//     this.fetchUserData();
//   }


//   ngOnDestroy(): void {
//     this.subscriptions.unsubscribe();
//   }


//   fetchUserData(): void {
//     this._userManagementService.getUser().subscribe(
//       (response) => {
//         if (!response || !response.data) {
//           console.error('Error: User data is missing');
//           this.logout();
//           return;
//         }
//         this.userName = response.data.userName;
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


//   fileChangeEvent(event: Event): void {
//     const element = event.target as HTMLInputElement;
//     const file = element.files ? element.files[0] : null;
//     if (file && this.validateFileUpdate(file)) {
//       this.selectedFile = file;
//       this.uploadImage();
//     }
//   }

//   private validateFileUpdate(file: File): boolean {
//     const validTypes = ['image/png', 'image/webp', 'image/jpg', 'image/gif', 'image/jpeg'];
//     if (!validTypes.includes(file.type) || file.size > 4000000) {
//       this.showErrorMessage('Please upload a valid image file (PNG, JPG, GIF, WEBP) no larger than 5MB.');
//       return false;
//     }
//     return true;
//   }

//   uploadImage(): void {
//     if (!this.selectedFile) {
//       this._toastService.showToast('error', 'Please select an image to upload and ensure user is loaded.');
//       return;
//     }
//     const formData = new FormData();
//     formData.append('profileImage', this.selectedFile, this.selectedFile.name);
//     this._userManagementService.updateProfileImage(this.userName, formData).subscribe({
//       next: response => {
//         this.imageUpdated.emit();
//         this.loadUserImage(response.data.profileImage);
//       },
//       error: error => this._toastService.showToast('error', error.message)
//     });
//   }

//   private showErrorMessage(message: string): void {
//     this._toastService.showToast('error', message);
//   }

//   logout(): void {
//     this._authService.logout();
//   }

// }