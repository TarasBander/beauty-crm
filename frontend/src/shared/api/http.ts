import i18n from '../../i18n';

// In dev this only worked because vite.config.ts proxies `/api` to the
// backend — a production build has no such proxy unless the deploy sets
// one up itself (same-origin reverse proxy, nginx location block etc.).
// VITE_API_BASE lets a build point straight at a different origin
// (e.g. https://api.example.com) when that's not the case; unset, it
// keeps today's behavior exactly (`/api`, same origin, dev proxy or a
// prod reverse proxy handles the rest).
const API_BASE = import.meta.env.VITE_API_BASE ?? '/api';

export class ApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

/**
 * Той самий `err instanceof ApiError ? err.message : fallback`, який
 * інакше довелось би повторювати в кожному catch (mutation чи export) —
 * ApiError несе текст від бекенду (напр. валідація), будь-що інше
 * (мережа впала, JS-помилка) отримує загальний fallback-текст сторінки.
 */
export function messageFrom(error: unknown, fallback: string): string {
  return error instanceof ApiError ? error.message : fallback;
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

// --- Сесія протухла ----------------------------------------------------
//
// JWT живе добу. Коли він протухає (чи бекенд його інакше відкликав),
// про це дізнається перший-ліпший запит, який трапиться далі — таблиця
// клієнтів, збереження угоди, що завгодно. Замість того, щоб кожен
// useQuery/useMutation у застосунку окремо перевіряв "а може це 401,
// може мене розлогінило", request() нижче ловить це в одному місці й
// сповіщає AuthProvider через цей колбек. AuthProvider (AuthContext.tsx)
// реєструє його при монтуванні: чистить кеш React Query і веде
// користувача на /login через React Router, не перезавантажуючи сторінку.
type UnauthorizedHandler = () => void;
let unauthorizedHandler: UnauthorizedHandler | null = null;

export function setUnauthorizedHandler(handler: UnauthorizedHandler | null) {
  unauthorizedHandler = handler;
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

  const res = await fetch(`${API_BASE}${path}`, {
    method: options.method ?? 'GET',
    headers,
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
  });

  if (!res.ok) {
    // 401 на запиті, який ніс токен, означає не "ця операція не
    // вдалась", а "сесія мертва" — бекенд відхилив сам токен, а не
    // облікові дані. (Невдалий логін теж повертає 401, але без токена в
    // заголовку — той випадок сюди не потрапляє і лишається звичайною
    // помилкою форми входу.) Тут ми один раз чистимо збережений токен і
    // віддаємо керування AuthProvider — решта коду нижче все одно кине
    // ApiError, тож сторінка, що ініціювала запит, теж дізнається, що
    // він не вдався.
    if (res.status === 401 && options.token) {
      setStoredToken(null);
      unauthorizedHandler?.();
    }

    const payload = await res.json().catch(() => null);
    // NestJS's ValidationPipe sends `message` as a string[] when several
    // fields fail at once (e.g. ["phone must be...", "email must be..."]).
    // The old code called `.toString?.()` on it BEFORE checking
    // Array.isArray — Array.prototype.toString already joins with a bare
    // comma, no space, so by the time Array.isArray ran, `message` was
    // already a string and that check (and its `.join(', ')`) was dead
    // code. Caught by http.test.ts's array-message case.
    const rawMessage: unknown = payload?.message ?? payload?.error;
    const message = Array.isArray(rawMessage)
      ? rawMessage.join(', ')
      : (rawMessage != null ? String(rawMessage) : `HTTP ${res.status}`);
    throw new ApiError(res.status, message);
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
  // Generic free-text search, forwarded as `?search=` — ignored by
  // endpoints that don't implement it (see backend's
  // PaginationQueryDto). Used by SearchSelect (shared/components/
  // SearchSelect.tsx) to query the server instead of filtering a
  // capped, already-downloaded list.
  search?: string;
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

export interface FetchAllPagesResult<T> {
  rows: T[];
  // true when the walk stopped because it hit maxPages, not because it
  // ran out of pages — i.e. `rows` is NOT every row the table has.
  truncated: boolean;
  // The server's own count of the total, even when truncated — lets a
  // caller say "exported 5000 of 8300 rows" instead of just "some rows
  // are missing".
  total: number;
}

/**
 * Walks every page of a paginated endpoint and concatenates the rows —
 * used for CSV export, where "export" has to mean the whole table, not
 * whatever page happens to be on screen. `maxPages` is a hard safety
 * cap (default 50 pages, i.e. 5000 rows at SELECT_PAGE_SIZE) so a
 * runaway table can't turn one click into an unbounded number of
 * requests.
 *
 * Hitting that cap used to mean the returned array was just quietly
 * short — same bug as the `useAllX` hooks, just for CSV export instead
 * of a dropdown. `truncated` makes that an explicit, checkable fact
 * instead of a silent one; callers are expected to warn the user when
 * it's true rather than hand them a "complete" export that isn't.
 */
export async function fetchAllPages<T>(
  fetchPage: (params: PaginationParams) => Promise<PaginatedResult<T>>,
  options: { limit?: number; maxPages?: number } = {},
): Promise<FetchAllPagesResult<T>> {
  const limit = options.limit ?? SELECT_PAGE_SIZE;
  const maxPages = options.maxPages ?? 50;
  const all: T[] = [];
  let page = 1;
  let total = 0;
  let truncated = false;
  while (page <= maxPages) {
    const result = await fetchPage({ page, limit });
    all.push(...result.data);
    total = result.meta.total;
    if (page >= result.meta.totalPages) break;
    if (page === maxPages) {
      truncated = true;
      break;
    }
    page += 1;
  }
  return { rows: all, truncated, total };
}
