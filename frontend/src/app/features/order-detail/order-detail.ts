import { ChangeDetectorRef, Component, OnInit, Inject, PLATFORM_ID } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { isPlatformBrowser } from '@angular/common';
import { OrderService } from '../../core/services/order'; 
import { Order } from '../../core/interfaces/order'; 
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-order-detail',
  standalone: false,
  templateUrl: './order-detail.html',
  styleUrl: './order-detail.css'
})
export class OrderDetailComponent implements OnInit { 
  
  order: Order | null = null;
  isLoading: boolean = true;
  error: string = '';
  isProcessingPayment: boolean = false; // <--- ADD THIS

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private orderService: OrderService,
    private cdr: ChangeDetectorRef,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  ngOnInit(): void {
    const orderId = this.route.snapshot.paramMap.get('id');
    
    if (orderId) {
      this.loadOrder(orderId);
    } else {
      this.error = 'Invalid Order ID';
      this.isLoading = false;
      this.cdr.detectChanges();
    }
  }

  loadOrder(id: string) {
    this.isLoading = true;
    this.orderService.getOrderById(id).subscribe({
      next: (res) => {
        if (res.success) {
          this.order = res.data;
        }
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        if (!environment.production) console.error(err);
        this.error = 'Order not found or you do not have permission to view it.';
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  payPendingOrder() {
    if (!this.order) return;
    
    this.isProcessingPayment = true;
    
    this.orderService.payOrder(this.order._id, { paymentMethod: 'card' }).subscribe({
      next: (payRes: any) => {
        this.isProcessingPayment = false;
        this.cdr.detectChanges();
        
        const paymentUrl = payRes?.url || 
                           payRes?.data?.url || 
                           payRes?.data?.iframeUrl || 
                           payRes?.data?.redirectUrl || 
                           payRes?.iframeUrl || 
                           payRes?.redirectUrl;
        
        if (paymentUrl) {
          if (isPlatformBrowser(this.platformId)) {
            window.location.href = paymentUrl;
          }
        } else {
          alert('Failed to extract payment link from backend response. Open Console (F12) to see what your backend actually sent.');
        }
      },
      error: (err) => {
        this.isProcessingPayment = false;
        if (!environment.production) console.error('Recovery Payment Error:', err);
        alert('Failed to connect to payment provider.');
        this.cdr.detectChanges();
      }
    });
  }
  // -------------------------------

  getStatusClass(status: string): string {
    switch (status.toLowerCase()) {
      case 'paid': return 'text-success';
      case 'shipped': return 'text-primary';
      case 'delivered': return 'text-success';
      case 'cancelled': return 'text-danger';
      default: return 'text-warning'; 
    }
  }

  getTimelineClass(stage: string): string {
    if (!this.order) return '';
    const status = this.order.status.toLowerCase();
    const stages = ['pending', 'paid', 'shipped', 'delivered'];
    const currentIndex = stages.indexOf(status);
    const stageIndex = stages.indexOf(stage);
    
    if (stageIndex <= currentIndex) return 'completed';
    if (stageIndex === currentIndex + 1) return 'active';
    return '';
  }
}