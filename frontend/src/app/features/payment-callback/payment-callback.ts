import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-payment-callback',
  standalone: false,
  templateUrl: './payment-callback.html',
  styleUrl: './payment-callback.css'
})
export class PaymentCallbackComponent implements OnInit {
  isLoading: boolean = true;
  isSuccess: boolean = false;

  constructor(private route: ActivatedRoute) {}

  ngOnInit(): void {
    // Paymob sends parameters like: ?success=true&pending=false
    this.route.queryParams.subscribe(params => {
      const success = params['success'];
      const pending = params['pending'];

      // Give it a small delay so the user sees the spinner (better UX)
      setTimeout(() => {
        // 'true' comes as a string from URL
        this.isSuccess = (success === 'true');
        this.isLoading = false;
      }, 1000);
    });
  }
}