import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { fetchAllPages, type PaginationParams } from '../../shared/api/http'
import { analyticsKeys } from '../analytics/api'
import { useAuth } from '../auth/AuthContext'
import { clientKeys, clientsApi, type CreateClientDto, type UpdateClientDto } from './api'

// useQuery — читає й кешує одну "сторінку" клієнтів. queryKey
// (clientKeys.list(params)) включає параметри пагінації, тож кожна
// сторінка/фільтр кешується окремим записом — перехід назад на вже
// відкриту сторінку бере дані з кешу миттєво, без нового запиту.
export function useClients(params: PaginationParams = {}) {
  const { token } = useAuth()
  return useQuery({
    queryKey: clientKeys.list(params),
    queryFn: () => clientsApi.list(token as string, params),
    // Без токена запит не має сенсу (401) — просто не запускаємо його.
    enabled: !!token,
    // Поки вантажиться нова сторінка, показуємо рядки попередньої
    // замість екрана завантаження — так перемикання сторінок не блимає.
    placeholderData: (prev) => prev,
  })
}

// useQuery для картки одного клієнта (сторінка деталей) — окремий
// кеш-запис на кожен id. enabled чекає і на токен, і на сам id (бо на
// перших рендерах id з useParams() ще може бути undefined).
export function useClient(id: string | undefined) {
  const { token } = useAuth()
  return useQuery({
    queryKey: clientKeys.detail(id ?? ''),
    queryFn: () => clientsApi.get(token as string, id as string),
    enabled: !!token && !!id,
  })
}

// useMutation — створення клієнта. Після успіху invalidateQueries
// позначає всі закешовані списки клієнтів застарілими, тож React Query
// сам підвантажить свіжі дані для будь-якого відкритого списку/сторінки.
export function useCreateClient() {
  const { token } = useAuth()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (dto: CreateClientDto) => clientsApi.create(token as string, dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: clientKeys.lists() })
      // "Клієнтів усього" на дашборді читається з /analytics/dashboard —
      // окремий кеш, який теж треба протухнути.
      queryClient.invalidateQueries({ queryKey: analyticsKeys.dashboard })
    },
  })
}

// useMutation — редагування клієнта. Тут дві дії з кешем: інвалідуємо
// списки (щоб таблиця клієнтів підхопила зміни) і одразу підмінюємо
// кеш картки клієнта (setQueryData) свіжими даними з відповіді сервера
// — це швидше за очікування нового запиту і прибирає "стрибок" даних.
export function useUpdateClient() {
  const { token } = useAuth()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: UpdateClientDto }) =>
      clientsApi.update(token as string, id, dto),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: clientKeys.lists() })
      queryClient.setQueryData(clientKeys.detail(updated.id), updated)
    },
  })
}

/** Забирає всіх клієнтів по всіх сторінках підряд — для експорту в CSV.
 * Це НЕ useQuery: тут нема даних, які компонент показує й тримає
 * синхронізованими, це одноразова дія по кліку на кнопку. */
export function exportAllClients(token: string) {
  return fetchAllPages((params) => clientsApi.list(token, params))
}
