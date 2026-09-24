import { useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { ApiError } from '../../shared/api/http'
import { Card } from '../../shared/components/Card'
import { Page } from '../../shared/components/Page'
import { Pagination } from '../../shared/components/Pagination'
import { QueryStatus } from '../../shared/components/QueryStatus'
import { useAuth } from '../auth/AuthContext'
import { UserForm } from './components/UserForm'
import { UserTable } from './components/UserTable'
import { emptyUserForm, toCreateUserDto, type UserFormValues } from './userForm'
import { useCreateUser, useUsers } from './hooks'

export function UsersPage() {
  const { t } = useTranslation()
  const { user: currentUser } = useAuth()
  const [page, setPage] = useState(1)
  const usersQuery = useUsers({ page })
  const createUser = useCreateUser()

  const [form, setForm] = useState<UserFormValues>(emptyUserForm)
  const [formError, setFormError] = useState<string | null>(null)

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setFormError(null)
    try {
      await createUser.mutateAsync(toCreateUserDto(form))
      setForm(emptyUserForm)
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : t('users.createError'))
    }
  }

  const users = usersQuery.data?.data ?? []
  const meta = usersQuery.data?.meta

  return (
    <Page title={t('users.title')}>
      <Card title={t('users.addTitle')}>
        {/* Ця сторінка вже доступна лише admin (AdminRoute у App.tsx),
            тож currentUser?.role тут завжди 'admin' — перевірка
            залишена явно (canAssignAdmin), а не прибрана, щоб опція
            "admin" не з'явилась сама собою, якщо колись хтось послабить
            захист маршруту. Сервер (users.controller.ts) все одно
            відмовить не-admin, хто б не відправив role: 'admin' напряму
            через API. */}
        <UserForm
          values={form}
          onChange={setForm}
          canAssignAdmin={currentUser?.role === 'admin'}
          onSubmit={handleSubmit}
          isSubmitting={createUser.isPending}
          error={formError}
        />
      </Card>

      <Card title={t('users.listTitle')}>
        <QueryStatus query={usersQuery} loadingText={t('users.loading')} errorFallback={t('users.loadError')}>
          <UserTable users={users} />
        </QueryStatus>
        {meta && (
          <Pagination page={meta.page} totalPages={meta.totalPages} total={meta.total} onPageChange={setPage} />
        )}
      </Card>
    </Page>
  )
}
