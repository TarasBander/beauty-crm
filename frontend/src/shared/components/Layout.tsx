import { useState, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { NavLink } from 'react-router-dom'
import { useAuth } from '../../features/auth/AuthContext'
import { LanguageSwitcher } from './LanguageSwitcher'

const NAV_ITEMS: { to: string; end?: boolean; labelKey: string }[] = [
  { to: '/', end: true, labelKey: 'nav.dashboard' },
  { to: '/clients', labelKey: 'nav.clients' },
  { to: '/deals', labelKey: 'nav.deals' },
  { to: '/tasks', labelKey: 'nav.tasks' },
  { to: '/payments', labelKey: 'nav.payments' },
  { to: '/analytics', labelKey: 'nav.analytics' },
  { to: '/users', labelKey: 'nav.users' },
  { to: '/integrations', labelKey: 'nav.integrations' },
]

export function Layout({ children }: { children: ReactNode }) {
  const { user, logout } = useAuth()
  const { t } = useTranslation()
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false)

  const closeMobileNav = () => setIsMobileNavOpen(false)

  return (
    <div className="layout">
      <header className="topbar">
        <div className="topbar-row">
          <div className="brand">{t('app.name')}</div>

          <nav className="nav nav-desktop">
            {NAV_ITEMS.map((item) => (
              <NavLink key={item.to} to={item.to} end={item.end}>
                {t(item.labelKey)}
              </NavLink>
            ))}
          </nav>

          <div className="lang-switcher-desktop">
            <LanguageSwitcher />
          </div>

          {user && (
            <div className="user-menu user-menu-desktop">
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

          <button
            type="button"
            className="burger-button"
            aria-label={t('nav.menu')}
            aria-expanded={isMobileNavOpen}
            onClick={() => setIsMobileNavOpen((open) => !open)}
          >
            {isMobileNavOpen ? '✕' : '☰'}
          </button>
        </div>

        <div className={`mobile-nav-panel ${isMobileNavOpen ? 'open' : ''}`}>
          <nav className="nav nav-mobile">
            {NAV_ITEMS.map((item) => (
              <NavLink key={item.to} to={item.to} end={item.end} onClick={closeMobileNav}>
                {t(item.labelKey)}
              </NavLink>
            ))}
          </nav>

          <LanguageSwitcher />

          {user && (
            <div className="user-menu user-menu-mobile">
              <span>
                {user.firstName} {user.lastName}{' '}
                <span className="role-badge">{t(`roles.${user.role}`)}</span>
              </span>
              <NavLink to="/change-password" className="text-link" onClick={closeMobileNav}>
                {t('nav.changePassword')}
              </NavLink>
              <button
                type="button"
                onClick={() => {
                  closeMobileNav()
                  logout()
                }}
              >
                {t('nav.logout')}
              </button>
            </div>
          )}
        </div>
      </header>
      <main className="content">{children}</main>
    </div>
  )
}
