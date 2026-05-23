import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '@env/environment';

interface ApiResponse<T> {
  success: boolean;
  data: T;
  timestamp: string;
}

@Injectable({ providedIn: 'root' })
export class ApiService {
  private readonly baseUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  get<T>(path: string, params?: Record<string, any>): Observable<T> {
    let httpParams = new HttpParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          httpParams = httpParams.set(key, value.toString());
        }
      });
    }
    return this.http.get<ApiResponse<T>>(`${this.baseUrl}/${path}`, { params: httpParams }).pipe(
      map((res) => res.data),
    );
  }

  post<T>(path: string, body: any = {}): Observable<T> {
    return this.http.post<ApiResponse<T>>(`${this.baseUrl}/${path}`, body).pipe(
      map((res) => res.data),
    );
  }

  patch<T>(path: string, body: any = {}): Observable<T> {
    return this.http.patch<ApiResponse<T>>(`${this.baseUrl}/${path}`, body).pipe(
      map((res) => res.data),
    );
  }

  delete<T>(path: string): Observable<T> {
    return this.http.delete<ApiResponse<T>>(`${this.baseUrl}/${path}`).pipe(
      map((res) => res.data),
    );
  }

  upload<T>(path: string, file: File): Observable<T> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<ApiResponse<T>>(`${this.baseUrl}/${path}`, formData).pipe(
      map((res) => res.data),
    );
  }
}
