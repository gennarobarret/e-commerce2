import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { InitialConfigRoutingModule } from './initial-config-routing.module';
import { ReactiveFormsModule } from '@angular/forms';
import { AccountSetupComponent } from './account-setup/account-setup.component';
import { PreferencesComponent } from './preferences/preferences.component';
import { ReviewAndSubmitComponent } from './review-and-submit/review-and-submit.component';
import { BusinessSetupComponent } from './business-setup/business-setup.component';
import { WrapperComponent } from './wrapper/wrapper.component';

@NgModule({
  declarations: [
    AccountSetupComponent,
    PreferencesComponent,
    ReviewAndSubmitComponent,
    WrapperComponent,
    BusinessSetupComponent
  ],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    InitialConfigRoutingModule
  ]
})

export class InitialConfigModule { }
