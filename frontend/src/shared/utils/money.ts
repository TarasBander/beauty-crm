/**
 * Єдине форматування грошових сум для всього застосунку. Раніше кожна
 * сторінка (Deals, Payments, Dashboard, Analytics) мала власну копію цієї
 * функції — і копії розійшлися: дві показували 2 знаки після коми, дві
 * жодного, тож та сама сума виглядала по-різному залежно від сторінки
 * ("1 200 грн" на дашборді проти "1 200,00 грн" в угодах). Тепер формат
 * один: завжди 2 знаки після коми.
 */
export function formatMoney(amount: number, language: string): string {
  const locale = language.startsWith('uk') ? 'uk-UA' : 'en-US'
  const formatted = new Intl.NumberFormat(locale, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)
  return language.startsWith('uk') ? `${formatted} грн` : `${formatted} UAH`
}
