import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';


const routes: Routes = [
    
            {
                path: 'profile',
                loadComponent: () => import('./profile/profile.component').then(c => c.ProfileComponent)
            },
            {
                path: 'billing',
                loadComponent: () => import('./billing/billing.component').then(c => c.BillingComponent)
            },
            {
                path: 'notifications',
                loadComponent: () => import('./notifications/notifications.component').then(c => c.NotificationsComponent)
            },
            {
                path: 'security',
                loadComponent: () => import('./security/security.component').then(c => c.SecurityComponent)
            }
    
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class MyAccountModule { }
