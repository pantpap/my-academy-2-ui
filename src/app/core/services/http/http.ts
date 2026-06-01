import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../config/environment';

@Injectable({
  providedIn: 'root',
})
export class Http {
  private readonly httpClient = inject(HttpClient);
  private apiUrl = environment.apiUrl;

  post<T>(url: string, body?: T): Observable<any> {
    const endpoint = `${this.apiUrl}/${url}`;
    return this.httpClient.post<T>(endpoint, body);
  }
}
