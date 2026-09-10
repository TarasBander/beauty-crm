import { useMemo, useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { ApiError } from '../../shared/api/http'
import { downloadCsv } from '../../shared/utils/csv'
import { useAuth } from '../auth/AuthContext'
import { useAllClients } from '../clients/hooks'
import { useAllDeals } from '../deals/hooks'
import { useAllUsers } from '../users/hooks'
import type { Task } from './api'
import { exportAllTasks, useAllTasks, useCreateTask, useUpdateTask } from './hooks'

const emptyForm = {
  title: '',
  description: '',
  dueDate: '',
  clientId: '',
  dealId: '',
  assignedToId: '',
}

type Filter = 'active' | 'done' | 'all'

// A stable reference for the "no data yet" fallback — `data ?? []` would
// otherwise create a brand-new array every render, which the useMemo
// below would then see as "changed" on every single render.
const EMPTY_TASKS: Task[] = []

function todayStr() {
  return new Date().toISOString().slice(0, 10)
}

export function TasksPage() {
  const { token, user } = useAuth()
  const { t } = useTranslation()

  const tasksQuery = useAllTasks()
  const clientsQuery = useAllClients()
  const dealsQuery = useAllDeals()
  const managersQuery = useAllUsers()
  const createTask = useCreateTask()
  const updateTask = useUpdateTask()

  const tasks = tasksQuery.data?.data ?? EMPTY_TASKS
  const clients = clientsQuery.data?.data ?? []
  const deals = dealsQuery.data?.data ?? []
  const managers = managersQuery.data?.data ?? []

  const [form, setForm] = useState(emptyForm)
  const [formError, setFormError] = useState<string | null>(null)
  const [isExporting, setIsExporting] = useState(false)

  const [filter, setFilter] = useState<Filter>('active')
  const [togglingTaskId, setTogglingTaskId] = useState<string | null>(null)

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setFormError(null)
    try {
      await createTask.mutateAsync({
        title: form.title,
        description: form.description || undefined,
        dueDate: form.dueDate || undefined,
        clientId: form.clientId || undefined,
        dealId: form.dealId || undefined,
        assignedToId: form.assignedToId || undefined,
      })
      setForm(emptyForm)
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : t('tasks.createError'))
    }
  }

  const toggleDone = async (task: (typeof tasks)[number]) => {
    const nextStatus = task.status === 'done' ? 'pending' : 'done'
    setTogglingTaskId(task.id)
    try {
      await updateTask.mutateAsync({ id: task.id, dto: { status: nextStatus } })
    } catch {
      // the mutation's onError already rolled the optimistic change back
    } finally {
      setTogglingTaskId(null)
    }
  }

  const today = todayStr()

  const visibleTasks = useMemo(() => {
    const filtered = tasks.filter((task) => {
      if (filter === 'active') return task.status === 'pending'
      if (filter === 'done') return task.status === 'done'
      return true
    })
    return [...filtered].sort((a, b) => {
      if (a.status !== b.status) return a.status === 'pending' ? -1 : 1
      if (a.status === 'pending') {
        if (!a.dueDate && !b.dueDate) return 0
        if (!a.dueDate) return 1
        if (!b.dueDate) return -1
        return a.dueDate.localeCompare(b.dueDate)
      }
      return b.updatedAt.localeCompare(a.updatedAt)
    })
  }, [tasks, filter])

  const exportTasks = async () => {
    if (!token) return
    setIsExporting(true)
    try {
      const all = await exportAllTasks(token)
      downloadCsv(
        'tasks.csv',
        all.map((task) => ({
          title: task.title,
          status: t(`tasks.filter.${task.status === 'pending' ? 'active' : 'done'}`),
          dueDate: task.dueDate ?? '',
          client: task.client ? `${task.client.firstName} ${task.client.lastName}` : '',
          deal: task.deal ? task.deal.title : '',
          assignedTo: task.assignedTo ? `${task.assignedTo.firstName} ${task.assignedTo.lastName}` : '',
        })),
      )
    } finally {
      setIsExporting(false)
    }
  }

  const activeCount = tasks.filter((t) => t.status === 'pending').length
  const doneCount = tasks.filter((t) => t.status === 'done').length

  return (
    <div className="users-page">
      <h1>{t('tasks.title')}</h1>

      <section className="card">
        <h2>{t('tasks.addTitle')}</h2>
        <form className="user-form" onSubmit={handleSubmit}>
          <label>
            {t('tasks.field.title')}
            <input
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              required
              maxLength={200}
            />
          </label>

          <label>
            {t('tasks.field.description')}
            <textarea
              rows={2}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              maxLength={2000}
            />
          </label>

          <div className="form-row">
            <label>
              {t('tasks.field.dueDate')}
              <input
                type="date"
                value={form.dueDate}
                onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
              />
            </label>
            <label>
              {t('tasks.field.assignedTo')}
              <select
                value={form.assignedToId}
                onChange={(e) => setForm({ ...form, assignedToId: e.target.value })}
              >
                <option value="">{t('clients.assignedToMe', { name: user?.firstName })}</option>
                {managers.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.firstName} {m.lastName}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="form-row">
            <label>
              {t('tasks.field.client')}
              <select
                value={form.clientId}
                onChange={(e) => setForm({ ...form, clientId: e.target.value, dealId: '' })}
              >
                <option value="">{t('tasks.field.notLinked')}</option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.firstName} {c.lastName}
                    {c.salonName ? ` — ${c.salonName}` : ''}
                  </option>
                ))}
              </select>
            </label>
            <label>
              {t('tasks.field.deal')}
              <select
                value={form.dealId}
                onChange={(e) => setForm({ ...form, dealId: e.target.value })}
              >
                <option value="">{t('tasks.field.notLinked')}</option>
                {deals
                  .filter((d) => !form.clientId || d.client.id === form.clientId)
                  .map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.title}
                    </option>
                  ))}
              </select>
            </label>
          </div>

          {formError && <p className="form-error">{formError}</p>}

          <button type="submit" disabled={createTask.isPending}>
            {createTask.isPending ? t('tasks.submitting') : t('tasks.submit')}
          </button>
        </form>
      </section>

      <section className="card">
        <div className="task-filter-row">
          <h2>{t('tasks.listTitle')}</h2>
          <div className="task-filter-tabs">
            <button
              type="button"
              className={filter === 'active' ? 'active' : ''}
              onClick={() => setFilter('active')}
            >
              {t('tasks.filter.active')} ({activeCount})
            </button>
            <button
              type="button"
              className={filter === 'done' ? 'active' : ''}
              onClick={() => setFilter('done')}
            >
              {t('tasks.filter.done')} ({doneCount})
            </button>
            <button
              type="button"
              className={filter === 'all' ? 'active' : ''}
              onClick={() => setFilter('all')}
            >
              {t('tasks.filter.all')} ({tasks.length})
            </button>
          </div>
          {visibleTasks.length > 0 && (
            <button type="button" onClick={exportTasks} disabled={isExporting}>
              {t('common.exportCsv')}
            </button>
          )}
        </div>

        {tasksQuery.isPending && <p>{t('tasks.loading')}</p>}
        {tasksQuery.isError && (
          <p className="form-error">
            {tasksQuery.error instanceof ApiError ? tasksQuery.error.message : t('tasks.loadError')}
          </p>
        )}
        {tasksQuery.isSuccess && visibleTasks.length === 0 && (
          <p className="subtitle">{t('tasks.empty')}</p>
        )}
        {tasksQuery.isSuccess && visibleTasks.length > 0 && (
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
              {visibleTasks.map((task) => {
                const isOverdue = task.status === 'pending' && !!task.dueDate && task.dueDate < today
                return (
                  <tr key={task.id} className={task.status === 'done' ? 'task-row-done' : ''}>
                    <td>
                      <input
                        type="checkbox"
                        checked={task.status === 'done'}
                        disabled={togglingTaskId === task.id}
                        onChange={() => toggleDone(task)}
                        aria-label={t('tasks.markDone')}
                      />
                    </td>
                    <td>{task.title}</td>
                    <td className={isOverdue ? 'task-overdue' : ''}>
                      {task.dueDate ?? '—'}
                    </td>
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
                    <td>
                      {task.assignedTo
                        ? `${task.assignedTo.firstName} ${task.assignedTo.lastName}`
                        : '—'}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          </div>
        )}
      </section>
    </div>
  )
}
