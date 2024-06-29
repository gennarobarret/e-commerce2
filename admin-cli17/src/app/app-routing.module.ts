import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

const routes: Routes = [
    {
        path: 'auth',
        loadChildren: () => import('./features/auth/auth-routing.module').then(m => m.AuthRoutingModule)
    },
    {
        path: '',
        loadChildren: () => import('./layout/layout-routing.module').then(m => m.LayoutRoutingModule)
    },
    {
        path: '**',
        redirectTo: ''
    }
];

@NgModule({
    imports: [RouterModule.forRoot(routes)],
    exports: [RouterModule]
})
export class AppRoutingModule { }

export { routes as appRoutes };
