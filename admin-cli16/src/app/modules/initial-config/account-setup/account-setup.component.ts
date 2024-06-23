// account-setup.component.ts

import { Component } from "@angular/core";
import {
  FormBuilder,
  FormGroup,
  Validators
} from "@angular/forms";
import { Router } from "@angular/router";
import { AuthService } from "src/app/core/services/auth.service";
import { ToastService } from "src/app/shared/services/toast.service";
import { User } from "src/app/core/models/user.interface";
import { UserRole } from "src/app/core/models/roles.type";
import { GeoInfoService } from "src/app/shared/services/geo-info.service";
import { ValidationService } from "src/app/core/services/validation.service";
import { GLOBAL } from "src/app/core/config/GLOBAL";
import { Renderer2, ViewChild, ElementRef } from '@angular/core';
import { Subscription } from 'rxjs';
import { Country } from "src/app/core/models/country.interface";
import { State } from "src/app/core/models/state.interface";
import { UserManagementService } from "src/app/core/services/user-management.service";
import { forkJoin } from 'rxjs';
import { catchError } from 'rxjs/operators';

@Component({
  selector: 'app-account-setup',
  templateUrl: './account-setup.component.html',
  styleUrls: ['./account-setup.component.css']
})
export class AccountSetupComponent {
  accountSetupForm!: FormGroup;
  user: User | null = null;
  countries: Country[] = [];
  states: State[] = [];
  filteredStates: State[] = [];
  load_data: boolean = false;
  load_btn: boolean = false;
  url = GLOBAL.url;
  imageUrl: any | ArrayBuffer = 'assets/img/illustrations/profiles/profile-2.png';
  selectedFile: File | null = null;

  private userName: string = '';
  private userId: string = '';
  private userRole: string = '';
  private userEmailAddress: string = '';
  private subscriptions = new Subscription();

  constructor(
    private _router: Router,
    private _formBuilder: FormBuilder,
    private _renderer: Renderer2,
    private _authService: AuthService,
    private _toastService: ToastService,
    private _geoInfoService: GeoInfoService,
    private _validationService: ValidationService,
    private _userManagementService: UserManagementService,
  ) {
    this.accountSetupForm = this._formBuilder.group({
      inputUserName: [{ value: '', disabled: true }, [Validators.required]
      ],
      inputFirstName: [
        "",
        [
          Validators.required,
          Validators.minLength(3),
          Validators.maxLength(25),
          Validators.pattern("^[a-zA-Z0-9\\sñÑ]+$")
        ]
      ],
      inputLastName: [
        "",
        [
          Validators.required,
          Validators.minLength(3),
          Validators.maxLength(25),
          Validators.pattern("^[a-zA-Z0-9\\sñÑ]+$")
        ]
      ],
      inputOrganizationName: [
        "",
        [
          Validators.required,
          Validators.minLength(3),
          Validators.maxLength(30),
          Validators.pattern("^[a-zA-Z0-9\\sñÑ]+$")
        ]
      ],
      inputEmailAddress: [{ value: '', disabled: true }, [Validators.required, Validators.email]],
      inputCountryAddress: ["", [Validators.required]],
      inputStateAddress: ["", [Validators.required]],
      inputPhoneNumber: [
        "",
        [Validators.required, Validators.pattern("[0-9]+")]
      ],
      inputBirthday: [
        "",
        [Validators.required, this._validationService.validateDate.bind(this)]
      ],
      inputRole: [{ value: '', disabled: true }, [Validators.required]],
      inputIdentification: [
        "",
        [Validators.required]
      ],
      inputAdditionalInfo: [
        "",
        [
          Validators.required,
          Validators.minLength(10),
          Validators.maxLength(50),
          Validators.pattern("^[a-zA-Z0-9\\sñÑ]+$")
        ]
      ]
    });
  }

  ngOnInit(): void {
    this.load_data = true;
    this.loadCountriesAndStates().subscribe(([countries, states]) => {
      if (countries) {
        this.countries = countries.sort((a: Country, b: Country) =>
          a.name.localeCompare(b.name)
        );
      }
      if (states) {
        this.states = states.sort((a: State, b: State) => a.province_name.localeCompare(b.province_name));
      }
      this.load_data = false;
    });
    this.fetchUserData();
  }

  fetchUserData() {
    this._userManagementService.getUser().subscribe(
      response => {
        if (response.data === undefined) {
          this._router.navigate([""]);
        } else {
          this.user = response.data as User;
          if (!this.user._id) {
            console.error('Error: _id is missing from the user data');
            return;
          }
          this.userId = this.user._id;
          this.userName = this.user.userName;
          this.userRole = this.user.role;
          this.userEmailAddress = this.user.emailAddress;
          this.filterStatesByCountry(this.user.countryAddress);
          this.accountSetupFormWithUserData(this.user);
        }
      },
      error => {
        console.error(error);
      }
    );
  }

