import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { SELECT_PAGE_SIZE, fetchAllPages, type PaginationParams } from '../../shared/api/http'
import { analyticsKeys } from '../analytics/api'
import { useAuthenticatedToken } from '../auth/AuthContext'
import {
  paymentKeys,
  paymentsApi,
  type CreatePaymentDto,
  type Payment,
  type UpdatePaymentDto,
} from './api'

// useQuery — одна сторінка платежів.
export function usePayments(params: PaginationParams = {}) {
  const token = useAuthenticatedToken()
  return useQuery({
    queryKey: paymentKeys.list(params),
    queryFn: () => paymentsApi.list(token, params),
    enabled: !!token,
    placeholderData: (prev) => prev,
  })
}

/**
 * Список платежів на сторінці "Платежі" — той самий usePayments()
 * зверху з limit = SELECT_PAGE_SIZE (100). Смуга "отримано/очікується"
 * з цього списку більше НЕ рахується — вона йде з
 * /analytics/dashboard (payments.totalPaid/totalPending, рахує з УСІХ
 * платежів). Цей хук лишається лише джерелом рядків самої таблиці;
 * якщо платежів більше, ніж завантажено, PaymentsPage показує банер
 * (дивись Banner.tsx), а не мовчить про різницю.
 */
export function useAllPayments() {
  return usePayments({ page: 1, limit: SELECT_PAGE_SIZE })
}

// useMutation — створення платежу, інвалідуємо закешовані списки.
export function useCreatePayment() {
  const token = useAuthenticatedToken()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (dto: CreatePaymentDto) => paymentsApi.create(token, dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: paymentKeys.lists() })
      // Смуга "отримано/очікується" читається з /analytics/dashboard —
      // окремий кеш від paymentKeys, теж треба протухнути.
      queryClient.invalidateQueries({ queryKey: analyticsKeys.dashboard })
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
  const token = useAuthenticatedToken()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: UpdatePaymentDto }) =>
      paymentsApi.update(token, id, dto),
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
      // "Позначено оплаченим" рухає гроші з очікується → отримано в тій
      // самій смузі — застаріла без цього.
      queryClient.invalidateQueries({ queryKey: analyticsKeys.dashboard })
    },
  })
}

/** Забирає всі платежі по всіх сторінках — для експорту в CSV. */
export function exportAllPayments(token: string) {
  return fetchAllPages((params) => paymentsApi.list(token, params))
}
