//app-routing.module.ts

import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

const routes: Routes = [
  {
    path: 'auth',
    loadChildren: () =>
      import('./modules/auth/auth.module').then((m) => m.AuthModule)
  },
  // {
  //   path: 'initial-config',
  //   loadChildren: () => import('./modules/initial-config/initial-config.module').then(m => m.InitialConfigModule),
    
  // },
  {
    path: 'error',
    loadChildren: () =>
      import('./modules/error-pages/error-pages.module').then((m) => m.ErrorPagesModule)
  },
  {
    path: '',
    loadChildren: () =>
      import('./modules/layout/layout.module').then((m) => m.LayoutModule),
  },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule { }