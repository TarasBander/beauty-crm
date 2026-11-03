import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { UsersService } from '../../users/users.service.js';
import type {
  AuthenticatedUser,
  JwtPayload,
} from '../jwt-payload.interface.js';
import { getJwtSecret } from '../jwt-secret.js';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    config: ConfigService,
    private readonly usersService: UsersService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: getJwtSecret(config),
    });
  }

  // A valid signature only proves the token was issued once. Re-read the
  // user on every request so a deactivated account (or a demoted role)
  // takes effect immediately instead of when the token expires.
  async validate(payload: JwtPayload): Promise<AuthenticatedUser> {
    const user = await this.usersService.findByIdOrNull(payload.sub);
    if (!user || !user.isActive) {
      throw new UnauthorizedException();
    }

    return {
      userId: user.id,
      email: user.email,
      role: user.role,
    };
  }
}
