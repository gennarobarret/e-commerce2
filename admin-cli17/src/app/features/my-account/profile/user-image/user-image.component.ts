import { Component, OnInit, OnDestroy, OnChanges, SimpleChanges, Output, ViewChild, ElementRef, EventEmitter, Input } from '@angular/core';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import { Subscription } from 'rxjs';
import { CommonModule } from '@angular/common';
import { UserManagementService } from '../../../../core/services';
import { ToastService } from '../../../../core/services';

@Component({
  selector: 'app-user-image',
  templateUrl: './user-image.component.html',
  styleUrls: ['./user-image.component.css'],
  standalone: true,
  imports: [CommonModule]
})
export class UserImageComponent implements OnInit, OnDestroy, OnChanges {
  @Input() cssClass: string = '';
  @Input() showButtons: boolean = false;
  @Input() imageUrl: string | null | undefined = null;
  @Input() userId!: string;
  sanitizedImageUrl!: SafeUrl;
  isLoading: boolean = false;
  private subscriptions = new Subscription();
  selectedFile: File | null = null;
  @Output() imageUpdated = new EventEmitter<void>();
  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;
  disableUploadButton: boolean = false;

  constructor(
    private _sanitizer: DomSanitizer,
    private _userManagementService: UserManagementService,
    private _toastService: ToastService
  ) { }

  ngOnInit(): void {
    this.loadProfileImage();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['imageUrl']) {
      this.loadProfileImage();
    }
  }

  private loadUserImage(imageFileName: string): void {
    this.isLoading = true;
    this.subscriptions.add(
      this._userManagementService.getProfileImage(this.userId).subscribe({
        next: (safeUrl) => {
          this.sanitizedImageUrl = safeUrl;
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Error loading the user image:', error);
          this.setImageAsDefault();
          this.isLoading = false;
        },
      })
    );
  }

  private loadProfileImage(): void {
    if (this.imageUrl) {
      if (this.imageUrl.startsWith('http')) {
        this.disableUploadButton = true; // Desactiva el botón si la URL comienza con http
        this.sanitizedImageUrl = this._sanitizer.bypassSecurityTrustUrl(this.imageUrl);
      } else {
        this.disableUploadButton = false; // Habilita el botón si la URL no es externa
        this.loadUserImage(this.imageUrl);
      }
    } else {
      this.setImageAsDefault();
    }
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  private setImageAsDefault(): void {
    this.sanitizedImageUrl = this._sanitizer.bypassSecurityTrustUrl('assets/img/illustrations/profiles/profile-0.png');
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
    const maxFileSize = 5000000; // 5MB

    if (!validTypes.includes(file.type) || file.size > maxFileSize) {
      this.showErrorMessage(`Please upload a valid image file (PNG, JPG, GIF, WEBP) no larger than ${maxFileSize / 1000000}MB.`);
      return false;
    }
    return true;
  }

  uploadImage(): void {
    if (!this.selectedFile) {
      this._toastService.showToast('error', 'Please select an image to upload.');
      return;
    }

    const formData = new FormData();
    formData.append('image', this.selectedFile, this.selectedFile.name);

    this.subscriptions.add(
      this._userManagementService.uploadProfileImage(this.userId, formData).subscribe({
        next: () => {
          this.imageUpdated.emit();
          this.showSuccessMessage('Image uploaded successfully.');
          this.loadUserAfterUpload();
        },
        error: (error) => this._toastService.showToast('error', error.message)
      })
    );
  }

  private loadUserAfterUpload(): void {
    this.subscriptions.add(
      this._userManagementService.getUser().subscribe({
        next: (response) => {
          const updatedUser = response.data;
          if (updatedUser?.imageUrl) {
            this.loadUserImage(updatedUser.imageUrl);
          } else {
            this.setImageAsDefault();
          }
        },
        error: (error) => {
          this.showErrorMessage('Failed to reload user data.');
          this.setImageAsDefault();
        }
      })
    );
  }

  private showErrorMessage(message: string): void {
    this._toastService.showToast('error', message);
  }

  private showSuccessMessage(message: string): void {
    this._toastService.showToast('success', message);
  }

  get combinedClasses(): string {
    return `${this.cssClass} ${this.showButtons ? 'profile-class' : 'header-class'}`.trim();
  }
}
  