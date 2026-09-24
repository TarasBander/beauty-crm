import type { FormEvent } from 'react'
import { useTranslation } from 'react-i18next'

interface ApiKeyFormProps {
  name: string
  onNameChange: (name: string) => void
  onSubmit: (event: FormEvent) => void
  isSubmitting: boolean
  error: string | null
}

export function ApiKeyForm({ name, onNameChange, onSubmit, isSubmitting, error }: ApiKeyFormProps) {
  const { t } = useTranslation()

  return (
    <form className="crm-form" onSubmit={onSubmit}>
      <label>
        {t('integrations.field.name')}
        <input
          value={name}
          onChange={(e) => onNameChange(e.target.value)}
          placeholder={t('integrations.field.namePlaceholder')}
          required
          maxLength={100}
        />
      </label>

      {error && <p className="form-error">{error}</p>}

      <button type="submit" disabled={isSubmitting}>
        {isSubmitting ? t('integrations.submitting') : t('integrations.submit')}
      </button>
    </form>
  )
}
