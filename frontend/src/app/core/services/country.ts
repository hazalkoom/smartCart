import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { COUNTRIES, CountryOption } from '../constants/countries';

interface CountriesApiResponse {
  success: boolean;
  count: number;
  data: CountryOption[];
}

@Injectable({
  providedIn: 'root'
})
export class CountryService {
  private readonly apiUrl = `${environment.apiUrl}/countries`;
  private readonly countriesSubject = new BehaviorSubject<CountryOption[]>(COUNTRIES);
  readonly countries$ = this.countriesSubject.asObservable();
  private hasLoaded = false;

  constructor(private http: HttpClient) {}

  loadCountries(): void {
    if (this.hasLoaded) {
      return;
    }

    this.hasLoaded = true;
    this.http
      .get<CountriesApiResponse>(this.apiUrl)
      .pipe(catchError(() => of({ success: false, count: 0, data: [] })))
      .subscribe((response) => {
        if (!response.success || !Array.isArray(response.data) || response.data.length === 0) {
          return;
        }

        this.countriesSubject.next(response.data);
      });
  }
}