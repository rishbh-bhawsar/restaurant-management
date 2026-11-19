import { HttpErrorResponse } from '@angular/common/http';

export interface ParsedApiError {
  status: number;
  message: string;
  details?: any;
  isAuthError: boolean;
  isNotFound: boolean;
}

export function parseHttpError(error: HttpErrorResponse): ParsedApiError {
  let message = 'An unexpected server error occurred. Please try again.';
  const status = error.status || 0;
  let details: any = null;

  if (error.error) {
    if (typeof error.error === 'string') {
      message = error.error;
    } else if (error.error.message) {
      message = error.error.message;
      details = error.error.error || error.error.details;
    } else if (error.error.error) {
      message = typeof error.error.error === 'string' ? error.error.error : JSON.stringify(error.error.error);
    }
  } else if (error.message) {
    message = error.message;
  }

  // Provide clear user-friendly fallbacks based on HTTP status
  switch (status) {
    case 0:
      message = 'Unable to connect to RestoFlow backend server. Please verify backend is running on port 5000.';
      break;
    case 400:
      message = message || 'Invalid request parameters. Please verify input.';
      break;
    case 401:
      message = 'Unauthorized: Invalid credentials or session expired. Redirecting to login.';
      break;
    case 403:
      message = 'Access forbidden: You do not have permission to perform this action.';
      break;
    case 404:
      message = message || 'Requested record or endpoint not found (404).';
      break;
    case 409:
      message = message || 'Conflict: Record already exists.';
      break;
    case 422:
      message = message || 'Validation failed. Please check submitted data.';
      break;
    case 500:
      message = message || 'Internal Server Error occurred in the backend.';
      break;
    case 502:
    case 503:
    case 504:
      message = 'Backend service is temporarily unavailable. Please try again shortly.';
      break;
  }

  return {
    status,
    message,
    details,
    isAuthError: status === 401 || status === 403,
    isNotFound: status === 404
  };
}