  private accountSetupFormWithUserData(userData: User) {
    let formattedBirthday = '';
    if (userData.birthday) {
      const birthdayDate = new Date(userData.birthday);
      if (!isNaN(birthdayDate.getTime())) {
        formattedBirthday = birthdayDate.toISOString().split('T')[0];
      }
    }

    this.imageUrl = this.url + 'get_picture_profile/' + userData.profileImage;
    this.accountSetupForm.patchValue({
      inputUserName: userData.userName,
      inputFirstName: userData.firstName,
      inputLastName: userData.lastName,
      inputOrganizationName: userData.organizationName,
      inputCountryAddress: userData.countryAddress,
      inputStateAddress: userData.stateAddress,
      inputEmailAddress: userData.emailAddress,
      inputPhoneNumber: userData.phoneNumber,
      inputBirthday: formattedBirthday,
      inputRole: userData.role,
      inputIdentification: userData.identification,
      inputAdditionalInfo: userData.additionalInfo,
      inputCreatedAt: userData.createdAt,
      inputUpdatedAt: userData.updatedAt,
    });
  }


  private loadCountriesAndStates() {
    return forkJoin([
      this.loadCountries(),
      this.loadStates()
    ]).pipe(
      catchError(error => {
        console.error("Error loading data", error);
        return [[], []];
      })
    );
  }

  private loadCountries() {
    return this._geoInfoService.get_Countries()
      .pipe(
        catchError(error => {
          console.error("Error loading countries", error);
          return [];
        })
      );
  }

  private loadStates() {
    return this._geoInfoService.get_States()
      .pipe(
        catchError(error => {
          console.error("Error loading states", error);
          return [];
        })
      );
  }

  filterStatesByCountry(countryId: string | number) {
    const numericCountryId = Number(countryId);
    this.filteredStates = this.states.filter(
      state => state.country_id === numericCountryId
    );
  }

  onCountryChange(event: Event) {
    const selectElement = event.target as HTMLSelectElement;
    const countryId = selectElement.value;
    this.filterStatesByCountry(countryId);
  }

  goToNextStep() {
    this.load_data = true;
    if (this.accountSetupForm.valid) {
      // const formValues = this.accountSetupForm.value;
      // const mappedFormValues = {
      //   firstName: formValues.inputFirstName,
      //   lastName: formValues.inputLastName,
      //   organizationName: formValues.inputOrganizationName,
      //   countryAddress: formValues.inputCountryAddress,
      //   stateAddress: formValues.inputStateAddress,
      //   phoneNumber: formValues.inputPhoneNumber,
      //   birthday: formValues.inputBirthday,
      //   identification: formValues.inputIdentification,
      //   additionalInfo: formValues.inputAdditionalInfo,
      // };
      // const userDataToUpdate: User = {
      //   _id: this.userId,
      //   userName: this.userName,
      //   role: this.userRole as UserRole,
      //   emailAddress: this.userEmailAddress,
      //   ...mappedFormValues
      // };
      // Crear instancia de FormData
      const formData = new FormData();

      // Obtener los valores del formulario
      const formValues = this.accountSetupForm.value;

      // Agregar valores del formulario a formData
      formData.append('firstName', formValues.inputFirstName);
      formData.append('lastName', formValues.inputLastName);
      formData.append('organizationName', formValues.inputOrganizationName);
      formData.append('countryAddress', formValues.inputCountryAddress);
      formData.append('stateAddress', formValues.inputStateAddress);
      formData.append('phoneNumber', formValues.inputPhoneNumber);
      formData.append('birthday', formValues.inputBirthday);
      formData.append('identification', formValues.inputIdentification);
      formData.append('additionalInfo', formValues.inputAdditionalInfo);

      // Agregar datos adicionales a formData
      formData.append('_id', this.userId);
      formData.append('userName', this.userName);
      formData.append('role', this.userRole);
      formData.append('emailAddress', this.userEmailAddress);

      //     this._userManagementService.updateUser(userDataToUpdate).subscribe(
      //       response => {
      //         if (response.data === undefined) {
      //           this._router.navigate([""]);
      //         } else {
      //           this.user = response.data as User;
      //           this._toastService.showToast('success', 'Successfully updated user: ' + userDataToUpdate.userName.toUpperCase());
      //           console.log("Successfully updated user: ", this.user);
      //           this.load_data = false;
      //           this._router.navigate(['/initial-config/step2']);
      //         }
      //       },
      //       error => {
      //         this._toastService.showToast('error', '' + error);
      //         console.error("Error updating user: ", error);
      //       }
      //     );
      //   } else {
      //     Object.keys(this.accountSetupForm.controls).forEach(field => {
      //       const control = this.accountSetupForm.get(field);
      //       control?.markAsTouched({ onlySelf: true });
      //     });
      //     this._toastService.showToast('error', 'Please fill in all required fields.');
      //   }
      // Ahora, pasar formData al servicio
      this._userManagementService.updateUser(formData).subscribe(
        response => {
          if (response.data === undefined) {
            this._router.navigate([""]);
          } else {
            this.user = response.data as User;
            this._toastService.showToast('success', 'Successfully updated user: ' + this.userName.toUpperCase());
            console.log("Successfully updated user: ", this.user);
            this.load_data = false;
            this._router.navigate(['/initial-config/step2']);
          }
        },
        error => {
          this._toastService.showToast('error', '' + error);
          console.error("Error updating user: ", error);
        }
      );
    } else {
      Object.keys(this.accountSetupForm.controls).forEach(field => {
        const control = this.accountSetupForm.get(field);
        control?.markAsTouched({ onlySelf: true });
      });
      this._toastService.showToast('error', 'Please fill in all required fields.');
    }
  }

}
