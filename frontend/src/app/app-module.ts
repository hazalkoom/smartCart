import { NgModule, provideBrowserGlobalErrorListeners } from '@angular/core';
import { BrowserModule, provideClientHydration, withEventReplay } from '@angular/platform-browser';
import { provideHttpClient, withFetch, withInterceptorsFromDi, HTTP_INTERCEPTORS } from '@angular/common/http';
import { FormsModule } from '@angular/forms'; // Needed for ngModel
import { CommonModule } from '@angular/common'; // Needed for pipes like slice

import { AppRoutingModule } from './app-routing-module';
import { App } from './app';
import { Header } from './core/components/header/header';
import { Footer } from './core/components/footer/footer';
import { Home } from './features/home/home';
import { ProductListComponent } from './features/product-list/product-list';
import { ProductDetail } from './features/product-detail/product-detail';
import { CartComponent } from './features/cart/cart';
import { CheckoutComponent } from './features/checkout/checkout';
import { Login } from './features/login/login';
import { Register } from './features/register/register';
import { Account } from './features/account/account';
import { CategoryComponent } from './features/category/category';
import { CartAnimationComponent } from './core/components/cart-animation/cart-animation';

import { AuthInterceptor } from './core/interceptors/auth.interceptor';
import { ErrorInterceptor } from './core/interceptors/error.interceptor';
import { OrderDetailComponent } from './features/order-detail/order-detail';
import { PaymentCallbackComponent } from './features/payment-callback/payment-callback';
import { AboutComponent } from './features/about/about';
import { HelpCenterComponent } from './features/help-center/help-center';
import { WishlistComponent } from './features/wishlist/wishlist';

@NgModule({
  declarations: [
    App,
    Header,
    Footer,
    Home,
    ProductListComponent,
    ProductDetail,
    CartComponent, // Fixed Name
    CheckoutComponent, // Fixed Name
    Login,
    Register,
    Account,
    CategoryComponent,
    CartAnimationComponent,
    OrderDetailComponent,
    PaymentCallbackComponent,
    AboutComponent,
    HelpCenterComponent,
    WishlistComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    FormsModule,
    CommonModule
  ],
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideClientHydration(withEventReplay()),
    provideHttpClient(withFetch(), withInterceptorsFromDi()),

    {
      provide: HTTP_INTERCEPTORS,
      useClass: AuthInterceptor,
      multi: true
    },
    {
      provide: HTTP_INTERCEPTORS,
      useClass: ErrorInterceptor,
      multi: true
    }
  ],
  bootstrap: [App]
})
export class AppModule { }