import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { ProductService } from '../../core/services/product';
import { CategoryService } from '../../core/services/category';
import { Category } from '../../core/interfaces/category';
import { Subscription } from 'rxjs';
import { environment } from '../../../environments/environment';

interface Product {
  _id: string;
  name: string;
  description: string;
  price: number;
  costPrice?: number;
  sku?: string;
  stock: number;
  images?: string[];
  categoryId?: any;
}

@Component({
  selector: 'app-admin-products',
  standalone: false,
  templateUrl: './admin-products.component.html',
  styleUrl: './admin-products.component.css'
})
export class AdminProductsComponent implements OnInit, OnDestroy {
  Math = Math;
  categories: Category[] = [];
  allProducts: Product[] = [];
  products: Product[] = [];

  productForm = {
    name: '',
    description: '',
    price: '',
    costPrice: '',
    sku: '',
    category: '',
    stock: '',
    imageUrl: ''
  };

  isLoading: boolean = true;
  isSubmitting: boolean = false;
  errorMessage: string = '';
  successMessage: string = '';
  deletingProductId: string | null = null;
  isEditing: boolean = false;
  editingProductId: string | null = null;
  isDrawerOpen: boolean = false;

  currentPage: number = 1;
  pageSize: number = 10;
  totalProducts: number = 0;

  private subscriptions: Subscription[] = [];

  constructor(
    private productService: ProductService,
    private categoryService: CategoryService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadData();
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  get totalPages(): number {
    return Math.ceil(this.totalProducts / this.pageSize) || 1;
  }

  get pageNumbers(): number[] {
    return Array.from({ length: this.totalPages }, (_, index) => index + 1);
  }

  loadData(): void {
    this.isLoading = true;
    this.errorMessage = '';

    // Load categories
    const catSub = this.categoryService.getCategories().subscribe({
      next: (res: any) => {
        this.categories = res.data || [];
      },
      error: (err: any) => {
        if (!environment.production) console.error('Error loading categories:', err);
      }
    });
    this.subscriptions.push(catSub);

    // Load products
    const prodSub = this.productService.getProducts({ limit: 200 }).subscribe({
      next: (res: any) => {
        this.allProducts = res.data || [];
        this.totalProducts = this.allProducts.length;
        this.currentPage = 1;
        this.applyPagination();
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (err: any) => {
        if (!environment.production) console.error('Error loading products:', err);
        this.errorMessage = 'Failed to load products';
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
    this.subscriptions.push(prodSub);
  }

  onFileSelected(event: any): void {
    // File upload not currently supported, ignore
  }

  openCreateDrawer(): void {
    this.errorMessage = '';
    this.resetForm();
    this.isDrawerOpen = true;
  }

  addProduct(): void {
    if (!this.productForm.name || !this.productForm.price || !this.productForm.stock || !this.productForm.category || !this.productForm.sku) {
      this.errorMessage = 'Please fill in all required fields (Name, Price, Stock, Category, SKU)';
      return;
    }

    this.isSubmitting = true;
    this.errorMessage = '';
    this.successMessage = '';

    // Create plain JSON object instead of FormData
    const productData = {
      name: this.productForm.name,
      description: this.productForm.description,
      price: parseFloat(this.productForm.price),
      costPrice: this.productForm.costPrice ? parseFloat(this.productForm.costPrice) : 0,
      sku: this.productForm.sku.toUpperCase(),
      categoryId: this.productForm.category,
      stock: parseInt(this.productForm.stock, 10),
      images: this.productForm.imageUrl ? [this.productForm.imageUrl.trim()] : []
    };

    const request$ = this.isEditing && this.editingProductId
      ? this.productService.updateProduct(this.editingProductId, productData as any)
      : this.productService.createProduct(productData as any);

    const sub = request$.subscribe({
      next: (res: any) => {
        this.successMessage = this.isEditing ? 'Product updated successfully!' : 'Product created successfully!';
        this.isDrawerOpen = false;
        this.resetForm();
        this.loadData();
        this.isSubmitting = false;
      },
      error: (err: any) => {
        if (!environment.production) console.error('Error creating product:', err);
        this.errorMessage = err?.error?.message || 'Failed to create product';
        this.isSubmitting = false;
      }
    });
    this.subscriptions.push(sub);
  }

  deleteProduct(productId: string): void {
    if (!confirm('Are you sure you want to delete this product?')) {
      return;
    }

    this.deletingProductId = productId;
    const sub = this.productService.deleteProduct(productId).subscribe({
      next: (res: any) => {
        this.successMessage = 'Product deleted successfully!';
        setTimeout(() => this.successMessage = '', 3000);
        this.deletingProductId = null;
        this.loadData();
      },
      error: (err: any) => {
        if (!environment.production) console.error('Error deleting product:', err);
        this.errorMessage = err?.error?.message || 'Failed to delete product';
        this.deletingProductId = null;
      }
    });
    this.subscriptions.push(sub);
  }

  resetForm(): void {
    this.productForm = {
      name: '',
      description: '',
      price: '',
      costPrice: '',
      sku: '',
      category: '',
      stock: '',
      imageUrl: ''
    };
    this.isEditing = false;
    this.editingProductId = null;
  }

  startEdit(product: Product): void {
    this.isEditing = true;
    this.editingProductId = product._id;
    this.productForm = {
      name: product.name,
      description: product.description || '',
      price: product.price?.toString() || '',
      costPrice: product.costPrice?.toString() || '',
      sku: product.sku || '',
      category: this.getCategoryId(product),
      stock: product.stock?.toString() || '',
      imageUrl: product.images && product.images.length > 0 ? product.images[0] : ''
    };
  }

  openEditDrawer(product: Product): void {
    this.errorMessage = '';
    this.startEdit(product);
    this.isDrawerOpen = true;
  }

  getCategoryName(product: Product): string {
    if (!product.categoryId) {
      return 'Uncategorized';
    }

    if (typeof product.categoryId === 'string') {
      const category = this.categories.find((cat) => cat._id === product.categoryId);
      return category?.name || 'Uncategorized';
    }

    return product.categoryId.name || 'Uncategorized';
  }

  private getCategoryId(product: Product): string {
    if (!product.categoryId) {
      return '';
    }

    if (typeof product.categoryId === 'string') {
      return product.categoryId;
    }

    return product.categoryId._id || '';
  }

  cancelEdit(): void {
    this.resetForm();
  }

  closeDrawer(): void {
    this.isDrawerOpen = false;
    this.cancelEdit();
    this.isSubmitting = false;
  }

  applyPagination(): void {
    const start = (this.currentPage - 1) * this.pageSize;
    const end = start + this.pageSize;
    this.products = this.allProducts.slice(start, end);
  }

  goToPage(page: number): void {
    if (page < 1 || page > this.totalPages) {
      return;
    }

    this.currentPage = page;
    this.applyPagination();
  }

  nextPage(): void {
    this.goToPage(this.currentPage + 1);
  }

  prevPage(): void {
    this.goToPage(this.currentPage - 1);
  }

  getPreviewImage(): string {
    if (this.productForm.imageUrl && this.productForm.imageUrl.trim()) {
      return this.productForm.imageUrl.trim();
    }

    return 'assets/images/placeholder.jpg';
  }

  getProductImage(product: Product): string {
    return (product.images && product.images.length > 0) ? product.images[0] : 'assets/images/placeholder.jpg';
  }
}
