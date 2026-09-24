import { useEffect, useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { ApiError, messageFrom } from '../../shared/api/http'
import { Card } from '../../shared/components/Card'
import { FormError } from '../../shared/components/FormError'
import { Page } from '../../shared/components/Page'
import { Pagination } from '../../shared/components/Pagination'
import { QueryStatus } from '../../shared/components/QueryStatus'
import { ApiKeyForm } from './components/ApiKeyForm'
import { ApiKeyTable } from './components/ApiKeyTable'
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
  const [revokeError, setRevokeError] = useState<string | null>(null)

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
    setRevokeError(null)
    try {
      await revokeApiKey.mutateAsync(apiKey.id)
    } catch (err) {
      setRevokeError(messageFrom(err, t('integrations.revokeError')))
    } finally {
      setRevokingId(null)
    }
  }

  // "Скопійовано!" на кнопці на 2с — таймер живе тут, а не в copyRawKey,
  // саме щоб мати cleanup: якщо компонент розмонтується (користувач пішов
  // зі сторінки) раніше, ніж таймер спрацює, ефект прибере його за собою
  // замість того, щоб він через 2с викликав setState на вже
  // розмонтованому компоненті.
  useEffect(() => {
    if (!copyHint) return
    const id = setTimeout(() => setCopyHint(false), 2000)
    return () => clearTimeout(id)
  }, [copyHint])

  const copyRawKey = async () => {
    if (!revealedKey) return
    try {
      await navigator.clipboard.writeText(revealedKey.rawKey)
      setCopyHint(true)
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
    <Page title={t('integrations.title')}>
      <p className="subtitle">{t('integrations.subtitle')}</p>

      <Card title={t('integrations.createTitle')}>
        <ApiKeyForm
          name={name}
          onNameChange={setName}
          onSubmit={handleSubmit}
          isSubmitting={createApiKey.isPending}
          error={formError}
        />

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
      </Card>

      <Card title={t('integrations.listTitle')}>
        {revokeError && <FormError>{revokeError}</FormError>}
        <QueryStatus
          query={apiKeysQuery}
          errorFallback={t('integrations.loadError')}
          isEmpty={apiKeys.length === 0}
          emptyText={t('integrations.empty')}
        >
          <ApiKeyTable
            apiKeys={apiKeys}
            formatDate={formatDate}
            revokingId={revokingId}
            onRevoke={handleRevoke}
          />
        </QueryStatus>
        {meta && (
          <Pagination page={meta.page} totalPages={meta.totalPages} total={meta.total} onPageChange={setPage} />
        )}
      </Card>

      <Card title={t('integrations.usageTitle')}>
        <p className="subtitle">{t('integrations.usageHint')}</p>
        <pre className="api-usage-example">
          {'curl https://your-crm-domain/api/integrations/v1/clients \\\n'}
          {'  -H "X-API-Key: crm_live_..."'}
        </pre>
        <pre className="api-usage-example">
          {'curl https://your-crm-domain/api/integrations/v1/deals \\\n'}
          {'  -H "X-API-Key: crm_live_..."'}
        </pre>
      </Card>
    </Page>
  )
}
