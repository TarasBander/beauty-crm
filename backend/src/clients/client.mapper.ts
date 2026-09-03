import { toPublicUser } from '../users/user.mapper.js';
import type { Client } from './entities/client.entity.js';

/**
 * `Client.assignedTo`/`createdBy` are eager-loaded User relations, which
 * means they carry `passwordHash` straight off the entity — same leak
 * `users/user.mapper.ts` guards against for User responses. Strip it here
 * before a Client ever reaches an HTTP response.
 */
export function toPublicClient(client: Client) {
  return {
    ...client,
    assignedTo: client.assignedTo ? toPublicUser(client.assignedTo) : null,
    createdBy: client.createdBy ? toPublicUser(client.createdBy) : null,
  };
}
