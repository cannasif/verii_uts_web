export interface ApiResponse<T> {
  success: boolean;
  message: string;
  errors: string[];
  data: T;
}

export interface PaginationMeta {
  pageNumber: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
}

export interface PagedApiResponse<T> {
  success: boolean;
  message: string;
  errors: string[];
  data: T[];
  pagination: PaginationMeta;
}

export interface FilterRule {
  column: string;
  operator: string;
  value: string;
}

export interface PagedRequest {
  pageNumber: number;
  pageSize: number;
  search?: string;
  sortBy?: string;
  sortDirection?: 'asc' | 'desc';
  filterLogic?: 'and' | 'or';
  filters?: FilterRule[];
}
