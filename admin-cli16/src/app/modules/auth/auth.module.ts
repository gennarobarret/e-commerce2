import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SharedModule } from 'src/app/shared/shared.module';
import { AuthRoutingModule } from './auth-routing.module';
import { LoginComponent } from './login/login.component';
import { AuthLayoutComponent } from './auth-layout/auth-layout.component';
import { ActivationComponent } from './activation/activation.component';
import { VerificationPendingComponent } from './verification-pending/verification-pending.component';
import { CreateMasterAdminComponent } from '../auth/create-master-admin/create-master-admin.component';
import { ReactiveFormsModule } from '@angular/forms';
import { GoogleSigninComponent } from './google-signin/google-signin.component';
import { ForgotPasswordComponent } from './forgot-password/forgot-password.component';
import { ResetPasswordComponent } from './reset-password/reset-password.component';
import { VerificationCodeComponent } from './verification-code/verification-code.component';

@NgModule({
  declarations: [
    AuthLayoutComponent,
    LoginComponent,
    CreateMasterAdminComponent,
    ActivationComponent,
    VerificationPendingComponent,
    GoogleSigninComponent,
    ForgotPasswordComponent,
    ResetPasswordComponent,
    VerificationCodeComponent,
  ],
  imports: [
    CommonModule,
    SharedModule,
    AuthRoutingModule,
    ReactiveFormsModule
  ]
})
export class AuthModule { }
