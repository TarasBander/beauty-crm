import { useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { ApiError } from '../../shared/api/http'
import { Pagination } from '../../shared/components/Pagination'
import type { ApiKey, CreateApiKeyResponse } from './api'
import { useApiKeys, useCreateApiKey, useRevokeApiKey } from './hooks'

export function IntegrationsPage() {
  const { t, i18n } = useTranslation()

  const [page, setPage] = useState(1)
  const apiKeysQuery = useApiKeys({ page })
  const createApiKey = useCreateApiKey()
  const revokeApiKey = useRevokeApiKey()

  const apiKeys = apiKeysQuery.data?.data ?? []
  const meta = apiKeysQuery.data?.meta

  const [name, setName] = useState('')
  const [formError, setFormError] = useState<string | null>(null)

  const [revealedKey, setRevealedKey] = useState<CreateApiKeyResponse | null>(null)
  const [copyHint, setCopyHint] = useState(false)

  const [revokingId, setRevokingId] = useState<string | null>(null)

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setFormError(null)
    try {
      const created = await createApiKey.mutateAsync(name)
      setRevealedKey(created)
      setName('')
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : t('integrations.createError'))
    }
  }

  const handleRevoke = async (apiKey: ApiKey) => {
    setRevokingId(apiKey.id)
    try {
      await revokeApiKey.mutateAsync(apiKey.id)
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

          <button type="submit" disabled={createApiKey.isPending}>
            {createApiKey.isPending ? t('integrations.submitting') : t('integrations.submit')}
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
        {apiKeysQuery.isPending && <p>{t('common.loading')}</p>}
        {apiKeysQuery.isError && (
          <p className="form-error">
            {apiKeysQuery.error instanceof ApiError ? apiKeysQuery.error.message : t('integrations.loadError')}
          </p>
        )}
        {apiKeysQuery.isSuccess && apiKeys.length === 0 && (
          <p className="subtitle">{t('integrations.empty')}</p>
        )}
        {apiKeysQuery.isSuccess && apiKeys.length > 0 && (
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
        {meta && (
          <Pagination page={meta.page} totalPages={meta.totalPages} total={meta.total} onPageChange={setPage} />
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
