import {
  request,
  toQueryString,
  type PaginatedResult,
  type PaginationParams,
} from '../../shared/api/http';
import type { PublicUser } from '../../shared/api/types';

export interface ApiKey {
  id: string;
  name: string;
  keyPrefix: string;
  revoked: boolean;
  lastUsedAt: string | null;
  createdBy: PublicUser;
  createdById: string;
  createdAt: string;
}

export interface CreateApiKeyResponse extends ApiKey {
  rawKey: string;
}

export const apiKeyKeys = {
  all: ['apiKeys'] as const,
  lists: () => [...apiKeyKeys.all, 'list'] as const,
  list: (params: PaginationParams) => [...apiKeyKeys.lists(), params] as const,
};

export const apiKeysApi = {
  list: (token: string, params: PaginationParams = {}) =>
    request<PaginatedResult<ApiKey>>(`/api-keys${toQueryString(params)}`, { token }),

  create: (token: string, name: string) =>
    request<CreateApiKeyResponse>('/api-keys', {
      method: 'POST',
      token,
      body: { name },
    }),

  revoke: (token: string, id: string) =>
    request<ApiKey>(`/api-keys/${id}/revoke`, {
      method: 'PATCH',
      token,
    }),
};
