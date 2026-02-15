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
  { path: '**', redirectTo: '' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }