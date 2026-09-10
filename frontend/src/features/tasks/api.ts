import {
  request,
  toQueryString,
  type PaginatedResult,
  type PaginationParams,
} from '../../shared/api/http';
import type { PublicUser } from '../../shared/api/types';
import type { Client } from '../clients/api';
import type { Deal } from '../deals/api';

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

export const taskKeys = {
  all: ['tasks'] as const,
  lists: () => [...taskKeys.all, 'list'] as const,
  list: (params: PaginationParams) => [...taskKeys.lists(), params] as const,
};

export const tasksApi = {
  list: (token: string, params: PaginationParams = {}) =>
    request<PaginatedResult<Task>>(`/tasks${toQueryString(params)}`, { token }),

  create: (token: string, dto: CreateTaskDto) =>
    request<Task>('/tasks', {
      method: 'POST',
      token,
      body: dto,
    }),

  update: (token: string, id: string, dto: UpdateTaskDto) =>
    request<Task>(`/tasks/${id}`, {
      method: 'PATCH',
      token,
      body: dto,
    }),
};
