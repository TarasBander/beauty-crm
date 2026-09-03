import { useEffect, useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useParams } from 'react-router-dom'
import { api, ApiError, type Client, type PublicUser } from '../api/client'
import { useAuth } from '../auth/AuthContext'

function toFormState(client: Client) {
  return {
    firstName: client.firstName,
    lastName: client.lastName,
    phone: client.phone,
    email: client.email ?? '',
    salonName: client.salonName ?? '',
    position: client.position ?? '',
    address: client.address ?? '',
    notes: client.notes ?? '',
    assignedToId: client.assignedTo?.id ?? '',
  }
}

export function ClientDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { token, user } = useAuth()
  const { t, i18n } = useTranslation()

  const [client, setClient] = useState<Client | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [notFound, setNotFound] = useState(false)

  const [managers, setManagers] = useState<PublicUser[]>([])

  const [isEditing, setIsEditing] = useState(false)
  const [form, setForm] = useState(() => toFormState({
    id: '',
    firstName: '',
    lastName: '',
    phone: '',
    email: null,
    salonName: null,
    position: null,
    address: null,
    notes: null,
    assignedTo: null,
    createdBy: null,
    createdAt: '',
    updatedAt: '',
  }))
  const [formError, setFormError] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  const loadClient = () => {
    if (!token || !id) return
    setIsLoading(true)
    setLoadError(null)
    setNotFound(false)
    api
      .getClient(token, id)
      .then((loaded) => {
        setClient(loaded)
        setForm(toFormState(loaded))
      })
      .catch((err: unknown) => {
        if (err instanceof ApiError && err.status === 404) {
          setNotFound(true)
        } else {
          setLoadError(err instanceof ApiError ? err.message : t('clients.detail.loadError'))
        }
      })
      .finally(() => setIsLoading(false))
  }

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(loadClient, [token, id])

  useEffect(() => {
    if (!token) return
    api.listUsers(token).then(setManagers).catch(() => {
      // manager dropdown just falls back to the current assignment — not fatal
    })
  }, [token])

  const startEditing = () => {
    if (client) setForm(toFormState(client))
    setFormError(null)
    setIsEditing(true)
  }

  const cancelEditing = () => {
    if (client) setForm(toFormState(client))
    setFormError(null)
    setIsEditing(false)
  }

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    if (!token || !id) return
    setFormError(null)
    setIsSaving(true)
    try {
      const updated = await api.updateClient(token, id, {
        firstName: form.firstName,
        lastName: form.lastName,
        phone: form.phone,
        email: form.email,
        salonName: form.salonName,
        position: form.position,
        address: form.address,
        notes: form.notes,
        assignedToId: form.assignedToId,
      })
      setClient(updated)
      setForm(toFormState(updated))
      setIsEditing(false)
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : t('clients.detail.saveError'))
    } finally {
      setIsSaving(false)
    }
  }

  const formatDate = (value: string) =>
    new Date(value).toLocaleString(i18n.language === 'uk' ? 'uk-UA' : 'en-US')

  return (
    <div className="users-page">
      <Link to="/clients" className="text-link back-link">
        {t('clients.detail.back')}
      </Link>

      {isLoading && <p>{t('clients.detail.loading')}</p>}
      {!isLoading && notFound && <p className="form-error">{t('clients.detail.notFound')}</p>}
      {!isLoading && loadError && <p className="form-error">{loadError}</p>}

      {!isLoading && client && !notFound && !loadError && (
        <>
          <h1>
            {client.firstName} {client.lastName}
          </h1>

          {!isEditing && (
            <section className="card">
              <div className="detail-grid">
                <div className="detail-item">
                  <span className="detail-label">{t('clients.phone')}</span>
                  <span>{client.phone}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">{t('clients.email')}</span>
                  <span>{client.email ?? '—'}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">{t('clients.salonName')}</span>
                  <span>{client.salonName ?? '—'}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">{t('clients.position')}</span>
                  <span>{client.position ?? '—'}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">{t('clients.address')}</span>
                  <span>{client.address ?? '—'}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">{t('clients.assignedTo')}</span>
                  <span>
                    {client.assignedTo
                      ? `${client.assignedTo.firstName} ${client.assignedTo.lastName}`
                      : '—'}
                  </span>
                </div>
                <div className="detail-item detail-item-wide">
                  <span className="detail-label">{t('clients.notes')}</span>
                  <span>{client.notes ?? '—'}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">{t('clients.detail.createdBy')}</span>
                  <span>
                    {client.createdBy
                      ? `${client.createdBy.firstName} ${client.createdBy.lastName}`
                      : '—'}
                  </span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">{t('clients.detail.createdAt')}</span>
                  <span>{formatDate(client.createdAt)}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">{t('clients.detail.updatedAt')}</span>
                  <span>{formatDate(client.updatedAt)}</span>
                </div>
              </div>

              <button type="button" onClick={startEditing}>
                {t('clients.detail.edit')}
              </button>
            </section>
          )}

          {isEditing && (
            <section className="card">
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

                <div className="form-row">
                  <button type="submit" disabled={isSaving}>
                    {isSaving ? t('clients.detail.saving') : t('clients.detail.save')}
                  </button>
                  <button type="button" onClick={cancelEditing} disabled={isSaving}>
                    {t('clients.detail.cancel')}
                  </button>
                </div>
              </form>
            </section>
          )}
        </>
      )}
    </div>
  )
}
