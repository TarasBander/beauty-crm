import { useCallback } from 'react'
import { SearchSelect, type SearchSelectOption } from '../../../shared/components/SearchSelect'
import { useAuth } from '../../auth/AuthContext'
import { clientsApi, type Client } from '../api'

interface ClientComboboxProps {
  value: string
  onChange: (id: string) => void
  placeholder: string
  disabled?: boolean
  required?: boolean
}

function toOption(client: Client): SearchSelectOption {
  return {
    id: client.id,
    label: `${client.firstName} ${client.lastName}`,
    sublabel: client.salonName ?? undefined,
  }
}

/** SearchSelect, підключений до `GET /clients?search=...` — дивись
 * докладний коментар у SearchSelect.tsx про те, яку проблему це
 * вирішує. */
export function ClientCombobox({ value, onChange, placeholder, disabled, required }: ClientComboboxProps) {
  const { token } = useAuth()

  const search = useCallback(
    async (query: string) => {
      if (!token) return []
      const result = await clientsApi.list(token, { search: query, limit: 10 })
      return result.data.map(toOption)
    },
    [token],
  )

  return (
    <SearchSelect
      value={value}
      onSelect={(option) => onChange(option ? option.id : '')}
      search={search}
      placeholder={placeholder}
      disabled={disabled}
      required={required}
    />
  )
}
