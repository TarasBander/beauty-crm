import { useTranslation } from 'react-i18next'
import type { ApiKey } from '../api'

interface ApiKeyTableProps {
  apiKeys: ApiKey[]
  formatDate: (value: string | null) => string
  revokingId: string | null
  onRevoke: (apiKey: ApiKey) => void
}

export function ApiKeyTable({ apiKeys, formatDate, revokingId, onRevoke }: ApiKeyTableProps) {
  const { t } = useTranslation()

  return (
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
                  className={`payment-status-badge ${k.revoked ? 'payment-status-cancelled' : 'payment-status-paid'}`}
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
                  <button type="button" onClick={() => onRevoke(k)} disabled={revokingId === k.id}>
                    {t('integrations.revoke')}
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
