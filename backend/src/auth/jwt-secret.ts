import type { ConfigService } from '@nestjs/config';

const DEV_SECRET = 'dev-secret-change-me';

/**
 * The one place that reads JWT_SECRET. In development a missing secret
 * falls back to the well-known dev value; in production that would let
 * anyone who has read .env.example forge an admin token, so startup
 * fails instead.
 */
export function getJwtSecret(config: ConfigService): string {
  const secret = config.get<string>('JWT_SECRET');
  const isProduction = config.get<string>('NODE_ENV') === 'production';

  if (isProduction && (!secret || secret === DEV_SECRET)) {
    throw new Error(
      'JWT_SECRET must be set to a non-default value when NODE_ENV=production',
    );
  }

  return secret || DEV_SECRET;
}
