import { useMemo, useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { ApiError } from '../../shared/api/http'
import { Card } from '../../shared/components/Card'
import { Page } from '../../shared/components/Page'
import { QueryStatus } from '../../shared/components/QueryStatus'
import { downloadCsv } from '../../shared/utils/csv'
import { useAuth } from '../auth/AuthContext'
import { useAllDeals } from '../deals/hooks'
import { PaymentForm } from './components/PaymentForm'
import { PaymentTable } from './components/PaymentTable'
import { emptyPaymentForm, toCreatePaymentDto, type PaymentFormValues } from './paymentForm'
import type { Payment } from './api'
import { exportAllPayments, useAllPayments, useCreatePayment, useUpdatePayment } from './hooks'

// A stable reference for the "no data yet" fallback — see TasksPage's
// EMPTY_TASKS for why this matters for the useMemo below.
const EMPTY_PAYMENTS: Payment[] = []

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

  const [form, setForm] = useState<PaymentFormValues>(emptyPaymentForm)
  const [formError, setFormError] = useState<string | null>(null)
  const [isExporting, setIsExporting] = useState(false)

  const [markingPaidId, setMarkingPaidId] = useState<string | null>(null)

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setFormError(null)
    try {
      await createPayment.mutateAsync(toCreatePaymentDto(form))
      setForm(emptyPaymentForm)
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : t('payments.createError'))
    }
  }

  const markPaid = async (payment: Payment) => {
    setMarkingPaidId(payment.id)
    try {
      await updatePayment.mutateAsync({ id: payment.id, dto: { status: 'paid', paidAt: todayStr() } })
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
    const pending = payments.filter((p) => p.status === 'pending').reduce((sum, p) => sum + p.amount, 0)
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
    <Page title={t('payments.title')}>
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

      <Card title={t('payments.addTitle')}>
        {deals.length === 0 && !paymentsQuery.isPending && (
          <p className="subtitle">{t('payments.noDealsHint')}</p>
        )}
        <PaymentForm
          values={form}
          onChange={setForm}
          deals={deals}
          onSubmit={handleSubmit}
          isSubmitting={createPayment.isPending}
          error={formError}
        />
      </Card>

      <Card
        title={t('payments.listTitle')}
        actions={
          payments.length > 0 && (
            <button type="button" onClick={exportPayments} disabled={isExporting}>
              {t('common.exportCsv')}
            </button>
          )
        }
      >
        <QueryStatus
          query={paymentsQuery}
          loadingText={t('payments.loading')}
          errorFallback={t('payments.loadError')}
          isEmpty={payments.length === 0}
          emptyText={t('payments.empty')}
        >
          <PaymentTable
            payments={payments}
            formatAmount={formatAmount}
            markingPaidId={markingPaidId}
            onMarkPaid={markPaid}
          />
        </QueryStatus>
      </Card>
    </Page>
  )
}
