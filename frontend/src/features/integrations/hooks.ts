import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { PaginationParams } from '../../shared/api/http'
import { useAuth } from '../auth/AuthContext'
import { apiKeyKeys, apiKeysApi } from './api'

// useQuery — одна сторінка API-ключів.
export function useApiKeys(params: PaginationParams = {}) {
  const { token } = useAuth()
  return useQuery({
    queryKey: apiKeyKeys.list(params),
    queryFn: () => apiKeysApi.list(token as string, params),
    enabled: !!token,
    placeholderData: (prev) => prev,
  })
}

// useMutation — створення ключа, інвалідуємо закешовані списки.
export function useCreateApiKey() {
  const { token } = useAuth()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (name: string) => apiKeysApi.create(token as string, name),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: apiKeyKeys.lists() })
    },
  })
}

// useMutation — відкликання ключа, теж просто інвалідуємо список
// (тут без оптимістичного оновлення — відкликання не настільки часта
// дія, щоб виправдати зайву складність onMutate/onError).
export function useRevokeApiKey() {
  const { token } = useAuth()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => apiKeysApi.revoke(token as string, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: apiKeyKeys.lists() })
    },
  })
}
