import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../features/auth/AuthContext'

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { user, isLoading } = useAuth()
  const { t } = useTranslation()
  const location = useLocation()

  if (isLoading) {
    return <div className="page-loading">{t('common.loading')}</div>
  }

  if (!user) {
    // Запам'ятовуємо, куди користувач намагався потрапити (глибоке
    // посилання типу /clients/abc), щоб LoginPage міг повернути його туди ж
    // після успішного входу, а не завжди на дашборд.
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }

  return <>{children}</>
}
