import { useTranslation } from 'react-i18next'
import { setLanguage, SUPPORTED_LANGUAGES, type Language } from '../../i18n'

const LABELS: Record<Language, string> = {
  uk: 'UK',
  en: 'EN',
}

export function LanguageSwitcher() {
  const { i18n } = useTranslation()

  return (
    <div className="lang-switcher" role="group" aria-label="Language">
      {SUPPORTED_LANGUAGES.map((lang) => (
        <button
          key={lang}
          type="button"
          className={i18n.language === lang ? 'active' : ''}
          onClick={() => setLanguage(lang)}
        >
          {LABELS[lang]}
        </button>
      ))}
    </div>
  )
}
