import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router'; // Make sure Router is imported
import { OrderService } from '../../core/services/order'; 
import { Order } from '../../core/interfaces/order'; 

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
    private router: Router, // <--- ADD THIS
    private orderService: OrderService
  ) {}

  ngOnInit(): void {
    const orderId = this.route.snapshot.paramMap.get('id');
    
    if (orderId) {
      this.loadOrder(orderId);
    } else {
      this.error = 'Invalid Order ID';
      this.isLoading = false;
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
      },
      error: (err) => {
        console.error(err);
        this.error = 'Order not found or you do not have permission to view it.';
        this.isLoading = false;
      }
    });
  }

  payPendingOrder() {
    if (!this.order) return;
    
    this.isProcessingPayment = true;
    
    this.orderService.payOrder(this.order._id, { paymentMethod: 'card' }).subscribe({
      next: (payRes: any) => {
        this.isProcessingPayment = false;
        console.log('🔥 RECOVERY PAYMENT RESPONSE:', payRes);
        
        const paymentUrl = payRes?.url || 
                           payRes?.data?.url || 
                           payRes?.data?.iframeUrl || 
                           payRes?.data?.redirectUrl || 
                           payRes?.iframeUrl || 
                           payRes?.redirectUrl;
        
        if (paymentUrl) {
          window.location.href = paymentUrl;
        } else {
          alert('Failed to extract payment link from backend response. Open Console (F12) to see what your backend actually sent.');
        }
      },
      error: (err) => {
        this.isProcessingPayment = false;
        console.error('Recovery Payment Error:', err);
        alert('Failed to connect to payment provider.');
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