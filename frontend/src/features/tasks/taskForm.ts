import type { CreateTaskDto } from './api'

export interface TaskFormValues {
  title: string
  description: string
  dueDate: string
  clientId: string
  dealId: string
  assignedToId: string
}

export const emptyTaskForm: TaskFormValues = {
  title: '',
  description: '',
  dueDate: '',
  clientId: '',
  dealId: '',
  assignedToId: '',
}

export function toCreateTaskDto(values: TaskFormValues): CreateTaskDto {
  return {
    title: values.title,
    description: values.description || undefined,
    dueDate: values.dueDate || undefined,
    clientId: values.clientId || undefined,
    dealId: values.dealId || undefined,
    assignedToId: values.assignedToId || undefined,
  }
}
