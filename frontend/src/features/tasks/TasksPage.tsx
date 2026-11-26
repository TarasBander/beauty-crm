import { useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { ApiError, messageFrom } from '../../shared/api/http'
import { Banner } from '../../shared/components/Banner'
import { Card } from '../../shared/components/Card'
import { FormError } from '../../shared/components/FormError'
import { Page } from '../../shared/components/Page'
import { Pagination } from '../../shared/components/Pagination'
import { QueryStatus } from '../../shared/components/QueryStatus'
import { downloadCsv } from '../../shared/utils/csv'
import { todayLocalISO } from '../../shared/utils/date'
import { useAnalyticsDashboard } from '../analytics/hooks'
import { useAuth } from '../auth/AuthContext'
import { useAllUsers } from '../users/hooks'
import { TaskFilterTabs } from './components/TaskFilterTabs'
import { TaskForm } from './components/TaskForm'
import { TaskTable } from './components/TaskTable'
import { emptyTaskForm, toCreateTaskDto, type TaskFormValues } from './taskForm'
import { taskFilterToStatus, type TaskFilter } from './taskFilter'
import type { Task } from './api'
import { exportAllTasks, useCreateTask, useTasks, useUpdateTask } from './hooks'

export function TasksPage() {
  const { token, user } = useAuth()
  const { t } = useTranslation()

  // Фільтр за вкладкою і сортування — на бекенді, тож кожна сторінка
  // таблиці показує саме ті задачі, що мають бути на ній.
  const [filter, setFilter] = useState<TaskFilter>('active')
  const [page, setPage] = useState(1)
  const tasksQuery = useTasks({ page, status: taskFilterToStatus(filter) })
  const managersQuery = useAllUsers()
  // Лічильники на вкладках (активні/виконані/усі) — з /analytics/dashboard,
  // по всіх задачах, а не лише з поточної сторінки.
  const analyticsQuery = useAnalyticsDashboard()
  const createTask = useCreateTask()
  const updateTask = useUpdateTask()

  const tasks = tasksQuery.data?.data ?? []
  const meta = tasksQuery.data?.meta
  const managers = managersQuery.data?.data ?? []

  const [form, setForm] = useState<TaskFormValues>(emptyTaskForm)
  const [formError, setFormError] = useState<string | null>(null)
  const [isExporting, setIsExporting] = useState(false)
  const [exportWarning, setExportWarning] = useState<string | null>(null)
  const [exportError, setExportError] = useState<string | null>(null)

  const changeFilter = (next: TaskFilter) => {
    setFilter(next)
    setPage(1)
  }
  const [togglingTaskId, setTogglingTaskId] = useState<string | null>(null)
  const [toggleError, setToggleError] = useState<string | null>(null)

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
    setToggleError(null)
    try {
      await updateTask.mutateAsync({ id: task.id, dto: { status: nextStatus } })
    } catch (err) {
      // the mutation's onError already rolled the optimistic change back —
      // this just explains why the checkbox snapped back.
      setToggleError(messageFrom(err, t('tasks.toggleError')))
    } finally {
      setTogglingTaskId(null)
    }
  }

  const today = todayLocalISO()

  const exportTasks = async () => {
    if (!token) return
    setIsExporting(true)
    setExportWarning(null)
    setExportError(null)
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
    } catch (err) {
      setExportError(messageFrom(err, t('common.exportError')))
    } finally {
      setIsExporting(false)
    }
  }

  const activeCount = analyticsQuery.data?.tasks.pending ?? 0
  const doneCount = analyticsQuery.data?.tasks.done ?? 0
  const totalCount = analyticsQuery.data?.tasks.total ?? meta?.total ?? 0

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
              onFilterChange={changeFilter}
              activeCount={activeCount}
              doneCount={doneCount}
              totalCount={totalCount}
            />
            {totalCount > 0 && (
              <button type="button" onClick={exportTasks} disabled={isExporting}>
                {t('common.exportCsv')}
              </button>
            )}
          </>
        }
      >
        {exportWarning && <Banner>{exportWarning}</Banner>}
        {exportError && <FormError>{exportError}</FormError>}
        {toggleError && <FormError>{toggleError}</FormError>}
        <QueryStatus
          query={tasksQuery}
          loadingText={t('tasks.loading')}
          errorFallback={t('tasks.loadError')}
          isEmpty={tasks.length === 0}
          emptyText={t('tasks.empty')}
        >
          <TaskTable tasks={tasks} today={today} togglingTaskId={togglingTaskId} onToggleDone={toggleDone} />
          {meta && (
            <Pagination page={meta.page} totalPages={meta.totalPages} total={meta.total} onPageChange={setPage} />
          )}
        </QueryStatus>
      </Card>
    </Page>
  )
}
