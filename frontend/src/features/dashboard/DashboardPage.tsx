import { useMemo, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { ApiError } from '../../shared/api/http'
import type { Role } from '../../shared/api/types'
import { Card } from '../../shared/components/Card'
import { Page } from '../../shared/components/Page'
import { todayLocalISO } from '../../shared/utils/date'
import { formatMoney } from '../../shared/utils/money'
import { useAuth } from '../auth/AuthContext'
import { useAnalyticsDashboard } from '../analytics/hooks'

// roles: як і в Layout.tsx — undefined значить "плитка для всіх", інакше
// показуємо лише переліченим ролям. Без цього плитка на /users вела б
// менеджера просто на редірект назад сюди (AdminRoute у App.tsx).
const TILES: { to: string; navKey: string; descKey: string; icon: ReactNode; roles?: Role[] }[] = [
  {
    to: '/clients',
    navKey: 'nav.clients',
    descKey: 'dashboard.tile.clients',
    icon: (
      <>
        <circle cx="12" cy="8" r="4" />
        <path d="M4 20c0-4 4-6 8-6s8 2 8 6" />
      </>
    ),
  },
  {
    to: '/deals',
    navKey: 'nav.deals',
    descKey: 'dashboard.tile.deals',
    icon: <path d="M4 5h16l-6 8v6l-4 2v-8z" />,
  },
  {
    to: '/tasks',
    navKey: 'nav.tasks',
    descKey: 'dashboard.tile.tasks',
    icon: (
      <>
        <rect x="4" y="4" width="16" height="16" rx="2" />
        <path d="M8 12l3 3 5-6" />
      </>
    ),
  },
  {
    to: '/payments',
    navKey: 'nav.payments',
    descKey: 'dashboard.tile.payments',
    icon: (
      <>
        <rect x="3" y="6" width="18" height="12" rx="2" />
        <line x1="3" y1="10" x2="21" y2="10" />
      </>
    ),
  },
  {
    to: '/analytics',
    navKey: 'nav.analytics',
    descKey: 'dashboard.tile.analytics',
    icon: (
      <>
        <line x1="6" y1="20" x2="6" y2="10" />
        <line x1="12" y1="20" x2="12" y2="4" />
        <line x1="18" y1="20" x2="18" y2="14" />
      </>
    ),
  },
  {
    to: '/users',
    navKey: 'nav.users',
    descKey: 'dashboard.tile.users',
    roles: ['admin'],
    icon: (
      <>
        <circle cx="9" cy="8" r="3" />
        <circle cx="16.5" cy="9.5" r="2.3" />
        <path d="M3 20c0-3.5 3-5.5 6-5.5s6 2 6 5.5" />
        <path d="M14 15c2.6.3 4 1.9 4.3 4.2" />
      </>
    ),
  },
  {
    to: '/integrations',
    navKey: 'nav.integrations',
    descKey: 'dashboard.tile.integrations',
    roles: ['admin'],
    icon: (
      <>
        <path d="M9 3v4M15 3v4M6 7h12v3a6 6 0 0 1-6 6 6 6 0 0 1-6-6V7z" />
        <path d="M12 16v5" />
      </>
    ),
  },
]

export function DashboardPage() {
  const { user } = useAuth()
  const { t, i18n } = useTranslation()

  const dashboardQuery = useAnalyticsDashboard()

  const visibleTiles = useMemo(
    () => TILES.filter((tile) => !tile.roles || (!!user && tile.roles.includes(user.role))),
    [user],
  )

  // Раніше це вважалось з useAllTasks() — окремого капованого (до 100
  // задач) запиту, відфільтрованого й відсортованого в браузері. Задача
  // з найближчим терміном могла опинитись у рядку 101 і ніколи сюди не
  // потрапити. Тепер бекенд рахує ті самі топ-5 із УСІХ задач одразу в
  // /analytics/dashboard (дивись AnalyticsService.getDashboard) — і цей
  // самий запит вже й так завантажується вище для KPI-плиток, тож це не
  // додатковий запит, а той самий.
  const upcomingTasks = dashboardQuery.data?.tasks.upcoming ?? []

  const formatAmount = (amount: number) => formatMoney(amount, i18n.language)

  const today = todayLocalISO()
  const data = dashboardQuery.data

  return (
    <Page>
      <div className="dashboard-hero">
        <h1>{t('dashboard.welcome', { name: user?.firstName })}</h1>
        <p className="subtitle">{t('dashboard.subtitle')}</p>

        {dashboardQuery.isPending && <p>{t('common.loading')}</p>}
        {dashboardQuery.isError && (
          <p className="form-error">
            {dashboardQuery.error instanceof ApiError
              ? dashboardQuery.error.message
              : t('dashboard.loadError')}
          </p>
        )}

        {dashboardQuery.isSuccess && data && (
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
              <span className="detail-label">{t('analytics.kpi.pendingPayments')}</span>
              <span className="analytics-kpi-value">{formatAmount(data.payments.totalPending)}</span>
            </div>
            <div className="analytics-kpi">
              <span className="detail-label">{t('analytics.kpi.overdueTasks')}</span>
              <span className="analytics-kpi-value analytics-kpi-negative">{data.tasks.overdue}</span>
            </div>
          </div>
        )}
      </div>

      <Card title={t('dashboard.quickAccessTitle')}>
        <div className="dashboard-tiles">
          {visibleTiles.map((tile) => (
            <Link key={tile.to} to={tile.to} className="dashboard-tile">
              <svg
                className="dashboard-tile-icon"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                {tile.icon}
              </svg>
              <span className="dashboard-tile-title">{t(tile.navKey)}</span>
              <span className="dashboard-tile-desc">{t(tile.descKey)}</span>
            </Link>
          ))}
        </div>
      </Card>

      <Card
        title={t('dashboard.upcomingTasksTitle')}
        actions={
          <Link to="/tasks" className="text-link">
            {t('dashboard.viewAll')}
          </Link>
        }
      >
        {upcomingTasks.length === 0 && (
          <p className="subtitle">{t('dashboard.noUpcomingTasks')}</p>
        )}

        {upcomingTasks.length > 0 && (
          <ul className="dashboard-task-list">
            {upcomingTasks.map((task) => {
              const isOverdue = !!task.dueDate && task.dueDate < today
              return (
                <li key={task.id} className="dashboard-task-item">
                  <span className="dashboard-task-title">{task.title}</span>
                  {task.client && (
                    <Link to={`/clients/${task.client.id}`} className="text-link">
                      {task.client.firstName} {task.client.lastName}
                    </Link>
                  )}
                  <span className={isOverdue ? 'task-overdue' : 'dashboard-task-due'}>
                    {task.dueDate ?? '—'}
                  </span>
                </li>
              )
            })}
          </ul>
        )}
      </Card>
    </Page>
  )
}
