import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { SELECT_PAGE_SIZE, fetchAllPages, type PaginationParams } from '../../shared/api/http'
import { analyticsKeys } from '../analytics/api'
import { useAuthenticatedToken } from '../auth/AuthContext'
import { dealKeys, dealsApi, type CreateDealDto, type Deal, type UpdateDealDto } from './api'

// useQuery — одна сторінка угод, кеш-ключ включає параметри пагінації
// (як і в useClients вище).
export function useDeals(params: PaginationParams = {}) {
  const token = useAuthenticatedToken()
  return useQuery({
    queryKey: dealKeys.list(params),
    queryFn: () => dealsApi.list(token, params),
    enabled: !!token,
    placeholderData: (prev) => prev,
  })
}

/**
 * Картки канбану — це той самий useDeals() зверху з limit =
 * SELECT_PAGE_SIZE (100, максимум бекенду), тож видно щонайбільше 100
 * карток одразу. Раніше з цього ж капованого списку рахувались і суми
 * по стадіях — тепер ні: кількість і сума на кожній стадії (DealBoard,
 * kanban-tab-count/kanban-column-total) беруться з
 * /analytics/dashboard, який рахує з УСІХ угод у базі, а не з цих 100.
 * Сам капований список тут лишається лише джерелом карток, які реально
 * рендеряться в колонці — якщо їх на стадії більше, ніж завантажено,
 * DealsPage і DealBoard показують про це банер (дивись Banner.tsx),
 * а не мовчать.
 */
export function useAllDeals() {
  return useDeals({ page: 1, limit: SELECT_PAGE_SIZE })
}

// useMutation — створення угоди, після успіху інвалідуємо всі закешовані
// списки угод (так само, як useCreateClient).
export function useCreateDeal() {
  const token = useAuthenticatedToken()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (dto: CreateDealDto) => dealsApi.create(token, dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: dealKeys.lists() })
      // Кількість/сума по стадіях у канбані (DealBoard) і KPI на
      // дашборді читаються з /analytics/dashboard, окремого кешу від
      // dealKeys — без цього нова угода з'явилась би в капованому
      // списку карток одразу, а лічильник на вкладці стадії лишався б
      // застарілим, поки хтось не відкриє сторінку "Аналітика" чи
      // дашборд і не протухне кеш якимсь іншим шляхом.
      queryClient.invalidateQueries({ queryKey: analyticsKeys.dashboard })
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
  const token = useAuthenticatedToken()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: UpdateDealDto }) =>
      dealsApi.update(token, id, dto),
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
      // Стадія змінилась — і лічильник, і сума по обох стадіях
      // (звідки й куди "переїхала" картка) застаріли в аналітиці теж.
      queryClient.invalidateQueries({ queryKey: analyticsKeys.dashboard })
    },
  })
}

/** Забирає всі угоди по всіх сторінках — для експорту в CSV (не useQuery,
 * одноразова дія по кліку, як exportAllClients). */
export function exportAllDeals(token: string) {
  return fetchAllPages((params) => dealsApi.list(token, params))
}
