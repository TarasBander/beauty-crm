import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { DEAL_STAGE_ORDER, type Deal, type DealStage } from '../api'

interface DealBoardProps {
  deals: Deal[]
  activeStageIndex: number
  onActiveStageIndexChange: (index: number) => void
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
export function DealBoard({
  deals,
  activeStageIndex,
  onActiveStageIndexChange,
  movingDealId,
  onStageChange,
  formatAmount,
}: DealBoardProps) {
  const { t } = useTranslation()

  const dealsByStage = (stage: DealStage) => deals.filter((d) => d.stage === stage)
  const activeStage = DEAL_STAGE_ORDER[activeStageIndex]
  const activeStageDeals = dealsByStage(activeStage)
  const activeStageTotal = activeStageDeals.reduce((sum, d) => sum + d.amount, 0)

  return (
    <>
      <div className="kanban-tabs">
        {DEAL_STAGE_ORDER.map((stage, index) => (
          <button
            key={stage}
            type="button"
            className={`kanban-tab ${index === activeStageIndex ? 'active' : ''}`}
            onClick={() => onActiveStageIndexChange(index)}
          >
            {t(`deals.stage.${stage}`)}
            <span className="kanban-tab-count">{dealsByStage(stage).length}</span>
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

        <div className="kanban-column kanban-column-active">
          <div className="kanban-column-header">
            <span>{t(`deals.stage.${activeStage}`)}</span>
            <span className="kanban-column-count">{activeStageDeals.length}</span>
          </div>
          {activeStageDeals.length > 0 && (
            <div className="kanban-column-total">{formatAmount(activeStageTotal)}</div>
          )}
          {activeStageDeals.length === 0 && <p className="kanban-empty">{t('deals.emptyColumn')}</p>}
          <div className="kanban-column-cards">
            {activeStageDeals.map((deal) => (
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
        </div>

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
