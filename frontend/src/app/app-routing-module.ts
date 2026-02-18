import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { Home } from './features/home/home';
import { ProductListComponent } from './features/product-list/product-list';
import { ProductDetail } from './features/product-detail/product-detail';
import { CartComponent } from './features/cart/cart'; // Fixed
import { CheckoutComponent } from './features/checkout/checkout'; // Fixed
import { Login } from './features/login/login';
import { Register } from './features/register/register';
import { Account } from './features/account/account';
import { CategoryComponent } from './features/category/category';
import { OrderDetailComponent } from './features/order-detail/order-detail'; // (Check if CLI named it OrderDetail or OrderDetailComponent)
import { PaymentCallbackComponent } from './features/payment-callback/payment-callback';
import { AdminLayoutComponent } from './features/admin-layout/admin-layout';
import { AdminGuard } from './core/guards/admin.guard';
import { OwnerGuard } from './core/guards/owner.guard';
import { AdminDashboardComponent } from './features/admin-dashboard/admin-dashboard';
import { AdminOrdersComponent } from './features/admin-orders/admin-orders.component';
import { AdminUsersComponent } from './features/admin-users/admin-users.component';
import { AdminProductsComponent } from './features/admin-products/admin-products.component';
import { AdminCategoriesComponent } from './features/admin-categories/admin-categories.component';

const routes: Routes = [
  { path: '', component: Home },
  { path: 'products', component: ProductListComponent },
  { path: 'products/:slug', component: ProductDetail },
  { path: 'cart', component: CartComponent }, // Fixed
  { path: 'checkout', component: CheckoutComponent }, // Fixed
  { path: 'login', component: Login },
  { path: 'register', component: Register },
  { path: 'account', component: Account },
  { path: 'categories', component: CategoryComponent },
  { path: 'orders/:id', component: OrderDetailComponent },
  { path: 'payment-callback', component: PaymentCallbackComponent },
  { 
    path: 'admin', 
    component: AdminLayoutComponent, 
    canActivate: [AdminGuard],
    children: [
      { path: '', component: AdminDashboardComponent },
      { path: 'orders', component: AdminOrdersComponent },
      { path: 'users', component: AdminUsersComponent, canActivate: [OwnerGuard] },
      { path: 'products', component: AdminProductsComponent },
      { path: 'categories', component: AdminCategoriesComponent }
    ] 
  },
  { path: '**', redirectTo: '' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }