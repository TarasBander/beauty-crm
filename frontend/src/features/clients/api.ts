import {
  request,
  toQueryString,
  type PaginatedResult,
  type PaginationParams,
} from '../../shared/api/http';
import type { PublicUser } from '../../shared/api/types';

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

export const clientKeys = {
  all: ['clients'] as const,
  lists: () => [...clientKeys.all, 'list'] as const,
  list: (params: PaginationParams) => [...clientKeys.lists(), params] as const,
  details: () => [...clientKeys.all, 'detail'] as const,
  detail: (id: string) => [...clientKeys.details(), id] as const,
};

export const clientsApi = {
  list: (token: string, params: PaginationParams = {}) =>
    request<PaginatedResult<Client>>(`/clients${toQueryString(params)}`, { token }),

  get: (token: string, id: string) => request<Client>(`/clients/${id}`, { token }),

  create: (token: string, dto: CreateClientDto) =>
    request<Client>('/clients', {
      method: 'POST',
      token,
      body: dto,
    }),

  update: (token: string, id: string, dto: UpdateClientDto) =>
    request<Client>(`/clients/${id}`, {
      method: 'PATCH',
      token,
      body: dto,
    }),
};
