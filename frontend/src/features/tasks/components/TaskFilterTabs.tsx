import { useTranslation } from 'react-i18next'
import type { TaskFilter } from '../taskFilter'

interface TaskFilterTabsProps {
  filter: TaskFilter
  onFilterChange: (filter: TaskFilter) => void
  activeCount: number
  doneCount: number
  totalCount: number
}

export function TaskFilterTabs({ filter, onFilterChange, activeCount, doneCount, totalCount }: TaskFilterTabsProps) {
  const { t } = useTranslation()

  return (
    <div className="task-filter-tabs">
      <button type="button" className={filter === 'active' ? 'active' : ''} onClick={() => onFilterChange('active')}>
        {t('tasks.filter.active')} ({activeCount})
      </button>
      <button type="button" className={filter === 'done' ? 'active' : ''} onClick={() => onFilterChange('done')}>
        {t('tasks.filter.done')} ({doneCount})
      </button>
      <button type="button" className={filter === 'all' ? 'active' : ''} onClick={() => onFilterChange('all')}>
        {t('tasks.filter.all')} ({totalCount})
      </button>
    </div>
  )
}
