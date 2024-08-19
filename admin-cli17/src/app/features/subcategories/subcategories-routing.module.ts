import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

const routes: Routes = [
    {
        path: 'list',
        loadComponent: () => import('./list-subcategories/list-subcategories.component').then(c => c.ListSubcategoriesComponent)
    },
    {
        path: 'add',
        loadComponent: () => import('./add-subcategory/add-subcategory.component').then(c => c.AddSubcategoryComponent)
    },
    {
        path: 'edit/:id',
        loadComponent: () => import('./edit-subcategory/edit-subcategory.component').then(c => c.EditSubcategoryComponent)
    },
    {
        path: '**',
        redirectTo: 'list'  // Cualquier ruta no definida redirige a la lista de subcategorías
    }
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class SubcategoriesRoutingModule { }
