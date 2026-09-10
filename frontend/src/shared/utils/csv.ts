/**
 * Client-side CSV export. List pages only keep one page of rows in
 * React Query's cache, so an export button fetches a full, unpaginated
 * batch on demand (see each feature's `exportAll`-style API call)
 * rather than reusing whatever page happens to be on screen — otherwise
 * "export" would silently mean "export this page only".
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
