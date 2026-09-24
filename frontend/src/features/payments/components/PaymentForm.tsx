import type { FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { DealCombobox } from '../../deals/components/DealCombobox'
import type { PaymentFormValues } from '../paymentForm'
import type { PaymentMethod } from '../api'

const PAYMENT_METHODS: PaymentMethod[] = ['cash', 'card', 'bank_transfer']

interface PaymentFormProps {
  values: PaymentFormValues
  onChange: (values: PaymentFormValues) => void
  onSubmit: (event: FormEvent) => void
  isSubmitting: boolean
  error: string | null
}

export function PaymentForm({ values, onChange, onSubmit, isSubmitting, error }: PaymentFormProps) {
  const { t } = useTranslation()

  const set = <K extends keyof PaymentFormValues>(key: K, value: PaymentFormValues[K]) =>
    onChange({ ...values, [key]: value })

  return (
    <form className="crm-form" onSubmit={onSubmit}>
      <label>
        {t('payments.field.deal')}
        <DealCombobox
          value={values.dealId}
          onChange={(id) => set('dealId', id)}
          placeholder={t('payments.field.selectDeal')}
          required
        />
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

      <button type="submit" disabled={isSubmitting || !values.dealId}>
        {isSubmitting ? t('payments.submitting') : t('payments.submit')}
      </button>
    </form>
  )
}
