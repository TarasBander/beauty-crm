import { useTranslation } from 'react-i18next'
import { ApiError } from '../../shared/api/http'
import { Card } from '../../shared/components/Card'
import { Page } from '../../shared/components/Page'
import { formatMoney } from '../../shared/utils/money'
import { useAnalyticsDashboard } from './hooks'

export function AnalyticsPage() {
  const { t, i18n } = useTranslation()
  const { data, isPending, isError, error } = useAnalyticsDashboard()

  const formatAmount = (amount: number) => formatMoney(amount, i18n.language)

  const formatMonth = (month: string) => {
    const [year, m] = month.split('-').map(Number)
    const date = new Date(year, m - 1, 1)
    return date.toLocaleDateString(i18n.language === 'uk' ? 'uk-UA' : 'en-US', {
      month: 'short',
      year: '2-digit',
    })
  }

  if (isPending) {
    return (
      <Page title={t('analytics.title')}>
        <p>{t('analytics.loading')}</p>
      </Page>
    )
  }

  if (isError || !data) {
    return (
      <Page title={t('analytics.title')}>
        <p className="form-error">
          {error instanceof ApiError ? error.message : t('analytics.loadError')}
        </p>
      </Page>
    )
  }

  const maxStageAmount = Math.max(1, ...data.deals.byStage.map((s) => s.amount))
  const maxMonthAmount = Math.max(1, ...data.revenueByMonth.map((m) => m.amount))

  return (
    <Page title={t('analytics.title')}>
      <div className="analytics-kpis">
        <div className="analytics-kpi">
          <span className="detail-label">{t('analytics.kpi.clients')}</span>
          <span className="analytics-kpi-value">{data.clients.total}</span>
        </div>
        <div className="analytics-kpi">
          <span className="detail-label">{t('analytics.kpi.activePipeline')}</span>
          <span className="analytics-kpi-value">{formatAmount(data.deals.activeAmount)}</span>
          <span className="analytics-kpi-sub">{data.deals.activeCount} {t('analytics.kpi.deals')}</span>
        </div>
        <div className="analytics-kpi">
          <span className="detail-label">{t('analytics.kpi.won')}</span>
          <span className="analytics-kpi-value analytics-kpi-positive">{formatAmount(data.deals.wonAmount)}</span>
          <span className="analytics-kpi-sub">{data.deals.wonCount} {t('analytics.kpi.deals')}</span>
        </div>
        <div className="analytics-kpi">
          <span className="detail-label">{t('analytics.kpi.conversion')}</span>
          <span className="analytics-kpi-value">{data.deals.conversionRate}%</span>
        </div>
        <div className="analytics-kpi">
          <span className="detail-label">{t('analytics.kpi.received')}</span>
          <span className="analytics-kpi-value analytics-kpi-positive">{formatAmount(data.payments.totalPaid)}</span>
        </div>
        <div className="analytics-kpi">
          <span className="detail-label">{t('analytics.kpi.pendingPayments')}</span>
          <span className="analytics-kpi-value">{formatAmount(data.payments.totalPending)}</span>
        </div>
        <div className="analytics-kpi">
          <span className="detail-label">{t('analytics.kpi.overdueTasks')}</span>
          <span className="analytics-kpi-value analytics-kpi-negative">{data.tasks.overdue}</span>
        </div>
      </div>

      <Card title={t('analytics.byStage')}>
        <div className="analytics-bars">
          {data.deals.byStage.map((s) => (
            <div key={s.stage} className="analytics-bar-row">
              <span className="analytics-bar-label">{t(`deals.stage.${s.stage}`)}</span>
              <div className="analytics-bar-track">
                <div
                  className="analytics-bar-fill"
                  style={{ width: `${(s.amount / maxStageAmount) * 100}%` }}
                />
              </div>
              <span className="analytics-bar-value">
                {formatAmount(s.amount)} · {s.count}
              </span>
            </div>
          ))}
        </div>
      </Card>

      <Card title={t('analytics.revenueByMonth')}>
        <div className="analytics-columns">
          {data.revenueByMonth.map((m) => (
            <div key={m.month} className="analytics-column">
              <div className="analytics-column-track">
                <div
                  className="analytics-column-fill"
                  style={{ height: `${(m.amount / maxMonthAmount) * 100}%` }}
                  title={formatAmount(m.amount)}
                />
              </div>
              <span className="analytics-column-label">{formatMonth(m.month)}</span>
            </div>
          ))}
        </div>
      </Card>

      <Card title={t('analytics.topClients')}>
        {data.topClients.length === 0 && <p className="subtitle">{t('analytics.noData')}</p>}
        {data.topClients.length > 0 && (
          <div className="table-scroll">
          <table className="data-table">
            <thead>
              <tr>
                <th>{t('analytics.columns.client')}</th>
                <th>{t('analytics.columns.salon')}</th>
                <th>{t('analytics.columns.revenue')}</th>
              </tr>
            </thead>
            <tbody>
              {data.topClients.map((c) => (
                <tr key={c.clientId}>
                  <td>{c.firstName} {c.lastName}</td>
                  <td>{c.salonName ?? '—'}</td>
                  <td>{formatAmount(c.amount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        )}
      </Card>

      <Card title={t('analytics.managerPerformance')}>
        {data.managerPerformance.length === 0 && <p className="subtitle">{t('analytics.noData')}</p>}
        {data.managerPerformance.length > 0 && (
          <div className="table-scroll">
          <table className="data-table">
            <thead>
              <tr>
                <th>{t('analytics.columns.manager')}</th>
                <th>{t('analytics.columns.dealsWon')}</th>
                <th>{t('analytics.columns.revenue')}</th>
              </tr>
            </thead>
            <tbody>
              {data.managerPerformance.map((m) => (
                <tr key={m.managerId}>
                  <td>{m.firstName} {m.lastName}</td>
                  <td>{m.dealsWon}</td>
                  <td>{formatAmount(m.revenue)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        )}
      </Card>
    </Page>
  )
}
