import type { FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import type { Role } from '../../../shared/api/types'
import { FormError } from '../../../shared/components/FormError'
import type { UserFormValues } from '../userForm'

interface UserFormProps {
  values: UserFormValues
  onChange: (values: UserFormValues) => void
  /** Опцію "admin" у списку ролей видно лише, якщо той, хто заповнює
   * форму, сам admin — сторінка вирішує це (AdminRoute вже гарантує, що
   * сюди хтось інший не потрапить, але явна перевірка лишається як
   * друга лінія, див. коментар у UsersPage.tsx). */
  canAssignAdmin: boolean
  onSubmit: (event: FormEvent) => void
  isSubmitting: boolean
  error: string | null
}

export function UserForm({ values, onChange, canAssignAdmin, onSubmit, isSubmitting, error }: UserFormProps) {
  const { t } = useTranslation()

  const set = <K extends keyof UserFormValues>(key: K, value: UserFormValues[K]) =>
    onChange({ ...values, [key]: value })

  return (
    <form className="crm-form" onSubmit={onSubmit}>
      <div className="form-row">
        <label>
          {t('users.firstName')}
          <input
            value={values.firstName}
            onChange={(e) => set('firstName', e.target.value)}
            required
            maxLength={100}
          />
        </label>
        <label>
          {t('users.lastName')}
          <input
            value={values.lastName}
            onChange={(e) => set('lastName', e.target.value)}
            required
            maxLength={100}
          />
        </label>
      </div>

      <div className="form-row">
        <label>
          {t('users.email')}
          <input
            type="email"
            value={values.email}
            onChange={(e) => set('email', e.target.value)}
            required
            maxLength={254}
          />
        </label>
        <label>
          {t('users.password')}
          <input
            type="password"
            value={values.password}
            onChange={(e) => set('password', e.target.value)}
            minLength={8}
            maxLength={72}
            required
          />
        </label>
      </div>

      <label>
        {t('users.role')}
        <select value={values.role} onChange={(e) => set('role', e.target.value as Role)}>
          <option value="sales_manager">{t('roles.sales_manager')}</option>
          {canAssignAdmin && <option value="admin">{t('roles.admin')}</option>}
        </select>
      </label>

      {error && <FormError>{error}</FormError>}

      <button type="submit" disabled={isSubmitting}>
        {isSubmitting ? t('users.submitting') : t('users.submit')}
      </button>
    </form>
  )
}
