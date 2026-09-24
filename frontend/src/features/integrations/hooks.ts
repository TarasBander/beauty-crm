import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { PaginationParams } from '../../shared/api/http'
import { useAuthenticatedToken } from '../auth/AuthContext'
import { apiKeyKeys, apiKeysApi } from './api'

// useQuery — одна сторінка API-ключів.
export function useApiKeys(params: PaginationParams = {}) {
  const token = useAuthenticatedToken()
  return useQuery({
    queryKey: apiKeyKeys.list(params),
    queryFn: () => apiKeysApi.list(token, params),
    enabled: !!token,
    placeholderData: (prev) => prev,
  })
}

// useMutation — створення ключа, інвалідуємо закешовані списки.
export function useCreateApiKey() {
  const token = useAuthenticatedToken()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (name: string) => apiKeysApi.create(token, name),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: apiKeyKeys.lists() })
    },
  })
}

// useMutation — відкликання ключа, теж просто інвалідуємо список
// (тут без оптимістичного оновлення — відкликання не настільки часта
// дія, щоб виправдати зайву складність onMutate/onError).
export function useRevokeApiKey() {
  const token = useAuthenticatedToken()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => apiKeysApi.revoke(token, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: apiKeyKeys.lists() })
    },
  })
}
