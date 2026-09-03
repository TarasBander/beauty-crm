export type Lang = 'uk' | 'en';

const SUPPORTED: Lang[] = ['uk', 'en'];
const DEFAULT_LANG: Lang = 'uk';

/**
 * Picks a supported language from an `Accept-Language` header, e.g.
 * "en-US,en;q=0.9,uk;q=0.8" -> "en". Falls back to Ukrainian — the app's
 * default — when the header is missing or names nothing we support.
 */
export function resolveLanguage(acceptLanguage?: string | null): Lang {
  if (!acceptLanguage) return DEFAULT_LANG;

  const candidates = acceptLanguage
    .split(',')
    .map((part) => part.split(';')[0]?.trim().slice(0, 2).toLowerCase());

  const match = candidates.find((lang): lang is Lang =>
    SUPPORTED.includes(lang as Lang),
  );

  return match ?? DEFAULT_LANG;
}
