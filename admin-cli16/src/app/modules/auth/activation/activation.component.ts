import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from 'src/app/core/services/auth.service';
import { ToastService } from 'src/app/shared/services/toast.service';

@Component({
  selector: 'app-activation',
  templateUrl: './activation.component.html',
  styleUrls: ['./activation.component.css']
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
            console.log("🚀 ~ LoginComponent ~ login ~ response:", response);
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
