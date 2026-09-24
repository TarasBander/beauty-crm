import type { PaginationMeta } from '../api/http'

/**
 * True коли на сервері рядків більше, ніж прийшло в поточній сторінці —
 * тобто список/сума, порахована з `loadedCount` рядків, НЕ повна. Дрібна
 * спільна перевірка для банерів чесності (shared/components/Banner.tsx)
 * на сторінках, які все ще читають один капований запит (useAllDeals,
 * useAllTasks, useAllPayments — SELECT_PAGE_SIZE = 100) замість
 * окремого агрегатного ендпоінта.
 */
export function isListCapped(meta: PaginationMeta | undefined, loadedCount: number): boolean {
  return !!meta && meta.total > loadedCount
}
