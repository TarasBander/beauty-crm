import {
  request,
  toQueryString,
  type PaginatedResult,
  type PaginationParams,
} from '../../shared/api/http';
import type { PublicUser } from '../../shared/api/types';
import type { Client } from '../clients/api';

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

/** `clientId` narrows the list to one client's deals — used by the deal
 * combobox in TaskForm, which already knows which client the task is
 * for and shouldn't offer deals belonging to someone else. */
export interface DealListParams extends PaginationParams {
  clientId?: string;
}

// Фабрика ключів кешу для useQuery — той самий патерн, що й clientKeys
// у features/clients/api.ts (дивись коментар там).
export const dealKeys = {
  all: ['deals'] as const,
  lists: () => [...dealKeys.all, 'list'] as const,
  list: (params: PaginationParams) => [...dealKeys.lists(), params] as const,
  details: () => [...dealKeys.all, 'detail'] as const,
  detail: (id: string) => [...dealKeys.details(), id] as const,
};

export const dealsApi = {
  list: (token: string, params: DealListParams = {}) =>
    request<PaginatedResult<Deal>>(`/deals${toQueryString(params)}`, { token }),

  create: (token: string, dto: CreateDealDto) =>
    request<Deal>('/deals', {
      method: 'POST',
      token,
      body: dto,
    }),

  update: (token: string, id: string, dto: UpdateDealDto) =>
    request<Deal>(`/deals/${id}`, {
      method: 'PATCH',
      token,
      body: dto,
    }),
};
