import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, retry, catchError, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Product, ProductResponse } from '../interfaces/product';

export type ProductSort = 'price_asc' | 'price_desc' | 'top_rated' | 'newest';
export type StockStatus = 'in' | 'out' | 'low';

export interface ProductQueryParams {
  keyword?: string;
  minPrice?: number;
  maxPrice?: number;
  minRating?: number;
  stockStatus?: StockStatus;
  sort?: ProductSort;
  category?: string;
  page?: number;
  limit?: number;
}

@Injectable({
  providedIn: 'root'
})
export class ProductService {
  private apiUrl = `${environment.apiUrl}/products`;

  constructor(private http: HttpClient) { }

  getProducts(params?: ProductQueryParams | Record<string, string | number | boolean | null | undefined>): Observable<ProductResponse> {
    let httpParams = new HttpParams();
    
    if (params) {
      Object.keys(params).forEach(key => {
        const value = params[key as keyof typeof params];
        if (value !== undefined && value !== null && value !== '') {
          httpParams = httpParams.set(key, String(value));
        }
      });
    }

    return this.http.get<ProductResponse>(this.apiUrl, { params: httpParams }).pipe(
      retry(1),
      catchError(this.handleError)
    );
  }

  getProduct(slug: string): Observable<{ success: boolean, data: Product }> {
    return this.http.get<{ success: boolean, data: Product }>(`${this.apiUrl}/${slug}`).pipe(
      retry(1),
      catchError(this.handleError)
    );
  }

  createProduct(productData: any): Observable<{ success: boolean; data: Product }> {
    return this.http.post<{ success: boolean; data: Product }>(this.apiUrl, productData).pipe(
      catchError(this.handleError)
    );
  }

  updateProduct(id: string, productData: any): Observable<{ success: boolean; data: Product }> {
    return this.http.put<{ success: boolean; data: Product }>(`${this.apiUrl}/${id}`, productData).pipe(
      catchError(this.handleError)
    );
  }

  deleteProduct(id: string): Observable<{ success: boolean; message: string }> {
    return this.http.delete<{ success: boolean; message: string }>(`${this.apiUrl}/${id}`).pipe(
      catchError(this.handleError)
    );
  }

  private handleError(error: any) {
    if (!environment.production) {
      console.error('ProductService error:', error);
    }
    return throwError(() => error);
  }
}
