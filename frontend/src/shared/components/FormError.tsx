import type { ReactNode } from 'react'

interface FormErrorProps {
  children: ReactNode
  /** Дає полю форми (input) через aria-describedby послатись саме на
   * цей текст помилки — див. ChangePasswordPage, де невідповідність
   * паролів прив'язана до конкретного інпуту, а не лишається просто
   * текстом десь на сторінці. */
  id?: string
}

/**
 * Той самий `<p className="form-error">`, який раніше кожна сторінка
 * писала сама — тепер завжди з role="alert". Це aria-live="assertive" +
 * aria-atomic="true" "з коробки": скрінрідер сам оголошує текст щойно
 * він з'являється в DOM (наприклад "Не вдалося створити клієнта"),
 * замість того, щоб чекати, поки користувач випадково натрапить на
 * нього фокусом чи навігацією по сторінці.
 */
export function FormError({ children, id }: FormErrorProps) {
  return (
    <p className="form-error" role="alert" id={id}>
      {children}
    </p>
  )
}
