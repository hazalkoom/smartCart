import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CategoryService } from '../../core/services/category';
import { Category } from '../../core/interfaces/category';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-category',
  standalone: false,
  templateUrl: './category.html',
  styleUrl: './category.css'
})
export class CategoryComponent implements OnInit {
  
  categories: Category[] = [];
  isLoading: boolean = true;
  errorMessage: string = '';

  // Map category names to appropriate icons
  private iconMap: Record<string, string> = {
    'phones': 'bi bi-phone-fill',
    'smartphones': 'bi bi-phone-fill',
    'mobile': 'bi bi-phone-fill',
    'laptops': 'bi bi-laptop-fill',
    'computers': 'bi bi-pc-display-horizontal',
    'tablets': 'bi bi-tablet-landscape-fill',
    'audio': 'bi bi-headphones',
    'headphones': 'bi bi-headphones',
    'cameras': 'bi bi-camera-fill',
    'gaming': 'bi bi-controller',
    'accessories': 'bi bi-usb-symbol',
    'wearables': 'bi bi-smartwatch',
    'watches': 'bi bi-smartwatch',
    'networking': 'bi bi-router-fill',
    'storage': 'bi bi-device-hdd-fill',
    'printers': 'bi bi-printer-fill',
    'tv': 'bi bi-tv-fill',
    'monitors': 'bi bi-display-fill',
    'speakers': 'bi bi-speaker-fill',
    'smart home': 'bi bi-house-gear-fill',
  };

  constructor(
    private categoryService: CategoryService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.categoryService.getCategories().subscribe({
      next: (res) => {
        this.categories = res.data;
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        if (!environment.production) console.error(err);
        this.errorMessage = 'Failed to load categories. Please try again.';
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  getCategoryIcon(name: string): string {
    const lower = name.toLowerCase();
    for (const [key, icon] of Object.entries(this.iconMap)) {
      if (lower.includes(key)) return icon;
    }
    return 'bi bi-grid-3x3-gap-fill';
  }
}