import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { ProfileComponent } from '../my-account/profile/profile.component';
import { BillingComponent } from '../my-account/billing/billing.component';
import { SecurityComponent } from '../my-account/security/security.component';
import { NotificationsComponent } from '../my-account/notifications/notifications.component';

const routes: Routes = [
  {
    path: '',
    children: [
      { path: 'profile/:id', component: ProfileComponent },
      { path: 'billing', component: BillingComponent },
      { path: 'security', component: SecurityComponent },
      { path: 'notifications', component: NotificationsComponent }
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class MyAccountRoutingModule { }
