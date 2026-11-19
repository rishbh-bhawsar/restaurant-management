import { Injectable } from '@angular/core';
import { HttpClient, HttpParams, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

export interface ApiResponse<T = any> {
  success: boolean;
  status?: number;
  total?: number;
  entityId?: number;
  branchId?: number;
  message?: string;
  data: T;
}

export interface PaginationParams {
  limit?: number;
  offset?: number;
  page?: number;
  search?: string;
  category?: string;
}

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private readonly baseUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  private buildUrl(endpoint: string): string {
    if (endpoint.startsWith('http://') || endpoint.startsWith('https://')) {
      return endpoint;
    }
    return `${this.baseUrl}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;
  }

  private buildParams(params?: Record<string, any>): HttpParams {
    let httpParams = new HttpParams();
    if (!params) return httpParams;

    Object.keys(params).forEach((key) => {
      const val = params[key];
      if (val !== undefined && val !== null && val !== '') {
        httpParams = httpParams.set(key, val.toString());
      }
    });

    return httpParams;
  }

  get<T>(endpoint: string, params?: Record<string, any>): Observable<ApiResponse<T>> {
    return this.http.get<ApiResponse<T>>(this.buildUrl(endpoint), {
      params: this.buildParams(params)
    });
  }

  post<T>(endpoint: string, body: any = {}, params?: Record<string, any>): Observable<ApiResponse<T>> {
    return this.http.post<ApiResponse<T>>(this.buildUrl(endpoint), body, {
      params: this.buildParams(params)
    });
  }

  put<T>(endpoint: string, body: any = {}, params?: Record<string, any>): Observable<ApiResponse<T>> {
    return this.http.put<ApiResponse<T>>(this.buildUrl(endpoint), body, {
      params: this.buildParams(params)
    });
  }

  delete<T>(endpoint: string, params?: Record<string, any>): Observable<ApiResponse<T>> {
    return this.http.delete<ApiResponse<T>>(this.buildUrl(endpoint), {
      params: this.buildParams(params)
    });
  }

  /**
   * Helper for scroll-based pagination
   */
  getScrollPage<T>(endpoint: string, offset: number = 0, limit: number = 20, extraParams?: Record<string, any>): Observable<ApiResponse<T[]>> {
    return this.get<T[]>(endpoint, {
      offset,
      limit,
      ...extraParams
    });
  }
}
