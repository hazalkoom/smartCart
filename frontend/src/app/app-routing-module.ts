import { NgModule, provideBrowserGlobalErrorListeners } from '@angular/core';
import { BrowserModule, provideClientHydration, withEventReplay } from '@angular/platform-browser';
import { RouterModule, Routes } from '@angular/router';

import { App } from './app';
import { Header } from './core/components/header/header';
import { Footer } from './core/components/footer/footer';
import { Home } from './features/home/home';
import { ProductList } from './features/product-list/product-list';
import { ProductDetail } from './features/product-detail/product-detail';
import { Cart } from './features/cart/cart';
import { Checkout } from './features/checkout/checkout';
import { Login } from './features/login/login';
import { Register } from './features/register/register';
import { Account } from './features/account/account';
import { CategoryComponent } from './features/category/category';

const routes: Routes = [{ path: '', component: Home },

  // 2. Product Pages and category
  { path: 'products', component: ProductList },
  { path: 'products/:slug', component: ProductDetail }, // Commented out to fix build (SSG error) 
  { path: 'categories', component: CategoryComponent },
  
  // 3. Cart & Checkout
  { path: 'cart', component: Cart },
  { path: 'checkout', component: Checkout },

  // 4. Auth Pages
  { path: 'login', component: Login },
  { path: 'register', component: Register },

  // 5. User Account
  { path: 'account', component: Account },



  // 6. Fallback (If user types a wrong URL, go to Home)
  { path: '**', redirectTo: '' }];

  // category
  



@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
