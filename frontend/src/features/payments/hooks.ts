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

export function usePayments(params: PaginationParams = {}) {
  const { token } = useAuth()
  return useQuery({
    queryKey: paymentKeys.list(params),
    queryFn: () => paymentsApi.list(token as string, params),
    enabled: !!token,
    placeholderData: (prev) => prev,
  })
}

/** The paid/pending summary bar totals every payment, not just one
 * page — same reasoning as useAllDeals(). Bounded at SELECT_PAGE_SIZE. */
export function useAllPayments() {
  return usePayments({ page: 1, limit: SELECT_PAGE_SIZE })
}

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

export function useUpdatePayment() {
  const { token } = useAuth()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: UpdatePaymentDto }) =>
      paymentsApi.update(token as string, id, dto),
    // Optimistic update for "mark as paid" — see useUpdateDeal for the
    // same pattern.
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

/** Fetches every payment across all pages, for CSV export. */
export function exportAllPayments(token: string) {
  return fetchAllPages((params) => paymentsApi.list(token, params))
}
