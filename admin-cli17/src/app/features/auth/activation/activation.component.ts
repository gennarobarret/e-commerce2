import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../../core/services';
import { ToastService } from '../../../core/services';
import { CommonModule } from '@angular/common'; // Importa CommonModule para usar directivas comunes en Angular

@Component({
  selector: 'app-activation',
  standalone: true,
  imports: [CommonModule], // Agrega CommonModule para usar directivas como *ngIf
  templateUrl: './activation.component.html',
  styleUrls: ['./activation.component.css'] // Asegúrate de que esto sea `styleUrls` (plural)
})
export class ActivationComponent implements OnInit {

  constructor(
    private _route: ActivatedRoute,
    private _router: Router,
    private _authService: AuthService,
    private _toastService: ToastService,
  ) { }

  ngOnInit() {
    const token = this._route.snapshot.paramMap.get('token');
    if (token) {
      this._authService.activateAccount(token).subscribe({
        next: (response) => {
          if (response && response.status === 'success') {
            console.log("🚀 ~ ActivationComponent ~ activateAccount ~ response:", response);
            this._toastService.showToast(response.status, `${response.message}`);
            this._router.navigate(['/auth/login']);
          }
        },
        error: (error) => {
          this._toastService.showToast(error.error.status, `${error.error.message}`);
        }
      });
    }
  }
}
