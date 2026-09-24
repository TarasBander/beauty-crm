import type { FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import type { PublicUser } from '../../../shared/api/types'
import { FormError } from '../../../shared/components/FormError'
import { ClientCombobox } from '../../clients/components/ClientCombobox'
import { DealCombobox } from '../../deals/components/DealCombobox'
import type { TaskFormValues } from '../taskForm'

interface TaskFormProps {
  values: TaskFormValues
  onChange: (values: TaskFormValues) => void
  managers: PublicUser[]
  currentUserFirstName?: string
  onSubmit: (event: FormEvent) => void
  isSubmitting: boolean
  error: string | null
}

export function TaskForm({
  values,
  onChange,
  managers,
  currentUserFirstName,
  onSubmit,
  isSubmitting,
  error,
}: TaskFormProps) {
  const { t } = useTranslation()

  const set = <K extends keyof TaskFormValues>(key: K, value: TaskFormValues[K]) =>
    onChange({ ...values, [key]: value })

  return (
    <form className="crm-form" onSubmit={onSubmit}>
      <label>
        {t('tasks.field.title')}
        <input value={values.title} onChange={(e) => set('title', e.target.value)} required maxLength={200} />
      </label>

      <label>
        {t('tasks.field.description')}
        <textarea
          rows={2}
          value={values.description}
          onChange={(e) => set('description', e.target.value)}
          maxLength={2000}
        />
      </label>

      <div className="form-row">
        <label>
          {t('tasks.field.dueDate')}
          <input type="date" value={values.dueDate} onChange={(e) => set('dueDate', e.target.value)} />
        </label>
        <label>
          {t('tasks.field.assignedTo')}
          <select value={values.assignedToId} onChange={(e) => set('assignedToId', e.target.value)}>
            <option value="">{t('clients.assignedToMe', { name: currentUserFirstName })}</option>
            {managers.map((m) => (
              <option key={m.id} value={m.id}>
                {m.firstName} {m.lastName}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="form-row">
        <label>
          {t('tasks.field.client')}
          <ClientCombobox
            value={values.clientId}
            // Зміна клієнта скидає вже обрану угоду — стара угода могла
            // належати іншому клієнту (той самий захист, що й раніше,
            // коли dealId скидався прямо тут в onChange <select>-а).
            onChange={(id) => onChange({ ...values, clientId: id, dealId: '' })}
            placeholder={t('tasks.field.notLinked')}
          />
        </label>
        <label>
          {t('tasks.field.deal')}
          <DealCombobox
            value={values.dealId}
            onChange={(id) => set('dealId', id)}
            placeholder={t('tasks.field.notLinked')}
            clientId={values.clientId}
            // Клієнта вже обрано — звужений пошук серед ЙОГО угод, тож є
            // сенс одразу показати перші кілька навіть без набору тексту.
            minChars={values.clientId ? 0 : 2}
          />
        </label>
      </div>

      {error && <FormError>{error}</FormError>}

      <button type="submit" disabled={isSubmitting}>
        {isSubmitting ? t('tasks.submitting') : t('tasks.submit')}
      </button>
    </form>
  )
}
