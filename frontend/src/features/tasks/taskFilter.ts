import type { Task } from './api'

export type TaskFilter = 'active' | 'done' | 'all'

/** Фільтрує список задач за вкладкою (активні/виконані/усі) і сортує:
 * активні — за терміном виконання (без терміну — в кінець), виконані —
 * за часом останньої зміни (найновіші зверху). Винесено з TasksPage,
 * бо це чиста логіка над масивом, а не щось про рендер. */
export function filterAndSortTasks(tasks: Task[], filter: TaskFilter): Task[] {
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
}
