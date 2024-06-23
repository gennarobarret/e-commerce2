//auth-routing.module.ts
import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LoginComponent } from './login/login.component';
import { VerificationPendingComponent } from './verification-pending/verification-pending.component';
import { ActivationComponent } from './activation/activation.component';
import { CreateMasterAdminComponent } from './create-master-admin/create-master-admin.component';
import { ForgotPasswordComponent } from './forgot-password/forgot-password.component';
import { ResetPasswordComponent } from './reset-password/reset-password.component';
import { VerificationCodeComponent } from './verification-code/verification-code.component';
import { AuthLayoutComponent } from './auth-layout/auth-layout.component';
import { InitialCheckGuard } from 'src/app/core/guards/initial-check.guard';


const routes: Routes = [
  {
    path: '',
    component: AuthLayoutComponent,
    children: [
      { path: '', redirectTo: '/auth/login', pathMatch: 'full' },
      {
        path: 'create-master-admin', component: CreateMasterAdminComponent,
        canActivate: [InitialCheckGuard]
      },
      { path: 'login', component: LoginComponent },
      { path: 'verification-pending', component: VerificationPendingComponent, canActivate: [InitialCheckGuard] },
      { path: 'activation/:token', component: ActivationComponent },
      { path: 'forgot-password', component: ForgotPasswordComponent },
      { path: 'verification-code/:token', component: VerificationCodeComponent },
      { path: 'reset-password/:token', component: ResetPasswordComponent }
    ],
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class AuthRoutingModule { }