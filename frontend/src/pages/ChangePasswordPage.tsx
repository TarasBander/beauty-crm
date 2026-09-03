import { useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { api, ApiError } from '../api/client'
import { useAuth } from '../auth/AuthContext'

export function ChangePasswordPage() {
  const { token } = useAuth()
  const { t } = useTranslation()

  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    if (!token) return
    setError(null)
    setSuccess(false)

    if (newPassword !== confirmPassword) {
      setError(t('auth.changePassword.mismatchError'))
      return
    }

    setIsSubmitting(true)
    try {
      await api.changePassword(token, currentPassword, newPassword)
      setSuccess(true)
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : t('auth.changePassword.genericError'),
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="users-page">
      <h1>{t('auth.changePassword.title')}</h1>

      <section className="card">
        <form className="user-form" onSubmit={handleSubmit}>
          <label>
            {t('auth.changePassword.currentPassword')}
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              required
              autoComplete="current-password"
            />
          </label>

          <label>
            {t('auth.changePassword.newPassword')}
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              minLength={8}
              required
              autoComplete="new-password"
            />
          </label>

          <label>
            {t('auth.changePassword.confirmPassword')}
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              minLength={8}
              required
              autoComplete="new-password"
            />
          </label>

          {error && <p className="form-error">{error}</p>}
          {success && <p className="form-success">{t('auth.changePassword.success')}</p>}

          <button type="submit" disabled={isSubmitting}>
            {isSubmitting
              ? t('auth.changePassword.submitting')
              : t('auth.changePassword.submit')}
          </button>
        </form>
      </section>
    </div>
  )
}
