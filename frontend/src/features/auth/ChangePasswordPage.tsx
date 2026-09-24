import { useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { ApiError } from '../../shared/api/http'
import { Card } from '../../shared/components/Card'
import { Page } from '../../shared/components/Page'
import { useChangePassword } from './hooks'

export function ChangePasswordPage() {
  const { t } = useTranslation()
  const changePassword = useChangePassword()

  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setError(null)
    setSuccess(false)

    if (newPassword !== confirmPassword) {
      setError(t('auth.changePassword.mismatchError'))
      return
    }

    try {
      await changePassword.mutateAsync({ currentPassword, newPassword })
      setSuccess(true)
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t('auth.changePassword.genericError'))
    }
  }

  return (
    <Page title={t('auth.changePassword.title')}>
      <Card>
        <form className="user-form" onSubmit={handleSubmit}>
          <label>
            {t('auth.changePassword.currentPassword')}
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              required
              maxLength={72}
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
              maxLength={72}
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
              maxLength={72}
              required
              autoComplete="new-password"
            />
          </label>

          {error && <p className="form-error">{error}</p>}
          {success && <p className="form-success">{t('auth.changePassword.success')}</p>}

          <button type="submit" disabled={changePassword.isPending}>
            {changePassword.isPending
              ? t('auth.changePassword.submitting')
              : t('auth.changePassword.submit')}
          </button>
        </form>
      </Card>
    </Page>
  )
}
