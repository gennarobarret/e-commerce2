import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { MyAccountRoutingModule } from './my-account-routing.module';
import { ProfileComponent } from '../my-account/profile/profile.component';
import { BillingComponent } from '../my-account/billing/billing.component';
import { SecurityComponent } from '../my-account/security/security.component';
import { NotificationsComponent } from '../my-account/notifications/notifications.component';
import { SharedModule } from 'src/app/shared/shared.module';
import { UserImageComponent } from './profile/user-image/user-image.component';



@NgModule({
  declarations: [
    ProfileComponent,
    BillingComponent,
    SecurityComponent,
    NotificationsComponent,
    UserImageComponent
  ],
  imports: [
    CommonModule,
    MyAccountRoutingModule,
    ReactiveFormsModule,
    SharedModule
  ]
})
export class MyAccountModule { }
