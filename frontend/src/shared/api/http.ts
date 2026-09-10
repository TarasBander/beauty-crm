import i18n from '../../i18n';

export class ApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

const TOKEN_STORAGE_KEY = 'crm.accessToken';

export function getStoredToken(): string | null {
  return localStorage.getItem(TOKEN_STORAGE_KEY);
}

export function setStoredToken(token: string | null) {
  if (token) {
    localStorage.setItem(TOKEN_STORAGE_KEY, token);
  } else {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
  }
}

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PATCH' | 'DELETE';
  body?: unknown;
  token?: string | null;
}

export async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    // lets the backend translate error messages into the UI's current
    // language (see backend/src/common/filters/i18n-exception.filter.ts)
    'Accept-Language': i18n.language ?? 'uk',
  };

  if (options.token) {
    headers.Authorization = `Bearer ${options.token}`;
  }

  const res = await fetch(`/api${path}`, {
    method: options.method ?? 'GET',
    headers,
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
  });

  if (!res.ok) {
    const payload = await res.json().catch(() => null);
    const message =
      (payload && (payload.message?.toString?.() ?? payload.error)) ??
      `HTTP ${res.status}`;
    throw new ApiError(res.status, Array.isArray(message) ? message.join(', ') : message);
  }

  if (res.status === 204) {
    return undefined as T;
  }

  return res.json() as Promise<T>;
}

// --- Pagination -------------------------------------------------------
//
// Every list endpoint in the backend responds `{ data, meta }` (see
// backend/src/common/pagination.util.ts) — these types and the query
// builder below are shared by every feature's api.ts so paginated
// fetches all look and behave the same way.

export const DEFAULT_PAGE_SIZE = 20;
// Matches backend/src/common/dto/pagination-query.dto.ts's MAX_PAGE_SIZE
// — used by hooks that need "practically everything" (dropdown options)
// without adding a second, unpaginated endpoint per resource.
export const SELECT_PAGE_SIZE = 100;

export interface PaginationParams {
  page?: number;
  limit?: number;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface PaginatedResult<T> {
  data: T[];
  meta: PaginationMeta;
}

/** Builds a `?page=1&limit=20`-style query string, omitting empty params. */
export function toQueryString(params: PaginationParams): string {
  const usp = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== '') usp.set(key, String(value));
  }
  const qs = usp.toString();
  return qs ? `?${qs}` : '';
}

/**
 * Walks every page of a paginated endpoint and concatenates the rows —
 * used for CSV export, where "export" has to mean the whole table, not
 * whatever page happens to be on screen. `maxPages` is a hard safety
 * cap (default 5000 rows) so a runaway table can't turn one click into
 * an unbounded number of requests.
 */
export async function fetchAllPages<T>(
  fetchPage: (params: PaginationParams) => Promise<PaginatedResult<T>>,
  options: { limit?: number; maxPages?: number } = {},
): Promise<T[]> {
  const limit = options.limit ?? SELECT_PAGE_SIZE;
  const maxPages = options.maxPages ?? 50;
  const all: T[] = [];
  let page = 1;
  while (page <= maxPages) {
    const result = await fetchPage({ page, limit });
    all.push(...result.data);
    if (page >= result.meta.totalPages) break;
    page += 1;
  }
  return all;
}
