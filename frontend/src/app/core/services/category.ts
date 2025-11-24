import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable} from 'rxjs';
import { environment } from '../../../environments/environment';
import { CategoryResponse } from '../interfaces/category';


@Injectable({
  providedIn: 'root',
})
export class CategoryService {
  private apiUrl = `${environment.apiUrl}/categories`;

  constructor(private http: HttpClient) { }

  getCategories(): Observable<CategoryResponse> {
    return this.http.get<CategoryResponse>(this.apiUrl);
  }
}
