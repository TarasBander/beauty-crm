import type { Role } from '../../shared/api/types'
import type { CreateUserDto } from './api'

export interface UserFormValues {
  email: string
  password: string
  firstName: string
  lastName: string
  role: Role
}

export const emptyUserForm: UserFormValues = {
  email: '',
  password: '',
  firstName: '',
  lastName: '',
  role: 'sales_manager',
}

export function toCreateUserDto(values: UserFormValues): CreateUserDto {
  return values
}
