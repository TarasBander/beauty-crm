import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { resolveLanguage } from '../../i18n/language.util.js';
import { translate, type MessageKey } from '../../i18n/messages.js';
import {
  translateValidationIssue,
  type ValidationIssue,
} from '../../i18n/validation-messages.js';

interface StructuredExceptionBody {
  statusCode?: number;
  error?: string;
  message?: string | string[];
  messageKey?: MessageKey;
  validationIssues?: ValidationIssue[];
}

/**
 * Translates every HttpException's message right before it leaves the app,
 * based on the request's Accept-Language header. Services never build
 * user-facing text themselves — they throw `{ messageKey }` (see
 * i18n/messages.ts) or let ValidationPipe produce `validationIssues` (see
 * validation-exception.factory.ts); this is the one place that turns
 * either into localized text.
 */
@Catch(HttpException)
export class I18nExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const status = exception.getStatus();
    const lang = resolveLanguage(request.headers['accept-language']);
    const body = exception.getResponse();

    if (typeof body === 'object' && body !== null) {
      const structured = body as StructuredExceptionBody;

      if (structured.validationIssues) {
        response.status(status).json({
          statusCode: structured.statusCode ?? status,
          error: structured.error ?? 'Bad Request',
          message: structured.validationIssues.map((issue) =>
            translateValidationIssue(issue, lang),
          ),
        });
        return;
      }

      if (structured.messageKey) {
        response.status(status).json({
          statusCode: structured.statusCode ?? status,
          error: structured.error,
          message: translate(lang, structured.messageKey),
        });
        return;
      }
    }

    response.status(status).json(body);
  }
}
