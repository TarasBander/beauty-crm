import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { SELECT_PAGE_SIZE, fetchAllPages, type PaginationParams } from '../../shared/api/http'
import { useAuth } from '../auth/AuthContext'
import { clientKeys, clientsApi, type CreateClientDto, type UpdateClientDto } from './api'

export function useClients(params: PaginationParams = {}) {
  const { token } = useAuth()
  return useQuery({
    queryKey: clientKeys.list(params),
    queryFn: () => clientsApi.list(token as string, params),
    enabled: !!token,
    // Keeps showing the previous page's rows (instead of a loading
    // flash) while the next page is in flight.
    placeholderData: (prev) => prev,
  })
}

/** "Practically every client", for select dropdowns elsewhere in the
 * app (deal/task forms) — not the paginated Clients table. */
export function useAllClients() {
  return useClients({ page: 1, limit: SELECT_PAGE_SIZE })
}

export function useClient(id: string | undefined) {
  const { token } = useAuth()
  return useQuery({
    queryKey: clientKeys.detail(id ?? ''),
    queryFn: () => clientsApi.get(token as string, id as string),
    enabled: !!token && !!id,
  })
}

export function useCreateClient() {
  const { token } = useAuth()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (dto: CreateClientDto) => clientsApi.create(token as string, dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: clientKeys.lists() })
    },
  })
}

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

/** Fetches every client across all pages, for CSV export. Not a
 * useQuery — this is a one-off action triggered by a button click, not
 * data the UI renders and keeps in sync. */
export function exportAllClients(token: string) {
  return fetchAllPages((params) => clientsApi.list(token, params))
}
