import { useTranslation } from 'react-i18next'
import { toggleTheme, useTheme } from '../theme/theme'
import { Icon } from './Icon'

interface ThemeToggleProps {
  /** Показати підпис поруч з іконкою (у бічному меню), а не лише іконку. */
  showLabel?: boolean
}

export function ThemeToggle({ showLabel = false }: ThemeToggleProps) {
  const theme = useTheme()
  const { t } = useTranslation()
  const isDark = theme === 'dark'
  // Підпис описує дію, а не поточний стан: "Темна тема" в світлій темі.
  const label = isDark ? t('theme.switchToLight') : t('theme.switchToDark')

  return (
    <button
      type="button"
      className={showLabel ? 'theme-toggle theme-toggle--labeled' : 'theme-toggle'}
      onClick={toggleTheme}
      aria-label={showLabel ? undefined : label}
      title={label}
    >
      <Icon name={isDark ? 'sun' : 'moon'} />
      {showLabel && <span>{label}</span>}
    </button>
  )
}
