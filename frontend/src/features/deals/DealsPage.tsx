import { useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { ApiError } from '../../shared/api/http'
import { downloadCsv } from '../../shared/utils/csv'
import { useAuth } from '../auth/AuthContext'
import { useAllClients } from '../clients/hooks'
import { useAllUsers } from '../users/hooks'
import { DEAL_STAGE_ORDER, type Deal, type DealStage } from './api'
import { exportAllDeals, useAllDeals, useCreateDeal, useUpdateDeal } from './hooks'

const emptyForm = {
  title: '',
  amount: '',
  clientId: '',
  assignedToId: '',
  notes: '',
}

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

  const [form, setForm] = useState(emptyForm)
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
      await createDeal.mutateAsync({
        title: form.title,
        amount: Number(form.amount),
        clientId: form.clientId,
        assignedToId: form.assignedToId || undefined,
        notes: form.notes || undefined,
      })
      setForm(emptyForm)
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

  const formatAmount = (amount: number) =>
    amount.toLocaleString(i18n.language === 'uk' ? 'uk-UA' : 'en-US', {
      maximumFractionDigits: 2,
    }) + (i18n.language === 'uk' ? ' грн' : ' UAH')

  const dealsByStage = (stage: DealStage) => deals.filter((d) => d.stage === stage)

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
    <div className="users-page">
      <h1>{t('deals.title')}</h1>

      <section className="card">
        <h2>{t('deals.addTitle')}</h2>
        {clients.length === 0 && !dealsQuery.isPending && (
          <p className="subtitle">{t('deals.noClientsHint')}</p>
        )}
        <form className="user-form" onSubmit={handleSubmit}>
          <label>
            {t('deals.field.title')}
            <input
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              required
              maxLength={200}
            />
          </label>

          <div className="form-row">
            <label>
              {t('deals.field.amount')}
              <input
                type="number"
                min="0"
                step="0.01"
                value={form.amount}
                onChange={(e) => setForm({ ...form, amount: e.target.value })}
                required
              />
            </label>
            <label>
              {t('deals.field.client')}
              <select
                value={form.clientId}
                onChange={(e) => setForm({ ...form, clientId: e.target.value })}
                required
              >
                <option value="" disabled>
                  {t('deals.field.selectClient')}
                </option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.firstName} {c.lastName}
                    {c.salonName ? ` — ${c.salonName}` : ''}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <label>
            {t('deals.field.assignedTo')}
            <select
              value={form.assignedToId}
              onChange={(e) => setForm({ ...form, assignedToId: e.target.value })}
            >
              <option value="">{t('clients.assignedToMe', { name: user?.firstName })}</option>
              {managers.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.firstName} {m.lastName}
                </option>
              ))}
            </select>
          </label>

          <label>
            {t('deals.field.notes')}
            <textarea
              rows={2}
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              maxLength={2000}
            />
          </label>

          {formError && <p className="form-error">{formError}</p>}

          <button type="submit" disabled={createDeal.isPending || clients.length === 0}>
            {createDeal.isPending ? t('deals.submitting') : t('deals.submit')}
          </button>
        </form>
      </section>

      {dealsQuery.isPending && <p>{t('deals.loading')}</p>}
      {dealsQuery.isError && (
        <p className="form-error">
          {dealsQuery.error instanceof ApiError ? dealsQuery.error.message : t('deals.loadError')}
        </p>
      )}

      {dealsQuery.isSuccess && (
        <section className="card kanban-carousel">
          <div className="task-filter-row">
            <h2>{t('deals.pipelineTitle')}</h2>
            {deals.length > 0 && (
              <button type="button" onClick={exportDeals} disabled={isExporting}>
                {t('common.exportCsv')}
              </button>
            )}
          </div>

          <div className="kanban-tabs">
            {DEAL_STAGE_ORDER.map((stage, index) => (
              <button
                key={stage}
                type="button"
                className={`kanban-tab ${index === activeStageIndex ? 'active' : ''}`}
                onClick={() => setActiveStageIndex(index)}
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
              onClick={() => setActiveStageIndex((i) => Math.max(0, i - 1))}
              disabled={activeStageIndex === 0}
              aria-label={t('deals.carousel.prev')}
            >
              ‹
            </button>

            {(() => {
              const stage = DEAL_STAGE_ORDER[activeStageIndex]
              const stageDeals = dealsByStage(stage)
              const total = stageDeals.reduce((sum, d) => sum + d.amount, 0)
              return (
                <div className="kanban-column kanban-column-active">
                  <div className="kanban-column-header">
                    <span>{t(`deals.stage.${stage}`)}</span>
                    <span className="kanban-column-count">{stageDeals.length}</span>
                  </div>
                  {stageDeals.length > 0 && (
                    <div className="kanban-column-total">{formatAmount(total)}</div>
                  )}
                  {stageDeals.length === 0 && (
                    <p className="kanban-empty">{t('deals.emptyColumn')}</p>
                  )}
                  <div className="kanban-column-cards">
                    {stageDeals.map((deal) => (
                      <div key={deal.id} className="kanban-card">
                        <div className="kanban-card-title">{deal.title}</div>
                        <div className="kanban-card-amount">{formatAmount(deal.amount)}</div>
                        <Link to={`/clients/${deal.client.id}`} className="text-link">
                          {deal.client.firstName} {deal.client.lastName}
                        </Link>
                        <div className="kanban-card-manager">
                          {deal.assignedTo
                            ? `${deal.assignedTo.firstName} ${deal.assignedTo.lastName}`
                            : '—'}
                        </div>
                        <select
                          value={deal.stage}
                          disabled={movingDealId === deal.id}
                          onChange={(e) => handleStageChange(deal, e.target.value as DealStage)}
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
            })()}

            <button
              type="button"
              className="kanban-nav-arrow"
              onClick={() =>
                setActiveStageIndex((i) => Math.min(DEAL_STAGE_ORDER.length - 1, i + 1))
              }
              disabled={activeStageIndex === DEAL_STAGE_ORDER.length - 1}
              aria-label={t('deals.carousel.next')}
            >
              ›
            </button>
          </div>
        </section>
      )}
    </div>
  )
}
