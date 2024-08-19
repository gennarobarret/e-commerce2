import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

const routes: Routes = [
    {
        path: 'list',
        loadComponent: () => import('./list-categories/list-categories.component').then(c => c.ListCategoriesComponent)
    },
    {
        path: 'add',
        loadComponent: () => import('./add-category/add-category.component').then(c => c.AddCategoryComponent)
    },
    {
        path: 'edit/:id',
        loadComponent: () => import('./edit-category/edit-category.component').then(c => c.EditCategoryComponent)
    },
    {
        path: '**',
        redirectTo: 'list'  // Cualquier ruta no definida redirige a la lista de categorías
    }
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class CategoriesRoutingModule { }
