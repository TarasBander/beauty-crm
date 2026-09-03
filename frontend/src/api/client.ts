import i18n from '../i18n';

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

export interface Client {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
  email: string | null;
  salonName: string | null;
  position: string | null;
  address: string | null;
  notes: string | null;
  assignedTo: PublicUser | null;
  createdBy: PublicUser | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateClientDto {
  firstName: string;
  lastName: string;
  phone: string;
  email?: string;
  salonName?: string;
  position?: string;
  address?: string;
  notes?: string;
  assignedToId?: string;
}

export type UpdateClientDto = Partial<CreateClientDto>;

export type DealStage = 'new' | 'contacted' | 'proposal' | 'negotiation' | 'won' | 'lost';

export const DEAL_STAGE_ORDER: DealStage[] = [
  'new',
  'contacted',
  'proposal',
  'negotiation',
  'won',
  'lost',
];

export interface Deal {
  id: string;
  title: string;
  amount: number;
  stage: DealStage;
  client: Client;
  assignedTo: PublicUser | null;
  createdBy: PublicUser | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateDealDto {
  title: string;
  amount: number;
  clientId: string;
  stage?: DealStage;
  assignedToId?: string;
  notes?: string;
}

export type UpdateDealDto = Partial<CreateDealDto>;

export type TaskStatus = 'pending' | 'done';

export interface Task {
  id: string;
  title: string;
  description: string | null;
  dueDate: string | null;
  status: TaskStatus;
  client: Client | null;
  deal: Deal | null;
  assignedTo: PublicUser | null;
  createdBy: PublicUser | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTaskDto {
  title: string;
  description?: string;
  dueDate?: string;
  status?: TaskStatus;
  clientId?: string;
  dealId?: string;
  assignedToId?: string;
}

export type UpdateTaskDto = Partial<CreateTaskDto>;

export type PaymentMethod = 'cash' | 'card' | 'bank_transfer';
export type PaymentStatus = 'pending' | 'paid' | 'cancelled';

export interface Payment {
  id: string;
  deal: Deal;
  amount: number;
  method: PaymentMethod;
  status: PaymentStatus;
  paidAt: string | null;
  notes: string | null;
  createdBy: PublicUser | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePaymentDto {
  dealId: string;
  amount: number;
  method: PaymentMethod;
  status?: PaymentStatus;
  paidAt?: string;
  notes?: string;
}

export type UpdatePaymentDto = Partial<CreatePaymentDto>;

export interface DealStageStat {
  stage: DealStage;
  count: number;
  amount: number;
}

export interface AnalyticsDashboard {
  clients: { total: number };
  deals: {
    totalCount: number;
    byStage: DealStageStat[];
    wonAmount: number;
    wonCount: number;
    lostCount: number;
    activeAmount: number;
    activeCount: number;
    conversionRate: number;
  };
  tasks: {
    total: number;
    pending: number;
    done: number;
    overdue: number;
  };
  payments: {
    totalPaid: number;
    totalPending: number;
    byMethod: { method: PaymentMethod; amount: number }[];
  };
  revenueByMonth: { month: string; amount: number }[];
  topClients: {
    clientId: string;
    firstName: string;
    lastName: string;
    salonName: string | null;
    amount: number;
  }[];
  managerPerformance: {
    managerId: string;
    firstName: string;
    lastName: string;
    dealsWon: number;
    revenue: number;
  }[];
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

  listClients: (token: string) => request<Client[]>('/clients', { token }),

  getClient: (token: string, id: string) => request<Client>(`/clients/${id}`, { token }),

  createClient: (token: string, dto: CreateClientDto) =>
    request<Client>('/clients', {
      method: 'POST',
      token,
      body: dto,
    }),

  updateClient: (token: string, id: string, dto: UpdateClientDto) =>
    request<Client>(`/clients/${id}`, {
      method: 'PATCH',
      token,
      body: dto,
    }),

  listDeals: (token: string) => request<Deal[]>('/deals', { token }),

  createDeal: (token: string, dto: CreateDealDto) =>
    request<Deal>('/deals', {
      method: 'POST',
      token,
      body: dto,
    }),

  updateDeal: (token: string, id: string, dto: UpdateDealDto) =>
    request<Deal>(`/deals/${id}`, {
      method: 'PATCH',
      token,
      body: dto,
    }),

  listTasks: (token: string) => request<Task[]>('/tasks', { token }),

  createTask: (token: string, dto: CreateTaskDto) =>
    request<Task>('/tasks', {
      method: 'POST',
      token,
      body: dto,
    }),

  updateTask: (token: string, id: string, dto: UpdateTaskDto) =>
    request<Task>(`/tasks/${id}`, {
      method: 'PATCH',
      token,
      body: dto,
    }),

  listPayments: (token: string) => request<Payment[]>('/payments', { token }),

  createPayment: (token: string, dto: CreatePaymentDto) =>
    request<Payment>('/payments', {
      method: 'POST',
      token,
      body: dto,
    }),

  updatePayment: (token: string, id: string, dto: UpdatePaymentDto) =>
    request<Payment>(`/payments/${id}`, {
      method: 'PATCH',
      token,
      body: dto,
    }),

  getAnalyticsDashboard: (token: string) =>
    request<AnalyticsDashboard>('/analytics/dashboard', { token }),
};
