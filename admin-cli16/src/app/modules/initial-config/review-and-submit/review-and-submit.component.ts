import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
// import { SharedDataBetweenStepService } from 'src/app/core/services/shared-data-between-step.service';
import { InitialConfigService } from 'src/app/core/services/initial-config.service';
import { ToastService } from 'src/app/shared/services/toast.service';


@Component({
  selector: 'app-review-and-submit',
  templateUrl: './review-and-submit.component.html',
  styleUrls: ['./review-and-submit.component.css']
})
export class ReviewAndSubmitComponent implements OnInit {
  formData: any;
  load_data: boolean = false;
  load_btn: boolean = false;

  constructor(
    private router: Router,
    // private _sharedDataBetweenStepService: SharedDataBetweenStepService,
    private _initialConfigService: InitialConfigService,
    private _toastService: ToastService,
  ) { }

  ngOnInit() {
    this.loadFormData();
  }

  isFormDataEmpty(): boolean {
    if (!this.formData) {
      return true;
    }
    return Object.keys(this.formData).length === 0;
  }


  loadFormData() {
    // this.formData = this._sharedDataBetweenStepService.getAllData();
    // console.log("🚀 ~ ReviewAndSubmitComponent ~ loadFormData ~  this.formData:", this.formData)
  }

  goToPreviousStep() {
    this.router.navigate(['/initial-config/step3']);
  }

  mapFormDataToApiFormat(accountSetup: any): any {
    const mappedData: any = {};
    for (const key in accountSetup) {
      if (accountSetup.hasOwnProperty(key)) {
        const newKey = key.replace('input', '');
        mappedData[newKey.charAt(0).toLowerCase() + newKey.slice(1)] = accountSetup[key];
      }
    }
    return mappedData;
  }

  onSubmit() {
    // this.load_btn = true;
    // const data = this.mapFormDataToApiFormat(this.formData.accountSetup);
    // delete data.confirmPassword;
    // data.role = 'MasterAdministrator';
    // this._initialConfigService.createMasterAdmin(data).subscribe(
    //   response => {
    //     this._toastService.showToast('success', 'An email has been sent to the '+' '+data.emailAddress);
    //     this.formData = {};
    //     this.router.navigate(['/initial-config/verification-pending']);
    //     this.load_btn = false;
    //   },
    //   error => {
    //     this.load_btn = false;
    //     this.router.navigate(['/initial-config/step1']);
    //     if (error.status === 400 && error.error.message === 'A Master Administrator is already registered.') {
    //       this._toastService.showToast('error', 'A Master Administrator is already registered.');
    //     } else {
    //       this._toastService.showToast('error', `Error: ${error.message}`);
    //     }
    //   }
    // );
  }
}
