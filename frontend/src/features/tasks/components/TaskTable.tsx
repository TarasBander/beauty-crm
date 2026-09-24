import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import type { Task } from '../api'

interface TaskTableProps {
  tasks: Task[]
  today: string
  togglingTaskId: string | null
  onToggleDone: (task: Task) => void
}

export function TaskTable({ tasks, today, togglingTaskId, onToggleDone }: TaskTableProps) {
  const { t } = useTranslation()

  return (
    <div className="table-scroll">
      <table className="users-table">
        <thead>
          <tr>
            <th></th>
            <th>{t('tasks.columns.title')}</th>
            <th>{t('tasks.columns.dueDate')}</th>
            <th>{t('tasks.columns.client')}</th>
            <th>{t('tasks.columns.deal')}</th>
            <th>{t('tasks.columns.assignedTo')}</th>
          </tr>
        </thead>
        <tbody>
          {tasks.map((task) => {
            const isOverdue = task.status === 'pending' && !!task.dueDate && task.dueDate < today
            return (
              <tr key={task.id} className={task.status === 'done' ? 'task-row-done' : ''}>
                <td>
                  <input
                    type="checkbox"
                    checked={task.status === 'done'}
                    disabled={togglingTaskId === task.id}
                    onChange={() => onToggleDone(task)}
                    aria-label={t('tasks.markDone')}
                  />
                </td>
                <td>{task.title}</td>
                <td className={isOverdue ? 'task-overdue' : ''}>{task.dueDate ?? '—'}</td>
                <td>
                  {task.client ? (
                    <Link to={`/clients/${task.client.id}`} className="text-link">
                      {task.client.firstName} {task.client.lastName}
                    </Link>
                  ) : (
                    '—'
                  )}
                </td>
                <td>{task.deal?.title ?? '—'}</td>
                <td>{task.assignedTo ? `${task.assignedTo.firstName} ${task.assignedTo.lastName}` : '—'}</td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
