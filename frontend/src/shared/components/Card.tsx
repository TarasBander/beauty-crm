import type { ReactNode } from 'react'

interface CardProps {
  title?: ReactNode
  actions?: ReactNode
  /** Додатковий клас на самій секції — потрібен там, де картка сама є
   * flex-контейнером зі своїм gap для прямих дітей (наприклад
   * "kanban-carousel" на DealsPage: рядок заголовка й дошка стадій
   * мають бути прямими дітьми ОДНОГО flex-контейнера, а не вкладеними
   * один в одного, інакше зникає відступ між ними — gap рахується
   * тільки для прямих дітей). */
  className?: string
  children: ReactNode
}

/**
 * Секція-картка ("card" в App.css) — кожна сторінка складається з кількох
 * таких: форма додавання, таблиця списку тощо. `actions` — те, що раніше
 * ставили поруч із заголовком через клас "task-filter-row" (кнопка
 * "Експорт CSV" на ClientsPage, вкладки-фільтри на TasksPage, "Показати
 * все" на дашборді) — клас лишився той самий, тепер просто не
 * копіюється в кожен файл вручну.
 */
export function Card({ title, actions, className, children }: CardProps) {
  return (
    <section className={className ? `card ${className}` : 'card'}>
      {title && !actions && <h2>{title}</h2>}
      {title && actions && (
        <div className="task-filter-row">
          <h2>{title}</h2>
          {actions}
        </div>
      )}
      {children}
    </section>
  )
}
