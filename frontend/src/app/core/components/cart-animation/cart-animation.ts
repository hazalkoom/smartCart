import { Component, OnInit, OnDestroy, PLATFORM_ID, Inject, ElementRef, ViewChild } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Subscription } from 'rxjs';
import { CartAnimationService, CartAnimationData } from '../../services/cart-animation.service';

@Component({
  selector: 'app-cart-animation',
  standalone: false,
  template: `
    @if (animationData) {
      <div
        #flyingItem
        class="flying-item"
        [style.left.px]="animationData.startX"
        [style.top.px]="animationData.startY"
        [style.--end-x.px]="endX"
        [style.--end-y.px]="endY">
        <img [src]="animationData.productImage" [alt]="animationData.productName">
      </div>
    }
    `,
  styles: [`
    .flying-item {
      position: fixed;
      width: 60px;
      height: 60px;
      z-index: 9999;
      pointer-events: none;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
      border: 2px solid white;
      animation: flyToCart 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards;
    }

    .flying-item img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    @keyframes flyToCart {
      0% {
        transform: translate(0, 0) scale(1) rotate(0deg);
        opacity: 1;
      }
      50% {
        transform: translate(calc(var(--end-x) * 0.5), calc(var(--end-y) * 0.5)) scale(0.7) rotate(180deg);
        opacity: 0.9;
      }
      100% {
        transform: translate(var(--end-x), var(--end-y)) scale(0.2) rotate(360deg);
        opacity: 0;
      }
    }
  `]
})
export class CartAnimationComponent implements OnInit, OnDestroy {
  @ViewChild('flyingItem', { static: false }) flyingItem?: ElementRef;
  
  animationData: CartAnimationData | null = null;
  endX: number = 0;
  endY: number = 0;
  private subscription?: Subscription;

  constructor(
    private cartAnimationService: CartAnimationService,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.subscription = this.cartAnimationService.animation$.subscribe(data => {
        if (data) {
          this.calculateEndPosition(data);
          this.animationData = { ...data };
        } else {
          this.animationData = null;
        }
      });
    }
  }

  ngOnDestroy(): void {
    this.subscription?.unsubscribe();
  }

  private calculateEndPosition(data: CartAnimationData): void {
    if (isPlatformBrowser(this.platformId)) {
      // Target the current header cart icon element.
      const cartIcon =
        (document.getElementById('cart-icon-target') as HTMLElement | null) ||
        (document.querySelector('a.sc-icon-btn[aria-label="Cart"]') as HTMLElement | null);

      if (cartIcon) {
        const rect = cartIcon.getBoundingClientRect();
        const endX = rect.left + rect.width / 2;
        const endY = rect.top + rect.height / 2;
        
        // Calculate relative position from start
        this.endX = endX - data.startX;
        this.endY = endY - data.startY;
      } else {
        // Fallback to top right corner if cart icon not found
        this.endX = window.innerWidth - 50 - data.startX;
        this.endY = 50 - data.startY;
      }
    }
  }
}