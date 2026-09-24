import type { Client, CreateClientDto, UpdateClientDto } from './api'

export interface ClientFormValues {
  firstName: string
  lastName: string
  phone: string
  email: string
  salonName: string
  position: string
  address: string
  notes: string
  assignedToId: string
}

export const emptyClientForm: ClientFormValues = {
  firstName: '',
  lastName: '',
  phone: '',
  email: '',
  salonName: '',
  position: '',
  address: '',
  notes: '',
  assignedToId: '',
}

/** ClientDetailPage: заповнює форму редагування значеннями вже
 * завантаженого клієнта. */
export function clientToFormValues(client: Client): ClientFormValues {
  return {
    firstName: client.firstName,
    lastName: client.lastName,
    phone: client.phone,
    email: client.email ?? '',
    salonName: client.salonName ?? '',
    position: client.position ?? '',
    address: client.address ?? '',
    notes: client.notes ?? '',
    assignedToId: client.assignedTo?.id ?? '',
  }
}

/** ClientsPage (створення): порожні необов'язкові поля йдуть як
 * undefined, а не порожній рядок — так само, як раніше вручну робив
 * деструктуризований handleSubmit. */
export function toCreateClientDto(values: ClientFormValues): CreateClientDto {
  return {
    firstName: values.firstName,
    lastName: values.lastName,
    phone: values.phone,
    email: values.email || undefined,
    salonName: values.salonName || undefined,
    position: values.position || undefined,
    address: values.address || undefined,
    notes: values.notes || undefined,
    assignedToId: values.assignedToId || undefined,
  }
}

/** ClientDetailPage (редагування): PATCH надсилає всі поля як є —
 * порожній рядок тут означає "очистити поле", а не "не міняти". */
export function toUpdateClientDto(values: ClientFormValues): UpdateClientDto {
  return {
    firstName: values.firstName,
    lastName: values.lastName,
    phone: values.phone,
    email: values.email,
    salonName: values.salonName,
    position: values.position,
    address: values.address,
    notes: values.notes,
    assignedToId: values.assignedToId,
  }
}
