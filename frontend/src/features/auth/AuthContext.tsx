import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { getStoredToken, setStoredToken } from '../../shared/api/http'
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

  // The "am I logged in" check is just a query, like everything else —
  // its cache entry is what login() below pre-populates so there's no
  // extra round-trip right after signing in.
  const meQuery = useQuery({
    queryKey: meQueryKey(token),
    queryFn: () => authApi.me(token as string),
    enabled: !!token,
    retry: false,
    staleTime: 5 * 60_000,
  })

  useEffect(() => {
    // A stored token that the backend no longer accepts (expired,
    // revoked) — drop it so ProtectedRoute redirects to /login instead
    // of getting stuck on the loading screen forever.
    if (token && meQuery.isError) {
      setStoredToken(null)
      setTokenState(null)
    }
  }, [token, meQuery.isError])

  const login = useCallback(
    async (email: string, password: string) => {
      const response = await authApi.login(email, password)
      setStoredToken(response.accessToken)
      // Seed the cache for the new token's query key before switching to
      // it, so the very next render already has `user` — no loading flash.
      queryClient.setQueryData(meQueryKey(response.accessToken), response.user)
      setTokenState(response.accessToken)
    },
    [queryClient],
  )

  const logout = useCallback(() => {
    setStoredToken(null)
    setTokenState(null)
    // Every other query (clients, deals, ...) is scoped to "whoever is
    // logged in" — wipe the cache so the next user never sees a flash of
    // the previous one's data.
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
