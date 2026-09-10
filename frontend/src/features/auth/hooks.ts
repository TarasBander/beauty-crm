import { useMutation } from '@tanstack/react-query'
import { useAuth } from './AuthContext'
import { authApi } from './api'

export function useChangePassword() {
  const { token } = useAuth()
  return useMutation({
    mutationFn: ({
      currentPassword,
      newPassword,
    }: {
      currentPassword: string
      newPassword: string
    }) => authApi.changePassword(token as string, currentPassword, newPassword),
  })
}
