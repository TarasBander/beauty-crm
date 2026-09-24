import { useQuery } from '@tanstack/react-query'
import { useAuthenticatedToken } from '../auth/AuthContext'
import { analyticsApi, analyticsKeys } from './api'

// useQuery — один агрегований звіт з бекенду (сторінка "Аналітика").
// Тут немає пагінації, тож queryKey — просто фіксований ключ
// analyticsKeys.dashboard, без параметрів.
export function useAnalyticsDashboard() {
  const token = useAuthenticatedToken()
  return useQuery({
    queryKey: analyticsKeys.dashboard,
    queryFn: () => analyticsApi.getDashboard(token),
    enabled: !!token,
  })
}
