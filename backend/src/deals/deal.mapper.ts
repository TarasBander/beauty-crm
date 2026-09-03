import { toPublicClient } from '../clients/client.mapper.js';
import { toPublicUser } from '../users/user.mapper.js';
import type { Deal } from './entities/deal.entity.js';

/**
 * `Deal.assignedTo`/`createdBy` are eager User relations (passwordHash
 * leak, same as elsewhere) and `Deal.client` is an eager Client relation
 * that itself nests eager Users — sanitize both via the existing mappers
 * rather than duplicating the stripping logic here.
 */
export function toPublicDeal(deal: Deal) {
  return {
    ...deal,
    client: toPublicClient(deal.client),
    assignedTo: deal.assignedTo ? toPublicUser(deal.assignedTo) : null,
    createdBy: deal.createdBy ? toPublicUser(deal.createdBy) : null,
  };
}
