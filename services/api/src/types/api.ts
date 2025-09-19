export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
  errors?: Record<string, string[]>;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface ApiError {
  message: string;
  statusCode: number;
  error?: string;
  errors?: Record<string, string[]>;
}

export class CustomError extends Error {
  statusCode: number;
  errors?: Record<string, string[]> | undefined;

  constructor(message: string, statusCode: number = 500, errors?: Record<string, string[]> | undefined) {
    super(message);
    this.statusCode = statusCode;
    this.errors = errors;
    this.name = 'CustomError';
  }
}