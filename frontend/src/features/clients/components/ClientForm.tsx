import type { FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import type { PublicUser } from '../../../shared/api/types'
import { FormError } from '../../../shared/components/FormError'
import type { ClientFormValues } from '../clientForm'

interface ClientFormProps {
  values: ClientFormValues
  onChange: (values: ClientFormValues) => void
  managers: PublicUser[]
  currentUserFirstName?: string
  onSubmit: (event: FormEvent) => void
  isSubmitting: boolean
  submitLabel: string
  submittingLabel: string
  error: string | null
  onCancel?: () => void
  cancelLabel?: string
}

/**
 * Самі поля форми клієнта — нічого не знає про те, звідки прийшли
 * values і куди піде onSubmit. ClientsPage дає їй порожній стан і
 * create-мутацію (create-клієнт), ClientDetailPage — заповнений стан і
 * update-мутацію (редагування) з кнопкою "Скасувати" (onCancel). Поля й
 * валідація в обох випадках одні й ті самі — раніше при редагуванні їх
 * просто копіювали з форми створення, тож правка одного поля (напр.
 * maxLength) в одній формі не діставалась іншої.
 */
export function ClientForm({
  values,
  onChange,
  managers,
  currentUserFirstName,
  onSubmit,
  isSubmitting,
  submitLabel,
  submittingLabel,
  error,
  onCancel,
  cancelLabel,
}: ClientFormProps) {
  const { t } = useTranslation()

  const set = <K extends keyof ClientFormValues>(key: K, value: ClientFormValues[K]) =>
    onChange({ ...values, [key]: value })

  return (
    <form className="crm-form" onSubmit={onSubmit}>
      <div className="form-row">
        <label>
          {t('clients.firstName')}
          <input
            value={values.firstName}
            onChange={(e) => set('firstName', e.target.value)}
            required
            maxLength={100}
          />
        </label>
        <label>
          {t('clients.lastName')}
          <input
            value={values.lastName}
            onChange={(e) => set('lastName', e.target.value)}
            required
            maxLength={100}
          />
        </label>
      </div>

      <div className="form-row">
        <label>
          {t('clients.phone')}
          <input
            type="tel"
            value={values.phone}
            onChange={(e) => set('phone', e.target.value)}
            required
            maxLength={20}
            pattern="^[+]?[0-9\s\-()]{7,20}$"
          />
        </label>
        <label>
          {t('clients.email')}
          <input
            type="email"
            value={values.email}
            onChange={(e) => set('email', e.target.value)}
            maxLength={254}
          />
        </label>
      </div>

      <div className="form-row">
        <label>
          {t('clients.salonName')}
          <input
            value={values.salonName}
            onChange={(e) => set('salonName', e.target.value)}
            maxLength={200}
          />
        </label>
        <label>
          {t('clients.position')}
          <input
            value={values.position}
            onChange={(e) => set('position', e.target.value)}
            maxLength={100}
          />
        </label>
      </div>

      <label>
        {t('clients.address')}
        <input value={values.address} onChange={(e) => set('address', e.target.value)} maxLength={300} />
      </label>

      <label>
        {t('clients.notes')}
        <textarea
          rows={3}
          value={values.notes}
          onChange={(e) => set('notes', e.target.value)}
          maxLength={2000}
        />
      </label>

      <label>
        {t('clients.assignedTo')}
        <select value={values.assignedToId} onChange={(e) => set('assignedToId', e.target.value)}>
          <option value="">{t('clients.assignedToMe', { name: currentUserFirstName })}</option>
          {managers.map((m) => (
            <option key={m.id} value={m.id}>
              {m.firstName} {m.lastName}
            </option>
          ))}
        </select>
      </label>

      {error && <FormError>{error}</FormError>}

      <div className="form-row">
        <button type="submit" disabled={isSubmitting}>
          {isSubmitting ? submittingLabel : submitLabel}
        </button>
        {onCancel && (
          <button type="button" onClick={onCancel} disabled={isSubmitting}>
            {cancelLabel}
          </button>
        )}
      </div>
    </form>
  )
}
