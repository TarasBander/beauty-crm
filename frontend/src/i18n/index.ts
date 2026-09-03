import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import en from './locales/en.json'
import uk from './locales/uk.json'

export const LANG_STORAGE_KEY = 'crm.lang'
export const SUPPORTED_LANGUAGES = ['uk', 'en'] as const
export type Language = (typeof SUPPORTED_LANGUAGES)[number]

function getStoredLanguage(): Language {
  try {
    const stored = localStorage.getItem(LANG_STORAGE_KEY)
    if (stored === 'uk' || stored === 'en') return stored
  } catch {
    // localStorage unavailable — fall through to default
  }
  return 'uk'
}

export function setLanguage(lang: Language) {
  i18n.changeLanguage(lang)
  try {
    localStorage.setItem(LANG_STORAGE_KEY, lang)
  } catch {
    // ignore — language just won't persist across reloads
  }
}

i18n.use(initReactI18next).init({
  resources: {
    uk: { translation: uk },
    en: { translation: en },
  },
  lng: getStoredLanguage(),
  fallbackLng: 'uk',
  interpolation: {
    escapeValue: false, // React already escapes values
  },
})

export default i18n
