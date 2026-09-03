import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import {
  api,
  ApiError,
  type Client,
  type Deal,
  type PublicUser,
  type Task,
} from '../api/client'
import { useAuth } from '../auth/AuthContext'

const emptyForm = {
  title: '',
  description: '',
  dueDate: '',
  clientId: '',
  dealId: '',
  assignedToId: '',
}

type Filter = 'active' | 'done' | 'all'

function todayStr() {
  return new Date().toISOString().slice(0, 10)
}

export function TasksPage() {
  const { token, user } = useAuth()
  const { t } = useTranslation()

  const [tasks, setTasks] = useState<Task[]>([])
  const [isLoadingTasks, setIsLoadingTasks] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)

  const [clients, setClients] = useState<Client[]>([])
  const [deals, setDeals] = useState<Deal[]>([])
  const [managers, setManagers] = useState<PublicUser[]>([])

  const [form, setForm] = useState(emptyForm)
  const [formError, setFormError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [filter, setFilter] = useState<Filter>('active')
  const [togglingTaskId, setTogglingTaskId] = useState<string | null>(null)

  const loadTasks = () => {
    if (!token) return
    setIsLoadingTasks(true)
    api
      .listTasks(token)
      .then(setTasks)
      .catch((err: unknown) => {
        setLoadError(err instanceof ApiError ? err.message : t('tasks.loadError'))
      })
      .finally(() => setIsLoadingTasks(false))
  }

  useEffect(loadTasks, [token])

  useEffect(() => {
    if (!token) return
    api.listClients(token).then(setClients).catch(() => {})
    api.listDeals(token).then(setDeals).catch(() => {})
    api.listUsers(token).then(setManagers).catch(() => {})
  }, [token])

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    if (!token) return
    setFormError(null)
    setIsSubmitting(true)
    try {
      await api.createTask(token, {
        title: form.title,
        description: form.description || undefined,
        dueDate: form.dueDate || undefined,
        clientId: form.clientId || undefined,
        dealId: form.dealId || undefined,
        assignedToId: form.assignedToId || undefined,
      })
      setForm(emptyForm)
      loadTasks()
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : t('tasks.createError'))
    } finally {
      setIsSubmitting(false)
    }
  }

  const toggleDone = async (task: Task) => {
    if (!token) return
    const nextStatus = task.status === 'done' ? 'pending' : 'done'
    setTogglingTaskId(task.id)
    setTasks((prev) => prev.map((x) => (x.id === task.id ? { ...x, status: nextStatus } : x)))
    try {
      await api.updateTask(token, task.id, { status: nextStatus })
    } catch {
      setTasks((prev) => prev.map((x) => (x.id === task.id ? { ...x, status: task.status } : x)))
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
            />
          </label>

          <label>
            {t('tasks.field.description')}
            <textarea
              rows={2}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
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

          <button type="submit" disabled={isSubmitting}>
            {isSubmitting ? t('tasks.submitting') : t('tasks.submit')}
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
        </div>

        {isLoadingTasks && <p>{t('tasks.loading')}</p>}
        {loadError && <p className="form-error">{loadError}</p>}
        {!isLoadingTasks && !loadError && visibleTasks.length === 0 && (
          <p className="subtitle">{t('tasks.empty')}</p>
        )}
        {!isLoadingTasks && !loadError && visibleTasks.length > 0 && (
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
        )}
      </section>
    </div>
  )
}
