import { useQuery } from '@tanstack/react-query'
import { useAuthenticatedToken } from '../auth/AuthContext'
import { analyticsApi, analyticsKeys, type SalesParams } from './api'

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

// Діаграма продажів на дашборді. placeholderData: (prev) => prev — при
// перемиканні року чи періоду графік лишається на місці (трохи
// прозорим), поки вантажаться нові дані, замість того щоб зникати.
export function useSales(params: SalesParams) {
  const token = useAuthenticatedToken()
  return useQuery({
    queryKey: analyticsKeys.sales(params),
    queryFn: () => analyticsApi.getSales(token, params),
    enabled: !!token,
    placeholderData: (prev) => prev,
  })
}
