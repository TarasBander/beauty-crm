import { useMemo, useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { ApiError } from '../../shared/api/http'
import { downloadCsv } from '../../shared/utils/csv'
import { useAuth } from '../auth/AuthContext'
import { useAllDeals } from '../deals/hooks'
import type { Payment, PaymentMethod } from './api'
import { exportAllPayments, useAllPayments, useCreatePayment, useUpdatePayment } from './hooks'

const PAYMENT_METHODS: PaymentMethod[] = ['cash', 'card', 'bank_transfer']

// A stable reference for the "no data yet" fallback — see TasksPage's
// EMPTY_TASKS for why this matters for the useMemo below.
const EMPTY_PAYMENTS: Payment[] = []

const emptyForm = {
  dealId: '',
  amount: '',
  method: 'card' as PaymentMethod,
  notes: '',
}

function todayStr() {
  return new Date().toISOString().slice(0, 10)
}

export function PaymentsPage() {
  const { token } = useAuth()
  const { t, i18n } = useTranslation()

  const paymentsQuery = useAllPayments()
  const dealsQuery = useAllDeals()
  const createPayment = useCreatePayment()
  const updatePayment = useUpdatePayment()

  const payments = paymentsQuery.data?.data ?? EMPTY_PAYMENTS
  const deals = dealsQuery.data?.data ?? []

  const [form, setForm] = useState(emptyForm)
  const [formError, setFormError] = useState<string | null>(null)
  const [isExporting, setIsExporting] = useState(false)

  const [markingPaidId, setMarkingPaidId] = useState<string | null>(null)

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setFormError(null)
    try {
      await createPayment.mutateAsync({
        dealId: form.dealId,
        amount: Number(form.amount),
        method: form.method,
        notes: form.notes || undefined,
      })
      setForm(emptyForm)
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : t('payments.createError'))
    }
  }

  const markPaid = async (payment: (typeof payments)[number]) => {
    setMarkingPaidId(payment.id)
    try {
      await updatePayment.mutateAsync({
        id: payment.id,
        dto: { status: 'paid', paidAt: todayStr() },
      })
    } catch {
      // the mutation's onError already rolled the optimistic change back
    } finally {
      setMarkingPaidId(null)
    }
  }

  const formatAmount = (amount: number) =>
    amount.toLocaleString(i18n.language === 'uk' ? 'uk-UA' : 'en-US', {
      maximumFractionDigits: 2,
    }) + (i18n.language === 'uk' ? ' грн' : ' UAH')

  const totals = useMemo(() => {
    const paid = payments.filter((p) => p.status === 'paid').reduce((sum, p) => sum + p.amount, 0)
    const pending = payments
      .filter((p) => p.status === 'pending')
      .reduce((sum, p) => sum + p.amount, 0)
    return { paid, pending }
  }, [payments])

  const exportPayments = async () => {
    if (!token) return
    setIsExporting(true)
    try {
      const all = await exportAllPayments(token)
      downloadCsv(
        'payments.csv',
        all.map((p) => ({
          deal: p.deal.title,
          client: `${p.deal.client.firstName} ${p.deal.client.lastName}`,
          amount: p.amount,
          method: t(`payments.method.${p.method}`),
          status: t(`payments.status.${p.status}`),
          paidAt: p.paidAt ?? '',
        })),
      )
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <div className="users-page">
      <h1>{t('payments.title')}</h1>

      <div className="payments-summary">
        <div className="payments-summary-item payments-summary-paid">
          <span className="detail-label">{t('payments.summary.paid')}</span>
          <span>{formatAmount(totals.paid)}</span>
        </div>
        <div className="payments-summary-item payments-summary-pending">
          <span className="detail-label">{t('payments.summary.pending')}</span>
          <span>{formatAmount(totals.pending)}</span>
        </div>
      </div>

      <section className="card">
        <h2>{t('payments.addTitle')}</h2>
        {deals.length === 0 && !paymentsQuery.isPending && (
          <p className="subtitle">{t('payments.noDealsHint')}</p>
        )}
        <form className="user-form" onSubmit={handleSubmit}>
          <label>
            {t('payments.field.deal')}
            <select
              value={form.dealId}
              onChange={(e) => setForm({ ...form, dealId: e.target.value })}
              required
            >
              <option value="" disabled>
                {t('payments.field.selectDeal')}
              </option>
              {deals.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.title} — {d.client.firstName} {d.client.lastName}
                </option>
              ))}
            </select>
          </label>

          <div className="form-row">
            <label>
              {t('payments.field.amount')}
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
              {t('payments.field.method')}
              <select
                value={form.method}
                onChange={(e) => setForm({ ...form, method: e.target.value as PaymentMethod })}
              >
                {PAYMENT_METHODS.map((m) => (
                  <option key={m} value={m}>
                    {t(`payments.method.${m}`)}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <label>
            {t('payments.field.notes')}
            <textarea
              rows={2}
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              maxLength={2000}
            />
          </label>

          {formError && <p className="form-error">{formError}</p>}

          <button type="submit" disabled={createPayment.isPending || deals.length === 0}>
            {createPayment.isPending ? t('payments.submitting') : t('payments.submit')}
          </button>
        </form>
      </section>

      <section className="card">
        <div className="task-filter-row">
          <h2>{t('payments.listTitle')}</h2>
          {payments.length > 0 && (
            <button type="button" onClick={exportPayments} disabled={isExporting}>
              {t('common.exportCsv')}
            </button>
          )}
        </div>
        {paymentsQuery.isPending && <p>{t('payments.loading')}</p>}
        {paymentsQuery.isError && (
          <p className="form-error">
            {paymentsQuery.error instanceof ApiError ? paymentsQuery.error.message : t('payments.loadError')}
          </p>
        )}
        {paymentsQuery.isSuccess && payments.length === 0 && (
          <p className="subtitle">{t('payments.empty')}</p>
        )}
        {paymentsQuery.isSuccess && payments.length > 0 && (
          <div className="table-scroll">
          <table className="users-table">
            <thead>
              <tr>
                <th>{t('payments.columns.deal')}</th>
                <th>{t('payments.columns.amount')}</th>
                <th>{t('payments.columns.method')}</th>
                <th>{t('payments.columns.status')}</th>
                <th>{t('payments.columns.paidAt')}</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {payments.map((p) => (
                <tr key={p.id}>
                  <td>
                    <Link to={`/clients/${p.deal.client.id}`} className="text-link">
                      {p.deal.title}
                    </Link>
                  </td>
                  <td>{formatAmount(p.amount)}</td>
                  <td>{t(`payments.method.${p.method}`)}</td>
                  <td>
                    <span className={`payment-status-badge payment-status-${p.status}`}>
                      {t(`payments.status.${p.status}`)}
                    </span>
                  </td>
                  <td>{p.paidAt ?? '—'}</td>
                  <td>
                    {p.status === 'pending' && (
                      <button
                        type="button"
                        onClick={() => markPaid(p)}
                        disabled={markingPaidId === p.id}
                      >
                        {t('payments.markPaid')}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        )}
      </section>
    </div>
  )
}
