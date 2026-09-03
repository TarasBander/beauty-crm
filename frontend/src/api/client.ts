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

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
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

export type Role = 'admin' | 'sales_manager';

export interface PublicUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: Role;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface LoginResponse {
  accessToken: string;
  user: PublicUser;
}

export const api = {
  login: (email: string, password: string) =>
    request<LoginResponse>('/auth/login', {
      method: 'POST',
      body: { email, password },
    }),

  me: (token: string) => request<PublicUser>('/auth/me', { token }),

  listUsers: (token: string) => request<PublicUser[]>('/users', { token }),

  createUser: (
    token: string,
    dto: {
      email: string;
      password: string;
      firstName: string;
      lastName: string;
      role: Role;
    },
  ) =>
    request<PublicUser>('/users', {
      method: 'POST',
      token,
      body: dto,
    }),

  changePassword: (token: string, currentPassword: string, newPassword: string) =>
    request<{ status: string }>('/auth/change-password', {
      method: 'POST',
      token,
      body: { currentPassword, newPassword },
    }),
};
