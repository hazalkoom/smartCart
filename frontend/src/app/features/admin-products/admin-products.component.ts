import { Component, OnInit, OnDestroy } from '@angular/core';
import { ProductService } from '../../core/services/product';
import { CategoryService, Category } from '../../core/services/category';
import { Subscription } from 'rxjs';

interface Product {
  _id: string;
  name: string;
  description: string;
  price: number;
  costPrice?: number;
  sku?: string;
  stock: number;
  images?: string[];
  category?: any;
}

@Component({
  selector: 'app-admin-products',
  standalone: false,
  templateUrl: './admin-products.component.html',
  styleUrl: './admin-products.component.css'
})
export class AdminProductsComponent implements OnInit, OnDestroy {
  categories: Category[] = [];
  products: Product[] = [];

  productForm = {
    name: '',
    description: '',
    price: '',
    costPrice: '',
    sku: '',
    category: '',
    stock: ''
  };

  isLoading: boolean = true;
  isSubmitting: boolean = false;
  errorMessage: string = '';
  successMessage: string = '';
  deletingProductId: string | null = null;
  isEditing: boolean = false;
  editingProductId: string | null = null;

  private subscriptions: Subscription[] = [];

  constructor(
    private productService: ProductService,
    private categoryService: CategoryService
  ) {}

  ngOnInit(): void {
    this.loadData();
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
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
        console.error('Error loading categories:', err);
      }
    });
    this.subscriptions.push(catSub);

    // Load products
    const prodSub = this.productService.getProducts().subscribe({
      next: (res: any) => {
        this.products = res.data || [];
        this.isLoading = false;
      },
      error: (err: any) => {
        console.error('Error loading products:', err);
        this.errorMessage = 'Failed to load products';
        this.isLoading = false;
      }
    });
    this.subscriptions.push(prodSub);
  }

  onFileSelected(event: any): void {
    // File upload not currently supported, ignore
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
      stock: parseInt(this.productForm.stock, 10)
    };

    const request$ = this.isEditing && this.editingProductId
      ? this.productService.updateProduct(this.editingProductId, productData as any)
      : this.productService.createProduct(productData as any);

    const sub = request$.subscribe({
      next: (res: any) => {
        this.successMessage = this.isEditing ? 'Product updated successfully!' : 'Product created successfully!';
        this.resetForm();
        this.loadData();
        this.isSubmitting = false;
      },
      error: (err: any) => {
        console.error('Error creating product:', err);
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
        console.error('Error deleting product:', err);
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
      stock: ''
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
      category: product.category?._id || product.category || '',
      stock: product.stock?.toString() || ''
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

  getProductImage(product: Product): string {
    return (product.images && product.images.length > 0) ? product.images[0] : 'assets/images/placeholder.jpg';
  }
}
