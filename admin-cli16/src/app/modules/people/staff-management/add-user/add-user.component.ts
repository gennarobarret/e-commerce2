import { Component, OnInit, OnDestroy } from "@angular/core";
import { FormBuilder, FormGroup, FormArray, Validators, FormControl } from "@angular/forms";
import { Router, ActivatedRoute } from "@angular/router";
import { AuthService } from "src/app/core/services/auth.service";
import { ToastService } from "src/app/shared/services/toast.service";
import { User } from "src/app/core/interfaces/user.interface";
import { GeoInfoService } from "src/app/shared/services/geo-info.service";
import { ValidationService } from "src/app/core/services/validation.service";
import { GLOBAL } from "src/app/core/config/GLOBAL";
import { Renderer2, ViewChild, ElementRef } from '@angular/core';
import { Subscription } from 'rxjs';
import { Country } from "src/app/core/interfaces/country.interface";
import { State } from "src/app/core/interfaces/state.interface";
import { UserManagementService } from "src/app/core/services/user-management.service";

@Component({
  selector: 'app-add-user',
  templateUrl: './add-user.component.html',
  styleUrls: ['./add-user.component.css']
})
export class AddUserComponent implements OnInit, OnDestroy {
  @ViewChild('fileInput') fileInput!: ElementRef;
  AddForm!: FormGroup;
  countries: Country[] = [];
  states: State[] = [];
  filteredStates: State[] = [];
  allGroups = ['Managers', 'Developers', 'Marketing', 'Sales', 'Customer'];
  imageUrl: any = 'assets/img/illustrations/profiles/profile-2.png';
  selectedFile: File | null = null;
  private subscriptions = new Subscription();

  load_data: boolean = false;
  load_btn: boolean = false;

  constructor(
    private _router: Router,
    private _formBuilder: FormBuilder,
    private _renderer: Renderer2,
    private _toastService: ToastService,
    private _geoInfoService: GeoInfoService,
    private _validationService: ValidationService,
    private _userManagementService: UserManagementService
  ) { }

