import type { FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import type { PublicUser } from '../../../shared/api/types'
import { ClientCombobox } from '../../clients/components/ClientCombobox'
import type { DealFormValues } from '../dealForm'

interface DealFormProps {
  values: DealFormValues
  onChange: (values: DealFormValues) => void
  managers: PublicUser[]
  currentUserFirstName?: string
  onSubmit: (event: FormEvent) => void
  isSubmitting: boolean
  error: string | null
}

/** Поля форми нової угоди — сама сторінка (DealsPage) відповідає за
 * стан, мутацію і підказку "спершу додайте клієнта". Клієнта шукають
 * через ClientCombobox (пошук на сервері), а не обирають зі
 * заздалегідь завантаженого списку — дивись SearchSelect.tsx. */
export function DealForm({
  values,
  onChange,
  managers,
  currentUserFirstName,
  onSubmit,
  isSubmitting,
  error,
}: DealFormProps) {
  const { t } = useTranslation()

  const set = <K extends keyof DealFormValues>(key: K, value: DealFormValues[K]) =>
    onChange({ ...values, [key]: value })

  return (
    <form className="crm-form" onSubmit={onSubmit}>
      <label>
        {t('deals.field.title')}
        <input value={values.title} onChange={(e) => set('title', e.target.value)} required maxLength={200} />
      </label>

      <div className="form-row">
        <label>
          {t('deals.field.amount')}
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
          {t('deals.field.client')}
          <ClientCombobox
            value={values.clientId}
            onChange={(id) => set('clientId', id)}
            placeholder={t('deals.field.selectClient')}
            required
          />
        </label>
      </div>

      <label>
        {t('deals.field.assignedTo')}
        <select value={values.assignedToId} onChange={(e) => set('assignedToId', e.target.value)}>
          <option value="">{t('clients.assignedToMe', { name: currentUserFirstName })}</option>
          {managers.map((m) => (
            <option key={m.id} value={m.id}>
              {m.firstName} {m.lastName}
            </option>
          ))}
        </select>
      </label>

      <label>
        {t('deals.field.notes')}
        <textarea rows={2} value={values.notes} onChange={(e) => set('notes', e.target.value)} maxLength={2000} />
      </label>

      {error && <p className="form-error">{error}</p>}

      <button type="submit" disabled={isSubmitting || !values.clientId}>
        {isSubmitting ? t('deals.submitting') : t('deals.submit')}
      </button>
    </form>
  )
}
