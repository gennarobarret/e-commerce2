import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

const routes: Routes = [
  {
    path: 'list',
    loadComponent: () => import('./list-products/list-products.component').then(c => c.ListProductsComponent)
  },
  {
    path: 'add',
    loadComponent: () => import('./add-product/add-product.component').then(c => c.AddProductComponent)
  },
  {
    path: 'edit/:id',
    loadComponent: () => import('./edit-product/edit-product.component').then(c => c.EditProductComponent)
  },
  {
    path: '**',
    redirectTo: 'list'
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ProductsRoutingModule { }
