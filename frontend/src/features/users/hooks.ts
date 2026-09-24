import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { SELECT_PAGE_SIZE, type PaginationParams } from '../../shared/api/http'
import { useAuth } from '../auth/AuthContext'
import { userKeys, usersApi, type CreateUserDto } from './api'

// useQuery — одна сторінка користувачів (таблиця на сторінці "Користувачі").
export function useUsers(params: PaginationParams = {}) {
  const { token } = useAuth()
  return useQuery({
    queryKey: userKeys.list(params),
    queryFn: () => usersApi.list(token as string, params),
    enabled: !!token,
    placeholderData: (prev) => prev,
  })
}

/**
 * "Практично всі менеджери" для випадаючих списків "відповідальний" в
 * інших місцях застосунку — це useUsers() з великим limit, а не окрема
 * пагінована таблиця користувачів.
 *
 * useAllClients()/useAllDeals() мали ту саму форму й ту саму проблему
 * (мовчки капований список видавали за "всі") — їх замінили на
 * SearchSelect-комбобокси з пошуком на бекенді (дивись
 * shared/components/SearchSelect.tsx). Тут лишили як є свідомо: клієнти
 * й угоди ростуть необмежено, а штат менеджерів у CRM — ні; команда з
 * понад SELECT_PAGE_SIZE (100) продавців — це вже інший масштаб
 * компанії, і на той момент вартий окремого рішення, а не привід
 * ускладнювати цей дропдаун зараз.
 */
export function useAllUsers() {
  return useUsers({ page: 1, limit: SELECT_PAGE_SIZE })
}

// useMutation — створення користувача, інвалідуємо закешовані списки.
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
