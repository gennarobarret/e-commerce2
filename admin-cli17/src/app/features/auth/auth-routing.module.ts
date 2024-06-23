import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AuthLayoutComponent } from './auth-layout/auth-layout.component';

const routes: Routes = [
    {
        path: '',
        component: AuthLayoutComponent,
        children: [
            {
                path: '',
                redirectTo: 'login',
                pathMatch: 'full'
            },
            {
                path: 'login',
                loadComponent: () => import('./login/login.component').then(c => c.LoginComponent)
            },
            {
                path: 'forgot-password',
                loadComponent: () => import('./forgot-password/forgot-password.component').then(c => c.ForgotPasswordComponent)
            },
            {
                path: 'reset-password',
                loadComponent: () => import('./reset-password/reset-password.component').then(c => c.ResetPasswordComponent)
            },
            {
                path: 'activation',
                loadComponent: () => import('./activation/activation.component').then(c => c.ActivationComponent)
            },
            {
                path: 'verification-code',
                loadComponent: () => import('./verification-code/verification-code.component').then(c => c.VerificationCodeComponent)
            },
            {
                path: 'verification-pending',
                loadComponent: () => import('./verification-pending/verification-pending.component').then(c => c.VerificationPendingComponent)
            }
        ],
    }
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule],
})
export class AuthRoutingModule { }
