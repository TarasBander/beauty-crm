import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { SELECT_PAGE_SIZE, fetchAllPages, type PaginationParams } from '../../shared/api/http'
import { useAuth } from '../auth/AuthContext'
import { dealKeys, dealsApi, type CreateDealDto, type Deal, type UpdateDealDto } from './api'

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
 * The pipeline view buckets every deal by stage and shows a per-stage
 * total, so it needs the full set rather than one page at a time — a
 * paginated table would show inaccurate stage counts whenever a deal on
 * a later page belonged to a stage not yet loaded. SELECT_PAGE_SIZE
 * (100, the backend's max) keeps this bounded; a CRM that outgrows that
 * many open deals should move stage-bucketing to a backend aggregate
 * endpoint instead of raising the limit further.
 */
export function useAllDeals() {
  return useDeals({ page: 1, limit: SELECT_PAGE_SIZE })
}

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

export function useUpdateDeal() {
  const { token } = useAuth()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: UpdateDealDto }) =>
      dealsApi.update(token as string, id, dto),
    // Optimistic update: the pipeline carousel calls this on every stage
    // change, and waiting for a round-trip before moving the card would
    // feel laggy — patch every cached deals list immediately, and only
    // invalidate for real once the server confirms (or roll back if it
    // rejects the change).
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

/** Fetches every deal across all pages, for CSV export. */
export function exportAllDeals(token: string) {
  return fetchAllPages((params) => dealsApi.list(token, params))
}
