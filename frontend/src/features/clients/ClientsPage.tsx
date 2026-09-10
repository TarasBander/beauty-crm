import { useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { ApiError } from '../../shared/api/http'
import { Pagination } from '../../shared/components/Pagination'
import { downloadCsv } from '../../shared/utils/csv'
import { useAuth } from '../auth/AuthContext'
import { useAllUsers } from '../users/hooks'
import { exportAllClients, useClients, useCreateClient } from './hooks'

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

  const [page, setPage] = useState(1)
  const clientsQuery = useClients({ page })
  const managersQuery = useAllUsers()
  const createClient = useCreateClient()

  const [form, setForm] = useState(emptyForm)
  const [formError, setFormError] = useState<string | null>(null)
  const [isExporting, setIsExporting] = useState(false)

  const clients = clientsQuery.data?.data ?? []
  const meta = clientsQuery.data?.meta
  const managers = managersQuery.data?.data ?? []

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setFormError(null)
    try {
      const { email, salonName, position, address, notes, assignedToId, ...required } = form
      await createClient.mutateAsync({
        ...required,
        email: email || undefined,
        salonName: salonName || undefined,
        position: position || undefined,
        address: address || undefined,
        notes: notes || undefined,
        assignedToId: assignedToId || undefined,
      })
      setForm(emptyForm)
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : t('clients.createError'))
    }
  }

  const exportClients = async () => {
    if (!token) return
    setIsExporting(true)
    try {
      const all = await exportAllClients(token)
      downloadCsv(
        'clients.csv',
        all.map((c) => ({
          firstName: c.firstName,
          lastName: c.lastName,
          phone: c.phone,
          email: c.email ?? '',
          salonName: c.salonName ?? '',
          position: c.position ?? '',
          address: c.address ?? '',
          assignedTo: c.assignedTo ? `${c.assignedTo.firstName} ${c.assignedTo.lastName}` : '',
        })),
      )
    } finally {
      setIsExporting(false)
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
                maxLength={100}
              />
            </label>
            <label>
              {t('clients.lastName')}
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
              {t('clients.phone')}
              <input
                type="tel"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                required
                maxLength={20}
                pattern="^[+]?[0-9\s\-()]{7,20}$"
              />
            </label>
            <label>
              {t('clients.email')}
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                maxLength={254}
              />
            </label>
          </div>

          <div className="form-row">
            <label>
              {t('clients.salonName')}
              <input
                value={form.salonName}
                onChange={(e) => setForm({ ...form, salonName: e.target.value })}
                maxLength={200}
              />
            </label>
            <label>
              {t('clients.position')}
              <input
                value={form.position}
                onChange={(e) => setForm({ ...form, position: e.target.value })}
                maxLength={100}
              />
            </label>
          </div>

          <label>
            {t('clients.address')}
            <input
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
              maxLength={300}
            />
          </label>

          <label>
            {t('clients.notes')}
            <textarea
              rows={3}
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              maxLength={2000}
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

          <button type="submit" disabled={createClient.isPending}>
            {createClient.isPending ? t('clients.submitting') : t('clients.submit')}
          </button>
        </form>
      </section>

      <section className="card">
        <div className="task-filter-row">
          <h2>{t('clients.listTitle')}</h2>
          {clients.length > 0 && (
            <button type="button" onClick={exportClients} disabled={isExporting}>
              {t('common.exportCsv')}
            </button>
          )}
        </div>
        {clientsQuery.isPending && <p>{t('clients.loading')}</p>}
        {clientsQuery.isError && (
          <p className="form-error">
            {clientsQuery.error instanceof ApiError ? clientsQuery.error.message : t('clients.loadError')}
          </p>
        )}
        {clientsQuery.isSuccess && clients.length === 0 && (
          <p className="subtitle">{t('clients.empty')}</p>
        )}
        {clientsQuery.isSuccess && clients.length > 0 && (
          <div className="table-scroll">
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
                    <Link to={`/clients/${c.id}`} className="text-link">
                      {c.firstName} {c.lastName}
                    </Link>
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
          </div>
        )}
        {meta && (
          <Pagination page={meta.page} totalPages={meta.totalPages} total={meta.total} onPageChange={setPage} />
        )}
      </section>
    </div>
  )
}
