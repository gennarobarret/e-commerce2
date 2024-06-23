import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { GeoInfoService } from 'src/app/shared/services/geo-info.service';
import { ToastService } from 'src/app/shared/services/toast.service';
import { BusinessConfigService } from 'src/app/core/services/business.service';
import { Renderer2, ViewChild, ElementRef } from '@angular/core';
import { Country } from "src/app/core/models/country.interface";
import { State } from 'src/app/core/models/state.interface';
import { forkJoin } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { ValidationService } from 'src/app/core/services/validation.service';

@Component({
  selector: 'app-business-setup',
  templateUrl: './business-setup.component.html',
  styleUrls: ['./business-setup.component.css']
})
export class BusinessSetupComponent implements OnInit {
  @ViewChild('fileInput') fileInput!: ElementRef;

  businessSetupForm!: FormGroup;
  countries: Country[] = [];
  states: State[] = [];
  filteredStates: State[] = [];
  load_data: boolean = false;
  load_btn: boolean = false;
  loading: boolean = false;
  imageUrl: any | ArrayBuffer = 'assets/img/illustrations/your-logo-here.png';
  selectedFile: File | null = null;


  constructor(
    private formBuilder: FormBuilder,
    private _renderer: Renderer2,
    private _router: Router,
    private _toastService: ToastService,
    private _geoInfoService: GeoInfoService,
    private _businessService: BusinessConfigService,
    private validationService: ValidationService,
  ) { }

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
    this.businessSetupForm = this.formBuilder.group({
      inputBusinessName: ['', [Validators.required, Validators.maxLength(100)]],
      inputCountryAddress: ['', [Validators.required]],
      inputStateAddress: ['', [Validators.required]],
      inputTaxId: ['', [Validators.required, Validators.pattern('[A-Z0-9]+')]],
      inputTaxType: ['', [Validators.required]],
      inputTaxPercentage: [null, [Validators.required, Validators.min(0), Validators.max(100)]],
      inputPaymentGateway: ['', [Validators.required]],
      inputPhysicalLocation: ['', [Validators.required]],
      inputShippingService: ['', [Validators.required]],
      inputCompanyEmail: ['', [Validators.required, Validators.email]],
      inputCustomerServiceEmail: ['', [Validators.required, Validators.email]],
      inputReturnsEmail: ['', [Validators.required, Validators.email]],
      inputCurrency: ['', [Validators.required]],
      inputLogo: [null]
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


  fileChangeEvent(event: Event): void {
    const inputElement = event.target as HTMLInputElement;
    if (inputElement.files && inputElement.files.length > 0) {
      const file = inputElement.files[0];
      const validationErrors = this.validationService.validateLogo(file);

      if (validationErrors) {
        let errorMessage = this.getErrorMessageFromValidationErrors(validationErrors);
        this._toastService.showToast('error', errorMessage); // Asumiendo que _toastService es tu servicio de toast y 'showToast' es el método para mostrar el toast.
        return;
      }
      // Si el archivo es válido, procede con tu lógica existente para actualizar la vista previa, etc.
      this.selectedFile = file;
      this.updatePreview(file);
    }
  }

  private updatePreview(file: File) {
    const reader = new FileReader();
    reader.onload = () => {
      this.imageUrl = reader.result as string;
    };
    reader.readAsDataURL(file);
  }

  private getErrorMessageFromValidationErrors(errors: any): string {
    if (errors.invalidFileType) {
      return "The file must be a PNG, JPG, GIF, or WEBP image.";
    } else if (errors.invalidFileSize) {
      return "The image cannot exceed 4 MB.";
    } else {
      return "There is an error with the selected file."; // Mensaje genérico para cualquier otro error
    }
  }

  triggerFileInput(): void {
    this._renderer.selectRootElement(this.fileInput.nativeElement).click();
  }

  goToNextStep() {
    if (this.businessSetupForm.valid) {
      this._router.navigate(['/initial-config/step3']);
    } else {
      Object.keys(this.businessSetupForm.controls).forEach(field => {
        const control = this.businessSetupForm.get(field);
        control?.markAsTouched({ onlySelf: true });
      });
      this._toastService.showToast('error', 'Please fill all required fields');
    }
  }

  goToPreviousStep() {
    this._router.navigate(['/initial-config/step1']);
  }
}


// fileChangeEvent(event: Event): void {
//   const inputElement = event.target as HTMLInputElement;
//   if (inputElement.files && inputElement.files.length > 0) {
//     this.selectedFile = inputElement.files[0];
//     this.validateAndUpdateImg(this.selectedFile);
//   }
// }

// private validateAndUpdateImg(file: File) {
//   if (!this.imageUrl && !file) {
//     this.businessSetupForm.get('inputLogo')!.setErrors({ required: true });
//     return;
//   }
//   if (file) {
//     const errors = this.validateFileUpdate(file);
//     if (errors) {
//       this.businessSetupForm.get('inputLogo')!.setErrors(errors);
//     }
//   }
// }

// private validateFileUpdate(file: File): { [key: string]: any } | null {
//   if (file) {
//     const validTypes = ['image/png', 'image/webp', 'image/jpg', 'image/gif', 'image/jpeg'];
//     if (validTypes.includes(file.type)) {
//       if (file.size <= 4000000) {
//         let reader = new FileReader();
//         reader.readAsDataURL(file);
//         reader.onload = () => {
//           if (reader.result !== null) {
//             this.imageUrl = reader.result as string;
//             this.businessSetupForm.patchValue({
//               file: reader.result
//             });
//           }
//         }
//         return null;
//       } else {
//         console.error('error', 'The image cannot exceed 4 mb');
//         this._toastService.showToast('error', 'The image cannot exceed 4 mb');
//         return { invalidFileSize: true };
//       }
//     } else {
//       console.error('The file must be a PNG, WEBP, JPG, GIF, or JPEG image.');
//       this._toastService.showToast('error', 'The file must be a PNG, WEBP, JPG, GIF, or JPEG image.');
//       return { invalidFileType: true };
//     }
//   }

//   return null;
// }


// onFileChange(event: any) {
//   if (event.target.files.length > 0) {
//     const file = event.target.files[0];
//     this.businessSetupForm.patchValue({
//       logo: file
//     });
//   }
// }

// submitBusinessDetails() {
//   if (this.businessSetupForm.invalid) {
//     this._toastService.showToast('error', 'Please fill all required fields correctly.');
//     return;
//   }
//   this.loading = true;
//   // Aquí iría la lógica para enviar los datos al servidor, incluyendo la carga del archivo del logo
//   // Simulamos una llamada al servicio de negocio
//   this._businessService.saveBusinessConfig(this.businessSetupForm.value).subscribe({
//     next: (response) => {
//       this._toastService.showToast('success', 'Business details saved successfully.');
//       this._router.navigate(['/next-step-route']);
//     },
//     error: (error) => {
//       this._toastService.showToast('error', 'An error occurred while saving business details.');
//       console.error('Error saving business details:', error);
//     },
//     complete: () => this.loading = false
//   });
// }
