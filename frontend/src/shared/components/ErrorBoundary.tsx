import { Component, type ErrorInfo, type ReactNode } from 'react'

interface ErrorBoundaryProps {
  children: ReactNode
  fallback: ReactNode
}

interface ErrorBoundaryState {
  hasError: boolean
}

/**
 * React ловить помилки рендеру лише через класовий компонент —
 * getDerivedStateFromError/componentDidCatch не мають хук-еквівалента.
 * Ловить винятково помилки рендеру дерева children (не обробники подій
 * і не асинхронний код на кшталт useQuery/useMutation — ті вже мають
 * власний try/catch чи isError на місці виклику). Layout.tsx обгортає
 * ним лише <Outlet /> з новим key на кожен маршрут, а не весь застосунок
 * — тому впала сторінка лишає шапку й навігацію робочими: користувач
 * може перейти на іншу вкладку, і зміна маршруту (новий key) сама
 * скидає hasError, коли компонент монтується заново.
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false }

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Помилка рендеру сторінки:', error, info.componentStack)
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback
    }
    return this.props.children
  }
}
