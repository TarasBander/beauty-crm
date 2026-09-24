import type { CreatePaymentDto, PaymentMethod } from './api'

export interface PaymentFormValues {
  dealId: string
  amount: string
  method: PaymentMethod
  notes: string
}

export const emptyPaymentForm: PaymentFormValues = {
  dealId: '',
  amount: '',
  method: 'card',
  notes: '',
}

export function toCreatePaymentDto(values: PaymentFormValues): CreatePaymentDto {
  return {
    dealId: values.dealId,
    amount: Number(values.amount),
    method: values.method,
    notes: values.notes || undefined,
  }
}
