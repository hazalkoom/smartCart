import { Component, OnInit, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { ProductService } from '../../core/services/product';
import { CategoryService } from '../../core/services/category';
import { Product } from '../../core/interfaces/product';
import { Category } from '../../core/interfaces/category';

declare var AOS: any;

@Component({
  selector: 'app-home',
  standalone: false,
  templateUrl: './home.html',
  styleUrl: './home.css'
})
export class Home implements OnInit {
  
  featuredProducts: Product[] = [];
  categories: Category[] = [];
  categoryProducts: Product[] = [];
  selectedCategory: string = 'all';
  isLoading: boolean = true;

  // --- NEW: Slider Variables ---
  heroProducts: Product[] = [];
  currentSlide: number = 0;

  constructor(
    private productService: ProductService,
    private categoryService: CategoryService,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId) && typeof AOS !== 'undefined') {
      AOS.init();
    }
    this.loadData();
  }

  loadData() {
    this.isLoading = true;

    this.categoryService.getCategories().subscribe({
      next: (res) => { this.categories = res.data; }
    });

    this.productService.getProducts().subscribe({
      next: (res) => {
        this.featuredProducts = res.data.slice(0, 4);
        this.categoryProducts = res.data;
        
        // --- NEW: Setup Hero Slider ---
        // Take the first 3 products for the main banner
        this.heroProducts = res.data.slice(0, 3);
        
        this.isLoading = false;
        this.refreshAnimations();
      },
      error: (err) => {
        console.error(err);
        this.isLoading = false;
      }
    });
  }

  onTabChange(categoryId: string): void {
    this.selectedCategory = categoryId;
    this.refreshAnimations();
  }

  refreshAnimations() {
    if (isPlatformBrowser(this.platformId) && typeof AOS !== 'undefined') {
      setTimeout(() => AOS.refresh(), 100);
    }
  }

  // --- NEW: Slider Logic ---
  nextSlide() {
    if (this.currentSlide < this.heroProducts.length - 1) {
      this.currentSlide++;
    } else {
      this.currentSlide = 0; // Loop back to start
    }
  }

  prevSlide() {
    if (this.currentSlide > 0) {
      this.currentSlide--;
    } else {
      this.currentSlide = this.heroProducts.length - 1; // Loop to end
    }
  }
}