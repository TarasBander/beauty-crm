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

// Фабрика ключів кешу для useQuery/useQueryClient (queryKey). Кожен
// useQuery({ queryKey: ... }) у hooks.ts кешується під своїм ключем із
// цього дерева, і саме за цими ключами queryClient.invalidateQueries()
// та queryClient.setQueryData() знаходять, які записи кешу оновити:
// - clientKeys.all           — корінь, об'єднує геть усе про клієнтів;
// - clientKeys.lists()       — усі закешовані СПИСКИ (всі сторінки/
//   фільтри одразу) — по цьому ключу invalidateQueries("протухляє" всі
//   сторінки таблиці клієнтів разом);
// - clientKeys.list(params)  — КОНКРЕТНА сторінка/фільтр (саме її читає
//   useQuery у useClients());
// - clientKeys.details()     — усі закешовані картки клієнтів разом;
// - clientKeys.detail(id)    — картка ОДНОГО клієнта (її читає useClient()
//   і саме її оновлює useUpdateClient() через setQueryData).
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
