import { BadRequestException } from '@nestjs/common';
import type { ValidationError } from 'class-validator';
import type { ValidationIssue } from '../i18n/validation-messages.js';

/**
 * class-validator's default constraint messages ("password must be longer
 * than or equal to 8 characters") are English-only and not meant for end
 * users of a localized app. We can't translate them here — Nest's
 * ValidationPipe exceptionFactory has no access to the request, so no
 * Accept-Language header — so this only extracts the structured bits
 * (which field, which constraint, which numeric argument) and leaves the
 * actual wording to I18nExceptionFilter, which does see the request.
 */
function extractArgs(constraint: string, defaultMessage: string): string[] {
  if (constraint === 'minLength') {
    const match = defaultMessage.match(/(\d+)/);
    return match ? [match[1]] : [];
  }
  return [];
}

function flatten(errors: ValidationError[], parentPath = ''): ValidationIssue[] {
  return errors.flatMap((error) => {
    const path = parentPath ? `${parentPath}.${error.property}` : error.property;

    const own: ValidationIssue[] = error.constraints
      ? Object.entries(error.constraints).map(([constraint, message]) => ({
          property: path,
          constraint,
          args: extractArgs(constraint, message),
        }))
      : [];

    const nested = error.children?.length ? flatten(error.children, path) : [];

    return [...own, ...nested];
  });
}

export function validationExceptionFactory(errors: ValidationError[]) {
  const validationIssues = flatten(errors);

  return new BadRequestException({
    statusCode: 400,
    error: 'Bad Request',
    validationIssues,
    // Fallback only — normal responses go through I18nExceptionFilter,
    // which replaces this with translated text before it reaches a client.
    message: validationIssues.map((issue) => `${issue.property}: ${issue.constraint}`),
  });
}
