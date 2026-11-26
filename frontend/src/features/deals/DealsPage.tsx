import { useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { ApiError, messageFrom } from '../../shared/api/http'
import { Banner } from '../../shared/components/Banner'
import { Card } from '../../shared/components/Card'
import { FormError } from '../../shared/components/FormError'
import { Page } from '../../shared/components/Page'
import { QueryStatus } from '../../shared/components/QueryStatus'
import { downloadCsv } from '../../shared/utils/csv'
import { formatMoney } from '../../shared/utils/money'
import { useAnalyticsDashboard } from '../analytics/hooks'
import { useAuth } from '../auth/AuthContext'
import { useClients } from '../clients/hooks'
import { useAllUsers } from '../users/hooks'
import { DealBoard } from './components/DealBoard'
import { DealForm } from './components/DealForm'
import { emptyDealForm, toCreateDealDto, type DealFormValues } from './dealForm'
import { DEAL_STAGE_ORDER, type Deal, type DealStage } from './api'
import { exportAllDeals, useCreateDeal, useDeals, useUpdateDeal } from './hooks'

// Карток на одну сторінку колонки канбану.
const KANBAN_PAGE_SIZE = 20

export function DealsPage() {
  const { token, user } = useAuth()
  const { t, i18n } = useTranslation()

  // the pipeline is shown as a carousel — one stage at a time — instead
  // of a row of six columns, which reads much better on narrow screens
  // and keeps focus on one stage at a time. Each stage is loaded (and
  // paginated) on its own, so every card of every stage is reachable.
  const [activeStageIndex, setActiveStageIndex] = useState(0)
  const [stagePage, setStagePage] = useState(1)
  const dealsQuery = useDeals({
    stage: DEAL_STAGE_ORDER[activeStageIndex],
    page: stagePage,
    limit: KANBAN_PAGE_SIZE,
  })
  // Легкий запит лише щоб дізнатись, чи є взагалі хоч один клієнт (для
  // підказки "спершу додайте клієнта") — не 100 клієнтів заради однієї
  // перевірки "> 0", як було раніше через useAllClients().
  const hasClientsQuery = useClients({ limit: 1 })
  const managersQuery = useAllUsers()
  const analyticsQuery = useAnalyticsDashboard()
  const createDeal = useCreateDeal()
  const updateDeal = useUpdateDeal()

  const deals = dealsQuery.data?.data ?? []
  const hasAnyDeals = (analyticsQuery.data?.deals.totalCount ?? deals.length) > 0
  const managers = managersQuery.data?.data ?? []
  const hasClients = (hasClientsQuery.data?.meta.total ?? 0) > 0

  const [form, setForm] = useState<DealFormValues>(emptyDealForm)
  const [formError, setFormError] = useState<string | null>(null)
  const [isExporting, setIsExporting] = useState(false)
  const [exportWarning, setExportWarning] = useState<string | null>(null)
  const [exportError, setExportError] = useState<string | null>(null)

  // per-card "moving stage" flag so only the card being moved shows a
  // disabled select, instead of freezing the whole board on every move
  const [movingDealId, setMovingDealId] = useState<string | null>(null)
  const [stageError, setStageError] = useState<string | null>(null)

  const changeStage = (index: number) => {
    setActiveStageIndex(index)
    setStagePage(1)
  }

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setFormError(null)
    try {
      await createDeal.mutateAsync(toCreateDealDto(form))
      setForm(emptyDealForm)
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : t('deals.createError'))
    }
  }

  const handleStageChange = async (deal: Deal, stage: DealStage) => {
    if (stage === deal.stage) return
    setMovingDealId(deal.id)
    setStageError(null)
    try {
      await updateDeal.mutateAsync({ id: deal.id, dto: { stage } })
    } catch (err) {
      // the mutation's onError already rolled the optimistic change back —
      // this line just explains *why* the card snapped back instead of
      // leaving the user to wonder and click it again.
      setStageError(messageFrom(err, t('deals.stageChangeError')))
    } finally {
      setMovingDealId(null)
    }
  }

  const formatAmount = (amount: number) => formatMoney(amount, i18n.language)

  const exportDeals = async () => {
    if (!token) return
    setIsExporting(true)
    setExportWarning(null)
    setExportError(null)
    try {
      const { rows, truncated, total } = await exportAllDeals(token)
      downloadCsv(
        'deals.csv',
        rows.map((d) => ({
          title: d.title,
          amount: d.amount,
          stage: t(`deals.stage.${d.stage}`),
          client: `${d.client.firstName} ${d.client.lastName}`,
          assignedTo: d.assignedTo ? `${d.assignedTo.firstName} ${d.assignedTo.lastName}` : '',
        })),
      )
      if (truncated) {
        setExportWarning(t('common.exportTruncated', { count: rows.length, total }))
      }
    } catch (err) {
      setExportError(messageFrom(err, t('common.exportError')))
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <Page title={t('deals.title')}>
      <Card title={t('deals.addTitle')}>
        {!hasClients && !hasClientsQuery.isPending && <p className="subtitle">{t('deals.noClientsHint')}</p>}
        <DealForm
          values={form}
          onChange={setForm}
          managers={managers}
          currentUserFirstName={user?.firstName}
          onSubmit={handleSubmit}
          isSubmitting={createDeal.isPending}
          error={formError}
        />
      </Card>

      <QueryStatus query={dealsQuery} loadingText={t('deals.loading')} errorFallback={t('deals.loadError')}>
        <Card
          title={t('deals.pipelineTitle')}
          className="kanban-carousel"
          actions={
            hasAnyDeals && (
              <button type="button" onClick={exportDeals} disabled={isExporting}>
                {t('common.exportCsv')}
              </button>
            )
          }
        >
          {exportWarning && <Banner>{exportWarning}</Banner>}
          {exportError && <FormError>{exportError}</FormError>}
          {stageError && <FormError>{stageError}</FormError>}
          <DealBoard
            deals={deals}
            stageStats={analyticsQuery.data?.deals.byStage ?? []}
            activeStageIndex={activeStageIndex}
            onActiveStageIndexChange={changeStage}
            pageMeta={dealsQuery.data?.meta}
            onPageChange={setStagePage}
            isStageLoading={dealsQuery.isPlaceholderData}
            movingDealId={movingDealId}
            onStageChange={handleStageChange}
            formatAmount={formatAmount}
          />
        </Card>
      </QueryStatus>
    </Page>
  )
}
