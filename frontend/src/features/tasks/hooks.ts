import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { fetchAllPages } from '../../shared/api/http'
import { analyticsKeys } from '../analytics/api'
import { useAuthenticatedToken } from '../auth/AuthContext'
import { taskKeys, tasksApi, type CreateTaskDto, type Task, type TaskListParams, type UpdateTaskDto } from './api'

// useQuery — одна сторінка задач (з фільтром за статусом, якщо заданий).
export function useTasks(params: TaskListParams = {}) {
  const token = useAuthenticatedToken()
  return useQuery({
    queryKey: taskKeys.list(params),
    queryFn: () => tasksApi.list(token, params),
    enabled: !!token,
    placeholderData: (prev) => prev,
  })
}


// useMutation — створення задачі, інвалідуємо закешовані списки задач.
export function useCreateTask() {
  const token = useAuthenticatedToken()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (dto: CreateTaskDto) => tasksApi.create(token, dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: taskKeys.lists() })
      // Лічильники вкладок (TaskFilterTabs) і "найближчі задачі" на
      // дашборді читаються з /analytics/dashboard — окремий кеш від
      // taskKeys, який теж треба протухнути, інакше нова задача
      // з'явиться в таблиці, а лічильник "Активні (N)" лишиться
      // старим.
      queryClient.invalidateQueries({ queryKey: analyticsKeys.dashboard })
    },
  })
}

interface TasksListData {
  data: Task[]
  meta: unknown
}

// useMutation з оптимістичним оновленням для чекбокса "виконано" —
// той самий патерн onMutate/onError/onSettled, що й у useUpdateDeal.
export function useUpdateTask() {
  const token = useAuthenticatedToken()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: UpdateTaskDto }) =>
      tasksApi.update(token, id, dto),
    onMutate: async ({ id, dto }) => {
      await queryClient.cancelQueries({ queryKey: taskKeys.lists() })
      const previous = queryClient.getQueriesData<TasksListData>({ queryKey: taskKeys.lists() })
      previous.forEach(([key, data]) => {
        if (!data) return
        queryClient.setQueryData<TasksListData>(key, {
          ...data,
          data: data.data.map((task) => (task.id === id ? { ...task, ...dto } : task)),
        })
      })
      return { previous }
    },
    onError: (_err, _vars, context) => {
      context?.previous.forEach(([key, data]) => {
        queryClient.setQueryData(key, data)
      })
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: taskKeys.lists() })
      // Виконано/активно змінилось — лічильники вкладок і "прострочені"
      // на дашборді/аналітиці застаріли теж.
      queryClient.invalidateQueries({ queryKey: analyticsKeys.dashboard })
    },
  })
}

/** Забирає всі задачі по всіх сторінках — для експорту в CSV. */
export function exportAllTasks(token: string) {
  return fetchAllPages((params) => tasksApi.list(token, params))
}
