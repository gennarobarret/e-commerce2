import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';


const routes: Routes = [
    {
        path: '',
        children: [
            {
                path: '',
                loadComponent: () => import('./staff-management/list-users/list-users.component').then(c => c.ListUsersComponent)
            },
            {
                path: 'add',
                loadComponent: () => import('./staff-management/add-user/add-user.component').then(c => c.AddUserComponent)
            },
            {
                path: 'edit/:id',
                loadComponent: () => import('./staff-management/edit-user/edit-user.component').then(c => c.EditUserComponent)
            }
        ]
    }
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class UserRoutingModule { }
