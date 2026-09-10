import {
  request,
  toQueryString,
  type PaginatedResult,
  type PaginationParams,
} from '../../shared/api/http';
import type { PublicUser } from '../../shared/api/types';
import type { Deal } from '../deals/api';

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

// Фабрика ключів кешу для useQuery — той самий патерн, що й clientKeys
// у features/clients/api.ts (дивись коментар там).
export const paymentKeys = {
  all: ['payments'] as const,
  lists: () => [...paymentKeys.all, 'list'] as const,
  list: (params: PaginationParams) => [...paymentKeys.lists(), params] as const,
};

export const paymentsApi = {
  list: (token: string, params: PaginationParams = {}) =>
    request<PaginatedResult<Payment>>(`/payments${toQueryString(params)}`, { token }),

  create: (token: string, dto: CreatePaymentDto) =>
    request<Payment>('/payments', {
      method: 'POST',
      token,
      body: dto,
    }),

  update: (token: string, id: string, dto: UpdatePaymentDto) =>
    request<Payment>(`/payments/${id}`, {
      method: 'PATCH',
      token,
      body: dto,
    }),
};
