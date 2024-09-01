import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AdminGuard } from '../../core/guards/admin-guard.guard';

const routes: Routes = [
    {
        path: '',
        redirectTo: 'roles',
        pathMatch: 'full'
    },
    {
        path: 'roles',
        loadComponent: () => import('../role-and-permission/list-roles/list-roles.component').then(c => c.ListRolesComponent)
    },
    {
        path: 'roles/add',
        loadComponent: () => import('../role-and-permission/add-roles/add-roles.component').then(c => c.AddRolesComponent),
        canActivate: [AdminGuard]
    },
    {
        path: 'roles/edit/:id',
        loadComponent: () => import('../role-and-permission/edit-roles/edit-roles.component').then(c => c.EditRolesComponent)
    },
    {
        path: 'permissions',
        loadComponent: () => import('../role-and-permission/list-permission/list-permission.component').then(c => c.ListPermissionComponent),
        canActivate: [AdminGuard]
    },
    {
        path: 'permissions/add',
        loadComponent: () => import('../role-and-permission/add-permission/add-permission.component').then(c => c.AddPermissionComponent)
    },
    {
        path: 'permissions/edit/:id',
        loadComponent: () => import('../role-and-permission/edit-permission/edit-permission.component').then(c => c.EditPermissionComponent)
    },
    {
        path: '**',
        redirectTo: 'roles'
    }
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class RolePermissionRoutingModule { }
