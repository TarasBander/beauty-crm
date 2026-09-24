import { useMemo, useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { ApiError } from '../../shared/api/http'
import { Banner } from '../../shared/components/Banner'
import { Card } from '../../shared/components/Card'
import { Page } from '../../shared/components/Page'
import { QueryStatus } from '../../shared/components/QueryStatus'
import { downloadCsv } from '../../shared/utils/csv'
import { todayLocalISO } from '../../shared/utils/date'
import { isListCapped } from '../../shared/utils/pagination'
import { useAnalyticsDashboard } from '../analytics/hooks'
import { useAuth } from '../auth/AuthContext'
import { useAllUsers } from '../users/hooks'
import { TaskFilterTabs } from './components/TaskFilterTabs'
import { TaskForm } from './components/TaskForm'
import { TaskTable } from './components/TaskTable'
import { emptyTaskForm, toCreateTaskDto, type TaskFormValues } from './taskForm'
import { filterAndSortTasks, type TaskFilter } from './taskFilter'
import type { Task } from './api'
import { exportAllTasks, useAllTasks, useCreateTask, useUpdateTask } from './hooks'

// A stable reference for the "no data yet" fallback — `data ?? []` would
// otherwise create a brand-new array every render, which the useMemo
// below would then see as "changed" on every single render.
const EMPTY_TASKS: Task[] = []

export function TasksPage() {
  const { token, user } = useAuth()
  const { t } = useTranslation()

  const tasksQuery = useAllTasks()
  const managersQuery = useAllUsers()
  // Точні лічильники для вкладок (активні/виконані/усі) — з
  // /analytics/dashboard, а не порахована тут із capped tasksQuery
  // (SELECT_PAGE_SIZE = 100). Сам список у таблиці нижче все ще читає
  // tasksQuery — банер під таблицею попереджає, якщо він неповний.
  const analyticsQuery = useAnalyticsDashboard()
  const createTask = useCreateTask()
  const updateTask = useUpdateTask()

  const tasks = tasksQuery.data?.data ?? EMPTY_TASKS
  const managers = managersQuery.data?.data ?? []

  const [form, setForm] = useState<TaskFormValues>(emptyTaskForm)
  const [formError, setFormError] = useState<string | null>(null)
  const [isExporting, setIsExporting] = useState(false)
  const [exportWarning, setExportWarning] = useState<string | null>(null)

  const [filter, setFilter] = useState<TaskFilter>('active')
  const [togglingTaskId, setTogglingTaskId] = useState<string | null>(null)

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setFormError(null)
    try {
      await createTask.mutateAsync(toCreateTaskDto(form))
      setForm(emptyTaskForm)
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : t('tasks.createError'))
    }
  }

  const toggleDone = async (task: Task) => {
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

  const today = todayLocalISO()

  const visibleTasks = useMemo(() => filterAndSortTasks(tasks, filter), [tasks, filter])

  const exportTasks = async () => {
    if (!token) return
    setIsExporting(true)
    setExportWarning(null)
    try {
      const { rows, truncated, total } = await exportAllTasks(token)
      downloadCsv(
        'tasks.csv',
        rows.map((task) => ({
          title: task.title,
          status: t(`tasks.filter.${task.status === 'pending' ? 'active' : 'done'}`),
          dueDate: task.dueDate ?? '',
          client: task.client ? `${task.client.firstName} ${task.client.lastName}` : '',
          deal: task.deal ? task.deal.title : '',
          assignedTo: task.assignedTo ? `${task.assignedTo.firstName} ${task.assignedTo.lastName}` : '',
        })),
      )
      if (truncated) {
        setExportWarning(t('common.exportTruncated', { count: rows.length, total }))
      }
    } finally {
      setIsExporting(false)
    }
  }

  const activeCount = analyticsQuery.data?.tasks.pending ?? tasks.filter((task) => task.status === 'pending').length
  const doneCount = analyticsQuery.data?.tasks.done ?? tasks.filter((task) => task.status === 'done').length
  const totalCount = analyticsQuery.data?.tasks.total ?? tasks.length

  return (
    <Page title={t('tasks.title')}>
      <Card title={t('tasks.addTitle')}>
        <TaskForm
          values={form}
          onChange={setForm}
          managers={managers}
          currentUserFirstName={user?.firstName}
          onSubmit={handleSubmit}
          isSubmitting={createTask.isPending}
          error={formError}
        />
      </Card>

      <Card
        title={t('tasks.listTitle')}
        actions={
          <>
            <TaskFilterTabs
              filter={filter}
              onFilterChange={setFilter}
              activeCount={activeCount}
              doneCount={doneCount}
              totalCount={totalCount}
            />
            {visibleTasks.length > 0 && (
              <button type="button" onClick={exportTasks} disabled={isExporting}>
                {t('common.exportCsv')}
              </button>
            )}
          </>
        }
      >
        {exportWarning && <Banner>{exportWarning}</Banner>}
        {isListCapped(tasksQuery.data?.meta, tasks.length) && (
          <Banner>{t('common.incompleteData', { loaded: tasks.length, total: tasksQuery.data?.meta.total })}</Banner>
        )}
        <QueryStatus
          query={tasksQuery}
          loadingText={t('tasks.loading')}
          errorFallback={t('tasks.loadError')}
          isEmpty={visibleTasks.length === 0}
          emptyText={t('tasks.empty')}
        >
          <TaskTable tasks={visibleTasks} today={today} togglingTaskId={togglingTaskId} onToggleDone={toggleDone} />
        </QueryStatus>
      </Card>
    </Page>
  )
}
