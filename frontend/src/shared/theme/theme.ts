import { useSyncExternalStore } from 'react'

export type Theme = 'light' | 'dark'

export const THEME_STORAGE_KEY = 'crm.theme'

// matchMedia може не існувати (jsdom у тестах) — тоді просто світла тема.
const darkQuery: MediaQueryList | null =
  typeof window.matchMedia === 'function' ? window.matchMedia('(prefers-color-scheme: dark)') : null
const listeners = new Set<() => void>()

function getStoredTheme(): Theme | null {
  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY)
    if (stored === 'light' || stored === 'dark') return stored
  } catch {
    // localStorage недоступний — просто йдемо за системною темою
  }
  return null
}

// Початкове значення вже виставив inline-скрипт в index.html (щоб не було
// "спалаху" світлої теми до завантаження JS) — тут лише читаємо його.
function getInitialTheme(): Theme {
  const fromHtml = document.documentElement.dataset.theme
  if (fromHtml === 'light' || fromHtml === 'dark') return fromHtml
  return getStoredTheme() ?? (darkQuery?.matches ? 'dark' : 'light')
}

let currentTheme: Theme = getInitialTheme()

function applyTheme(theme: Theme) {
  currentTheme = theme
  document.documentElement.dataset.theme = theme
  listeners.forEach((listener) => listener())
}

applyTheme(currentTheme)

// Поки користувач сам не обрав тему кнопкою, тема слідує за системною
// (наприклад, macOS автоматично перемикається ввечері на темну).
darkQuery?.addEventListener('change', (event) => {
  if (!getStoredTheme()) applyTheme(event.matches ? 'dark' : 'light')
})

export function setTheme(theme: Theme) {
  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme)
  } catch {
    // ignore — тема просто не збережеться між перезавантаженнями
  }
  applyTheme(theme)
}

export function toggleTheme() {
  setTheme(currentTheme === 'dark' ? 'light' : 'dark')
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function useTheme(): Theme {
  return useSyncExternalStore(subscribe, () => currentTheme)
}
