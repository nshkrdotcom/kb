// frontend/src/services/api/api-error.ts
import { AxiosError } from 'axios';

export interface ApiErrorResponse {
  error: string;
  statusCode: number;
  details?: Array<{ path: string; message: string }>;
}

export class ApiError extends Error {
  public statusCode: number;
  public details?: Array<{ path: string; message: string }>;
  public isNetworkError: boolean;

  constructor(message: string, statusCode: number = 500, details?: any) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.details = details;
    this.isNetworkError = false;
  }

  static from(error: unknown): ApiError {
    if (error instanceof ApiError) return error;

    if (error instanceof AxiosError) {
      // Network error (no response)
      if (error.code === 'ECONNABORTED' || !error.response) {
        const apiError = new ApiError(
          'Network error: Unable to connect to the server',
          0
        );
        apiError.isNetworkError = true;
        return apiError;
      }

      // Server returned an error response
      const response = error.response;
      const data = response.data as ApiErrorResponse;

      return new ApiError(
        data.error || 'An unknown error occurred',
        response.status,
        data.details
      );
    }

    // Unknown error
    return new ApiError(
      error instanceof Error ? error.message : String(error),
      500
    );
  }

  getFirstDetailMessage(): string | undefined {
    return this.details && this.details.length > 0
      ? this.details[0].message
      : undefined;
  }

  toUserFriendlyMessage(): string {
    // Network error
    if (this.isNetworkError) {
      return 'Unable to connect to the server. Please check your internet connection and try again.';
    }

    // Authentication errors
    if (this.statusCode === 401) {
      return 'Your session has expired. Please sign in again.';
    }

    if (this.statusCode === 403) {
      return 'You don\'t have permission to perform this action.';
    }

    // Validation errors
    if (this.statusCode === 400) {
      const detailMessage = this.getFirstDetailMessage();
      return detailMessage || 'Please check your input and try again.';
    }

    // Not found
    if (this.statusCode === 404) {
      return 'The requested resource was not found.';
    }

    // Rate limiting
    if (this.statusCode === 429) {
      return 'Too many requests. Please try again later.';
    }

    // Server errors
    if (this.statusCode >= 500) {
      return 'The server encountered an error. Please try again later.';
    }

    // Default message
    return this.message || 'An unexpected error occurred.';
  }
}