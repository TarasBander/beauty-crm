import { useQuery } from '@tanstack/react-query'
import { useAuth } from '../auth/AuthContext'
import { analyticsApi, analyticsKeys } from './api'

export function useAnalyticsDashboard() {
  const { token } = useAuth()
  return useQuery({
    queryKey: analyticsKeys.dashboard,
    queryFn: () => analyticsApi.getDashboard(token as string),
    enabled: !!token,
  })
}
