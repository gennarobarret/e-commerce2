import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, FormArray } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs';
import { AuthService } from 'src/app/core/services/auth.service';
import { ToastService } from 'src/app/shared/services/toast.service';
import { User } from 'src/app/core/interfaces/user.interface';
import { GeoInfoService } from 'src/app/shared/services/geo-info.service';
import { ValidationService } from 'src/app/core/services/validation.service';
import { UserManagementService } from 'src/app/core/services/user-management.service';
import { Country } from 'src/app/core/interfaces/country.interface';
import { State } from 'src/app/core/interfaces/state.interface';
import { GLOBAL } from 'src/app/core/config/GLOBAL';

@Component({
  selector: 'app-edit-user',
  templateUrl: './edit-user.component.html',
  styleUrls: ['./edit-user.component.css'],
})
export class EditUserComponent implements OnInit, OnDestroy {
  updateForm!: FormGroup;
  user: User | null = null;
  countries: Country[] = [];
  states: State[] = [];
  filteredStates: State[] = [];
  loading: boolean = false;
  imageUrl: any | ArrayBuffer = 'assets/img/illustrations/profiles/profile-2.png';
  selectedFile: File | null = null;
  url = GLOBAL.url;
  private subscriptions = new Subscription();

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private formBuilder: FormBuilder,
    private authService: AuthService,
    private toastService: ToastService,
    private geoInfoService: GeoInfoService,
    private validationService: ValidationService,
    private userManagementService: UserManagementService
  ) {
    this.createForm();
  }

  ngOnInit(): void {
    this.subscriptions.add(
      this.route.params.subscribe(params => {
        const userId = params['id'];
        if (userId) {
          this.fetchUserData(userId);
        } else {
          this.router.navigate(['']);
        }
      })
    );

    this.loadCountries();
  }


  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  private createForm() {
    this.updateForm = this.formBuilder.group({
      inputUserName: [{ value: '', disabled: true }, Validators.required],
      inputFirstName: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(25), Validators.pattern('^[a-zA-Z0-9\\sñÑ]+$')]],
      inputLastName: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(25), Validators.pattern('^[a-zA-Z0-9\\sñÑ]+$')]],
      inputOrganizationName: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(30), Validators.pattern('^[a-zA-Z0-9\\sñÑ]+$')]],
      inputEmailAddress: [{ value: '', disabled: true }, [Validators.required, Validators.email]],
      inputCountryAddress: [null, Validators.required],
      inputStateAddress: [null, Validators.required],
      inputPhoneNumber: ['', [Validators.required, Validators.pattern('[0-9]+')]],
      inputBirthday: ['', [Validators.required, this.validationService.validateDate.bind(this.validationService)]],
      inputRole: [{ value: '', disabled: true }, Validators.required],
      inputIdentification: ['', Validators.required],
      inputAdditionalInfo: ['', [Validators.required, Validators.minLength(10), Validators.maxLength(50), Validators.pattern('^[a-zA-Z0-9\\sñÑ]+$')]],
      groups: this.formBuilder.array([]),
      inputProfileImage: [""]
    });
  }

  fetchUserData(userId: string) {
    this.loading = true;
    this.subscriptions.add(
      this.userManagementService.getUserById(userId).subscribe({
        next: (response) => {
          const user = response.data;
          if (user) {
            this.user = user;
            this.updateFormWithUserData(this.user);
            if (this.user.countryAddress) {
              this.loadCountriesAndStates(this.user.countryAddress._id);
            }
          } else {
            this.router.navigate(['']);
          }
          this.loading = false;
        },
        error: (error) => {
          console.error(error);
          this.loading = false;
          this.router.navigate(['']);
        }
      })
    );
  }


  private updateFormWithUserData(user: User) {
    const formattedBirthday = user.birthday ? new Date(user.birthday).toISOString().split('T')[0] : '';
    this.updateForm.patchValue({
      inputUserName: user.userName,
      inputFirstName: user.firstName,
      inputLastName: user.lastName,
      inputOrganizationName: user.organizationName,
      inputCountryAddress: user.countryAddress?._id || '',
      inputStateAddress: user.stateAddress?._id || '',
      inputEmailAddress: user.emailAddress,
      inputPhoneNumber: user.phoneNumber,
      inputBirthday: formattedBirthday,
      inputRole: user.role,
      inputIdentification: user.identification,
      inputAdditionalInfo: user.additionalInfo,
    });
    this.setImageUrl(user.profileImage);
  }


  private setImageUrl(profileImagePath: string | undefined) {
    if (profileImagePath) {
      this.imageUrl = `${this.url}getUserImage/${profileImagePath}`;
    } else {
      this.imageUrl = 'assets/img/illustrations/profiles/profile-2.png';
    }
  }

  private initFormGroups(userGroups: string[] | undefined) {
    const allGroups = ['Managers', 'Developers', 'Marketing', 'Sales', 'Customer'];
    const groupControls = allGroups.map(group => {
      const isSelected = userGroups?.includes(group) ?? false;
      return this.formBuilder.control(isSelected);
    });
    this.updateForm.setControl('groups', this.formBuilder.array(groupControls));
  }

  loadCountries() {
    this.subscriptions.add(
      this.geoInfoService.getCountries().subscribe({
        next: (response) => {
          if (Array.isArray(response)) {
            this.countries = response.sort((a: Country, b: Country) => a.name.localeCompare(b.name));
          } else {
            console.error('Error: Countries data is not an array');
          }
        },
        error: (error) => {
          console.error('Error loading countries', error);
        }
      })
    );
  }

  private loadCountriesAndStates(countryId: string) {
    this.loadCountries();
    this.filterStatesByCountry(countryId);
  }

  private filterStatesByCountry(countryId: string) {
    this.subscriptions.add(
      this.geoInfoService.getStatesByCountry(countryId).subscribe({
        next: (response) => {
          this.filteredStates = response;
          if (this.user?.stateAddress) {
            this.updateForm.get('inputStateAddress')?.setValue(this.user.stateAddress._id);
          }
        },
        error: (error) => {
          console.error('Error loading states', error);
        }
      })
    );
  }

  onCountryChange(event: Event) {
    const selectElement = event.target as HTMLSelectElement;
    const countryId = selectElement.value;
    this.filterStatesByCountry(countryId);
    this.updateForm.get('inputStateAddress')?.setValue('');
  }

  fileChangeEvent(event: Event): void {
    const inputElement = event.target as HTMLInputElement;
    if (inputElement.files && inputElement.files.length > 0) {
      this.selectedFile = inputElement.files[0];
      this.validateAndUpdateImg(this.selectedFile);
    }
  }

  private validateAndUpdateImg(file: File) {
    if (!file) {
      this.updateForm.get('inputProfileImage')?.setErrors({ required: true });
      return;
    }
    const errors = this.validateFileUpdate(file);
    if (errors) {
      this.updateForm.get('inputProfileImage')?.setErrors(errors);
    } else {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        if (reader.result) {
          this.imageUrl = reader.result as string;
          this.updateForm.patchValue({ inputProfileImage: reader.result });
        }
      };
    }
  }

  private validateFileUpdate(file: File): { [key: string]: any } | null {
    const validTypes = ['image/png', 'image/webp', 'image/jpg', 'image/gif', 'image/jpeg'];
    if (validTypes.includes(file.type)) {
      if (file.size <= 4000000) {
        return null;
      } else {
        this.toastService.showToast('error', 'The image cannot exceed 4 mb');
        return { invalidFileSize: true };
      }
    } else {
      this.toastService.showToast('error', 'The file must be a PNG, WEBP, JPG, GIF, or JPEG image.');
      return { invalidFileType: true };
    }
  }

  update() {
    if (this.updateForm.invalid) {
      this.markFormGroupTouched(this.updateForm);
      this.toastService.showToast('error', 'There are errors on the form. Please check the fields.');
      return;
    }

    if (this.user && this.user._id) {
      const formData = this.createFormData();
      this.loading = true;
      this.subscriptions.add(
        this.userManagementService.updateUser(formData, this.user._id).subscribe({
          next: () => {
            this.toastService.showToast('success', 'Profile updated successfully.');
            this.loading = false;
          },
          error: () => {
            this.toastService.showToast('error', 'Update failed');
            this.loading = false;
          }
        })
      );
    } else {
      this.toastService.showToast('error', 'User ID is missing.');
    }
  }

  private createFormData(): FormData {
    const formData = new FormData();
    if (this.user && this.user._id) {
      formData.append('_id', this.user._id);
    }
    Object.keys(this.updateForm.controls).forEach(key => {
      const control = this.updateForm.get(key);
      if (control && control.value) {
        formData.append(key, control.value);
      }
    });
    if (this.selectedFile) {
      formData.append('profileImage', this.selectedFile);
    }
    return formData;
  }


  private markFormGroupTouched(formGroup: FormGroup) {
    Object.values(formGroup.controls).forEach(control => {
      control.markAsTouched();
    });
  }
}