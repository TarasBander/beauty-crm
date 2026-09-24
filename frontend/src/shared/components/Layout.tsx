import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../../features/auth/AuthContext'
import type { Role } from '../api/types'
import { ErrorBoundary } from './ErrorBoundary'
import { FormError } from './FormError'
import { LanguageSwitcher } from './LanguageSwitcher'

// roles: undefined означає "видно всім залогіненим"; коли список заданий,
// пункт показується лише користувачам з однією з цих ролей. Це лише
// косметика — сторінка все одно захищена AdminRoute (App.tsx), а сам API
// відмовляє в діях, на які нема прав (наприклад users.controller.ts не
// дозволить менеджеру призначити роль admin) — але пункт меню, який веде
// на "Access denied", тільки заплутує.
const NAV_ITEMS: { to: string; end?: boolean; labelKey: string; roles?: Role[] }[] = [
  { to: '/', end: true, labelKey: 'nav.dashboard' },
  { to: '/clients', labelKey: 'nav.clients' },
  { to: '/deals', labelKey: 'nav.deals' },
  { to: '/tasks', labelKey: 'nav.tasks' },
  { to: '/payments', labelKey: 'nav.payments' },
  { to: '/analytics', labelKey: 'nav.analytics' },
  { to: '/users', labelKey: 'nav.users', roles: ['admin'] },
  { to: '/integrations', labelKey: 'nav.integrations', roles: ['admin'] },
]

// Rendered once by the layout route in App.tsx (wrapped in
// ProtectedRoute), with every protected page as its <Outlet /> — the
// nav/header chrome you see here is built exactly once, not per page.
export function Layout() {
  const { user, logout } = useAuth()
  const { t } = useTranslation()
  const location = useLocation()
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false)

  const closeMobileNav = () => setIsMobileNavOpen(false)

  const navItems = useMemo(
    () => NAV_ITEMS.filter((item) => !item.roles || (!!user && item.roles.includes(user.role))),
    [user],
  )

  return (
    <div className="layout">
      <header className="topbar">
        <div className="topbar-row">
          <div className="brand">{t('app.name')}</div>

          <nav className="nav nav-desktop">
            {navItems.map((item) => (
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
            aria-controls="mobile-nav-panel"
            onClick={() => setIsMobileNavOpen((open) => !open)}
          >
            {isMobileNavOpen ? '✕' : '☰'}
          </button>
        </div>

        <div id="mobile-nav-panel" className={`mobile-nav-panel ${isMobileNavOpen ? 'open' : ''}`}>
          <nav className="nav nav-mobile">
            {navItems.map((item) => (
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
      <main className="content">
        {/* key={location.pathname}: коли впала сторінка, користувач тисне
            на інший пункт меню (шапка й так лишається робочою) — новий
            key монтує ErrorBoundary заново з чистим hasError, замість
            того, щоб застрягти на fallback назавжди. */}
        <ErrorBoundary key={location.pathname} fallback={<FormError>{t('errors.pageCrashed')}</FormError>}>
          <Outlet />
        </ErrorBoundary>
      </main>
    </div>
  )
}
