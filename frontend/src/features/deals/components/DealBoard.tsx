import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import type { PaginationMeta } from '../../../shared/api/http'
import { Pagination } from '../../../shared/components/Pagination'
import { DEAL_STAGE_ORDER, type Deal, type DealStage } from '../api'
import type { DealStageStat } from '../../analytics/api'

interface DealBoardProps {
  /** Одна сторінка карток АКТИВНОЇ стадії (DealsPage вантажить кожну стадію окремо). */
  deals: Deal[]
  // Кількість і сума по кожній стадії — з /analytics/dashboard, по всіх
  // угодах у базі (а не з однієї сторінки карток).
  stageStats: DealStageStat[]
  activeStageIndex: number
  onActiveStageIndexChange: (index: number) => void
  pageMeta: PaginationMeta | undefined
  onPageChange: (page: number) => void
  /** true, поки вантажиться інша стадія чи сторінка — на екрані ще попередні картки. */
  isStageLoading: boolean
  movingDealId: string | null
  onStageChange: (deal: Deal, stage: DealStage) => void
  formatAmount: (amount: number) => string
}

/**
 * Воронка угод: вкладки-стадії + карусель, що показує одну стадію за
 * раз (краще читається на вузьких екранах, ніж ряд із шести колонок).
 * DealsPage лишає собі тільки форму створення та управління станом
 * (яка стадія активна, яка картка зараз "переїжджає").
 */
// id-и для зв'язку ARIA tabs/tabpanel — той самий однин tabpanel (кожна
// вкладка показує одну стадію за раз через карусель, не окрему панель
// на кожну), тож достатньо одного фіксованого id.
const TABPANEL_ID = 'kanban-active-panel'
const tabId = (stage: DealStage) => `kanban-tab-${stage}`

interface KanbanColumnProps {
  stage: DealStage
  deals: Deal[]
  stats: DealStageStat
  pageMeta: PaginationMeta | undefined
  onPageChange: (page: number) => void
  isLoading: boolean
  movingDealId: string | null
  onStageChange: (deal: Deal, stage: DealStage) => void
  formatAmount: (amount: number) => string
}

/**
 * Раніше це був анонімний `<div>` прямо всередині DealBoard — виглядало
 * як розмітка, а не як компонент, і рахувало cardsMissing/пусто щоразу
 * при кожному рендері. Тепер це справжній компонент з власними
 * пропсами: React DevTools бачить "KanbanColumn", а не безіменний div,
 * і DealBoard нижче лишається тонким — вибір активної стадії плюс
 * рендер однієї колонки.
 */
function KanbanColumn({
  stage,
  deals,
  stats,
  pageMeta,
  onPageChange,
  isLoading,
  movingDealId,
  onStageChange,
  formatAmount,
}: KanbanColumnProps) {
  const { t } = useTranslation()
  // Картка, яку щойно перевели в іншу стадію, зникає з колонки одразу
  // (оптимістичне оновлення), не чекаючи перезавантаження сторінки.
  const cards = deals.filter((deal) => deal.stage === stage)

  return (
    <div
      className={isLoading ? 'kanban-column kanban-column-active is-stale' : 'kanban-column kanban-column-active'}
      aria-busy={isLoading}
      role="tabpanel"
      id={TABPANEL_ID}
      aria-labelledby={tabId(stage)}
      tabIndex={0}
    >
      <div className="kanban-column-header">
        <span>{t(`deals.stage.${stage}`)}</span>
        <span className="kanban-column-count">{stats.count}</span>
      </div>
      {stats.count > 0 && <div className="kanban-column-total">{formatAmount(stats.amount)}</div>}
      {cards.length === 0 && (
        <p className="kanban-empty">{isLoading ? t('deals.loading') : t('deals.emptyColumn')}</p>
      )}
      <div className="kanban-column-cards">
        {cards.map((deal) => (
          <div key={deal.id} className="kanban-card">
            <div className="kanban-card-title">{deal.title}</div>
            <div className="kanban-card-amount">{formatAmount(deal.amount)}</div>
            <Link to={`/clients/${deal.client.id}`} className="text-link">
              {deal.client.firstName} {deal.client.lastName}
            </Link>
            <div className="kanban-card-manager">
              {deal.assignedTo ? `${deal.assignedTo.firstName} ${deal.assignedTo.lastName}` : '—'}
            </div>
            <select
              value={deal.stage}
              disabled={movingDealId === deal.id}
              onChange={(e) => onStageChange(deal, e.target.value as DealStage)}
            >
              {DEAL_STAGE_ORDER.map((s) => (
                <option key={s} value={s}>
                  {t(`deals.stage.${s}`)}
                </option>
              ))}
            </select>
          </div>
        ))}
      </div>
      {pageMeta && (
        <Pagination
          page={pageMeta.page}
          totalPages={pageMeta.totalPages}
          total={pageMeta.total}
          onPageChange={onPageChange}
        />
      )}
    </div>
  )
}

export function DealBoard({
  deals,
  stageStats,
  activeStageIndex,
  onActiveStageIndexChange,
  pageMeta,
  onPageChange,
  isStageLoading,
  movingDealId,
  onStageChange,
  formatAmount,
}: DealBoardProps) {
  const { t } = useTranslation()

  const statsFor = (stage: DealStage) =>
    stageStats.find((s) => s.stage === stage) ?? { stage, count: 0, amount: 0 }
  const activeStage = DEAL_STAGE_ORDER[activeStageIndex]

  return (
    <>
      {/* ARIA tabs pattern (APG): tablist з tab-кнопками, що керують
          однією tabpanel нижче (KanbanColumn) через aria-controls /
          aria-labelledby — раніше це були просто кнопки без жодного
          зв'язку зі скрінрідером між "вкладкою" і вмістом під нею. */}
      <div className="kanban-tabs" role="tablist" aria-label={t('deals.pipelineTitle')}>
        {DEAL_STAGE_ORDER.map((stage, index) => (
          <button
            key={stage}
            type="button"
            id={tabId(stage)}
            role="tab"
            aria-selected={index === activeStageIndex}
            aria-controls={TABPANEL_ID}
            className={`kanban-tab ${index === activeStageIndex ? 'active' : ''}`}
            onClick={() => onActiveStageIndexChange(index)}
          >
            {t(`deals.stage.${stage}`)}
            <span className="kanban-tab-count">{statsFor(stage).count}</span>
          </button>
        ))}
      </div>

      <div className="kanban-carousel-viewport">
        <button
          type="button"
          className="kanban-nav-arrow"
          onClick={() => onActiveStageIndexChange(Math.max(0, activeStageIndex - 1))}
          disabled={activeStageIndex === 0}
          aria-label={t('deals.carousel.prev')}
        >
          ‹
        </button>

        <KanbanColumn
          stage={activeStage}
          deals={deals}
          stats={statsFor(activeStage)}
          pageMeta={pageMeta}
          onPageChange={onPageChange}
          isLoading={isStageLoading}
          movingDealId={movingDealId}
          onStageChange={onStageChange}
          formatAmount={formatAmount}
        />

        <button
          type="button"
          className="kanban-nav-arrow"
          onClick={() => onActiveStageIndexChange(Math.min(DEAL_STAGE_ORDER.length - 1, activeStageIndex + 1))}
          disabled={activeStageIndex === DEAL_STAGE_ORDER.length - 1}
          aria-label={t('deals.carousel.next')}
        >
          ›
        </button>
      </div>
    </>
  )
}
