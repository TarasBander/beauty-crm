export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

/** The shape every paginated list endpoint in the app responds with. */
export interface PaginatedResult<T> {
  data: T[];
  meta: PaginationMeta;
}
