import { Component, OnInit } from '@angular/core';
import { InitialConfigService } from 'src/app/core/services/initial-config.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-wrapper',
  templateUrl: './wrapper.component.html',
  styleUrls: ['./wrapper.component.css'],
})
export class WrapperComponent implements OnInit {
  constructor(
    private initialConfigService: InitialConfigService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.initialConfigService.InitialCheck().subscribe({
      next: ({ setupRequired, verificationRequired, masterAdminRequired }) => {
        console.log('Initial Check Requirements:', {
          setupRequired,
          verificationRequired,
          masterAdminRequired,
        });

        if (setupRequired) {
          this.router.navigate(['/initial-config/step1']);
        } else if (verificationRequired) {
          this.router.navigate(['/auth/verification-pending']);
        } else if (masterAdminRequired) {
          this.router.navigate(['auth/create-master-admin']);
        } else {
          this.router.navigate(['/dashboard']);
        }
      },
      error: (error) => console.error('Error fetching initial check', error),
    });
  }
}
