import { Component, OnInit, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { ProductService } from '../../core/services/product';
import { Product } from '../../core/interfaces/product';

declare var AOS: any;

@Component({
  selector: 'app-product-list',
  standalone: false,
  templateUrl: './product-list.html',
  styleUrl: './product-list.css',
})
export class ProductList implements OnInit {
  
  // Data variables
  products: Product[] = [];
  isLoading: boolean = true;
  error: string = '';

  constructor(
    private productService: ProductService,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  ngOnInit() {

    if (isPlatformBrowser(this.platformId) && typeof AOS !== 'undefined') {
      AOS.init();
    }

    this.loadProducts();
  }

  loadProducts(): void {
    this.productService.getProducts().subscribe({
      next: (response) => {
        this.products = response.data;
        this.isLoading = false;

        if (isPlatformBrowser(this.platformId) && typeof AOS !== 'undefined') {
          setTimeout(() => {
            AOS.refresh(); 
          }, 100);
        }
      },
      error: (err) => {
        this.error = 'Failed to load products. Please try again later.';
        this.isLoading = false;
        console.error(err);
      }
    });
  }
}