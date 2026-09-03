import type { Lang } from './language.util.js';

/**
 * Business-error message keys. A service throws with a key (see
 * `common/exceptions`) instead of a literal string; the global
 * I18nExceptionFilter resolves the actual text from here based on the
 * request's Accept-Language header. Add a key here whenever a new
 * exception message is needed — never hardcode message text in a
 * service again.
 */
export const MESSAGES = {
  uk: {
    'auth.invalidCredentials': 'Невірний email або пароль',
    'auth.invalidCurrentPassword': 'Поточний пароль невірний',
    'users.notFound': 'Користувача не знайдено',
    'users.alreadyExists': 'Користувач з таким email вже існує',
    'clients.notFound': 'Клієнта не знайдено',
    'deals.notFound': 'Угоду не знайдено',
    'tasks.notFound': 'Задачу не знайдено',
    'payments.notFound': 'Платіж не знайдено',
    'integrations.keyNotFound': 'API-ключ не знайдено',
    'integrations.missingApiKey': "Відсутній заголовок X-API-Key",
    'integrations.invalidApiKey': 'Недійсний або відкликаний API-ключ',
  },
  en: {
    'auth.invalidCredentials': 'Invalid email or password',
    'auth.invalidCurrentPassword': 'Current password is incorrect',
    'users.notFound': 'User not found',
    'users.alreadyExists': 'A user with this email already exists',
    'clients.notFound': 'Client not found',
    'deals.notFound': 'Deal not found',
    'tasks.notFound': 'Task not found',
    'payments.notFound': 'Payment not found',
    'integrations.keyNotFound': 'API key not found',
    'integrations.missingApiKey': 'Missing X-API-Key header',
    'integrations.invalidApiKey': 'Invalid or revoked API key',
  },
} as const satisfies Record<Lang, Record<string, string>>;

export type MessageKey = keyof (typeof MESSAGES)['uk'];

export function translate(lang: Lang, key: MessageKey): string {
  return MESSAGES[lang][key] ?? MESSAGES.uk[key] ?? key;
}
