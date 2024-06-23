import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-billing-details',
  templateUrl: './billing-details.component.html',
  styleUrls: ['./billing-details.component.css']
})
export class BillingDetailsComponent {
  constructor(private router: Router) { }

  goToNextStep() {
    this.router.navigate(['/initial-config/step3']);
  }
  goToPreviousStep() {
    this.router.navigate(['/initial-config/step1']);
  }

}
