export interface ApiResponse<T> {
  ok: boolean;
  data?: T;
  error?: {
    message?: string;
    code?: string;
  };
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  limit: number;
  offset: number;
}

export interface ApiError {
  message: string;
  code?: string;
}
