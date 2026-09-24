import { useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { ApiError } from '../../shared/api/http'
import { Card } from '../../shared/components/Card'
import { Page } from '../../shared/components/Page'
import { QueryStatus } from '../../shared/components/QueryStatus'
import { downloadCsv } from '../../shared/utils/csv'
import { formatMoney } from '../../shared/utils/money'
import { useAuth } from '../auth/AuthContext'
import { useAllClients } from '../clients/hooks'
import { useAllUsers } from '../users/hooks'
import { DealBoard } from './components/DealBoard'
import { DealForm } from './components/DealForm'
import { emptyDealForm, toCreateDealDto, type DealFormValues } from './dealForm'
import type { Deal, DealStage } from './api'
import { exportAllDeals, useAllDeals, useCreateDeal, useUpdateDeal } from './hooks'

export function DealsPage() {
  const { token, user } = useAuth()
  const { t, i18n } = useTranslation()

  const dealsQuery = useAllDeals()
  const clientsQuery = useAllClients()
  const managersQuery = useAllUsers()
  const createDeal = useCreateDeal()
  const updateDeal = useUpdateDeal()

  const deals = dealsQuery.data?.data ?? []
  const clients = clientsQuery.data?.data ?? []
  const managers = managersQuery.data?.data ?? []

  const [form, setForm] = useState<DealFormValues>(emptyDealForm)
  const [formError, setFormError] = useState<string | null>(null)
  const [isExporting, setIsExporting] = useState(false)

  // per-card "moving stage" flag so only the card being moved shows a
  // disabled select, instead of freezing the whole board on every move
  const [movingDealId, setMovingDealId] = useState<string | null>(null)

  // the pipeline is shown as a carousel — one stage at a time — instead
  // of a row of six columns, which reads much better on narrow screens
  // and keeps focus on one stage at a time
  const [activeStageIndex, setActiveStageIndex] = useState(0)

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
    try {
      await updateDeal.mutateAsync({ id: deal.id, dto: { stage } })
    } catch {
      // the mutation's onError already rolled the optimistic change back
    } finally {
      setMovingDealId(null)
    }
  }

  const formatAmount = (amount: number) => formatMoney(amount, i18n.language)

  const exportDeals = async () => {
    if (!token) return
    setIsExporting(true)
    try {
      const all = await exportAllDeals(token)
      downloadCsv(
        'deals.csv',
        all.map((d) => ({
          title: d.title,
          amount: d.amount,
          stage: t(`deals.stage.${d.stage}`),
          client: `${d.client.firstName} ${d.client.lastName}`,
          assignedTo: d.assignedTo ? `${d.assignedTo.firstName} ${d.assignedTo.lastName}` : '',
        })),
      )
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <Page title={t('deals.title')}>
      <Card title={t('deals.addTitle')}>
        {clients.length === 0 && !dealsQuery.isPending && (
          <p className="subtitle">{t('deals.noClientsHint')}</p>
        )}
        <DealForm
          values={form}
          onChange={setForm}
          clients={clients}
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
            deals.length > 0 && (
              <button type="button" onClick={exportDeals} disabled={isExporting}>
                {t('common.exportCsv')}
              </button>
            )
          }
        >
          <DealBoard
            deals={deals}
            activeStageIndex={activeStageIndex}
            onActiveStageIndexChange={setActiveStageIndex}
            movingDealId={movingDealId}
            onStageChange={handleStageChange}
            formatAmount={formatAmount}
          />
        </Card>
      </QueryStatus>
    </Page>
  )
}
