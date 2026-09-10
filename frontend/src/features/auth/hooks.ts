import { useMutation } from '@tanstack/react-query'
import { useAuth } from './AuthContext'
import { authApi } from './api'

// useMutation — для дій, які щось МІНЯЮТЬ на бекенді (POST/PATCH/DELETE),
// на відміну від useQuery, який тільки ЧИТАЄ й кешує дані. Зміна пароля —
// саме такий одноразовий "постріл": нічого в кеші React Query не
// залежить від пароля, тож після успіху не треба нічого інвалідувати.
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
