import { lazy, Suspense } from 'react'
import { useTranslation } from 'react-i18next'
import { Navigate, Route, Routes } from 'react-router-dom'
import './App.css'
import { Layout } from './shared/components/Layout'
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
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Layout>
                  <DashboardPage />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/clients"
            element={
              <ProtectedRoute>
                <Layout>
                  <ClientsPage />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/clients/:id"
            element={
              <ProtectedRoute>
                <Layout>
                  <ClientDetailPage />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/deals"
            element={
              <ProtectedRoute>
                <Layout>
                  <DealsPage />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/tasks"
            element={
              <ProtectedRoute>
                <Layout>
                  <TasksPage />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/payments"
            element={
              <ProtectedRoute>
                <Layout>
                  <PaymentsPage />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/analytics"
            element={
              <ProtectedRoute>
                <Layout>
                  <AnalyticsPage />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/users"
            element={
              <ProtectedRoute>
                <Layout>
                  <UsersPage />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/integrations"
            element={
              <ProtectedRoute>
                <Layout>
                  <IntegrationsPage />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/change-password"
            element={
              <ProtectedRoute>
                <Layout>
                  <ChangePasswordPage />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </AuthProvider>
  )
}

export default App
