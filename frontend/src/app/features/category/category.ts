import { Component, OnInit } from '@angular/core';
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
    'phones': 'icon-phone',
    'smartphones': 'icon-phone',
    'mobile': 'icon-phone',
    'laptops': 'icon-screen-desktop',
    'computers': 'icon-screen-desktop',
    'tablets': 'icon-screen-tablet',
    'audio': 'icon-earphones',
    'headphones': 'icon-earphones',
    'cameras': 'icon-camera',
    'gaming': 'icon-game-controller',
    'accessories': 'icon-handbag',
    'wearables': 'icon-clock',
    'watches': 'icon-clock',
    'networking': 'icon-globe',
    'storage': 'icon-folder',
    'printers': 'icon-printer',
    'tv': 'icon-screen-desktop',
    'monitors': 'icon-screen-desktop',
    'speakers': 'icon-volume-2',
    'smart home': 'icon-home',
  };

  constructor(private categoryService: CategoryService) {}

  ngOnInit(): void {
    this.categoryService.getCategories().subscribe({
      next: (res) => {
        this.categories = res.data;
        this.isLoading = false;
      },
      error: (err) => {
        if (!environment.production) console.error(err);
        this.errorMessage = 'Failed to load categories. Please try again.';
        this.isLoading = false;
      }
    });
  }

  getCategoryIcon(name: string): string {
    const lower = name.toLowerCase();
    for (const [key, icon] of Object.entries(this.iconMap)) {
      if (lower.includes(key)) return icon;
    }
    return 'icon-grid';
  }
}