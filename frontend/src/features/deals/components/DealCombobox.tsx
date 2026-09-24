import { useCallback } from 'react'
import { SearchSelect, type SearchSelectOption } from '../../../shared/components/SearchSelect'
import { useAuth } from '../../auth/AuthContext'
import { dealsApi, type Deal } from '../api'

interface DealComboboxProps {
  value: string
  onChange: (id: string) => void
  placeholder: string
  // Звужує пошук до угод одного клієнта (TaskForm, коли клієнта вже
  // обрано) — інакше шукає по всіх угодах (PaymentForm).
  clientId?: string
  disabled?: boolean
  required?: boolean
  minChars?: number
}

function toOption(deal: Deal): SearchSelectOption {
  return {
    id: deal.id,
    label: deal.title,
    sublabel: `${deal.client.firstName} ${deal.client.lastName}`,
  }
}

/** SearchSelect, підключений до `GET /deals?search=...&clientId=...` —
 * дивись докладний коментар у SearchSelect.tsx про те, яку проблему це
 * вирішує. */
export function DealCombobox({
  value,
  onChange,
  placeholder,
  clientId,
  disabled,
  required,
  minChars,
}: DealComboboxProps) {
  const { token } = useAuth()

  const search = useCallback(
    async (query: string) => {
      if (!token) return []
      const result = await dealsApi.list(token, { search: query, clientId: clientId || undefined, limit: 10 })
      return result.data.map(toOption)
    },
    [token, clientId],
  )

  return (
    <SearchSelect
      value={value}
      onSelect={(option) => onChange(option ? option.id : '')}
      search={search}
      placeholder={placeholder}
      disabled={disabled}
      required={required}
      minChars={minChars}
    />
  )
}
