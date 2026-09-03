import { useEffect, useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import {
  api,
  ApiError,
  DEAL_STAGE_ORDER,
  type Client,
  type Deal,
  type DealStage,
  type PublicUser,
} from '../api/client'
import { useAuth } from '../auth/AuthContext'

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

  const [deals, setDeals] = useState<Deal[]>([])
  const [isLoadingDeals, setIsLoadingDeals] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)

  const [clients, setClients] = useState<Client[]>([])
  const [managers, setManagers] = useState<PublicUser[]>([])

  const [form, setForm] = useState(emptyForm)
  const [formError, setFormError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // per-card "moving stage" flag so only the card being moved shows a
  // disabled select, instead of freezing the whole board on every move
  const [movingDealId, setMovingDealId] = useState<string | null>(null)

  const loadDeals = () => {
    if (!token) return
    setIsLoadingDeals(true)
    api
      .listDeals(token)
      .then(setDeals)
      .catch((err: unknown) => {
        setLoadError(err instanceof ApiError ? err.message : t('deals.loadError'))
      })
      .finally(() => setIsLoadingDeals(false))
  }

  useEffect(loadDeals, [token])

  useEffect(() => {
    if (!token) return
    api.listClients(token).then(setClients).catch(() => {
      // the client dropdown just stays empty — the form still shows a
      // clear "no clients yet" hint below
    })
    api.listUsers(token).then(setManagers).catch(() => {
      // the manager dropdown just falls back to "assign to me" — not fatal
    })
  }, [token])

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    if (!token) return
    setFormError(null)
    setIsSubmitting(true)
    try {
      await api.createDeal(token, {
        title: form.title,
        amount: Number(form.amount),
        clientId: form.clientId,
        assignedToId: form.assignedToId || undefined,
        notes: form.notes || undefined,
      })
      setForm(emptyForm)
      loadDeals()
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : t('deals.createError'))
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleStageChange = async (deal: Deal, stage: DealStage) => {
    if (!token || stage === deal.stage) return
    setMovingDealId(deal.id)
    // optimistic update so the card jumps to its new column immediately
    setDeals((prev) => prev.map((d) => (d.id === deal.id ? { ...d, stage } : d)))
    try {
      await api.updateDeal(token, deal.id, { stage })
    } catch {
      // roll back on failure — the move didn't actually happen
      setDeals((prev) => prev.map((d) => (d.id === deal.id ? { ...d, stage: deal.stage } : d)))
    } finally {
      setMovingDealId(null)
    }
  }

  const formatAmount = (amount: number) =>
    amount.toLocaleString(i18n.language === 'uk' ? 'uk-UA' : 'en-US', {
      maximumFractionDigits: 2,
    }) + (i18n.language === 'uk' ? ' грн' : ' UAH')

  const dealsByStage = (stage: DealStage) => deals.filter((d) => d.stage === stage)

  return (
    <div className="users-page">
      <h1>{t('deals.title')}</h1>

      <section className="card">
        <h2>{t('deals.addTitle')}</h2>
        {clients.length === 0 && !isLoadingDeals && (
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

          <button type="submit" disabled={isSubmitting || clients.length === 0}>
            {isSubmitting ? t('deals.submitting') : t('deals.submit')}
          </button>
        </form>
      </section>

      {isLoadingDeals && <p>{t('deals.loading')}</p>}
      {loadError && <p className="form-error">{loadError}</p>}

      {!isLoadingDeals && !loadError && (
        <div className="kanban-board">
          {DEAL_STAGE_ORDER.map((stage) => {
            const stageDeals = dealsByStage(stage)
            const total = stageDeals.reduce((sum, d) => sum + d.amount, 0)
            return (
              <div key={stage} className="kanban-column">
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
            )
          })}
        </div>
      )}
    </div>
  )
}
