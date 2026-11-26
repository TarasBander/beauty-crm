interface BeautyIllustrationProps {
  className?: string
}

/**
 * Декоративна ілюстрація: косметологічний апарат з маніпулою, сироватка
 * з піпеткою, флакон з дозатором, баночка крему й гілочка евкаліпта.
 * Кольори задаються класами illu-* (App.css) через CSS-змінні, тож
 * картинка сама перефарбовується у світлій і темній темі.
 */
export function BeautyIllustration({ className }: BeautyIllustrationProps) {
  return (
    <svg
      className={className ? `beauty-illustration ${className}` : 'beauty-illustration'}
      viewBox="0 0 420 330"
      aria-hidden="true"
      focusable="false"
    >
      {/* фонові плями */}
      <circle className="illu-peach-soft" cx="262" cy="168" r="138" />
      <circle className="illu-teal-soft" cx="118" cy="214" r="96" />
      <ellipse className="illu-shadow" cx="212" cy="292" rx="182" ry="11" />

      {/* гілочка евкаліпта */}
      <g className="illu-outline">
        <path className="illu-none" d="M372 292 C 380 236 356 186 380 112" />
        <ellipse className="illu-teal-soft" cx="364" cy="252" rx="13" ry="8" transform="rotate(-30 364 252)" />
        <ellipse className="illu-teal" cx="386" cy="226" rx="13" ry="8" transform="rotate(25 386 226)" />
        <ellipse className="illu-teal-soft" cx="362" cy="196" rx="13" ry="8" transform="rotate(-35 362 196)" />
        <ellipse className="illu-teal" cx="384" cy="164" rx="12" ry="7.5" transform="rotate(30 384 164)" />
        <ellipse className="illu-teal-soft" cx="368" cy="134" rx="11" ry="7" transform="rotate(-30 368 134)" />
      </g>

      {/* косметологічний апарат */}
      <g className="illu-outline">
        <rect className="illu-glass" x="38" y="104" width="124" height="158" rx="20" />
        <rect className="illu-teal-soft" x="56" y="122" width="88" height="56" rx="9" />
        <path className="illu-none illu-accent-line" d="M64 154 h12 l6 -14 l9 26 l8 -18 l6 6 h31" />
        <circle className="illu-peach" cx="74" cy="206" r="9" />
        <circle className="illu-teal" cx="102" cy="206" r="9" />
        <rect className="illu-peach-deep" x="122" y="198" width="24" height="16" rx="5" />
        <rect className="illu-line-soft" x="58" y="228" width="84" height="8" rx="4" />
        <rect className="illu-teal-deep" x="64" y="262" width="72" height="12" rx="5" />
        <circle className="illu-glass" cx="76" cy="284" r="6" />
        <circle className="illu-glass" cx="124" cy="284" r="6" />
        {/* кабель і маніпула */}
        <path className="illu-none" d="M162 182 C 196 182 190 128 172 110" />
        <rect className="illu-peach" x="160" y="52" width="20" height="66" rx="10" transform="rotate(-24 170 85)" />
        <circle className="illu-teal" cx="182" cy="52" r="8" />
      </g>

      {/* баночка крему */}
      <g className="illu-outline">
        <rect className="illu-glass" x="132" y="246" width="78" height="40" rx="11" />
        <rect className="illu-teal-deep" x="126" y="230" width="90" height="22" rx="9" />
        <rect className="illu-peach-soft" x="148" y="260" width="46" height="14" rx="4" />
      </g>

      {/* сироватка з піпеткою */}
      <g className="illu-outline">
        <rect className="illu-peach-deep" x="221" y="104" width="26" height="50" rx="13" />
        <rect className="illu-teal-deep" x="214" y="150" width="40" height="22" rx="5" />
        <rect className="illu-teal" x="202" y="170" width="64" height="116" rx="15" />
        <rect className="illu-glass" x="214" y="222" width="40" height="38" rx="5" />
        <path className="illu-none illu-thin" d="M222 234 h24 M222 244 h16" />
        <rect className="illu-highlight" x="210" y="182" width="7" height="34" rx="3.5" />
      </g>

      {/* флакон з дозатором */}
      <g className="illu-outline">
        <rect className="illu-glass" x="300" y="94" width="30" height="13" rx="4" />
        <rect className="illu-glass" x="326" y="97" width="24" height="7" rx="3.5" />
        <rect className="illu-teal-deep" x="309" y="106" width="12" height="20" rx="3" />
        <rect className="illu-glass" x="300" y="124" width="30" height="26" rx="6" />
        <rect className="illu-peach" x="284" y="148" width="62" height="138" rx="18" />
        <rect className="illu-glass" x="296" y="196" width="38" height="46" rx="6" />
        <circle className="illu-teal-soft" cx="315" cy="212" r="7" />
        <path className="illu-none illu-thin" d="M304 228 h22" />
        <rect className="illu-highlight" x="292" y="160" width="7" height="30" rx="3.5" />
      </g>

      {/* блиски */}
      <path className="illu-sparkle-peach" d="M196 46 l4 10 10 4 -10 4 -4 10 -4 -10 -10 -4 10 -4z" />
      <path className="illu-sparkle-teal" d="M282 62 l3 7 7 3 -7 3 -3 7 -3 -7 -7 -3 7 -3z" />
      <path className="illu-sparkle-teal" d="M28 74 l3 7 7 3 -7 3 -3 7 -3 -7 -7 -3 7 -3z" />
    </svg>
  )
}
