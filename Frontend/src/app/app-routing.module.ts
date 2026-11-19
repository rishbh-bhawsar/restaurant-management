import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { MainLayoutComponent } from './layouts/main-layout/main-layout.component';
import { AuthLayoutComponent } from './layouts/auth-layout/auth-layout.component';
import { AuthGuard } from './core/guards/auth.guard';

const routes: Routes = [
  // Auth Layout (Login Page)
  {
    path: 'auth',
    component: AuthLayoutComponent,
    loadChildren: () => import('./features/auth/auth.module').then((m) => m.AuthModule)
  },

  // Protected App Routes (Wrapped in MainLayout and Guarded by AuthGuard)
  {
    path: '',
    component: MainLayoutComponent,
    canActivate: [AuthGuard],
    children: [
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full'
      },
      {
        path: 'dashboard',
        loadChildren: () => import('./features/dashboard/dashboard.module').then((m) => m.DashboardModule),
        data: { breadcrumb: 'Dashboard' }
      },
      {
        path: 'pos',
        loadChildren: () => import('./features/pos/pos.module').then((m) => m.PosModule),
        data: { breadcrumb: 'POS' }
      },
      {
        path: 'products',
        loadChildren: () => import('./features/products/products.module').then((m) => m.ProductsModule),
        data: { breadcrumb: 'Products & Menu' }
      },
      {
        path: 'sales',
        loadChildren: () => import('./features/sales/sales.module').then((m) => m.SalesModule),
        data: { breadcrumb: 'Sales & Events' }
      },
      {
        path: 'inventory',
        loadChildren: () => import('./features/inventory/inventory.module').then((m) => m.InventoryModule),
        data: { breadcrumb: 'Inventory & Stock' }
      },
      {
        path: 'restaurants',
        loadChildren: () => import('./features/restaurants/restaurants.module').then((m) => m.RestaurantsModule),
        data: { breadcrumb: 'Restaurants' }
      }
    ]
  },

  // Fallback to dashboard
  {
    path: '**',
    redirectTo: 'dashboard'
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule {}
