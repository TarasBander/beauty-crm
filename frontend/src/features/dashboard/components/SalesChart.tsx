import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { SalesPeriod, SalesPoint } from '../../analytics/api'
import { useSales } from '../../analytics/hooks'
import { QueryStatus } from '../../../shared/components/QueryStatus'
import { formatMoney, formatMoneyCompact } from '../../../shared/utils/money'

type Metric = 'revenue' | 'newDeals'

const SALES_START_YEAR = 2020

const PERIODS: { key: SalesPeriod; labelKey: string }[] = [
  { key: 'month', labelKey: 'dashboard.sales.byMonth' },
  { key: 'year', labelKey: 'dashboard.sales.byYear' },
]

const METRICS: { key: Metric; labelKey: string }[] = [
  { key: 'revenue', labelKey: 'dashboard.sales.metricRevenue' },
  { key: 'newDeals', labelKey: 'dashboard.sales.metricNewDeals' },
]

function metricValue(point: SalesPoint, metric: Metric): number {
  return metric === 'revenue' ? point.revenue : point.newDealsCount
}

// "Круглі" поділки осі Y: крок 1/2/2.5/5 × 10^k, щоб вийшло ~4 лінії.
// Для кількостей (integer) — лише цілі кроки: "2,5 угоди" не буває.
function niceTicks(max: number, integer: boolean): number[] {
  if (max <= 0) return [0]
  const rough = max / 4
  const magnitude = 10 ** Math.floor(Math.log10(rough))
  const multipliers = integer ? [1, 2, 5, 10] : [1, 2, 2.5, 5, 10]
  const candidate = multipliers.map((m) => m * magnitude).find((s) => s >= rough) ?? rough
  const step = integer ? Math.max(1, Math.ceil(candidate)) : candidate
  const ticks: number[] = []
  for (let v = 0; v < max + step; v += step) ticks.push(v)
  return ticks
}

// 'YYYY-MM' → перше число місяця; 'YYYY' → 1 січня.
function parseKey(key: string): Date {
  const [year, month = 1] = key.split('-').map(Number)
  return new Date(year, month - 1, 1)
}

/**
 * Діаграма продажів: 12 місяців вибраного року або всі роки від 2020.
 * Одна вісь — тому дохід (грн) і кількість нових угод не змішуються, а
 * перемикаються. Наведення / фокус / клік показує всі показники точки в
 * панелі над графіком; ті самі числа є в таблиці під ним. У режимі "по
 * роках" клік на рік відкриває його помісячно.
 */
