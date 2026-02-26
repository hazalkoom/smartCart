import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminRoutingModule } from './admin-routing.module';
import { AdminLayoutComponent } from '../admin-layout/admin-layout';
import { AdminDashboardComponent } from '../admin-dashboard/admin-dashboard';
import { AdminOrdersComponent } from '../admin-orders/admin-orders.component';
import { AdminUsersComponent } from '../admin-users/admin-users.component';
import { AdminProductsComponent } from '../admin-products/admin-products.component';
import { AdminCategoriesComponent } from '../admin-categories/admin-categories.component';

@NgModule({
  declarations: [
    AdminLayoutComponent,
    AdminDashboardComponent,
    AdminOrdersComponent,
    AdminUsersComponent,
    AdminProductsComponent,
    AdminCategoriesComponent,
  ],
  imports: [
    CommonModule,
    FormsModule,
    AdminRoutingModule,
  ],
})
export class AdminModule {}
