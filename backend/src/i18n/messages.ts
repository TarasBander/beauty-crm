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
  },
  en: {
    'auth.invalidCredentials': 'Invalid email or password',
    'auth.invalidCurrentPassword': 'Current password is incorrect',
    'users.notFound': 'User not found',
    'users.alreadyExists': 'A user with this email already exists',
    'clients.notFound': 'Client not found',
  },
} as const satisfies Record<Lang, Record<string, string>>;

export type MessageKey = keyof (typeof MESSAGES)['uk'];

export function translate(lang: Lang, key: MessageKey): string {
  return MESSAGES[lang][key] ?? MESSAGES.uk[key] ?? key;
}
