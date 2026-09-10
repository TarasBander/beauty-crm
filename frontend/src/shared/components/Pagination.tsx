import { useTranslation } from 'react-i18next'

interface PaginationProps {
  page: number
  totalPages: number
  total: number
  onPageChange: (page: number) => void
}

/** Shared prev/next pager for every paginated list table in the app. */
export function Pagination({ page, totalPages, total, onPageChange }: PaginationProps) {
  const { t } = useTranslation()

  if (totalPages <= 1) return null

  return (
    <div className="pagination">
      <button
        type="button"
        onClick={() => onPageChange(page - 1)}
        disabled={page <= 1}
      >
        {t('common.pagination.prev')}
      </button>
      <span className="pagination-info">
        {t('common.pagination.pageInfo', { page, totalPages, total })}
      </span>
      <button
        type="button"
        onClick={() => onPageChange(page + 1)}
        disabled={page >= totalPages}
      >
        {t('common.pagination.next')}
      </button>
    </div>
  )
}
