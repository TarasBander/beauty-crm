import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { NavLink } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { LanguageSwitcher } from './LanguageSwitcher'

export function Layout({ children }: { children: ReactNode }) {
  const { user, logout } = useAuth()
  const { t } = useTranslation()

  return (
    <div className="layout">
      <header className="topbar">
        <div className="brand">{t('app.name')}</div>
        <nav className="nav">
          <NavLink to="/" end>
            {t('nav.dashboard')}
          </NavLink>
          <NavLink to="/clients">{t('nav.clients')}</NavLink>
          <NavLink to="/deals">{t('nav.deals')}</NavLink>
          <NavLink to="/tasks">{t('nav.tasks')}</NavLink>
          <NavLink to="/payments">{t('nav.payments')}</NavLink>
          <NavLink to="/users">{t('nav.users')}</NavLink>
        </nav>
        <LanguageSwitcher />
        {user && (
          <div className="user-menu">
            <span>
              {user.firstName} {user.lastName}{' '}
              <span className="role-badge">{t(`roles.${user.role}`)}</span>
            </span>
            <NavLink to="/change-password" className="text-link">
              {t('nav.changePassword')}
            </NavLink>
            <button type="button" onClick={logout}>
              {t('nav.logout')}
            </button>
          </div>
        )}
      </header>
      <main className="content">{children}</main>
    </div>
  )
}
