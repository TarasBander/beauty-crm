import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { SELECT_PAGE_SIZE, type PaginationParams } from '../../shared/api/http'
import { useAuth } from '../auth/AuthContext'
import { userKeys, usersApi, type CreateUserDto } from './api'

export function useUsers(params: PaginationParams = {}) {
  const { token } = useAuth()
  return useQuery({
    queryKey: userKeys.list(params),
    queryFn: () => usersApi.list(token as string, params),
    enabled: !!token,
    placeholderData: (prev) => prev,
  })
}

/** "Practically every manager", for assignee dropdowns elsewhere in the
 * app — not the paginated Users table. */
export function useAllUsers() {
  return useUsers({ page: 1, limit: SELECT_PAGE_SIZE })
}

export function useCreateUser() {
  const { token } = useAuth()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (dto: CreateUserDto) => usersApi.create(token as string, dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userKeys.lists() })
    },
  })
}
