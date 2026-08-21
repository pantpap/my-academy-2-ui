import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../config/environment';

@Injectable({
  providedIn: 'root',
})
export class Http {
  private readonly httpClient = inject(HttpClient);
  private apiUrl = environment.apiUrl;

  get<T>(url: string, params?: Record<string, string | number>): Observable<T> {
    const endpoint = `${this.apiUrl}/${url}`;
    let httpParams = new HttpParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        httpParams = httpParams.set(key, value.toString());
      });
    }
    return this.httpClient.get<T>(endpoint, { params: httpParams });
  }

  post<T>(url: string, body?: T): Observable<any> {
    const endpoint = `${this.apiUrl}/${url}`;
    return this.httpClient.post<T>(endpoint, body);
  }

  put<T>(url: string, body?: T): Observable<any> {
    const endpoint = `${this.apiUrl}/${url}`;
    return this.httpClient.put<T>(endpoint, body);
  }
}
