import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { SELECT_PAGE_SIZE, fetchAllPages, type PaginationParams } from '../../shared/api/http'
import { useAuth } from '../auth/AuthContext'
import { taskKeys, tasksApi, type CreateTaskDto, type Task, type UpdateTaskDto } from './api'

// useQuery — одна сторінка задач.
export function useTasks(params: PaginationParams = {}) {
  const { token } = useAuth()
  return useQuery({
    queryKey: taskKeys.list(params),
    queryFn: () => tasksApi.list(token as string, params),
    enabled: !!token,
    placeholderData: (prev) => prev,
  })
}

/**
 * Вкладки-фільтри списку задач (активні/виконані/усі) показують точну
 * кількість і сортують задачі за терміном по всьому набору, а не по
 * одній сторінці — та сама логіка, що й у useAllDeals(). Обмежено
 * SELECT_PAGE_SIZE.
 */
export function useAllTasks() {
  return useTasks({ page: 1, limit: SELECT_PAGE_SIZE })
}

// useMutation — створення задачі, інвалідуємо закешовані списки задач.
export function useCreateTask() {
  const { token } = useAuth()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (dto: CreateTaskDto) => tasksApi.create(token as string, dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: taskKeys.lists() })
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
  const { token } = useAuth()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: UpdateTaskDto }) =>
      tasksApi.update(token as string, id, dto),
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
    },
  })
}

/** Забирає всі задачі по всіх сторінках — для експорту в CSV. */
export function exportAllTasks(token: string) {
  return fetchAllPages((params) => tasksApi.list(token, params))
}
