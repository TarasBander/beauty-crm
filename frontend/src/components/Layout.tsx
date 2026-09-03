import type { ReactNode } from 'react'
import { NavLink } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'

const ROLE_LABELS: Record<string, string> = {
  admin: 'Адмін',
  sales_manager: 'Менеджер з продажу',
}

export function Layout({ children }: { children: ReactNode }) {
  const { user, logout } = useAuth()

  return (
    <div className="layout">
      <header className="topbar">
        <div className="brand">Beauty CRM</div>
        <nav className="nav">
          <NavLink to="/" end>
            Дашборд
          </NavLink>
          <NavLink to="/users">Користувачі</NavLink>
        </nav>
        {user && (
          <div className="user-menu">
            <span>
              {user.firstName} {user.lastName}{' '}
              <span className="role-badge">{ROLE_LABELS[user.role] ?? user.role}</span>
            </span>
            <button type="button" onClick={logout}>
              Вийти
            </button>
          </div>
        )}
      </header>
      <main className="content">{children}</main>
    </div>
  )
}
