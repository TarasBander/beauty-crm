import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../../features/auth/AuthContext'

// Другий рівень захисту поверх ProtectedRoute: той лише перевіряє "є
// користувач?", цей — "чи має він роль admin?". Побудований так само, як
// layout route у App.tsx (Outlet замість children), щоб /users і
// /integrations захищалися одним <Route element={<AdminRoute />}>, а не
// повторюваним оборачуванням кожної сторінки окремо.
//
// Це лише зручність в UI — не пускати менеджера туди, де він однаково
// нічого корисного не зробить. Справжній замок на боці бекенда (див.
// users.controller.ts): навіть якщо цей компонент колись приберуть чи
// обійдуть, сервер все одно відмовить у діях не-адміну.
export function AdminRoute() {
  const { user } = useAuth()

  if (user?.role !== 'admin') {
    return <Navigate to="/" replace />
  }

  return <Outlet />
}