  ngOnInit(): void {
    this.initForm();
    this.loadCountries();
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  private initForm(): void {
    this.AddForm = this._formBuilder.group({
      inputUserName: [
        "",
        [
          Validators.required,
          Validators.minLength(5),
          Validators.maxLength(20),
          Validators.pattern("^[a-zA-Z0-9]+$")
        ]
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
      inputEmailAddress: ["", [Validators.required, Validators.email]],
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
      inputRole: ["", [Validators.required]],
      inputGroups: this._formBuilder.array(this.allGroups.map(() => new FormControl(false))),
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
      ],
      inputProfileImage: [""],

    });
  }

  private loadCountries() {
    this._geoInfoService.getCountries().subscribe(
      data => {
        this.countries = data.sort((a: Country, b: Country) =>
          a.name.localeCompare(b.name)
        );
        this.loadStates();
      },
      error => {
        console.error("Error loading countries", error);
      }
    );
  }

  private loadStates() {
    this._geoInfoService.getStates().subscribe(
      data => {
        this.states = data.sort((a: State, b: State) =>
          a.province_name.localeCompare(b.province_name)
        );
      },
      error => {
        console.error("Error loading states", error);
      }
    );
  }

  get inputGroups(): FormArray {
    return this.AddForm.get('inputGroups') as FormArray;
  }
  get groupsControls(): FormControl[] {
    return (this.AddForm.get('inputGroups') as FormArray).controls as FormControl[];
  }


  filterStatesByCountry(countryId: string | number) {
    const numericCountryId = Number(countryId);
    this.filteredStates = this.states.filter(
      state => state.country_id === numericCountryId
    );
    const stateControl = this.AddForm.get("inputState");
    if (stateControl) {
      stateControl.setValue(null);
    }
  }

  onCountryChange(event: Event) {
    const selectElement = event.target as HTMLSelectElement;
    const countryId = selectElement.value;
    this.filterStatesByCountry(countryId);
    const stateControl = this.AddForm.get('inputStateAddress');
    if (stateControl) {
      stateControl.setValue("");
    }
  }


  fileChangeEvent(event: Event): void {
    const inputElement = event.target as HTMLInputElement;

    if (inputElement.files && inputElement.files.length > 0) {
      this.selectedFile = inputElement.files[0];
      this.validateAndUpdateImg(this.selectedFile);
    }
  }

  private validateAndUpdateImg(file: File) {
    if (!this.imageUrl && !file) {
      this.AddForm.get('inputProfileImage')!.setErrors({ required: true });
      return;
    }
    if (file) {
      const errors = this.validateFileUpdate(file);
      if (errors) {
        this.AddForm.get('inputProfileImage')!.setErrors(errors);
      }
    }
  }

  private validateFileUpdate(file: File): { [key: string]: any } | null {
    if (file) {
      const validTypes = ['image/png', 'image/webp', 'image/jpg', 'image/gif', 'image/jpeg'];
      if (validTypes.includes(file.type)) {
        if (file.size <= 4000000) {
          let reader = new FileReader();
          reader.readAsDataURL(file);

          reader.onload = () => {
            if (reader.result !== null) {
              this.imageUrl = reader.result as string;
              this.AddForm.patchValue({
                file: reader.result
              });
            }
          }
          return null;
        } else {
          console.error('error', 'The image cannot exceed 4 mb');
          this._toastService.showToast('error', 'The image cannot exceed 4 mb');
          return { invalidFileSize: true };
        }
      } else {
        console.error('The file must be a PNG, WEBP, JPG, GIF, or JPEG image.');
        this._toastService.showToast('error', 'The file must be a PNG, WEBP, JPG, GIF, or JPEG image.');
        return { invalidFileType: true };
      }
    }

    return null;
  }

  triggerFileInput(): void {
    this._renderer.selectRootElement(this.fileInput.nativeElement).click();
  }

  onSubmit() {
    if (this.AddForm.invalid) {
      Object.keys(this.AddForm.controls).forEach(field => {
        const control = this.AddForm.get(field);
        control?.markAsTouched({ onlySelf: true });
      });
      this.load_btn = false;
      this._toastService.showToast('error', 'There are errors on the form. Please check the fields.');
      return;
    }

    this.load_btn = true;
    const formData = new FormData();
    formData.append('userName', this.AddForm.value.inputUserName);
    formData.append('role', this.AddForm.value.inputRole);
    formData.append('identification', this.AddForm.value.inputIdentification);
    formData.append('firstName', this.AddForm.value.inputFirstName);
    formData.append('lastName', this.AddForm.value.inputLastName);
    formData.append('organizationName', this.AddForm.value.inputOrganizationName);
    formData.append('emailAddress', this.AddForm.value.inputEmailAddress);
    formData.append('countryAddress', this.AddForm.value.inputCountryAddress);
    formData.append('stateAddress', this.AddForm.value.inputStateAddress);
    formData.append('phoneNumber', this.AddForm.value.inputPhoneNumber);
    formData.append('birthday', this.AddForm.value.inputBirthday);
    formData.append('additionalInfo', this.AddForm.value.inputAdditionalInfo);
    if (this.selectedFile) {
      formData.append('profileImage', this.selectedFile);
    }
    const selectedGroups = this.AddForm.value.inputGroups
      .map((checked: boolean, i: number) => checked ? this.allGroups[i] : null)
      .filter((v: string | null) => v !== null);

    formData.append('groups', JSON.stringify(selectedGroups));
    // formData.forEach((value, key) => {
    //   console.log(`${key}: ${value}`);
    // });
    this._userManagementService.createUser(formData).subscribe({
      next: (response) => {
        this._toastService.showToast('success', 'User has been successfully added.');
        this.load_btn = false;
        this._router.navigate(['/users-list']);
      },
      error: (error) => {
        this._toastService.showToast('error', 'Add failed. ' + (error.error?.message || ''));
        this.load_btn = false;
      }
    });
  }

  markFormAsTouched() {
    Object.keys(this.AddForm.controls).forEach(field => {
      const control = this.AddForm.get(field);
      control?.markAsTouched({ onlySelf: true });
    });
    this._toastService.showToast('error', 'Please fill all required fields');
  }

  handleError(error: any) {
    this._router.navigate(['/user-management/users-list']);
    if (error.status === 400 && error.error.message === 'User is already registered.') {
      this._toastService.showToast('error', 'User is already registered.');
    } else {
      this._toastService.showToast('error', `Error: ${error.message}`);
    }
    this.load_btn = false;
  }

}
