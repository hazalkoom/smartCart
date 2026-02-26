import { Component } from '@angular/core';
import { Observable } from 'rxjs';
import { AuthService } from '../../services/auth';

@Component({
  selector: 'app-footer',
  standalone: false,
  templateUrl: './footer.html',
  styleUrl: './footer.css',
})
export class Footer {
  isLoggedIn$: Observable<boolean>;
  currentYear = new Date().getFullYear();

  constructor(private authService: AuthService) {
    this.isLoggedIn$ = this.authService.isLoggedIn$.asObservable();
  }

}
