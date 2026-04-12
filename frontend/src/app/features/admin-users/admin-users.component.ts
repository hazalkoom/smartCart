import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { UserService, User } from '../../core/services/user';
import { AuthService } from '../../core/services/auth';
import { Subscription } from 'rxjs';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-admin-users',
  standalone: false,
  templateUrl: './admin-users.component.html',
  styleUrl: './admin-users.component.css'
})
export class AdminUsersComponent implements OnInit, OnDestroy {
  customers: User[] = [];
  employees: User[] = [];
  Math = Math;
  activeTab: 'customers' | 'employees' = 'customers';
  isOwner: boolean = false;
  
  isLoading: boolean = true;
  isLoadingCustomers: boolean = false;
  isLoadingEmployees: boolean = false;
  errorMessage: string = '';
  successMessage: string = '';
  deletingUserId: string | null = null;
  isSubmitting: boolean = false;
  isEditing: boolean = false;
  editingUserId: string | null = null;
  isDrawerOpen: boolean = false;
  userForm = {
    firstName: '',
    lastName: '',
    email: '',
    role: 'customer',
    password: ''
  };
  
  // Pagination
  currentPageCustomers: number = 1;
  currentPageEmployees: number = 1;
  pageSize: number = 10;
  totalCustomers: number = 0;
  totalEmployees: number = 0;
  
  private subscriptions: Subscription[] = [];

  constructor(
    private userService: UserService,
    private authService: AuthService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    const authSub = this.authService.currentUser$.subscribe(user => {
      this.isOwner = user?.role === 'owner';
    });
    this.subscriptions.push(authSub);
    this.loadAllUsers();
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  loadAllUsers(): void {
    this.isLoading = true;
    this.errorMessage = '';
    this.loadCustomers();
    this.loadEmployees();
  }

  private updateLoadingState(): void {
    this.isLoading = this.isLoadingCustomers || this.isLoadingEmployees;
    this.cdr.detectChanges();
  }

  loadCustomers(): void {
    this.isLoadingCustomers = true;
    this.updateLoadingState();
    const sub = this.userService.getAllUsers({
      page: this.currentPageCustomers,
      limit: this.pageSize,
      role: 'customer,user'
    }).subscribe({
      next: (response) => {
        this.customers = response.data || [];
        this.totalCustomers = response.count ?? this.customers.length;
        this.isLoadingCustomers = false;
        this.updateLoadingState();
      },
      error: (error) => {
        if (!environment.production) console.error('Error fetching customers:', error);
        this.errorMessage = error?.error?.message || 'Failed to load users';
        this.isLoadingCustomers = false;
        this.updateLoadingState();
      }
    });
    this.subscriptions.push(sub);
  }

  loadEmployees(): void {
    this.isLoadingEmployees = true;
    this.updateLoadingState();
    const sub = this.userService.getAllUsers({
      page: this.currentPageEmployees,
      limit: this.pageSize,
      role: 'admin,owner'
    }).subscribe({
      next: (response) => {
        this.employees = response.data || [];
        this.totalEmployees = response.count ?? this.employees.length;
        this.isLoadingEmployees = false;
        this.updateLoadingState();
      },
      error: (error) => {
        if (!environment.production) console.error('Error fetching employees:', error);
        this.errorMessage = error?.error?.message || 'Failed to load users';
        this.isLoadingEmployees = false;
        this.updateLoadingState();
      }
    });
    this.subscriptions.push(sub);
  }

  deleteUser(userId: string): void {
    if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      return;
    }

    this.deletingUserId = userId;
    const sub = this.userService.deleteUser(userId).subscribe({
      next: () => {
        this.successMessage = 'User deleted successfully';
        setTimeout(() => this.successMessage = '', 3000);
        this.deletingUserId = null;
        this.loadAllUsers();
      },
      error: (error) => {
        if (!environment.production) console.error('Error deleting user:', error);
        this.errorMessage = error?.error?.message || 'Failed to delete user';
        this.deletingUserId = null;
      }
    });
    this.subscriptions.push(sub);
  }

