import type { User } from './entities/user.entity.js';

export type PublicUser = Omit<User, 'passwordHash'>;

/** Strips the password hash before a User ever reaches an HTTP response. */
export function toPublicUser(user: User): PublicUser {
  const { passwordHash: _passwordHash, ...publicUser } = user;
  return publicUser;
}
