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
import { NotificationBellComponent } from '../../core/components/notification-bell/notification-bell';
import { AdminFormDrawerComponent } from './shared/admin-form-drawer/admin-form-drawer.component';

@NgModule({
  declarations: [
    AdminLayoutComponent,
    AdminDashboardComponent,
    AdminOrdersComponent,
    AdminUsersComponent,
    AdminProductsComponent,
    AdminCategoriesComponent,
    AdminFormDrawerComponent,
  ],
  imports: [
    CommonModule,
    FormsModule,
    AdminRoutingModule,
    NotificationBellComponent,
  ],
})
export class AdminModule {}
