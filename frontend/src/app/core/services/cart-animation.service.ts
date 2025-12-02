import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface CartAnimationData {
  productId: string;
  productImage: string;
  productName: string;
  startX: number;
  startY: number;
}

@Injectable({
  providedIn: 'root'
})
export class CartAnimationService {
  public animation$ = new BehaviorSubject<CartAnimationData | null>(null);

  triggerAnimation(data: CartAnimationData): void {
    this.animation$.next(data);
    // Clear after animation completes (handled by component)
    setTimeout(() => {
      this.animation$.next(null);
    }, 1000);
  }
}


