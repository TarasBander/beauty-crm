import { useEffect, useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { api, ApiError, type ApiKey, type CreateApiKeyResponse } from '../api/client'
import { useAuth } from '../auth/AuthContext'

export function IntegrationsPage() {
  const { token } = useAuth()
  const { t, i18n } = useTranslation()

  const [apiKeys, setApiKeys] = useState<ApiKey[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)

  const [name, setName] = useState('')
  const [formError, setFormError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [revealedKey, setRevealedKey] = useState<CreateApiKeyResponse | null>(null)
  const [copyHint, setCopyHint] = useState(false)

  const [revokingId, setRevokingId] = useState<string | null>(null)

  const loadKeys = () => {
    if (!token) return
    setIsLoading(true)
    api
      .listApiKeys(token)
      .then(setApiKeys)
      .catch((err: unknown) => {
        setLoadError(err instanceof ApiError ? err.message : t('integrations.loadError'))
      })
      .finally(() => setIsLoading(false))
  }

  useEffect(loadKeys, [token])

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    if (!token) return
    setFormError(null)
    setIsSubmitting(true)
    try {
      const created = await api.createApiKey(token, name)
      setRevealedKey(created)
      setName('')
      loadKeys()
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : t('integrations.createError'))
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleRevoke = async (apiKey: ApiKey) => {
    if (!token) return
    setRevokingId(apiKey.id)
    try {
      await api.revokeApiKey(token, apiKey.id)
      loadKeys()
    } finally {
      setRevokingId(null)
    }
  }

  const copyRawKey = async () => {
    if (!revealedKey) return
    try {
      await navigator.clipboard.writeText(revealedKey.rawKey)
      setCopyHint(true)
      setTimeout(() => setCopyHint(false), 2000)
    } catch {
      // clipboard permission denied — the key is still selectable/visible
    }
  }

  const formatDate = (value: string | null) =>
    value
      ? new Date(value).toLocaleString(i18n.language === 'uk' ? 'uk-UA' : 'en-US', {
          dateStyle: 'medium',
          timeStyle: 'short',
        })
      : '—'

  return (
    <div className="users-page">
      <h1>{t('integrations.title')}</h1>
      <p className="subtitle">{t('integrations.subtitle')}</p>

      <section className="card">
        <h2>{t('integrations.createTitle')}</h2>
        <form className="user-form" onSubmit={handleSubmit}>
          <label>
            {t('integrations.field.name')}
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t('integrations.field.namePlaceholder')}
              required
              maxLength={100}
            />
          </label>

          {formError && <p className="form-error">{formError}</p>}

          <button type="submit" disabled={isSubmitting}>
            {isSubmitting ? t('integrations.submitting') : t('integrations.submit')}
          </button>
        </form>

        {revealedKey && (
          <div className="api-key-reveal">
            <p className="api-key-reveal-warning">{t('integrations.revealWarning')}</p>
            <div className="api-key-reveal-box">
              <code>{revealedKey.rawKey}</code>
              <button type="button" onClick={copyRawKey}>
                {copyHint ? t('integrations.copied') : t('integrations.copy')}
              </button>
            </div>
          </div>
        )}
      </section>

      <section className="card">
        <h2>{t('integrations.listTitle')}</h2>
        {isLoading && <p>{t('common.loading')}</p>}
        {loadError && <p className="form-error">{loadError}</p>}
        {!isLoading && !loadError && apiKeys.length === 0 && (
          <p className="subtitle">{t('integrations.empty')}</p>
        )}
        {!isLoading && !loadError && apiKeys.length > 0 && (
          <div className="table-scroll">
            <table className="users-table">
              <thead>
                <tr>
                  <th>{t('integrations.columns.name')}</th>
                  <th>{t('integrations.columns.key')}</th>
                  <th>{t('integrations.columns.status')}</th>
                  <th>{t('integrations.columns.lastUsed')}</th>
                  <th>{t('integrations.columns.createdBy')}</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {apiKeys.map((k) => (
                  <tr key={k.id}>
                    <td>{k.name}</td>
                    <td>
                      <code>{k.keyPrefix}…</code>
                    </td>
                    <td>
                      <span
                        className={`payment-status-badge ${
                          k.revoked ? 'payment-status-cancelled' : 'payment-status-paid'
                        }`}
                      >
                        {k.revoked ? t('integrations.status.revoked') : t('integrations.status.active')}
                      </span>
                    </td>
                    <td>{formatDate(k.lastUsedAt)}</td>
                    <td>
                      {k.createdBy.firstName} {k.createdBy.lastName}
                    </td>
                    <td>
                      {!k.revoked && (
                        <button
                          type="button"
                          onClick={() => handleRevoke(k)}
                          disabled={revokingId === k.id}
                        >
                          {t('integrations.revoke')}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="card">
        <h2>{t('integrations.usageTitle')}</h2>
        <p className="subtitle">{t('integrations.usageHint')}</p>
        <pre className="api-usage-example">
          {'curl https://your-crm-domain/api/integrations/v1/clients \\\n'}
          {'  -H "X-API-Key: crm_live_..."'}
        </pre>
        <pre className="api-usage-example">
          {'curl https://your-crm-domain/api/integrations/v1/deals \\\n'}
          {'  -H "X-API-Key: crm_live_..."'}
        </pre>
      </section>
    </div>
  )
}