export function SalesChart() {
  const { t, i18n } = useTranslation()
  const currentYear = new Date().getFullYear()

  const [period, setPeriod] = useState<SalesPeriod>('month')
  const [year, setYear] = useState(currentYear)
  const [metric, setMetric] = useState<Metric>('revenue')
  const [activeKey, setActiveKey] = useState<string | null>(null)

  const salesQuery = useSales(period === 'month' ? { period, year } : { period })
  const report = salesQuery.data
  const points = useMemo(() => report?.points ?? [], [report])
  // Поки вантажиться новий рік/період, лишається попередній графік
  // (placeholderData у useSales) — приглушений, без стрибка розмітки.
  const isStale = salesQuery.isPlaceholderData

  const lang = i18n.language
  const locale = lang.startsWith('uk') ? 'uk-UA' : 'en-US'

  const years = useMemo(() => {
    if (report?.years.length) return report.years
    const list: number[] = []
    for (let y = SALES_START_YEAR; y <= currentYear; y++) list.push(y)
    return list
  }, [report, currentYear])

  const chart = useMemo(() => {
    const values = points.map((p) => metricValue(p, metric))
    const max = Math.max(0, ...values)
    const ticks = niceTicks(max, metric === 'newDeals')
    const top = ticks[ticks.length - 1] || 1
    const best = max > 0 ? points[values.indexOf(max)] : null
    return { values, ticks, top, best }
  }, [points, metric])

  const formatters = useMemo(
    () => ({
      shortMonth: new Intl.DateTimeFormat(locale, { month: 'short' }),
      longMonth: new Intl.DateTimeFormat(locale, { month: 'long', year: 'numeric' }),
      count: new Intl.NumberFormat(locale),
    }),
    [locale],
  )

  const isYearly = report?.period === 'year'
  const formatValue = (value: number) =>
    metric === 'revenue' ? formatMoney(value, lang) : formatters.count.format(value)
  const formatTick = (value: number) =>
    metric === 'revenue' ? formatMoneyCompact(value, lang) : formatters.count.format(value)
  const formatPointLong = (key: string) =>
    isYearly ? t('dashboard.sales.yearLabel', { year: key }) : formatters.longMonth.format(parseKey(key))
  const formatPointShort = (key: string) => (isYearly ? key : formatters.shortMonth.format(parseKey(key)))

  const changePeriod = (next: SalesPeriod) => {
    setPeriod(next)
    setActiveKey(null)
  }
  const changeYear = (next: number) => {
    setYear(next)
    setActiveKey(null)
  }
  const selectPoint = (point: SalesPoint) => {
    if (isYearly) {
      changeYear(Number(point.key))
      changePeriod('month')
    } else {
      setActiveKey(point.key)
    }
  }

  // Панель показує точку під курсором/фокусом, інакше — найкращу,
  // інакше — останню.
  const shown = points.find((p) => p.key === activeKey) ?? chart.best ?? points[points.length - 1]

  return (
    <div className={`sales-chart sales-chart--${isYearly ? 'year' : 'month'}`}>
      <div className="sales-chart-toolbar">
        <div className="sales-chart-filters">
          <div className="task-filter-tabs" role="group" aria-label={t('dashboard.sales.periodLabel')}>
            {PERIODS.map((p) => (
              <button
                key={p.key}
                type="button"
                className={period === p.key ? 'active' : ''}
                aria-pressed={period === p.key}
                onClick={() => changePeriod(p.key)}
              >
                {t(p.labelKey)}
              </button>
            ))}
          </div>

          {period === 'month' && (
            <label className="sales-chart-year">
              <span>{t('dashboard.sales.year')}</span>
              <select value={year} onChange={(e) => changeYear(Number(e.target.value))}>
                {years
                  .slice()
                  .reverse()
                  .map((y) => (
                    <option key={y} value={y}>
                      {y}
                    </option>
                  ))}
              </select>
            </label>
          )}
        </div>

        <div className="task-filter-tabs" role="group" aria-label={t('dashboard.sales.metricLabel')}>
          {METRICS.map((m) => (
            <button
              key={m.key}
              type="button"
              className={metric === m.key ? 'active' : ''}
              aria-pressed={metric === m.key}
              onClick={() => setMetric(m.key)}
            >
              {t(m.labelKey)}
            </button>
          ))}
        </div>
      </div>

      <QueryStatus query={salesQuery} errorFallback={t('dashboard.loadError')}>
        {shown && (
          <div className={isStale ? 'sales-chart-body is-stale' : 'sales-chart-body'} aria-busy={isStale}>
            <p className="sales-chart-best">
              {chart.best ? (
                <>
                  {t(isYearly ? 'dashboard.sales.bestYear' : 'dashboard.sales.bestMonth')}{' '}
                  <strong>{formatPointLong(chart.best.key)}</strong> · {formatValue(metricValue(chart.best, metric))}
                </>
              ) : (
                t('dashboard.sales.empty')
              )}
            </p>

            <div className="sales-chart-readout" aria-live="polite">
              <span className="sales-chart-readout-month">{formatPointLong(shown.key)}</span>
              <span className="sales-chart-readout-item">
                <strong>{formatMoney(shown.revenue, lang)}</strong>
                <span>{t('dashboard.sales.paymentsCount', { count: shown.paymentsCount })}</span>
              </span>
              <span className="sales-chart-readout-item">
                <strong>{t('dashboard.sales.newDealsCount', { count: shown.newDealsCount })}</strong>
                <span>{formatMoney(shown.newDealsAmount, lang)}</span>
              </span>
              {isYearly && <span className="sales-chart-hint">{t('dashboard.sales.drillHint')}</span>}
            </div>

            <div className="sales-chart-plot" onMouseLeave={() => setActiveKey(null)}>
              <div className="sales-chart-grid" aria-hidden="true">
                {chart.ticks.map((tick) => (
                  <div key={tick} className="sales-chart-gridline" style={{ bottom: `${(tick / chart.top) * 100}%` }}>
                    <span>{formatTick(tick)}</span>
                  </div>
                ))}
              </div>

              <div className="sales-chart-columns" style={{ gridTemplateColumns: `repeat(${points.length}, minmax(0, 1fr))` }}>
                {points.map((point, index) => {
                  const value = chart.values[index]
                  const isBest = chart.best?.key === point.key
                  const isActive = shown.key === point.key
                  const label = `${formatPointLong(point.key)}: ${formatValue(value)}`
                  return (
                    <button
                      key={point.key}
                      type="button"
                      className={isActive ? 'sales-chart-col active' : 'sales-chart-col'}
                      aria-label={isYearly ? `${label}. ${t('dashboard.sales.drillHint')}` : label}
                      aria-pressed={isYearly ? undefined : isActive}
                      onMouseEnter={() => setActiveKey(point.key)}
                      onFocus={() => setActiveKey(point.key)}
                      onClick={() => selectPoint(point)}
                    >
                      <span className="sales-chart-bar-area" aria-hidden="true">
                        {isBest && <span className="sales-chart-value">{formatTick(value)}</span>}
                        <span
                          className="sales-chart-bar"
                          style={{ height: value > 0 ? `max(2px, ${(value / chart.top) * 100}%)` : 0 }}
                        />
                      </span>
                      <span className="sales-chart-x" aria-hidden="true">
                        {formatPointShort(point.key)}
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>

            <details className="sales-chart-table">
              <summary>{t('dashboard.sales.showTable')}</summary>
              <div className="table-scroll">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>{t(isYearly ? 'dashboard.sales.tableYear' : 'dashboard.sales.tableMonth')}</th>
                      <th>{t('dashboard.sales.metricRevenue')}</th>
                      <th>{t('dashboard.sales.tablePayments')}</th>
                      <th>{t('dashboard.sales.metricNewDeals')}</th>
                      <th>{t('dashboard.sales.tableNewDealsAmount')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {points.map((point) => (
                      <tr key={point.key}>
                        <td>{formatPointLong(point.key)}</td>
                        <td>{formatMoney(point.revenue, lang)}</td>
                        <td>{point.paymentsCount}</td>
                        <td>{point.newDealsCount}</td>
                        <td>{formatMoney(point.newDealsAmount, lang)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </details>
          </div>
        )}
      </QueryStatus>
    </div>
  )
}
