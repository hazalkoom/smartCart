import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';

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
import { AboutComponent } from './features/about/about';
import { HelpCenterComponent } from './features/help-center/help-center';
import { WishlistComponent } from './features/wishlist/wishlist';

const routes: Routes = [
  { path: '', component: Home },
  { path: 'products', component: ProductListComponent },
  { path: 'products/:slug', component: ProductDetail },
  { path: 'cart', component: CartComponent, canActivate: [authGuard] },
  { path: 'checkout', component: CheckoutComponent, canActivate: [authGuard] },
  { path: 'login', component: Login },
  { path: 'register', component: Register },
  { path: 'about', component: AboutComponent },
  { path: 'help-center', component: HelpCenterComponent },
  { path: 'wishlist', component: WishlistComponent, canActivate: [authGuard] },
  { path: 'account', component: Account, canActivate: [authGuard] },
  { path: 'categories', component: CategoryComponent },
  { path: 'orders/:id', component: OrderDetailComponent, canActivate: [authGuard] },
  { path: 'payment-callback', component: PaymentCallbackComponent },
  {
    path: 'admin',
    loadChildren: () => import('./features/admin/admin.module').then((m) => m.AdminModule),
  },
  { path: '**', redirectTo: '' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes, {
    anchorScrolling: 'enabled',
    scrollPositionRestoration: 'enabled',
    scrollOffset: [0, 80]
  })],
  exports: [RouterModule]
})
export class AppRoutingModule { }