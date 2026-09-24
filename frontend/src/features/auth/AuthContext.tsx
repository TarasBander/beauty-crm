import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { getStoredToken, setStoredToken, setUnauthorizedHandler } from '../../shared/api/http'
import type { PublicUser } from '../../shared/api/types'
import { authApi } from './api'

interface AuthContextValue {
  user: PublicUser | null
  token: string | null
  isLoading: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

const meQueryKey = (token: string | null) => ['auth', 'me', token] as const

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setTokenState] = useState<string | null>(() => getStoredToken())
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const location = useLocation()

  // useQuery для перевірки "чи я залогінений": робить GET /auth/me і
  // кладе відповідь у кеш React Query під ключем meQueryKey(token) —
  // тобто окремий запис кешу на кожен токен. enabled: !!token означає,
  // що запит взагалі не піде, поки токена немає (наприклад, на сторінці
  // входу). retry: false — якщо токен невалідний, повторювати запит
  // немає сенсу, бо результат буде той самий (401). Цей самий запис
  // кешу нижче наповнює login() одразу після успішного входу — і його ж
  // читає useAuth() у будь-якому компоненті застосунку через `user`.
  const meQuery = useQuery({
    queryKey: meQueryKey(token),
    queryFn: () => authApi.me(token as string),
    enabled: !!token,
    retry: false,
    staleTime: 5 * 60_000,
  })

  useEffect(() => {
    // Єдине місце, де "сесія протухла" перетворюється на дію: http.ts
    // викликає це, коли будь-який запит із токеном (не лише /auth/me —
    // так само таблиця клієнтів, збереження угоди, що завгодно) отримує
    // у відповідь 401. Чистимо кеш React Query (щоб застарілі дані
    // попереднього користувача не блимнули після наступного логіну) і
    // ведемо на /login через React Router — без перезавантаження
    // сторінки, із запам'ятовуванням, де користувач був (той самий
    // "from", що й у ProtectedRoute — див. LoginPage.tsx).
    setUnauthorizedHandler(() => {
      setTokenState(null)
      queryClient.clear()
      navigate('/login', { replace: true, state: { from: location.pathname } })
    })
    return () => setUnauthorizedHandler(null)
  }, [navigate, queryClient, location.pathname])

  const login = useCallback(
    async (email: string, password: string) => {
      const response = await authApi.login(email, password)
      setStoredToken(response.accessToken)
      // Одразу наповнюємо кеш React Query під ключем нового токена ще
      // ДО того, як перемкнути стан на цей токен — тож щойно useQuery
      // вище перепідпишеться на новий ключ, дані вже будуть на місці
      // (без зайвого запиту й без "миготіння" екрана завантаження).
      queryClient.setQueryData(meQueryKey(response.accessToken), response.user)
      setTokenState(response.accessToken)
    },
    [queryClient],
  )

  const logout = useCallback(() => {
    setStoredToken(null)
    setTokenState(null)
    // Усі інші useQuery в застосунку (клієнти, угоди, ...) прив'язані до
    // "хто зараз залогінений" — тому при виході повністю чистимо кеш
    // React Query, щоб наступний користувач на цьому ж пристрої не
    // побачив на мить дані попереднього.
    queryClient.clear()
  }, [queryClient])

  const user = token ? (meQuery.data ?? null) : null
  const isLoading = !!token && meQuery.isPending

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    throw new Error('useAuth має використовуватись всередині <AuthProvider>')
  }
  return ctx
}
