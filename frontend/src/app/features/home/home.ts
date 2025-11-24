import { Component, OnInit, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { ProductService } from '../../core/services/product';
import { CategoryService } from '../../core/services/category';
import { Product } from '../../core/interfaces/product';
import { Category } from '../../core/interfaces/category';

// Declare AOS for animations
declare var AOS: any;

@Component({
  selector: 'app-home',
  standalone: false,
  templateUrl: './home.html',
  styleUrl: './home.css'
})
export class Home implements OnInit {
  
  // Data variables
  featuredProducts: Product[] = [];
  categories: Category[] = [];
  
  // Variables for the "Popular Books" tab section
  categoryProducts: Product[] = [];
  selectedCategory: string = 'all';

  isLoading: boolean = true;

  constructor(
    private productService: ProductService,
    private categoryService: CategoryService,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  ngOnInit(): void {
    // 1. Init animations
    if (isPlatformBrowser(this.platformId) && typeof AOS !== 'undefined') {
      AOS.init();
    }

    // 2. Load Data
    this.loadData();
  }

  loadData() {
    this.isLoading = true;

    // Fetch Categories
    this.categoryService.getCategories().subscribe({
      next: (res) => {
        this.categories = res.data;
      }
    });

    // Fetch All Products (we will filter them in the UI for now)
    this.productService.getProducts().subscribe({
      next: (res) => {
        // Logic: Take the first 4 as "Featured"
        this.featuredProducts = res.data.slice(0, 4);
        
        // Logic: Use all products for the "Popular" section initially
        this.categoryProducts = res.data;
        
        this.isLoading = false;
        this.refreshAnimations();
      },
      error: (err) => {
        console.error(err);
        this.isLoading = false;
      }
    });
  }

  // Handle Tab Clicks (Business, Tech, etc.)
  onTabChange(categoryId: string): void {
    this.selectedCategory = categoryId;
    
    // Note: In a real app, we would call the backend with ?category=ID
    // For now, we will just filter the "categoryProducts" list if we had more data.
    // Since we are just displaying the main list, we'll reload the products.
    this.refreshAnimations();
  }

  refreshAnimations() {
    if (isPlatformBrowser(this.platformId) && typeof AOS !== 'undefined') {
      setTimeout(() => AOS.refresh(), 100);
    }
  }
}