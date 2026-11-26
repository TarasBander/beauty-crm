import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../../features/auth/AuthContext'
import type { Role } from '../api/types'
import { BrandMark } from './BrandMark'
import { ErrorBoundary } from './ErrorBoundary'
import { FormError } from './FormError'
import { Icon, type IconName } from './Icon'
import { LanguageSwitcher } from './LanguageSwitcher'
import { ThemeToggle } from './ThemeToggle'

// roles: undefined означає "видно всім залогіненим"; коли список заданий,
// пункт показується лише користувачам з однією з цих ролей. Це лише
// косметика — сторінка все одно захищена AdminRoute (App.tsx), а сам API
// відмовляє в діях, на які нема прав (/users і /api-keys — лише admin) —
// але пункт меню, який веде на "Access denied", тільки заплутує.
const NAV_ITEMS: { to: string; end?: boolean; labelKey: string; icon: IconName; roles?: Role[] }[] = [
  { to: '/', end: true, labelKey: 'nav.dashboard', icon: 'dashboard' },
  { to: '/clients', labelKey: 'nav.clients', icon: 'clients' },
  { to: '/deals', labelKey: 'nav.deals', icon: 'deals' },
  { to: '/tasks', labelKey: 'nav.tasks', icon: 'tasks' },
  { to: '/payments', labelKey: 'nav.payments', icon: 'payments' },
  { to: '/analytics', labelKey: 'nav.analytics', icon: 'analytics' },
  { to: '/users', labelKey: 'nav.users', icon: 'users', roles: ['admin'] },
  { to: '/integrations', labelKey: 'nav.integrations', icon: 'integrations', roles: ['admin'] },
]

// Rendered once by the layout route in App.tsx (wrapped in
// ProtectedRoute), with every protected page as its <Outlet />.
//
// Одна й та сама бічна панель: на широкому екрані вона стоїть зліва
// постійно, а нижче 1024px (див. App.css) ховається за кнопку-бургер і
// виїжджає як шухляда поверх контенту.
export function Layout() {
  const { user, logout } = useAuth()
  const { t } = useTranslation()
  const location = useLocation()
  // Шлях, на якому відкрили шухляду: перехід на іншу сторінку закриває її
  // сам собою, без окремого ефекту, що скидав би стан.
  const [navOpenedAt, setNavOpenedAt] = useState<string | null>(null)
  const isNavOpen = navOpenedAt === location.pathname

  const closeNav = () => setNavOpenedAt(null)

  // Escape закриває шухляду; поки вона відкрита, сторінка під нею не
  // скролиться.
  useEffect(() => {
    if (!isNavOpen) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setNavOpenedAt(null)
    }
    document.addEventListener('keydown', onKeyDown)
    document.body.classList.add('nav-locked')
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.body.classList.remove('nav-locked')
    }
  }, [isNavOpen])

  const navItems = useMemo(
    () => NAV_ITEMS.filter((item) => !item.roles || (!!user && item.roles.includes(user.role))),
    [user],
  )

  const initials = user ? `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`.toUpperCase() : ''

  return (
    <div className="app-shell">
      <header className="mobile-topbar">
        <button
          type="button"
          className="icon-button"
          aria-label={isNavOpen ? t('nav.closeMenu') : t('nav.menu')}
          aria-expanded={isNavOpen}
          aria-controls="app-sidebar"
          onClick={() => setNavOpenedAt(isNavOpen ? null : location.pathname)}
        >
          <Icon name={isNavOpen ? 'close' : 'menu'} />
        </button>
        <div className="brand">
          <BrandMark />
          <span>{t('app.name')}</span>
        </div>
        <ThemeToggle />
      </header>

      {isNavOpen && (
        <button
          type="button"
          className="sidebar-overlay"
          aria-label={t('nav.closeMenu')}
          tabIndex={-1}
          onClick={closeNav}
        />
      )}

      <aside id="app-sidebar" className={isNavOpen ? 'sidebar open' : 'sidebar'}>
        <div className="sidebar-brand">
          <BrandMark />
          <div>
            <div className="sidebar-brand-name">{t('app.name')}</div>
            <div className="sidebar-brand-tagline">{t('app.tagline')}</div>
          </div>
        </div>

        <nav className="sidebar-nav" aria-label={t('nav.main')}>
          {navItems.map((item) => (
            <NavLink key={item.to} to={item.to} end={item.end} className="sidebar-link">
              <Icon name={item.icon} />
              <span>{t(item.labelKey)}</span>
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="sidebar-preferences">
            <ThemeToggle showLabel />
            <LanguageSwitcher />
          </div>

          {user && (
            <div className="sidebar-user">
              <div className="avatar" aria-hidden="true">
                {initials}
              </div>
              <div className="sidebar-user-info">
                <span className="sidebar-user-name">
                  {user.firstName} {user.lastName}
                </span>
                <span className="role-badge">{t(`roles.${user.role}`)}</span>
              </div>
            </div>
          )}

          {user && (
            <div className="sidebar-actions">
              <NavLink to="/change-password" className="sidebar-link sidebar-link--small">
                <Icon name="key" />
                <span>{t('nav.changePassword')}</span>
              </NavLink>
              <button type="button" className="sidebar-link sidebar-link--small" onClick={logout}>
                <Icon name="logout" />
                <span>{t('nav.logout')}</span>
              </button>
            </div>
          )}
        </div>
      </aside>

      <main className="content">
        {/* key={location.pathname}: коли впала сторінка, користувач тисне
            на інший пункт меню (меню й так лишається робочим) — новий
            key монтує ErrorBoundary заново з чистим hasError, замість
            того, щоб застрягти на fallback назавжди. */}
        <ErrorBoundary key={location.pathname} fallback={<FormError>{t('errors.pageCrashed')}</FormError>}>
          <Outlet />
        </ErrorBoundary>
      </main>
    </div>
  )
}