  startCreate(): void {
    this.isEditing = false;
    this.editingUserId = null;
    this.resetForm();
  }

  openCreateDrawer(): void {
    this.errorMessage = '';
    this.startCreate();
    this.isDrawerOpen = true;
  }

  startEdit(user: User): void {
    this.isEditing = true;
    this.editingUserId = user._id;
    this.userForm = {
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      role: user.role,
      password: ''
    };
  }

  openEditDrawer(user: User): void {
    this.errorMessage = '';
    this.startEdit(user);
    this.isDrawerOpen = true;
  }

  cancelEdit(): void {
    this.startCreate();
  }

  closeDrawer(): void {
    this.isDrawerOpen = false;
    this.cancelEdit();
    this.isSubmitting = false;
  }

  submitUserForm(): void {
    if (!this.userForm.firstName || !this.userForm.lastName || !this.userForm.email) {
      this.errorMessage = 'First name, last name, and email are required';
      return;
    }

    if (!this.isEditing && !this.userForm.password) {
      this.errorMessage = 'Password is required to create a user';
      return;
    }

    this.isSubmitting = true;
    this.errorMessage = '';
    this.successMessage = '';

    const payload: any = {
      firstName: this.userForm.firstName,
      lastName: this.userForm.lastName,
      email: this.userForm.email
    };

    if (this.userForm.role && this.userForm.role !== 'owner') {
      payload.role = this.userForm.role;
    }

    if (this.userForm.password) {
      payload.password = this.userForm.password;
    }

    const request$ = this.isEditing && this.editingUserId
      ? this.userService.updateUser(this.editingUserId, payload)
      : this.userService.createUser(payload);

    const sub = request$.subscribe({
      next: () => {
        this.successMessage = this.isEditing ? 'User updated successfully' : 'User created successfully';
        setTimeout(() => this.successMessage = '', 3000);
        this.isSubmitting = false;
        this.isDrawerOpen = false;
        this.startCreate();
        this.loadAllUsers();
      },
      error: (error) => {
        if (!environment.production) console.error('Error saving user:', error);
        this.errorMessage = error?.error?.message || 'Failed to save user';
        this.isSubmitting = false;
      }
    });
    this.subscriptions.push(sub);
  }

  resetForm(): void {
    this.userForm = {
      firstName: '',
      lastName: '',
      email: '',
      role: 'customer',
      password: ''
    };
  }

  formatDate(date: string): string {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  getRoleBadgeClass(role: string): string {
    switch(role) {
      case 'owner':
        return 'bg-danger';
      case 'admin':
        return 'bg-warning text-dark';
      case 'customer':
      case 'user':
        return 'bg-secondary';
      default:
        return 'bg-info';
    }
  }

  // Pagination helpers for customers
  getCustomersPage(): User[] {
    return this.customers;
  }

  getTotalCustomersPages(): number {
    return Math.ceil(this.totalCustomers / this.pageSize) || 1;
  }

  goToCustomerPage(page: number): void {
    const total = this.getTotalCustomersPages();
    if (page >= 1 && page <= total) {
      this.currentPageCustomers = page;
      this.loadCustomers();
    }
  }

  getCustomerPageNumbers(): number[] {
    return Array.from({ length: this.getTotalCustomersPages() }, (_, i) => i + 1);
  }

  // Pagination helpers for employees
  getEmployeesPage(): User[] {
    return this.employees;
  }

  getTotalEmployeesPages(): number {
    return Math.ceil(this.totalEmployees / this.pageSize) || 1;
  }

  goToEmployeePage(page: number): void {
    const total = this.getTotalEmployeesPages();
    if (page >= 1 && page <= total) {
      this.currentPageEmployees = page;
      this.loadEmployees();
    }
  }

  getEmployeePageNumbers(): number[] {
    return Array.from({ length: this.getTotalEmployeesPages() }, (_, i) => i + 1);
  }
}
