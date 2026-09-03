import { useEffect, useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { api, ApiError, type Client, type PublicUser } from '../api/client'
import { useAuth } from '../auth/AuthContext'

const emptyForm = {
  firstName: '',
  lastName: '',
  phone: '',
  email: '',
  salonName: '',
  position: '',
  address: '',
  notes: '',
  assignedToId: '',
}

export function ClientsPage() {
  const { token, user } = useAuth()
  const { t } = useTranslation()

  const [clients, setClients] = useState<Client[]>([])
  const [isLoadingClients, setIsLoadingClients] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)

  const [managers, setManagers] = useState<PublicUser[]>([])

  const [form, setForm] = useState(emptyForm)
  const [formError, setFormError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const loadClients = () => {
    if (!token) return
    setIsLoadingClients(true)
    api
      .listClients(token)
      .then(setClients)
      .catch((err: unknown) => {
        setLoadError(err instanceof ApiError ? err.message : t('clients.loadError'))
      })
      .finally(() => setIsLoadingClients(false))
  }

  useEffect(loadClients, [token])

  useEffect(() => {
    if (!token) return
    api.listUsers(token).then(setManagers).catch(() => {
      // the manager dropdown just falls back to "assign to me" — not fatal
    })
  }, [token])

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    if (!token) return
    setFormError(null)
    setIsSubmitting(true)
    try {
      const { email, salonName, position, address, notes, assignedToId, ...required } = form
      await api.createClient(token, {
        ...required,
        email: email || undefined,
        salonName: salonName || undefined,
        position: position || undefined,
        address: address || undefined,
        notes: notes || undefined,
        assignedToId: assignedToId || undefined,
      })
      setForm(emptyForm)
      loadClients()
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : t('clients.createError'))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="users-page">
      <h1>{t('clients.title')}</h1>

      <section className="card">
        <h2>{t('clients.addTitle')}</h2>
        <form className="user-form" onSubmit={handleSubmit}>
          <div className="form-row">
            <label>
              {t('clients.firstName')}
              <input
                value={form.firstName}
                onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                required
              />
            </label>
            <label>
              {t('clients.lastName')}
              <input
                value={form.lastName}
                onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                required
              />
            </label>
          </div>

          <div className="form-row">
            <label>
              {t('clients.phone')}
              <input
                type="tel"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                required
              />
            </label>
            <label>
              {t('clients.email')}
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </label>
          </div>

          <div className="form-row">
            <label>
              {t('clients.salonName')}
              <input
                value={form.salonName}
                onChange={(e) => setForm({ ...form, salonName: e.target.value })}
              />
            </label>
            <label>
              {t('clients.position')}
              <input
                value={form.position}
                onChange={(e) => setForm({ ...form, position: e.target.value })}
              />
            </label>
          </div>

          <label>
            {t('clients.address')}
            <input
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
            />
          </label>

          <label>
            {t('clients.notes')}
            <textarea
              rows={3}
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
            />
          </label>

          <label>
            {t('clients.assignedTo')}
            <select
              value={form.assignedToId}
              onChange={(e) => setForm({ ...form, assignedToId: e.target.value })}
            >
              <option value="">{t('clients.assignedToMe', { name: user?.firstName })}</option>
              {managers.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.firstName} {m.lastName}
                </option>
              ))}
            </select>
          </label>

          {formError && <p className="form-error">{formError}</p>}

          <button type="submit" disabled={isSubmitting}>
            {isSubmitting ? t('clients.submitting') : t('clients.submit')}
          </button>
        </form>
      </section>

      <section className="card">
        <h2>{t('clients.listTitle')}</h2>
        {isLoadingClients && <p>{t('clients.loading')}</p>}
        {loadError && <p className="form-error">{loadError}</p>}
        {!isLoadingClients && !loadError && clients.length === 0 && (
          <p className="subtitle">{t('clients.empty')}</p>
        )}
        {!isLoadingClients && !loadError && clients.length > 0 && (
          <table className="users-table">
            <thead>
              <tr>
                <th>{t('clients.columns.name')}</th>
                <th>{t('clients.columns.phone')}</th>
                <th>{t('clients.columns.salon')}</th>
                <th>{t('clients.columns.assignedTo')}</th>
              </tr>
            </thead>
            <tbody>
              {clients.map((c) => (
                <tr key={c.id}>
                  <td>
                    {c.firstName} {c.lastName}
                  </td>
                  <td>{c.phone}</td>
                  <td>{c.salonName ?? '—'}</td>
                  <td>
                    {c.assignedTo ? `${c.assignedTo.firstName} ${c.assignedTo.lastName}` : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  )
}
