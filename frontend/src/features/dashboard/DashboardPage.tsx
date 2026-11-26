import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { ApiError } from '../../shared/api/http'
import type { Role } from '../../shared/api/types'
import { BeautyIllustration } from '../../shared/components/BeautyIllustration'
import { Card } from '../../shared/components/Card'
import { FormError } from '../../shared/components/FormError'
import { Icon, type IconName } from '../../shared/components/Icon'
import { Page } from '../../shared/components/Page'
import { QueryStatus } from '../../shared/components/QueryStatus'
import { todayLocalISO } from '../../shared/utils/date'
import { formatMoney } from '../../shared/utils/money'
import { useAuth } from '../auth/AuthContext'
import { useAnalyticsDashboard } from '../analytics/hooks'

// roles: як і в Layout.tsx — undefined значить "плитка для всіх", інакше
// показуємо лише переліченим ролям. Без цього плитка на /users вела б
// менеджера просто на редірект назад сюди (AdminRoute у App.tsx).
const TILES: { to: string; navKey: string; descKey: string; icon: IconName; roles?: Role[] }[] = [
  { to: '/clients', navKey: 'nav.clients', descKey: 'dashboard.tile.clients', icon: 'clients' },
  { to: '/deals', navKey: 'nav.deals', descKey: 'dashboard.tile.deals', icon: 'deals' },
  { to: '/tasks', navKey: 'nav.tasks', descKey: 'dashboard.tile.tasks', icon: 'tasks' },
  { to: '/payments', navKey: 'nav.payments', descKey: 'dashboard.tile.payments', icon: 'payments' },
  { to: '/analytics', navKey: 'nav.analytics', descKey: 'dashboard.tile.analytics', icon: 'analytics' },
  { to: '/users', navKey: 'nav.users', descKey: 'dashboard.tile.users', icon: 'users', roles: ['admin'] },
  {
    to: '/integrations',
    navKey: 'nav.integrations',
    descKey: 'dashboard.tile.integrations',
    icon: 'integrations',
    roles: ['admin'],
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
        <div className="dashboard-hero-head">
          <div>
            <h1>{t('dashboard.welcome', { name: user?.firstName })}</h1>
            <p className="subtitle">{t('dashboard.subtitle')}</p>
          </div>
          <BeautyIllustration className="dashboard-hero-illustration" />
        </div>

        {dashboardQuery.isPending && <p>{t('common.loading')}</p>}
        {dashboardQuery.isError && (
          <FormError>
            {dashboardQuery.error instanceof ApiError
              ? dashboardQuery.error.message
              : t('dashboard.loadError')}
          </FormError>
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
              <span className="dashboard-tile-icon">
                <Icon name={tile.icon} />
              </span>
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
        {/* Раніше тут перевірявся лише upcomingTasks.length === 0 — поки
            dashboardQuery ще вантажиться, upcomingTasks теж [] (це
            плейсхолдер до відповіді), тож на мить показувалось "немає
            задач", а за секунду — п'ять задач. QueryStatus прибирає
            "порожньо" з переліку можливостей, поки запит ще в
            isPending/isError. */}
        <QueryStatus
          query={dashboardQuery}
          errorFallback={t('dashboard.loadError')}
          isEmpty={upcomingTasks.length === 0}
          emptyText={t('dashboard.noUpcomingTasks')}
        >
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
        </QueryStatus>
      </Card>
    </Page>
  )
}
