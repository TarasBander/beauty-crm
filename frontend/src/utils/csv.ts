/**
 * Client-side CSV export — the data driving every list page is already
 * loaded into React state, so there's no need for a dedicated backend
 * export endpoint: build the CSV in the browser and hand it to the user
 * as a download.
 */
function escapeCell(value: unknown): string {
  const str = value === null || value === undefined ? '' : String(value)
  // Quote whenever the value could otherwise be misread as a delimiter,
  // a newline, or start a new cell — the safe default is to always quote.
  return `"${str.replace(/"/g, '""')}"`
}

export function downloadCsv(filename: string, rows: Record<string, string | number | null>[]) {
  if (rows.length === 0) return

  const headers = Object.keys(rows[0])
  const lines = [
    headers.map(escapeCell).join(','),
    ...rows.map((row) => headers.map((h) => escapeCell(row[h])).join(',')),
  ]
  // Leading BOM so Excel opens Cyrillic text as UTF-8 instead of guessing
  // a legacy codepage and mangling it.
  const csv = '﻿' + lines.join('\r\n')

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
