import type { ReactNode } from 'react'

interface BannerProps {
  children: ReactNode
}

/**
 * Малий інформаційний банер — для випадків, коли дані на екрані НЕ
 * повні (список чи сума порахована не з усіх рядків), і мовчати про це
 * гірше, ніж сказати прямо. Використовується там, де сторінка все ще
 * читає капований список (useAllX, SELECT_PAGE_SIZE) замість окремого
 * агрегатного ендпоінта — тимчасове рішення, поки такий ендпоінт не
 * з'явився для цього конкретного списку (дивись коментарі в
 * кожному features/hooks.ts, де це застосовується).
 */
export function Banner({ children }: BannerProps) {
  return <p className="data-warning">{children}</p>
}
