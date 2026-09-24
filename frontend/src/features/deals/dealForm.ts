import type { CreateDealDto } from './api'

export interface DealFormValues {
  title: string
  amount: string
  clientId: string
  assignedToId: string
  notes: string
}

export const emptyDealForm: DealFormValues = {
  title: '',
  amount: '',
  clientId: '',
  assignedToId: '',
  notes: '',
}

export function toCreateDealDto(values: DealFormValues): CreateDealDto {
  return {
    title: values.title,
    amount: Number(values.amount),
    clientId: values.clientId,
    assignedToId: values.assignedToId || undefined,
    notes: values.notes || undefined,
  }
}
