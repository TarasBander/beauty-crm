import { useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { ApiError } from '../../shared/api/http'
import { Pagination } from '../../shared/components/Pagination'
import type { Role } from '../../shared/api/types'
import { useCreateUser, useUsers } from './hooks'

const emptyForm = {
  email: '',
  password: '',
  firstName: '',
  lastName: '',
  role: 'sales_manager' as Role,
}

export function UsersPage() {
  const { t } = useTranslation()
  const [page, setPage] = useState(1)
  const usersQuery = useUsers({ page })
  const createUser = useCreateUser()

  const [form, setForm] = useState(emptyForm)
  const [formError, setFormError] = useState<string | null>(null)

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setFormError(null)
    try {
      await createUser.mutateAsync(form)
      setForm(emptyForm)
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : t('users.createError'))
    }
  }

  const users = usersQuery.data?.data ?? []
  const meta = usersQuery.data?.meta

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
                maxLength={100}
              />
            </label>
            <label>
              {t('users.lastName')}
              <input
                value={form.lastName}
                onChange={(e) => setForm({ ...form, lastName: e.target.value })}
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
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
                maxLength={254}
              />
            </label>
            <label>
              {t('users.password')}
              <input
                type="password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                minLength={8}
                maxLength={72}
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

          <button type="submit" disabled={createUser.isPending}>
            {createUser.isPending ? t('users.submitting') : t('users.submit')}
          </button>
        </form>
      </section>

      <section className="card">
        <h2>{t('users.listTitle')}</h2>
        {usersQuery.isPending && <p>{t('users.loading')}</p>}
        {usersQuery.isError && (
          <p className="form-error">
            {usersQuery.error instanceof ApiError ? usersQuery.error.message : t('users.loadError')}
          </p>
        )}
        {usersQuery.isSuccess && (
          <div className="table-scroll">
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
          </div>
        )}
        {meta && (
          <Pagination page={meta.page} totalPages={meta.totalPages} total={meta.total} onPageChange={setPage} />
        )}
      </section>
    </div>
  )
}
