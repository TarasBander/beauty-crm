import {
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Injectable,
} from '@nestjs/common';
import type { Request } from 'express';

const WINDOW_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 10;

/**
 * Fixed-window limit on POST /auth/login per client IP, so a password
 * can't be brute-forced at full speed. In-memory on purpose: one backend
 * process is all this project runs. Behind several instances it would
 * need a shared store (Redis) instead.
 */
@Injectable()
export class LoginRateLimitGuard implements CanActivate {
  private readonly attempts = new Map<string, { count: number; resetAt: number }>();

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const key = request.ip ?? 'unknown';
    const now = Date.now();

    this.evictExpired(now);

    const entry = this.attempts.get(key);
    if (!entry) {
      this.attempts.set(key, { count: 1, resetAt: now + WINDOW_MS });
      return true;
    }

    entry.count += 1;
    if (entry.count > MAX_ATTEMPTS) {
      throw new HttpException(
        { statusCode: HttpStatus.TOO_MANY_REQUESTS, messageKey: 'auth.tooManyAttempts' },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }
    return true;
  }

  private evictExpired(now: number) {
    for (const [key, entry] of this.attempts) {
      if (entry.resetAt <= now) this.attempts.delete(key);
    }
  }
}
