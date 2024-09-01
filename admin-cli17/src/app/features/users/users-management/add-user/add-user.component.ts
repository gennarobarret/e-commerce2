import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { UserManagementService } from '../../../../core/services';
import { LocationDataService } from '../../../../core/services';
import { ToastService } from '../../../../core/services';
import { RoleManagementService } from '../../../../core/services/role-management.service'; // Importa el servicio de roles
import { Country, State } from '../../../../core/interfaces';
import { Role } from '../../../../core/models/role.model'; // Importa el modelo Role
import { SpinnerComponent } from '../../../../shared/components/spinner/spinner.component';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-add-user',
  templateUrl: './add-user.component.html',
  styleUrls: ['./add-user.component.css'],
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, SpinnerComponent]
})
export class AddUserComponent implements OnInit {
  addUserForm!: FormGroup;
  countries: Country[] = [];
  filteredStates: State[] = [];
  roles: Role[] = []; // Array para almacenar los roles obtenidos
  loading: boolean = false;
  private subscriptions = new Subscription();

  constructor(
    private formBuilder: FormBuilder,
    private userManagementService: UserManagementService,
    private locationDataService: LocationDataService,
    private toastService: ToastService,
    private roleManagementService: RoleManagementService, // Inyecta el servicio de roles
    private router: Router
  ) {
    this.createForm();
  }

  ngOnInit(): void {
    this.loadCountries();
    this.loadRoles(); // Cargar los roles cuando el componente se inicialice
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  private createForm() {
    this.addUserForm = this.formBuilder.group({
      userName: ['', [Validators.required, Validators.minLength(4), Validators.maxLength(25)]],
      firstName: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(25)]],
      lastName: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(25)]],
      emailAddress: ['', [Validators.required, Validators.email]],
      countryAddress: ['', Validators.required],
      stateAddress: ['', Validators.required],
      phoneNumber: ['', [Validators.required, Validators.pattern('[0-9]+')]],
      birthday: ['', Validators.required],
      identification: ['', Validators.required],
      additionalInfo: ['', [Validators.required, Validators.minLength(10), Validators.maxLength(50)]],
      role: ['', Validators.required]  // Campo de rol agregado
    });
  }

  loadCountries() {
    this.subscriptions.add(
      this.locationDataService.getCountries().subscribe({
        next: (response) => {
          this.countries = response;
        },
        error: (error) => {
          console.error('Error loading countries', error);
        }
      })
    );
  }

  loadRoles() {
    this.subscriptions.add(
      this.roleManagementService.listRoles().subscribe({
        next: (response) => {
          if (response.status === 'success') {
            this.roles = response.data.filter(role => role.name !== 'MasterAdministrator'); // Excluye MasterAdministrator
          } else {
            console.error('Error loading roles:', response.message);
          }
        },
        error: (error) => {
          console.error('Error loading roles', error);
        }
      })
    );
  }


  onCountryChange(event: Event) {
    const selectElement = event.target as HTMLSelectElement;
    const countryId = selectElement.value;

    if (countryId) {
      this.filterStatesByCountry(countryId);
    }
  }

  private filterStatesByCountry(countryId: string) {
    this.subscriptions.add(
      this.locationDataService.getStatesByCountry(countryId).subscribe({
        next: (response) => {
          this.filteredStates = response;
        },
        error: (error) => {
          console.error('Error loading states', error);
        }
      })
    );
  }

  addUser() {
    if (this.addUserForm.invalid) {
      this.markFormGroupTouched(this.addUserForm);
      this.toastService.showToast('error', 'There are errors in the form. Please check the fields.');
      return;
    }

    const formData = this.addUserForm.value;
    this.loading = true;

    this.subscriptions.add(
      this.userManagementService.createUser(formData).subscribe({
        next: (response) => {
          if (response && response.status === 'success') {
            this.toastService.showToast(response.status, `${response.message}`);
            this.router.navigate(['/users/staff-list']);
          }
        },
        error: (error) => {
          console.error('Error creating user:', error);
          // Mostrar el mensaje de error proveniente del backend
          if (error.error && error.error.status && error.error.message) {
            this.toastService.showToast(error.error.status, `${error.error.message}`);
          } else {
            // Mensaje genérico si no se recibe un error estructurado del backend
            this.toastService.showToast('error', 'Error creating user. Please try again.');
          }
          this.loading = false;
        }
      })
    );
  }

  private markFormGroupTouched(formGroup: FormGroup) {
    Object.values(formGroup.controls).forEach(control => {
      control.markAsTouched();
    });
  }
}
