import type { TaskStatus } from './api'

export type TaskFilter = 'active' | 'done' | 'all'

/** Вкладка TasksPage → `?status=` для бекенду (він же й сортує:
 * активні за терміном, виконані — найновіші зверху). */
export function taskFilterToStatus(filter: TaskFilter): TaskStatus | undefined {
  if (filter === 'active') return 'pending'
  if (filter === 'done') return 'done'
  return undefined
}
