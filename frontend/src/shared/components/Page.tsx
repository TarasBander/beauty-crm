import type { ReactNode } from 'react'

interface PageProps {
  title?: ReactNode
  children: ReactNode
}

/**
 * Верхній рівень будь-якої сторінки застосунку: необов'язковий заголовок
 * + вміст. До цього кожна сторінка сама писала `<div className="users-page">
 * <h1>...</h1>` — з іменем класу від UsersPage, першої написаної сторінки,
 * яке відтоді просто копіювали в кожну наступну (клас нічим не
 * стилізований у App.css, це порожня обгортка). Тепер це один компонент.
 */
export function Page({ title, children }: PageProps) {
  return (
    <div className="page">
      {title && <h1>{title}</h1>}
      {children}
    </div>
  )
}
