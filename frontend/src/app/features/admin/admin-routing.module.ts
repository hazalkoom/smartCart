import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AdminLayoutComponent } from '../admin-layout/admin-layout';
import { AdminDashboardComponent } from '../admin-dashboard/admin-dashboard';
import { AdminOrdersComponent } from '../admin-orders/admin-orders.component';
import { AdminUsersComponent } from '../admin-users/admin-users.component';
import { AdminProductsComponent } from '../admin-products/admin-products.component';
import { AdminCategoriesComponent } from '../admin-categories/admin-categories.component';
import { AdminGuard } from '../../core/guards/admin.guard';
import { OwnerGuard } from '../../core/guards/owner.guard';

const routes: Routes = [
  {
    path: '',
    component: AdminLayoutComponent,
    canActivate: [AdminGuard],
    children: [
      { path: '', component: AdminDashboardComponent },
      { path: 'orders', component: AdminOrdersComponent },
      { path: 'users', component: AdminUsersComponent, canActivate: [OwnerGuard] },
      { path: 'products', component: AdminProductsComponent },
      { path: 'categories', component: AdminCategoriesComponent }
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class AdminRoutingModule {}
