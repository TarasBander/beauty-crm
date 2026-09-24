import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'

export interface SearchSelectOption {
  id: string
  label: string
  sublabel?: string
}

interface SearchSelectProps {
  // Тільки id вибраної опції — компонент сам пам'ятає її лейбл
  // усередині (в selectOption/clear нижче), тож той, хто його
  // використовує, не мусить окремо десь зберігати текст поруч з id.
  // Виняток — скидання ЗЗОВНІ (напр. форма очищена після сабміту): тоді
  // value стає '', і ефект нижче скидає запам'ятований лейбл теж.
  value: string
  onSelect: (option: SearchSelectOption | null) => void
  search: (query: string) => Promise<SearchSelectOption[]>
  placeholder: string
  disabled?: boolean
  required?: boolean
  // Скільки символів треба набрати, перш ніж іти на сервер. 0 — шукати
  // навіть на порожній рядок (корисно, коли пошук уже звужений, напр.
  // угоди одного вже вибраного клієнта — там і порожній запит поверне
  // невеликий, осяжний список).
  minChars?: number
}

/**
 * Комбобокс із пошуком на сервері замість <select> із сотнею
 * захардкоджених опцій. Раніше форми угод/задач/платежів вантажили
 * "практично всіх" клієнтів/угод одним запитом (useAllClients,
 * useAllDeals — ліміт SELECT_PAGE_SIZE = 100) і будували з них
 * <select>. Клієнт №101 у цей список просто не потрапляв — не через
 * помилку, а тому що бекенд ніколи не присилав більше 100 рядків.
 * Тепер список опцій не завантажується наперед узагалі: користувач
 * друкує, компонент (з невеликою затримкою, щоб не бити в мережу на
 * кожну літеру) питає бекенд `GET /clients?search=...` і показує лише
 * те, що реально знайшлося — працює однаково для 10 і для 10 000
 * клієнтів.
 */
export function SearchSelect({
  value,
  onSelect,
  search,
  placeholder,
  disabled,
  required,
  minChars = 2,
}: SearchSelectProps) {
  const { t } = useTranslation()
  const [query, setQuery] = useState('')
  const [label, setLabel] = useState('')
  const [options, setOptions] = useState<SearchSelectOption[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  // Ігноруємо відповідь застарілого запиту, якщо користувач тим часом
  // встиг набрати щось інше — без цього повільна відповідь на "а" могла
  // б перезаписати результати вже введеного "аб".
  const requestId = useRef(0)

  // value скинуто ЗЗОВНІ (форму очищено після сабміту тощо) — прибираємо
  // запам'ятований лейбл, інакше поле показувало б стару назву поруч із
  // насправді порожнім значенням.
  useEffect(() => {
    if (!value) setLabel('')
  }, [value])

  useEffect(() => {
    if (!isOpen) return
    // Замало символів — просто нічого не питаємо; `options` не чистимо
    // тут (це був би ще один setState прямо в ефекті без реальної
    // потреби), рендер нижче й так показує список опцій лише коли
    // довжина запиту достатня.
    if (query.trim().length < minChars) return
    const id = ++requestId.current
    setIsLoading(true)
    const timer = setTimeout(() => {
      search(query.trim())
        .then((results) => {
          if (requestId.current === id) setOptions(results)
        })
        .catch(() => {
          if (requestId.current === id) setOptions([])
        })
        .finally(() => {
          if (requestId.current === id) setIsLoading(false)
        })
    }, 300)
    return () => clearTimeout(timer)
  }, [query, isOpen, minChars, search])

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [])

  const selectOption = (option: SearchSelectOption) => {
    onSelect(option)
    setLabel(option.label)
    setQuery('')
    setIsOpen(false)
  }

  const clear = () => {
    onSelect(null)
    setLabel('')
    setQuery('')
  }

  // Поки є вибір і дропдаун закритий — показуємо його лейбл. Щойно
  // користувач починає друкувати (або відкриває дропдаун), показуємо
  // те, що він друкує, і скидаємо вибір — не можна лишити застарілий id
  // "прив'язаним" до нового тексту пошуку.
  const displayValue = isOpen ? query : value ? label : query

  return (
    <div className="search-select" ref={containerRef}>
      <input
        type="text"
        value={displayValue}
        placeholder={placeholder}
        disabled={disabled}
        required={required && !value}
        onFocus={() => setIsOpen(true)}
        onChange={(e) => {
          setQuery(e.target.value)
          setIsOpen(true)
          if (value) onSelect(null)
        }}
      />
      {value && (
        <button
          type="button"
          className="search-select-clear"
          onClick={clear}
          disabled={disabled}
          aria-label={t('common.clear')}
        >
          ×
        </button>
      )}
      {isOpen && (
        <ul className="search-select-dropdown">
          {isLoading && <li className="search-select-hint">{t('common.searching')}</li>}
          {!isLoading && query.trim().length < minChars && (
            <li className="search-select-hint">{t('common.typeToSearch')}</li>
          )}
          {!isLoading && query.trim().length >= minChars && options.length === 0 && (
            <li className="search-select-hint">{t('common.noResults')}</li>
          )}
          {!isLoading &&
            query.trim().length >= minChars &&
            options.map((option) => (
              <li key={option.id}>
                <button type="button" onClick={() => selectOption(option)}>
                  {option.label}
                  {option.sublabel && <span className="search-select-sublabel">{option.sublabel}</span>}
                </button>
              </li>
            ))}
        </ul>
      )}
    </div>
  )
}
