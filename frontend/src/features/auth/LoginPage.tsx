import { useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { ApiError } from '../../shared/api/http'
import { LanguageSwitcher } from '../../shared/components/LanguageSwitcher'
import { useAuth } from './AuthContext'

// Стан, який ProtectedRoute кладе в location.state перед редіректом на
// /login: шлях, з якого користувача завернули (див. ProtectedRoute.tsx).
type LoginLocationState = { from?: string }

export function LoginPage() {
  const { user, isLoading, login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const { t } = useTranslation()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Куди повернути користувача: шлях, з якого його завернув ProtectedRoute
  // (наприклад /clients/abc), або '/', якщо він прийшов на /login напряму.
  const redirectTo = (location.state as LoginLocationState | null)?.from ?? '/'

  if (!isLoading && user) {
    return <Navigate to={redirectTo} replace />
  }

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setError(null)
    setIsSubmitting(true)
    try {
      await login(email, password)
      // replace: true — форма логіну не залишається в історії, тож "Назад"
      // не повертає на неї.
      navigate(redirectTo, { replace: true })
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t('auth.login.genericError'))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-lang-switcher">
        <LanguageSwitcher />
      </div>
      <form className="auth-card" onSubmit={handleSubmit}>
        <h1>{t('app.name')}</h1>
        <p className="subtitle">{t('auth.login.subtitle')}</p>

        <label>
          {t('auth.login.email')}
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoFocus
            maxLength={254}
          />
        </label>

        <label>
          {t('auth.login.password')}
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            maxLength={72}
          />
        </label>

        {error && <p className="form-error">{error}</p>}

        <button type="submit" disabled={isSubmitting}>
          {isSubmitting ? t('auth.login.submitting') : t('auth.login.submit')}
        </button>
      </form>
    </div>
  )
}
