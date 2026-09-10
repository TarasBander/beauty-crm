import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { SELECT_PAGE_SIZE, fetchAllPages, type PaginationParams } from '../../shared/api/http'
import { useAuth } from '../auth/AuthContext'
import {
  paymentKeys,
  paymentsApi,
  type CreatePaymentDto,
  type Payment,
  type UpdatePaymentDto,
} from './api'

// useQuery — одна сторінка платежів.
export function usePayments(params: PaginationParams = {}) {
  const { token } = useAuth()
  return useQuery({
    queryKey: paymentKeys.list(params),
    queryFn: () => paymentsApi.list(token as string, params),
    enabled: !!token,
    placeholderData: (prev) => prev,
  })
}

/** Смуга "отримано/очікується" підсумовує всі платежі, а не одну
 * сторінку — та сама логіка, що й у useAllDeals(). Обмежено
 * SELECT_PAGE_SIZE. */
export function useAllPayments() {
  return usePayments({ page: 1, limit: SELECT_PAGE_SIZE })
}

// useMutation — створення платежу, інвалідуємо закешовані списки.
export function useCreatePayment() {
  const { token } = useAuth()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (dto: CreatePaymentDto) => paymentsApi.create(token as string, dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: paymentKeys.lists() })
    },
  })
}

interface PaymentsListData {
  data: Payment[]
  meta: unknown
}

// useMutation з оптимістичним оновленням для "позначити оплаченим" —
// той самий патерн onMutate/onError/onSettled, що й у useUpdateDeal.
export function useUpdatePayment() {
  const { token } = useAuth()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: UpdatePaymentDto }) =>
      paymentsApi.update(token as string, id, dto),
    onMutate: async ({ id, dto }) => {
      await queryClient.cancelQueries({ queryKey: paymentKeys.lists() })
      const previous = queryClient.getQueriesData<PaymentsListData>({
        queryKey: paymentKeys.lists(),
      })
      previous.forEach(([key, data]) => {
        if (!data) return
        queryClient.setQueryData<PaymentsListData>(key, {
          ...data,
          data: data.data.map((p) => (p.id === id ? { ...p, ...dto } : p)),
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
      queryClient.invalidateQueries({ queryKey: paymentKeys.lists() })
    },
  })
}

/** Забирає всі платежі по всіх сторінках — для експорту в CSV. */
export function exportAllPayments(token: string) {
  return fetchAllPages((params) => paymentsApi.list(token, params))
}
