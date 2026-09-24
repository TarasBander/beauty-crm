import { useTranslation } from 'react-i18next'
import type { PublicUser } from '../../../shared/api/types'

interface UserTableProps {
  users: PublicUser[]
}

export function UserTable({ users }: UserTableProps) {
  const { t } = useTranslation()

  return (
    <div className="table-scroll">
      <table className="users-table">
        <thead>
          <tr>
            <th>{t('users.columns.name')}</th>
            <th>{t('users.columns.email')}</th>
            <th>{t('users.columns.role')}</th>
          </tr>
        </thead>
        <tbody>
          {users.map((u) => (
            <tr key={u.id}>
              <td>
                {u.firstName} {u.lastName}
              </td>
              <td>{u.email}</td>
              <td>{t(`roles.${u.role}`)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
