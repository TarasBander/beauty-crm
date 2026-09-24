import type { Client, CreateClientDto } from './api'

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

function emptyToUndefined(value: string): string | undefined {
  return value.trim() === '' ? undefined : value
}

/**
 * Один DTO і для POST (ClientsPage), і для PATCH (ClientDetailPage) —
 * раніше це були дві окремі функції, і порожній рядок означав у них
 * РІЗНІ речі: на створенні "не вказано" (undefined, бекенд підставить
 * дефолт — я/нічого), на редагуванні "очисти поле" (порожній рядок іде
 * як є). Найпідступніше було з assignedToId: перший пункт у списку
 * менеджера підписаний "Я (ім'я)" з value="" — на створенні це справді
 * означало "признач мені", а на збереженні редагування те саме "" бекенд
 * розумів як "зніми призначення" (assignedToId: null), а не "признач
 * мені". Тепер порожнє необов'язкове поле в ОБОХ формах означає
 * однаково: "не надсилати це поле" — PATCH тоді лишає його без змін,
 * так само як POST підставляє дефолт. `UpdateClientDto` — це
 * `Partial<CreateClientDto>`, тож повний CreateClientDto без проблем
 * підходить туди, де очікується частковий.
 */
export function toClientWriteDto(values: ClientFormValues): CreateClientDto {
  return {
    firstName: values.firstName.trim(),
    lastName: values.lastName.trim(),
    phone: values.phone.trim(),
    email: emptyToUndefined(values.email),
    salonName: emptyToUndefined(values.salonName),
    position: emptyToUndefined(values.position),
    address: emptyToUndefined(values.address),
    notes: emptyToUndefined(values.notes),
    assignedToId: emptyToUndefined(values.assignedToId),
  }
}
