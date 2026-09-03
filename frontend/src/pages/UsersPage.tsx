import { useEffect, useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { api, ApiError, type PublicUser, type Role } from '../api/client'
import { useAuth } from '../auth/AuthContext'

const emptyForm = {
  email: '',
  password: '',
  firstName: '',
  lastName: '',
  role: 'sales_manager' as Role,
}

export function UsersPage() {
  const { token } = useAuth()
  const { t } = useTranslation()
  const [users, setUsers] = useState<PublicUser[]>([])
  const [isLoadingUsers, setIsLoadingUsers] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)

  const [form, setForm] = useState(emptyForm)
  const [formError, setFormError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const loadUsers = () => {
    if (!token) return
    setIsLoadingUsers(true)
    api
      .listUsers(token)
      .then(setUsers)
      .catch((err: unknown) => {
        setLoadError(err instanceof ApiError ? err.message : t('users.loadError'))
      })
      .finally(() => setIsLoadingUsers(false))
  }

  useEffect(loadUsers, [token])

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    if (!token) return
    setFormError(null)
    setIsSubmitting(true)
    try {
      await api.createUser(token, form)
      setForm(emptyForm)
      loadUsers()
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : t('users.createError'))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="users-page">
      <h1>{t('users.title')}</h1>

      <section className="card">
        <h2>{t('users.addTitle')}</h2>
        <form className="user-form" onSubmit={handleSubmit}>
          <div className="form-row">
            <label>
              {t('users.firstName')}
              <input
                value={form.firstName}
                onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                required
              />
            </label>
            <label>
              {t('users.lastName')}
              <input
                value={form.lastName}
                onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                required
              />
            </label>
          </div>

          <div className="form-row">
            <label>
              {t('users.email')}
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
              />
            </label>
            <label>
              {t('users.password')}
              <input
                type="password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                minLength={8}
                required
              />
            </label>
          </div>

          <label>
            {t('users.role')}
            <select
              value={form.role}
              onChange={(e) => setForm({ ...form, role: e.target.value as Role })}
            >
              <option value="sales_manager">{t('roles.sales_manager')}</option>
              <option value="admin">{t('roles.admin')}</option>
            </select>
          </label>

          {formError && <p className="form-error">{formError}</p>}

          <button type="submit" disabled={isSubmitting}>
            {isSubmitting ? t('users.submitting') : t('users.submit')}
          </button>
        </form>
      </section>

      <section className="card">
        <h2>{t('users.listTitle')}</h2>
        {isLoadingUsers && <p>{t('users.loading')}</p>}
        {loadError && <p className="form-error">{loadError}</p>}
        {!isLoadingUsers && !loadError && (
          <table className="users-table">
            <thead>
              <tr>
                <th>{t('users.columns.name')}</th>
                <th>{t('users.columns.email')}</th>
                <th>{t('users.columns.role')}</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id}>
                  <td>
                    {u.firstName} {u.lastName}
                  </td>
                  <td>{u.email}</td>
                  <td>{t(`roles.${u.role}`)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  )
}
