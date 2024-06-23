// layout-routing.module.ts
import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { MainLayoutComponent } from './main-layout/main-layout.component';
import { isLoggedInGuard } from 'src/app/core/guards/is-logged-in.guard';
// import { initialConfigGuard } from 'src/app/core/guards/initial-config.guard';
// import { InitialCheckGuard } from 'src/app/core/guards/initial-check.guard';


const routes: Routes = [
  {
    path: '', 
    canActivate: [isLoggedInGuard],
    component: MainLayoutComponent,
    children: [
      { path: '', redirectTo: '/dashboard', pathMatch: 'full' },
      {
        path: 'dashboard',
        loadChildren: () => import('../dashboard/dashboard.module').then(m => m.DashboardModule)
      },
      {
        path: 'my-account',
        loadChildren: () => import('../my-account/my-account.module').then(m => m.MyAccountModule)
      },
      {
        path: 'people',
        loadChildren: () => import('../people/people.module').then(m => m.PeopleModule)
      },
      { path: '**', redirectTo: '/dashboard' }
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class LayoutRoutingModule { }
