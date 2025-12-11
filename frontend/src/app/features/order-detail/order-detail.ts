import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { OrderService } from '../../core/services/order'; // Check path (order.ts)
import { Order } from '../../core/interfaces/order'; // Check path (order.ts)

@Component({
  selector: 'app-order-detail',
  standalone: false,
  templateUrl: './order-detail.html',
  styleUrl: './order-detail.css'
})
export class OrderDetailComponent implements OnInit { // Renamed to Component per standard
  
  order: Order | null = null;
  isLoading: boolean = true;
  error: string = '';

  constructor(
    private route: ActivatedRoute,
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

  // Helper to get status color
  getStatusClass(status: string): string {
    switch (status.toLowerCase()) {
      case 'paid': return 'text-success';
      case 'shipped': return 'text-primary';
      case 'delivered': return 'text-success';
      case 'cancelled': return 'text-danger';
      default: return 'text-warning'; // Pending
    }
  }
  getTimelineClass(stage: string): string {
    if (!this.order) return '';
    
    const status = this.order.status.toLowerCase();
    const stages = ['pending', 'paid', 'shipped', 'delivered'];
    const currentStageIndex = stages.indexOf(status);
    const checkStageIndex = stages.indexOf(stage);
    
    if (checkStageIndex < currentStageIndex) {
      return 'completed';
    } else if (checkStageIndex === currentStageIndex) {
      return 'active';
    }
    return '';
  }
}