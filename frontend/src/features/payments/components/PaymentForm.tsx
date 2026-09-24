import type { FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import type { Deal } from '../../deals/api'
import type { PaymentFormValues } from '../paymentForm'
import type { PaymentMethod } from '../api'

const PAYMENT_METHODS: PaymentMethod[] = ['cash', 'card', 'bank_transfer']

interface PaymentFormProps {
  values: PaymentFormValues
  onChange: (values: PaymentFormValues) => void
  deals: Deal[]
  onSubmit: (event: FormEvent) => void
  isSubmitting: boolean
  error: string | null
}

export function PaymentForm({ values, onChange, deals, onSubmit, isSubmitting, error }: PaymentFormProps) {
  const { t } = useTranslation()

  const set = <K extends keyof PaymentFormValues>(key: K, value: PaymentFormValues[K]) =>
    onChange({ ...values, [key]: value })

  return (
    <form className="user-form" onSubmit={onSubmit}>
      <label>
        {t('payments.field.deal')}
        <select value={values.dealId} onChange={(e) => set('dealId', e.target.value)} required>
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
            value={values.amount}
            onChange={(e) => set('amount', e.target.value)}
            required
          />
        </label>
        <label>
          {t('payments.field.method')}
          <select value={values.method} onChange={(e) => set('method', e.target.value as PaymentMethod)}>
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
        <textarea rows={2} value={values.notes} onChange={(e) => set('notes', e.target.value)} maxLength={2000} />
      </label>

      {error && <p className="form-error">{error}</p>}

      <button type="submit" disabled={isSubmitting || deals.length === 0}>
        {isSubmitting ? t('payments.submitting') : t('payments.submit')}
      </button>
    </form>
  )
}
