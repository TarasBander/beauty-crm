import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { ApiError } from '../api/http'
import { FormError } from './FormError'

// Мінімальна форма useQuery-результату, яку насправді використовує цей
// компонент — не імпортуємо повний UseQueryResult<T>, щоб QueryStatus
// однаково підходив і для пагінованого списку, і для одного об'єкта
// (наприклад ClientDetailPage), не тягнучи за собою їхні типи даних.
interface QueryLike {
  isPending: boolean
  isError: boolean
  isSuccess: boolean
  error: unknown
}

interface QueryStatusProps {
  query: QueryLike
  /** За замовчуванням common.loading; сторінка передає власний текст
   * (наприклад "clients.loading"), коли він відрізняється. */
  loadingText?: ReactNode
  /** Текст, якщо помилка не ApiError (тобто без свого message з бекенду). */
  errorFallback: ReactNode
  /** true, коли запит успішний, але показувати нема чого (список
   * порожній) — керує сама сторінка, бо тільки вона знає форму даних
   * (data.data.length, чи відфільтрований список тощо). */
  isEmpty?: boolean
  emptyText?: ReactNode
  children: ReactNode
}

/**
 * Повторювана трійка isPending / isError / isSuccess+порожньо, яку
 * раніше кожна сторінка виписувала сама над своєю таблицею. Сюди не
 * винесено "успіх і є дані" — це children, які сторінка складає сама
 * (таблиця, канбан, що завгодно).
 */
export function QueryStatus({
  query,
  loadingText,
  errorFallback,
  isEmpty,
  emptyText,
  children,
}: QueryStatusProps) {
  const { t } = useTranslation()

  if (query.isPending) {
    return <p>{loadingText ?? t('common.loading')}</p>
  }

  if (query.isError) {
    return (
      <FormError>{query.error instanceof ApiError ? query.error.message : errorFallback}</FormError>
    )
  }

  if (query.isSuccess) {
    if (isEmpty) {
      return emptyText ? <p className="subtitle">{emptyText}</p> : null
    }
    return <>{children}</>
  }

  return null
}
