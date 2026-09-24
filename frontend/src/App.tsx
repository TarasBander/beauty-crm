import { lazy, Suspense } from 'react'
import { useTranslation } from 'react-i18next'
import { Route, Routes } from 'react-router-dom'
import './App.css'
import { AdminRoute } from './shared/components/AdminRoute'
import { Layout } from './shared/components/Layout'
import { NotFoundPage } from './shared/components/NotFoundPage'
import { ProtectedRoute } from './shared/components/ProtectedRoute'
import { AuthProvider } from './features/auth/AuthContext'

// Route-level code splitting: each page (and everything it alone
// imports) ships as its own chunk, fetched only when that route is
// actually visited, instead of one bundle containing all eight pages
// up front — the login screen doesn't need the analytics/deals code,
// for instance.
const LoginPage = lazy(() => import('./features/auth/LoginPage').then((m) => ({ default: m.LoginPage })))
const ChangePasswordPage = lazy(() =>
  import('./features/auth/ChangePasswordPage').then((m) => ({ default: m.ChangePasswordPage })),
)
const DashboardPage = lazy(() =>
  import('./features/dashboard/DashboardPage').then((m) => ({ default: m.DashboardPage })),
)
const ClientsPage = lazy(() =>
  import('./features/clients/ClientsPage').then((m) => ({ default: m.ClientsPage })),
)
const ClientDetailPage = lazy(() =>
  import('./features/clients/ClientDetailPage').then((m) => ({ default: m.ClientDetailPage })),
)
const DealsPage = lazy(() => import('./features/deals/DealsPage').then((m) => ({ default: m.DealsPage })))
const TasksPage = lazy(() => import('./features/tasks/TasksPage').then((m) => ({ default: m.TasksPage })))
const PaymentsPage = lazy(() =>
  import('./features/payments/PaymentsPage').then((m) => ({ default: m.PaymentsPage })),
)
const AnalyticsPage = lazy(() =>
  import('./features/analytics/AnalyticsPage').then((m) => ({ default: m.AnalyticsPage })),
)
const UsersPage = lazy(() => import('./features/users/UsersPage').then((m) => ({ default: m.UsersPage })))
const IntegrationsPage = lazy(() =>
  import('./features/integrations/IntegrationsPage').then((m) => ({ default: m.IntegrationsPage })),
)

function RouteFallback() {
  const { t } = useTranslation()
  return <div className="page-loading">{t('common.loading')}</div>
}

function App() {
  return (
    <AuthProvider>
      <Suspense fallback={<RouteFallback />}>
        <Routes>
          <Route path="/login" element={<LoginPage />} />

          {/* Layout route: everything nested under here requires login
              (ProtectedRoute) and gets the nav/header chrome (Layout,
              which renders the matched child via <Outlet />) exactly
              once — adding a new protected page is one <Route> line
              below, nothing to remember to wrap. */}
          <Route
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route path="/" element={<DashboardPage />} />
            <Route path="/clients" element={<ClientsPage />} />
            <Route path="/clients/:id" element={<ClientDetailPage />} />
            <Route path="/deals" element={<DealsPage />} />
            <Route path="/tasks" element={<TasksPage />} />
            <Route path="/payments" element={<PaymentsPage />} />
            <Route path="/analytics" element={<AnalyticsPage />} />

            {/* Другий шар захисту всередині вже захищеного layout route:
                тільки admin проходить AdminRoute далі до Outlet, будь-кому
                іншому — назад на "/" (див. AdminRoute.tsx). */}
            <Route element={<AdminRoute />}>
              <Route path="/users" element={<UsersPage />} />
              <Route path="/integrations" element={<IntegrationsPage />} />
            </Route>

            <Route path="/change-password" element={<ChangePasswordPage />} />
          </Route>

          {/* Any unmatched URL — logged in or not — lands here directly,
              instead of bouncing through "/" (which used to then bounce
              a logged-out visitor to /login a second time). */}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </Suspense>
    </AuthProvider>
  )
}

export default App
