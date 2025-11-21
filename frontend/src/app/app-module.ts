import { FormsModule } from '@angular/forms';
import { NgModule, provideBrowserGlobalErrorListeners } from '@angular/core';
import { BrowserModule, provideClientHydration, withEventReplay } from '@angular/platform-browser';
import { provideHttpClient, withFetch } from '@angular/common/http';
import { AppRoutingModule } from './app-routing-module';
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


@NgModule({
  declarations: [
    App,
    Header,
    Footer,
    Home,
    ProductList,
    ProductDetail,
    Cart,
    Checkout,
    Login,
    Register,
    Account
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    FormsModule
  ],
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideClientHydration(withEventReplay()),
    provideHttpClient(withFetch())
  ],
  bootstrap: [App]
})
export class AppModule { }
