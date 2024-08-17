import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { FeatherIconsService } from '../../../core/services';
import { AuthService } from '../../../core/services';
import { ToastService } from '../../../core/services';
import { UserManagementService } from '../../../core/services';
import { LocationDataService } from '../../../core/services';
import { ValidationService } from '../../../core/services';
import { User } from '../../../core/models';
import { Country } from '../../../core/interfaces';
import { State } from '../../../core/interfaces';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { UserImageComponent } from './user-image/user-image.component';
import { SpinnerComponent } from '../../../shared/components/spinner/spinner.component';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.css'],
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule, UserImageComponent, SpinnerComponent]
})
export class ProfileComponent implements OnInit, OnDestroy {
  updateForm!: FormGroup;
  user: User | null = null;
  countries: Country[] = [];
  states: State[] = [];
  filteredStates: State[] = [];
  loading: boolean = false;
  showButtons: boolean = true;
  private subscriptions = new Subscription();

  constructor(
    private router: Router,
    private formBuilder: FormBuilder,
    private authService: AuthService,
    private toastService: ToastService,
    private locationDataService: LocationDataService,
    private validationService: ValidationService,
    private userManagementService: UserManagementService,
    private _featherIconsService: FeatherIconsService,
  ) {
    this.createForm();
  }

  ngOnInit(): void {
    this._featherIconsService.activateFeatherIcons();
    this.fetchUserData();
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  fetchUserData() {
    this.loading = true;
    this.subscriptions.add(
      this.userManagementService.getUser().subscribe({
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
  }

  loadCountries() {
    if (this.countries.length === 0) {
      this.subscriptions.add(
        this.locationDataService.getCountries().subscribe({
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
  }

  private loadCountriesAndStates(countryId: string) {
    this.loadCountries();
    this.filterStatesByCountry(countryId);
  }

  private filterStatesByCountry(countryId: string | undefined, resetState: boolean = false) {
    if (!countryId) {
      console.error('Country ID is undefined');
      return;
    }

    this.subscriptions.add(
      this.locationDataService.getStatesByCountry(countryId).subscribe({
        next: (response) => {
          this.filteredStates = response;
          if (resetState) {
            this.updateForm.get('inputStateAddress')?.setValue('');
          } else {
            this.updateForm.get('inputStateAddress')?.setValue(this.user?.stateAddress?._id || '');
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

    if (countryId) {
      this.updateForm.get('inputStateAddress')?.setValue('');
      this.filterStatesByCountry(countryId, true);
    } else {
      console.warn("Country ID is undefined");
    }
  }

  private createForm() {
    this.updateForm = this.formBuilder.group({
      inputUserName: [{ value: '', disabled: true }, Validators.required],
      inputFirstName: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(25), Validators.pattern('^[a-zA-Z0-9\\sñÑ]+$')]],
      inputLastName: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(25), Validators.pattern('^[a-zA-Z0-9\\sñÑ]+$')]],
      inputOrganizationName: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(30), Validators.pattern('^[a-zA-Z0-9\\sñÑ]+$')]],
      inputEmailAddress: [{ value: '', disabled: true }, [Validators.required, Validators.email]],
      inputCountryAddress: ['', Validators.required],
      inputStateAddress: ['', Validators.required],
      inputPhoneNumber: ['', [Validators.required, Validators.pattern('[0-9]+')]],
      inputBirthday: ['', [Validators.required, this.validationService.validateDate.bind(this.validationService)]],
      inputRole: [{ value: '', disabled: true }, Validators.required],
      inputIdentification: ['', Validators.required],
      inputAdditionalInfo: ['', [Validators.required, Validators.minLength(10), Validators.maxLength(50), Validators.pattern('^[a-zA-Z0-9\\sñÑ]+$')]],
    });
  }

  update() {
    if (this.updateForm.invalid) {
      this.markFormGroupTouched(this.updateForm);
      this.toastService.showToast('error', 'There are errors on the form. Please check the fields.');
      return;
    }

    const formData = this.createJsonData();

    const userId = this.user?._id || '';
    console.log('User ID:', userId);

    this.subscriptions.add(
      this.userManagementService.updateUser(formData, userId).subscribe({
        next: () => {
          this.toastService.showToast('success', 'Profile updated successfully.');
        },
        error: () => {
          this.toastService.showToast('error', 'Update failed');
        }
      })
    );
  }

  private createJsonData(): any {
    return {
      firstName: this.updateForm.get('inputFirstName')?.value,
      lastName: this.updateForm.get('inputLastName')?.value,
      organizationName: this.updateForm.get('inputOrganizationName')?.value,
      countryAddress: this.updateForm.get('inputCountryAddress')?.value,
      stateAddress: this.updateForm.get('inputStateAddress')?.value,
      phoneNumber: this.updateForm.get('inputPhoneNumber')?.value,
      birthday: this.updateForm.get('inputBirthday')?.value,
      identification: this.updateForm.get('inputIdentification')?.value,
      additionalInfo: this.updateForm.get('inputAdditionalInfo')?.value,
    };
  }

  private markFormGroupTouched(formGroup: FormGroup) {
    Object.values(formGroup.controls).forEach(control => {
      control.markAsTouched();
    });
  }
}
