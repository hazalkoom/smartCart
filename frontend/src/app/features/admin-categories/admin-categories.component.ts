import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CategoryService } from '../../core/services/category';
import { Category } from '../../core/interfaces/category';
import { Subscription } from 'rxjs';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-admin-categories',
  standalone: false,
  templateUrl: './admin-categories.component.html',
  styleUrl: './admin-categories.component.css'
})
export class AdminCategoriesComponent implements OnInit, OnDestroy {
  categories: Category[] = [];
  categoryForm = {
    name: '',
    description: ''
  };
  isEditing: boolean = false;
  editingCategoryId: string | null = null;

  isLoading: boolean = true;
  isSubmitting: boolean = false;
  errorMessage: string = '';
  successMessage: string = '';
  deletingCategoryId: string | null = null;

  private subscriptions: Subscription[] = [];

  constructor(
    private categoryService: CategoryService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadCategories();
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  loadCategories(): void {
    this.isLoading = true;
    this.errorMessage = '';

    const sub = this.categoryService.getCategories().subscribe({
      next: (res: any) => {
        this.categories = res.data || [];
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (err: any) => {
        if (!environment.production) console.error('Error loading categories:', err);
        this.errorMessage = 'Failed to load categories';
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
    this.subscriptions.push(sub);
  }

  createCategory(): void {
    if (!this.categoryForm.name.trim()) {
      this.errorMessage = 'Category name is required';
      return;
    }

    this.isSubmitting = true;
    this.errorMessage = '';
    this.successMessage = '';

    const data = {
      name: this.categoryForm.name,
      description: this.categoryForm.description
    };

    const request$ = this.isEditing && this.editingCategoryId
      ? this.categoryService.updateCategory(this.editingCategoryId, data)
      : this.categoryService.createCategory(data);

    const sub = request$.subscribe({
      next: (res: any) => {
        this.successMessage = this.isEditing ? 'Category updated successfully!' : 'Category created successfully!';
        this.resetForm();
        this.loadCategories();
        this.isSubmitting = false;
      },
      error: (err: any) => {
        if (!environment.production) console.error('Error creating category:', err);
        this.errorMessage = err?.error?.message || 'Failed to create category';
        this.isSubmitting = false;
      }
    });
    this.subscriptions.push(sub);
  }

  deleteCategory(categoryId: string): void {
    if (!confirm('Are you sure you want to delete this category?')) {
      return;
    }

    this.deletingCategoryId = categoryId;
    const sub = this.categoryService.deleteCategory(categoryId).subscribe({
      next: (res: any) => {
        this.successMessage = 'Category deleted successfully!';
        setTimeout(() => this.successMessage = '', 3000);
        this.deletingCategoryId = null;
        this.loadCategories();
      },
      error: (err: any) => {
        if (!environment.production) console.error('Error deleting category:', err);
        this.errorMessage = err?.error?.message || 'Failed to delete category';
        this.deletingCategoryId = null;
      }
    });
    this.subscriptions.push(sub);
  }

  resetForm(): void {
    this.categoryForm = {
      name: '',
      description: ''
    };
    this.isEditing = false;
    this.editingCategoryId = null;
  }

  startEdit(category: Category): void {
    this.isEditing = true;
    this.editingCategoryId = category._id;
    this.categoryForm = {
      name: category.name,
      description: category.description || ''
    };
    this.scrollToForm();
  }

  cancelEdit(): void {
    this.resetForm();
  }

  private scrollToForm(): void {
    if (typeof window === 'undefined') return;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}
