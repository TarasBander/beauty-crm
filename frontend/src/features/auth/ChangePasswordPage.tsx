import { useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { ApiError } from '../../shared/api/http'
import { Card } from '../../shared/components/Card'
import { FormError } from '../../shared/components/FormError'
import { Page } from '../../shared/components/Page'
import { useChangePassword } from './hooks'

export function ChangePasswordPage() {
  const { t } = useTranslation()
  const changePassword = useChangePassword()

  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  // Окремо від error: це саме валідація ОДНОГО поля (confirmPassword),
  // тож інпут може посилатись на неї через aria-invalid/aria-describedby
  // — на відміну від error нижче, який стосується форми в цілому
  // (провал запиту на бекенд), а не якогось конкретного інпуту.
  const [mismatchError, setMismatchError] = useState(false)
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setError(null)
    setMismatchError(false)
    setSuccess(false)

    if (newPassword !== confirmPassword) {
      setMismatchError(true)
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
        <form className="crm-form" onSubmit={handleSubmit}>
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
              aria-invalid={mismatchError}
              aria-describedby={mismatchError ? 'confirm-password-error' : undefined}
            />
          </label>

          {mismatchError && (
            <FormError id="confirm-password-error">{t('auth.changePassword.mismatchError')}</FormError>
          )}
          {error && <FormError>{error}</FormError>}
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
