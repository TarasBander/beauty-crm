import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
import { AuthProvider } from '../../features/auth/AuthContext'
import { ProtectedRoute } from './ProtectedRoute'

// Reads back exactly what LoginPage itself reads (see LoginPage.tsx's
// LoginLocationState) — this is the contract under test: ProtectedRoute
// must hand the login page enough to bounce the user back afterwards.
function LoginProbe() {
  const location = useLocation()
  const state = location.state as { from?: string } | null
  return <div data-testid="login-probe">{state?.from ?? 'no-from'}</div>
}

function renderProtected(initialPath: string) {
  const queryClient = new QueryClient()
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[initialPath]}>
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<LoginProbe />} />
            <Route
              path="/clients/:id"
              element={
                <ProtectedRoute>
                  <div>secret client page</div>
                </ProtectedRoute>
              }
            />
          </Routes>
        </AuthProvider>
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

describe('ProtectedRoute', () => {
  beforeEach(() => {
    // No stored token ⇒ AuthProvider's meQuery is `enabled: !!token` ===
    // false, so useAuth() resolves to { user: null, isLoading: false }
    // synchronously — no network call, no need to await anything here.
    localStorage.clear()
  })

  it('sends an unauthenticated visitor to /login, remembering the deep link they asked for', () => {
    renderProtected('/clients/abc-123')

    expect(screen.getByTestId('login-probe')).toHaveTextContent('/clients/abc-123')
    expect(screen.queryByText('secret client page')).not.toBeInTheDocument()
  })

  it('never renders the protected content for a logged-out visitor', () => {
    renderProtected('/clients/abc-123')

    expect(screen.queryByText('secret client page')).not.toBeInTheDocument()
  })
})
