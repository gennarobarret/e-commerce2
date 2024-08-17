import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { MainLayoutComponent } from './main-layout/main-layout.component';
import { isLoggedInGuard } from '../core/guards/is-logged.guard';

const routes: Routes = [
    {
        path: '',
        canActivate: [isLoggedInGuard],
        component: MainLayoutComponent,
        children: [
            {
                path: '',
                redirectTo: '/dashboard',
                pathMatch: 'full'
            },
            {
                path: 'dashboard',
                loadChildren: () => import('../features/dashboard/dashboard-routing.module').then(m => m.DashboardRoutingModule)
            },
            {
                path: 'my-account',
                loadChildren: () => import('../features/my-account/my-account-routing.module').then(m => m.MyAccountModule)
            },
            {
                path: 'users',
                loadChildren: () => import('../features/users/users-routing.module').then(m => m.UserRoutingModule)
            },
            {
                path: 'all-notifications',
                loadChildren: () => import('../features/notifications/notifications-routing.module').then(m => m.NotificationsRoutingModule)
            },
            {
                path: '**',
                redirectTo: '/dashboard'
            }
        ]
    }
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class LayoutRoutingModule { }
