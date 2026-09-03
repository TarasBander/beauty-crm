import { useTranslation } from 'react-i18next'
import { useAuth } from '../auth/AuthContext'

export function DashboardPage() {
  const { user } = useAuth()
  const { t } = useTranslation()

  return (
    <div>
      <h1>{t('dashboard.welcome', { name: user?.firstName })}</h1>
      <p className="subtitle">{t('dashboard.subtitle')}</p>
    </div>
  )
}
