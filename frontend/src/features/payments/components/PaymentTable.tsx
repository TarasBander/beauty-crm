import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import type { Payment } from '../api'

interface PaymentTableProps {
  payments: Payment[]
  formatAmount: (amount: number) => string
  markingPaidId: string | null
  onMarkPaid: (payment: Payment) => void
}

export function PaymentTable({ payments, formatAmount, markingPaidId, onMarkPaid }: PaymentTableProps) {
  const { t } = useTranslation()

  return (
    <div className="table-scroll">
      <table className="data-table">
        <thead>
          <tr>
            <th>{t('payments.columns.deal')}</th>
            <th>{t('payments.columns.amount')}</th>
            <th>{t('payments.columns.method')}</th>
            <th>{t('payments.columns.status')}</th>
            <th>{t('payments.columns.paidAt')}</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {payments.map((p) => (
            <tr key={p.id}>
              <td>
                <Link to={`/clients/${p.deal.client.id}`} className="text-link">
                  {p.deal.title}
                </Link>
              </td>
              <td>{formatAmount(p.amount)}</td>
              <td>{t(`payments.method.${p.method}`)}</td>
              <td>
                <span className={`status-badge status-badge--${p.status}`}>
                  {t(`payments.status.${p.status}`)}
                </span>
              </td>
              <td>{p.paidAt ?? '—'}</td>
              <td>
                {p.status === 'pending' && (
                  <button type="button" onClick={() => onMarkPaid(p)} disabled={markingPaidId === p.id}>
                    {t('payments.markPaid')}
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
