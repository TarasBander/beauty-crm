import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { api, ApiError, type AnalyticsDashboard } from '../api/client'
import { useAuth } from '../auth/AuthContext'

export function AnalyticsPage() {
  const { token } = useAuth()
  const { t, i18n } = useTranslation()

  const [data, setData] = useState<AnalyticsDashboard | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)

  useEffect(() => {
    if (!token) return
    setIsLoading(true)
    api
      .getAnalyticsDashboard(token)
      .then(setData)
      .catch((err: unknown) => {
        setLoadError(err instanceof ApiError ? err.message : t('analytics.loadError'))
      })
      .finally(() => setIsLoading(false))
  }, [token, t])

  const formatAmount = (amount: number) =>
    amount.toLocaleString(i18n.language === 'uk' ? 'uk-UA' : 'en-US', {
      maximumFractionDigits: 0,
    }) + (i18n.language === 'uk' ? ' грн' : ' UAH')

  const formatMonth = (month: string) => {
    const [year, m] = month.split('-').map(Number)
    const date = new Date(year, m - 1, 1)
    return date.toLocaleDateString(i18n.language === 'uk' ? 'uk-UA' : 'en-US', {
      month: 'short',
      year: '2-digit',
    })
  }

  if (isLoading) {
    return (
      <div className="users-page">
        <h1>{t('analytics.title')}</h1>
        <p>{t('analytics.loading')}</p>
      </div>
    )
  }

  if (loadError || !data) {
    return (
      <div className="users-page">
        <h1>{t('analytics.title')}</h1>
        <p className="form-error">{loadError ?? t('analytics.loadError')}</p>
      </div>
    )
  }

  const maxStageAmount = Math.max(1, ...data.deals.byStage.map((s) => s.amount))
  const maxMonthAmount = Math.max(1, ...data.revenueByMonth.map((m) => m.amount))

  return (
    <div className="users-page">
      <h1>{t('analytics.title')}</h1>

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

      <section className="card">
        <h2>{t('analytics.byStage')}</h2>
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
      </section>

      <section className="card">
        <h2>{t('analytics.revenueByMonth')}</h2>
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
      </section>

      <section className="card">
        <h2>{t('analytics.topClients')}</h2>
        {data.topClients.length === 0 && <p className="subtitle">{t('analytics.noData')}</p>}
        {data.topClients.length > 0 && (
          <div className="table-scroll">
          <table className="users-table">
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
      </section>

      <section className="card">
        <h2>{t('analytics.managerPerformance')}</h2>
        {data.managerPerformance.length === 0 && <p className="subtitle">{t('analytics.noData')}</p>}
        {data.managerPerformance.length > 0 && (
          <div className="table-scroll">
          <table className="users-table">
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
      </section>
    </div>
  )
}
