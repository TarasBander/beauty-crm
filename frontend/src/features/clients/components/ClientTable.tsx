import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import type { Client } from '../api'

interface ClientTableProps {
  clients: Client[]
}

export function ClientTable({ clients }: ClientTableProps) {
  const { t } = useTranslation()

  return (
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
              <td>{c.assignedTo ? `${c.assignedTo.firstName} ${c.assignedTo.lastName}` : '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
