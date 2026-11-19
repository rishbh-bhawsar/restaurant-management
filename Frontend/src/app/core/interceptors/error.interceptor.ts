import { Injectable } from '@angular/core';
import {
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpInterceptor,
  HttpErrorResponse
} from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { AuthService } from '../services/auth.service';
import { ToasterService } from '../services/toaster.service';
import { parseHttpError } from '../api/api-error-handler';

@Injectable()
export class ErrorInterceptor implements HttpInterceptor {
  constructor(
    private authService: AuthService,
    private toaster: ToasterService
  ) {}

  intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    return next.handle(request).pipe(
      catchError((error: HttpErrorResponse) => {
        const parsed = parseHttpError(error);

        // Handle 401 Unauthorized or 403 Forbidden: logout and redirect to login
        if (parsed.status === 401 || parsed.status === 403) {
          const reason = parsed.status === 401
            ? 'Session expired or invalid authentication (401). Logged out.'
            : 'Access denied: You do not have permissions for this resource (403).';
          
          this.authService.logout(reason);
        } else if (parsed.status === 404) {
          // 404 record not found
          this.toaster.warning(parsed.message, 'Record Not Found (404)');
        } else {
          // All other errors shown in toaster message with clear explanation
          this.toaster.error(parsed.message, `API Error (${parsed.status || 'Network'})`);
        }

        return throwError(() => parsed);
      })
    );
  }
}
