import type { FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import type { PublicUser } from '../../../shared/api/types'
import type { Client } from '../../clients/api'
import type { Deal } from '../../deals/api'
import type { TaskFormValues } from '../taskForm'

interface TaskFormProps {
  values: TaskFormValues
  onChange: (values: TaskFormValues) => void
  clients: Client[]
  deals: Deal[]
  managers: PublicUser[]
  currentUserFirstName?: string
  onSubmit: (event: FormEvent) => void
  isSubmitting: boolean
  error: string | null
}

export function TaskForm({
  values,
  onChange,
  clients,
  deals,
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
          <select
            value={values.clientId}
            onChange={(e) => onChange({ ...values, clientId: e.target.value, dealId: '' })}
          >
            <option value="">{t('tasks.field.notLinked')}</option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>
                {c.firstName} {c.lastName}
                {c.salonName ? ` — ${c.salonName}` : ''}
              </option>
            ))}
          </select>
        </label>
        <label>
          {t('tasks.field.deal')}
          <select value={values.dealId} onChange={(e) => set('dealId', e.target.value)}>
            <option value="">{t('tasks.field.notLinked')}</option>
            {deals
              .filter((d) => !values.clientId || d.client.id === values.clientId)
              .map((d) => (
                <option key={d.id} value={d.id}>
                  {d.title}
                </option>
              ))}
          </select>
        </label>
      </div>

      {error && <p className="form-error">{error}</p>}

      <button type="submit" disabled={isSubmitting}>
        {isSubmitting ? t('tasks.submitting') : t('tasks.submit')}
      </button>
    </form>
  )
}
