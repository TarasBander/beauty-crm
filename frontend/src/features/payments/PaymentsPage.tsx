import { useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { ApiError, messageFrom } from '../../shared/api/http'
import { Banner } from '../../shared/components/Banner'
import { Card } from '../../shared/components/Card'
import { FormError } from '../../shared/components/FormError'
import { Page } from '../../shared/components/Page'
import { Pagination } from '../../shared/components/Pagination'
import { QueryStatus } from '../../shared/components/QueryStatus'
import { downloadCsv } from '../../shared/utils/csv'
import { todayLocalISO } from '../../shared/utils/date'
import { formatMoney } from '../../shared/utils/money'
import { useAnalyticsDashboard } from '../analytics/hooks'
import { useAuth } from '../auth/AuthContext'
import { useDeals } from '../deals/hooks'
import { PaymentForm } from './components/PaymentForm'
import { PaymentTable } from './components/PaymentTable'
import { emptyPaymentForm, toCreatePaymentDto, type PaymentFormValues } from './paymentForm'
import type { Payment } from './api'
import { exportAllPayments, useCreatePayment, usePayments, useUpdatePayment } from './hooks'

export function PaymentsPage() {
  const { token } = useAuth()
  const { t, i18n } = useTranslation()

  const [page, setPage] = useState(1)
  const paymentsQuery = usePayments({ page })
  // Легкий запит лише щоб дізнатись, чи є взагалі хоч одна угода (для
  // підказки "спершу створіть угоду") — не 100 угод заради однієї
  // перевірки "> 0", як було раніше через useAllDeals().
  const hasDealsQuery = useDeals({ limit: 1 })
  // Отримано/очікується — з /analytics/dashboard, по всіх платежах у
  // базі, а не лише з поточної сторінки таблиці.
  const analyticsQuery = useAnalyticsDashboard()
  const createPayment = useCreatePayment()
  const updatePayment = useUpdatePayment()

  const payments = paymentsQuery.data?.data ?? []
  const meta = paymentsQuery.data?.meta
  const hasDeals = (hasDealsQuery.data?.meta.total ?? 0) > 0

  const [form, setForm] = useState<PaymentFormValues>(emptyPaymentForm)
  const [formError, setFormError] = useState<string | null>(null)
  const [isExporting, setIsExporting] = useState(false)
  const [exportWarning, setExportWarning] = useState<string | null>(null)
  const [exportError, setExportError] = useState<string | null>(null)

  const [markingPaidId, setMarkingPaidId] = useState<string | null>(null)
  const [markPaidError, setMarkPaidError] = useState<string | null>(null)

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
    setMarkPaidError(null)
    try {
      await updatePayment.mutateAsync({ id: payment.id, dto: { status: 'paid', paidAt: todayLocalISO() } })
    } catch (err) {
      // the mutation's onError already rolled the optimistic change back —
      // this just explains why the row snapped back to "pending".
      setMarkPaidError(messageFrom(err, t('payments.markPaidError')))
    } finally {
      setMarkingPaidId(null)
    }
  }

  const formatAmount = (amount: number) => formatMoney(amount, i18n.language)

  const totals = {
    paid: analyticsQuery.data?.payments.totalPaid ?? 0,
    pending: analyticsQuery.data?.payments.totalPending ?? 0,
  }

  const exportPayments = async () => {
    if (!token) return
    setIsExporting(true)
    setExportWarning(null)
    setExportError(null)
    try {
      const { rows, truncated, total } = await exportAllPayments(token)
      downloadCsv(
        'payments.csv',
        rows.map((p) => ({
          deal: p.deal.title,
          client: `${p.deal.client.firstName} ${p.deal.client.lastName}`,
          amount: p.amount,
          method: t(`payments.method.${p.method}`),
          status: t(`payments.status.${p.status}`),
          paidAt: p.paidAt ?? '',
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
        {!hasDeals && !hasDealsQuery.isPending && <p className="subtitle">{t('payments.noDealsHint')}</p>}
        <PaymentForm
          values={form}
          onChange={setForm}
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
        {exportWarning && <Banner>{exportWarning}</Banner>}
        {exportError && <FormError>{exportError}</FormError>}
        {markPaidError && <FormError>{markPaidError}</FormError>}
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
          {meta && (
            <Pagination page={meta.page} totalPages={meta.totalPages} total={meta.total} onPageChange={setPage} />
          )}
        </QueryStatus>
      </Card>
    </Page>
  )
}
