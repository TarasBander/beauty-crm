import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ApiKeysService } from '../api-keys/api-keys.service.js';

/**
 * Guards the public /integrations/v1 surface with an `X-API-Key` header
 * instead of the JWT used everywhere else in the app — an external
 * system integrating with the CRM authenticates with a long-lived key
 * (see ApiKeysService), not a user login.
 */
@Injectable()
export class ApiKeyGuard implements CanActivate {
  constructor(private readonly apiKeysService: ApiKeysService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const rawKey = request.headers['x-api-key'];

    if (!rawKey || typeof rawKey !== 'string') {
      throw new UnauthorizedException({ messageKey: 'integrations.missingApiKey' });
    }

    const apiKey = await this.apiKeysService.validateKey(rawKey);
    if (!apiKey) {
      throw new UnauthorizedException({ messageKey: 'integrations.invalidApiKey' });
    }

    request.apiKey = apiKey;
    return true;
  }
}
