import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { Banner } from '../../../shared/components/Banner'
import { DEAL_STAGE_ORDER, type Deal, type DealStage } from '../api'
import type { DealStageStat } from '../../analytics/api'

interface DealBoardProps {
  deals: Deal[]
  // Кількість і сума по кожній стадії — з /analytics/dashboard, а НЕ
  // порахована тут із `deals`. `deals` — це капований список (до
  // SELECT_PAGE_SIZE = 100 карток на всі стадії разом), тож рахувати
  // "суму по стадії" з нього означало б показувати занижену суму, щойно
  // угод стає більше за ліміт. Аналітика бекенду рахує з УСІХ угод у
  // базі, тож ці числа завжди точні, навіть коли карток під ними
  // видно менше (дивись stageStats нижче).
  stageStats: DealStageStat[]
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
  stageStats,
  activeStageIndex,
  onActiveStageIndexChange,
  movingDealId,
  onStageChange,
  formatAmount,
}: DealBoardProps) {
  const { t } = useTranslation()

  const dealsByStage = (stage: DealStage) => deals.filter((d) => d.stage === stage)
  const statsFor = (stage: DealStage) =>
    stageStats.find((s) => s.stage === stage) ?? { stage, count: 0, amount: 0 }
  const activeStage = DEAL_STAGE_ORDER[activeStageIndex]
  const activeStageDeals = dealsByStage(activeStage)
  const activeStageStats = statsFor(activeStage)
  // Скільки карток цієї стадії реально завантажено проти скільки їх
  // насправді є (за аналітикою) — якщо картки не всі, кажемо про це
  // прямо замість того, щоб мовчки показати неповний стовпець.
  const activeStageCardsMissing = activeStageStats.count > activeStageDeals.length

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

        <div className="kanban-column kanban-column-active">
          <div className="kanban-column-header">
            <span>{t(`deals.stage.${activeStage}`)}</span>
            <span className="kanban-column-count">{activeStageStats.count}</span>
          </div>
          {activeStageStats.count > 0 && (
            <div className="kanban-column-total">{formatAmount(activeStageStats.amount)}</div>
          )}
          {activeStageCardsMissing && (
            <Banner>
              {t('deals.cardsIncomplete', { loaded: activeStageDeals.length, total: activeStageStats.count })}
            </Banner>
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
