  import { NgModule } from '@angular/core';
  import { RouterModule, Routes } from '@angular/router';

  const routes: Routes = [
    {
      path: 'categories',
      children: [
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
          redirectTo: 'list'
        }
      ]
    },
    {
      path: 'subcategories',
      children: [
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
          redirectTo: 'list'
        }
      ]
    },
    {
      path: '',
      children: [
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
      ]
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
