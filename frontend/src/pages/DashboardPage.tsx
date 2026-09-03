import { useAuth } from '../auth/AuthContext'

export function DashboardPage() {
  const { user } = useAuth()

  return (
    <div>
      <h1>Вітаємо, {user?.firstName}!</h1>
      <p className="subtitle">
        Це стартовий дашборд Beauty CRM — сюди пізніше додамо клієнтів, товари
        та угоди.
      </p>
    </div>
  )
}
