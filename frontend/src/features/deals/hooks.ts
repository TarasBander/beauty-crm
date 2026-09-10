import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { SELECT_PAGE_SIZE, fetchAllPages, type PaginationParams } from '../../shared/api/http'
import { useAuth } from '../auth/AuthContext'
import { dealKeys, dealsApi, type CreateDealDto, type Deal, type UpdateDealDto } from './api'

// useQuery — одна сторінка угод, кеш-ключ включає параметри пагінації
// (як і в useClients вище).
export function useDeals(params: PaginationParams = {}) {
  const { token } = useAuth()
  return useQuery({
    queryKey: dealKeys.list(params),
    queryFn: () => dealsApi.list(token as string, params),
    enabled: !!token,
    placeholderData: (prev) => prev,
  })
}

/**
 * Воронка (канбан) розкладає всі угоди по стадіях і показує суму по
 * кожній стадії, тож їй потрібен увесь набір даних одразу, а не одна
 * сторінка за раз — пагінована таблиця показувала б неправильні суми,
 * поки угода з наступної сторінки ще не завантажена. Це той самий
 * useDeals() зверху з limit = SELECT_PAGE_SIZE (100, максимум бекенду) —
 * межа тримає запит обмеженим; якщо в CRM стане більше відкритих угод,
 * розкладку по стадіях краще перенести на окремий агрегатний ендпоінт
 * бекенду, а не піднімати ліміт далі.
 */
export function useAllDeals() {
  return useDeals({ page: 1, limit: SELECT_PAGE_SIZE })
}

// useMutation — створення угоди, після успіху інвалідуємо всі закешовані
// списки угод (так само, як useCreateClient).
export function useCreateDeal() {
  const { token } = useAuth()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (dto: CreateDealDto) => dealsApi.create(token as string, dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: dealKeys.lists() })
    },
  })
}

interface DealsListData {
  data: Deal[]
  meta: unknown
}

// useMutation зі "оптимістичним" оновленням — картку угоди в канбані
// перетягують між стадіями часто, і чекати відповідь сервера перед
// тим, як картка переїде, відчувалось би повільно. Тому:
//  1) onMutate — одразу, ще до відповіді сервера, підправляємо угоду в
//     УСІХ закешованих списках угод (картка "переїжджає" миттєво);
//  2) onError — якщо сервер відхилив зміну, повертаємо кеш до стану,
//     який зберегли в onMutate (context.previous);
//  3) onSettled — коли запит завершився (успішно чи ні), інвалідуємо
//     кеш по-справжньому, щоб отримати гарантовано актуальні дані з
//     бекенду замість тимчасового "оптимістичного" патчу.
export function useUpdateDeal() {
  const { token } = useAuth()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: UpdateDealDto }) =>
      dealsApi.update(token as string, id, dto),
    onMutate: async ({ id, dto }) => {
      await queryClient.cancelQueries({ queryKey: dealKeys.lists() })
      const previous = queryClient.getQueriesData<DealsListData>({ queryKey: dealKeys.lists() })
      previous.forEach(([key, data]) => {
        if (!data) return
        queryClient.setQueryData<DealsListData>(key, {
          ...data,
          data: data.data.map((d) => (d.id === id ? { ...d, ...dto } : d)),
        })
      })
      return { previous }
    },
    onError: (_err, _vars, context) => {
      context?.previous.forEach(([key, data]) => {
        queryClient.setQueryData(key, data)
      })
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: dealKeys.lists() })
    },
  })
}

/** Забирає всі угоди по всіх сторінках — для експорту в CSV (не useQuery,
 * одноразова дія по кліку, як exportAllClients). */
export function exportAllDeals(token: string) {
  return fetchAllPages((params) => dealsApi.list(token, params))
}
