import { toPublicUser } from '../users/user.mapper.js';
import type { ApiKey } from './entities/api-key.entity.js';

/**
 * Never include `keyHash` in a response — it's the one piece of data that
 * (together with the raw key) would let someone forge a valid lookup.
 * The raw key itself only ever appears in the create() response, once.
 */
export function toPublicApiKey(apiKey: ApiKey) {
  const { keyHash: _keyHash, ...rest } = apiKey;
  return {
    ...rest,
    createdBy: toPublicUser(apiKey.createdBy),
  };
}
