import { useMemo } from 'react'
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
// id-и для зв'язку ARIA tabs/tabpanel — той самий однин tabpanel (кожна
// вкладка показує одну стадію за раз через карусель, не окрему панель
// на кожну), тож достатньо одного фіксованого id.
const TABPANEL_ID = 'kanban-active-panel'
const tabId = (stage: DealStage) => `kanban-tab-${stage}`

interface KanbanColumnProps {
  stage: DealStage
  deals: Deal[]
  stats: DealStageStat
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
function KanbanColumn({ stage, deals, stats, movingDealId, onStageChange, formatAmount }: KanbanColumnProps) {
  const { t } = useTranslation()
  // Скільки карток цієї стадії реально завантажено проти скільки їх
  // насправді є (за аналітикою) — якщо картки не всі, кажемо про це
  // прямо замість того, щоб мовчки показати неповний стовпець.
  const cardsMissing = stats.count > deals.length

  return (
    <div
      className="kanban-column kanban-column-active"
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
      {cardsMissing && (
        <Banner>{t('deals.cardsIncomplete', { loaded: deals.length, total: stats.count })}</Banner>
      )}
      {deals.length === 0 && <p className="kanban-empty">{t('deals.emptyColumn')}</p>}
      <div className="kanban-column-cards">
        {deals.map((deal) => (
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
  )
}

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

  // Раніше `deals.filter((d) => d.stage === stage)` рахувалось заново
  // щоразу, коли викликали dealsByStage(stage) — на цей рендер лише
  // раз (для активної стадії), але при кожному рендері DealBoard. Тепер
  // один прохід по deals на рендер, згрупований одразу по всіх стадіях
  // — переключення вкладки бере вже готовий масив, не фільтрує повторно.
  const dealsByStage = useMemo(() => {
    const grouped = Object.fromEntries(DEAL_STAGE_ORDER.map((stage) => [stage, [] as Deal[]])) as Record<
      DealStage,
      Deal[]
    >
    for (const deal of deals) {
      grouped[deal.stage].push(deal)
    }
    return grouped
  }, [deals])

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
          deals={dealsByStage[activeStage]}
          stats={statsFor(activeStage)}
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
