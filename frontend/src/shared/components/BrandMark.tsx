// Знак бренду: крапля сироватки в колі кольору морської хвилі.
export function BrandMark() {
  return (
    <svg className="brand-mark" viewBox="0 0 32 32" aria-hidden="true" focusable="false">
      <circle cx="16" cy="16" r="15" className="brand-mark-bg" />
      <path
        className="brand-mark-drop"
        d="M16 6c4.5 5.6 7 9.4 7 12.6A7 7 0 0 1 9 18.6C9 15.4 11.5 11.6 16 6z"
      />
      <path className="brand-mark-shine" d="M13 19.5a3.2 3.2 0 0 0 3 3" />
    </svg>
  )
}
