import { useEffect, useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useParams } from 'react-router-dom'
import { ApiError } from '../../shared/api/http'
import { useAuth } from '../auth/AuthContext'
import { useAllUsers } from '../users/hooks'
import type { Client } from './api'
import { useClient, useUpdateClient } from './hooks'

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
  const { user } = useAuth()
  const { t, i18n } = useTranslation()

  const clientQuery = useClient(id)
  const client = clientQuery.data ?? null
  const managersQuery = useAllUsers()
  const managers = managersQuery.data?.data ?? []
  const updateClient = useUpdateClient()

  const [isEditing, setIsEditing] = useState(false)
  const [form, setForm] = useState(emptyFormState)
  const [formError, setFormError] = useState<string | null>(null)

  // Keep the edit form in sync whenever a freshly loaded/updated client
  // arrives, as long as the user isn't mid-edit (don't clobber unsaved input).
  useEffect(() => {
    if (client && !isEditing) setForm(toFormState(client))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [client])

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
    if (!id) return
    setFormError(null)
    try {
      await updateClient.mutateAsync({
        id,
        dto: {
          firstName: form.firstName,
          lastName: form.lastName,
          phone: form.phone,
          email: form.email,
          salonName: form.salonName,
          position: form.position,
          address: form.address,
          notes: form.notes,
          assignedToId: form.assignedToId,
        },
      })
      setIsEditing(false)
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : t('clients.detail.saveError'))
    }
  }

  const formatDate = (value: string) =>
    new Date(value).toLocaleString(i18n.language === 'uk' ? 'uk-UA' : 'en-US')

  const notFound = clientQuery.isError && clientQuery.error instanceof ApiError && clientQuery.error.status === 404
  const loadError =
    clientQuery.isError && !notFound
      ? clientQuery.error instanceof ApiError
        ? clientQuery.error.message
        : t('clients.detail.loadError')
      : null

  return (
    <div className="users-page">
      <Link to="/clients" className="text-link back-link">
        {t('clients.detail.back')}
      </Link>

      {clientQuery.isPending && <p>{t('clients.detail.loading')}</p>}
      {notFound && <p className="form-error">{t('clients.detail.notFound')}</p>}
      {loadError && <p className="form-error">{loadError}</p>}

      {client && !notFound && !loadError && (
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

                <div className="form-row">
                  <button type="submit" disabled={updateClient.isPending}>
                    {updateClient.isPending ? t('clients.detail.saving') : t('clients.detail.save')}
                  </button>
                  <button type="button" onClick={cancelEditing} disabled={updateClient.isPending}>
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

const emptyFormState = {
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
