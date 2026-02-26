import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-payment-callback',
  standalone: false,
  templateUrl: './payment-callback.html',
  styleUrl: './payment-callback.css'
})
export class PaymentCallbackComponent implements OnInit, OnDestroy {
  isLoading: boolean = true;
  isSuccess: boolean = false;
  private subscriptions: Subscription[] = [];

  constructor(private route: ActivatedRoute) {}

  ngOnInit(): void {
    // Paymob sends parameters like: ?success=true&pending=false
    const qpSub = this.route.queryParams.subscribe(params => {
      const success = params['success'];
      const pending = params['pending'];

      // Give it a small delay so the user sees the spinner (better UX)
      setTimeout(() => {
        // 'true' comes as a string from URL
        this.isSuccess = (success === 'true');
        this.isLoading = false;
      }, 1000);
    });
    this.subscriptions.push(qpSub);
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }
}