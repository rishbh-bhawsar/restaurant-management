import { Injectable } from '@angular/core';
import {
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpInterceptor,
  HttpErrorResponse
} from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { RestaurantContextService } from '../services/restaurant-context.service';
import { environment } from '../../../environments/environment';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  constructor(
    private authService: AuthService,
    private restaurantContext: RestaurantContextService
  ) { }

  intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    const isAuthEndpoint = request.url.includes('/auth/signin') || request.url.includes('/auth/login');

    // Rule: Without login, user cannot call any protected backend API
    if (!isAuthEndpoint && request.url.includes('/api/')) {
      if (!this.authService.isLoggedIn()) {
        const error = new HttpErrorResponse({
          error: { message: 'Unauthorized: You must log in before calling any backend APIs.' },
          status: 401,
          statusText: 'Unauthorized'
        });
        return throwError(() => error);
      }
    }

    const token = this.authService.getToken();
    const context = this.restaurantContext.currentContext();
    const urlParam = this.restaurantContext.buildUrlParameter(token || undefined);

    let headers = request.headers;

    if (token) {
      headers = headers.set('Authorization', `Bearer ${token}`);
    }

    // Attach Peckish and backend tenant headers
    headers = headers
      .set('URL_PARAMETER', urlParam)
      .set('x-client-id', environment.clientId)
      .set('x-client-secret', environment.clientSecret);

    // Attach entityId and branchId query params if not already attached
    let params = request.params;
    if (!params.has('entityId') && context.entityId) {
      params = params.set('entityId', context.entityId.toString());
    }
    if (!params.has('branchId') && context.branchId) {
      params = params.set('branchId', context.branchId.toString());
    }
    if (!params.has('URL_PARAMETER')) {
      params = params.set('URL_PARAMETER', urlParam);
    }

    const modifiedReq = request.clone({
      headers,
      params
    });

    return next.handle(modifiedReq);
  }
}
