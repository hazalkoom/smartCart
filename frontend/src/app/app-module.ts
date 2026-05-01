import { NgModule, provideBrowserGlobalErrorListeners, APP_INITIALIZER } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { provideHttpClient, withInterceptorsFromDi, HTTP_INTERCEPTORS } from '@angular/common/http';
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
import { ForgotPassword } from './features/forgot-password/forgot-password';
import { ResetPassword } from './features/reset-password/reset-password';
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
import { GiftFinderComponent } from './features/gift-finder/gift-finder';
import { VerifyEmailComponent } from './features/verify-email/verify-email';
import { NotificationBellComponent } from './core/components/notification-bell/notification-bell';
import { AuthService } from './core/services/auth';

export function initializeAuthFactory(authService: AuthService): () => Promise<void> {
  return () => authService.initializeAuth();
}

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
    ForgotPassword,
    ResetPassword,
    Account,
    CategoryComponent,
    CartAnimationComponent,
    OrderDetailComponent,
    PaymentCallbackComponent,
    AboutComponent,
    HelpCenterComponent,
    WishlistComponent,
    GiftFinderComponent,
    VerifyEmailComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    FormsModule,
    CommonModule,
    NotificationBellComponent
  ],
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideHttpClient(withInterceptorsFromDi()),

    {
      provide: HTTP_INTERCEPTORS,
      useClass: AuthInterceptor,
      multi: true
    },
    {
      provide: HTTP_INTERCEPTORS,
      useClass: ErrorInterceptor,
      multi: true
    },
    {
      provide: APP_INITIALIZER,
      useFactory: initializeAuthFactory,
      deps: [AuthService],
      multi: true
    }
  ],
  bootstrap: [App]
})
export class AppModule { }