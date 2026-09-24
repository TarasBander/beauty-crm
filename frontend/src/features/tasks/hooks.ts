import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { SELECT_PAGE_SIZE, fetchAllPages, type PaginationParams } from '../../shared/api/http'
import { analyticsKeys } from '../analytics/api'
import { useAuthenticatedToken } from '../auth/AuthContext'
import { taskKeys, tasksApi, type CreateTaskDto, type Task, type UpdateTaskDto } from './api'

// useQuery — одна сторінка задач.
export function useTasks(params: PaginationParams = {}) {
  const token = useAuthenticatedToken()
  return useQuery({
    queryKey: taskKeys.list(params),
    queryFn: () => tasksApi.list(token, params),
    enabled: !!token,
    placeholderData: (prev) => prev,
  })
}

/**
 * Список задач на сторінці "Задачі" — той самий useTasks() зверху з
 * limit = SELECT_PAGE_SIZE (100). Лічильники на вкладках
 * (активні/виконані/усі) з цього списку більше НЕ рахуються — вони
 * йдуть з /analytics/dashboard (рахує з УСІХ задач), TasksPage передає
 * їх у TaskFilterTabs напряму. Цей хук лишається лише джерелом рядків
 * самої таблиці; якщо задач більше, ніж завантажено, TasksPage показує
 * банер (дивись Banner.tsx), а не мовчить про різницю.
 */
export function useAllTasks() {
  return useTasks({ page: 1, limit: SELECT_PAGE_SIZE })
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
