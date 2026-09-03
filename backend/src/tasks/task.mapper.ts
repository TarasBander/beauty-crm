import { toPublicClient } from '../clients/client.mapper.js';
import { toPublicDeal } from '../deals/deal.mapper.js';
import { toPublicUser } from '../users/user.mapper.js';
import type { Task } from './entities/task.entity.js';

/**
 * `Task.client`/`deal` are eager relations that themselves nest eager
 * Users (and, for `deal`, an eager Client too) — reuse the existing
 * mappers rather than duplicating the passwordHash-stripping logic.
 */
export function toPublicTask(task: Task) {
  return {
    ...task,
    client: task.client ? toPublicClient(task.client) : null,
    deal: task.deal ? toPublicDeal(task.deal) : null,
    assignedTo: task.assignedTo ? toPublicUser(task.assignedTo) : null,
    createdBy: task.createdBy ? toPublicUser(task.createdBy) : null,
  };
}
