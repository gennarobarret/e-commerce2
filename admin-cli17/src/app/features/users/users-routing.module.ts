import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

const routes: Routes = [
    {
        path: '',
        redirectTo: '/dashboard',  // Redirige a /dashboard si se accede a /users directamente
        pathMatch: 'full'
    },
    {
        path: 'users-list',
        loadComponent: () => import('./users-management/list-users/list-users.component').then(c => c.ListUsersComponent)
    },
    {
        path: 'add',
        loadComponent: () => import('./users-management/add-user/add-user.component').then(c => c.AddUserComponent)
    },
    {
        path: 'edit/:id',
        loadComponent: () => import('./users-management/edit-user/edit-user.component').then(c => c.EditUserComponent)
    },
    {
        path: '**',
        redirectTo: '/dashboard' // Cualquier ruta no definida bajo /users redirige al dashboard
    }
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class UserRoutingModule { }
