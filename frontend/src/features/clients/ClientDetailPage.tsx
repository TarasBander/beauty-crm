import { useEffect, useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useParams } from 'react-router-dom'
import { ApiError } from '../../shared/api/http'
import { Card } from '../../shared/components/Card'
import { Page } from '../../shared/components/Page'
import { useAuth } from '../auth/AuthContext'
import { useAllUsers } from '../users/hooks'
import { ClientForm } from './components/ClientForm'
import { clientToFormValues, emptyClientForm, toUpdateClientDto, type ClientFormValues } from './clientForm'
import { useClient, useUpdateClient } from './hooks'

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
  const [form, setForm] = useState<ClientFormValues>(emptyClientForm)
  const [formError, setFormError] = useState<string | null>(null)

  // Keep the edit form in sync whenever a freshly loaded/updated client
  // arrives, as long as the user isn't mid-edit (don't clobber unsaved input).
  useEffect(() => {
    if (client && !isEditing) setForm(clientToFormValues(client))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [client])

  const startEditing = () => {
    if (client) setForm(clientToFormValues(client))
    setFormError(null)
    setIsEditing(true)
  }

  const cancelEditing = () => {
    if (client) setForm(clientToFormValues(client))
    setFormError(null)
    setIsEditing(false)
  }

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    if (!id) return
    setFormError(null)
    try {
      await updateClient.mutateAsync({ id, dto: toUpdateClientDto(form) })
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
    <Page>
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
            <Card>
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
            </Card>
          )}

          {isEditing && (
            <Card>
              <ClientForm
                values={form}
                onChange={setForm}
                managers={managers}
                currentUserFirstName={user?.firstName}
                onSubmit={handleSubmit}
                isSubmitting={updateClient.isPending}
                submitLabel={t('clients.detail.save')}
                submittingLabel={t('clients.detail.saving')}
                error={formError}
                onCancel={cancelEditing}
                cancelLabel={t('clients.detail.cancel')}
              />
            </Card>
          )}
        </>
      )}
    </Page>
  )
}
