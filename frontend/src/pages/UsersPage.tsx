import { useEffect, useState, type FormEvent } from 'react'
import { api, ApiError, type PublicUser, type Role } from '../api/client'
import { useAuth } from '../auth/AuthContext'

const ROLE_LABELS: Record<Role, string> = {
  admin: 'Адмін',
  sales_manager: 'Менеджер з продажу',
}

const emptyForm = {
  email: '',
  password: '',
  firstName: '',
  lastName: '',
  role: 'sales_manager' as Role,
}

export function UsersPage() {
  const { token } = useAuth()
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
        setLoadError(err instanceof ApiError ? err.message : 'Помилка завантаження')
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
      setFormError(err instanceof ApiError ? err.message : 'Не вдалося створити користувача')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="users-page">
      <h1>Користувачі</h1>

      <section className="card">
        <h2>Додати користувача</h2>
        <form className="user-form" onSubmit={handleSubmit}>
          <div className="form-row">
            <label>
              Ім'я
              <input
                value={form.firstName}
                onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                required
              />
            </label>
            <label>
              Прізвище
              <input
                value={form.lastName}
                onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                required
              />
            </label>
          </div>

          <div className="form-row">
            <label>
              Email
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
              />
            </label>
            <label>
              Пароль
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
            Роль
            <select
              value={form.role}
              onChange={(e) => setForm({ ...form, role: e.target.value as Role })}
            >
              <option value="sales_manager">Менеджер з продажу</option>
              <option value="admin">Адмін</option>
            </select>
          </label>

          {formError && <p className="form-error">{formError}</p>}

          <button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Створення…' : 'Створити'}
          </button>
        </form>
      </section>

      <section className="card">
        <h2>Список користувачів</h2>
        {isLoadingUsers && <p>Завантаження…</p>}
        {loadError && <p className="form-error">{loadError}</p>}
        {!isLoadingUsers && !loadError && (
          <table className="users-table">
            <thead>
              <tr>
                <th>Ім'я</th>
                <th>Email</th>
                <th>Роль</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id}>
                  <td>
                    {u.firstName} {u.lastName}
                  </td>
                  <td>{u.email}</td>
                  <td>{ROLE_LABELS[u.role]}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  )
}
