import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, catchError, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Review, ReviewResponse } from '../interfaces/review';

@Injectable({
  providedIn: 'root'
})
export class ReviewService {
  private apiUrl = `${environment.apiUrl}/reviews`;

  constructor(private http: HttpClient) {}

  getProductReviews(productId: string): Observable<ReviewResponse> {
    const params = new HttpParams().set('productId', productId);
    return this.http.get<ReviewResponse>(this.apiUrl, { params }).pipe(
      catchError(this.handleError)
    );
  }

  createReview(reviewData: { productId: string; rating: number; title: string; comment: string }): Observable<{ success: boolean; data: Review }> {
    return this.http.post<{ success: boolean; data: Review }>(this.apiUrl, reviewData).pipe(
      catchError(this.handleError)
    );
  }

  updateReview(reviewId: string, updateData: { rating?: number; title?: string; comment?: string }): Observable<{ success: boolean; data: Review }> {
    return this.http.patch<{ success: boolean; data: Review }>(`${this.apiUrl}/${reviewId}`, updateData).pipe(
      catchError(this.handleError)
    );
  }

  deleteReview(reviewId: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${reviewId}`).pipe(
      catchError(this.handleError)
    );
  }

  private handleError(error: any) {
    if (!environment.production) {
      console.error('ReviewService error:', error);
    }
    return throwError(() => error);
  }
}
