import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { FormBuilder, FormGroup } from '@angular/forms';
// import { SharedDataBetweenStepService } from 'src/app/core/services/shared-data-between-step.service';

@Component({
  selector: 'app-preferences',
  templateUrl: './preferences.component.html',
  styleUrls: ['./preferences.component.css']
})
export class PreferencesComponent implements OnInit {
  preferencesForm!: FormGroup;

  constructor(
    private router: Router,
    private formBuilder: FormBuilder,
    // private sharedDataBetweenStepService: SharedDataBetweenStepService
  ) {
    this.createForm();
  }

  ngOnInit() {
    // const savedPreferences = this.sharedDataBetweenStepService.getStepData('preferences');
    // if (savedPreferences) {
    //   this.preferencesForm.patchValue(savedPreferences);
    // }
  }

  createForm() {
    this.preferencesForm = this.formBuilder.group({
      accountChanges: [false],
      groupChanges: [false],
      productUpdates: [false],
      newProducts: [false],
      marketingOffers: [false],
      securityAlerts: [{ value: true, disabled: true }]
    });
  }

  goToNextStep() {
    // this.sharedDataBetweenStepService.setStepData('preferences', this.preferencesForm.value);
    this.router.navigate(['/initial-config/step4']);
  }

  goToPreviousStep() {
    // this.sharedDataBetweenStepService.setStepData('preferences', this.preferencesForm.value);
    this.router.navigate(['/initial-config/step2']);
  }
}
