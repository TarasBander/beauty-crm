import { useQuery } from '@tanstack/react-query'
import { useAuth } from '../auth/AuthContext'
import { analyticsApi, analyticsKeys } from './api'

// useQuery — один агрегований звіт з бекенду (сторінка "Аналітика").
// Тут немає пагінації, тож queryKey — просто фіксований ключ
// analyticsKeys.dashboard, без параметрів.
export function useAnalyticsDashboard() {
  const { token } = useAuth()
  return useQuery({
    queryKey: analyticsKeys.dashboard,
    queryFn: () => analyticsApi.getDashboard(token as string),
    enabled: !!token,
  })
}
