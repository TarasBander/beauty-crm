import {
  request,
  toQueryString,
  type PaginatedResult,
  type PaginationParams,
} from '../../shared/api/http';
import type { PublicUser, Role } from '../../shared/api/types';

export interface CreateUserDto {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: Role;
}

export const userKeys = {
  all: ['users'] as const,
  lists: () => [...userKeys.all, 'list'] as const,
  list: (params: PaginationParams) => [...userKeys.lists(), params] as const,
};

export const usersApi = {
  list: (token: string, params: PaginationParams = {}) =>
    request<PaginatedResult<PublicUser>>(`/users${toQueryString(params)}`, { token }),

  create: (token: string, dto: CreateUserDto) =>
    request<PublicUser>('/users', {
      method: 'POST',
      token,
      body: dto,
    }),
};
